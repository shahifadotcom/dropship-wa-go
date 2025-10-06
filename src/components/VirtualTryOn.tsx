import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface VirtualTryOnProps {
  productId: string;
  productImage: string;
  productName: string;
}

export const VirtualTryOn = ({ productId, productImage, productName }: VirtualTryOnProps) => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `virtual-trial/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      setUserImage(publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleVirtualTryOn = async () => {
    if (!userImage) {
      toast.error('Please upload your photo first');
      return;
    }

    setProcessing(true);
    setResultImage(null);

    try {
      // Call the edge function
      const { data, error } = await supabase.functions.invoke('virtual-tryon', {
        body: {
          productId,
          productImage,
          userImage,
        },
      });

      if (error) {
        // Check if the error response has a JSON body with error message
        const errorMessage = error.message || data?.error || 'Failed to process virtual try-on';
        throw new Error(errorMessage);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to process virtual try-on');
      }

      setSessionId(data.sessionId);
      setResultImage(data.resultImage);
      toast.success('Virtual try-on complete!');
    } catch (error: any) {
      console.error('Virtual try-on error:', error);
      toast.error(error.message || 'Failed to process virtual try-on');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="w-full"
      >
        <Sparkles className="mr-2 h-4 w-4" />
        Try It On Virtually
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Virtual Try-On: {productName}
            </DialogTitle>
            <DialogDescription>
              Upload your photo to see how this product looks on you using AI
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Upload Section */}
            <div className="space-y-4">
              <div>
                <label htmlFor="photo-upload" className="block text-sm font-medium mb-2">
                  Upload Your Photo
                </label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  {!userImage ? (
                    <div className="space-y-2">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">
                        <label
                          htmlFor="photo-upload"
                          className="relative cursor-pointer rounded-md font-semibold text-primary hover:text-primary/80"
                        >
                          <span>Upload a photo</span>
                          <input
                            id="photo-upload"
                            name="photo-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleFileUpload}
                            disabled={uploading}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, WEBP up to 5MB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <img
                        src={userImage}
                        alt="Your photo"
                        className="mx-auto max-h-64 rounded-lg"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUserImage(null)}
                      >
                        Change Photo
                      </Button>
                    </div>
                  )}
                </div>
                {uploading && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Uploading...
                  </p>
                )}
              </div>

              <Button
                onClick={handleVirtualTryOn}
                disabled={!userImage || processing || uploading}
                className="w-full"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Virtual Try-On
                  </>
                )}
              </Button>
            </div>

            {/* Result Section */}
            {resultImage && (
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Result</h3>
                  <img
                    src={resultImage}
                    alt="Virtual try-on result"
                    className="w-full rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-semibold mb-2">Tips for best results:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Use a clear, well-lit photo facing the camera</li>
                <li>Wear fitted clothing to show your body shape</li>
                <li>Stand in a neutral pose with arms slightly away from body</li>
                <li>Avoid busy backgrounds</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};