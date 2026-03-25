import { Link } from 'react-router-dom';
import { CheckCircle, Shield, MessageCircle, Star, ShoppingBag, CreditCard, Users } from 'lucide-react';
import Logo from '../components/common/Logo';

const features = [
  {
    icon: <ShoppingBag className="h-8 w-8 text-primary-600" />,
    title: 'Browse Top Designers',
    description: "Discover and connect with Malawi's best fashion designers, view their portfolios, and find the perfect match for your style."
  },
  {
    icon: <MessageCircle className="h-8 w-8 text-primary-600" />,
    title: 'Real-Time Chat',
    description: "Communicate instantly with designers to discuss ideas, custom orders, and get updates on your projects."
  },
  {
    icon: <CreditCard className="h-8 w-8 text-primary-600" />,
    title: 'Secure Payments',
    description: "Pay safely through our platform with full transparency and protection for both clients and designers."
  },
  {
    icon: <CheckCircle className="h-8 w-8 text-primary-600" />,
    title: 'Order Tracking',
    description: "Track your orders from placement to delivery, with real-time status updates and notifications."
  },
  {
    icon: <Star className="h-8 w-8 text-primary-600" />,
    title: 'Reviews & Ratings',
    description: "Leave feedback and read reviews to help others make informed decisions and celebrate great work."
  },
  {
    icon: <Shield className="h-8 w-8 text-primary-600" />,
    title: 'Verified Designers',
    description: "All designers are vetted and verified to ensure quality, professionalism, and trust."
  },
  {
    icon: <Users className="h-8 w-8 text-primary-600" />,
    title: 'Community Support',
    description: "Join a vibrant community, get support, and participate in events and promotions."
  }
];

const Features = () => (
  <div className="bg-gradient-to-br from-white to-gray-50 min-h-screen">
    {/* Header with Logo */}
    <div className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Logo size="md" variant="default" showIcon={true} />
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors duration-200"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>

    <div className="py-16 px-4">
      <div className="max-w-4xl mx-auto text-center mb-12">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-4 tracking-tight animate-text-gradient bg-gradient-to-r from-primary-600 via-yellow-500 to-pink-500 bg-clip-text text-transparent">
        Platform Features
      </h1>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto animate-fade-in">
        FashionConnect brings together clients and designers for a seamless, secure, and inspiring fashion experience. Explore our powerful features designed to make your journey effortless and enjoyable.
      </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto animate-fade-in-up">
      {features.map((feature) => (
        <div key={feature.title} className="flex items-start bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-shadow duration-300 group">
          <div className="flex-shrink-0 mr-4 animate-bounce-in">
            {feature.icon}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors duration-200">
              {feature.title}
            </h2>
            <p className="text-gray-600 text-base leading-relaxed">
              {feature.description}
            </p>
          </div>
        </div>
      ))}
    </div>
    <div className="max-w-3xl mx-auto mt-16 text-center animate-fade-in">
      <h3 className="text-xl font-semibold text-primary-700 mb-2">Why Choose FashionConnect?</h3>
      <p className="text-gray-700 text-lg mb-4">
        We're committed to empowering creativity, supporting local talent, and delivering a world-class experience for every user. Whether you're a client seeking something unique or a designer ready to showcase your skills, FashionConnect is your trusted partner in fashion.
      </p>
      <Link
        to="/register"
        className="inline-block px-8 py-3 bg-primary-600 text-white rounded-full font-bold shadow-lg hover:bg-primary-700 transition-colors duration-200 animate-pulse"
      >
        Join the Fashion Revolution
      </Link>
    </div>
    </div>
  </div>
);

export default Features; 