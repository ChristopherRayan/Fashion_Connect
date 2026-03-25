import  { useState, useEffect } from 'react';
import { Star, Edit, Trash, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface ReviewedProduct {
  id: string;
  name: string;
  image: string;
  designerId: string;
  designerName: string;
}

interface Review {
  id: string;
  productId: string;
  product: ReviewedProduct;
  rating: number;
  content: string;
  createdAt: string;
  updatedAt: string | null;
  status: 'published' | 'pending' | 'rejected';
  reply?: {
    content: string;
    createdAt: string;
    designerName: string;
  };
}

// Mock data for demonstration
const mockReviews: Review[] = [
  {
    id: 'r1',
    productId: 'p1',
    product: {
      id: 'p1',
      name: 'Tailored Suit Jacket',
      image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80',
      designerId: 'd1',
      designerName: 'Chikondi Fashion'
    },
    rating: 5,
    content: 'Excellent quality and perfect fit! The attention to detail in the stitching and fabric selection is remarkable. Delivery was faster than expected.',
    createdAt: '2025-11-15T14:22:00Z',
    updatedAt: null,
    status: 'published',
    reply: {
      content: 'Thank you for your kind words! we are delighted that you are happy with your purchase.',
      createdAt: '2025-11-16T09:15:00Z',
      designerName: 'Chikondi Fashion'
    }
  },
  {
    id: 'r2',
    productId: 'p2',
    product: {
      id: 'p2',
      name: 'Summer Floral Dress',
      image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80',
      designerId: 'd2',
      designerName: 'Madalitso Designs'
    },
    rating: 4,
    content: 'Beautiful dress with vibrant colors. The material is lightweight and perfect for summer. Only reason for 4 stars is that it runs slightly large.',
    createdAt: '2025-10-28T16:40:00Z',
    updatedAt: null,
    status: 'published'
  },
  {
    id: 'r3',
    productId: 'p3',
    product: {
      id: 'p3',
      name: 'Traditional Chitenje Set',
      image: 'https://images.unsplash.com/photo-1509319117193-57bab727e09d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80',
      designerId: 'd3',
      designerName: 'Thoko Couture'
    },
    rating: 3,
    content: 'The patterns and colors are beautiful, but I had an issue with the sizing. Customer service was helpful in resolving it.',
    createdAt: '2025-09-17T11:30:00Z',
    updatedAt: '2025-09-18T15:45:00Z',
    status: 'published',
    reply: {
      content: 'We appreciate your feedback and are glad we could help with the sizing issue. We have noted your comments to improve our sizing guide.',
      createdAt: '2025-09-19T10:22:00Z',
      designerName: 'Thoko Couture'
    }
  },
  {
    id: 'r4',
    productId: 'p4',
    product: {
      id: 'p4',
      name: 'Beaded Evening Clutch',
      image: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80',
      designerId: 'd4',
      designerName: 'Ulemu Accessories'
    },
    rating: 5,
    content: 'This clutch exceeded my expectations! The beadwork is intricate and the craftsmanship is outstanding. I received many compliments.',
    createdAt: '2025-12-02T19:15:00Z',
    updatedAt: null,
    status: 'pending'
  }
];

type SortOption = 'recent' | 'oldest' | 'highest-rating' | 'lowest-rating';
type StatusFilter = 'all' | 'published' | 'pending' | 'rejected';

const Reviews = () => {
  const { user } = useAuth();
  const { addToast } = useNotification();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editContent, setEditContent] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setReviews(mockReviews);
      setLoading(false);
    }, 800);
  }, []);

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditContent(review.content);
  };

  const handleCancelEdit = () => {
    setEditingReview(null);
    setEditRating(0);
    setEditContent('');
  };

  const handleSaveEdit = () => {
    if (!editingReview) return;
    
    // Validate inputs
    if (editRating === 0) {
      addToast('error', t('reviews.ratingRequired'));
      return;
    }
    
    if (editContent.trim() === '') {
      addToast('error', t('reviews.contentRequired'));
      return;
    }
    
    // Update the review
    const updatedReviews = reviews.map(review => 
      review.id === editingReview.id 
        ? {
            ...review,
            rating: editRating,
            content: editContent,
            updatedAt: new Date().toISOString(),
            status: 'pending' as const
          }
        : review
    );
    
    setReviews(updatedReviews);
    setEditingReview(null);
    setEditRating(0);
    setEditContent('');
    addToast('success', t('reviews.reviewUpdated'));
  };

  const handleDeleteReview = (reviewId: string) => {
    // In a real app, you'd show a confirmation dialog first
    setReviews(reviews.filter(review => review.id !== reviewId));
    addToast('success', t('reviews.reviewDeleted'));
  };

  const filteredReviews = reviews.filter(review => {
    if (statusFilter === 'all') return true;
    return review.status === statusFilter;
  });

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'highest-rating':
        return b.rating - a.rating;
      case 'lowest-rating':
        return a.rating - b.rating;
      case 'recent':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const renderStars = (rating: number, interactive = false, onChange?: (rating: number) => void) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star}
            size={20}
            className={`${
              star <= rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
            } ${
              interactive ? 'cursor-pointer hover:text-yellow-300' : ''
            }`}
            onClick={() => interactive && onChange && onChange(star)}
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (status: Review['status']) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {t('reviews.published')}
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            {t('reviews.pending')}
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            {t('reviews.rejected')}
          </span>
        );
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {t('reviews.myReviews')}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t('reviews.description')}
          </p>
        </div>
      </div>

      {/* Filters and sorting */}
      <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex justify-between items-center md:hidden px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <div className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            {t('common.filtersAndSorting')}
          </div>
          {showFilters ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        <div className={`mt-4 md:mt-0 ${showFilters ? 'block' : 'hidden md:block'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                {t('reviews.filterByStatus')}
              </label>
              <select
                id="status-filter"
                name="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="all">{t('common.all')}</option>
                <option value="published">{t('reviews.published')}</option>
                <option value="pending">{t('reviews.pending')}</option>
                <option value="rejected">{t('reviews.rejected')}</option>
              </select>
            </div>
            <div>
              <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
                {t('common.sortBy')}
              </label>
              <select
                id="sort-by"
                name="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="recent">{t('common.mostRecent')}</option>
                <option value="oldest">{t('common.oldest')}</option>
                <option value="highest-rating">{t('reviews.highestRating')}</option>
                <option value="lowest-rating">{t('reviews.lowestRating')}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews list */}
      {sortedReviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <Star className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">{t('reviews.noReviews')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('reviews.noReviewsMessage')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedReviews.map((review) => (
            <div key={review.id} className="bg-white shadow-sm rounded-lg overflow-hidden">
              {/* Review header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12">
                      <img
                        className="h-12 w-12 rounded-md object-cover"
                        src={review.product.image}
                        alt={review.product.name}
                      />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-900">
                        {review.product.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {review.product.designerName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {getStatusBadge(review.status)}
                    <div className="ml-4 flex-shrink-0 flex">
                      {review.status !== 'rejected' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEditReview(review)}
                            className="mr-2 inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            aria-label={t('common.edit')}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(review.id)}
                            className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            aria-label={t('common.delete')}
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Review content */}
              <div className="px-6 py-4">
                {editingReview?.id === review.id ? (
                  <div>
                    <div className="mb-4">
                      <label htmlFor="edit-rating" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('reviews.rating')}
                      </label>
                      <div id="edit-rating">
                        {renderStars(editRating, true, setEditRating)}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label htmlFor="edit-content" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('reviews.content')}
                      </label>
                      <textarea
                        id="edit-content"
                        rows={4}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder={t('reviews.contentPlaceholder')}
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        {t('common.save')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center mb-2">
                      {renderStars(review.rating)}
                      <span className="ml-2 text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                        {review.updatedAt && ` (${t('reviews.edited')})`}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800">{review.content}</p>
                  </div>
                )}
              </div>

              {/* Designer reply */}
              {review.reply && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-800 text-sm font-medium">
                          {review.reply.designerName.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">{review.reply.designerName}</span>
                        <span className="text-gray-500 text-xs ml-2">
                          {new Date(review.reply.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-700">
                        <p>{review.reply.content}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reviews;
 