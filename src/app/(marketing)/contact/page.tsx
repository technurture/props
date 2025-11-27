'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  SendOutlined,
  CheckCircleFilled,
  LoadingOutlined,
  QuestionCircleOutlined,
  CustomerServiceOutlined,
  GlobalOutlined,
  MessageOutlined
} from '@ant-design/icons';

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const contactInfo = [
  {
    icon: <MailOutlined />,
    title: 'Email Us',
    details: ['support@nunccare.com', 'sales@nunccare.com'],
    description: 'We respond within 24 hours'
  },
  {
    icon: <PhoneOutlined />,
    title: 'Call Us',
    details: ['+234 800 NUNCCARE', '+234 1 234 5678'],
    description: 'Mon-Fri, 8AM-6PM WAT'
  },
  {
    icon: <EnvironmentOutlined />,
    title: 'Visit Us',
    details: ['14 Adeola Odeku Street', 'Victoria Island, Lagos, Nigeria'],
    description: 'By appointment only'
  },
  {
    icon: <ClockCircleOutlined />,
    title: 'Business Hours',
    details: ['Monday - Friday: 8AM - 6PM', 'Saturday: 9AM - 2PM'],
    description: 'West Africa Time (WAT)'
  }
];

const supportFaqs = [
  {
    question: 'How quickly can I get started with NuncCare?',
    answer: 'You can sign up and start using NuncCare within minutes. Our setup wizard guides you through the initial configuration, and most clinics are fully operational within 1-2 days. For larger implementations, our team provides hands-on onboarding support.'
  },
  {
    question: 'Do you offer training for my staff?',
    answer: 'Yes! We provide comprehensive training options including live video sessions, on-site training (for Enterprise plans), and a library of video tutorials. Most staff members become proficient within a few hours of training.'
  },
  {
    question: 'What if I need help after hours?',
    answer: 'Professional and Enterprise customers have access to priority support. Enterprise customers get 24/7 phone support. All customers can access our help center and knowledge base anytime, and our support team monitors critical issues around the clock.'
  },
  {
    question: 'Can you help migrate data from my current system?',
    answer: 'Absolutely. We offer data migration services for Professional and Enterprise plans at no additional cost. Our team can import patient records, appointment history, and billing data from most common systems including paper records.'
  },
  {
    question: 'How do you handle system updates and maintenance?',
    answer: 'NuncCare is a cloud-based system, so updates happen automatically with zero downtime during business hours. We schedule major updates during off-peak times and always notify customers in advance. Your data is continuously backed up.'
  },
  {
    question: 'What happens if I decide to leave NuncCare?',
    answer: 'We believe in data portability. You can export all your data at any time in standard formats. While we hope you will stay, we make it easy to take your data with you if your needs change.'
  }
];

const offices = [
  {
    city: 'Lagos, Nigeria',
    role: 'Headquarters',
    address: '14 Adeola Odeku Street, Victoria Island'
  },
  {
    city: 'Accra, Ghana',
    role: 'Regional Office',
    address: 'Oxford Street, Osu'
  },
  {
    city: 'Nairobi, Kenya',
    role: 'East Africa Office',
    address: 'Westlands Business Park'
  }
];

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <h1>Get in Touch</h1>
        <p>
          Have questions about NuncCare? Want to schedule a demo? 
          Our team is here to help you transform your healthcare practice.
        </p>
      </section>

      <section className="contact-main">
        <div className="contact-grid">
          <div className="contact-form-section">
            <h2>Send Us a Message</h2>
            <p>Fill out the form below and we&apos;ll get back to you within 24 hours.</p>
            
            {submitted ? (
              <div className="success-message">
                <CheckCircleFilled className="success-icon" />
                <h3>Message Sent Successfully!</h3>
                <p>Thank you for reaching out. Our team will review your message and respond within 24 hours.</p>
                <button 
                  className="btn-reset"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
                  }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      className={errors.name ? 'error' : ''}
                    />
                    {errors.name && <span className="error-text">{errors.name}</span>}
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
                    {errors.email && <span className="error-text">{errors.email}</span>}
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+234 800 000 0000"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="subject">Subject</label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                    >
                      <option value="">Select a topic</option>
                      <option value="demo">Request a Demo</option>
                      <option value="sales">Sales Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="partnership">Partnership</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help..."
                    rows={5}
                    className={errors.message ? 'error' : ''}
                  />
                  {errors.message && <span className="error-text">{errors.message}</span>}
                </div>
                
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? (
                    <>
                      <LoadingOutlined /> Sending...
                    </>
                  ) : (
                    <>
                      <SendOutlined /> Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
          
          <div className="contact-info-section">
            <div className="contact-cards">
              {contactInfo.map((info, index) => (
                <div key={index} className="contact-card">
                  <div className="contact-icon">{info.icon}</div>
                  <div className="contact-details">
                    <h3>{info.title}</h3>
                    {info.details.map((detail, i) => (
                      <p key={i} className="detail-text">{detail}</p>
                    ))}
                    <span className="detail-note">{info.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="map-section">
        <h2>Our Offices</h2>
        <div className="offices-grid">
          {offices.map((office, index) => (
            <div key={index} className="office-card">
              <EnvironmentOutlined />
              <h3>{office.city}</h3>
              <span className="office-role">{office.role}</span>
              <p>{office.address}</p>
            </div>
          ))}
        </div>
        <div className="map-placeholder">
          <GlobalOutlined />
          <p>Interactive map coming soon</p>
        </div>
      </section>

      <section className="support-channels">
        <div className="section-header">
          <h2>Other Ways to Get Help</h2>
          <p>Choose the support channel that works best for you.</p>
        </div>
        <div className="channels-grid">
          <div className="channel-card">
            <QuestionCircleOutlined />
            <h3>Help Center</h3>
            <p>Browse our comprehensive knowledge base with tutorials, guides, and FAQs.</p>
            <Link href="/help" className="channel-link">Visit Help Center</Link>
          </div>
          <div className="channel-card">
            <MessageOutlined />
            <h3>Live Chat</h3>
            <p>Chat with our support team in real-time during business hours.</p>
            <button className="channel-link">Start Chat</button>
          </div>
          <div className="channel-card">
            <CustomerServiceOutlined />
            <h3>Schedule a Call</h3>
            <p>Book a call with our team at a time that works for you.</p>
            <Link href="/demo" className="channel-link">Book a Call</Link>
          </div>
        </div>
      </section>

      <section className="faq-section">
        <div className="section-header">
          <h2>Frequently Asked Questions</h2>
          <p>Common questions about getting started and support.</p>
        </div>
        <div className="faq-grid">
          {supportFaqs.map((faq, index) => (
            <div key={index} className="faq-item">
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Get Started?</h2>
          <p>
            Start your free 14-day trial today. No credit card required.
          </p>
          <div className="cta-buttons">
            <Link href="/signup" className="btn-primary">Start Free Trial</Link>
            <Link href="/pricing" className="btn-secondary">View Pricing</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
