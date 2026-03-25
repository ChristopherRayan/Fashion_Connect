import dotenv from 'dotenv';
dotenv.config();

import connectDB from './src/config/db.js';
import { chatbotService } from './src/services/chatbotService.js';

async function testEnhancedChatbot() {
  try {
    console.log('🤖 Testing Enhanced FashionConnect Chatbot...');
    
    // Connect to database
    await connectDB();
    
    // Test bot user initialization
    const botUser = chatbotService.getBotUser();
    console.log('Bot User:', botUser ? 'Found' : 'Not found');
    
    // Test various message types
    const testMessages = [
      "Hello!",
      "I'm looking for a dress",
      "Show me designers",
      "How do I place an order?",
      "Tell me about custom orders"
    ];
    
    for (const testMessage of testMessages) {
      console.log(`\n📝 Testing: "${testMessage}"`);
      
      const context = {
        userId: '507f1f77bcf86cd799439011',
        userName: 'Test User',
        conversationHistory: []
      };
      
      const response = await chatbotService.generateResponse(testMessage, context);
      
      console.log('🤖 Response:', response.content.substring(0, 100) + '...');
      console.log('📊 Intent:', response.intent);
      console.log('🔘 Quick Replies:', response.quickReplies?.slice(0, 2));
      console.log('📦 Products:', response.products?.length || 0);
    }
    
    // Test quick reply
    console.log('\n📝 Testing Quick Reply: "Browse Products"');
    const quickReplyResponse = await chatbotService.handleQuickReply('Browse Products', '507f1f77bcf86cd799439011');
    console.log('🤖 Quick Reply Response:', quickReplyResponse.content.substring(0, 80) + '...');
    
    console.log('\n✅ Enhanced chatbot test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing enhanced chatbot:', error);
    process.exit(1);
  }
}

testEnhancedChatbot();
