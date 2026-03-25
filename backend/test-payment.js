import axios from 'axios';
import FormData from 'form-data';

// Test Ctech Payment Gateway Integration
const testPaymentGateway = async () => {
  console.log('🧪 Testing Ctech Payment Gateway Integration...\n');

  const token = '37e4099551760b60719d1c6e305c5090';
  const registration = 'BICT3321';
  const baseURL = 'https://api-sandbox.ctechpay.com/student';

  try {
    // Test 1: Create Payment Order
    console.log('1️⃣ Testing Payment Order Creation...');
    
    const formData = new FormData();
    formData.append('token', token);
    formData.append('registration', registration);
    formData.append('amount', '10000'); // 100 MWK
    formData.append('redirectUrl', 'http://localhost:5173/client/orders/test/payment-success');
    formData.append('cancelUrl', 'http://localhost:5173/client/orders/test/payment-cancelled');
    formData.append('cancelText', 'Cancel Payment');

    const orderResponse = await axios.post(
      `${baseURL}/?endpoint=order`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000
      }
    );

    console.log('✅ Payment Order Created Successfully:');
    console.log('   Order Reference:', orderResponse.data.order_reference);
    console.log('   Payment URL:', orderResponse.data.payment_page_URL);
    console.log('   Response:', JSON.stringify(orderResponse.data, null, 2));

    const orderReference = orderResponse.data.order_reference;

    // Test 2: Check Payment Status
    console.log('\n2️⃣ Testing Payment Status Check...');
    
    const statusFormData = new FormData();
    statusFormData.append('token', token);
    statusFormData.append('registration', registration);
    statusFormData.append('orderRef', orderReference);

    const statusResponse = await axios.post(
      `${baseURL}/status/`,
      statusFormData,
      {
        headers: {
          ...statusFormData.getHeaders(),
          'Content-Type': 'multipart/form-data'
        },
        timeout: 15000
      }
    );

    console.log('✅ Payment Status Check Successful:');
    console.log('   Status:', statusResponse.data.status);
    console.log('   Response:', JSON.stringify(statusResponse.data, null, 2));

    // Test 3: Test Airtel Money Payment (will fail without valid phone)
    console.log('\n3️⃣ Testing Airtel Money Payment (Demo)...');
    
    const mobileFormData = new FormData();
    mobileFormData.append('airtel', '1');
    mobileFormData.append('token', token);
    mobileFormData.append('registration', registration);
    mobileFormData.append('amount', '5000'); // 50 MWK
    mobileFormData.append('phone', '0991234567'); // Demo phone number

    try {
      const mobileResponse = await axios.post(
        `${baseURL}/mobile/`,
        mobileFormData,
        {
          headers: {
            ...mobileFormData.getHeaders(),
            'Content-Type': 'multipart/form-data'
          },
          timeout: 45000
        }
      );

      console.log('✅ Airtel Money Payment Initiated:');
      console.log('   Transaction ID:', mobileResponse.data.trans_id);
      console.log('   Status:', mobileResponse.data.status);
      console.log('   Response:', JSON.stringify(mobileResponse.data, null, 2));

      // Test mobile payment status check
      if (mobileResponse.data.trans_id) {
        console.log('\n4️⃣ Testing Mobile Payment Status Check...');
        
        const mobileStatusResponse = await axios.get(
          `https://apisandbox.ctechpay.com/student/mobile/status/?trans_id=${mobileResponse.data.trans_id}`,
          { timeout: 15000 }
        );

        console.log('✅ Mobile Payment Status Check:');
        console.log('   Status:', mobileStatusResponse.data.status);
        console.log('   Response:', JSON.stringify(mobileStatusResponse.data, null, 2));
      }

    } catch (mobileError) {
      console.log('⚠️ Airtel Money Payment Test (Expected to fail with demo data):');
      console.log('   Error:', mobileError.response?.data || mobileError.message);
    }

    console.log('\n🎉 Payment Gateway Integration Test Completed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Card Payment Order Creation: Working');
    console.log('   ✅ Payment Status Check: Working');
    console.log('   ⚠️ Airtel Money: Requires valid phone number');
    console.log('\n💡 Next Steps:');
    console.log('   1. Test with real payment in sandbox environment');
    console.log('   2. Implement webhook handling for automatic status updates');
    console.log('   3. Add proper error handling for production');

  } catch (error) {
    console.error('❌ Payment Gateway Test Failed:');
    console.error('   Error:', error.response?.data || error.message);
    console.error('   Status:', error.response?.status);
    
    if (error.code === 'ECONNABORTED') {
      console.error('   Cause: Request timeout - Check network connection');
    } else if (error.response?.status === 401) {
      console.error('   Cause: Invalid credentials - Check token and registration');
    } else if (error.response?.status === 400) {
      console.error('   Cause: Invalid request parameters');
    }
  }
};

// Test Payment Service Functions
const testPaymentService = async () => {
  console.log('\n🧪 Testing Payment Service Functions...\n');

  try {
    // Test amount validation
    console.log('1️⃣ Testing Amount Validation...');
    const validAmounts = [1000, 50000, 1000000];
    const invalidAmounts = [0, -1000, 20000000];

    validAmounts.forEach(amount => {
      const isValid = typeof amount === 'number' && amount > 0 && amount <= 10000000;
      console.log(`   ${amount}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    });

    invalidAmounts.forEach(amount => {
      const isValid = typeof amount === 'number' && amount > 0 && amount <= 10000000;
      console.log(`   ${amount}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    });

    // Test phone number validation
    console.log('\n2️⃣ Testing Phone Number Validation...');
    const validPhones = ['0991234567', '0881234567', '0891234567'];
    const invalidPhones = ['0971234567', '123456789', '09912345678'];

    const validateAirtelPhone = (phone) => {
      const cleanPhone = phone.replace(/\s+/g, '');
      const phoneRegex = /^(099|088|089)\d{7}$/;
      return phoneRegex.test(cleanPhone);
    };

    validPhones.forEach(phone => {
      const isValid = validateAirtelPhone(phone);
      console.log(`   ${phone}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    });

    invalidPhones.forEach(phone => {
      const isValid = validateAirtelPhone(phone);
      console.log(`   ${phone}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    });

    // Test amount formatting
    console.log('\n3️⃣ Testing Amount Formatting...');
    const amounts = [1000, 50000, 1000000];
    
    amounts.forEach(amount => {
      const formatted = `MWK ${(amount / 100).toLocaleString('en-MW', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      })}`;
      console.log(`   ${amount} tambala = ${formatted}`);
    });

    console.log('\n✅ Payment Service Functions Test Completed!');

  } catch (error) {
    console.error('❌ Payment Service Test Failed:', error.message);
  }
};

// Run tests
const runTests = async () => {
  console.log('🚀 Starting Payment Integration Tests...\n');
  
  await testPaymentGateway();
  await testPaymentService();
  
  console.log('\n🏁 All Tests Completed!');
};

runTests().catch(console.error);
