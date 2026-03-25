import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user.model.js';
import { Product } from '../models/product.model.js';
import { Order } from '../models/order.model.js';
import { Invoice } from '../models/analytics.model.js';
import { Message } from '../models/message.model.js';
import { Notification } from '../models/notification.model.js';
import { Review } from '../models/review.model.js';

// Load environment variables
dotenv.config();

const viewDatabase = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fashion_connect_db', {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Connected to MongoDB');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('🔌 Port:', mongoose.connection.port);
    
    console.log('\n' + '='.repeat(80));
    console.log('📋 DATABASE COLLECTIONS (TABLES) OVERVIEW');
    console.log('='.repeat(80));

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log(`\n📁 Total Collections: ${collections.length}`);
    console.log('\nCollection Names:');
    collections.forEach((collection, index) => {
      console.log(`${index + 1}. ${collection.name}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('📊 DETAILED COLLECTION DATA');
    console.log('='.repeat(80));

    // Users Collection
    console.log('\n👥 USERS COLLECTION:');
    console.log('-'.repeat(40));
    const users = await User.find({}).select('name email role status verified createdAt');
    console.log(`Total Users: ${users.length}`);
    
    const usersByRole = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(usersByRole).forEach(([role, count]) => {
      console.log(`  ${role}: ${count} users`);
    });

    console.log('\nSample Users:');
    users.slice(0, 5).forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email}) - ${user.role} - ${user.status}`);
    });

    // Products Collection
    console.log('\n🛍️ PRODUCTS COLLECTION:');
    console.log('-'.repeat(40));
    const products = await Product.find({}).select('name price category designer featured createdAt').populate('designer', 'name');
    console.log(`Total Products: ${products.length}`);
    
    console.log('\nSample Products:');
    products.slice(0, 5).forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name} - MWK ${product.price} (${product.category}) by ${product.designer?.name || 'Unknown'}`);
    });

    // Orders Collection
    console.log('\n📦 ORDERS COLLECTION:');
    console.log('-'.repeat(40));
    const orders = await Order.find({}).select('totalAmount status createdAt isCustomOrder').populate('user', 'name').populate('designer', 'name');
    console.log(`Total Orders: ${orders.length}`);
    
    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nOrders by Status:');
    Object.entries(ordersByStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} orders`);
    });

    console.log('\nSample Orders:');
    orders.slice(0, 5).forEach((order, index) => {
      console.log(`  ${index + 1}. Order ${order._id.toString().slice(-6)} - MWK ${order.totalAmount} (${order.status}) - Customer: ${order.user?.name || 'Unknown'}`);
    });

    // Invoices Collection
    console.log('\n🧾 INVOICES COLLECTION:');
    console.log('-'.repeat(40));
    const invoices = await Invoice.find({}).select('invoiceNumber totalAmount status createdAt').populate('user', 'name').populate('designer', 'name');
    console.log(`Total Invoices: ${invoices.length}`);
    
    console.log('\nSample Invoices:');
    invoices.slice(0, 5).forEach((invoice, index) => {
      console.log(`  ${index + 1}. ${invoice.invoiceNumber} - MWK ${invoice.totalAmount} (${invoice.status}) - Customer: ${invoice.user?.name || 'Unknown'}`);
    });

    // Messages Collection
    console.log('\n💬 MESSAGES COLLECTION:');
    console.log('-'.repeat(40));
    const messages = await Message.find({}).select('content sender receiver createdAt').populate('sender', 'name').populate('receiver', 'name');
    console.log(`Total Messages: ${messages.length}`);
    
    console.log('\nSample Messages:');
    messages.slice(0, 3).forEach((message, index) => {
      console.log(`  ${index + 1}. From: ${message.sender?.name || 'Unknown'} To: ${message.receiver?.name || 'Unknown'} - "${message.content?.substring(0, 50)}..."`);
    });

    // Notifications Collection
    console.log('\n🔔 NOTIFICATIONS COLLECTION:');
    console.log('-'.repeat(40));
    const notifications = await Notification.find({}).select('title type priority read createdAt').populate('recipient', 'name');
    console.log(`Total Notifications: ${notifications.length}`);
    
    const notificationsByType = notifications.reduce((acc, notif) => {
      acc[notif.type] = (acc[notif.type] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nNotifications by Type:');
    Object.entries(notificationsByType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} notifications`);
    });

    // Reviews Collection
    console.log('\n⭐ REVIEWS COLLECTION:');
    console.log('-'.repeat(40));
    const reviews = await Review.find({}).select('rating title verified createdAt').populate('user', 'name').populate('product', 'name');
    console.log(`Total Reviews: ${reviews.length}`);
    
    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
      console.log(`Average Rating: ${avgRating.toFixed(1)} ⭐`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ DATABASE OVERVIEW COMPLETE');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error viewing database:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

viewDatabase();
