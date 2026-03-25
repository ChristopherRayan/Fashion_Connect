import { Link } from 'react-router-dom';
import { User, Search, MessageCircle, CreditCard, Package, Star } from 'lucide-react';
import Logo from '../components/common/Logo';

const steps = [
  {
    icon: <User className="h-8 w-8 text-primary-600" />, 
    title: 'Sign Up',
    description: 'Create your free account as a client or designer and join the FashionConnect community.'
  },
  {
    icon: <Search className="h-8 w-8 text-primary-600" />, 
    title: 'Discover & Connect',
    description: 'Browse designer portfolios, explore products, or post a custom order to find your perfect match.'
  },
  {
    icon: <MessageCircle className="h-8 w-8 text-primary-600" />, 
    title: 'Chat & Collaborate',
    description: 'Communicate in real time to discuss ideas, share inspiration, and finalize your order details.'
  },
  {
    icon: <CreditCard className="h-8 w-8 text-primary-600" />, 
    title: 'Secure Payment',
    description: 'Pay safely through our platform with full transparency and protection for both clients and designers.'
  },
  {
    icon: <Package className="h-8 w-8 text-primary-600" />, 
    title: 'Order Fulfillment',
    description: 'Track your order from production to delivery, with updates every step of the way.'
  },
  {
    icon: <Star className="h-8 w-8 text-primary-600" />, 
    title: 'Review & Celebrate',
    description: 'Share your experience, leave a review, and inspire others in the FashionConnect community.'
  },
];

const HowItWorks = () => (
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
        How It Works
      </h1>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto animate-fade-in">
        FashionConnect makes it easy to bring your fashion ideas to life. Here's how our platform guides you from inspiration to delivery.
      </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto animate-fade-in-up">
      {steps.map((step, idx) => (
        <div key={step.title} className="flex items-start bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-shadow duration-300 group">
          <div className="flex-shrink-0 mr-4 animate-bounce-in">
            {step.icon}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors duration-200">
              {`${idx + 1}. ${step.title}`}
            </h2>
            <p className="text-gray-600 text-base leading-relaxed">
              {step.description}
            </p>
          </div>
        </div>
      ))}
    </div>
    <div className="max-w-3xl mx-auto mt-16 text-center animate-fade-in">
      <h3 className="text-xl font-semibold text-primary-700 mb-2">Ready to get started?</h3>
      <p className="text-gray-700 text-lg mb-4">
        Whether you're a client with a vision or a designer with talent to share, FashionConnect is your gateway to a world of creativity and collaboration.
      </p>
      <Link
        to="/register"
        className="inline-block px-8 py-3 bg-primary-600 text-white rounded-full font-bold shadow-lg hover:bg-primary-700 transition-colors duration-200 animate-pulse"
      >
        Join Now &rarr;
      </Link>
    </div>
    </div>
  </div>
);

export default HowItWorks; 