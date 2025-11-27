'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CheckCircleFilled, LoadingOutlined } from '@ant-design/icons';

interface FormData {
  organizationName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  agreeToTerms: boolean;
}

interface FormErrors {
  [key: string]: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    organizationName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep1 = () => {
    const newErrors: FormErrors = {};
    
    if (!formData.organizationName.trim()) {
      newErrors.organizationName = 'Organization name is required';
    } else if (formData.organizationName.length < 3) {
      newErrors.organizationName = 'Organization name must be at least 3 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep2()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/tenants/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: formData.organizationName,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phoneNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    'Complete patient management system',
    'Appointment scheduling & reminders',
    'Billing & insurance integration',
    'Multi-branch support',
    '14-day free trial, no credit card required',
    'Cancel anytime',
  ];

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-benefits">
          <div className="benefits-content">
            <Link href="/" className="back-link">
              <Image 
                src="/branding/nunccare_logo.png" 
                alt="NuncCare" 
                width={48} 
                height={48}
              />
              <span>NuncCare</span>
            </Link>
            
            <h2>Start Your Free Trial Today</h2>
            <p>Join hundreds of healthcare providers who trust NuncCare to manage their operations.</p>
            
            <ul className="benefits-list">
              {benefits.map((benefit, index) => (
                <li key={index}>
                  <CheckCircleFilled />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
            
            <div className="testimonial-mini">
              <p>&ldquo;NuncCare transformed how we manage patient records. Setup was incredibly easy.&rdquo;</p>
              <div className="testimonial-author">
                <strong>Dr. Amina Okonkwo</strong>
                <span>Lagos Family Clinic</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="signup-form-container">
          <div className="form-header">
            <h1>Create Your Account</h1>
            <p>Already have an account? <Link href="/login">Log in</Link></p>
          </div>
          
          <div className="step-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-label">Organization</span>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">Your Details</span>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>
              <span className="step-number">3</span>
              <span className="step-label">Complete</span>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {step === 1 && (
            <form className="signup-form" onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
              <div className="form-group">
                <label htmlFor="organizationName">Organization / Clinic Name *</label>
                <input
                  type="text"
                  id="organizationName"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  placeholder="e.g., Lagos Family Clinic"
                  className={errors.organizationName ? 'error' : ''}
                />
                {errors.organizationName && (
                  <span className="error-text">{errors.organizationName}</span>
                )}
                <span className="helper-text">This will be your organization&apos;s name in NuncCare</span>
              </div>
              
              <button type="submit" className="btn-submit">
                Continue
              </button>
            </form>
          )}

          {step === 2 && (
            <form className="signup-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter your first name"
                    className={errors.firstName ? 'error' : ''}
                  />
                  {errors.firstName && (
                    <span className="error-text">{errors.firstName}</span>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter your last name"
                    className={errors.lastName ? 'error' : ''}
                  />
                  {errors.lastName && (
                    <span className="error-text">{errors.lastName}</span>
                  )}
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && (
                  <span className="error-text">{errors.email}</span>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number *</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+234 XXX XXX XXXX"
                  className={errors.phoneNumber ? 'error' : ''}
                />
                {errors.phoneNumber && (
                  <span className="error-text">{errors.phoneNumber}</span>
                )}
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Password *</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 8 characters"
                    className={errors.password ? 'error' : ''}
                  />
                  {errors.password && (
                    <span className="error-text">{errors.password}</span>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password *</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className={errors.confirmPassword ? 'error' : ''}
                  />
                  {errors.confirmPassword && (
                    <span className="error-text">{errors.confirmPassword}</span>
                  )}
                </div>
              </div>
              
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                  />
                  <span>I agree to the <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link></span>
                </label>
                {errors.agreeToTerms && (
                  <span className="error-text">{errors.agreeToTerms}</span>
                )}
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-back" onClick={handleBack}>
                  Back
                </button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? (
                    <>
                      <LoadingOutlined /> Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="success-message">
              <div className="success-icon">
                <CheckCircleFilled />
              </div>
              <h2>Welcome to NuncCare!</h2>
              <p>Your account has been created successfully.</p>
              <p className="success-detail">
                We&apos;ve sent a confirmation email to <strong>{formData.email}</strong>. 
                Please check your inbox to verify your email address.
              </p>
              <Link href="/login" className="btn-login">
                Log In to Your Account
              </Link>
            </div>
          )}
          
          <div className="form-footer">
            <p>By creating an account, you agree to our terms and acknowledge that you have read our privacy policy.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
