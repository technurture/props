'use client';

import Link from 'next/link';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';

const pricingPlans = [
  {
    name: 'Starter',
    price: 49,
    currency: '$',
    period: '/month',
    description: 'Perfect for small clinics just getting started with digital healthcare management',
    features: {
      'Staff members': '10',
      'Branch locations': '1',
      'Patients per month': '500',
      'Storage': '2 GB',
      'Patient management': true,
      'Appointment scheduling': true,
      'Basic billing': true,
      'Insurance integration': false,
      'Patient portal': false,
      'Telemedicine': false,
      'Advanced analytics': false,
      'API access': false,
      'White-label': false,
      'Custom domain': false,
      'Support': 'Email',
    },
    cta: 'Start Free Trial',
    popular: false
  },
  {
    name: 'Professional',
    price: 199,
    currency: '$',
    period: '/month',
    description: 'For growing practices with multiple locations and advanced needs',
    features: {
      'Staff members': '50',
      'Branch locations': '5',
      'Patients per month': '2,000',
      'Storage': '10 GB',
      'Patient management': true,
      'Appointment scheduling': true,
      'Basic billing': true,
      'Insurance integration': true,
      'Patient portal': true,
      'Telemedicine': false,
      'Advanced analytics': true,
      'API access': false,
      'White-label': false,
      'Custom domain': false,
      'Support': 'Priority email',
    },
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Enterprise',
    price: null,
    currency: '',
    period: '',
    description: 'For large hospitals with custom requirements and unlimited scale',
    features: {
      'Staff members': 'Unlimited',
      'Branch locations': 'Unlimited',
      'Patients per month': 'Unlimited',
      'Storage': '50 GB',
      'Patient management': true,
      'Appointment scheduling': true,
      'Basic billing': true,
      'Insurance integration': true,
      'Patient portal': true,
      'Telemedicine': true,
      'Advanced analytics': true,
      'API access': true,
      'White-label': true,
      'Custom domain': true,
      'Support': '24/7 phone & email',
    },
    cta: 'Contact Sales',
    popular: false
  }
];

const faqs = [
  {
    question: 'What is included in the free trial?',
    answer: 'The 14-day free trial includes full access to all features of the Professional plan. No credit card is required to start, and you can cancel anytime during the trial period.'
  },
  {
    question: 'Can I change plans later?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated and reflected in your next billing cycle.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, debit cards, and bank transfers. For Nigerian customers, we also support Paystack for local payment processing.'
  },
  {
    question: 'Is there a setup fee?',
    answer: 'No, there are no setup fees. You can start using MedVault immediately after signing up. We also offer free data migration assistance for Professional and Enterprise plans.'
  },
  {
    question: 'How secure is my data?',
    answer: 'MedVault uses enterprise-grade security including 256-bit encryption, regular backups, and is compliant with HIPAA and NDPR regulations. Your data is stored in secure, geographically distributed data centers.'
  },
  {
    question: 'Can I add more users than my plan allows?',
    answer: 'Yes, additional users can be added at $10/user/month for Starter and Professional plans. Enterprise plans include unlimited users.'
  }
];

export default function PricingPage() {
  const featureKeys = Object.keys(pricingPlans[0].features);

  return (
    <div className="pricing-page">
      <section className="pricing-hero">
        <h1>Simple, Transparent Pricing</h1>
        <p>Choose the plan that fits your practice. All plans include a 14-day free trial with no credit card required.</p>
      </section>

      <section className="pricing-cards-section">
        <div className="pricing-cards">
          {pricingPlans.map((plan, index) => (
            <div key={index} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
              {plan.popular && <div className="popular-badge">Most Popular</div>}
              <h2>{plan.name}</h2>
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
              <p className="description">{plan.description}</p>
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

      <section className="comparison-section">
        <h2>Feature Comparison</h2>
        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                {pricingPlans.map((plan, index) => (
                  <th key={index} className={plan.popular ? 'popular' : ''}>
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureKeys.map((feature, index) => (
                <tr key={index}>
                  <td>{feature}</td>
                  {pricingPlans.map((plan, planIndex) => {
                    const value = plan.features[feature as keyof typeof plan.features];
                    return (
                      <td key={planIndex} className={plan.popular ? 'popular' : ''}>
                        {typeof value === 'boolean' ? (
                          value ? (
                            <CheckCircleFilled className="check" />
                          ) : (
                            <CloseCircleFilled className="cross" />
                          )
                        ) : (
                          value
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="faq-section">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-grid">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item">
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pricing-cta">
        <h2>Ready to Get Started?</h2>
        <p>Join hundreds of healthcare providers who trust MedVault. Start your free trial today.</p>
        <div className="cta-buttons">
          <Link href="/signup" className="btn-primary">Start Your Free Trial</Link>
          <Link href="/contact" className="btn-secondary">Talk to Sales</Link>
        </div>
      </section>
    </div>
  );
}
