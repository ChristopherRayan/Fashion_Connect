import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Eye, EyeOff, ArrowLeft, Upload, CreditCard, AlertCircle } from 'lucide-react';
import { UserRole } from '../../types';
import Logo from '../../components/common/Logo';
import { userService } from '../../services/userService';

const DesignerRegisterPage = () => {
  const { register } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    location: '',
    businessName: '',
    fashionCategory: '',
    experience: '',
    portfolio: ''
  });

  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  
  const [files, setFiles] = useState({
    nationalId: null as File | null,
    businessCertificate: null as File | null
  });

  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('visa');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  // Check for email verification parameters
  useEffect(() => {
    const email = searchParams.get('email');
    const verified = searchParams.get('verified');
    const token = searchParams.get('token');

    if (email && verified === 'true' && token) {
      setFormData(prev => ({ ...prev, email }));
      setVerificationToken(token);
      setEmailVerified(true);
      addToast('success', 'Email verified successfully! Please complete your registration.');
    } else if (!verified) {
      // Redirect to email verification request if not verified
      navigate('/register/verify-email');
    }
  }, [searchParams, navigate, addToast]);
  
  const fashionCategories = [
    'Traditional Wear',
    'Formal Wear',
    'Casual Wear',
    'Wedding Dresses',
    'Business Attire',
    'Evening Wear',
    'Streetwear',
    'Accessories',
    'Children\'s Wear',
    'Plus Size Fashion',
    'Men\'s Clothing',
    'Women\'s Clothing',
    'Unisex Clothing'
  ];
  
  const validateForm = () => {
    const newErrors: any = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
    if (!formData.fashionCategory) newErrors.fashionCategory = 'Fashion category is required';
    if (!files.nationalId) newErrors.nationalId = 'National ID is required';
    if (!files.businessCertificate) newErrors.businessCertificate = 'Business certificate is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      if (!verificationToken) {
        throw new Error('Email verification is required. Please verify your email first.');
      }

      // First register the user
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: UserRole.DESIGNER,
        phone: formData.phone,
        location: formData.location,
        businessName: formData.businessName,
        fashionCategory: formData.fashionCategory,
        experience: formData.experience,
        portfolio: formData.portfolio,
        verificationToken: verificationToken
      });

      // Upload documents if any are provided
      const documentsToUpload: any = {};
      if (files.nationalId) documentsToUpload.nationalId = files.nationalId;
      if (files.businessCertificate) documentsToUpload.businessRegistration = files.businessCertificate;

      if (Object.keys(documentsToUpload).length > 0) {
        try {
          console.log('📄 Attempting to upload documents:', Object.keys(documentsToUpload));
          console.log('🔑 Auth token exists:', !!localStorage.getItem('accessToken'));

          const result = await userService.uploadDesignerDocuments(documentsToUpload);
          console.log('✅ Documents uploaded successfully:', result);
          addToast('success', `${result.uploadedCount} document(s) uploaded successfully!`);
        } catch (docError: any) {
          console.error('❌ Failed to upload documents:', docError);
          console.error('❌ Error details:', {
            message: docError.message,
            statusCode: docError.statusCode,
            stack: docError.stack
          });

          // Show specific error message
          const errorMessage = docError.message || 'Unknown error occurred';
          addToast('error', `Document upload failed: ${errorMessage}. You can upload them later from your profile.`);
        }
      } else {
        console.log('📄 No documents to upload');
      }

      // Show designer-specific success message
      addToast('success', 'Your details have been sent, wait for your verification. You will be notified when accepted.');
      navigate('/login');
    } catch (error: any) {
      setErrors({ general: error.message || 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: undefined }));
    }
  };
  
  const handleFileChange = (field: 'nationalId' | 'businessCertificate', file: File | null) => {
    setFiles(prev => ({ ...prev, [field]: file }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <Link 
          to="/register" 
          className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to role selection
        </Link>
        
        <div className="flex justify-center">
          <Logo size="lg" variant="dark" showIcon={true} />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Register as Designer
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join our community of talented fashion designers
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10">
          {errors.general && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <p className="text-sm text-red-700">{errors.general}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Personal Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                    placeholder="Enter your full name"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                    placeholder="Enter your email"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                    placeholder="Enter your phone number"
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Location *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.location ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                    placeholder="Enter your city/location"
                  />
                  {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.businessName ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                    placeholder="Enter your business name"
                  />
                  {errors.businessName && <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Fashion Category *</label>
                  <select
                    required
                    value={formData.fashionCategory}
                    onChange={(e) => handleInputChange('fashionCategory', e.target.value)}
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.fashionCategory ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                  >
                    <option value="">Select category</option>
                    {fashionCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {errors.fashionCategory && <p className="mt-1 text-sm text-red-600">{errors.fashionCategory}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                  <input
                    type="text"
                    value={formData.experience}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    placeholder="e.g., 5 years"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Portfolio Website/Social Media</label>
                  <input
                    type="url"
                    value={formData.portfolio}
                    onChange={(e) => handleInputChange('portfolio', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    placeholder="https://your-portfolio.com"
                  />
                </div>
              </div>
            </div>

            {/* Document Upload */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Required Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">National ID *</label>
                  <div className={`border-2 border-dashed ${errors.nationalId ? 'border-red-300' : 'border-gray-300'} rounded-lg p-4 text-center hover:border-purple-400 transition-colors`}>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange('nationalId', e.target.files?.[0] || null)}
                      className="hidden"
                      id="nationalId"
                    />
                    <label htmlFor="nationalId" className="cursor-pointer">
                      <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        {files.nationalId ? files.nationalId.name : 'Upload National ID'}
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, PDF up to 5MB</p>
                    </label>
                  </div>
                  {errors.nationalId && <p className="mt-1 text-sm text-red-600">{errors.nationalId}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Certificate *</label>
                  <div className={`border-2 border-dashed ${errors.businessCertificate ? 'border-red-300' : 'border-gray-300'} rounded-lg p-4 text-center hover:border-purple-400 transition-colors`}>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange('businessCertificate', e.target.files?.[0] || null)}
                      className="hidden"
                      id="businessCertificate"
                    />
                    <label htmlFor="businessCertificate" className="cursor-pointer">
                      <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        {files.businessCertificate ? files.businessCertificate.name : 'Upload Business Certificate'}
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, PDF up to 5MB</p>
                    </label>
                  </div>
                  {errors.businessCertificate && <p className="mt-1 text-sm text-red-600">{errors.businessCertificate}</p>}
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Security</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password *</label>
                  <div className="mt-1 relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`block w-full px-3 py-2 border ${
                        errors.password ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 px-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                    placeholder="Confirm your password"
                  />
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>

            {/* Registration Fee Payment */}
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <CreditCard className="mr-2 h-5 w-5 text-purple-600" />
                Registration Fee Payment
              </h3>
              <div className="mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  Designer registration fee: <span className="font-semibold text-purple-600">MWK 15,000</span>
                </p>
                <p className="text-xs text-gray-600">
                  This one-time fee covers account verification, platform access, and marketing support.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="visa"
                        checked={paymentMethod === 'visa'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-900">Visa Card</div>
                        <div className="text-sm text-gray-600">Credit/Debit Card</div>
                      </div>
                    </label>

                    <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="mpamba"
                        checked={paymentMethod === 'mpamba'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-900">TNM Mpamba</div>
                        <div className="text-sm text-gray-600">Mobile Money</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Payment will be processed after form submission. You will receive payment instructions via email.
                  </p>
                </div>
              </div>
            </div>

            {/* Platform Agreement Terms */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-red-600" />
                Platform Agreement & Terms
              </h3>

              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <h4 className="font-semibold text-gray-900 mb-3">FashionConnect Designer Platform Rules</h4>

                  <div className="space-y-3 text-sm text-gray-700">
                    <div>
                      <h5 className="font-medium text-gray-900">📋 Content Guidelines:</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Only fashion-related content is allowed on the platform</li>
                        <li>No posting of inappropriate, offensive, or adult content</li>
                        <li>No pornographic or sexually explicit material</li>
                        <li>All product images must be professional and appropriate</li>
                        <li>Product descriptions must be accurate and honest</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900">🤝 Professional Conduct:</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Maintain professional communication with clients</li>
                        <li>Deliver orders within agreed timelines</li>
                        <li>Provide accurate pricing and delivery estimates</li>
                        <li>Respect intellectual property rights</li>
                        <li>No harassment, discrimination, or abusive behavior</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900">💰 Business Practices:</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Honor all confirmed orders and agreements</li>
                        <li>Provide clear refund and return policies</li>
                        <li>No fraudulent or deceptive business practices</li>
                        <li>Comply with local business regulations</li>
                        <li>Pay platform fees and commissions as agreed</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900">⚠️ Violations & Consequences:</h5>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>First violation: Warning and content removal</li>
                        <li>Repeated violations: Temporary account suspension</li>
                        <li>Serious violations: Permanent account termination</li>
                        <li>Platform reserves the right to review and moderate all content</li>
                      </ul>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Important:</strong> By accepting these terms, you agree to maintain the highest standards of professionalism and quality on our platform. Violations may result in immediate account suspension or termination.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="agreement"
                    checked={agreementAccepted}
                    onChange={(e) => setAgreementAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="agreement" className="text-sm text-gray-700">
                    I have read and agree to the <strong>Platform Agreement & Terms</strong> above. I understand that violations may result in account suspension or termination.
                  </label>
                </div>

                {!agreementAccepted && (
                  <p className="text-sm text-red-600">
                    You must accept the platform terms to continue with registration.
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !agreementAccepted}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting Application...' : 'Submit Designer Application'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-purple-600 hover:text-purple-500">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignerRegisterPage;
