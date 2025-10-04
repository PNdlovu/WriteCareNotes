import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Home,
  Shield,
  AlertCircle,
  User,
  Building,
  Phone,
  MapPin,
  CheckCircle
} from 'lucide-react'

export const RegisterPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Step 1: Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    
    // Step 2: Care Home Information
    careHomeName: '',
    address: '',
    city: '',
    postcode: '',
    bedCount: '',
    cqcRating: '',
    
    // Step 3: Account Security
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptMarketing: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {}
    
    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
      if (!formData.email.trim()) {
        newErrors.email = 'Email address is required'
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address'
      }
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
      if (!formData.jobTitle.trim()) newErrors.jobTitle = 'Job title is required'
    }
    
    if (step === 2) {
      if (!formData.careHomeName.trim()) newErrors.careHomeName = 'Care home name is required'
      if (!formData.address.trim()) newErrors.address = 'Address is required'
      if (!formData.city.trim()) newErrors.city = 'City is required'
      if (!formData.postcode.trim()) newErrors.postcode = 'Postcode is required'
      if (!formData.bedCount) newErrors.bedCount = 'Bed count is required'
      if (!formData.cqcRating) newErrors.cqcRating = 'CQC rating is required'
    }
    
    if (step === 3) {
      if (!formData.password) {
        newErrors.password = 'Password is required'
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters'
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
      if (!formData.acceptTerms) {
        newErrors.acceptTerms = 'You must accept the Terms of Service'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep(3)) {
      return
    }
    
    setIsLoading(true)
    
    try {
      // Here you would typically make an API call to register
      console.log('Registration data:', formData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // On success, redirect to confirmation or dashboard
      window.location.href = '/dashboard'
    } catch (error) {
      setErrors({ submit: 'Registration failed. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Personal Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              First Name *
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={handleInputChange}
                className={`appearance-none block w-full pl-10 pr-3 py-3 border ${
                  errors.firstName ? 'border-red-300' : 'border-gray-300'
                } rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
                placeholder="First name"
              />
            </div>
            {errors.firstName && (
              <p className="mt-2 text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Last Name *
            </label>
            <div className="mt-1">
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={handleInputChange}
                className={`appearance-none block w-full px-3 py-3 border ${
                  errors.lastName ? 'border-red-300' : 'border-gray-300'
                } rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
                placeholder="Last name"
              />
            </div>
            {errors.lastName && (
              <p className="mt-2 text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>
        </div>
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email Address *
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            className={`appearance-none block w-full pl-10 pr-3 py-3 border ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            } rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
            placeholder="your.email@carehhome.co.uk"
          />
        </div>
        {errors.email && (
          <p className="mt-2 text-sm text-red-600">{errors.email}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone Number *
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Phone className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            value={formData.phone}
            onChange={handleInputChange}
            className={`appearance-none block w-full pl-10 pr-3 py-3 border ${
              errors.phone ? 'border-red-300' : 'border-gray-300'
            } rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
            placeholder="01234 567890"
          />
        </div>
        {errors.phone && (
          <p className="mt-2 text-sm text-red-600">{errors.phone}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">
          Job Title *
        </label>
        <div className="mt-1">
          <select
            id="jobTitle"
            name="jobTitle"
            required
            value={formData.jobTitle}
            onChange={handleInputChange}
            className={`appearance-none block w-full px-3 py-3 border ${
              errors.jobTitle ? 'border-red-300' : 'border-gray-300'
            } rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
          >
            <option value="">Select your role</option>
            <option value="care-home-manager">Care Home Manager</option>
            <option value="deputy-manager">Deputy Manager</option>
            <option value="registered-manager">Registered Manager</option>
            <option value="operations-director">Operations Director</option>
            <option value="administrator">Administrator</option>
            <option value="owner">Owner</option>
            <option value="other">Other</option>
          </select>
        </div>
        {errors.jobTitle && (
          <p className="mt-2 text-sm text-red-600">{errors.jobTitle}</p>
        )}
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Care Home Information
        </h3>
        
        <div>
          <label htmlFor="careHomeName" className="block text-sm font-medium text-gray-700">
            Care Home Name *
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="careHomeName"
              name="careHomeName"
              type="text"
              required
              value={formData.careHomeName}
              onChange={handleInputChange}
              className={`appearance-none block w-full pl-10 pr-3 py-3 border ${
                errors.careHomeName ? 'border-red-300' : 'border-gray-300'
              } rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
              placeholder="Meadowbrook Care Home"
            />
          </div>
          {errors.careHomeName && (
            <p className="mt-2 text-sm text-red-600">{errors.careHomeName}</p>
          )}
        </div>
      </div>
      
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Address *
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="address"
            name="address"
            type="text"
            required
            value={formData.address}
            onChange={handleInputChange}
            className={`appearance-none block w-full pl-10 pr-3 py-3 border ${
              errors.address ? 'border-red-300' : 'border-gray-300'
            } rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
            placeholder="123 High Street"
          />
        </div>
        {errors.address && (
          <p className="mt-2 text-sm text-red-600">{errors.address}</p>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            City *
          </label>
          <div className="mt-1">
            <input
              id="city"
              name="city"
              type="text"
              required
              value={formData.city}
              onChange={handleInputChange}
              className={`appearance-none block w-full px-3 py-3 border ${
                errors.city ? 'border-red-300' : 'border-gray-300'
              } rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
              placeholder="Manchester"
            />
          </div>
          {errors.city && (
            <p className="mt-2 text-sm text-red-600">{errors.city}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="postcode" className="block text-sm font-medium text-gray-700">
            Postcode *
          </label>
          <div className="mt-1">
            <input
              id="postcode"
              name="postcode"
              type="text"
              required
              value={formData.postcode}
              onChange={handleInputChange}
              className={`appearance-none block w-full px-3 py-3 border ${
                errors.postcode ? 'border-red-300' : 'border-gray-300'
              } rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
              placeholder="M1 1AA"
            />
          </div>
          {errors.postcode && (
            <p className="mt-2 text-sm text-red-600">{errors.postcode}</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="bedCount" className="block text-sm font-medium text-gray-700">
            Number of Beds *
          </label>
          <div className="mt-1">
            <select
              id="bedCount"
              name="bedCount"
              required
              value={formData.bedCount}
              onChange={handleInputChange}
              className={`appearance-none block w-full px-3 py-3 border ${
                errors.bedCount ? 'border-red-300' : 'border-gray-300'
              } rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
            >
              <option value="">Select bed count</option>
              <option value="1-20">1-20 beds</option>
              <option value="21-40">21-40 beds</option>
              <option value="41-60">41-60 beds</option>
              <option value="61-80">61-80 beds</option>
              <option value="81+">81+ beds</option>
            </select>
          </div>
          {errors.bedCount && (
            <p className="mt-2 text-sm text-red-600">{errors.bedCount}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="cqcRating" className="block text-sm font-medium text-gray-700">
            Current CQC Rating *
          </label>
          <div className="mt-1">
            <select
              id="cqcRating"
              name="cqcRating"
              required
              value={formData.cqcRating}
              onChange={handleInputChange}
              className={`appearance-none block w-full px-3 py-3 border ${
                errors.cqcRating ? 'border-red-300' : 'border-gray-300'
              } rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
            >
              <option value="">Select CQC rating</option>
              <option value="outstanding">Outstanding</option>
              <option value="good">Good</option>
              <option value="requires-improvement">Requires Improvement</option>
              <option value="inadequate">Inadequate</option>
              <option value="not-rated">Not Yet Rated</option>
            </select>
          </div>
          {errors.cqcRating && (
            <p className="mt-2 text-sm text-red-600">{errors.cqcRating}</p>
          )}
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Account Security
        </h3>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password *
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.password}
              onChange={handleInputChange}
              className={`appearance-none block w-full pl-10 pr-10 py-3 border ${
                errors.password ? 'border-red-300' : 'border-gray-300'
              } rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
              placeholder="Create a secure password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-2 text-sm text-red-600">{errors.password}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Password must be at least 8 characters long
          </p>
        </div>
      </div>
      
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm Password *
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            required
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className={`appearance-none block w-full pl-10 pr-10 py-3 border ${
              errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
            } rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
            placeholder="Confirm your password"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>
        )}
      </div>
      
      <div className="space-y-4">
        <div className="flex items-start">
          <input
            id="acceptTerms"
            name="acceptTerms"
            type="checkbox"
            checked={formData.acceptTerms}
            onChange={handleInputChange}
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded mt-1"
          />
          <label htmlFor="acceptTerms" className="ml-3 block text-sm text-gray-900">
            I agree to the{' '}
            <Link to="/terms" className="font-medium text-primary hover:text-primary/80">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="font-medium text-primary hover:text-primary/80">
              Privacy Policy
            </Link>
            *
          </label>
        </div>
        {errors.acceptTerms && (
          <p className="text-sm text-red-600">{errors.acceptTerms}</p>
        )}
        
        <div className="flex items-start">
          <input
            id="acceptMarketing"
            name="acceptMarketing"
            type="checkbox"
            checked={formData.acceptMarketing}
            onChange={handleInputChange}
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded mt-1"
          />
          <label htmlFor="acceptMarketing" className="ml-3 block text-sm text-gray-900">
            I would like to receive product updates and care sector insights via email
          </label>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-12 h-12 care-gradient rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">WriteCareNotes</span>
          </Link>
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary/80">
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step < currentStep
                        ? 'bg-green-500 text-white'
                        : step === currentStep
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step < currentStep ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      step
                    )}
                  </div>
                  {step < 3 && (
                    <div
                      className={`w-16 h-0.5 mx-2 ${
                        step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-500">Personal</span>
              <span className="text-xs text-gray-500">Care Home</span>
              <span className="text-xs text-gray-500">Security</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Global Error */}
            {errors.submit && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">{errors.submit}</div>
              </div>
            )}

            {/* Step Content */}
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 mr-3"
                >
                  Back
                </Button>
              )}
              
              {currentStep < 3 ? (
                <Button
                  type="button"
                  variant="care"
                  onClick={handleNext}
                  className={`${currentStep === 1 ? 'w-full' : 'flex-1'}`}
                >
                  Continue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="care"
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Secure Registration</p>
                <p>
                  Your information is encrypted and secure. We're GDPR compliant 
                  and never share your data.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center">
          <div className="flex justify-center space-x-6 text-sm text-gray-500">
            <Link to="/privacy" className="hover:text-gray-700">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-gray-700">
              Terms of Service
            </Link>
            <Link to="/contact" className="hover:text-gray-700">
              Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}