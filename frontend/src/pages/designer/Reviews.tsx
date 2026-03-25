import  { useState, useEffect } from 'react';
import { Star, MessageCircle, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface ReviewedProduct {
  id: string;
  name: string;
  image: string;
}

interface Reviewer {
  id: string;
  name: string;
  avatar?: string;
}

interface Review {
  id: string;
  productId: string;
  product: ReviewedProduct;
  reviewerId: string;
  reviewer: Reviewer;
  rating: number;
  content: string;
  createdAt: string;
  reply?: {
    content: string;
    createdAt: string;
  };
  status: 'published' | 'hidden';
}

// Mock data for demonstration
const mockReviews: Review[] = [
  {
    id: 'r1',
    productId: 'p1',
    product: {
      id: 'p1',
      name: 'Traditional Chitenge Dress',
      image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80'
    },
    reviewerId: 'user1',
    reviewer: {
      id: 'user1',
      name: 'Chikondi Banda',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80'
    },
    rating: 5,
    content: 'Absolutely beautiful dress! The craftsmanship is excellent and it fits perfectly. I received so many compliments at the wedding. Thank you for your attention to detail and the quick delivery.',
    createdAt: '2025-11-15T14:22:00Z',
    reply: {
      content: 'Thank you for your kind words, Chikondi! It was a pleasure creating this dress for you. We\'re so happy it was a hit at the wedding.',
      createdAt: '2025-11-15T16:45:00Z'
    },
    status: 'published'
  },
  {
    id: 'r2',
    productId: 'p2',
    product: {
      id: 'p2',
      name: 'Modern African Print Blazer',
      image: 'https://images.unsplash.com/photo-1593030942428-a5451dca4b42?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80'
    },
    reviewerId: 'user2',
    reviewer: {
      id: 'user2',
      name: 'Tiyamike Nkhoma',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80'
    },
    rating: 4,
    content: 'Great quality blazer with unique patterns. The sizing runs a bit large, so I would recommend ordering a size down. Otherwise, it\'s a beautiful piece that can be dressed up or down.',
    createdAt: '2025-10-28T16:40:00Z',
    status: 'published'
  },
  {
    id: 'r3',
    productId: 'p3',
    product: {
      id: 'p3',
      name: 'Handcrafted Beaded Necklace',
      image: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80'
    },
    reviewerId: 'user3',
    reviewer: {
      id: 'user3',
      name: 'Kondwani Phiri',
      avatar: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80'
    },
    rating: 3,
    content: 'The necklace is beautiful, but the clasp broke after a few uses. Customer service was helpful in resolving the issue, but I wish the quality of the clasp matched the rest of the piece.',
    createdAt: '2025-09-17T11:30:00Z',
    reply: {
      content: 'We sincerely apologize for the issue with the clasp, Kondwani. We have taken your feedback to heart and are now using improved clasps in all our jewelry. Thank you for bringing this to our attention.',
      createdAt: '2025-09-17T14:10:00Z'
    },
    status: 'published'
  },
  {
    id: 'r4',
    productId: 'p4',
    product: {
      id: 'p4',
      name: 'Custom Tailored Suit',
      image: 'https://images.unsplash.com/photo-1592878940526-0214b0f374f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80'
    },
    reviewerId: 'user4',
    reviewer: {
      id: 'user4',
      name: 'Grace Mbewe',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80'
    },
    rating: 5,
    content: 'Exceptional service and craftsmanship! The suit fits like a glove and the attention to detail is remarkable. The process from measurement to delivery was smooth and professional. Highly recommend!',
    createdAt: '2025-12-02T19:15:00Z',
    reply: {
      content: 'Thank you for your wonderful review, Grace! we are thrilled that you are happy with your custom suit. It was a pleasure working with you to create the perfect fit.',
      createdAt: '2025-12-03T09:30:00Z'
    },
    status: 'published'
  },
  {
    id: 'r5',
    productId: 'p5',
    product: {
      id: 'p5',
      name: 'Contemporary Malawian Scarf',
      image: 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80'
    },
    reviewerId: 'user5',
    reviewer: {
      id: 'user5',
      name: 'Mphatso Gondwe',
      avatar: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80'
    },
    rating: 2,
    content: 'The colors are not as vibrant as shown in the photos, and the fabric feels thin. I expected better quality for the price. Disappointed with this purchase.',
    createdAt: '2025-10-05T13:25:00Z',
    status: 'hidden'
  }
];

type RatingFilter = 'all' | '5' | '4' | '3' | '2' | '1';
type SortOption = 'recent' | 'oldest' | 'highest' | 'lowest';

const DesignerReviews = () => {
  const { user } = useAuth();
  const { addToast } = useNotification();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Statistics
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingCounts: {
      '5': 0,
      '4': 0,
      '3': 0,
      '2': 0,
      '1': 0
    }
  });
  
  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setReviews(mockReviews);
      
      // Calculate statistics
      const total = mockReviews.length;
      const ratingSum = mockReviews.reduce((sum, review) => sum + review.rating, 0);
      const average = total > 0 ? ratingSum / total : 0;
      
      const counts = {
        '5': mockReviews.filter(review => review.rating === 5).length,
        '4': mockReviews.filter(review => review.rating === 4).length,
        '3': mockReviews.filter(review => review.rating === 3).length,
        '2': mockReviews.filter(review => review.rating === 2).length,
        '1': mockReviews.filter(review => review.rating === 1).length
      };
      
      setStats({
        totalReviews: total,
        averageRating: average,
        ratingCounts: counts
      });
      
      setLoading(false);
    }, 800);
  }, []);

  const handleSendReply = (reviewId: string) => {
    if (!replyContent.trim()) {
      addToast('error', t('reviews.replyContentRequired'));
      return;
    }
    
    // Update the review with the reply
    setReviews(prevReviews => 
      prevReviews.map(review => 
        review.id === reviewId 
          ? {
              ...review,
              reply: {
                content: replyContent.trim(),
                createdAt: new Date().toISOString()
              }
            }
          : review
      )
    );
    
    // Reset reply state
    setReplyingTo(null);
    setReplyContent('');
    
    // Show success notification
    addToast('success', t('reviews.replySent'));
  };

  const handleToggleStatus = (reviewId: string) => {
    setReviews(prevReviews => 
      prevReviews.map(review => 
        review.id === reviewId 
          ? {
              ...review,
              status: review.status === 'published' ? 'hidden' : 'published'
            }
          : review
      )
    );
    
    const review = reviews.find(r => r.id === reviewId);
    if (review) {
      const statusMessage = review.status === 'published' 
        ? t('reviews.reviewHidden') 
        : t('reviews.reviewPublished');
      
      addToast('success', statusMessage);
    }
  };

  const filteredReviews = reviews.filter(review => {
    // Apply rating filter
    if (ratingFilter !== 'all' && review.rating !== parseInt(ratingFilter)) {
      return false;
    }
    
    // Apply search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      return (
        review.product.name.toLowerCase().includes(query) ||
        review.reviewer.name.toLowerCase().includes(query) ||
        review.content.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      case 'recent':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star}
            size={16}
            className={star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
          />
        ))}
      </div>
    );
  };

  const getRatingPercentage = (rating: '5' | '4' | '3' | '2' | '1') => {
    if (stats.totalReviews === 0) return 0;
    return (stats.ratingCounts[rating] / stats.totalReviews) * 100;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('designer.reviews')}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {t('designer.reviewsDescription')}
        </p>
      </div>

      {/* Overview & Stats */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Average Rating */}
            <div className="flex flex-col items-center justify-center">
              <div className="text-5xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</div>
              <div className="mt-2 flex">{renderStars(Math.round(stats.averageRating))}</div>
              <div className="mt-1 text-sm text-gray-500">
                {t('reviews.basedOn')} {stats.totalReviews} {t('reviews.reviews')}
              </div>
            </div>
            
            {/* Rating Breakdown */}
            <div className="col-span-2">
              <h3 className="text-sm font-medium text-gray-900 mb-2">{t('reviews.ratingBreakdown')}</h3>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center">
                    <div className="w-12 text-sm text-gray-700">{rating} {t('reviews.stars')}</div>
                    <div className="flex-grow mx-3">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400"
                          style={{ width: `${getRatingPercentage(rating.toString() as '5' | '4' | '3' | '2' | '1')}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-10 text-sm text-gray-500 text-right">
                      {stats.ratingCounts[rating.toString() as '5' | '4' | '3' | '2' | '1']}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <input
              type="search"
              placeholder={t('reviews.searchReviews')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MessageCircle className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Filter className="mr-2 h-4 w-4" />
            {t('common.filters')}
            {showFilters ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
          </button>
        </div>

        <div className={`mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 ${showFilters ? 'block' : 'hidden md:grid'}`}>
          <div>
            <label htmlFor="rating-filter" className="block text-sm font-medium text-gray-700 mb-1">
              {t('reviews.filterByRating')}
            </label>
            <select
              id="rating-filter"
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value as RatingFilter)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="all">{t('common.all')}</option>
              <option value="5">5 {t('reviews.stars')}</option>
              <option value="4">4 {t('reviews.stars')}</option>
              <option value="3">3 {t('reviews.stars')}</option>
              <option value="2">2 {t('reviews.stars')}</option>
              <option value="1">1 {t('reviews.star')}</option>
            </select>
          </div>
          <div>
            <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.sortBy')}
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="recent">{t('common.mostRecent')}</option>
              <option value="oldest">{t('common.oldest')}</option>
              <option value="highest">{t('reviews.highestRating')}</option>
              <option value="lowest">{t('reviews.lowestRating')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {sortedReviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('reviews.noReviews')}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || ratingFilter !== 'all'
                ? t('reviews.noReviewsMatchingFilters')
                : t('reviews.noReviewsYet')}
            </p>
          </div>
        ) : (
          sortedReviews.map((review) => (
            <div key={review.id} className={`bg-white shadow-sm rounded-lg overflow-hidden ${
              review.status === 'hidden' ? 'opacity-60' : ''
            }`}>
              {/* Review header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    {review.reviewer.avatar ? (
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={review.reviewer.avatar}
                        alt={review.reviewer.name}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-800 text-sm font-medium">
                          {review.reviewer.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-900">
                      {review.reviewer.name}
                    </h3>
                    <div className="flex items-center">
                      {renderStars(review.rating)}
                      <span className="ml-2 text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(review.id)}
                    className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm ${
                      review.status === 'published'
                        ? 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                        : 'text-white bg-primary-600 hover:bg-primary-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                  >
                    {review.status === 'published' ? t('reviews.hide') : t('reviews.publish')}
                  </button>
                </div>
              </div>

              {/* Review content */}
              <div className="px-6 py-4">
                <div className="flex items-center mb-3">
                  <div className="flex-shrink-0 h-10 w-10">
                    <img
                      className="h-10 w-10 rounded-md object-cover"
                      src={review.product.image}
                      alt={review.product.name}
                    />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{review.product.name}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700">{review.content}</p>
              </div>

              {/* Reply section */}
              {review.reply ? (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-800 text-sm font-medium">
                          {user?.name?.charAt(0) || 'D'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">{t('reviews.yourReply')}</span>
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
              ) : replyingTo === review.id ? (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-800 text-sm font-medium">
                          {user?.name?.charAt(0) || 'D'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-medium text-gray-900">{t('reviews.yourReply')}</div>
                      <div className="mt-1">
                        <textarea
                          rows={3}
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder={t('reviews.replyPlaceholder')}
                        ></textarea>
                      </div>
                      <div className="mt-2 flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent('');
                          }}
                          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          {t('common.cancel')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendReply(review.id)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          {t('reviews.sendReply')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setReplyingTo(review.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <MessageCircle className="mr-1.5 h-4 w-4" />
                    {t('reviews.replyToReview')}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DesignerReviews;
 