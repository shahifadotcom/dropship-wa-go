import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Bell, Send } from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { Badge } from '@/components/ui/badge';

interface NotificationTemplate {
  id: string;
  name: string;
  template: string;
  created_at: string;
  updated_at: string;
}

interface NotificationLog {
  id: string;
  phone_number: string;
  message: string;
  status: string;
  sent_at: string;
  order_id?: string;
}

const Notifications = () => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    template: ''
  });
  const [testMessage, setTestMessage] = useState({
    phone: '',
    message: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch notification templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('notification_templates')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch recent notification logs
      const { data: logsData, error: logsError } = await supabase
        .from('notification_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(50);

      if (templatesError) throw templatesError;
      if (logsError) throw logsError;

      setTemplates(templatesData || []);
      setLogs(logsData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch notification data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.template) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('notification_templates')
          .update({
            name: formData.name,
            template: formData.template
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Template updated successfully"
        });
      } else {
        // Create new template
        const { error } = await supabase
          .from('notification_templates')
          .insert({
            name: formData.name,
            template: formData.template
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Template created successfully"
        });
      }

      setIsDialogOpen(false);
      setEditingTemplate(null);
      setFormData({ name: '', template: '' });
      fetchData();
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      template: template.template
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('notification_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template deleted successfully"
      });
      
      fetchData();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive"
      });
    }
  };

  const sendTestMessage = async () => {
    if (!testMessage.phone || !testMessage.message) {
      toast({
        title: "Error",
        description: "Please enter both phone number and message",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('whatsapp-web-integration', {
        body: {
          action: 'send_message',
          phoneNumber: testMessage.phone,
          message: testMessage.message
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Test message sent successfully"
      });

      setTestMessage({ phone: '', message: '' });
      fetchData(); // Refresh logs
    } catch (error: any) {
      console.error('Error sending test message:', error);
      toast({
        title: "Error",
        description: "Failed to send test message",
        variant: "destructive"
      });
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Bell className="h-8 w-8" />
                Notifications Management
              </h1>
              <p className="text-muted-foreground">
                Manage notification templates and monitor message delivery
              </p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingTemplate(null);
                  setFormData({ name: '', template: '' });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? 'Edit Template' : 'Add New Template'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Template Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Order Confirmation"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="template">Message Template *</Label>
                    <Textarea
                      id="template"
                      value={formData.template}
                      onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                      placeholder="Your order #{order_number} has been confirmed. Thank you for shopping with us!"
                      rows={5}
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Use variables like {'{order_number}'}, {'{customer_name}'}, {'{total_amount}'} in your template
                    </p>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingTemplate ? 'Update' : 'Create'} Template
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Templates</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : templates.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No templates created yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {templates.map((template) => (
                      <div key={template.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{template.name}</h4>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(template)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(template.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                          {template.template}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Test Message */}
            <Card>
              <CardHeader>
                <CardTitle>Send Test Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="test_phone">Phone Number</Label>
                  <Input
                    id="test_phone"
                    value={testMessage.phone}
                    onChange={(e) => setTestMessage({ ...testMessage, phone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <Label htmlFor="test_message">Message</Label>
                  <Textarea
                    id="test_message"
                    value={testMessage.message}
                    onChange={(e) => setTestMessage({ ...testMessage, message: e.target.value })}
                    placeholder="Test message content"
                    rows={3}
                  />
                </div>
                <Button onClick={sendTestMessage} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Message
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Notification Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Message Preview</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent At</TableHead>
                      <TableHead>Order ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No notifications sent yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono">{log.phone_number}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {log.message}
                          </TableCell>
                          <TableCell>
                            <Badge variant={log.status === 'sent' ? "default" : "destructive"}>
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(log.sent_at).toLocaleString()}</TableCell>
                          <TableCell>
                            {log.order_id ? (
                              <span className="font-mono text-sm">{log.order_id.slice(0, 8)}...</span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Notifications;