# Custom Order Image Test

## Test Steps:

1. **Login as a client**
   - Go to http://localhost:5175
   - Login with client credentials

2. **Navigate to a product**
   - Go to any product page
   - Click "Custom Order" button

3. **Fill custom order form**
   - Fill in measurements
   - Select "Custom Color" option
   - Upload a custom color image
   - Fill other required fields
   - Submit the form

4. **Complete checkout**
   - Go to cart
   - Complete the checkout process
   - This should send a message to the designer

5. **Check the message**
   - Login as the designer
   - Check messages
   - Verify the custom color image appears in the message

## Expected Behavior:

- The custom color image should be uploaded successfully
- The custom color image should be used as the product image in the cart
- The custom color image should appear in the message sent to the designer
- The message should show the custom color image instead of the original product image

## Debug Points:

- Check browser console for debug logs during upload
- Check backend console for product reference debug logs
- Verify the image URL format is correct
- Check if the image is accessible via the URL