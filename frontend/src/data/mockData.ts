import  { Product, UserRole, UserStatus, OrderStatus } from '../types';

// Mock products for the browse page
export const mockProducts: Product[] = [
  {
    id: 'prod1',
    name: 'Traditional Chitenge Dress',
    description: 'Elegant traditional Malawian dress made with authentic chitenge fabric. Perfect for formal events and celebrations.',
    price: 25000,
    discountPrice: 22500,
    images: [
      'https://images.unsplash.com/photo-1484327973588-c31f829103fe?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwZmFzaGlvbiUyMG1hbGF3aSUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax',
      'https://images.unsplash.com/photo-1512068312404-09a183f541eb?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw2fHxhZnJpY2FuJTIwZmFzaGlvbiUyMG1hbGF3aSUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax'
    ],
    category: 'Women',
    subcategory: 'Dresses',
    tags: ['chitenge', 'traditional', 'formal', 'cultural'],
    designer: {
      id: 'designer1',
      name: 'Thoko Banda',
      rating: 4.8
    },
    sizes: ['S', 'M', 'L', 'XL', 'Custom'],
    colors: ['Blue/Green', 'Red/Black', 'Yellow/Brown'],
    materials: ['Cotton', 'Chitenge'],
    inStock: true,
    stockQuantity: 8,
    rating: 4.7,
    reviewCount: 23,
    createdAt: '2025-01-15T08:30:00Z',
    updatedAt: '2025-05-20T14:15:00Z',
    featured: true,
    customizable: true
  },
  {
    id: 'prod2',
    name: 'Modern African Print Blazer',
    description: 'Contemporary blazer featuring traditional African prints. Perfect for making a statement at professional events.',
    price: 35000,
    images: [
      'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwyfHxhZnJpY2FuJTIwZmFzaGlvbiUyMG1hbGF3aSUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax',
      'https://images.unsplash.com/photo-1472417583565-62e7bdeda490?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw1fHxhZnJpY2FuJTIwZmFzaGlvbiUyMG1hbGF3aSUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax'
    ],
    category: 'Men',
    subcategory: 'Jackets',
    tags: ['modern', 'professional', 'formal', 'print'],
    designer: {
      id: 'designer2',
      name: 'Mphatso Gondwe',
      rating: 4.9
    },
    sizes: ['M', 'L', 'XL', 'XXL', 'Custom'],
    colors: ['Blue', 'Black', 'Green'],
    materials: ['Cotton', 'Polyester'],
    inStock: true,
    stockQuantity: 5,
    rating: 4.9,
    reviewCount: 17,
    createdAt: '2025-02-10T10:15:00Z',
    updatedAt: '2025-06-05T09:30:00Z',
    featured: true,
    customizable: true
  },
  {
    id: 'prod3',
    name: 'Handcrafted Beaded Necklace Set',
    description: 'Exquisite handcrafted beaded necklace set featuring traditional Malawian designs. Each piece is unique and made with love.',
    price: 12000,
    discountPrice: 10000,
    images: [
      'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwzfHxhZnJpY2FuJTIwZmFzaGlvbiUyMG1hbGF3aSUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax'
    ],
    category: 'Accessories',
    subcategory: 'Jewelry',
    tags: ['handcrafted', 'beaded', 'traditional', 'accessories'],
    designer: {
      id: 'designer3',
      name: 'Grace Mbewe',
      rating: 4.7
    },
    colors: ['Multicolor', 'Earth Tones', 'Vibrant'],
    materials: ['Glass Beads', 'Wood', 'Natural Fibers'],
    inStock: true,
    stockQuantity: 15,
    rating: 4.8,
    reviewCount: 32,
    createdAt: '2025-01-05T14:20:00Z',
    updatedAt: '2025-05-12T11:45:00Z',
    featured: false,
    customizable: false
  },
  {
    id: 'prod4',
    name: 'Custom Tailored Men\'s Suit',
    description: 'Premium custom tailored suit combining modern style with traditional African elements. Made with high-quality materials for durability and comfort.',
    price: 75000,
    images: [
      'https://images.unsplash.com/photo-1592878940526-0214b0f374f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw4fHxhZnJpY2FuJTIwZmFzaGlvbiUyMG1hbGF3aSUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax'
    ],
    category: 'Men',
    subcategory: 'Suits',
    tags: ['custom', 'tailored', 'formal', 'premium', 'wedding'],
    designer: {
      id: 'designer1',
      name: 'Thoko Banda',
      rating: 4.8
    },
    sizes: ['Custom Only'],
    colors: ['Navy', 'Black', 'Grey', 'Custom'],
    materials: ['Wool', 'Cotton', 'Silk'],
    inStock: true,
    stockQuantity: 999, // Indicates made-to-order
    rating: 5.0,
    reviewCount: 28,
    createdAt: '2025-03-20T09:45:00Z',
    updatedAt: '2025-06-15T16:30:00Z',
    featured: true,
    customizable: true
  },
  {
    id: 'prod5',
    name: 'Traditional Wedding Attire Set',
    description: 'Complete traditional wedding attire set for couples, featuring matching outfits made with premium materials and intricate detailing.',
    price: 120000,
    discountPrice: 105000,
    images: [
      'https://images.unsplash.com/photo-1450297166380-cabe503887e5?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw3fHxhZnJpY2FuJTIwZmFzaGlvbiUyMG1hbGF3aSUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax',
      'https://images.unsplash.com/photo-1485518882345-15568b007407?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw0fHxhZnJpY2FuJTIwZmFzaGlvbiUyMG1hbGF3aSUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax'
    ],
    category: 'Wedding',
    subcategory: 'Attire Sets',
    tags: ['wedding', 'traditional', 'premium', 'custom', 'set'],
    designer: {
      id: 'designer2',
      name: 'Mphatso Gondwe',
      rating: 4.9
    },
    sizes: ['Custom Only'],
    colors: ['Traditional', 'Modern Fusion', 'Custom'],
    materials: ['Silk', 'Cotton', 'Premium Chitenge', 'Beads'],
    inStock: true,
    stockQuantity: 999, // Indicates made-to-order
    rating: 4.9,
    reviewCount: 12,
    createdAt: '2025-01-25T11:30:00Z',
    updatedAt: '2025-06-02T14:20:00Z',
    featured: true,
    customizable: true
  },
  {
    id: 'prod6',
    name: 'Modern African Print Skirt',
    description: 'Stylish modern skirt featuring vibrant African prints. Versatile design suitable for both casual and semi-formal occasions.',
    price: 18000,
    images: [
      'https://images.unsplash.com/photo-1512068312404-09a183f541eb?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw2fHxhZnJpY2FuJTIwZmFzaGlvbiUyMG1hbGF3aSUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax'
    ],
    category: 'Women',
    subcategory: 'Skirts',
    tags: ['modern', 'print', 'casual', 'versatile'],
    designer: {
      id: 'designer3',
      name: 'Grace Mbewe',
      rating: 4.7
    },
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'Custom'],
    colors: ['Blue/Orange', 'Green/Yellow', 'Purple/Pink'],
    materials: ['Cotton', 'Wax Print'],
    inStock: true,
    stockQuantity: 20,
    rating: 4.6,
    reviewCount: 15,
    createdAt: '2025-04-05T10:30:00Z',
    updatedAt: '2025-06-10T08:45:00Z',
    featured: false,
    customizable: true
  }
];

// Mock designers
export const mockDesigners = [
  {
    id: 'designer1',
    name: 'Thoko Banda',
    bio: 'Award-winning fashion designer specializing in modern interpretations of traditional Malawian attire. With over 15 years of experience, Thoko combines authentic cultural elements with contemporary styles.',
    specialty: 'Contemporary Chitenge Fusion',
    location: 'Lilongwe, Malawi',
    rating: 4.8,
    reviewCount: 124,
    verified: true,
    featured: true,
    joinDate: '2020-05-12T00:00:00Z',
    profileImage: 'https://images.unsplash.com/photo-1472417583565-62e7bdeda490?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw1fHxhZnJpY2FuJTIwZmFzaGlvbiUyMG1hbGF3aSUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax',
    portfolioImages: [
      'https://images.unsplash.com/photo-1484327973588-c31f829103fe?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwZmFzaGlvbiUyMG1hbGF3aSUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax',
      'https://images.unsplash.com/photo-1592878940526-0214b0f374f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
    ],
    productCount: 45,
    customOrdersAvailable: true,
    turnaroundTime: '2-3 weeks',
    contactEmail: 'thoko.banda@example.com'
  },
  {
    id: 'designer2',
    name: 'Mphatso Gondwe',
    bio: 'Innovative fashion designer known for blending modern urban styles with traditional African elements. Mphatso creates unique pieces that tell stories through fabric and design.',
    specialty: 'Modern Urban Styles',
    location: 'Blantyre, Malawi',
    rating: 4.9,
    reviewCount: 98,
    verified: true,
    featured: true,
    joinDate: '2021-02-18T00:00:00Z',
    profileImage: 'https://images.unsplash.com/photo-1512068312404-09a183f541eb?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw2fHxhZnJpY2FuJTIwZmFzaGlvbiUyMG1hbGF3aSUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax',
    portfolioImages: [
      'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwyfHxhZnJpY2FuJTIwZmFzaGlvbiUyMG1hbGF3aSUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax',
      'https://images.unsplash.com/photo-1450297166380-cabe503887e5?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw3fHxhZnJpY2FuJTIwZmFzaGlvbiUyMG1hbGF3aSUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax'
    ],
    productCount: 37,
    customOrdersAvailable: true,
    turnaroundTime: '3-4 weeks',
    contactEmail: 'mphatso.gondwe@example.com'
  },
  {
    id: 'designer3',
    name: 'Grace Mbewe',
    bio: 'Specialized in traditional craftsmanship and accessories, Grace creates authentic Malawian fashion pieces that honor cultural heritage while embracing contemporary sensibilities.',
    specialty: 'Traditional Craftsmanship',
    location: 'Zomba, Malawi',
    rating: 4.7,
    reviewCount: 75,
    verified: true,
    featured: true,
    joinDate: '2020-10-05T00:00:00Z',
    profileImage: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    portfolioImages: [
      'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwzfHxhZnJpY2FuJTIwZmFzaGlvbiUyMG1hbGF3aSUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax',
      'https://images.unsplash.com/photo-1485518882345-15568b007407?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw0fHxhZnJpY2FuJTIwZmFzaGlvbiUyMG1hbGF3aSUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax'
    ],
    productCount: 52,
    customOrdersAvailable: true,
    turnaroundTime: '1-2 weeks',
    contactEmail: 'grace.mbewe@example.com'
  }
];

// Mock reviews
export const mockReviews = [
  {
    id: 'review1',
    productId: 'prod1',
    userId: 'user1',
    userName: 'Chikondi Banda',
    userAvatar: null,
    rating: 5,
    title: 'Beautiful traditional dress!',
    comment: 'This chitenge dress is absolutely stunning! The quality is excellent, and the craftsmanship is impeccable. It fits perfectly and I received so many compliments when I wore it to my sister\'s wedding. Highly recommend!',
    date: '2025-05-15T14:30:00Z',
    images: [],
    verified: true,
    helpfulCount: 12,
    designerId: 'designer1',
    designerResponse: {
      comment: 'Thank you so much for your kind words! I\'m thrilled to hear that you loved the dress and it was perfect for such a special occasion. Looking forward to creating more pieces for you in the future!',
      date: '2025-05-16T09:15:00Z'
    }
  },
  {
    id: 'review2',
    productId: 'prod2',
    userId: 'user2',
    userName: 'Tiyamike Nkhoma',
    userAvatar: null,
    rating: 4,
    title: 'Great quality, slightly large',
    comment: 'The blazer is beautiful and the fabric is high quality. The only reason I\'m giving 4 stars instead of 5 is that it runs slightly large. I would recommend ordering a size down. Otherwise, it\'s a wonderful piece that I\'ll be wearing to many professional events.',
    date: '2025-04-20T10:45:00Z',
    images: [],
    verified: true,
    helpfulCount: 8,
    designerId: 'designer2',
    designerResponse: {
      comment: 'Thank you for your feedback! I appreciate the sizing information, and I\'ll update the product description to help future customers. I\'m glad you\'re enjoying the blazer otherwise!',
      date: '2025-04-21T13:20:00Z'
    }
  },
  {
    id: 'review3',
    productId: 'prod3',
    userId: 'user3',
    userName: 'Kondwani Phiri',
    userAvatar: null,
    rating: 5,
    title: 'Exquisite craftsmanship',
    comment: 'These beaded necklaces are absolutely beautiful! Each piece is unique and the attention to detail is impressive. They make wonderful gifts, and I\'ve already ordered more for friends and family.',
    date: '2025-03-12T16:15:00Z',
    images: [],
    verified: true,
    helpfulCount: 5,
    designerId: 'designer3'
  },
  {
    id: 'review4',
    productId: 'prod4',
    userId: 'user4',
    userName: 'Grace Mbewe',
    userAvatar: null,
    rating: 5,
    title: 'Perfect wedding suit',
    comment: 'I ordered this custom suit for my wedding and it exceeded all expectations. The designer took my measurements perfectly and the result was a suit that fit like it was made for me (which it was!). The quality is outstanding and the fusion of modern style with traditional elements made it truly unique. I received countless compliments on my wedding day.',
    date: '2025-02-28T11:30:00Z',
    images: [],
    verified: true,
    helpfulCount: 15,
    designerId: 'designer1',
    designerResponse: {
      comment: 'Thank you so much for your wonderful review! It was an honor to create your wedding suit, and I\'m thrilled that it played a part in making your special day even more memorable. Congratulations again on your marriage!',
      date: '2025-03-01T09:45:00Z'
    }
  }
];

// Mock orders for client dashboard
export const mockOrders = [
  {
    id: 'ORD12345',
    userId: 'user1',
    items: [
      {
        id: 'prod1',
        name: 'Traditional Chitenge Dress',
        price: 22500,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1484327973588-c31f829103fe?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwZmFzaGlvbiUyMG1hbGF3aSUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax'
      }
    ],
    status: OrderStatus.DELIVERED,
    totalAmount: 22500,
    shippingAddress: {
      street: '123 Chilembwe Road',
      city: 'Lilongwe',
      country: 'Malawi',
      zipCode: '101010',
      phone: '+265 88 123 4567'
    },
    paymentMethod: 'Mpamba',
    paymentStatus: 'Paid',
    shippingMethod: 'Standard Delivery',
    trackingNumber: 'TRACK123456',
    notes: '',
    createdAt: '2025-11-20T10:15:00Z',
    updatedAt: '2025-11-28T15:30:00Z',
    deliveredAt: '2025-11-28T15:30:00Z',
    designerId: 'designer1',
    designerName: 'Thoko Banda',
    isCustomOrder: false
  },
  {
    id: 'ORD12346',
    userId: 'user1',
    items: [
      {
        id: 'prod2',
        name: 'Modern African Print Blazer',
        price: 35000,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwyfHxhZnJpY2FuJTIwZmFzaGlvbiUyMG1hbGF3aSUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax'
      }
    ],
    status: OrderStatus.PENDING,
    totalAmount: 35000,
    shippingAddress: {
      street: '123 Chilembwe Road',
      city: 'Lilongwe',
      country: 'Malawi',
      zipCode: '101010',
      phone: '+265 88 123 4567'
    },
    paymentMethod: 'Mpamba',
    paymentStatus: 'Pending',
    shippingMethod: 'Express Delivery',
    notes: '',
    createdAt: '2025-12-05T14:30:00Z',
    updatedAt: '2025-12-05T14:30:00Z',
    designerId: 'designer2',
    designerName: 'Mphatso Gondwe',
    isCustomOrder: false
  },
  {
    id: 'ORD12347',
    userId: 'user1',
    items: [
      {
        id: 'custom1',
        name: 'Custom Wedding Attire',
        price: 85000,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1450297166380-cabe503887e5?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw3fHxhZnJpY2FuJTIwZmFzaGlvbiUyMG1hbGF3aSUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax'
      }
    ],
    status: OrderStatus.PROCESSING,
    totalAmount: 85000,
    shippingAddress: {
      street: '123 Chilembwe Road',
      city: 'Lilongwe',
      country: 'Malawi',
      zipCode: '101010',
      phone: '+265 88 123 4567'
    },
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'Paid',
    shippingMethod: 'Standard Delivery',
    notes: 'Special instructions for wedding attire',
    createdAt: '2025-11-15T09:20:00Z',
    updatedAt: '2025-11-20T11:45:00Z',
    designerId: 'designer1',
    designerName: 'Thoko Banda',
    isCustomOrder: true,
    customDetails: {
      measurements: {
        chest: 100,
        waist: 85,
        hips: 105,
        shoulder: 45,
        height: 180,
        units: 'cm'
      },
      designNotes: 'Traditional wedding attire with modern elements. Navy blue and gold color scheme.',
      referenceImages: ['https://example.com/reference1.jpg', 'https://example.com/reference2.jpg'],
      deadline: '2024-02-15T00:00:00Z'
    }
  }
];

// Mock chats/messages for the messaging interface
export const mockChats = [
  {
    id: 'chat1',
    participants: [
      { id: 'user1', name: 'Chikondi Banda', role: UserRole.CLIENT },
      { id: 'designer1', name: 'Thoko Banda', role: UserRole.DESIGNER }
    ],
    messages: [
      {
        id: 'msg1',
        senderId: 'user1',
        text: 'Hello, I\'m interested in ordering a custom dress for my upcoming graduation ceremony. Do you have availability in the next 6 weeks?',
        timestamp: '2025-11-10T09:15:00Z',
        read: true
      },
      {
        id: 'msg2',
        senderId: 'designer1',
        text: 'Hello Chikondi! Thank you for your interest. Yes, I currently have availability for a custom order with a 6-week timeframe. I\'d be happy to create something special for your graduation. Could you share more details about what you have in mind?',
        timestamp: '2025-11-10T10:30:00Z',
        read: true
      },
      {
        id: 'msg3',
        senderId: 'user1',
        text: 'That\'s great! I\'m looking for a formal dress in chitenge fabric, preferably in blue and green tones to match my school colors. I want something modern but with traditional elements. Would that be possible?',
        timestamp: '2025-11-10T11:45:00Z',
        read: true
      },
      {
        id: 'msg4',
        senderId: 'designer1',
        text: 'Absolutely! That sounds beautiful. I have some lovely blue and green chitenge fabrics that would be perfect for this. I can certainly create a design that balances modern and traditional elements. Do you have any specific styles in mind or reference images you could share?',
        timestamp: '2025-11-10T13:20:00Z',
        read: true
      },
      {
        id: 'msg5',
        senderId: 'user1',
        text: 'I\'ve been looking at A-line dresses with structured bodices. I\'ll send you some reference images later today. Also, how do we proceed with measurements?',
        timestamp: '2025-11-10T14:05:00Z',
        read: true
      },
      {
        id: 'msg6',
        senderId: 'designer1',
        text: 'A-line with a structured bodice sounds perfect for a graduation ceremony - elegant and flattering. For measurements, you can either use our online measurement guide (I\'ll send the link) or if you\'re in Lilongwe, you could come to my studio for an in-person fitting. Looking forward to seeing your reference images!',
        timestamp: '2025-11-10T15:30:00Z',
        read: false
      }
    ],
    lastMessageTimestamp: '2025-11-10T15:30:00Z',
    orderId: null,
    unreadCount: 1
  },
  {
    id: 'chat2',
    participants: [
      { id: 'user1', name: 'Chikondi Banda', role: UserRole.CLIENT },
      { id: 'designer2', name: 'Mphatso Gondwe', role: UserRole.DESIGNER }
    ],
    messages: [
      {
        id: 'msg7',
        senderId: 'designer2',
        text: 'Hello Chikondi! I wanted to follow up about your recent order (Order #ORD12346). Your blazer has been prepared and is ready for shipping. Please confirm your shipping address is still the same as in the order.',
        timestamp: '2025-12-06T10:10:00Z',
        read: true
      },
      {
        id: 'msg8',
        senderId: 'user1',
        text: 'Hi Mphatso! That\'s great news. Yes, the shipping address is still the same. When do you think it will be shipped?',
        timestamp: '2025-12-06T11:25:00Z',
        read: true
      },
      {
        id: 'msg9',
        senderId: 'designer2',
        text: 'Perfect! We\'ll ship it tomorrow morning, and you should receive it within 2-3 business days. I\'ll send you the tracking information once it\'s on its way. Is there anything else you need?',
        timestamp: '2025-12-06T13:40:00Z',
        read: false
      }
    ],
    lastMessageTimestamp: '2025-12-06T13:40:00Z',
    orderId: 'ORD12346',
    unreadCount: 1
  }
];

// Mock data for analytics
export const mockAnalyticsData = {
  designer: {
    revenue: {
      daily: [
        { date: '2025-12-01', amount: 25000 },
        { date: '2025-12-02', amount: 35000 },
        { date: '2025-12-03', amount: 15000 },
        { date: '2025-12-04', amount: 45000 },
        { date: '2025-12-05', amount: 30000 },
        { date: '2025-12-06', amount: 20000 },
        { date: '2025-12-07', amount: 40000 }
      ],
      monthly: [
        { date: '2025-06', amount: 250000 },
        { date: '2025-07', amount: 320000 },
        { date: '2025-08', amount: 280000 },
        { date: '2025-09', amount: 350000 },
        { date: '2025-10', amount: 420000 },
        { date: '2025-11', amount: 380000 },
        { date: '2025-12', amount: 210000 }
      ]
    },
    orders: {
      daily: [
        { date: '2025-12-01', count: 2 },
        { date: '2025-12-02', count: 3 },
        { date: '2025-12-03', count: 1 },
        { date: '2025-12-04', count: 4 },
        { date: '2025-12-05', count: 3 },
        { date: '2025-12-06', count: 2 },
        { date: '2025-12-07', count: 3 }
      ],
      monthly: [
        { date: '2025-06', count: 25 },
        { date: '2025-07', count: 32 },
        { date: '2025-08', count: 28 },
        { date: '2025-09', count: 35 },
        { date: '2025-10', count: 42 },
        { date: '2025-11', count: 38 },
        { date: '2025-12', count: 21 }
      ],
      byStatus: [
        { status: 'pending', count: 5 },
        { status: 'confirmed', count: 8 },
        { status: 'processing', count: 12 },
        { status: 'ready_for_shipping', count: 3 },
        { status: 'shipped', count: 7 },
        { status: 'delivered', count: 45 },
        { status: 'cancelled', count: 2 }
      ]
    },
    products: {
      topSelling: [
        { id: 'prod1', name: 'Traditional Chitenge Dress', count: 15, revenue: 337500 },
        { id: 'prod2', name: 'Modern African Print Blazer', count: 12, revenue: 420000 },
        { id: 'prod4', name: 'Custom Tailored Men\'s Suit', count: 8, revenue: 600000 },
        { id: 'prod6', name: 'Modern African Print Skirt', count: 10, revenue: 180000 },
        { id: 'prod3', name: 'Handcrafted Beaded Necklace Set', count: 18, revenue: 180000 }
      ],
      views: [
        { id: 'prod1', name: 'Traditional Chitenge Dress', views: 450 },
        { id: 'prod2', name: 'Modern African Print Blazer', views: 380 },
        { id: 'prod4', name: 'Custom Tailored Men\'s Suit', views: 320 },
        { id: 'prod5', name: 'Traditional Wedding Attire Set', views: 290 },
        { id: 'prod3', name: 'Handcrafted Beaded Necklace Set', views: 275 }
      ]
    },
    customers: {
      new: [
        { date: '2025-06', count: 12 },
        { date: '2025-07', count: 15 },
        { date: '2025-08', count: 9 },
        { date: '2025-09', count: 18 },
        { date: '2025-10', count: 22 },
        { date: '2025-11', count: 16 },
        { date: '2025-12', count: 10 }
      ],
      returning: {
        count: 45,
        percentage: 35
      }
    },
    summary: {
      totalRevenue: 2210000,
      totalOrders: 221,
      averageOrderValue: 10000,
      productsSold: 315
    }
  },
  admin: {
    platform: {
      users: {
        total: 1250,
        byRole: [
          { role: 'client', count: 1150 },
          { role: 'designer', count: 85 },
          { role: 'admin', count: 15 }
        ],
        growth: [
          { date: '2025-06', count: 45 },
          { date: '2025-07', count: 60 },
          { date: '2025-08', count: 55 },
          { date: '2025-09', count: 75 },
          { date: '2025-10', count: 90 },
          { date: '2025-11', count: 85 },
          { date: '2025-12', count: 40 }
        ]
      },
      transactions: {
        total: 8500000,
        monthly: [
          { date: '2025-06', amount: 950000 },
          { date: '2025-07', amount: 1050000 },
          { date: '2025-08', amount: 980000 },
          { date: '2025-09', amount: 1150000 },
          { date: '2025-10', amount: 1420000 },
          { date: '2025-11', amount: 1580000 },
          { date: '2025-12', amount: 1370000 }
        ],
        byPaymentMethod: [
          { method: 'Mpamba', count: 450, amount: 3825000 },
          { method: 'Airtel Money', count: 380, amount: 3230000 },
          { method: 'Bank Transfer', count: 95, amount: 807500 },
          { method: 'Credit Card', count: 75, amount: 637500 }
        ]
      },
      orders: {
        total: 850,
        byStatus: [
          { status: 'pending', count: 45 },
          { status: 'confirmed', count: 65 },
          { status: 'processing', count: 95 },
          { status: 'ready_for_shipping', count: 35 },
          { status: 'shipped', count: 60 },
          { status: 'delivered', count: 530 },
          { status: 'cancelled', count: 20 }
        ],
        customVsRegular: [
          { type: 'regular', count: 680 },
          { type: 'custom', count: 170 }
        ]
      },
      disputes: {
        total: 35,
        byStatus: [
          { status: 'open', count: 8 },
          { status: 'in_progress', count: 12 },
          { status: 'resolved', count: 10 },
          { status: 'closed', count: 5 }
        ],
        byReason: [
          { reason: 'quality', count: 12 },
          { reason: 'delivery', count: 8 },
          { reason: 'wrong_item', count: 5 },
          { reason: 'damaged', count: 7 },
          { reason: 'not_as_described', count: 3 }
        ]
      },
      verifications: {
        pending: 12,
        approved: 85,
        rejected: 23
      }
    },
    regions: {
      topCities: [
        { city: 'Lilongwe', orders: 325, revenue: 3250000 },
        { city: 'Blantyre', orders: 280, revenue: 2800000 },
        { city: 'Mzuzu', orders: 120, revenue: 1200000 },
        { city: 'Zomba', orders: 85, revenue: 850000 },
        { city: 'Mangochi', orders: 40, revenue: 400000 }
      ]
    },
    summary: {
      totalUsers: 1250,
      totalOrders: 850,
      totalRevenue: 8500000,
      disputeRate: 4.1, // percentage
      averageOrderValue: 10000
    }
  }
};

// Mock data for verifications
export const mockVerificationRequests = [
  {
    id: 'ver1',
    designerId: 'designer4',
    designerName: 'Yamikani Njovu',
    designerEmail: 'yamikani.njovu@example.com',
    designerPhone: '+265 99 123 4567',
    status: 'pending',
    submittedAt: '2025-11-25T10:15:00Z',
    documents: [
      { type: 'id', url: 'https://example.com/documents/id1.jpg' },
      { type: 'business_registration', url: 'https://example.com/documents/business1.pdf' }
    ],
    portfolio: [
      { url: 'https://images.unsplash.com/photo-1484327973588-c31f829103fe?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwZmFzaGlvbiUyMG1hbGF3aSUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax', description: 'Traditional wedding dress' },
      { url: 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwyfHxhZnJpY2FuJTIwZmFzaGlvbiUyMG1hbGF3aSUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax', description: 'Modern formal wear' }
    ],
    specialties: ['Wedding attire', 'Contemporary fashion', 'Traditional fusion'],
    biography: 'Fashion designer with 8 years of experience specializing in wedding attire and formal wear. Combines traditional Malawian elements with contemporary designs.',
    businessName: 'Njovu Designs',
    businessAddress: '45 Victoria Avenue, Blantyre, Malawi',
    socialMedia: {
      instagram: '@njovudesigns',
      facebook: 'NjovuDesigns',
      website: 'https://njovudesigns.com'
    },
    references: [
      { name: 'Chisomo Banda', contact: 'chisomo@example.com', relationship: 'Client' },
      { name: 'Malawi Fashion Week', contact: 'info@mfw.org', relationship: 'Event Organizer' }
    ],
    notes: ''
  },
  {
    id: 'ver2',
    designerId: 'designer5',
    designerName: 'Chimwemwe Mkandawire',
    designerEmail: 'chimwemwe.mk@example.com',
    designerPhone: '+265 88 987 6543',
    status: 'pending',
    submittedAt: '2025-11-28T14:30:00Z',
    documents: [
      { type: 'id', url: 'https://example.com/documents/id2.jpg' },
      { type: 'business_registration', url: 'https://example.com/documents/business2.pdf' },
      { type: 'certification', url: 'https://example.com/documents/cert2.pdf' }
    ],
    portfolio: [
      { url: 'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwzfHxhZnJpY2FuJTIwZmFzaGlvbiUyMG1hbGF3aSUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax', description: 'Handcrafted accessories' },
      { url: 'https://images.unsplash.com/photo-1485518882345-15568b007407?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw0fHxhZnJpY2FuJTIwZmFzaGlvbiUyMG1hbGF3aSUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax', description: 'Modern casual wear' }
    ],
    specialties: ['Accessories', 'Casual wear', 'Sustainable fashion'],
    biography: 'Passionate about sustainable fashion and ethical production. Creates unique accessories and casual wear using locally sourced materials and traditional techniques.',
    businessName: 'EcoChic Malawi',
    businessAddress: '78 Independence Road, Lilongwe, Malawi',
    socialMedia: {
      instagram: '@ecochicmalawi',
      facebook: 'EcoChicMalawi',
      website: 'https://ecochicmalawi.com'
    },
    references: [
      { name: 'Malawi Sustainable Fashion Initiative', contact: 'contact@msfi.org', relationship: 'Partner Organization' },
      { name: 'Tadala Mkandawire', contact: 'tadala@example.com', relationship: 'Client' }
    ],
    notes: 'Applicant has submitted additional certification in sustainable fashion practices.'
  }
];

// Mock content moderation items
export const mockModerationItems = [
  {
    id: 'mod1',
    contentType: 'product',
    contentId: 'prod_pending1',
    title: 'Traditional Print Swimwear',
    description: 'Modern swimwear featuring traditional African prints.',
    images: [
      'https://images.unsplash.com/photo-1512068312404-09a183f541eb?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw2fHxhZnJpY2FuJTIwZmFzaGlvbiUyMG1hbGF3aSUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax'
    ],
    status: 'pending',
    createdBy: {
      id: 'designer2',
      name: 'Mphatso Gondwe',
      role: UserRole.DESIGNER
    },
    createdAt: '2025-12-05T09:30:00Z',
    flags: [],
    notes: '',
    reviewedBy: null,
    reviewedAt: null
  },
  {
    id: 'mod2',
    contentType: 'review',
    contentId: 'review_pending1',
    title: 'Product Review',
    description: 'The quality of this dress is terrible. The stitching came apart after just one wear, and the designer refused to accept returns. I would never recommend buying from this seller.',
    images: [],
    status: 'pending',
    createdBy: {
      id: 'user5',
      name: 'Dalitso Tembo',
      role: UserRole.CLIENT
    },
    createdAt: '2025-12-06T13:45:00Z',
    flags: [],
    notes: '',
    reviewedBy: null,
    reviewedAt: null,
    relatedEntityId: 'prod3',
    relatedEntityName: 'Handcrafted Beaded Necklace Set'
  },
  {
    id: 'mod3',
    contentType: 'product',
    contentId: 'prod_flagged1',
    title: 'Designer Brand Replica',
    description: 'High-quality replica of famous designer clothing at affordable prices.',
    images: [
      'https://images.unsplash.com/photo-1485518882345-15568b007407?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw0fHxhZnJpY2FuJTIwZmFzaGlvbiUyMG1hbGF3aSUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax'
    ],
    status: 'flagged',
    createdBy: {
      id: 'designer6',
      name: 'Charles Mwanza',
      role: UserRole.DESIGNER
    },
    createdAt: '2025-12-02T10:15:00Z',
    flags: [
      {
        id: 'flag1',
        reason: 'copyright_infringement',
        description: 'This listing appears to sell counterfeit merchandise.',
        reportedBy: {
          id: 'user6',
          name: 'John Doe',
          role: UserRole.CLIENT
        },
        createdAt: '2025-12-04T08:30:00Z'
      }
    ],
    notes: '',
    reviewedBy: null,
    reviewedAt: null
  }
];

// Mock users for user management
export const mockUsers = [
  {
    id: 'user1',
    name: 'Chikondi Banda',
    email: 'chikondi.banda@example.com',
    phone: '+265 88 123 4567',
    role: UserRole.CLIENT,
    status: UserStatus.ACTIVE,
    createdAt: '2025-01-15T08:30:00Z',
    lastLogin: '2025-12-06T14:15:00Z',
    verified: true,
    orders: {
      total: 12,
      completed: 10,
      cancelled: 1,
      disputed: 1
    },
    totalSpent: 235000,
    favoriteDesigners: ['designer1', 'designer2'],
    address: {
      street: '123 Chilembwe Road',
      city: 'Lilongwe',
      country: 'Malawi',
      zipCode: '101010'
    }
  },
  {
    id: 'designer1',
    name: 'Thoko Banda',
    email: 'thoko.banda@example.com',
    phone: '+265 99 456 7890',
    role: UserRole.DESIGNER,
    status: UserStatus.ACTIVE,
    createdAt: '2020-05-12T00:00:00Z',
    lastLogin: '2025-12-07T09:45:00Z',
    verified: true,
    businessName: 'Thoko\'s Fashion House',
    businessAddress: {
      street: '45 Independence Avenue',
      city: 'Lilongwe',
      country: 'Malawi',
      zipCode: '101010'
    },
    salesStats: {
      totalOrders: 245,
      totalSales: 2750000,
      averageRating: 4.8
    },
    verificationDate: '2020-05-20T00:00:00Z',
    accountManager: 'admin1'
  },
  {
    id: 'user2',
    name: 'Tiyamike Nkhoma',
    email: 'tiyamike.nkhoma@example.com',
    phone: '+265 88 234 5678',
    role: UserRole.CLIENT,
    status: UserStatus.ACTIVE,
    createdAt: '2025-02-20T10:15:00Z',
    lastLogin: '2025-12-05T16:30:00Z',
    verified: true,
    orders: {
      total: 8,
      completed: 7,
      cancelled: 1,
      disputed: 0
    },
    totalSpent: 175000,
    favoriteDesigners: ['designer3'],
    address: {
      street: '78 Kamuzu Road',
      city: 'Blantyre',
      country: 'Malawi',
      zipCode: '202020'
    }
  },
  {
    id: 'designer2',
    name: 'Mphatso Gondwe',
    email: 'mphatso.gondwe@example.com',
    phone: '+265 99 567 8901',
    role: UserRole.DESIGNER,
    status: UserStatus.ACTIVE,
    createdAt: '2021-02-18T00:00:00Z',
    lastLogin: '2025-12-07T08:20:00Z',
    verified: true,
    businessName: 'Modern African Designs',
    businessAddress: {
      street: '32 Victoria Avenue',
      city: 'Blantyre',
      country: 'Malawi',
      zipCode: '202020'
    },
    salesStats: {
      totalOrders: 187,
      totalSales: 1950000,
      averageRating: 4.9
    },
    verificationDate: '2021-03-05T00:00:00Z',
    accountManager: 'admin1'
  },
  {
    id: 'user3',
    name: 'Kondwani Phiri',
    email: 'kondwani.phiri@example.com',
    phone: '+265 88 345 6789',
    role: UserRole.CLIENT,
    status: UserStatus.PENDING_VERIFICATION,
    createdAt: '2025-12-01T11:20:00Z',
    lastLogin: '2025-12-01T11:25:00Z',
    verified: false,
    orders: {
      total: 0,
      completed: 0,
      cancelled: 0,
      disputed: 0
    },
    totalSpent: 0,
    favoriteDesigners: [],
    address: {
      street: '56 Malawi Street',
      city: 'Zomba',
      country: 'Malawi',
      zipCode: '303030'
    }
  },
  {
    id: 'designer4',
    name: 'Yamikani Njovu',
    email: 'yamikani.njovu@example.com',
    phone: '+265 99 123 4567',
    role: UserRole.DESIGNER,
    status: UserStatus.PENDING_VERIFICATION,
    createdAt: '2025-11-25T10:15:00Z',
    lastLogin: '2025-12-05T14:30:00Z',
    verified: false,
    businessName: 'Njovu Designs',
    businessAddress: {
      street: '45 Victoria Avenue',
      city: 'Blantyre',
      country: 'Malawi',
      zipCode: '202020'
    },
    salesStats: {
      totalOrders: 0,
      totalSales: 0,
      averageRating: 0
    },
    verificationDate: null,
    accountManager: null
  },
  {
    id: 'admin1',
    name: 'Admin User',
    email: 'admin@fashionconnect.mw',
    phone: '+265 99 999 9999',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    createdAt: '2020-01-01T00:00:00Z',
    lastLogin: '2025-12-07T10:00:00Z',
    verified: true,
    permissions: ['user_management', 'content_moderation', 'dispute_resolution', 'analytics', 'settings', 'reports']
  }
];



// Mock categories
export const mockCategories: string[] = [
  'Women',
  'Men',
  'Accessories',
  'Wedding',
  'Formal',
  'Casual',
  'Kids',
  'Bridal',
  'Traditional',
  'Festive',
  'Vintage'
];

export const mockDesignerAnalytics = {
  views: 15420,
  orders: 87,
  revenue: 2450000, // in MWK (Malawian Kwacha)
  conversionRate: 5.6,
  monthlySales: [
    { month: 'Jan', revenue: 180000, sales: 12 },
    { month: 'Feb', revenue: 220000, sales: 15 },
    { month: 'Mar', revenue: 350000, sales: 23 },
    { month: 'Apr', revenue: 280000, sales: 18 },
    { month: 'May', revenue: 420000, sales: 28 },
    { month: 'Jun', revenue: 380000, sales: 25 },
    { month: 'Jul', revenue: 520000, sales: 35 },
    { month: 'Aug', revenue: 460000, sales: 31 },
    { month: 'Sep', revenue: 390000, sales: 26 },
    { month: 'Oct', revenue: 480000, sales: 32 },
    { month: 'Nov', revenue: 550000, sales: 37 },
    { month: 'Dec', revenue: 610000, sales: 41 }
  ],
  topProducts: [
    {
      productId: 'prod_001',
      name: 'Traditional Chitenge Dress',
      sales: 24,
      revenue: 480000
    },
    {
      productId: 'prod_002', 
      name: 'Modern African Print Shirt',
      sales: 18,
      revenue: 360000
    },
    {
      productId: 'prod_003',
      name: 'Custom Wedding Gown',
      sales: 8,
      revenue: 800000
    },
    {
      productId: 'prod_004',
      name: 'Business Suit Set',
      sales: 15,
      revenue: 375000
    },
    {
      productId: 'prod_005',
      name: 'Casual Summer Dress',
      sales: 22,
      revenue: 330000
    }
  ]
};


export const mockAdminAnalytics = {
  // Overview Stats
  totalUsers: 15847,
  newUsersToday: 23,
  totalOrders: 3421,
  ordersToday: 12,
  totalRevenue: 285750.50,
  revenueToday: 4250.75,
  totalDesigners: 892,

  // User Growth Chart Data (Bar Chart)
  userGrowth: [
    { month: 'Jan', clients: 450, designers: 85 },
    { month: 'Feb', clients: 520, designers: 92 },
    { month: 'Mar', clients: 680, designers: 108 },
    { month: 'Apr', clients: 750, designers: 125 },
    { month: 'May', clients: 890, designers: 145 },
    { month: 'Jun', clients: 1020, designers: 168 },
    { month: 'Jul', clients: 1150, designers: 185 },
    { month: 'Aug', clients: 1280, designers: 205 },
    { month: 'Sep', clients: 1420, designers: 225 },
    { month: 'Oct', clients: 1580, designers: 248 },
    { month: 'Nov', clients: 1720, designers: 265 },
    { month: 'Dec', clients: 1850, designers: 285 }
  ],

  // Sales by Category Data (Doughnut Chart)
  salesByCategory: [
    { category: 'Clothing', sales: 125000 },
    { category: 'Accessories', sales: 85000 },
    { category: 'Home Decor', sales: 45000 },
    { category: 'Jewelry', sales: 30750 }
  ],

  // Recent Activities (Timeline)
  recentActivities: [
    {
      id: 1,
      type: 'designer_verified',
      title: 'Designer Grace Banda was verified',
      timestamp: '1h ago',
      icon: 'CheckCircle',
      color: 'green'
    },
    {
      id: 2,
      type: 'new_order',
      title: 'New order #12345 was placed',
      timestamp: '3h ago',
      icon: 'Package',
      color: 'blue'
    },
    {
      id: 3,
      type: 'content_flagged',
      title: 'Content was flagged for review',
      timestamp: '5h ago',
      icon: 'AlertCircle',
      color: 'yellow'
    },
    {
      id: 4,
      type: 'new_users',
      title: '10 new users registered',
      timestamp: '1d ago',
      icon: 'Users',
      color: 'primary'
    }
  ],

  // Additional analytics that might be useful
  pendingVerifications: 15,
  flaggedContent: 8,
  activeDesigners: 734,
  monthlyGrowthRate: 12.5,
  averageOrderValue: 83.50,
  
  // Performance metrics
  performance: {
    conversionRate: 3.2,
    customerRetention: 68.5,
    averageSessionDuration: 8.5, // minutes
    bounceRate: 42.3
  },

  // Regional data (if needed for future features)
  regionData: [
    { region: 'North America', users: 6500, revenue: 145000 },
    { region: 'Europe', users: 4200, revenue: 89000 },
    { region: 'Asia', users: 3800, revenue: 72000 },
    { region: 'Africa', users: 1347, revenue: 28000 }
  ],

  // Top performing categories
  topCategories: [
    { name: 'Traditional Wear', orders: 856, revenue: 68400 },
    { name: 'Modern Fashion', orders: 742, revenue: 59360 },
    { name: 'Accessories', orders: 623, revenue: 31150 },
    { name: 'Home & Living', orders: 445, revenue: 22250 }
  ]
};