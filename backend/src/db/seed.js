import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import { User } from '../models/user.model.js';
import { Product } from '../models/product.model.js';
import { Review } from '../models/review.model.js';
import { Order } from '../models/order.model.js';
import { CustomOrder } from '../models/customOrder.model.js';
import { mockUsers, mockProducts, mockReviews, mockOrders, mockCustomOrders } from './mockData.js';
import bcrypt from 'bcryptjs';
dotenv.config({ path: './.env' });
connectDB();
const importData = async () => {
  try {
 // Clear existing data (preserve existing users)
 await Order.deleteMany();
 await Review.deleteMany();
 await Product.deleteMany();
 await CustomOrder.deleteMany();

 // Check for existing users and preserve them
 const existingUsers = await User.find({});
 if (existingUsers.length > 0) {
   console.log(`⚠️  Found ${existingUsers.length} existing users. Preserving them...`);
   console.log('Existing users:', existingUsers.map(u => `${u.name} (${u.email})`).join(', '));
 } else {
   // Only delete users if none exist
   await User.deleteMany();
   console.log('No existing users found, clearing user data...');
 }

 console.log('Data cleared (users preserved)...');
 // --- Create Users ---
 // Hash the default password
 const hashedPassword = await bcrypt.hash('password123', 10);

 // We need to add a password to the mock users
 const usersWithPasswords = mockUsers.map(user => ({
   ...user,
   password: hashedPassword // Use hashed password for all mock users
 }));

 // Create users in order: non-tailors first, then tailors
 const nonTailorUsers = usersWithPasswords.filter(user => user.role !== 'TAILOR');
 const tailorUsers = usersWithPasswords.filter(user => user.role === 'TAILOR');

 // Check for existing users and only create new ones
 const existingEmails = existingUsers.map(user => user.email);
 const newNonTailorUsers = nonTailorUsers.filter(user => !existingEmails.includes(user.email));
 const newTailorUsers = tailorUsers.filter(user => !existingEmails.includes(user.email));

 let createdNonTailorUsers = [];
 let createdTailorUsers = [];

 if (newNonTailorUsers.length > 0) {
   createdNonTailorUsers = await User.insertMany(newNonTailorUsers);
   console.log(`${createdNonTailorUsers.length} new non-tailor users imported...`);
 } else {
   console.log('All non-tailor users already exist, skipping...');
 }

 // Create a map for easy lookup (include both existing and newly created users)
 const userMap = {};
 existingUsers.forEach(user => {
   userMap[user.email] = user._id;
 });
 createdNonTailorUsers.forEach(user => {
   userMap[user.email] = user._id;
 });

 // Now create tailors with correct designerId references
 const tailorsWithCorrectDesignerId = newTailorUsers.map(tailor => {
   const tailorData = mockUsers.find(mu => mu.email === tailor.email);
   if (tailorData && tailorData.designerEmail) {
     const designerId = userMap[tailorData.designerEmail];
     if (designerId) {
       return { ...tailor, designerId };
     }
   }
   // If no designer found, skip this tailor
   console.log(`Skipping tailor ${tailor.email} - designer not found`);
   return null;
 }).filter(Boolean);

 if (tailorsWithCorrectDesignerId.length > 0) {
   createdTailorUsers = await User.insertMany(tailorsWithCorrectDesignerId);
   console.log(`${createdTailorUsers.length} new tailor users imported...`);
 } else {
   console.log('All tailor users already exist or no valid tailors to create...');
 }

 const createdUsers = [...createdNonTailorUsers, ...createdTailorUsers];
 // Update userMap with newly created users
 createdUsers.forEach(user => {
   userMap[user.email] = user._id;
 });
 
 // Build designer map from all users (existing + newly created)
 const allUsers = [...existingUsers, ...createdUsers];
 const designerMap = allUsers
   .filter(u => u.role === 'DESIGNER')
   .reduce((acc, designer) => {
     acc[designer.name] = designer._id;
     return acc;
   }, {});

 // --- Create Products ---
 const productsToCreate = mockProducts.map(product => {
   const designerId = designerMap[product.designer.name];
   return { ...product, designer: designerId };
 });
 const createdProducts = await Product.insertMany(productsToCreate);
 console.log('Products imported...');
 const productMap = createdProducts.reduce((acc, prod) => {
     // Find the original mock product to get its ID
     const mockProduct = mockProducts.find(mp => mp.name === prod.name);
     if (mockProduct) {
       acc[mockProduct.id] = prod._id;
     }
     return acc;
 }, {});
 // --- Create Reviews ---
 const reviewsToCreate = mockReviews.map(review => {
     const userId = userMap['chikondi.banda@example.com']; // Mocking one user for all reviews for simplicity
     const productId = productMap[review.productId];
     // Find the designer from the product
     const product = createdProducts.find(p => p._id.toString() === productId?.toString());
     const designerId = product ? product.designer : null;

     if (!userId || !productId || !designerId) {
       console.log('Skipping review due to missing references:', { userId, productId, designerId });
       return null;
     }

     return {
       user: userId,
       product: productId,
       designer: designerId,
       rating: review.rating,
       comment: review.comment,
       title: review.title
     };
 }).filter(Boolean); // Remove null entries

 if (reviewsToCreate.length > 0) {
   await Review.insertMany(reviewsToCreate);
   console.log('Reviews imported...');
 } else {
   console.log('No reviews to import...');
 }
 // --- Create Orders ---
 const ordersToCreate = mockOrders.map(order => {
     const userId = userMap['chikondi.banda@example.com']; // Mock user
     const designerId = designerMap[order.designerName];
     const items = order.items.map(item => ({
         product: productMap[item.id],
         name: item.name,
         price: item.price,
         quantity: item.quantity
     })).filter(item => item.product); // Only include items with valid product references

     if (!userId || !designerId || items.length === 0) {
       console.log('Skipping order due to missing references:', { userId, designerId, itemsCount: items.length });
       return null;
     }

     return {
       buyer: userId,
       designer: designerId,
       items,
       status: order.status,
       totalAmount: order.totalAmount
     };
 }).filter(Boolean); // Remove null entries

 if (ordersToCreate.length > 0) {
   await Order.insertMany(ordersToCreate);
   console.log('Orders imported...');
 } else {
   console.log('No orders to import...');
 }

 // --- Create Custom Orders ---
 const customOrdersToCreate = mockCustomOrders.map(customOrder => {
   const userId = userMap[customOrder.userEmail];
   const designerId = userMap[customOrder.designerEmail];
   const tailorId = customOrder.assignedTailorEmail ? userMap[customOrder.assignedTailorEmail] : null;

   if (!userId || !designerId) {
     console.log('Skipping custom order due to missing references:', {
       userEmail: customOrder.userEmail,
       designerEmail: customOrder.designerEmail,
       userId: !!userId,
       designerId: !!designerId
     });
     return null;
   }

   return {
     user: userId,
     designer: designerId,
     productType: customOrder.productType,
     color: customOrder.color,
     measurements: customOrder.measurements,
     expectedDeliveryDate: customOrder.expectedDeliveryDate,
     deliveryLocation: customOrder.deliveryLocation,
     additionalNotes: customOrder.additionalNotes,
     estimatedPrice: customOrder.estimatedPrice,
     status: customOrder.status,
     assignedTailor: tailorId
   };
 }).filter(Boolean); // Remove null entries

 if (customOrdersToCreate.length > 0) {
   // Check if custom orders already exist
   const existingCustomOrders = await CustomOrder.find({});
   if (existingCustomOrders.length === 0) {
     await CustomOrder.insertMany(customOrdersToCreate);
     console.log(`${customOrdersToCreate.length} custom orders imported...`);
   } else {
     console.log(`${existingCustomOrders.length} custom orders already exist, skipping...`);
   }
 } else {
   console.log('No valid custom orders to import (missing user references)...');
 }

 console.log('✅ Data Import Complete!');
 process.exit();
  } catch (error) {
 console.error(`Error seeding data: ${error}`);
 process.exit(1);
  }
};
const destroyData = async () => {
  try {
  await Order.deleteMany();
  await Review.deleteMany();
  await Product.deleteMany();
  await CustomOrder.deleteMany();

  // Check for existing users
  const existingUsers = await User.find({});
  if (existingUsers.length > 0) {
    console.log(`⚠️  Found ${existingUsers.length} existing users. Preserving them...`);
    console.log('Use -f flag to force delete all users (WARNING: This will delete all user accounts!)');
  } else {
    await User.deleteMany();
    console.log('No existing users found, clearing user data...');
  }

  console.log('Data Destroyed (users preserved)!');
  process.exit();
  } catch (error) {
  console.error(`Error destroying data: ${error}`);
  process.exit(1);
  }
};
if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
