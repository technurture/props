'use client';

import Link from 'next/link';
import Image from 'next/image';
import { 
  CheckCircleFilled, 
  SafetyCertificateFilled, 
  CloudServerOutlined,
  TeamOutlined,
  ScheduleOutlined,
  MedicineBoxOutlined,
  DollarOutlined,
  BarChartOutlined,
  MobileOutlined,
  GlobalOutlined,
  LockOutlined,
  ApiOutlined,
  BankOutlined
} from '@ant-design/icons';

const features = [
  {
    icon: <TeamOutlined />,
    title: 'Patient Management',
    description: 'Complete patient records, medical history, vitals tracking, and document management in one place.'
  },
  {
    icon: <ScheduleOutlined />,
    title: 'Smart Scheduling',
    description: 'Calendar-based appointment booking with automated reminders and conflict detection.'
  },
  {
    icon: <MedicineBoxOutlined />,
    title: 'Clinical Workflow',
    description: 'Streamlined patient flow from check-in through consultation, lab, pharmacy, and billing.'
  },
  {
    icon: <DollarOutlined />,
    title: 'Billing & Insurance',
    description: 'Flexible billing with flat-rate, per-day, and per-hour options. Integrated insurance claims.'
  },
  {
    icon: <BarChartOutlined />,
    title: 'Analytics Dashboard',
    description: 'Real-time insights into patient flow, revenue, and operational efficiency.'
  },
  {
    icon: <MobileOutlined />,
    title: 'Mobile Ready',
    description: 'Access your EMR from any device with our responsive, mobile-first design.'
  }
];

const pricingPlans = [
  {
    name: 'Starter',
    price: 49,
    currency: '$',
    period: '/month',
    description: 'Perfect for small clinics just getting started',
    features: [
      'Up to 10 staff members',
      '1 branch location',
      '500 patients/month',
      'Basic patient management',
      'Appointment scheduling',
      'Standard billing',
      'Email support'
    ],
    cta: 'Start Free Trial',
    popular: false
  },
  {
    name: 'Professional',
    price: 199,
    currency: '$',
    period: '/month',
    description: 'For growing practices with multiple locations',
    features: [
      'Up to 50 staff members',
      '5 branch locations',
      '2,000 patients/month',
      'Advanced patient management',
      'Patient portal access',
      'Advanced analytics',
      'Insurance integration',
      'Priority support'
    ],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Enterprise',
    price: null,
    currency: '',
    period: '',
    description: 'For large hospitals with custom requirements',
    features: [
      'Unlimited staff members',
      'Unlimited branches',
      'Unlimited patients',
      'Custom integrations',
      'API access',
      'White-label options',
      'Telemedicine module',
      'Dedicated account manager',
      '24/7 phone support'
    ],
    cta: 'Contact Sales',
    popular: false
  }
];

const testimonials = [
  {
    quote: "NuncCare transformed how we manage patient records. The intuitive interface means our staff spent less time on paperwork and more time with patients.",
    author: "Dr. Amina Okonkwo",
    role: "Medical Director",
    clinic: "Lagos Family Clinic"
  },
  {
    quote: "The billing module alone saved us countless hours. We went from paper invoices to digital in weeks, and our collections improved by 40%.",
    author: "Emmanuel Adebayo",
    role: "Practice Manager",
    clinic: "Abuja Health Center"
  },
  {
    quote: "Finally, an EMR built for African healthcare providers. The insurance integration works seamlessly with local providers.",
    author: "Dr. Sarah Mensah",
    role: "Chief Medical Officer",
    clinic: "Accra Medical Group"
  }
];

const stats = [
  { value: '500+', label: 'Healthcare Providers' },
  { value: '1M+', label: 'Patients Served' },
  { value: '99.9%', label: 'Uptime Guarantee' },
  { value: '24/7', label: 'Support Available' }
];

const multiTenancyFeatures = [
  {
    icon: <LockOutlined />,
    title: 'Complete Data Isolation',
    description: 'Each healthcare organization has their own secure, isolated database space. Your patient data never mixes with others.'
  },
  {
    icon: <BankOutlined />,
    title: 'Independent Configuration',
    description: 'Customize settings, branding, and workflows specific to your organization without affecting other tenants.'
  },
  {
    icon: <ApiOutlined />,
    title: 'Seamless Scalability',
    description: 'Add unlimited branches, staff, and patients as your organization grows, all within your dedicated environment.'
  }
];

export default function MarketingHomePage() {
  return (
    <div className="marketing-home">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <SafetyCertificateFilled /> HIPAA & NDPR Compliant
          </div>
          <h1>
            The Modern EMR Solution for 
            <span className="highlight"> African Healthcare</span>
          </h1>
          <p className="hero-subtitle">
            Streamline patient care, simplify billing, and grow your practice with 
            the most intuitive electronic medical records system designed specifically 
            for healthcare providers across Africa.
          </p>
          <div className="hero-cta">
            <Link href="/signup" className="btn-primary">
              Start Your Free 14-Day Trial
            </Link>
            <Link href="/features" className="btn-secondary">
              Explore Features
            </Link>
          </div>
          <div className="hero-trust">
            <span>Trusted by leading healthcare providers:</span>
            <div className="trust-logos">
              <span className="trust-badge">ISO 27001</span>
              <span className="trust-badge">HIPAA</span>
              <span className="trust-badge">NDPR</span>
            </div>
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-image-container">
            <Image
              src="/marketing/doctor-ct-scanner.jpg"
              alt="Doctor using advanced medical technology"
              width={600}
              height={450}
              className="hero-main-image"
              priority
            />
            <div className="hero-image-overlay">
              <div className="overlay-card">
                <div className="overlay-icon">
                  <SafetyCertificateFilled />
                </div>
                <div className="overlay-text">
                  <strong>Secure & Compliant</strong>
                  <span>Enterprise-grade security</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-container">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="image-showcase">
        <div className="showcase-container">
          <div className="showcase-image">
            <Image
              src="/marketing/hospital-reception.jpg"
              alt="Modern hospital reception"
              width={500}
              height={350}
              className="showcase-img"
            />
          </div>
          <div className="showcase-content">
            <h2>Built for Modern Healthcare</h2>
            <p>
              NuncCare is designed from the ground up to meet the unique needs of 
              healthcare providers in Africa. From patient registration to billing, 
              we handle every aspect of your clinic&apos;s operations.
            </p>
            <ul className="showcase-list">
              <li><CheckCircleFilled /> Multi-branch support for growing organizations</li>
              <li><CheckCircleFilled /> Real-time patient queue management</li>
              <li><CheckCircleFilled /> Integrated lab and pharmacy workflows</li>
              <li><CheckCircleFilled /> Comprehensive reporting and analytics</li>
            </ul>
            <Link href="/features" className="btn-learn-more">
              Learn More About Features
            </Link>
          </div>
        </div>
      </section>

      <section className="features-section" id="features">
        <div className="section-header">
          <h2>Everything You Need to Run Your Practice</h2>
          <p>
            From patient registration to billing, NuncCare handles every aspect of 
            your healthcare operations with powerful, easy-to-use tools.
          </p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="workflow-section">
        <div className="section-header">
          <h2>Seamless Patient Journey</h2>
          <p>
            Our unique workflow system tracks patients through every step, 
            ensuring nothing falls through the cracks.
          </p>
        </div>
        <div className="workflow-steps">
          <div className="workflow-step">
            <div className="step-number">1</div>
            <h4>Check-In</h4>
            <p>Patient arrives and is registered at front desk</p>
          </div>
          <div className="workflow-arrow"></div>
          <div className="workflow-step">
            <div className="step-number">2</div>
            <h4>Nurse Triage</h4>
            <p>Vitals recorded and initial assessment</p>
          </div>
          <div className="workflow-arrow"></div>
          <div className="workflow-step">
            <div className="step-number">3</div>
            <h4>Consultation</h4>
            <p>Doctor examination and treatment plan</p>
          </div>
          <div className="workflow-arrow"></div>
          <div className="workflow-step">
            <div className="step-number">4</div>
            <h4>Lab/Pharmacy</h4>
            <p>Tests ordered and medications dispensed</p>
          </div>
          <div className="workflow-arrow"></div>
          <div className="workflow-step">
            <div className="step-number">5</div>
            <h4>Billing</h4>
            <p>Invoice generated and payment processed</p>
          </div>
        </div>
      </section>

      <section className="multi-tenancy-section">
        <div className="section-header">
          <h2>Multi-Tenancy Architecture</h2>
          <p>
            Each healthcare organization gets their own secure, isolated environment. 
            Your data stays yours - completely separate from other organizations.
          </p>
        </div>
        <div className="tenancy-content">
          <div className="tenancy-image">
            <Image
              src="/marketing/doctor-tablet.jpg"
              alt="Doctor using digital healthcare technology"
              width={500}
              height={350}
              className="tenancy-img"
            />
          </div>
          <div className="tenancy-features">
            {multiTenancyFeatures.map((feature, index) => (
              <div key={index} className="tenancy-feature">
                <div className="tenancy-icon">{feature.icon}</div>
                <div className="tenancy-text">
                  <h4>{feature.title}</h4>
                  <p>{feature.description}</p>
                </div>
              </div>
            ))}
            <div className="tenancy-cta">
              <Link href="/signup" className="btn-primary">
                Get Your Dedicated Environment
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="pricing-section" id="pricing">
        <div className="section-header">
          <h2>Simple, Transparent Pricing</h2>
          <p>
            Choose the plan that fits your practice. All plans include a 14-day free trial.
          </p>
        </div>
        <div className="pricing-grid">
          {pricingPlans.map((plan, index) => (
            <div key={index} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
              {plan.popular && <div className="popular-badge">Most Popular</div>}
              <h3>{plan.name}</h3>
              <div className="price">
                {plan.price !== null ? (
                  <>
                    <span className="currency">{plan.currency}</span>
                    <span className="amount">{plan.price}</span>
                    <span className="period">{plan.period}</span>
                  </>
                ) : (
                  <span className="custom">Custom Pricing</span>
                )}
              </div>
              <p className="plan-description">{plan.description}</p>
              <ul className="plan-features">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex}>
                    <CheckCircleFilled className="check-icon" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link 
                href={plan.name === 'Enterprise' ? '/contact' : '/signup'} 
                className={`btn-plan ${plan.popular ? 'btn-popular' : ''}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="testimonials-section">
        <div className="section-header">
          <h2>Trusted by Healthcare Providers</h2>
          <p>See what our customers have to say about NuncCare</p>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <p className="quote">&ldquo;{testimonial.quote}&rdquo;</p>
              <div className="author">
                <div className="author-avatar">
                  {testimonial.author.charAt(0)}
                </div>
                <div className="author-info">
                  <strong>{testimonial.author}</strong>
                  <span>{testimonial.role}</span>
                  <span>{testimonial.clinic}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="security-section">
        <div className="security-content">
          <div className="security-text">
            <h2>Enterprise-Grade Security</h2>
            <p>
              Your patients&apos; data deserves the highest level of protection. 
              NuncCare is built from the ground up with security and compliance in mind.
            </p>
            <ul className="security-features">
              <li>
                <SafetyCertificateFilled />
                <div>
                  <strong>HIPAA Compliant</strong>
                  <span>Full compliance with US healthcare privacy regulations</span>
                </div>
              </li>
              <li>
                <GlobalOutlined />
                <div>
                  <strong>NDPR Compliant</strong>
                  <span>Meets Nigeria Data Protection Regulation standards</span>
                </div>
              </li>
              <li>
                <CloudServerOutlined />
                <div>
                  <strong>256-bit Encryption</strong>
                  <span>All data encrypted at rest and in transit</span>
                </div>
              </li>
            </ul>
          </div>
          <div className="security-badges">
            <div className="badge">ISO 27001</div>
            <div className="badge">SOC 2</div>
            <div className="badge">HIPAA</div>
            <div className="badge">NDPR</div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Transform Your Practice?</h2>
          <p>
            Join hundreds of healthcare providers who trust NuncCare to manage 
            their operations. Start your free trial today - no credit card required.
          </p>
          <div className="cta-buttons">
            <Link href="/signup" className="btn-primary">
              Start Your Free 14-Day Trial
            </Link>
            <Link href="/contact" className="btn-secondary">
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
