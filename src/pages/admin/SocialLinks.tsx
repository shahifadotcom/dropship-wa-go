import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminLayout from "@/layouts/AdminLayout";

interface SocialLink {
  id: string;
  name: string;
  platform: string;
  url: string;
  is_active: boolean;
  display_order: number;
}

const SocialLinks = () => {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const platforms = [
    { value: 'facebook', label: 'Facebook' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'twitter', label: 'Twitter' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'pinterest', label: 'Pinterest' },
  ];

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('social_links')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error fetching social links:', error);
      toast({
        title: "Error",
        description: "Failed to load social links",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      const newOrder = Math.max(...links.map(l => l.display_order), 0) + 1;
      const { error } = await supabase
        .from('social_links')
        .insert({
          name: 'New Link',
          platform: 'facebook',
          url: 'https://facebook.com/yourstore',
          is_active: true,
          display_order: newOrder,
        });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Social link added successfully",
      });
      
      fetchLinks();
    } catch (error) {
      console.error('Error adding social link:', error);
      toast({
        title: "Error",
        description: "Failed to add social link",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (id: string, updates: Partial<SocialLink>) => {
    try {
      const { error } = await supabase
        .from('social_links')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      setLinks(links.map(link => 
        link.id === id ? { ...link, ...updates } : link
      ));
    } catch (error) {
      console.error('Error updating social link:', error);
      toast({
        title: "Error",
        description: "Failed to update social link",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('social_links')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Social link deleted successfully",
      });
      
      fetchLinks();
    } catch (error) {
      console.error('Error deleting social link:', error);
      toast({
        title: "Error",
        description: "Failed to delete social link",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Social Media Links</h1>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Link
          </Button>
        </div>

        <div className="grid gap-4">
          {links.map((link) => (
            <Card key={link.id}>
              <CardContent className="pt-6">
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={link.name}
                        onChange={(e) => handleUpdate(link.id, { name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Platform</Label>
                      <Select
                        value={link.platform}
                        onValueChange={(value) => handleUpdate(link.id, { platform: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {platforms.map((platform) => (
                            <SelectItem key={platform.value} value={platform.value}>
                              {platform.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>URL</Label>
                      <Input
                        value={link.url}
                        onChange={(e) => handleUpdate(link.id, { url: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Display Order</Label>
                      <Input
                        type="number"
                        value={link.display_order}
                        onChange={(e) => handleUpdate(link.id, { display_order: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={link.is_active}
                        onCheckedChange={(checked) => handleUpdate(link.id, { is_active: checked })}
                      />
                      <Label>Active</Label>
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(link.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default SocialLinks;
