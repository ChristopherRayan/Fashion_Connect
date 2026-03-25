// This file contains a subset of your provided mock data
// to keep the response size manageable.
// In a real project, this would contain the full data.
export const mockUsers = [
  {
 id: 'user1',
 name: 'Chikondi Banda',
 email: 'chikondi.banda@example.com',
 phone: '+265 88 123 4567',
 role: 'CLIENT',
 status: 'ACTIVE',
 verified: true,
  },
  {
 id: 'designer1',
 name: 'Thoko Banda',
 email: 'thoko.banda@example.com',
 phone: '+265 99 456 7890',
 role: 'DESIGNER',
 status: 'ACTIVE',
 verified: true,
 businessName: "Thoko's Fashion House",
 bio: 'Award-winning fashion designer specializing in modern interpretations of traditional Malawian attire. With over 15 years of experience, Thoko combines authentic cultural elements with contemporary styles.',
 specialty: 'Contemporary Chitenge Fusion',
 location: 'Lilongwe, Malawi',
 profileImage: 'https://images.unsplash.com/photo-1472417583565-62e7bdeda490?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw1fHxhZnJpY2FuJTIwZmFzaGlvbiUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax',
 portfolioImages: [
   'https://images.unsplash.com/photo-1472417583565-62e7bdeda490?w=500',
   'https://images.unsplash.com/photo-1512068312404-09a183f541eb?w=500'
 ],
 customOrdersAvailable: true,
 turnaroundTime: '2-3 weeks',
  },
  {
 id: 'designer2',
 name: 'Mphatso Gondwe',
 email: 'mphatso.gondwe@example.com',
 phone: '+265 88 987 6543',
 role: 'DESIGNER',
 status: 'ACTIVE',
 verified: true,
 businessName: 'Mphatso Modern Designs',
 bio: 'Creating contemporary fashion inspired by Malawian traditions. Specializing in wedding attire and formal wear with a modern twist.',
 specialty: 'Modern Urban Styles',
 location: 'Blantyre, Malawi',
 profileImage: 'https://images.unsplash.com/photo-1450297166380-cabe503887e5?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw3fHxhZnJpY2FuJTIwZmFzaGlvbiUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax',
 portfolioImages: [
   'https://images.unsplash.com/photo-1450297166380-cabe503887e5?w=500',
   'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=500'
 ],
 customOrdersAvailable: true,
 turnaroundTime: '1-2 weeks',
  },
  {
 id: 'designer3',
 name: 'Grace Mbewe',
 email: 'grace.mbewe@example.com',
 phone: '+265 99 234 5678',
 role: 'DESIGNER',
 status: 'ACTIVE',
 verified: true,
 businessName: 'Grace Traditional Crafts',
 bio: 'Master craftsperson preserving traditional Malawian textile techniques while creating beautiful contemporary pieces. Specializing in handwoven fabrics and traditional patterns.',
 specialty: 'Traditional Craftsmanship',
 location: 'Zomba, Malawi',
 profileImage: 'https://images.unsplash.com/photo-1512068312404-09a183f541eb?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw2fHxhZnJpY2FuJTIwZmFzaGlvbiUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax',
 portfolioImages: [
   'https://images.unsplash.com/photo-1512068312404-09a183f541eb?w=500',
   'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500'
 ],
 customOrdersAvailable: true,
 turnaroundTime: '3-4 weeks',
  },
  {
 id: 'designer4',
 name: 'Chisomo Manda',
 email: 'chisomo.manda@example.com',
 phone: '+265 88 345 6789',
 role: 'DESIGNER',
 status: 'ACTIVE',
 verified: true,
 businessName: 'Chisomo Couture',
 bio: 'High-end fashion designer creating luxury pieces for special occasions. Known for intricate beadwork and elegant silhouettes that celebrate African beauty.',
 specialty: 'Luxury Evening Wear',
 location: 'Mzuzu, Malawi',
 profileImage: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw4fHxhZnJpY2FuJTIwZmFzaGlvbiUyMHRyYWRpdGlvbmFsJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzQ4NTIwNDE3fDA&ixlib=rb-4.1.0&fit=fillmax',
 portfolioImages: [
   'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=500',
   'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500'
 ],
 customOrdersAvailable: true,
 turnaroundTime: '4-6 weeks',
  },
  {
 id: 'designer5',
 name: 'Deactivated Designer',
 email: 'deactivated@example.com',
 phone: '+265 88 999 9999',
 role: 'DESIGNER',
 status: 'DEACTIVATED',
 verified: true,
 businessName: 'Deactivated Fashion',
 bio: 'This designer has been deactivated by admin.',
 specialty: 'Test Deactivation',
 location: 'Test City, Malawi',
 profileImage: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=500',
 portfolioImages: [],
 customOrdersAvailable: false,
 turnaroundTime: 'N/A',
  },
  {
 id: 'tailor1',
 name: 'Peter Nkhoma',
 email: 'peter.nkhoma@example.com',
 phone: '+265 88 555 1234',
 role: 'TAILOR',
 status: 'ACTIVE',
 verified: true,
 designerEmail: 'thoko.banda@example.com', // Associated with Thoko Banda
 address: 'Lilongwe, Malawi',
 specialties: ['Suits', 'Traditional Wear', 'Wedding Attire'],
 experience: 8,
 bio: 'Experienced tailor specializing in custom suits and traditional Malawian attire.'
  },
  {
 id: 'admin1',
 name: 'Admin User',
 email: 'admin@fashionconnect.mw',
 role: 'ADMIN',
 status: 'ACTIVE',
 verified: true,
  }
];
export const mockProducts = [
  {
    id: 'prod1',
    name: 'Traditional Chitenge Dress',
    description: 'Elegant traditional Malawian dress made with authentic chitenge fabric.',
    price: 25000,
    images: ['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500'],
    category: "Women's Clothing",
    tags: ['traditional', 'chitenge', 'formal'],
    colors: ['Blue', 'Red', 'Green'],
    sizes: ['S', 'M', 'L', 'XL'],
    rating: 4.8,
    reviewCount: 12,
    featured: true,
    customizable: true,
    designer: { name: 'Thoko Banda' },
  },
  {
    id: 'prod2',
    name: 'Modern African Print Blazer',
    description: 'Contemporary blazer featuring traditional African prints.',
    price: 35000,
    images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500'],
    category: "Men's Clothing",
    tags: ['modern', 'blazer', 'african-print'],
    colors: ['Black', 'Navy', 'Brown'],
    sizes: ['M', 'L', 'XL', 'XXL'],
    rating: 4.5,
    reviewCount: 8,
    featured: true,
    customizable: false,
    designer: { name: 'Mphatso Gondwe' },
  },
  {
    id: 'prod3',
    name: 'Handwoven Basket Bag',
    description: 'Beautiful handwoven basket bag perfect for everyday use.',
    price: 15000,
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500'],
    category: 'Accessories',
    tags: ['handwoven', 'basket', 'bag'],
    colors: ['Natural', 'Brown'],
    sizes: ['One Size'],
    rating: 4.7,
    reviewCount: 15,
    featured: false,
    customizable: false,
    designer: { name: 'Thoko Banda' },
  },
  {
    id: 'prod4',
    name: 'Traditional Kente Shirt',
    description: 'Authentic Kente pattern shirt for special occasions.',
    price: 28000,
    images: ['https://images.unsplash.com/photo-1564859228273-274232fdb516?w=500'],
    category: "Men's Clothing",
    tags: ['kente', 'traditional', 'shirt'],
    colors: ['Gold', 'Red', 'Green'],
    sizes: ['S', 'M', 'L', 'XL'],
    rating: 4.6,
    reviewCount: 6,
    featured: false,
    customizable: true,
    designer: { name: 'Mphatso Gondwe' },
  },
  {
    id: 'prod5',
    name: 'Ankara Print Skirt',
    description: 'Vibrant Ankara print skirt with modern cut.',
    price: 18000,
    images: ['https://images.unsplash.com/photo-1583496661160-fb5886a13d77?w=500'],
    category: "Women's Clothing",
    tags: ['ankara', 'skirt', 'vibrant'],
    colors: ['Orange', 'Blue', 'Purple'],
    sizes: ['XS', 'S', 'M', 'L'],
    rating: 4.4,
    reviewCount: 9,
    featured: true,
    customizable: false,
    designer: { name: 'Thoko Banda' },
  }
];
export const mockReviews = [
  {
 id: 'review1',
 productId: 'prod1',
 designerId: 'designer1',
 rating: 5,
 title: 'Beautiful traditional dress!',
 comment: 'This chitenge dress is absolutely stunning!',
  }
];
export const mockOrders = [
  {
  id: 'ORD12345',
  items: [{ id: 'prod1', name: 'Traditional Chitenge Dress', price: 22500, quantity: 1 }],
  status: 'DELIVERED',
  totalAmount: 22500,
  designerName: 'Thoko Banda',
  }
];

export const mockCustomOrders = [
  {
    id: 'custom1',
    userEmail: 'chikondi.banda@example.com',
    designerEmail: 'thoko.banda@example.com',
    productType: 'Custom Wedding Dress',
    color: 'White with Gold Accents',
    measurements: {
      bust: '36',
      waist: '28',
      hip: '38',
      shoulder: '16',
      sleeve: '24',
      dressLength: '45'
    },
    expectedDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    deliveryLocation: 'Lilongwe, Area 10',
    additionalNotes: 'Please include traditional Malawian embroidery patterns',
    estimatedPrice: 150000,
    status: 'pending'
  },
  {
    id: 'custom2',
    userEmail: 'chikondi.banda@example.com',
    designerEmail: 'mphatso.gondwe@example.com',
    productType: 'Custom Business Suit',
    color: 'Navy Blue',
    measurements: {
      chest: '42',
      waist: '34',
      hip: '40',
      shoulder: '18',
      sleeve: '25',
      jacketLength: '30',
      trouserWaist: '34',
      trouserLength: '42'
    },
    expectedDeliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    deliveryLocation: 'Blantyre, Chichiri',
    additionalNotes: 'Need this for an important business meeting',
    estimatedPrice: 85000,
    status: 'accepted'
  },
  {
    id: 'custom3',
    userEmail: 'chikondi.banda@example.com',
    designerEmail: 'thoko.banda@example.com',
    productType: 'Custom Traditional Outfit',
    color: 'Red and Black',
    measurements: {
      chest: '40',
      waist: '32',
      hip: '38',
      shoulder: '17',
      dressLength: '48'
    },
    expectedDeliveryDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
    deliveryLocation: 'Zomba, Malawi',
    additionalNotes: 'Traditional Malawian wedding attire with modern elements',
    estimatedPrice: 120000,
    status: 'assigned_to_tailor',
    assignedTailorEmail: 'peter.nkhoma@example.com'
  }
];
