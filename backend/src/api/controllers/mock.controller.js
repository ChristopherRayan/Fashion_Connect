import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { mockProducts, mockUsers, mockOrders, mockReviews } from '../../db/mockData.js';

// Mock Products Controller
export const getMockProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, category, designer, sortBy, sortType } = req.query;
  
  let products = [...mockProducts];
  
  // Apply search filter
  if (query) {
    products = products.filter(product => 
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.description.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  // Apply category filter
  if (category) {
    products = products.filter(product => product.category === category);
  }
  
  // Apply sorting
  if (sortBy) {
    products.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (sortType === 'desc') {
        return bVal > aVal ? 1 : -1;
      }
      return aVal > bVal ? 1 : -1;
    });
  }
  
  // Apply pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedProducts = products.slice(startIndex, endIndex);
  
  const response = {
    docs: paginatedProducts,
    totalDocs: products.length,
    limit: parseInt(limit),
    page: parseInt(page),
    totalPages: Math.ceil(products.length / limit),
    hasNextPage: endIndex < products.length,
    hasPrevPage: page > 1,
    nextPage: endIndex < products.length ? parseInt(page) + 1 : null,
    prevPage: page > 1 ? parseInt(page) - 1 : null
  };
  
  return res.status(200).json(new ApiResponse(200, response, "Products fetched successfully"));
});

export const getMockProductById = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const product = mockProducts.find(p => p.id === productId);
  
  if (!product) {
    return res.status(404).json(new ApiResponse(404, null, "Product not found"));
  }
  
  return res.status(200).json(new ApiResponse(200, product, "Product fetched successfully"));
});

// Mock Designers Controller
export const getMockDesigners = asyncHandler(async (req, res) => {
  const designers = mockUsers.filter(user => user.role === 'DESIGNER');
  return res.status(200).json(new ApiResponse(200, designers, "Designers fetched successfully"));
});

export const getMockDesignerProfile = asyncHandler(async (req, res) => {
  const { designerId } = req.params;
  const designer = mockUsers.find(user => user.id === designerId && user.role === 'DESIGNER');
  
  if (!designer) {
    return res.status(404).json(new ApiResponse(404, null, "Designer not found"));
  }
  
  const designerProducts = mockProducts.filter(product => product.designerId === designerId);
  
  const profile = {
    designer,
    products: designerProducts
  };
  
  return res.status(200).json(new ApiResponse(200, profile, "Designer profile fetched successfully"));
});

// Mock Orders Controller
export const getMockOrders = asyncHandler(async (req, res) => {
  // For demo purposes, return all orders
  return res.status(200).json(new ApiResponse(200, mockOrders, "Orders fetched successfully"));
});

export const createMockOrder = asyncHandler(async (req, res) => {
  const orderData = req.body;
  
  // Create a mock order
  const newOrder = {
    id: `ORD${Date.now()}`,
    ...orderData,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  return res.status(201).json(new ApiResponse(201, newOrder, "Order created successfully"));
});

// Mock Auth Controller
export const mockLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json(new ApiResponse(400, null, "Email and password are required"));
  }
  
  // Find user by email
  const user = mockUsers.find(u => u.email === email);
  
  if (!user) {
    return res.status(404).json(new ApiResponse(404, null, "User not found"));
  }
  
  // For demo purposes, accept any password
  const authResponse = {
    user: {
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      verified: user.verified,
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: user.updatedAt || new Date().toISOString()
    },
    accessToken: `mock_access_token_${Date.now()}`,
    refreshToken: `mock_refresh_token_${Date.now()}`
  };
  
  return res.status(200).json(new ApiResponse(200, authResponse, "Login successful"));
});

export const mockRegister = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  
  if (!name || !email || !password || !role) {
    return res.status(400).json(new ApiResponse(400, null, "All fields are required"));
  }
  
  // Check if user already exists
  const existingUser = mockUsers.find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json(new ApiResponse(409, null, "User with this email already exists"));
  }
  
  // Create new user
  const newUser = {
    _id: `user_${Date.now()}`,
    name,
    email,
    role,
    status: 'ACTIVE',
    verified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  const authResponse = {
    user: newUser,
    accessToken: `mock_access_token_${Date.now()}`,
    refreshToken: `mock_refresh_token_${Date.now()}`
  };
  
  return res.status(201).json(new ApiResponse(201, authResponse, "User registered successfully"));
});

export const mockGetCurrentUser = asyncHandler(async (req, res) => {
  // Return a mock current user
  const mockCurrentUser = {
    _id: 'user_123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'CLIENT',
    status: 'ACTIVE',
    verified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return res.status(200).json(new ApiResponse(200, mockCurrentUser, "Current user fetched successfully"));
});

// Mock Email Verification Controller
export const mockRequestEmailVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json(new ApiResponse(400, null, "Email is required"));
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json(new ApiResponse(400, null, "Please provide a valid email address"));
  }

  // Generate a mock verification token
  const mockToken = 'mock_token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?email=${encodeURIComponent(email)}&token=${mockToken}`;

  // Log the verification URL to console (simulating email sending)
  console.log('\n' + '='.repeat(80));
  console.log('📧 EMAIL VERIFICATION - MOCK MODE');
  console.log('='.repeat(80));
  console.log(`📬 To: ${email}`);
  console.log(`📝 Subject: Verify Your Email - FashionConnect`);
  console.log('='.repeat(80));
  console.log('🔗 VERIFICATION URL (Copy and paste in browser):');
  console.log(`   ${verificationUrl}`);
  console.log('='.repeat(80));
  console.log('💡 TIP: Copy the URL above and paste it in your browser to verify the email');
  console.log('📧 This is a mock response - in production, this would be sent via email');
  console.log('='.repeat(80) + '\n');

  return res.status(200).json(new ApiResponse(200, null, "Verification email sent successfully. Please check your inbox."));
});
