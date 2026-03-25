import { BaseService } from './baseService';
import { ApiResponse } from '../types';

export interface BotUser {
  id: string;
  name: string;
  email: string;
  profileImage: string;
  businessName: string;
  isBot: boolean;
  isOnline: boolean;
}

export interface BotConversation {
  id: string;
  participants: Array<{
    id: string;
    name: string;
    avatar: string;
    isBot?: boolean;
  }>;
  lastActivity: string;
  unreadCount: number;
}

export interface BotMessage {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: string;
  read: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  messageType?: 'text' | 'bot_response';
  sender: {
    id: string;
    name: string;
    avatar: string;
    isBot?: boolean;
  };
  receiver: {
    id: string;
    name: string;
    avatar: string;
    isBot?: boolean;
  };
  botData?: {
    quickReplies: string[];
    products: any[];
    designers: any[];
    responseType: 'greeting' | 'product_search' | 'order_help' | 'general' | 'quick_reply';
  };
}

export interface BotResponse {
  userMessage: BotMessage;
  botMessage: BotMessage;
  botResponse: {
    products: any[];
    quickReplies: string[];
    designers: any[];
  };
}

export interface QuickReplyResponse {
  botMessage: BotMessage;
  botResponse: {
    products: any[];
    quickReplies: string[];
    designers: any[];
  };
}

class ChatbotService extends BaseService {
  private readonly API_ENDPOINTS = {
    BOT_INFO: '/chatbot/info',
    START_CONVERSATION: '/chatbot/start',
    SEND_MESSAGE: '/chatbot/message',
    QUICK_REPLY: '/chatbot/quick-reply'
  };

  /**
   * Get bot information
   */
  async getBotInfo(): Promise<BotUser> {
    try {
      const response = await this.httpClient.get<ApiResponse<{ bot: BotUser }>>(
        this.API_ENDPOINTS.BOT_INFO,
        true // Requires authentication
      );

      const data = this.extractData(response);
      return data.bot;
    } catch (error) {
      console.error('Error getting bot info:', error);
      this.handleError(error);
    }
  }

  /**
   * Start conversation with bot
   */
  async startBotConversation(): Promise<BotConversation> {
    try {
      const response = await this.httpClient.post<ApiResponse<{ conversation: BotConversation }>>(
        this.API_ENDPOINTS.START_CONVERSATION,
        {},
        true // Requires authentication
      );

      const data = this.extractData(response);
      return data.conversation;
    } catch (error) {
      console.error('Error starting bot conversation:', error);
      // Return a mock conversation for fallback
      return {
        id: 'mock-conversation-' + Date.now(),
        participants: [],
        lastActivity: new Date().toISOString(),
        unreadCount: 0
      };
    }
  }

  /**
   * Send message to bot
   */
  async sendMessageToBot(conversationId: string, content: string): Promise<BotResponse> {
    try {
      const response = await this.httpClient.post<ApiResponse<BotResponse>>(
        this.API_ENDPOINTS.SEND_MESSAGE,
        {
          conversationId,
          content
        },
        true // Requires authentication
      );

      return this.extractData(response);
    } catch (error) {
      console.error('Error sending message to bot:', error);
      // Return a fallback response
      return this.generateFallbackResponse(content);
    }
  }

  /**
   * Handle quick reply to bot
   */
  async handleQuickReply(conversationId: string, quickReply: string): Promise<QuickReplyResponse> {
    try {
      const response = await this.httpClient.post<ApiResponse<QuickReplyResponse>>(
        this.API_ENDPOINTS.QUICK_REPLY,
        {
          conversationId,
          quickReply
        },
        true // Requires authentication
      );

      return this.extractData(response);
    } catch (error) {
      console.error('Error handling quick reply:', error);
      // Return a fallback response
      return this.generateQuickReplyFallback(quickReply);
    }
  }

  /**
   * Generate fallback response when API fails
   */
  private generateFallbackResponse(content: string): BotResponse {
    const message = content.toLowerCase();
    let botContent = "I'm here to help you with FashionConnect! ";
    let quickReplies = ['Browse Products', 'Find Designers', 'Help & Support'];

    if (message.includes('hello') || message.includes('hi')) {
      botContent = `Hello! 👋 Welcome to FashionConnect - Malawi's premier fashion marketplace!

I'm your personal fashion assistant, here to help you:
✨ Discover unique pieces from talented local designers
🛍️ Navigate our shopping experience seamlessly
👗 Understand custom order processes step-by-step
💳 Learn about secure payments and order tracking

Whether you're looking for ready-made fashion or want something custom-tailored just for you, I'll guide you through every step! What would you like to explore first?`;
      quickReplies = ['Browse Products', 'Custom Orders', 'How It Works', 'Find Designers'];
    } else if (message.includes('product') || message.includes('buy') || message.includes('shop')) {
      botContent = `🛍️ **Finding Your Perfect Fashion Pieces**

**How to Shop on FashionConnect:**
1️⃣ **Browse Categories**: Men's Fashion, Women's Fashion, Unisex
2️⃣ **Filter & Search**: Use our smart search to find exactly what you want
3️⃣ **View Details**: See full product info, images, and customer reviews
4️⃣ **Add to Cart**: Products stay in your cart between sessions
5️⃣ **Secure Checkout**: Pay safely with Ctech Pay (cards or Airtel Money)

**Product Categories Available:**
👔 **Men's**: Shirts, pants, suits, traditional wear, casual
👗 **Women's**: Dresses, blouses, skirts, accessories, traditional
👕 **Unisex**: T-shirts, hoodies, casual wear

What type of clothing are you looking for today?`;
      quickReplies = ['Men\'s Fashion', 'Women\'s Fashion', 'Unisex Items', 'Custom Orders'];
    } else if (message.includes('designer')) {
      botContent = `👨‍🎨 **Connecting with Talented Designers**

FashionConnect showcases Malawi's most creative fashion designers! Here's how our designer system works:

**🔍 Finding Designers:**
• Browse designer profiles with portfolios and specialties
• View their collections and previous work
• Read reviews from other customers
• Filter by style, location, or specialty

**💬 Connecting with Designers:**
1️⃣ **Browse Profiles**: View their work and read about their experience
2️⃣ **Follow Favorites**: Get notified when they post new products
3️⃣ **Direct Messaging**: Chat in real-time about your needs
4️⃣ **Custom Orders**: Request personalized pieces with your measurements

Ready to discover amazing designers?`;
      quickReplies = ['Find Designers', 'View Collections', 'Custom Orders', 'Designer Verification'];
    } else if (message.includes('order')) {
      botContent = `📦 **Complete Order Management Guide**

FashionConnect makes ordering simple and secure! Here's everything you need to know:

**🛒 Types of Orders:**
• **Ready-Made**: Purchase existing products immediately
• **Custom Orders**: Request personalized pieces from designers

**📋 Order Process (Ready-Made):**
1️⃣ **Browse & Select**: Find products you love
2️⃣ **Add to Cart**: Items stay saved between sessions
3️⃣ **Review Cart**: Check sizes, quantities, and total
4️⃣ **Secure Checkout**: Pay with Ctech Pay
5️⃣ **Designer Approval**: Designer confirms and processes order
6️⃣ **Production**: Item prepared for shipping
7️⃣ **Delivery**: Receive your fashion pieces!

What specific aspect of ordering would you like to know more about?`;
      quickReplies = ['Track Order', 'Payment Methods', 'Custom Orders', 'Order Issues'];
    } else {
      botContent = "I'm here to help you with anything related to FashionConnect! I have detailed knowledge about our processes, products, designers, and can guide you through every step. What would you like to know?";
    }

    const mockBotMessage: BotMessage = {
      id: 'fallback-' + Date.now(),
      content: botContent,
      senderId: 'bot',
      receiverId: 'user',
      timestamp: new Date().toISOString(),
      read: false,
      status: 'sent',
      messageType: 'bot_response',
      sender: {
        id: 'bot',
        name: 'FashionConnect Assistant',
        avatar: 'https://ui-avatars.com/api/?name=FC+Bot&background=f59e0b&color=000',
        isBot: true
      },
      receiver: {
        id: 'user',
        name: 'User',
        avatar: ''
      },
      botData: {
        quickReplies,
        products: [],
        designers: [],
        responseType: 'general'
      }
    };

    const mockUserMessage: BotMessage = {
      ...mockBotMessage,
      id: 'user-' + Date.now(),
      content,
      senderId: 'user',
      receiverId: 'bot',
      sender: mockBotMessage.receiver,
      receiver: mockBotMessage.sender
    };

    return {
      userMessage: mockUserMessage,
      botMessage: mockBotMessage,
      botResponse: {
        products: [],
        quickReplies,
        designers: []
      }
    };
  }

  /**
   * Generate fallback response for quick replies
   */
  private generateQuickReplyFallback(quickReply: string): QuickReplyResponse {
    let botContent = "Thanks for your interest! ";
    let quickReplies = ['Browse Products', 'Find Designers', 'Help & Support'];

    switch (quickReply) {
      case 'Browse Products':
        botContent = `🛍️ **How to Browse Products on FashionConnect**

Here's your complete guide to finding and browsing products:

**Step 1: Access the Product Catalog**
• From the homepage, click the "Browse Products" button
• Use the main navigation menu to select categories
• Click on the search bar at the top of any page

**Step 2: Product Categories Available**
👔 **Men's Fashion**: Formal shirts, casual wear, traditional clothing, suits, accessories
👗 **Women's Fashion**: Dresses, blouses, skirts, traditional wear, jewelry
👕 **Unisex Items**: T-shirts, hoodies, traditional unisex clothing, accessories

**Step 3: Using Search and Filters**
• Use the search bar for specific items
• Apply filters for price, designer, size, and ratings
• Sort by newest, price, or popularity

Which category would you like to explore first?`;
        quickReplies = ['Show men\'s clothing categories', 'Browse women\'s fashion', 'How to use filters effectively?', 'View newest arrivals'];
        break;
      case 'Find Designers':
        botContent = "Here are some ways to discover our talented designers: browse their profiles, view their collections, or search by specialty. Would you like to explore?";
        quickReplies = ['View Collections', 'Browse Profiles', 'Search Designers', 'Custom Orders'];
        break;
      case 'Help & Support':
        botContent = "I'm here to help! I can assist with finding products, understanding the platform, order questions, and connecting with designers. What do you need help with?";
        quickReplies = ['Order Help', 'Payment Info', 'Account Issues', 'Platform Guide'];
        break;
      case 'Custom Orders':
        botContent = `✂️ **How to Create a Custom Order on FashionConnect**

Here's exactly how you can create a custom order:

**Step 1: Log into Your Account**
• Make sure you're logged in as a buyer/client

**Step 2: Find Your Designer**
• Go to the designer's profile page
• You can find designers via search or product pages

**Step 3: Request Custom Order**
• Click the 'Request Custom Order' button on their profile
• Fill out the custom order form with:
  - Product type (e.g., jacket, gown)
  - Style description and measurements
  - Your budget and delivery deadline

**Step 4: Designer Response & Payment**
• Designer will accept, negotiate, or reject
• Once accepted, pay via Ctech Pay (held in escrow)
• Designer starts production with progress updates
• Confirm delivery and leave a review when complete

Ready to create something uniquely yours?`;
        quickReplies = ['How do I pay for custom orders?', 'Find verified designers', 'What if my order is delayed?', 'Custom order pricing guide'];
        break;
      default:
        botContent = `I understand you're interested in "${quickReply}". Let me help you with that! What would you like to know more about?`;
    }

    const mockBotMessage: BotMessage = {
      id: 'quick-fallback-' + Date.now(),
      content: botContent,
      senderId: 'bot',
      receiverId: 'user',
      timestamp: new Date().toISOString(),
      read: false,
      status: 'sent',
      messageType: 'bot_response',
      sender: {
        id: 'bot',
        name: 'FashionConnect Assistant',
        avatar: 'https://ui-avatars.com/api/?name=FC+Bot&background=f59e0b&color=000',
        isBot: true
      },
      receiver: {
        id: 'user',
        name: 'User',
        avatar: ''
      },
      botData: {
        quickReplies,
        products: [],
        designers: [],
        responseType: 'quick_reply'
      }
    };

    return {
      botMessage: mockBotMessage,
      botResponse: {
        products: [],
        quickReplies,
        designers: []
      }
    };
  }

  /**
   * Check if user/message is from bot
   */
  isBot(user: any): boolean {
    return user?.isBot === true || user?.role === 'BOT';
  }

  /**
   * Check if message is bot response
   */
  isBotMessage(message: any): boolean {
    return message?.messageType === 'bot_response' || this.isBot(message?.sender);
  }

  /**
   * Get bot avatar URL
   */
  getBotAvatarUrl(): string {
    return 'https://ui-avatars.com/api/?name=FC+Bot&background=f59e0b&color=000';
  }

  /**
   * Check if chatbot is enabled
   */
  isChatbotEnabled(): boolean {
    return true; // Always enabled for enhanced fallback system
  }
}

export const chatbotService = new ChatbotService();
