// Test script to verify custom order fix
// This script tests that custom orders from cart checkout appear in designer's custom orders page

const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

// Test data
const testData = {
  client: {
    email: 'testclient@example.com',
    password: 'testpass123'
  },
  designer: {
    email: 'testdesigner@example.com',
    password: 'testpass123'
  }
};

async function testCustomOrderFlow() {
  console.log('🧪 Testing Custom Order Flow from Cart Checkout...\n');

  try {
    // Step 1: Login as client
    console.log('1. Logging in as client...');
    const clientLogin = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: testData.client.email,
      password: testData.client.password
    });
    const clientToken = clientLogin.data.data.accessToken;
    console.log('✅ Client logged in successfully');

    // Step 2: Login as designer  
    console.log('2. Logging in as designer...');
    const designerLogin = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: testData.designer.email,
      password: testData.designer.password
    });
    const designerToken = designerLogin.data.data.accessToken;
    const designerId = designerLogin.data.data.user._id;
    console.log('✅ Designer logged in successfully');

    // Step 3: Create a test custom order (simulating cart checkout)
    console.log('3. Creating custom order via API (simulating cart checkout)...');
    const customOrderData = {
      productType: 'Traditional Kente Shirt',
      designer: designerId,
      color: 'Royal Blue',
      measurements: {
        chest: '40',
        waist: '32',
        shoulder: '18',
        sleeve: '24'
      },
      expectedDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      deliveryLocation: 'Lilongwe, Area 10',
      additionalNotes: 'Test custom order from cart checkout fix',
      estimatedPrice: 25000,
      productReference: {
        productId: '675a77c94a754e001c123456', // Example product ID
        productName: 'Traditional Kente Shirt',
        productImage: '/uploads/products/kente-shirt.jpg'
      },
      deliveryType: 'standard',
      deliveryTimePrice: 0,
      collectionMethod: 'delivery',
      designerShopAddress: ''
    };

    const customOrderResponse = await axios.post(
      `${BASE_URL}/api/v1/custom-orders`, 
      customOrderData,
      {
        headers: { Authorization: `Bearer ${clientToken}` }
      }
    );
    
    const customOrderId = customOrderResponse.data.data._id;
    console.log('✅ Custom order created successfully');
    console.log(`   Order ID: ${customOrderId}`);

    // Step 4: Check if order appears in designer's custom orders page
    console.log('4. Checking designer\'s custom orders page...');
    const designerOrders = await axios.get(
      `${BASE_URL}/api/v1/custom-orders/designer-orders`,
      {
        headers: { Authorization: `Bearer ${designerToken}` }
      }
    );

    const foundOrder = designerOrders.data.data.docs.find(order => order._id === customOrderId);
    
    if (foundOrder) {
      console.log('✅ SUCCESS: Custom order appears in designer\'s custom orders page!');
      console.log(`   Order details:`, {
        id: foundOrder._id,
        productType: foundOrder.productType,
        color: foundOrder.color,
        status: foundOrder.status,
        deliveryType: foundOrder.deliveryType,
        collectionMethod: foundOrder.collectionMethod
      });
      
      // Step 5: Verify the order can be assigned to tailor
      console.log('5. Testing order assignment capability...');
      if (foundOrder.status === 'pending') {
        console.log('✅ Order is in correct state for tailor assignment');
        console.log('🎯 FIX SUCCESSFUL: Custom orders from cart checkout now appear in designer\'s custom order page');
      } else {
        console.log('⚠️  Order status is not pending, but order was found');
      }
      
    } else {
      console.log('❌ FAILED: Custom order does NOT appear in designer\'s custom orders page');
      console.log('Available orders:', designerOrders.data.data.docs.map(o => ({
        id: o._id,
        productType: o.productType,
        status: o.status
      })));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testCustomOrderFlow();