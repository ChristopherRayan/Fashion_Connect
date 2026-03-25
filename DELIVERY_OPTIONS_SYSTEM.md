# Custom Order Delivery Options System

## Overview
The custom order delivery type dropdown now uses designer-configured options, allowing each designer to set their own delivery timeframes and pricing for custom orders.

## How It Works

### 1. Designer Configuration
- **Location**: Product Management page → Create/Edit Product → Custom Order Delivery Options
- **Access**: Only available when "Customizable" is enabled for a product
- **Options**: Designers can configure three delivery types:
  - **Standard**: Default option (typically 14 days, free)
  - **Express**: Faster delivery (typically 7 days, additional cost)
  - **Premium**: Rush delivery (typically 3 days, highest additional cost)

### 2. Designer Controls
For each delivery type, designers can configure:
- ✅ **Enable/Disable**: Whether this option is available to customers
- 📅 **Days**: How many days the custom order will take
- 💰 **Price**: Additional cost for this delivery timeframe (in MWK)
- 📝 **Description**: Custom description for the delivery option

### 3. Customer Experience
- **Location**: Product Custom Order modal → Delivery Type dropdown
- **Display**: Only shows delivery options that the designer has enabled
- **Information**: Shows days, pricing, and designer name
- **Selection**: Customers choose from available options set by the designer

## Current Configuration

### Default Settings for New Products
```javascript
deliveryTimeOptions: {
  standard: { 
    enabled: true, 
    days: 14, 
    description: 'Standard custom order delivery', 
    price: 0 
  },
  express: { 
    enabled: true, 
    days: 7, 
    description: 'Express custom order delivery', 
    price: 2000 
  },
  premium: { 
    enabled: true, 
    days: 3, 
    description: 'Premium rush custom order delivery', 
    price: 5000 
  }
}
```

### Current Customizable Products
All 7 customizable products now have 3/3 delivery options enabled:
1. Traditional Chitenge Dress
2. Traditional Kente Shirt
3. Mens Combat Shirt
4. Black Distressed Denim Hooded Jacket
5. Boys Cargo Shot
6. Tuxedo Suit
7. Indian Wedding Suit

## Technical Implementation

### Backend (Product Model)
```javascript
// Product schema includes deliveryTimeOptions
deliveryTimeOptions: {
  standard: {
    enabled: { type: Boolean, default: true },
    days: { type: Number, default: 14 },
    description: { type: String, default: 'Standard delivery' },
    price: { type: Number, default: 0 }
  },
  express: {
    enabled: { type: Boolean, default: false },
    days: { type: Number, default: 7 },
    description: { type: String, default: 'Express delivery' },
    price: { type: Number, default: 0 }
  },
  premium: {
    enabled: { type: Boolean, default: false },
    days: { type: Number, default: 3 },
    description: { type: String, default: 'Premium delivery' },
    price: { type: Number, default: 0 }
  }
}
```

### Frontend (ProductCustomOrder Component)
```javascript
// Reads from product.deliveryTimeOptions
// Only shows enabled options in dropdown
// Displays pricing and timeframes
// Calculates expected delivery dates
```

## Benefits

### For Designers
- ✅ **Full Control**: Set their own delivery timeframes and pricing
- ✅ **Flexible Pricing**: Charge appropriately for rush orders
- ✅ **Business Model**: Can offer premium services for higher margins
- ✅ **Realistic Timelines**: Set delivery times based on their capacity

### For Customers
- ✅ **Clear Options**: See exactly what delivery options are available
- ✅ **Transparent Pricing**: Know the cost of faster delivery upfront
- ✅ **Designer-Specific**: Understand that each designer has their own terms
- ✅ **Informed Choice**: Choose delivery speed vs. cost based on their needs

## Usage Examples

### Example 1: Budget-Conscious Customer
- Selects "Standard (14 days) - MWK 0"
- Gets custom order at base price
- Waits standard timeframe

### Example 2: Urgent Order
- Selects "Premium (3 days) - MWK 5,000"
- Pays additional MWK 5,000 for rush delivery
- Gets custom order in 3 days

### Example 3: Designer Customization
- Designer can disable premium option if they can't handle rush orders
- Designer can adjust pricing based on their costs and capacity
- Designer can modify descriptions to match their service style

## Maintenance Scripts

### Available Scripts
1. `ensureDeliveryTimeOptions.js` - Ensures all products have delivery options
2. `enableMoreDeliveryOptions.js` - Enables multiple options for customizable products
3. `checkDeliveryOptions.js` - Verifies current configuration
4. `testCustomOrderDeliveryOptions.js` - Tests the frontend behavior

### Running Scripts
```bash
cd backend
node scripts/scriptName.js
```

## Future Enhancements

### Potential Improvements
- 🔄 **Dynamic Pricing**: Allow percentage-based pricing (e.g., +20% for express)
- 📍 **Location-Based**: Different delivery options based on customer location
- 📊 **Analytics**: Track which delivery options are most popular
- 🔔 **Notifications**: Alert designers when rush orders are placed
- 📅 **Calendar Integration**: Show designer availability for different timeframes

## Troubleshooting

### Common Issues
1. **Empty Dropdown**: Check if any delivery options are enabled
2. **Missing Pricing**: Ensure price field exists (run migration scripts)
3. **Wrong Timeframes**: Verify days field is properly set
4. **Designer Changes**: Delivery options only apply to new orders

### Verification Steps
1. Check product has `customizable: true`
2. Verify `deliveryTimeOptions` exists and has enabled options
3. Test in ProductCustomOrder modal
4. Confirm pricing displays correctly

## Conclusion
The delivery options system now fully uses designer-configured settings, giving designers control over their custom order delivery terms while providing customers with clear, transparent options for delivery timeframes and pricing.