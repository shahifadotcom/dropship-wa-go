import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Edit, Trash, Sparkles } from 'lucide-react';
import { SingleImageUpload } from '@/components/SingleImageUpload';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  status: string;
  meta_title: string | null;
  meta_description: string | null;
  social_preview_image: string | null;
  tags: string[] | null;
  created_at: string;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featured_image: '',
    status: 'draft',
    meta_title: '',
    meta_description: '',
    social_preview_image: '',
    tags: '',
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      toast({ title: 'Error loading posts', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleGenerateContent = async () => {
    if (!formData.title) {
      toast({ title: 'Please enter a title first', variant: 'destructive' });
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-content', {
        body: {
          topic: formData.title,
          keywords: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
          type: 'blog'
        }
      });

      if (error) throw error;

      setFormData(prev => ({
        ...prev,
        content: data.content || prev.content,
        excerpt: data.excerpt || prev.excerpt,
        meta_title: data.metaTitle || prev.meta_title,
        meta_description: data.metaDescription || prev.meta_description,
        tags: data.tags ? data.tags.join(', ') : prev.tags,
      }));

      toast({ title: 'Content generated successfully!' });
    } catch (error: any) {
      toast({ title: 'Error generating content', description: error.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const postData = {
        ...formData,
        slug: formData.slug || generateSlug(formData.title),
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        author_id: (await supabase.auth.getUser()).data.user?.id,
        published_at: formData.status === 'published' ? new Date().toISOString() : null,
      };

      if (editingPost) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', editingPost.id);

        if (error) throw error;
        toast({ title: 'Post updated successfully!' });
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert([postData]);

        if (error) throw error;
        toast({ title: 'Post created successfully!' });
      }

      setShowForm(false);
      setEditingPost(null);
      resetForm();
      fetchPosts();
    } catch (error: any) {
      toast({ title: 'Error saving post', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Post deleted successfully!' });
      fetchPosts();
    } catch (error: any) {
      toast({ title: 'Error deleting post', description: error.message, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      featured_image: '',
      status: 'draft',
      meta_title: '',
      meta_description: '',
      social_preview_image: '',
      tags: '',
    });
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || '',
      featured_image: post.featured_image || '',
      status: post.status,
      meta_title: post.meta_title || '',
      meta_description: post.meta_description || '',
      social_preview_image: post.social_preview_image || '',
      tags: post.tags?.join(', ') || '',
    });
    setShowForm(true);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Blog Management</h1>
          <Button onClick={() => { setShowForm(true); resetForm(); setEditingPost(null); }}>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>

        {showForm ? (
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="content">
                <TabsList>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="seo">SEO</TabsTrigger>
                  <TabsTrigger value="images">Images</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4">
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <Label>Title *</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="button" onClick={handleGenerateContent} disabled={generating}>
                      {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                      Generate with AI
                    </Button>
                  </div>

                  <div>
                    <Label>Slug</Label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="auto-generated-from-title"
                    />
                  </div>

                  <div>
                    <Label>Excerpt</Label>
                    <Textarea
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Content *</Label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={15}
                      required
                    />
                  </div>

                  <div>
                    <Label>Tags (comma-separated)</Label>
                    <Input
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="technology, AI, innovation"
                    />
                  </div>

                  <div>
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="seo" className="space-y-4">
                  <div>
                    <Label>Meta Title</Label>
                    <Input
                      value={formData.meta_title}
                      onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                      maxLength={60}
                    />
                    <p className="text-sm text-muted-foreground mt-1">{formData.meta_title.length}/60 characters</p>
                  </div>

                  <div>
                    <Label>Meta Description</Label>
                    <Textarea
                      value={formData.meta_description}
                      onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                      rows={3}
                      maxLength={160}
                    />
                    <p className="text-sm text-muted-foreground mt-1">{formData.meta_description.length}/160 characters</p>
                  </div>
                </TabsContent>

                <TabsContent value="images" className="space-y-4">
                  <div>
                    <Label>Featured Image</Label>
                    <SingleImageUpload
                      currentImage={formData.featured_image}
                      onImageUpload={(url) => setFormData({ ...formData, featured_image: url })}
                    />
                  </div>

                  <div>
                    <Label>Social Preview Image</Label>
                    <SingleImageUpload
                      currentImage={formData.social_preview_image}
                      onImageUpload={(url) => setFormData({ ...formData, social_preview_image: url })}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-4">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {editingPost ? 'Update Post' : 'Create Post'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingPost(null); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        ) : (
          <div className="grid gap-4">
            {posts.map((post) => (
              <Card key={post.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{post.title}</h3>
                    <p className="text-muted-foreground mt-1">{post.excerpt}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="capitalize">{post.status}</span>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      {post.tags && <span>{post.tags.join(', ')}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(post)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(post.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}