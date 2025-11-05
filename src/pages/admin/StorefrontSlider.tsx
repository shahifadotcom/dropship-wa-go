import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Plus, Edit, Trash2, Eye, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SingleImageUpload } from "@/components/SingleImageUpload";

interface StorefrontSlider {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  link_url?: string;
  button_text?: string;
  display_order: number;
  is_active: boolean;
  country_id?: string;
  created_at: string;
  updated_at: string;
}

interface Country {
  id: string;
  name: string;
  code: string;
}

const StorefrontSlider = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [countries, setCountries] = useState<Country[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlider, setEditingSlider] = useState<StorefrontSlider | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    image_url: "",
    link_url: "",
    button_text: "",
    display_order: 0,
    is_active: true,
    country_id: "",
  });

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCountries(data || []);
    } catch (error) {
      console.error('Error loading countries:', error);
      toast({
        title: "Error",
        description: "Failed to load countries",
        variant: "destructive",
      });
    }
  };

  // Fetch sliders
  const { data: sliders = [], isLoading } = useQuery({
    queryKey: ["storefront-sliders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("storefront_sliders")
        .select(`
          *,
          countries (
            name,
            code
          )
        `)
        .order("display_order");
      
      if (error) throw error;
      return data as StorefrontSlider[];
    },
  });

  // Create/Update mutation
  const saveSliderMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const sliderData = {
        ...data,
        country_id: data.country_id || null,
      };

      if (editingSlider) {
        const { error } = await supabase
          .from("storefront_sliders")
          .update(sliderData)
          .eq("id", editingSlider.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("storefront_sliders")
          .insert([sliderData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storefront-sliders"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: `Slider ${editingSlider ? 'updated' : 'created'} successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${editingSlider ? 'update' : 'create'} slider: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteSliderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("storefront_sliders")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storefront-sliders"] });
      toast({
        title: "Success",
        description: "Slider deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete slider: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("storefront_sliders")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storefront-sliders"] });
      toast({
        title: "Success",
        description: "Slider status updated",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      image_url: "",
      link_url: "",
      button_text: "",
      display_order: sliders.length,
      is_active: true,
      country_id: "",
    });
    setEditingSlider(null);
  };

  const openEditDialog = (slider: StorefrontSlider) => {
    setEditingSlider(slider);
    setFormData({
      title: slider.title,
      subtitle: slider.subtitle || "",
      image_url: slider.image_url,
      link_url: slider.link_url || "",
      button_text: slider.button_text || "",
      display_order: slider.display_order,
      is_active: slider.is_active,
      country_id: slider.country_id || "",
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url) {
      toast({
        title: "Error",
        description: "Image is required",
        variant: "destructive",
      });
      return;
    }
    saveSliderMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Storefront Image Slider</h1>
          <p className="text-muted-foreground">
            Manage your homepage hero slider images and content
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Slide
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSlider ? "Edit Slide" : "Create New Slide"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country (Optional)</Label>
                <select
                  id="country"
                  value={formData.country_id}
                  onChange={(e) => setFormData({ ...formData, country_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="">All Countries</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Leave empty to show this slide to all countries
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Slide title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                    min="0"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Textarea
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Optional subtitle"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Slide Image *</Label>
                <SingleImageUpload
                  onImageUpload={(url) => setFormData({ ...formData, image_url: url })}
                  currentImage={formData.image_url}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="link_url">Link URL</Label>
                  <Input
                    id="link_url"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="button_text">Button Text</Label>
                  <Input
                    id="button_text"
                    value={formData.button_text}
                    onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                    placeholder="Shop Now"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saveSliderMutation.isPending}>
                  {saveSliderMutation.isPending ? "Saving..." : editingSlider ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {sliders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No slides yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first slide to showcase your products and promotions
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Slide
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sliders.map((slider) => (
            <Card key={slider.id} className="overflow-hidden">
              <div className="relative h-56 md:h-64 lg:h-72 overflow-hidden bg-card">
                <img
                  src={slider.image_url}
                  alt={slider.title || "Slider image"}
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute top-2 right-2 flex gap-2 flex-wrap">
                  <Badge variant={slider.is_active ? "default" : "secondary"}>
                    {slider.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline">#{slider.display_order}</Badge>
                </div>
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-1 line-clamp-1">{slider.title}</h3>
                {slider.subtitle && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {slider.subtitle}
                  </p>
                )}
                {slider.button_text && slider.link_url && (
                  <p className="text-xs text-primary mb-3">
                    {slider.button_text} → {slider.link_url}
                  </p>
                )}
                
                <div className="space-y-2">
                  {slider.country_id && (
                    <Badge variant="outline" className="mb-1">
                      {(slider as any).countries?.name || 'Country'}
                    </Badge>
                  )}
                  {!slider.country_id && (
                    <Badge variant="secondary" className="mb-1">
                      All Countries
                    </Badge>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={slider.is_active}
                        onCheckedChange={(checked) =>
                          toggleActiveMutation.mutate({ id: slider.id, is_active: checked })
                        }
                        disabled={toggleActiveMutation.isPending}
                      />
                      <Label className="text-sm">Active</Label>
                    </div>
                    
                    <div className="flex gap-1">
                      {slider.link_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(slider.link_url, '_blank')}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(slider)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteSliderMutation.mutate(slider.id)}
                        disabled={deleteSliderMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StorefrontSlider;