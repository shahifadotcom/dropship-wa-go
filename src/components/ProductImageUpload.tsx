import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProductImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export const ProductImageUpload = ({ 
  images, 
  onImagesChange, 
  maxImages = 5 
}: ProductImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;
    
    const newFiles = Array.from(files);
    if (images.length + newFiles.length > maxImages) {
      toast({
        title: "Too many images",
        description: `Maximum ${maxImages} images allowed`,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(new Array(newFiles.length).fill(0));
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid file type",
            description: "Please upload only image files",
            variant: "destructive"
          });
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: "Please upload images smaller than 5MB",
            variant: "destructive"
          });
          continue;
        }

        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${file.name}`;
        
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Upload error:', error);
          toast({
            title: "Upload failed",
            description: error.message,
            variant: "destructive"
          });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(data.path);

        uploadedUrls.push(urlData.publicUrl);
        
        // Update progress
        setUploadProgress(prev => {
          const newProgress = [...prev];
          newProgress[i] = 100;
          return newProgress;
        });
      }

      if (uploadedUrls.length > 0) {
        onImagesChange([...images, ...uploadedUrls]);
        toast({
          title: "Success",
          description: `${uploadedUrls.length} image(s) uploaded successfully`
        });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const addImageUrl = (url: string) => {
    if (images.length >= maxImages) {
      toast({
        title: "Maximum images reached",
        description: `You can only add ${maxImages} images`,
        variant: "destructive"
      });
      return;
    }
    
    if (url.trim() && !images.includes(url.trim())) {
      onImagesChange([...images, url.trim()]);
    }
  };

  return (
    <div className="space-y-4">
      <Label>Product Images ({images.length}/{maxImages})</Label>
      
      {/* File Upload */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
          disabled={uploading || images.length >= maxImages}
        />
        
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-sm text-gray-600 mb-2">
          Drop images here or click to browse
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || images.length >= maxImages}
        >
          {uploading ? 'Uploading...' : 'Choose Files'}
        </Button>
        <p className="text-xs text-gray-500 mt-2">
          Max 5MB per image, JPG/PNG/WebP only
        </p>
      </div>

      {/* URL Input */}
      <div className="flex gap-2">
        <Input
          placeholder="Or paste image URL"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addImageUrl(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
          disabled={images.length >= maxImages}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => {
            const input = document.querySelector<HTMLInputElement>('input[placeholder="Or paste image URL"]');
            if (input && input.value) {
              addImageUrl(input.value);
              input.value = '';
            }
          }}
          disabled={images.length >= maxImages}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Image Preview */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {images.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Product image ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {uploading && uploadProgress.length > 0 && (
        <div className="space-y-2">
          {uploadProgress.map((progress, index) => (
            <div key={index} className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};