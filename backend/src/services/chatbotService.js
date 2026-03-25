import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Product } from '../models/product.model.js';
import { User } from '../models/user.model.js';
import { embeddingService } from './embeddingService.js';
import { BotConversation, BotMessageAnalytics } from '../models/botAnalytics.model.js';

class ChatbotService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.botUser = null;
    this.aiProvider = process.env.CHATBOT_PROVIDER || 'fallback';
    this.initializeAI();
    this.initializeBotUser();
  }

  async initializeAI() {
    try {
      console.log('🔍 Checking AI providers...');
      
      // Try Gemini first (if available)
      if (process.env.GEMINI_API_KEY && this.aiProvider === 'gemini') {
        try {
          this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          console.log('✅ Gemini AI initialized successfully');
          this.aiProvider = 'gemini';
          return;
        } catch (error) {
          console.log('⚠️ Gemini AI failed, trying alternatives...');
        }
      }
      
      // Fallback to enhanced rule-based system
      console.log('✅ Using enhanced rule-based AI system');
      this.aiProvider = 'enhanced_fallback';
      
    } catch (error) {
      console.error('❌ Failed to initialize AI:', error);
      this.aiProvider = 'fallback';
    }
  }

  async initializeBotUser() {
    try {
      // Check if bot user already exists
      this.botUser = await User.findOne({ email: 'bot@fashionconnect.mw' });
      
      if (!this.botUser) {
        // Create bot user
        this.botUser = await User.create({
          name: 'FashionConnect Assistant',
          email: 'bot@fashionconnect.mw',
          password: 'bot_secure_password_' + Date.now(),
          role: 'BOT',
          isBot: true,
          profileImage: 'https://ui-avatars.com/api/?name=FC+Bot&background=f59e0b&color=000',
          businessName: 'FashionConnect Support',
          verified: true,
          status: 'ACTIVE'
        });
        console.log('✅ Bot user created');
      } else {
        console.log('✅ Bot user found');
      }
    } catch (error) {
      console.error('❌ Failed to initialize bot user:', error);
    }
  }

  getBotUser() {
    return this.botUser;
  }

  async generateResponse(userMessage, conversationContext = {}) {
    const startTime = Date.now();
    let aiUsed = false;
    let fallbackUsed = false;
    
    try {
      const { userId, userName, conversationHistory = [], conversationId } = conversationContext;
      
      // Detect intent
      const intent = this.detectIntent(userMessage);
      
      // Check if this is a product search query
      const productSearchResult = await this.handleProductSearch(userMessage);
      
      let response;
      
      // Try AI providers in order of preference
      if (this.aiProvider === 'gemini' && this.model && this.genAI) {
        try {
          aiUsed = true;
          const systemPrompt = this.buildSystemPrompt();
          const contextualPrompt = this.buildContextualPrompt(userMessage, conversationHistory, userName);
          const fullPrompt = `${systemPrompt}\n\n${contextualPrompt}`;
          
          const result = await this.model.generateContent(fullPrompt);
          const aiResponse = result.response;
          let content = aiResponse.text();
          
          // Append product recommendations if found
          if (productSearchResult.products.length > 0) {
            content += '\n\n' + productSearchResult.message;
          }
          
          response = {
            content,
            type: 'text',
            products: productSearchResult.products,
            quickReplies: this.generateQuickReplies(userMessage),
            intent,
            responseType: intent
          };
        } catch (error) {
          console.log('⚠️ Gemini AI failed, using fallback...');
          fallbackUsed = true;
          response = this.generateEnhancedFallbackResponse(userMessage, productSearchResult, intent);
        }
      } else {
        // Use enhanced fallback system
        fallbackUsed = true;
        response = this.generateEnhancedFallbackResponse(userMessage, productSearchResult, intent);
      }
      
      // Track analytics
      const responseTime = Date.now() - startTime;
      await this.trackMessageAnalytics({
        userId,
        conversationId,
        messageType: 'bot_response',
        content: response.content,
        intent,
        responseTime,
        aiUsed,
        fallbackUsed,
        productsReturned: response.products?.length || 0,
        quickRepliesProvided: response.quickReplies || []
      });
      
      return response;
    } catch (error) {
      console.error('Error generating bot response:', error);
      
      return {
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again or contact our support team.",
        type: 'text',
        quickReplies: ['Contact Support', 'Try Again', 'Browse Products'],
        intent: 'unknown',
        responseType: 'error'
      };
    }
  }

  buildSystemPrompt() {
    return `You are the FashionConnect Assistant, an expert AI chatbot for FashionConnect - Malawi's premier fashion e-commerce platform connecting talented local designers with fashion-conscious customers.

🏢 ABOUT FASHIONCONNECT:
FashionConnect is a comprehensive fashion marketplace that bridges the gap between creative designers and customers in Malawi. We support both ready-made fashion purchases and custom-tailored orders, creating opportunities for local fashion entrepreneurs while providing customers with unique, high-quality clothing options.

📱 PLATFORM FEATURES & PROCESSES:

1. USER REGISTRATION & VERIFICATION:
- New users register as either Buyers/Clients or Designers
- Email verification required for new accounts (existing users can login normally)
- Designers must submit verification documents (National ID, Business Registration, Tax Certificate, Portfolio)
- Admin approval required for designer accounts before they can sell
- Profile management with photos, bio, and business information

2. PRODUCT MANAGEMENT:
- Designers upload products with 600x600 square images
- Categories: Men's Fashion (shirts, pants, suits, traditional), Women's Fashion (dresses, blouses, skirts, accessories), Unisex items
- Each product has: name, description, price, discount price, sizes, colors, materials, stock quantity
- Products can be marked as "customizable" or "ready-made"
- Vector search enables intelligent product recommendations
- Product reviews and ratings after purchase

3. SHOPPING EXPERIENCE:
- Browse products by category, designer, or search
- Responsive grid layout (mobile: 3-column, tablet: 4-column, desktop: 6-column)
- Add products to favorites (wishlist) and shopping cart
- Cart persists between sessions
- Product details show full information, images, and reviews
- Super deals slideshow for discounted items

4. CUSTOM ORDERS PROCESS:
- Available for designers who offer custom services
- Process: Find designer → Message with requirements → Provide measurements → Designer creates quote → Approve and pay → Production → Delivery
- Measurement forms vary by product type (dresses, shirts, pants, etc.)
- Direct messaging with designers throughout the process
- Custom pricing negotiated between customer and designer
- Progress tracking through messaging system

5. MESSAGING SYSTEM:
- Real-time messaging between customers and designers
- WhatsApp-style interface with image sharing
- Custom order requests include product images and specifications
- Message history and conversation management
- Unread message indicators and notifications

6. PAYMENT SYSTEM:
- Ctech Pay integration (Malawian payment gateway)
- Supports credit/debit cards and Airtel Money mobile payments
- Secure transaction processing with instant confirmation
- Order confirmation emails sent automatically
- Payment required before custom order production begins

7. ORDER MANAGEMENT:
- Order tracking from placement to delivery
- Email notifications for status updates
- Designer approval required for orders before processing
- Order history accessible in user dashboard
- Downloadable PDF invoices with FashionConnect watermark
- Analytics and reporting for both customers and designers

8. DESIGNER FEATURES:
- Designer verification process through admin panel
- Portfolio management and product uploads
- Order management and customer communication
- Analytics dashboard showing sales performance
- Notification system for new orders and low stock
- Following system where customers can follow favorite designers

9. ADMIN SYSTEM:
- Designer verification and document review
- Content moderation for products and reviews
- User management (activate/deactivate accounts)
- Analytics and reporting across the platform
- Complaint and feedback management

🎯 YOUR EXPERTISE:
You are an expert on ALL these processes and should provide detailed, step-by-step guidance when users ask about any aspect of FashionConnect. Always explain processes clearly, mention relevant features, and guide users to the next logical step.

💬 RESPONSE STYLE:
- Be comprehensive but clear in explanations
- Use step-by-step instructions when explaining processes
- Mention specific features and benefits
- Always end with a helpful next step or question
- Use emojis appropriately to make responses engaging
- Be encouraging and supportive of both buyers and designers`;
  }

  buildContextualPrompt(userMessage, conversationHistory, userName) {
    let prompt = `User: ${userName || 'Customer'}\n`;
    
    if (conversationHistory.length > 0) {
      prompt += 'Recent conversation:\n';
      conversationHistory.slice(-3).forEach(msg => {
        const sender = msg.sender?.name === this.botUser?.name ? 'Assistant' : 'User';
        prompt += `${sender}: ${msg.content}\n`;
      });
    }
    
    prompt += `\nCurrent message: ${userMessage}\n\nPlease respond helpfully:`;
    return prompt;
  }

  generateEnhancedFallbackResponse(userMessage, productSearchResult, intent) {
    const message = userMessage.toLowerCase();
    
    // Enhanced responses based on intent
    switch (intent) {
      case 'greeting':
        return {
          content: `Hello! 👋 Welcome to FashionConnect - Malawi's premier fashion marketplace!

I'm your personal fashion assistant, here to help you:
✨ Discover unique pieces from talented local designers
🛍️ Navigate our shopping experience seamlessly
👗 Understand custom order processes step-by-step
💳 Learn about secure payments and order tracking

Whether you're looking for ready-made fashion or want something custom-tailored just for you, I'll guide you through every step! What would you like to explore first?`,
          type: 'text',
          products: productSearchResult.products,
          quickReplies: ['Browse Products', 'Custom Orders', 'How It Works', 'Find Designers'],
          intent,
          responseType: intent
        };
        
      case 'product_search':
        let response = "🛍️ **Finding Your Perfect Fashion Pieces**\n\n";

        if (productSearchResult.products.length > 0) {
          response += productSearchResult.message + "\n\n";
        }

        response += `Here's exactly how to find and purchase products on our platform:

**Step 1: Access the Product Catalog**
• From the homepage, click "Browse Products" or use the search bar
• Navigate through categories in the top menu
• Use the sidebar filters for specific searches

**Step 2: Search Methods**
• **Search Bar**: Type specific items (e.g., "red dress", "men's suits")
• **Categories**: Browse Men's Fashion, Women's Fashion, or Unisex
• **Designer Pages**: View products from specific designers
• **Filters**: Sort by price, ratings, availability, or designer

**Step 3: Product Categories Available**
👔 **Men's Fashion**:
• Shirts (formal, casual, traditional)
• Pants (dress pants, jeans, traditional)
• Suits and blazers
• Accessories (ties, belts, watches)

👗 **Women's Fashion**:
• Dresses (casual, formal, traditional, evening)
• Blouses and tops
• Skirts and pants
• Accessories (jewelry, bags, scarves)

👕 **Unisex Items**:
• T-shirts and casual wear
• Hoodies and sweatshirts
• Traditional unisex clothing
• Accessories

**Step 4: View Product Details**
• Click on any product to see full information
• View multiple high-quality images (600x600 pixels)
• Read detailed descriptions and specifications
• Check available sizes and colors
• See customer reviews and ratings
• View designer information and other products

**Step 5: Make Your Selection**
• Choose size from dropdown menu
• Select color/variant if available
• Check stock quantity
• Note any special care instructions

**Step 6: Add to Cart or Favorites**
• Click "Add to Cart" to purchase
• Click heart icon to save to favorites/wishlist
• Cart items persist between sessions
• Favorites help you track items you're considering

**Step 7: Proceed to Purchase**
• Review cart contents and quantities
• Verify sizes and total price
• Add delivery address
• Choose payment method (Ctech Pay)
• Complete secure checkout

**🔍 Pro Shopping Tips:**
• Use favorites to compare similar items
• Read reviews from verified buyers
• Check designer profiles for more context
• Message designers with questions before buying
• Look for discount badges on special deals

What specific type of product are you looking for today?`;

        return {
          content: response,
          type: 'text',
          products: productSearchResult.products,
          quickReplies: ['Show me men\'s clothing', 'Browse women\'s fashion', 'How to use search filters?', 'View product reviews'],
          intent,
          responseType: intent
        };
        
      case 'designer_inquiry':
        return {
          content: `👨‍🎨 **How to Find and Connect with Designers on FashionConnect**

Here's exactly how to discover and work with our verified designers:

**Step 1: Access Designer Profiles**
• Click "Find Designers" from the main navigation
• Browse the "Designers" section from the homepage
• Click on designer names from any product page
• Use the search function to find specific designers

**Step 2: Browse Designer Profiles**
Each designer profile shows:
• **Portfolio**: High-quality images of their best work
• **Specialties**: What they're known for (formal wear, traditional, casual, etc.)
• **Bio**: Their experience and design philosophy
• **Ratings**: Reviews from previous customers
• **Location**: Where they're based in Malawi
• **Verification Badge**: Confirms they're admin-approved

**Step 3: View Designer Collections**
• Browse all products by that designer
• See their style range and pricing
• Check availability and current stock
• Read customer reviews on their products

**Step 4: Designer Verification Process**
All our designers go through strict verification:
• Submit National ID for identity verification
• Provide business registration documents
• Show tax compliance certificates
• Submit portfolio of previous work
• Admin team reviews and approves each application
• Only verified designers can sell on the platform

**Step 5: Follow Your Favorite Designers**
• Click the "Follow" button on their profile
• Get notifications when they:
  - Upload new products
  - Offer special discounts
  - Update their portfolio
  - Announce custom order availability

**Step 6: Contact Designers Directly**
• Use the "Message Designer" button on their profile
• Real-time chat system for instant communication
• Discuss custom orders, sizing, or special requests
• Share inspiration photos and ideas
• Get quotes for custom work

**Step 7: Working with Designers**
• **Ready-Made Orders**: Purchase existing products directly
• **Custom Orders**: Request personalized pieces
• **Consultations**: Get style advice and recommendations
• **Modifications**: Ask about alterations to existing designs

**🔍 How to Choose the Right Designer:**
• Look at their portfolio style - does it match your vision?
• Read customer reviews and ratings
• Check their specialties (formal, casual, traditional, etc.)
• Consider their location for easier communication
• Review their pricing range
• Look at their response time to messages

**💬 Communication Tips:**
• Be specific about what you want
• Share inspiration photos when possible
• Ask about timeline and pricing upfront
• Discuss materials and color preferences
• Confirm measurements and sizing

Ready to connect with talented Malawian designers?`,
          type: 'text',
          quickReplies: ['Browse verified designers', 'How to message a designer?', 'Designer verification process', 'Follow favorite designers'],
          intent,
          responseType: intent
        };
        
      case 'order_help':
        return {
          content: `📦 **How to Place Orders on FashionConnect**

Here's exactly how to place both ready-made and custom orders:

**🛍️ READY-MADE ORDERS (Existing Products):**

**Step 1: Browse Products**
• Use the search bar to find specific items
• Browse categories: Men's Fashion, Women's Fashion, Unisex
• Filter by price, designer, or ratings
• Click on products to view full details

**Step 2: Select Product Details**
• Choose your size from available options
• Select color/variant if multiple options exist
• Check stock availability
• Read product description and reviews

**Step 3: Add to Cart**
• Click "Add to Cart" button
• Items remain in your cart between sessions
• You can continue shopping or proceed to checkout

**Step 4: Review Your Cart**
• Click the cart icon in the top navigation
• Review all items, quantities, and sizes
• Check total price including any shipping fees
• Remove or modify items if needed

**Step 5: Proceed to Checkout**
• Click "Proceed to Checkout" button
• Confirm your delivery address
• Review order summary one final time

**Step 6: Make Payment**
• Choose payment method: Ctech Pay (Cards or Airtel Money)
• Enter payment details securely
• Confirm payment - you'll receive instant confirmation
• Payment is processed immediately

**Step 7: Designer Approval**
• Designer receives your order notification
• They review and approve the order (usually within 24 hours)
• You'll get email notification when approved
• Designer begins preparing your items

**Step 8: Order Processing**
• Designer prepares items for shipping
• You can message designer for updates
• Receive status updates via email and in-app notifications

**Step 9: Shipping & Delivery**
• Designer ships your order
• You receive tracking information
• Estimated delivery time provided

**Step 10: Receive & Review**
• Confirm delivery when you receive items
• Download your invoice with FashionConnect watermark
• Leave a review for the product and designer

**📱 How to Track Your Orders:**
• Go to your account dashboard
• Click "Order History" section
• View real-time status updates
• Message designer directly for questions
• Download invoices anytime

**💳 Payment Process Details:**
• All payments through secure Ctech Pay gateway
• Supports Visa, Mastercard, and Airtel Money
• Instant payment confirmation
• Automatic email receipts
• Secure encryption for all transactions

What specific part of the ordering process would you like more details about?`,
          type: 'text',
          quickReplies: ['How to track my order?', 'Payment methods explained', 'What if designer rejects order?', 'Order delivery timeline'],
          intent,
          responseType: intent
        };
        
      case 'custom_orders':
        return {
          content: `✂️ **How to Create a Custom Order on FashionConnect**

Sure! Here's exactly how you can create a custom order on FashionConnect:

**Step 1: Log into Your Account**
• Make sure you're logged in as a buyer/client
• If you don't have an account, register first and verify your email

**Step 2: Find Your Designer**
• Go to the profile of the designer you want to work with
• You can find designers via:
  - Search function (search by name or specialty)
  - Browse designer profiles section
  - Click on designer names from product pages
  - Use the "Find Designers" feature

**Step 3: Request Custom Order**
• On the designer's profile page, click the 'Request Custom Order' button
• This opens the custom order request form

**Step 4: Fill Out the Custom Order Form**
Complete all required fields:
• **Product Type**: Specify what you want (e.g., jacket, gown, dress, suit)
• **Style Description**: Detailed description including:
  - Colors you prefer
  - Materials you want
  - Your measurements (chest, waist, hips, etc.)
  - Upload inspiration images if available
• **Your Budget**: Enter your expected price range
• **Delivery Deadline**: When you need the item completed
• **Delivery Address**: Where to ship the finished product

**Step 5: Submit Your Request**
• Review all information carefully
• Click submit to send your request to the designer

**Step 6: Designer Response**
The designer will receive your request and can:
• **Accept**: Agree to create your custom piece
• **Negotiate**: Discuss changes via in-app messaging
• **Reject**: Decline with reason (usually due to timeline or complexity)

**Step 7: Order Confirmation**
Once the designer accepts:
• You'll receive a detailed order summary
• Designer sends payment request with final pricing
• Review terms, timeline, and specifications

**Step 8: Secure Payment**
• Pay via Ctech Pay (Airtel Money or card)
• Your payment is held in escrow for security
• Payment is only released when you confirm delivery

**Step 9: Production & Updates**
• Designer starts creating your custom piece
• You'll receive regular progress updates
• Designer may send work-in-progress photos
• Communicate directly through messaging system

**Step 10: Completion & Delivery**
• Designer marks order as complete when finished
• Final photos sent for your approval
• Item is carefully packaged and shipped
• You receive tracking information

**Step 11: Receive & Confirm**
• Receive your custom-made item
• Inspect quality and fit
• Confirm delivery in the system
• Download your invoice with FashionConnect watermark
• Leave a review for the designer

Ready to start your custom order journey?`,
          type: 'text',
          quickReplies: ['How do I pay for custom orders?', 'Find verified designers', 'What if my order is delayed?', 'Custom order pricing guide'],
          intent,
          responseType: intent
        };
        
      default:
        return {
          content: "I'm here to help you with anything related to FashionConnect! You can ask me about products, designers, orders, payments, or how to use the platform. What would you like to know?",
          type: 'text',
          products: productSearchResult.products,
          quickReplies: ['Browse Products', 'Find Designers', 'Help & Support', 'How It Works'],
          intent,
          responseType: intent
        };
    }
  }

  // Intent detection
  detectIntent(message) {
    const msg = message.toLowerCase();
    
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('good morning')) {
      return 'greeting';
    }
    if (msg.includes('product') || msg.includes('buy') || msg.includes('shop') || msg.includes('clothing') || msg.includes('dress') || msg.includes('shirt')) {
      return 'product_search';
    }
    if (msg.includes('designer') || msg.includes('tailor') || msg.includes('creator')) {
      return 'designer_inquiry';
    }
    if (msg.includes('order') || msg.includes('payment') || msg.includes('checkout')) {
      return 'order_help';
    }
    if (msg.includes('custom') || msg.includes('measurement') || msg.includes('made to order')) {
      return 'custom_orders';
    }
    if (msg.includes('help') || msg.includes('support') || msg.includes('problem')) {
      return 'general_help';
    }
    
    return 'general';
  }

  generateQuickReplies(userMessage) {
    const message = userMessage.toLowerCase();
    
    if (message.includes('product') || message.includes('shop')) {
      return ['Men\'s Fashion', 'Women\'s Fashion', 'Custom Orders', 'View Designers'];
    }
    
    if (message.includes('order')) {
      return ['Track Order', 'Payment Help', 'Contact Designer', 'Order History'];
    }
    
    if (message.includes('designer')) {
      return ['Find Designers', 'Follow Designer', 'Message Designer', 'View Collections'];
    }
    
    return ['Browse Products', 'Find Designers', 'Help & Support', 'Custom Orders'];
  }

  async handleProductSearch(query) {
    try {
      const productKeywords = ['product', 'dress', 'shirt', 'pants', 'shoes', 'clothing', 'fashion', 'buy', 'shop', 'find', 'looking for'];
      const isProductQuery = productKeywords.some(keyword => 
        query.toLowerCase().includes(keyword)
      );

      if (!isProductQuery) {
        return { products: [], message: '' };
      }

      const searchResults = await this.searchProducts(query);
      
      if (searchResults.length > 0) {
        const productList = searchResults.slice(0, 3).map((product, index) => 
          `${index + 1}. ${product.name} - $${product.price} by ${product.designer?.businessName || 'Designer'}`
        ).join('\n');
        
        return {
          products: searchResults.slice(0, 3),
          message: `Here are some products I found for you:\n${productList}\n\nWould you like to see more details?`
        };
      }
      
      return { products: [], message: '' };
    } catch (error) {
      console.error('Error in product search:', error);
      return { products: [], message: '' };
    }
  }

  async searchProducts(query, limit = 5) {
    try {
      // Simple text search fallback
      return await Product.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } }
        ],
        inStock: true
      })
      .populate('designer', 'name businessName')
      .limit(limit);
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  // Analytics tracking (simplified)
  async trackMessageAnalytics(data) {
    try {
      if (!data.userId || !data.conversationId) return;
      // Analytics tracking would go here
      console.log('📊 Analytics:', { intent: data.intent, responseTime: data.responseTime });
    } catch (error) {
      console.error('Error tracking analytics:', error);
    }
  }

  async handleQuickReply(quickReply, userId) {
    try {
      switch (quickReply) {
        case 'Browse Products':
          return {
            content: `🛍️ **How to Browse Products on FashionConnect**

Here's your complete guide to finding and browsing products:

**Step 1: Access the Product Catalog**
• From the homepage, click the "Browse Products" button
• Use the main navigation menu to select categories
• Click on the search bar at the top of any page

**Step 2: Navigation Methods**
• **Main Categories**: Click Men's Fashion, Women's Fashion, or Unisex
• **Search Bar**: Type specific items (e.g., "blue dress", "formal shirt")
• **Designer Pages**: Browse products by specific designers
• **Sidebar Filters**: Use advanced filtering options

**Step 3: Using Search Filters**
• **Price Range**: Set minimum and maximum price
• **Designer**: Filter by specific designers
• **Size**: Show only items in your size
• **Color**: Filter by color preferences
• **Availability**: Show only in-stock items
• **Ratings**: Filter by customer rating (4+ stars, etc.)

**Step 4: Product Categories Available**
👔 **Men's Fashion**:
• Formal shirts and dress pants
• Casual wear and jeans
• Traditional Malawian clothing
• Suits and blazers
• Accessories (ties, belts, watches)

👗 **Women's Fashion**:
• Dresses (casual, formal, traditional, evening)
• Blouses and professional tops
• Skirts and pants
• Traditional wear and accessories
• Jewelry and handbags

👕 **Unisex Items**:
• T-shirts and casual tops
• Hoodies and sweatshirts
• Traditional unisex clothing
• Accessories and bags

**Step 5: Viewing Product Details**
• Click on any product image to see full details
• View multiple high-resolution photos
• Read detailed descriptions and specifications
• Check available sizes and colors
• See customer reviews and ratings
• View designer information

**Step 6: Managing Your Selections**
• **Add to Cart**: Click to purchase immediately
• **Add to Favorites**: Save items for later consideration
• **Compare**: View similar items side by side
• **Share**: Send product links to friends

**🔍 Pro Browsing Tips:**
• Use favorites to create a wishlist
• Read customer reviews before purchasing
• Check designer profiles for more context
• Look for discount badges on special deals
• Use filters to narrow down large selections
• Sort by "Newest" to see latest arrivals

Which category would you like to explore first?`,
            type: 'text',
            quickReplies: ['Show men\'s clothing categories', 'Browse women\'s fashion', 'How to use filters effectively?', 'View newest arrivals']
          };
          
        case 'Find Designers':
          const designers = await User.find({ role: 'DESIGNER', status: 'ACTIVE' })
            .select('name businessName profileImage')
            .limit(3);
            
          return {
            content: `Here are some of our featured designers:\n${designers.map(d => `• ${d.businessName || d.name}`).join('\n')}\n\nWould you like to see their collections?`,
            type: 'text',
            designers: designers,
            quickReplies: ['View Collections', 'Message Designer', 'Custom Orders']
          };
          
        case 'Help & Support':
          return {
            content: `🆘 **Complete Help & Support Center**

I'm your dedicated FashionConnect assistant! Here's how I can help you:

**🛍️ Shopping Assistance:**
• Product search and recommendations
• Understanding product details and sizing
• Adding items to cart and favorites
• Comparing designers and prices

**📦 Order Support:**
• Placing orders (ready-made and custom)
• Order tracking and status updates
• Payment processing and receipts
• Delivery and shipping information

**👨‍🎨 Designer Services:**
• Finding the right designer for your needs
• Understanding custom order processes
• Communication with designers
• Designer verification and reviews

**💳 Payment & Billing:**
• Ctech Pay setup and usage
• Card and Airtel Money payments
• Invoice downloads and receipts
• Refund and return policies

**👤 Account Management:**
• Profile setup and updates
• Email verification process
• Password reset and security
• Notification preferences

**🔧 Technical Support:**
• Website navigation help
• Mobile app usage
• Troubleshooting common issues
• Feature explanations

**📞 Additional Support:**
• Email: support@fashionconnect.mw
• Live chat with human agents
• Complaint and feedback system
• FAQ and knowledge base

What specific area would you like help with?`,
            type: 'text',
            quickReplies: ['Order Help', 'Payment Info', 'Account Issues', 'Technical Support']
          };
          
        case 'How It Works':
          return {
            content: `🎯 **How FashionConnect Works - Complete Guide**

Welcome to Malawi's premier fashion marketplace! Here's your complete guide:

**🚀 Getting Started:**
1️⃣ **Register**: Create your account (Buyer or Designer)
2️⃣ **Verify Email**: Check your email and verify your account
3️⃣ **Complete Profile**: Add your photo and preferences
4️⃣ **Start Exploring**: Browse products and designers

**🛍️ For Buyers/Customers:**

**Ready-Made Shopping:**
• Browse categories or search for specific items
• View product details, images, and reviews
• Add items to favorites or cart
• Secure checkout with Ctech Pay
• Track your order until delivery

**Custom Orders:**
• Find designers who offer custom services
• Message them with your requirements
• Provide measurements and design preferences
• Approve quote and make payment
• Track production progress
• Receive your unique piece

**👨‍🎨 For Designers:**
• Submit verification documents
• Wait for admin approval
• Upload products with professional photos
• Manage orders and communicate with customers
• Offer custom order services
• Build your following and reputation

**💳 Payment System:**
• Secure Ctech Pay integration
• Credit/debit cards accepted
• Airtel Money mobile payments
• Instant payment confirmation
• Automatic invoice generation

**📱 Platform Features:**
• Real-time messaging system
• Order tracking and notifications
• Review and rating system
• Designer following and favorites
• Mobile-responsive design
• Email notifications

**🔒 Safety & Security:**
• Verified designer network
• Secure payment processing
• Admin content moderation
• Customer review system
• Complaint resolution process

**📞 Support System:**
• 24/7 AI assistant (that's me!)
• Email support team
• Direct designer communication
• Comprehensive help center

Ready to start your FashionConnect journey?`,
            type: 'text',
            quickReplies: ['Start Shopping', 'Find Designers', 'Register Account', 'Payment Methods']
          };

        case 'Payment Methods':
        case 'How do I pay for custom orders?':
        case 'Payment methods explained':
          return {
            content: `💳 **How to Pay on FashionConnect - Complete Guide**

Here's exactly how payments work on FashionConnect:

**💳 Payment Gateway: Ctech Pay**
FashionConnect uses Ctech Pay, Malawi's most trusted payment gateway, ensuring secure transactions.

**Step 1: Supported Payment Methods**

**🏦 Credit/Debit Cards:**
• Visa cards (local and international)
• Mastercard (local and international)
• Secure 3D authentication required
• Instant payment processing
• Works with all major Malawian banks

**📱 Airtel Money:**
• Mobile money payments
• No need for physical cards
• Instant confirmation
• Perfect for mobile users
• Available 24/7

**Step 2: Payment Process (Ready-Made Orders)**
1. **Add items to cart** and proceed to checkout
2. **Review your order** - check items, quantities, total
3. **Enter delivery address** and contact information
4. **Select payment method** - card or Airtel Money
5. **Enter payment details** in secure form
6. **Confirm payment** - instant processing
7. **Receive confirmation** - email and SMS

**Step 3: Payment Process (Custom Orders)**
1. **Submit custom order request** to designer
2. **Designer accepts** and provides quote
3. **Review order summary** and final price
4. **Designer sends payment request** through system
5. **Pay via Ctech Pay** - your payment is held in escrow
6. **Payment released** only when you confirm delivery

**🔒 Security Features:**
• SSL encryption for all transactions
• PCI DSS compliant processing
• Advanced fraud detection
• Secure tokenization technology
• Your card details are never stored on our servers
• Two-factor authentication for large amounts

**📧 After Payment Confirmation:**
• Instant email confirmation with order details
• SMS notification (if phone number provided)
• Order tracking information
• Designer receives notification to start work
• Invoice with FashionConnect watermark
• Receipt downloadable from your account

**💰 Pricing & Fees:**
• **No hidden fees** - what you see is what you pay
• **Shipping costs** clearly displayed before payment
• **Tax calculations** included in final price
• **Discount codes** can be applied at checkout
• **Currency**: All prices in Malawian Kwacha (MWK)

**🔄 Refunds & Returns:**
• Refunds processed through original payment method
• **Card refunds**: 3-5 business days
• **Airtel Money refunds**: Instant processing
• Email notification when refund is processed
• Full refund policy available in terms of service

**❓ Payment Troubleshooting:**
• Ensure sufficient balance/credit limit
• Check card expiry date
• Verify billing address matches card details
• Try different payment method if one fails
• Contact support for persistent issues

Need help with a specific payment method or having payment issues?`,
            type: 'text',
            quickReplies: ['Card payment step-by-step', 'Airtel Money payment guide', 'Payment failed - what to do?', 'Refund process explained']
          };

        case 'How to track my order?':
        case 'Track Order':
          return {
            content: `📦 **How to Track Your Orders on FashionConnect**

Here's exactly how to track your orders from placement to delivery:

**Step 1: Access Order Tracking**
• Log into your FashionConnect account
• Click on your profile/account icon in the top right
• Select "Order History" or "My Orders" from the dropdown
• You'll see all your orders listed chronologically

**Step 2: Order Status Meanings**
• **Pending**: Order placed, waiting for designer approval
• **Approved**: Designer has accepted your order
• **In Production**: Designer is creating/preparing your items
• **Ready to Ship**: Items completed and ready for delivery
• **Shipped**: Items sent out for delivery
• **Delivered**: Items received by you
• **Completed**: You've confirmed receipt and left review

**Step 3: Real-Time Updates**
• **Email Notifications**: Sent at each status change
• **SMS Updates**: If phone number provided
• **In-App Notifications**: Check the bell icon
• **Direct Messages**: Designer may send progress updates

**Step 4: Detailed Order Information**
Click on any order to see:
• Order number and date
• Items ordered with quantities and sizes
• Designer information and contact
• Delivery address
• Payment details and receipt
• Current status and estimated timeline

**Step 5: Communication with Designer**
• Use the "Message Designer" button on order details
• Ask for progress updates or photos
• Discuss any concerns or special requests
• Get estimated completion/delivery dates

**Step 6: Delivery Confirmation**
• You'll receive notification when items are shipped
• Track delivery through provided tracking number
• Confirm receipt when items arrive
• Download invoice with FashionConnect watermark

**📱 Mobile Tracking:**
• All tracking features work on mobile devices
• Push notifications for status updates
• Easy access through mobile browser

**⏰ Typical Timelines:**
• **Ready-Made Orders**: 2-5 business days
• **Custom Orders**: 1-6 weeks depending on complexity
• **Shipping**: 1-3 business days within Malawi

**❓ If Your Order is Delayed:**
• Check last status update in your order history
• Message the designer directly for updates
• Contact support if no response within 24 hours
• Request timeline updates for custom orders

Need help with a specific order or having tracking issues?`,
            type: 'text',
            quickReplies: ['Message designer about order', 'What if order is delayed?', 'Download order invoice', 'Report order problem']
          };

        case 'Find verified designers':
        case 'Browse verified designers':
          return {
            content: `👨‍🎨 **How to Find Verified Designers on FashionConnect**

Here's how to discover and connect with our verified designers:

**Step 1: Access Designer Directory**
• Click "Find Designers" in the main navigation
• Go to "Designers" section from homepage
• Use the search bar and type "designers"
• Browse designer names on any product page

**Step 2: Designer Verification Badge**
Look for the ✅ verification badge on profiles, which means:
• Identity verified with National ID
• Business registration documents submitted
• Tax compliance certificates provided
• Portfolio reviewed and approved by admin team
• Background check completed

**Step 3: Browse Designer Profiles**
Each verified designer profile shows:
• **Portfolio**: High-quality images of their work
• **Specialties**: What they're known for (formal, traditional, casual)
• **Bio**: Their experience and design philosophy
• **Ratings**: Average rating from customer reviews
• **Location**: Where they're based in Malawi
• **Response Time**: How quickly they reply to messages
• **Custom Orders**: Whether they accept custom requests

**Step 4: Filter and Search Designers**
• **By Specialty**: Formal wear, traditional, casual, accessories
• **By Location**: Find designers in your area
• **By Rating**: Show only highly-rated designers (4+ stars)
• **By Availability**: Designers currently accepting orders
• **By Price Range**: Match your budget expectations

**Step 5: View Designer Collections**
• Click on any designer to see all their products
• Browse their style range and pricing
• Check current availability and stock
• Read customer reviews on their work
• See their latest uploads and designs

**Step 6: Connect with Designers**
• **Follow**: Get notified of new products and updates
• **Message**: Direct chat for questions or custom orders
• **View Products**: Browse their current catalog
• **Read Reviews**: See what other customers say

**🔍 How to Choose the Right Designer:**
• **Style Match**: Does their portfolio match your vision?
• **Specialization**: Do they specialize in what you need?
• **Reviews**: What do previous customers say?
• **Response Time**: How quickly do they communicate?
• **Location**: Closer designers may offer faster service
• **Pricing**: Does their range fit your budget?

**💬 Before Contacting a Designer:**
• Review their portfolio thoroughly
• Read their bio and specialties
• Check their recent customer reviews
• Note their typical response time
• Prepare specific questions about your needs

Ready to connect with Malawi's most talented fashion designers?`,
            type: 'text',
            quickReplies: ['Message a designer now', 'View designer portfolios', 'Designer specialties explained', 'How to follow designers']
          };

        case 'What if my order is delayed?':
        case 'What if designer rejects order?':
          return {
            content: `⚠️ **Handling Order Issues on FashionConnect**

Here's what to do if you encounter order problems:

**🕐 If Your Order is Delayed:**

**Step 1: Check Current Status**
• Log into your account and view order details
• Check the last status update and timestamp
• Review estimated timeline provided by designer

**Step 2: Contact the Designer**
• Use "Message Designer" button on your order
• Ask politely for a status update
• Request new estimated completion date
• Ask if there are any issues or delays

**Step 3: Escalation Process**
If designer doesn't respond within 24 hours:
• Contact FashionConnect support team
• Email: support@fashionconnect.mw
• Use the complaint system in your account
• Provide order number and details

**❌ If Designer Rejects Your Order:**

**Step 1: Understand the Reason**
Designers may reject orders due to:
• Timeline conflicts (too rushed)
• Complexity beyond their expertise
• Material availability issues
• Workload capacity limits
• Unclear specifications

**Step 2: Automatic Refund Process**
• Full refund processed immediately
• Money returned to original payment method
• Email confirmation of refund
• No fees or penalties for you

**Step 3: Find Alternative Designer**
• Browse other designers with similar specialties
• Use our "Find Similar Designers" feature
• Check designers with faster turnaround times
• Consider adjusting timeline or specifications

**🔄 Custom Order Modifications:**

**If Designer Requests Changes:**
• Review their suggestions carefully
• Discuss alternatives through messaging
• Agree on new timeline and pricing
• Confirm modifications before proceeding

**If You Want to Cancel:**
• Contact designer immediately
• Explain your situation
• Request cancellation and refund
• Refund processed based on order stage

**📞 Getting Help:**
• **Live Chat**: Use the chatbot (that's me!) for immediate help
• **Email Support**: support@fashionconnect.mw
• **Designer Direct**: Message through the platform
• **Complaint System**: Formal complaint process available

**💡 Prevention Tips:**
• Communicate clearly with designers upfront
• Provide detailed specifications and measurements
• Allow reasonable timelines for custom work
• Ask questions before placing orders
• Read designer reviews and policies

**🛡️ Your Protection:**
• Money-back guarantee for rejected orders
• Escrow system protects your payments
• Admin mediation for disputes
• Full refund policy for undelivered orders

Need immediate help with a specific order issue?`,
            type: 'text',
            quickReplies: ['Contact support now', 'Request order refund', 'Find alternative designer', 'File complaint about order']
          };

        default:
          return this.generateEnhancedFallbackResponse(quickReply, { products: [] }, 'general');
      }
    } catch (error) {
      console.error('Error handling quick reply:', error);
      return {
        content: "I'm sorry, I had trouble processing that request. Please try again or ask me anything about FashionConnect - I'm here to help with detailed explanations!",
        type: 'text',
        quickReplies: ['Browse Products', 'Find Designers', 'How It Works', 'Help & Support']
      };
    }
  }
}

export const chatbotService = new ChatbotService();
