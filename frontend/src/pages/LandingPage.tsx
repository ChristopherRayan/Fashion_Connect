import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { designerService } from '../services/designerService';
import { productService, Product as ApiProduct } from '../services/productService';
import { UserRole } from '../types';
import { Product } from '../components/common/ProductCard';
import CategoryCard, { Category } from '../components/common/CategoryCard';
import RotatingCategoryCard from '../components/common/RotatingCategoryCard';
import DesignerCard from '../components/common/DesignerCard';

import ProductRecommendations from '../components/common/ProductRecommendations';
import {
  Menu, X, ChevronRight, LogIn, UserPlus,
  Scissors, Star, Globe, ArrowRight, TrendingUp, Zap
} from 'lucide-react';

// Helper function to extract image URL from ProductImage object or string
const getProductImageUrl = (image: any): string => {
  if (!image) return '/api/placeholder/300/300';
  
  // If it's a ProductImage object, extract the URL
  if (typeof image === 'object' && image.url) {
    return image.url;
  }
  
  // If it's a string, return it directly
  if (typeof image === 'string') {
    return image;
  }
  
  return '/api/placeholder/300/300';
};

// Transform API product to ProductCard product
const transformProduct = (apiProduct: ApiProduct): Product => ({
  id: apiProduct._id,
  name: apiProduct.name,
  price: apiProduct.price,
  originalPrice: apiProduct.discountPrice ? apiProduct.price : undefined,
  discount: apiProduct.discountPrice ? Math.round(((apiProduct.price - apiProduct.discountPrice) / apiProduct.price) * 100) : undefined,
  images: apiProduct.images,
  designer: {
    id: apiProduct.designer._id,
    name: apiProduct.designer.name,
    avatar: undefined // API doesn't provide designer avatar in product response
  },
  rating: apiProduct.rating,
  reviewCount: apiProduct.reviewCount,
  category: apiProduct.category,
  isNew: new Date(apiProduct.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // New if created within last 7 days
  isFeatured: apiProduct.featured,
  inStock: apiProduct.inStock
});

// Type for carousel designer data
interface CarouselDesigner {
  _id: string;
  name: string;
  specialty: string;
  profileImage?: string;
  bio?: string;
  location?: string;
  rating?: number;
  reviewCount?: number;
}

const testimonials = [
  {
    name: "Chikondi Banda",
    role: "Client from Lilongwe",
    initials: "CB",
    color: "primary",
    text: "I needed a custom outfit for my wedding and found the perfect designer on FashionConnect. The process was seamless and the result exceeded my expectations. I have since ordered several more pieces!",
    rating: 5,
  },
  {
    name: "Mayamiko Kalulu",
    role: "Designer from Blantyre",
    initials: "MK",
    color: "secondary",
    text: "As a designer, FashionConnect has transformed my business. I now have access to clients across the country and can showcase my work to a wider audience. My sales have increased by 70% since joining!",
    rating: 5,
  },
  {
    name: "Tadala Mkandawire",
    role: "Client from Zomba",
    initials: "TM",
    color: "primary",
    text: "I love how easy it is to find unique pieces that reflect Malawian culture. The platform makes it simple to communicate with designers and get exactly what I want. The quality is always excellent!",
    rating: 4,
  },
  {
    name: "Chisomo Manda",
    role: "Designer from Mzuzu",
    initials: "CM",
    color: "secondary",
    text: "The verification process ensures that only quality designers are on the platform, which builds client trust. The tools for managing orders and communicating with clients are excellent. FashionConnect has helped me grow my brand.",
    rating: 5,
  },
];

// Default fallback images for designers without profile images
const defaultDesignerImages = [
  "https://images.unsplash.com/photo-1472417583565-62e7bdeda490?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw1fHxhZnJpY2FuJTIwZmFzaGlvbiUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax",
  "https://images.unsplash.com/photo-1512068312404-09a183f541eb?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw2fHxhZnJpY2FuJTIwZmFzaGlvbiUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax",
  "https://images.unsplash.com/photo-1450297166380-cabe503887e5?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw3fHxhZnJpY2FuJTIwZmFzaGlvbiUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw4fHxhZnJpY2FuJTIwZmFzaGlvbiUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw5fHxhZnJpY2FuJTIwZmFzaGlvbiUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax"
];

// Category images mapping
const categoryImages: Record<string, string> = {
  // Main category groups (consistent with navigation)
  'Men': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  'Women': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  'Kids': 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  'Accessories': 'https://images.unsplash.com/photo-1450297166380-cabe503887e5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
  'Traditional Wear': 'https://images.unsplash.com/photo-1472417583565-62e7bdeda490?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
  'Formal Wear': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  'Wedding Attire': 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
  'Casual Wear': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  'Suit': 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  'Adult': 'https://images.unsplash.com/photo-1492447105260-2e947425b5cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  'Unisex - Top': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  'Unisex - Bottom': 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  // Legacy specific categories (for fallback)
  'Modern Fashion': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
  "Men's - Top": 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  "Men's - Bottom": 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  "Women's - Top": 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  "Women's - Bottom": 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  'Footwear': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  'Jewelry': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
};

// Category descriptions mapping
const categoryDescriptions: Record<string, string> = {
  // Main category groups (consistent with navigation)
  'Men': 'Stylish clothing and accessories for men',
  'Women': 'Beautiful fashion and accessories for women',
  'Kids': 'Adorable clothing and accessories for children',
  'Traditional Wear': 'Authentic Malawian traditional clothing and accessories',
  'Modern Fashion': 'Contemporary designs with African inspiration',
  'Wedding Attire': 'Elegant wedding dresses and formal wear',
  'Accessories': 'Handcrafted jewelry, bags, and accessories',
  'Formal Wear': 'Professional and elegant formal clothing',
  'Casual Wear': 'Comfortable everyday fashion pieces',
  'Suit': 'Professional suits and formal business attire',
  'Adult': 'Sophisticated fashion for mature adults',
  'Unisex - Top': 'Versatile tops suitable for all genders',
  'Unisex - Bottom': 'Comfortable bottoms for everyone',
  "Men's - Top": 'Stylish shirts, t-shirts, and tops for men',
  "Men's - Bottom": 'Trousers, shorts, and bottoms for men',
  "Women's - Top": 'Beautiful blouses, tops, and shirts for women',
  "Women's - Bottom": 'Skirts, trousers, and bottoms for women',
  'Footwear': 'Shoes, sandals, and footwear collection',
  'Jewelry': 'Beautiful handcrafted jewelry and accessories'
};



// Mock products data (fallback)
const mockNewProducts: Product[] = [
  {
    id: '1',
    name: 'Elegant Chitenje Dress',
    price: 45000,
    images: ['https://images.unsplash.com/photo-1472417583565-62e7bdeda490?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'],
    designer: { id: '1', name: 'Grace Mwale' },
    rating: 4.8,
    reviewCount: 12,
    category: 'Traditional Wear',
    isNew: true,
    inStock: true
  },
  {
    id: '2',
    name: 'Modern African Print Blazer',
    price: 38000,
    images: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'],
    designer: { id: '2', name: 'James Phiri' },
    rating: 4.6,
    reviewCount: 8,
    category: 'Modern Fashion',
    isNew: true,
    inStock: true
  },
  {
    id: '3',
    name: 'Traditional Wedding Gown',
    price: 125000,
    images: ['https://images.unsplash.com/photo-1469334031218-e382a71b716b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'],
    designer: { id: '3', name: 'Mary Banda' },
    rating: 5.0,
    reviewCount: 15,
    category: 'Wedding Attire',
    isNew: true,
    inStock: true
  },
  {
    id: '4',
    name: 'Handwoven Basket Bag',
    price: 15000,
    images: ['https://images.unsplash.com/photo-1450297166380-cabe503887e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'],
    designer: { id: '4', name: 'Sarah Tembo' },
    rating: 4.7,
    reviewCount: 23,
    category: 'Accessories',
    isNew: true,
    inStock: true
  }
];

const mockSuperDeals: Product[] = [
  {
    id: '5',
    name: 'Designer Chitenje Suit',
    price: 32000,
    originalPrice: 45000,
    images: ['https://images.unsplash.com/photo-1472417583565-62e7bdeda490?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'],
    designer: { id: '1', name: 'Grace Mwale' },
    rating: 4.9,
    reviewCount: 18,
    category: 'Traditional Wear',
    inStock: true
  },
  {
    id: '6',
    name: 'African Print Maxi Dress',
    price: 28000,
    originalPrice: 35000,
    images: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'],
    designer: { id: '2', name: 'James Phiri' },
    rating: 4.5,
    reviewCount: 14,
    category: 'Modern Fashion',
    inStock: true
  },
  {
    id: '7',
    name: 'Beaded Jewelry Set',
    price: 8500,
    originalPrice: 12000,
    images: ['https://images.unsplash.com/photo-1450297166380-cabe503887e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'],
    designer: { id: '4', name: 'Sarah Tembo' },
    rating: 4.8,
    reviewCount: 31,
    category: 'Accessories',
    inStock: true
  },
  {
    id: '8',
    name: 'Traditional Headwrap',
    price: 6000,
    originalPrice: 9000,
    images: ['https://images.unsplash.com/photo-1472417583565-62e7bdeda490?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'],
    designer: { id: '3', name: 'Mary Banda' },
    rating: 4.6,
    reviewCount: 9,
    category: 'Accessories',
    inStock: true
  }
];

// Random products for browsing
const mockRandomProducts: Product[] = [
  {
    id: '9',
    name: 'Vintage Chitenje Skirt',
    price: 22000,
    images: ['https://images.unsplash.com/photo-1472417583565-62e7bdeda490?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'],
    designer: { id: '1', name: 'Grace Mwale' },
    rating: 4.7,
    reviewCount: 16,
    category: 'Traditional Wear',
    inStock: true
  },
  {
    id: '10',
    name: 'Contemporary Ankara Shirt',
    price: 18000,
    images: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'],
    designer: { id: '2', name: 'James Phiri' },
    rating: 4.4,
    reviewCount: 11,
    category: 'Modern Fashion',
    inStock: true
  },
  {
    id: '11',
    name: 'Beaded Necklace',
    price: 7500,
    images: ['https://images.unsplash.com/photo-1450297166380-cabe503887e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'],
    designer: { id: '4', name: 'Sarah Tembo' },
    rating: 4.9,
    reviewCount: 27,
    category: 'Accessories',
    inStock: true
  },
  {
    id: '12',
    name: 'Formal Blazer Set',
    price: 55000,
    images: ['https://images.unsplash.com/photo-1469334031218-e382a71b716b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'],
    designer: { id: '3', name: 'Mary Banda' },
    rating: 4.8,
    reviewCount: 13,
    category: 'Formal Wear',
    inStock: true
  },
  {
    id: '13',
    name: 'Traditional Headband',
    price: 4500,
    images: ['https://images.unsplash.com/photo-1472417583565-62e7bdeda490?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'],
    designer: { id: '1', name: 'Grace Mwale' },
    rating: 4.5,
    reviewCount: 8,
    category: 'Accessories',
    inStock: true
  },
  {
    id: '14',
    name: 'Designer Handbag',
    price: 35000,
    images: ['https://images.unsplash.com/photo-1450297166380-cabe503887e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'],
    designer: { id: '4', name: 'Sarah Tembo' },
    rating: 4.6,
    reviewCount: 19,
    category: 'Accessories',
    inStock: true
  }
];

const TestimonialPopup = () => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);
  const t = testimonials[index];
  return (
    <div className="fixed left-4 bottom-4 z-50 w-80 max-w-xs bg-white rounded-lg shadow-lg p-4 flex flex-col animate-fade-in">
      <div className="flex items-start">
        <div className={`inline-flex items-center justify-center h-10 w-10 rounded-full bg-${t.color}-100`}>
          <span className={`text-lg font-medium text-${t.color}-800`}>{t.initials}</span>
        </div>
        <div className="ml-3">
          <h4 className="text-base font-bold text-gray-900">{t.name}</h4>
          <p className="text-xs text-gray-500">{t.role}</p>
        </div>
      </div>
      <div className="mt-2 text-gray-600 text-sm italic">"{t.text}"</div>
      <div className="mt-2 flex">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`h-4 w-4 ${i < t.rating ? 'text-yellow-400' : 'text-gray-300'}`} />
        ))}
      </div>
    </div>
  );
};

const NAV_LINKS = [
  { to: "/features", label: "Features" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "#designers", label: "Designers" },
];

const DesignerCarousel = () => {
  const { t, locale, changeLocale } = useLanguage();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [designers, setDesigners] = useState<CarouselDesigner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



  // Fetch featured designers and products on component mount
  useEffect(() => {
    const fetchDesigners = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔄 Fetching featured designers from API...');

        // Fetch featured designers from the API
        const fetchedDesigners = await designerService.getFeaturedDesigners(5);

        console.log('✅ API Response:', fetchedDesigners);

        if (fetchedDesigners && fetchedDesigners.length > 0) {
          console.log(`📊 Found ${fetchedDesigners.length} designers from database`);
          // Transform Designer[] to CarouselDesigner[] by mapping id to _id
          const carouselDesigners: CarouselDesigner[] = fetchedDesigners.map(designer => ({
            _id: designer.id || designer._id || 'unknown', // Map id to _id with fallback
            name: designer.name || 'Unknown Designer',
            specialty: designer.specialty || 'Fashion Designer',
            profileImage: designer.avatar || designer.profileImage, // Map avatar to profileImage
            bio: designer.bio,
            location: typeof designer.location === 'object'
              ? `${designer.location.city}, ${designer.location.country}`
              : designer.location || 'Malawi',
            rating: designer.rating || 5,
            reviewCount: designer.reviewCount || 0
          }));
          setDesigners(carouselDesigners);
        } else {
          console.log('⚠️ No designers found, using fallback data');
          // Fallback to mock data if no designers found
          setDesigners([
            {
              _id: 'fallback-1',
              name: 'Featured Designer',
              specialty: 'Fashion Design',
              profileImage: defaultDesignerImages[0],
              rating: 5,
              reviewCount: 0
            }
          ]);
        }
      } catch (err) {
        console.error('❌ Error fetching designers:', err);
        setError('Failed to load designers');

        console.log('🔄 Using fallback data due to API error');
        // Fallback to mock data on error
        setDesigners([
          {
            _id: 'fallback-1',
            name: 'Featured Designer',
            specialty: 'Fashion Design',
            profileImage: defaultDesignerImages[0],
            rating: 5,
            reviewCount: 0
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDesigners();
  }, []);

  // Carousel rotation effect
  useEffect(() => {
    if (designers.length === 0) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % designers.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [designers.length]);

  const toggleLanguage = () => {
    const newLocale = locale === 'en' ? 'ny' : 'en';
    changeLocale(newLocale);
  };

  const getDashboardUrl = () => {
    if (!user) return '/login';

    switch (user.role) {
      case UserRole.CLIENT:
        return '/client';
      case UserRole.DESIGNER:
        return '/designer';
      case UserRole.ADMIN:
        return '/admin';
      default:
        return '/login';
    }
  };

  // Show loading state
  if (loading) {
    return (
      <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-gray-900">
        <div
          className="absolute inset-0"
          style={{
            zIndex: 1,
            background: 'linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.8) 100%)'
          }}
        />
        <div className="relative z-10 text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading featured designers...</p>
          <p className="text-sm opacity-75 mt-2">Discovering Malawi's top fashion talent</p>
        </div>
      </section>
    );
  }

  // Show error state
  if (error) {
    return (
      <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-gray-900">
        <div
          className="absolute inset-0"
          style={{
            zIndex: 1,
            background: 'linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.8) 100%)'
          }}
        />
        <div className="relative z-10 text-center text-white max-w-md px-4">
          <div className="text-red-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-lg font-medium mb-2">Unable to load designers</p>
          <p className="text-sm opacity-75 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  // Get current designer
  const currentDesigner = designers[index];
  if (!currentDesigner) {
    return (
      <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-gray-900">
        <div
          className="absolute inset-0"
          style={{
            zIndex: 1,
            background: 'linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.8) 100%)'
          }}
        />
        <div className="relative z-10 text-center text-white">
          <p className="text-lg font-medium">No designers available</p>
          <p className="text-sm opacity-75 mt-2">Check back soon for featured designers</p>
        </div>
      </section>
    );
  }

  // Get designer image with fallback
  const getDesignerImage = (designer: CarouselDesigner, index: number) => {
    return designer.profileImage || defaultDesignerImages[index % defaultDesignerImages.length];
  };
  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
      <img
        src={getDesignerImage(currentDesigner, index)}
        alt={currentDesigner.name}
        className="absolute inset-0 w-full h-full object-cover opacity-60"
        style={{ zIndex: 1 }}
      />
      <div
        className="absolute inset-0"
        style={{
          zIndex: 2,
          background: 'linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.65) 100%)'
        }}
      />

      {/* Desktop Navigation */}
      <div className="absolute top-0 left-0 w-full hidden lg:flex justify-between items-center px-8 py-6 z-20">
        <span
          className="text-3xl xl:text-4xl font-extrabold"
          style={{
            fontFamily: "'Montserrat', 'Segoe UI', 'Arial', sans-serif",
            letterSpacing: '2px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <span className="text-yellow-400">FASHION</span>
          <span className="ml-2 text-gray-200 font-light">CONNECT</span>
        </span>
        <div className="flex items-center space-x-6 xl:space-x-8">
          <nav className="flex space-x-6 xl:space-x-10">
            {NAV_LINKS.map(link =>
              link.to.startsWith('/') ? (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-base xl:text-lg font-semibold text-gray-200 transition-colors duration-200 hover:text-yellow-400"
                  style={{ textShadow: '0 1px 4px rgba(0,0,0,0.15)' }}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.to}
                  href={link.to}
                  className="text-base xl:text-lg font-semibold text-gray-200 transition-colors duration-200 hover:text-yellow-400"
                  style={{ textShadow: '0 1px 4px rgba(0,0,0,0.15)' }}
                >
                  {link.label}
                </a>
              )
            )}
          </nav>
          <button
            onClick={toggleLanguage}
            className="flex items-center text-gray-200 hover:text-yellow-400 transition-colors duration-200 text-sm xl:text-base font-medium"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.15)' }}
          >
            <Globe className="inline-block h-4 w-4 xl:h-5 xl:w-5 mr-1" />
            {locale === 'en' ? 'Chichewa' : 'English'}
          </button>
          {user ? (
            <Link
              to={getDashboardUrl()}
              className="inline-flex items-center px-3 xl:px-4 py-2 border border-transparent text-sm xl:text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-yellow-400 hover:text-primary-700 transition-colors duration-200"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center px-3 xl:px-4 py-2 border border-transparent text-sm xl:text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-yellow-400 hover:text-primary-700 transition-colors duration-200"
              >
                <LogIn className="mr-1 xl:mr-2 h-4 w-4 xl:h-5 xl:w-5" />
                Log in
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center px-3 xl:px-4 py-2 border border-transparent text-sm xl:text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-yellow-400 hover:text-primary-700 transition-colors duration-200"
              >
                <UserPlus className="mr-1 xl:mr-2 h-4 w-4 xl:h-5 xl:w-5" />
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="absolute top-0 left-0 w-full flex lg:hidden justify-between items-center px-4 py-4 z-20">
        <span
          className="text-xl sm:text-2xl font-extrabold"
          style={{
            fontFamily: "'Montserrat', 'Segoe UI', 'Arial', sans-serif",
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <span className="text-yellow-400">FASHION</span>
          <span className="ml-1 text-gray-200 font-light">CONNECT</span>
        </span>
        <button
          type="button"
          className="bg-black bg-opacity-30 rounded-md p-2 inline-flex items-center justify-center text-gray-200 hover:text-yellow-400 hover:bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-yellow-400"
          onClick={() => setIsMenuOpen(true)}
        >
          <span className="sr-only">Open menu</span>
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-50 lg:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-75" onClick={() => setIsMenuOpen(false)} />
        <div className="fixed top-0 right-0 w-full max-w-sm h-full bg-white shadow-xl">
          <div className="flex items-center justify-between p-4 border-b">
            <span className="text-xl font-bold text-primary-900">FashionConnect</span>
            <button
              type="button"
              className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="px-4 py-6 space-y-6">
            <nav className="space-y-4">
              {NAV_LINKS.map(link =>
                link.to.startsWith('/') ? (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="block text-base font-medium text-gray-900 hover:text-primary-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.to}
                    href={link.to}
                    className="block text-base font-medium text-gray-900 hover:text-primary-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                )
              )}
            </nav>
            <button
              onClick={() => {
                toggleLanguage();
                setIsMenuOpen(false);
              }}
              className="flex items-center text-base font-medium text-gray-900 hover:text-primary-600"
            >
              <Globe className="inline-block h-5 w-5 mr-2" />
              {locale === 'en' ? 'Switch to Chichewa' : 'Switch to English'}
            </button>
            <div className="space-y-3 pt-4 border-t">
              {user ? (
                <Link
                  to={getDashboardUrl()}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('auth.register')}
                  </Link>
                  <Link
                    to="/login"
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('auth.login')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full text-center px-4 pt-20 lg:pt-24">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold drop-shadow-lg max-w-5xl">
          <span className="text-yellow-400 block">Connect with Malawi's</span>
          <span className="text-white block">Top Fashion Designers</span>
        </h1>
        <p className="mt-4 text-lg sm:text-xl lg:text-2xl text-white font-medium drop-shadow-lg max-w-4xl">
          Custom designs, ready-to-wear fashion, and traditional Malawian clothing<br className="hidden sm:block" />
          <span className="sm:hidden"> </span>all in one place.
        </p>
        <div className="mt-8 lg:mt-10 flex flex-col items-center">
          <span className="text-xl sm:text-2xl lg:text-3xl text-white font-semibold drop-shadow-lg">{currentDesigner.name}</span>
          <span className="text-base sm:text-lg text-white opacity-90">{currentDesigner.specialty || 'Fashion Designer'}</span>
          {currentDesigner.location && (
            <span className="text-sm sm:text-base text-white opacity-75 mt-1">{currentDesigner.location}</span>
          )}
          <div className="mt-2 flex items-center justify-center flex-wrap">
            <div className="flex">
              {[0, 1, 2, 3, 4].map((rating) => (
                <Star
                  key={rating}
                  className={`h-5 w-5 sm:h-6 sm:w-6 ${rating < (currentDesigner.rating || 5) ? 'text-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <p className="ml-2 sm:ml-3 text-base sm:text-lg text-white">
              {currentDesigner.reviewCount || 0} reviews
            </p>
          </div>
          <div className="mt-6 lg:mt-8">
            <Link
              to={`/designers/${currentDesigner._id}`}
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-base sm:text-lg font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
            >
              View Portfolio
              <ChevronRight className="ml-1 sm:ml-2 -mr-1 h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </div>
        </div>

        {/* Carousel Indicators */}
        {designers.length > 1 && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
            <div className="flex space-x-2">
              {designers.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setIndex(idx)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    idx === index
                      ? 'bg-yellow-400 scale-110'
                      : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                  }`}
                  aria-label={`View designer ${idx + 1}`}
                />
              ))}
            </div>
            <div className="text-center mt-2">
              <span className="text-white text-xs opacity-75">
                {index + 1} of {designers.length} featured designers
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

const LandingPage = () => {
  const { user } = useAuth();

  // Redirect designers to their dashboard
  if (user && user.role === UserRole.DESIGNER) {
    return <Navigate to="/designer" replace />;
  }

  // Product states
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [superDeals, setSuperDeals] = useState<Product[]>([]);
  const [randomProducts, setRandomProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Category states
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Designer states
  const [featuredDesigners, setFeaturedDesigners] = useState<CarouselDesigner[]>([]);
  const [designersLoading, setDesignersLoading] = useState(true);

  // Fetch categories with product counts
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      console.log('🔄 Setting up main category groups consistent with navigation...');

      // Define main category groups that align with navigation
      const mainCategories = [
        'Men', 'Women', 'Kids', 'Accessories', 'Traditional Wear', 'Formal Wear'
      ];

      try {
        // Try to get product counts from API for accurate counts
        const categoryStats = await productService.getCategoryStats();
        console.log('📊 API Category Stats:', categoryStats);
        
        const categoriesWithCounts = mainCategories.map((categoryName) => {
          // Calculate product count for main category groups
          let productCount = 0;
          if (categoryStats && categoryStats.length > 0) {
            switch(categoryName) {
              case 'Men':
                // Sum all men's categories
                productCount = categoryStats
                  .filter(stat => stat.category.toLowerCase().includes('men'))
                  .reduce((sum, stat) => sum + stat.productCount, 0);
                break;
              case 'Women':
                // Sum all women's categories
                productCount = categoryStats
                  .filter(stat => stat.category.toLowerCase().includes('women'))
                  .reduce((sum, stat) => sum + stat.productCount, 0);
                break;
              case 'Kids':
                // Sum all kids/children categories
                productCount = categoryStats
                  .filter(stat => stat.category.toLowerCase().includes('kids') || stat.category.toLowerCase().includes('children'))
                  .reduce((sum, stat) => sum + stat.productCount, 0);
                break;
              default:
                // For exact match categories like Accessories, Traditional Wear, etc.
                const exactMatch = categoryStats.find(stat => stat.category === categoryName);
                productCount = exactMatch ? exactMatch.productCount : 0;
            }
          }

          return {
            id: categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            name: categoryName,
            description: categoryDescriptions[categoryName] || `Explore our ${categoryName.toLowerCase()} collection`,
            image: categoryImages[categoryName] || categoryImages['Men'],
            productCount: productCount,
            slug: categoryName
          };
        });

        setCategories(categoriesWithCounts);
        console.log('✅ Main categories set with counts:', categoriesWithCounts);
      } catch (apiError) {
        console.log('⚠️ API error, using main categories without counts');
        
        // Fallback: Use main categories without API counts
        const categoriesWithoutCounts = mainCategories.map((categoryName) => ({
          id: categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: categoryName,
          description: categoryDescriptions[categoryName] || `Explore our ${categoryName.toLowerCase()} collection`,
          image: categoryImages[categoryName] || categoryImages['Men'],
          productCount: 0,
          slug: categoryName
        }));

        setCategories(categoriesWithoutCounts);
        console.log('✅ Main categories set without counts:', categoriesWithoutCounts.length);
      }
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      // Fallback to default categories
      const fallbackCategories = [
        'Men', 'Women', 'Kids', 'Accessories', 'Traditional Wear', 'Formal Wear'
      ].map(name => ({
        id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name,
        description: categoryDescriptions[name] || `Explore our ${name.toLowerCase()} collection`,
        image: categoryImages[name] || categoryImages['Men'],
        productCount: 0,
        slug: name
      }));
      setCategories(fallbackCategories);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Fetch featured designers
  const fetchDesigners = async () => {
    try {
      setDesignersLoading(true);
      console.log('🔄 Fetching designers from API...');

      const designersResponse = await designerService.getDesigners({
        page: 1,
        limit: 8,
        sortBy: 'rating',
        sortType: 'desc'
      });

      const transformedDesigners = designersResponse.docs.map((designer, index) => ({
        _id: designer._id,
        name: designer.name,
        businessName: designer.businessName,
        specialty: designer.specialty || 'Fashion Designer',
        profileImage: designer.profileImage || defaultDesignerImages[index % defaultDesignerImages.length],
        bio: designer.bio,
        location: designer.location || 'Malawi',
        rating: designer.rating || 5,
        reviewCount: designer.reviewCount || 0
      }));

      setFeaturedDesigners(transformedDesigners);
      console.log('✅ Designers fetched:', transformedDesigners.length);
    } catch (error) {
      console.error('❌ Error fetching designers:', error);
      setFeaturedDesigners([]);
    } finally {
      setDesignersLoading(false);
    }
  };

  // Fetch products on component mount with sequential loading to reduce server load
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        console.log('🔄 Fetching products from API...');

        // Fetch different types of products sequentially to avoid overwhelming the server
        try {
          const newProductsResponse = await productService.getProducts({ page: 1, limit: 4, sortBy: 'createdAt', sortType: 'desc' });
          setNewProducts(newProductsResponse.docs?.length > 0 ? newProductsResponse.docs.map(transformProduct) : mockNewProducts);
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const dealsResponse = await productService.getProducts({ page: 1, limit: 6, hasDiscount: true, sortBy: 'discountPrice', sortType: 'asc' });
          setSuperDeals(dealsResponse.docs?.length > 0 ? dealsResponse.docs.map(transformProduct) : mockSuperDeals);
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const randomResponse = await productService.getProducts({ page: 1, limit: 8, sortBy: 'rating', sortType: 'desc' });
          setRandomProducts(randomResponse.docs?.length > 0 ? randomResponse.docs.map(transformProduct) : mockRandomProducts);
          
          console.log('✅ Products fetched successfully');
        } catch (apiError) {
          console.warn('⚠️ API error, using fallback data:', apiError);
          // Use mock data as fallback
          setNewProducts(mockNewProducts);
          setSuperDeals(mockSuperDeals);
          setRandomProducts(mockRandomProducts);
        }

      } catch (err) {
        console.error('❌ Error fetching products:', err);
        // Use mock data as fallback
        setNewProducts(mockNewProducts);
        setSuperDeals(mockSuperDeals);
        setRandomProducts(mockRandomProducts);
      } finally {
        setProductsLoading(false);
      }
    };

    // Load data sequentially with delays to prevent server overload
    const loadDataSequentially = async () => {
      // Start with categories (fastest)
      await fetchCategories();
      
      // Small delay before next batch
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Then fetch products
      await fetchProducts();
      
      // Small delay before next batch
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Finally fetch designers
      await fetchDesigners();
    };

    loadDataSequentially();
  }, []);

  return (
    <div className="bg-white">
      <main>
        {/* Designer carousel fills the hero area */}
        <DesignerCarousel />

        {/* Browse by Category Section */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-4">
                Browse by Category
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Explore live collections with rotating products from each category
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categoriesLoading ? (
                // Loading skeleton
                [...Array(4)].map((_, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-300" />
                    <div className="p-6">
                      <div className="h-4 bg-gray-300 rounded mb-2" />
                      <div className="h-3 bg-gray-300 rounded mb-3" />
                      <div className="h-3 bg-gray-300 rounded w-1/2" />
                    </div>
                  </div>
                ))
              ) : (
                categories.map((category) => (
                  <RotatingCategoryCard key={category.id} category={category} />
                ))
              )}
            </div>
          </div>
        </section>

        {/* Explore Designers Section */}
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-4">
                <Scissors className="inline-block mr-3 h-8 w-8 text-yellow-500" />
                Explore Designers
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Meet our talented designers and explore their unique collections
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {designersLoading ? (
                // Loading skeleton
                [...Array(8)].map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-300" />
                    <div className="p-4">
                      <div className="h-3 bg-gray-300 rounded mb-2" />
                      <div className="h-4 bg-gray-300 rounded mb-2" />
                      <div className="h-3 bg-gray-300 rounded mb-3" />
                      <div className="h-8 bg-gray-300 rounded" />
                    </div>
                  </div>
                ))
              ) : (
                featuredDesigners.map((designer) => (
                  <DesignerCard key={designer._id} designer={designer} />
                ))
              )}
            </div>
            {!designersLoading && featuredDesigners.length > 0 && (
              <div className="text-center mt-12">
                <Link
                  to="/client/designers"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-black bg-yellow-400 hover:bg-yellow-500 transition-colors duration-200"
                >
                  View All Designers
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* New Products Section */}
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-4">
                  <TrendingUp className="inline-block mr-3 h-8 w-8 text-green-500" />
                  New Arrivals
                </h2>
                <p className="text-lg text-gray-600">
                  Fresh designs from our talented creators
                </p>
              </div>
              <Link
                to="/client/browse?filter=new"
                className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
              >
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
              {productsLoading ? (
                // Loading skeleton
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-md shadow-sm border border-gray-300 overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-300"></div>
                    <div className="p-2">
                      <div className="bg-gray-300 h-3 rounded mb-1"></div>
                      <div className="bg-gray-300 h-3 rounded w-3/4"></div>
                    </div>
                  </div>
                ))
              ) : (
                newProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-md shadow-sm border border-gray-300 overflow-hidden hover:shadow-lg hover:border-yellow-400 transition-all duration-200">
                    {/* Product Image */}
                    <div className="relative aspect-square">
                      <img
                        src={getProductImageUrl(product.images?.[0])}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />

                      {/* Discount Badge */}
                      {product.discount && (
                        <div className="absolute top-1 left-1 bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded">
                          -{product.discount}%
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-2">
                      {/* Product Name */}
                      <h3 className="text-xs font-medium text-gray-900 line-clamp-2 mb-1">
                        <Link to={`/client/product/${product.id}`} className="hover:text-yellow-600">
                          {product.name}
                        </Link>
                      </h3>

                      {/* Designer */}
                      <p className="text-xs text-gray-600 mb-1">
                        by <Link
                          to={`/client/designer/${product.designer.id}`}
                          className="font-medium text-primary-600 hover:text-primary-700"
                        >
                          {product.designer.name}
                        </Link>
                      </p>

                      {/* Rating */}
                      <div className="flex items-center mt-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-2.5 w-2.5 ${
                                i < Math.floor(product.rating || 0)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 ml-1">
                          ({product.reviewCount || 0})
                        </span>
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center space-x-1">
                          <span className="font-semibold text-gray-900 text-xs">
                            MWK {(product.discountPrice || product.price).toLocaleString()}
                          </span>
                          {product.discountPrice && (
                            <span className="text-xs text-gray-500 line-through">
                              MWK {product.price.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Add to Cart / Custom Order Button */}
                      <button
                        onClick={() => product.customizable ? {} : {}}
                        disabled={!product.inStock && !product.customizable}
                        className={`w-full mt-2 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                          product.customizable
                            ? 'bg-black hover:bg-gray-800 text-yellow-400'
                            : product.inStock
                              ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                              : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        }`}
                      >
                        {product.customizable ? (
                          'Custom Order'
                        ) : product.inStock ? (
                          'Add to Cart'
                        ) : (
                          'Out of Stock'
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Super Deals Section */}
        <section className="bg-gradient-to-r from-red-50 to-pink-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-4">
                <Zap className="inline-block mr-3 h-8 w-8 text-yellow-500" />
                Super Deals
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Limited time offers on premium fashion pieces
              </p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
              {superDeals.map((product) => (
                <div key={product.id} className="bg-white rounded-md shadow-sm border border-gray-300 overflow-hidden hover:shadow-lg hover:border-yellow-400 transition-all duration-200">
                  {/* Product Image */}
                  <div className="relative aspect-square">
                    <img
                      src={getProductImageUrl(product.images?.[0])}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />

                    {/* Discount Badge */}
                    {product.discount && (
                      <div className="absolute top-1 left-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                        -{product.discount}%
                      </div>
                    )}

                    {/* Super Deal Badge */}
                    <div className="absolute top-1 right-1 bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded">
                      DEAL
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-2">
                    {/* Product Name */}
                    <h3 className="text-xs font-medium text-gray-900 line-clamp-2 mb-1">
                      <Link to={`/client/product/${product.id}`} className="hover:text-yellow-600">
                        {product.name}
                      </Link>
                    </h3>

                    {/* Designer */}
                    <p className="text-xs text-gray-600 mb-1">
                      by <Link
                        to={`/client/designer/${product.designer.id}`}
                        className="font-medium text-primary-600 hover:text-primary-700"
                      >
                        {product.designer.name}
                      </Link>
                    </p>

                    {/* Rating */}
                    <div className="flex items-center mt-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-2.5 w-2.5 ${
                              i < Math.floor(product.rating || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 ml-1">
                        ({product.reviewCount || 0})
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center space-x-1">
                        <span className="font-semibold text-red-600 text-xs">
                          MWK {(product.discountPrice || product.price).toLocaleString()}
                        </span>
                        {product.discountPrice && (
                          <span className="text-xs text-gray-500 line-through">
                            MWK {product.price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Add to Cart / Custom Order Button */}
                    <button
                      onClick={() => product.customizable ? {} : {}}
                      disabled={!product.inStock && !product.customizable}
                      className={`w-full mt-2 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                        product.customizable
                          ? 'bg-black hover:bg-gray-800 text-yellow-400'
                          : product.inStock
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {product.customizable ? (
                        'Custom Order'
                      ) : product.inStock ? (
                        'Add to Cart'
                      ) : (
                        'Out of Stock'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                to="/client/browse?filter=deals"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 transition-colors duration-200"
              >
                View All Deals
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* AI-Powered Recommendations */}
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ProductRecommendations
              title="Recommended for You"
              limit={6}
              showPersonalized={true}
            />
          </div>
        </section>

        {/* Featured designers */}
        <div className="bg-white py-16" id="designers">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Featured Designers</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Meet Malawi's top fashion talents
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                Our platform features verified designers who bring Malawian fashion to the world stage.
              </p>
            </div>
            <div className="mt-10 text-center">
              <Link
                to="/register"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Join as a Designer
                <ChevronRight className="ml-2 -mr-1 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Random Products Section */}
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-4">
                Discover More
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Explore our diverse collection of fashion pieces from talented designers across Malawi
              </p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
              {randomProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-md shadow-sm border border-gray-300 overflow-hidden hover:shadow-lg hover:border-yellow-400 transition-all duration-200">
                  {/* Product Image */}
                  <div className="relative aspect-square">
                    <img
                      src={getProductImageUrl(product.images?.[0])}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />

                    {/* Discount Badge */}
                    {product.discount && (
                      <div className="absolute top-1 left-1 bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded">
                        -{product.discount}%
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-2">
                    {/* Product Name */}
                    <h3 className="text-xs font-medium text-gray-900 line-clamp-2 mb-1">
                      <Link to={`/client/product/${product.id}`} className="hover:text-yellow-600">
                        {product.name}
                      </Link>
                    </h3>

                    {/* Designer */}
                    <p className="text-xs text-gray-600 mb-1">
                      by <Link
                        to={`/client/designer/${product.designer.id}`}
                        className="font-medium text-primary-600 hover:text-primary-700"
                      >
                        {product.designer.name}
                      </Link>
                    </p>

                    {/* Rating */}
                    <div className="flex items-center mt-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-2.5 w-2.5 ${
                              i < Math.floor(product.rating || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 ml-1">
                        ({product.reviewCount || 0})
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center space-x-1">
                        <span className="font-semibold text-gray-900 text-xs">
                          MWK {(product.discountPrice || product.price).toLocaleString()}
                        </span>
                        {product.discountPrice && (
                          <span className="text-xs text-gray-500 line-through">
                            MWK {product.price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Add to Cart / Custom Order Button */}
                    <button
                      onClick={() => product.customizable ? {} : {}}
                      disabled={!product.inStock && !product.customizable}
                      className={`w-full mt-2 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                        product.customizable
                          ? 'bg-black hover:bg-gray-800 text-yellow-400'
                          : product.inStock
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                            : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {product.customizable ? (
                        'Custom Order'
                      ) : product.inStock ? (
                        'Add to Cart'
                      ) : (
                        'Out of Stock'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link
                to="/client/browse"
                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 transition-colors duration-200"
              >
                Browse All Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA section */}
        <div className="bg-primary-700">
          <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              <span className="block">Ready to transform your fashion experience?</span>
              <span className="block">Join FashionConnect today.</span>
            </h2>
            <p className="mt-4 text-lg leading-6 text-primary-200">
              Connect with designers, shop unique fashion pieces, and celebrate Malawian style.
            </p>
            <div className="mt-8 flex justify-center">
              <div className="inline-flex rounded-md shadow">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50"
                >
                  Sign up for free
                </Link>
              </div>
              <div className="ml-3 inline-flex">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-800"
                >
                  Log in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-8 md:col-span-2">
              <div className="flex items-center">
                <Scissors className="h-8 w-8 text-white" />
                <span className="ml-2 text-xl font-bold text-white">FashionConnect</span>
              </div>
              <p className="text-gray-400">
                Connecting Malawi's fashion designers with clients locally and globally.
              </p>
              <div className="flex space-x-6">
                {/* Social links would go here */}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Resources
              </h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="#" className="text-base text-gray-300 hover:text-white">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-300 hover:text-white">
                    Designer Guidelines
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-300 hover:text-white">
                    Measurement Guide
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-300 hover:text-white">
                    Shipping & Returns
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Company
              </h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="#" className="text-base text-gray-300 hover:text-white">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-300 hover:text-white">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-300 hover:text-white">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-300 hover:text-white">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-700 pt-8">
            <p className="text-center text-base text-gray-400">
              &copy; 2025 FashionConnect. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      <TestimonialPopup />
    </div>
  );
};

export default LandingPage;
 