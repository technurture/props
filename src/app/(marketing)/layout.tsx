'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import '@/style/scss/marketing.scss';

interface MarketingLayoutProps {
  children: ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="marketing-layout">
      <nav className="marketing-nav">
        <div className="nav-container">
          <Link href="/" className="nav-logo">
            <Image 
              src="/branding/nunccare_logo.png" 
              alt="NuncCare" 
              width={40} 
              height={40}
              className="logo-icon"
            />
            <span className="logo-text">NuncCare</span>
          </Link>
          
          <div className="nav-links">
            <Link href="/features" className="nav-link">Features</Link>
            <Link href="/pricing" className="nav-link">Pricing</Link>
            <Link href="/about" className="nav-link">About</Link>
            <Link href="/contact" className="nav-link">Contact</Link>
          </div>
          
          <div className="nav-actions">
            <Link href="/login" className="btn-login">Log In</Link>
            <Link href="/signup" className="btn-signup">Start Free Trial</Link>
          </div>
        </div>
      </nav>
      
      <main className="marketing-main">
        {children}
      </main>
      
      <footer className="marketing-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <Image 
              src="/branding/nunccare_logo.png" 
              alt="NuncCare" 
              width={32} 
              height={32}
            />
            <span>NuncCare</span>
            <p>The secure, modern EMR solution for healthcare providers across Africa.</p>
          </div>
          
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <Link href="/features">Features</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/integrations">Integrations</Link>
              <Link href="/security">Security</Link>
            </div>
            
            <div className="footer-column">
              <h4>Company</h4>
              <Link href="/about">About Us</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/careers">Careers</Link>
              <Link href="/blog">Blog</Link>
            </div>
            
            <div className="footer-column">
              <h4>Legal</h4>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
              <Link href="/compliance">Compliance</Link>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} NuncCare. All rights reserved.</p>
          <p>Built with care for healthcare providers.</p>
        </div>
      </footer>
    </div>
  );
}
