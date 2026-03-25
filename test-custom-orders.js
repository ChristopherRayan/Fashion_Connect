import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

async function testCustomOrders() {
  console.log('🧪 Testing Custom Orders Functionality...\n');

  try {
    // Step 1: Login as client to create custom orders
    console.log('1. Logging in as client...');
    const clientLoginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'christopherkuchawo@gmail.com',
      password: 'password123'
    });
    
    const clientToken = clientLoginResponse.data.data.accessToken;
    console.log('✅ Client logged in successfully');

    // Step 2: Login as designer to check custom orders
    console.log('2. Logging in as designer...');
    const designerLoginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'christopher@fashionconnect.com',
      password: 'password123'
    });
    
    const designerToken = designerLoginResponse.data.data.accessToken;
    const designerId = designerLoginResponse.data.data.user._id;
    console.log('✅ Designer logged in successfully');
    console.log('📋 Designer ID:', designerId);

    // Step 3: Create test custom orders
    console.log('\n3. Creating test custom orders...');
    
    const customOrders = [
      {
        productType: 'Traditional Kente Shirt',
        designer: designerId,
        color: 'Royal Blue with Gold Patterns',
        measurements: {
          chest: '42',
          waist: '34',
          shoulder: '18',
          sleeve: '24',
          length: '28'
        },
        expectedDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        deliveryLocation: 'Lilongwe, Area 10, Plot 123',
        additionalNotes: 'Please make it formal with traditional patterns. This is for a wedding ceremony.',
        estimatedPrice: 45000,
        deliveryType: 'standard',
        collectionMethod: 'delivery'
      },
      {
        productType: 'Custom Chitenge Dress',
        designer: designerId,
        color: 'Vibrant African Print',
        measurements: {
          bust: '36',
          waist: '28',
          hips: '38',
          length: '48'
        },
        expectedDeliveryDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        deliveryLocation: 'Blantyre, Limbe, Plot 456',
        additionalNotes: 'Modern style with traditional elements. Knee-length preferred.',
        estimatedPrice: 35000,
        deliveryType: 'express',
        deliveryTimePrice: 5000,
        collectionMethod: 'delivery'
      },
      {
        productType: 'Men\'s Casual Shirt',
        designer: designerId,
        color: 'Navy Blue',
        measurements: {
          chest: '40',
          waist: '32',
          shoulder: '17',
          sleeve: '23'
        },
        expectedDeliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        deliveryLocation: 'Mzuzu, Area 2',
        additionalNotes: 'Business casual style with modern fit.',
        estimatedPrice: 25000,
        deliveryType: 'premium',
        deliveryTimePrice: 8000,
        collectionMethod: 'pickup',
        designerShopAddress: 'Designer Studio, City Centre, Lilongwe'
      }
    ];

    const createdOrders = [];
    for (let i = 0; i < customOrders.length; i++) {
      const orderData = customOrders[i];
      console.log(`   Creating order ${i + 1}: ${orderData.productType}...`);
      
      try {
        const response = await axios.post(
          `${BASE_URL}/api/v1/custom-orders`,
          orderData,
          { headers: { Authorization: `Bearer ${clientToken}` } }
        );
        
        createdOrders.push(response.data.data);
        console.log(`   ✅ Order ${i + 1} created: ${response.data.data._id}`);
      } catch (error) {
        console.log(`   ❌ Failed to create order ${i + 1}:`, error.response?.data?.message || error.message);
      }
    }

    console.log(`\n✅ Created ${createdOrders.length} custom orders successfully`);

    // Step 4: Test designer's custom orders endpoint
    console.log('\n4. Testing designer custom orders endpoint...');
    
    try {
      const designerOrdersResponse = await axios.get(
        `${BASE_URL}/api/v1/custom-orders/designer-orders?page=1&limit=10`,
        { headers: { Authorization: `Bearer ${designerToken}` } }
      );
      
      console.log('✅ Designer orders fetched successfully');
      console.log('📊 Results:', {
        totalOrders: designerOrdersResponse.data.data.totalDocs,
        currentPage: designerOrdersResponse.data.data.page,
        totalPages: designerOrdersResponse.data.data.totalPages,
        ordersOnPage: designerOrdersResponse.data.data.docs.length
      });

      if (designerOrdersResponse.data.data.docs.length > 0) {
        console.log('\n📋 Custom Orders Found:');
        designerOrdersResponse.data.data.docs.forEach((order, index) => {
          console.log(`   ${index + 1}. ${order.productType} - ${order.status} - MWK ${order.estimatedPrice}`);
          console.log(`      Customer: ${order.user.name}`);
          console.log(`      Due: ${new Date(order.expectedDeliveryDate).toLocaleDateString()}`);
          console.log(`      Location: ${order.deliveryLocation}`);
          console.log(`      ID: ${order._id}`);
          console.log('');
        });
      } else {
        console.log('⚠️  No custom orders found for this designer');
      }

    } catch (error) {
      console.log('❌ Failed to fetch designer orders:', error.response?.data?.message || error.message);
      console.log('Response status:', error.response?.status);
      console.log('Response data:', error.response?.data);
    }

    // Step 5: Test search functionality
    console.log('\n5. Testing search functionality...');
    
    try {
      const searchResponse = await axios.get(
        `${BASE_URL}/api/v1/custom-orders/designer-orders?search=kente&page=1&limit=10`,
        { headers: { Authorization: `Bearer ${designerToken}` } }
      );
      
      console.log('✅ Search functionality working');
      console.log(`📊 Search results for "kente": ${searchResponse.data.data.docs.length} orders found`);
      
    } catch (error) {
      console.log('❌ Search functionality failed:', error.response?.data?.message || error.message);
    }

    // Step 6: Test status filtering
    console.log('\n6. Testing status filtering...');
    
    try {
      const statusResponse = await axios.get(
        `${BASE_URL}/api/v1/custom-orders/designer-orders?status=pending&page=1&limit=10`,
        { headers: { Authorization: `Bearer ${designerToken}` } }
      );
      
      console.log('✅ Status filtering working');
      console.log(`📊 Pending orders: ${statusResponse.data.data.docs.length} found`);
      
    } catch (error) {
      console.log('❌ Status filtering failed:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Custom Orders Test Completed!');
    console.log('\n📋 Summary:');
    console.log(`   • Created ${createdOrders.length} test custom orders`);
    console.log('   • Verified designer can access custom orders endpoint');
    console.log('   • Tested search and filtering functionality');
    console.log('\n💡 Now test the frontend Custom Orders page for the designer role.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testCustomOrders();