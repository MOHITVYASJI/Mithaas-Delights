import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Star, Heart, ShoppingCart, ChevronLeft, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../App';
import { TrustBadges } from '../components/TrustBadges';
import { SecurePaymentBadges } from '../components/SecurePaymentBadges';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const ProductDetailPage = ({ Header, Footer }) => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${API}/products/${productId}`);
      setProduct(response.data);
      if (response.data.variants && response.data.variants.length > 0) {
        setSelectedVariant(response.data.variants[0]);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API}/reviews/${productId}`);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleAddToCart = () => {
    if (product.is_sold_out) {
      toast.error('This product is currently out of stock');
      return;
    }

    if (!selectedVariant) {
      toast.error('Please select a variant');
      return;
    }
    
    const cartProduct = {
      ...product,
      price: selectedVariant.price,
      weight: selectedVariant.weight,
      variant: selectedVariant
    };
    
    addToCart(cartProduct, quantity);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please login to submit a review');
      return;
    }

    if (!reviewComment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    setSubmittingReview(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/reviews`,
        {
          product_id: productId,
          user_id: user.id,
          user_name: user.name,
          rating: reviewRating,
          comment: reviewComment
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      toast.success('Review submitted successfully! It will be visible after admin approval.');
      setReviewComment('');
      setReviewRating(5);
      setShowReviewForm(false);
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating, interactive = false, onRate = null) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? 'fill-amber-400 text-amber-400'
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:fill-amber-300 hover:text-amber-300' : ''}`}
            onClick={() => interactive && onRate && onRate(star)}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Product Not Found</h2>
            <Button onClick={() => navigate('/')}>Go Back Home</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Product Details */}
        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          {/* Product Images */}
          <div>
            <div className="relative rounded-2xl overflow-hidden shadow-lg mb-4">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-96 object-cover"
              />
              {product.discount_percentage && (
                <Badge className="absolute top-4 right-4 bg-red-500 text-white text-lg px-3 py-1">
                  {product.discount_percentage}% OFF
                </Badge>
              )}
              {product.is_sold_out && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Badge className="bg-red-600 text-white text-xl px-6 py-2">
                    SOLD OUT
                  </Badge>
                </div>
              )}
            </div>
            
            {/* Additional Images */}
            {product.media_gallery && product.media_gallery.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.media_gallery.slice(0, 4).map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <Badge className="mb-3 bg-orange-100 text-orange-700">
              {product.category.replace('_', ' ').toUpperCase()}
            </Badge>
            
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              {product.name}
            </h1>
            
            <div className="flex items-center space-x-4 mb-4">
              {renderStars(product.rating || 4.5)}
              <span className="text-sm text-gray-600">
                ({product.review_count || reviews.length} reviews)
              </span>
            </div>

            <p className="text-gray-600 text-lg mb-6">
              {product.description}
            </p>

            {/* Variants Selection */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Select Weight:</h3>
              <div className="flex flex-wrap gap-3">
                {product.variants && product.variants.map((variant) => (
                  <button
                    key={variant.weight}
                    onClick={() => setSelectedVariant(variant)}
                    disabled={!variant.is_available}
                    className={`px-6 py-3 rounded-lg border-2 transition-all ${
                      selectedVariant?.weight === variant.weight
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-orange-300'
                    } ${!variant.is_available ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="font-semibold">{variant.weight}</div>
                    <div className="text-sm">₹{variant.price}</div>
                    {variant.original_price && (
                      <div className="text-xs line-through text-gray-400">
                        ₹{variant.original_price}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            {selectedVariant && (
              <div className="mb-6">
                <div className="flex items-baseline space-x-3">
                  <span className="text-4xl font-bold text-orange-600">
                    ₹{selectedVariant.price}
                  </span>
                  {selectedVariant.original_price && (
                    <span className="text-2xl text-gray-400 line-through">
                      ₹{selectedVariant.original_price}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">Inclusive of all taxes</p>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Quantity:</h3>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Sold Out Message */}
            {product.is_sold_out && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" data-testid="sold-out-message">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-red-600 text-white">SOLD OUT</Badge>
                  <p className="text-red-700 font-medium">Currently Unavailable</p>
                </div>
                <p className="text-red-600 text-sm mt-2">
                  This product is currently out of stock. Please check back later or contact us for availability.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Button
                onClick={handleAddToCart}
                disabled={product.is_sold_out || !selectedVariant}
                className={`flex-1 py-6 text-lg ${
                  product.is_sold_out 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
                data-testid="add-to-cart-detail"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {product.is_sold_out ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              <Button
                variant="outline"
                className="py-6 border-orange-500 text-orange-700 hover:bg-orange-50"
              >
                <Heart className="w-5 h-5" />
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="mb-6">
              <TrustBadges variant="compact" className="justify-center mb-4" />
              <SecurePaymentBadges variant="compact" />
            </div>

            {/* Ingredients */}
            {product.ingredients && product.ingredients.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-800 mb-3">Ingredients:</h3>
                <div className="flex flex-wrap gap-2">
                  {product.ingredients.map((ingredient, index) => (
                    <Badge key={index} variant="outline" className="text-sm">
                      {ingredient}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Customer Reviews</CardTitle>
                <Button
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast.error('Please login to write a review');
                      return;
                    }
                    setShowReviewForm(!showReviewForm);
                  }}
                  className="bg-orange-500 hover:bg-orange-600"
                  data-testid="write-review-button"
                >
                  Write a Review
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Review Form */}
              {showReviewForm && isAuthenticated && (
                <form onSubmit={handleSubmitReview} className="mb-8 p-6 bg-orange-50 rounded-lg">
                  <h3 className="font-semibold text-lg mb-4">Write Your Review</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Your Rating:</label>
                    {renderStars(reviewRating, true, setReviewRating)}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Your Review:</label>
                    <Textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience with this product..."
                      rows={4}
                      className="w-full"
                      required
                      data-testid="review-comment-input"
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={submittingReview}
                      className="bg-orange-500 hover:bg-orange-600"
                      data-testid="submit-review-button"
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowReviewForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="mb-2">No reviews yet</p>
                  <p className="text-sm">Be the first to review this product!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-6 last:border-b-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center space-x-3 mb-1">
                            <span className="font-semibold text-gray-800">
                              {review.user_name}
                            </span>
                            {review.is_approved && (
                              <Badge className="bg-green-100 text-green-700 text-xs">
                                <Check className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};
