import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProductReviewProps {
  productId: string;
  productSlug?: string;
}

interface Review {
  id: string;
  user_name: string | null;
  rating: number;
  comment: string;
  created_at: string;
  review_images: string[];
}

export const ProductReview = ({ productId, productSlug }: ProductReviewProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // Load reviews on mount
  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('id, user_name, rating, comment, created_at, review_images')
        .eq('product_id', productId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews((data || []) as Review[]);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to submit a review',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (rating === 0) {
      toast({
        title: 'Rating Required',
        description: 'Please select a rating',
        variant: 'destructive',
      });
      return;
    }

    if (!comment.trim()) {
      toast({
        title: 'Comment Required',
        description: 'Please write a comment',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      // Get user profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .maybeSingle();

      const userName = profile 
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Anonymous'
        : 'Anonymous';

      const { error } = await supabase.from('product_reviews').insert({
        product_id: productId,
        user_id: user.id,
        user_name: userName,
        rating,
        comment: comment.trim(),
        review_images: uploadedImages,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Your review has been submitted and is pending approval',
      });

      setRating(0);
      setComment('');
      setUploadedImages([]);
      loadReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit review',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Customer Reviews</h2>

      {/* Submit Review Form */}
      <div className="border rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">Write a Review</h3>
        
        {/* Star Rating */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Your Rating:</span>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none"
              >
                <Star
                  className={`h-6 w-6 ${
                    star <= (hoverRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <Textarea
          placeholder="Share your experience with this product..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="w-full"
        />

        {/* Image Upload */}
        <div className="space-y-2">
          <Label>Add Images (Optional)</Label>
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={async (e) => {
              const files = e.target.files;
              if (!files || files.length === 0) return;

              const uploadedUrls: string[] = [];

              for (const file of Array.from(files)) {
                try {
                  const fileExt = file.name.split('.').pop();
                  const fileName = `review-${Date.now()}-${Math.random()}.${fileExt}`;

                  const { error: uploadError } = await supabase.storage
                    .from('review-images')
                    .upload(fileName, file);

                  if (uploadError) throw uploadError;

                  const { data: { publicUrl } } = supabase.storage
                    .from('review-images')
                    .getPublicUrl(fileName);

                  uploadedUrls.push(publicUrl);
                } catch (error) {
                  console.error('Error uploading image:', error);
                  toast({
                    title: 'Upload Error',
                    description: 'Failed to upload image',
                    variant: 'destructive'
                  });
                }
              }

              if (uploadedUrls.length > 0) {
                setUploadedImages(prev => [...prev, ...uploadedUrls]);
                toast({
                  title: 'Images Uploaded',
                  description: `${uploadedUrls.length} image(s) ready to submit with review`
                });
              }
            }}
          />
          {uploadedImages.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-2">
              {uploadedImages.map((url, idx) => (
                <img key={idx} src={url} alt={`Upload ${idx + 1}`} className="w-20 h-20 object-cover rounded" />
              ))}
            </div>
          )}
        </div>

        <Button onClick={handleSubmitReview} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loadingReviews ? (
          <div className="text-center py-4">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No reviews yet. Be the first to review this product!
          </p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{review.user_name || 'Anonymous'}</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm">{review.comment}</p>
              
              {review.review_images && review.review_images.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {review.review_images.map((url, idx) => (
                    <img key={idx} src={url} alt={`Review image ${idx + 1}`} className="w-20 h-20 object-cover rounded" />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
