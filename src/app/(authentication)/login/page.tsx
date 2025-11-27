'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.replace('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail, rememberMe: true }));
    }
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return null;
  }

  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return undefined;
  };

  const validateForm = (): boolean => {
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    
    setFieldErrors({
      email: emailError,
      password: passwordError,
    });

    return !emailError && !passwordError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (formData.rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else {
          setError('Unable to sign in. Please try again later.');
        }
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      setError('A network error occurred. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData({ ...formData, email });
    if (fieldErrors.email) {
      setFieldErrors({ ...fieldErrors, email: validateEmail(email) });
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setFormData({ ...formData, password });
    if (fieldErrors.password) {
      setFieldErrors({ ...fieldErrors, password: validatePassword(password) });
    }
  };

  return (
    <>
      <div className="min-vh-100 d-flex login-container">
        <div 
          className="login-image-section d-none d-md-flex position-relative"
        >
          <div 
            className="w-100 h-100 position-absolute top-0 start-0"
            style={{
              backgroundImage: 'url(/medical-center-building.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          ></div>
          <div 
            className="w-100 h-100 position-absolute top-0 start-0"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.65) 0%, rgba(30, 64, 175, 0.75) 100%)',
            }}
          ></div>
          <div className="position-relative d-flex flex-column justify-content-center align-items-center text-white p-3 p-lg-5 w-100">
            <div className="login-hero-content">
              <div className="text-center">
                <Image
                  src="/branding/nunccare_logo.png"
                  alt="NuncCare"
                  width={120}
                  height={120}
                  className="mb-3 mb-lg-4 login-logo"
                  priority={true}
                />
                <h1 className="fw-bold text-white mb-2 mb-lg-3 login-hero-title">NuncCare</h1>
                <p className="lead text-white mb-3 mb-lg-4 login-hero-subtitle">Electronic Medical Records System</p>
                <div className="login-hero-features">
                  <p className="mb-2 text-white"><i className="fas fa-shield-alt me-2"></i>Secure & Confidential</p>
                  <p className="mb-0 text-white"><i className="fas fa-clock me-2"></i>24/7 Access</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="login-form-section d-flex align-items-center justify-content-center bg-white">
          <div className="login-form-container w-100 p-3 p-sm-4">
            <div className="text-center mb-3 mb-md-4 d-md-none">
              <Image
                src="/branding/nunccare_logo.png"
                alt="NuncCare"
                width={70}
                height={70}
                className="mb-3 mobile-logo"
                priority={true}
              />
              <h2 className="fw-bold mb-2 mobile-title" style={{ color: 'var(--nunccare-primary)' }}>
                NuncCare
              </h2>
              <p className="text-muted mobile-subtitle">Electronic Medical Records System</p>
            </div>

            <div className="d-none d-md-block text-center mb-4">
              <h2 className="fw-bold mb-2 desktop-welcome" style={{ color: 'var(--nunccare-primary)' }}>
                Welcome Back
              </h2>
              <p className="text-muted">Sign in to access the EMR system</p>
            </div>

            {error && (
              <div className="alert alert-danger d-flex align-items-center" role="alert" aria-live="assertive">
                <i className="fas fa-exclamation-circle me-2 flex-shrink-0"></i>
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label htmlFor="email-input" className="form-label fw-semibold">Email Address</label>
                <div className="input-group login-input-group">
                  <span className="input-group-text bg-light">
                    <i className="fas fa-envelope text-muted"></i>
                  </span>
                  <input
                    id="email-input"
                    type="email"
                    className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleEmailChange}
                    onBlur={() => setFieldErrors({ ...fieldErrors, email: validateEmail(formData.email) })}
                    disabled={loading}
                    autoComplete="email"
                    autoFocus
                    aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                    aria-invalid={!!fieldErrors.email}
                  />
                  {fieldErrors.email && (
                    <div id="email-error" className="invalid-feedback" role="alert">
                      {fieldErrors.email}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="password-input" className="form-label fw-semibold">Password</label>
                <div className="input-group login-input-group">
                  <span className="input-group-text bg-light">
                    <i className="fas fa-lock text-muted"></i>
                  </span>
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    className={`form-control border-end-0 ${fieldErrors.password ? 'is-invalid' : ''}`}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handlePasswordChange}
                    onBlur={() => setFieldErrors({ ...fieldErrors, password: validatePassword(formData.password) })}
                    disabled={loading}
                    autoComplete="current-password"
                    aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                    aria-invalid={!!fieldErrors.password}
                  />
                  <button 
                    type="button"
                    className="input-group-text bg-light border-start-0 password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={0}
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-muted`}></i>
                  </button>
                  {fieldErrors.password && (
                    <div id="password-error" className="invalid-feedback" role="alert">
                      {fieldErrors.password}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                    disabled={loading}
                  />
                  <label className="form-check-label user-select-none" htmlFor="rememberMe">
                    Remember me
                  </label>
                </div>
                <a href="/forgot-password" className="text-decoration-none small" style={{ color: 'var(--nunccare-primary)' }}>
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 login-submit-btn fw-semibold"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    <span aria-live="polite">Signing in...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt me-2"></i>
                    Sign In
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          min-height: 100dvh;
        }

        .login-image-section {
          width: 50%;
          flex-shrink: 0;
        }

        .login-hero-content {
          background: rgba(0, 0, 0, 0.35);
          padding: 1.5rem;
          border-radius: 1rem;
          backdrop-filter: blur(5px);
          max-width: 500px;
        }

        .login-hero-title {
          font-weight: 900 !important;
          text-shadow: 0 2px 4px rgba(0,0,0,0.4), 0 4px 8px rgba(0,0,0,0.3), 0 0 15px rgba(0,0,0,0.2);
          font-size: 1.75rem;
        }

        .login-hero-subtitle {
          font-weight: 500;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3), 0 0 10px rgba(0,0,0,0.2);
          font-size: 1.1rem;
        }

        .login-hero-features p {
          font-size: 0.95rem;
        }

        .login-image-section .fas {
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }

        .login-form-section {
          flex: 1;
          overflow-y: auto;
        }

        .login-form-container {
          max-width: 500px;
          margin: 0 auto;
        }

        .login-input-group {
          min-height: 48px;
        }

        .login-input-group .input-group-text,
        .login-input-group .form-control,
        .password-toggle {
          min-height: 48px;
          font-size: 1rem;
        }

        .password-toggle {
          cursor: pointer;
          min-width: 48px;
        }

        .login-submit-btn {
          min-height: 48px;
          font-size: 1.1rem;
        }

        .mobile-logo {
          width: 70px;
          height: 70px;
        }

        .mobile-title {
          font-size: 1.4rem;
        }

        .mobile-subtitle {
          font-size: 0.9rem;
        }

        .desktop-welcome {
          font-size: 1.75rem;
        }

        @media (max-width: 767.98px) {
          .login-form-section {
            padding-top: 1.5rem;
            padding-bottom: 1.5rem;
          }

          .login-form-container {
            padding: 1rem !important;
          }

          .mobile-title {
            font-size: 1.25rem;
          }

          .mobile-subtitle {
            font-size: 0.85rem;
          }

          .login-input-group .input-group-text,
          .login-input-group .form-control,
          .password-toggle {
            min-height: 44px;
          }

          .login-submit-btn {
            min-height: 50px;
            font-size: 1rem;
          }
        }

        @media (max-width: 575.98px) {
          .login-form-container {
            padding: 0.75rem !important;
          }

          .mobile-logo {
            width: 60px;
            height: 60px;
          }

          .mobile-title {
            font-size: 1.15rem;
          }
        }

        @media (min-width: 992px) {
          .login-image-section {
            width: 45%;
          }

          .login-hero-content {
            padding: 2rem;
          }

          .login-hero-title {
            font-size: 2rem;
          }

          .login-hero-subtitle {
            font-size: 1.2rem;
          }
        }

        @media (min-width: 1200px) {
          .login-image-section {
            width: 40%;
          }
        }

        @media (orientation: landscape) and (max-height: 600px) {
          .login-hero-content {
            padding: 1rem;
          }

          .login-logo {
            width: 80px;
            height: 80px;
          }

          .login-hero-title {
            font-size: 1.5rem;
            margin-bottom: 0.5rem !important;
          }

          .login-hero-subtitle {
            font-size: 1rem;
            margin-bottom: 1rem !important;
          }

          .login-hero-features p {
            font-size: 0.85rem;
            margin-bottom: 0.25rem !important;
          }
        }
      `}</style>
    </>
  );
}
