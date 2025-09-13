import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Plus, 
  Settings, 
  Download, 
  RefreshCw, 
  Eye, 
  Trash2, 
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { 
  cjDropshippingService, 
  type CJDropshippingConnection, 
  type CJProduct, 
  type CJImportJob 
} from '@/services/cjDropshippingService';

export default function CJDropshipping() {
  const [connections, setConnections] = useState<CJDropshippingConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<CJDropshippingConnection | null>(null);
  const [products, setProducts] = useState<CJProduct[]>([]);
  const [importJobs, setImportJobs] = useState<CJImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showAddConnection, setShowAddConnection] = useState(false);
  const [newConnection, setNewConnection] = useState({
    domain: '',
    client_id: '',
    client_secret: ''
  });

  useEffect(() => {
    loadConnections();
    loadImportJobs();
  }, []);

  const loadConnections = async () => {
    try {
      const data = await cjDropshippingService.getConnections();
      setConnections(data);
      if (data.length > 0 && !selectedConnection) {
        setSelectedConnection(data[0]);
      }
    } catch (error) {
      toast.error('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const loadImportJobs = async () => {
    try {
      const jobs = await cjDropshippingService.getImportJobs();
      setImportJobs(jobs);
    } catch (error) {
      console.error('Failed to load import jobs:', error);
    }
  };

  const handleCreateConnection = async () => {
    if (!newConnection.domain || !newConnection.client_id || !newConnection.client_secret) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      const connection = await cjDropshippingService.createConnection(newConnection);
      if (connection) {
        toast.success('Connection created successfully');
        setConnections([connection, ...connections]);
        setShowAddConnection(false);
        setNewConnection({ domain: '', client_id: '', client_secret: '' });
      } else {
        toast.error('Failed to create connection');
      }
    } catch (error) {
      toast.error('Failed to create connection');
    }
  };

  const handleAuthorize = async (connection: CJDropshippingConnection) => {
    try {
      const authUrl = await cjDropshippingService.initiateOAuth(connection.id);
      if (authUrl) {
        window.open(authUrl, '_blank');
        toast.success('Authorization window opened. Complete the process and refresh.');
      } else {
        toast.error('Failed to initiate authorization');
      }
    } catch (error) {
      toast.error('Authorization failed');
    }
  };

  const handleSearchProducts = async () => {
    if (!selectedConnection) return;

    setSearchLoading(true);
    try {
      const result = await cjDropshippingService.searchProducts(selectedConnection.id, {
        keyword: searchQuery,
        page: 1,
        pageSize: 20
      });

      if (result) {
        setProducts(result.products);
        toast.success(`Found ${result.total} products`);
      } else {
        toast.error('Failed to search products');
      }
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleImportSelected = async () => {
    if (!selectedConnection || selectedProducts.size === 0) return;

    try {
      const jobId = await cjDropshippingService.importProducts(
        selectedConnection.id,
        Array.from(selectedProducts),
        {
          priceMultiplier: 1.5,
          autoPublish: false
        }
      );

      if (jobId) {
        toast.success('Import job started');
        setSelectedProducts(new Set());
        loadImportJobs();
      } else {
        toast.error('Failed to start import');
      }
    } catch (error) {
      toast.error('Import failed');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CJ Dropshipping Integration</h1>
          <p className="text-muted-foreground">
            Connect to CJ Dropshipping and import products directly to your store
          </p>
        </div>
        <Dialog open={showAddConnection} onOpenChange={setShowAddConnection}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Connection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add CJ Dropshipping Connection</DialogTitle>
              <DialogDescription>
                Enter your CJ Dropshipping API credentials to create a new connection
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  placeholder="yourdomain.com"
                  value={newConnection.domain}
                  onChange={(e) => setNewConnection({ ...newConnection, domain: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="client_id">Client ID</Label>
                <Input
                  id="client_id"
                  value={newConnection.client_id}
                  onChange={(e) => setNewConnection({ ...newConnection, client_id: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="client_secret">Client Secret</Label>
                <Input
                  id="client_secret"
                  type="password"
                  value={newConnection.client_secret}
                  onChange={(e) => setNewConnection({ ...newConnection, client_secret: e.target.value })}
                />
              </div>
              <Button onClick={handleCreateConnection} className="w-full">
                Create Connection
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="connections" className="space-y-6">
        <TabsList>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="products">Product Browser</TabsTrigger>
          <TabsTrigger value="imports">Import Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4">
          {connections.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Connections</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first CJ Dropshipping connection to get started
                  </p>
                  <Button onClick={() => setShowAddConnection(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Connection
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {connections.map((connection) => (
                <Card key={connection.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {connection.domain}
                          <Badge variant={connection.is_active ? 'default' : 'secondary'}>
                            {connection.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Created: {new Date(connection.created_at).toLocaleDateString()}
                          {connection.last_sync_at && (
                            <span className="ml-4">
                              Last sync: {new Date(connection.last_sync_at).toLocaleDateString()}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {!connection.access_token ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAuthorize(connection)}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Authorize
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedConnection(connection)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Manage
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Client ID</p>
                        <p className="font-mono">{connection.client_id.slice(0, 8)}...</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p>{connection.access_token ? 'Authorized' : 'Not Authorized'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Token Expires</p>
                        <p>
                          {connection.token_expires_at
                            ? new Date(connection.token_expires_at).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          {!selectedConnection?.access_token ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please authorize a connection first to browse products.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Product Search</CardTitle>
                  <CardDescription>
                    Search and browse CJ Dropshipping products
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearchProducts()}
                    />
                    <Button onClick={handleSearchProducts} disabled={searchLoading}>
                      {searchLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        'Search'
                      )}
                    </Button>
                  </div>
                  {selectedProducts.size > 0 && (
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {selectedProducts.size} products selected
                      </p>
                      <Button onClick={handleImportSelected}>
                        <Download className="h-4 w-4 mr-2" />
                        Import Selected
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {products.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {products.map((product) => (
                    <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedProducts.has(product.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedProducts);
                              if (e.target.checked) {
                                newSelected.add(product.id);
                              } else {
                                newSelected.delete(product.id);
                              }
                              setSelectedProducts(newSelected);
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <img
                              src={product.productMainPicture}
                              alt={product.productName}
                              className="w-full h-32 object-cover rounded mb-2"
                            />
                            <h3 className="font-semibold truncate">{product.productName}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              SKU: {product.productSku}
                            </p>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-bold">${product.sellPrice}</p>
                                {product.originalPrice > product.sellPrice && (
                                  <p className="text-sm text-muted-foreground line-through">
                                    ${product.originalPrice}
                                  </p>
                                )}
                              </div>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="imports" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Import Jobs</CardTitle>
                  <CardDescription>
                    Track your product import progress
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={loadImportJobs}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {importJobs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No import jobs yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {importJobs.map((job) => (
                    <div key={job.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          <span className="font-semibold">{job.job_type}</span>
                          <Badge className={getStatusColor(job.status)}>
                            {job.status}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(job.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      {job.total_items > 0 && (
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{job.processed_items}/{job.total_items}</span>
                          </div>
                          <Progress 
                            value={(job.processed_items / job.total_items) * 100} 
                            className="h-2"
                          />
                        </div>
                      )}

                      {job.error_log && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{job.error_log}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}