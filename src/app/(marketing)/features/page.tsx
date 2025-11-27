'use client';

import Link from 'next/link';
import { 
  TeamOutlined,
  ScheduleOutlined,
  MedicineBoxOutlined,
  DollarOutlined,
  BarChartOutlined,
  MobileOutlined,
  SafetyCertificateFilled,
  CloudServerOutlined,
  FileTextOutlined,
  ExperimentOutlined,
  HeartOutlined,
  BellOutlined,
  UserSwitchOutlined,
  SolutionOutlined,
  AuditOutlined,
  SettingOutlined,
  ApiOutlined,
  GlobalOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  SyncOutlined,
  LockOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  TabletOutlined,
  ThunderboltOutlined,
  CustomerServiceOutlined
} from '@ant-design/icons';

const featureCategories = [
  {
    id: 'patient-management',
    title: 'Patient Management',
    description: 'Complete patient records management from registration to discharge.',
    icon: <TeamOutlined />,
    features: [
      { name: 'Patient Registration', description: 'Quick patient intake with customizable forms' },
      { name: 'Medical History', description: 'Comprehensive medical history tracking' },
      { name: 'Vital Signs Monitoring', description: 'Record and track patient vitals over time' },
      { name: 'Document Management', description: 'Upload and organize patient documents' },
      { name: 'Patient Portal', description: 'Self-service portal for patients' },
      { name: 'Family History', description: 'Track hereditary conditions and family medical history' }
    ]
  },
  {
    id: 'scheduling',
    title: 'Appointment Scheduling',
    description: 'Smart scheduling that reduces no-shows and optimizes your calendar.',
    icon: <ScheduleOutlined />,
    features: [
      { name: 'Online Booking', description: 'Patients can book appointments online 24/7' },
      { name: 'Calendar Management', description: 'Visual calendar with drag-and-drop scheduling' },
      { name: 'Automated Reminders', description: 'SMS and email reminders to reduce no-shows' },
      { name: 'Recurring Appointments', description: 'Set up recurring visits for chronic care' },
      { name: 'Multi-Provider Scheduling', description: 'Manage schedules for multiple providers' },
      { name: 'Waitlist Management', description: 'Automatically fill cancellations from waitlist' }
    ]
  },
  {
    id: 'clinical-workflow',
    title: 'Clinical Workflow',
    description: 'Streamlined patient flow from check-in to checkout.',
    icon: <MedicineBoxOutlined />,
    features: [
      { name: 'Queue Management', description: 'Real-time patient queue with status tracking' },
      { name: 'Nurse Triage', description: 'Structured triage workflow with vitals capture' },
      { name: 'Doctor Consultation', description: 'SOAP notes, diagnosis, and treatment planning' },
      { name: 'Lab Integration', description: 'Order tests and receive results digitally' },
      { name: 'Pharmacy Management', description: 'E-prescribing and medication tracking' },
      { name: 'Clinical Templates', description: 'Customizable templates for common conditions' }
    ]
  },
  {
    id: 'billing',
    title: 'Billing & Insurance',
    description: 'Flexible billing options with integrated insurance claims.',
    icon: <DollarOutlined />,
    features: [
      { name: 'Automated Invoicing', description: 'Generate invoices automatically from visits' },
      { name: 'Multiple Payment Options', description: 'Accept cards, bank transfers, and mobile money' },
      { name: 'Insurance Claims', description: 'Submit and track insurance claims' },
      { name: 'Payment Plans', description: 'Set up installment payment plans' },
      { name: 'Service Charges', description: 'Flexible pricing with flat, hourly, and daily rates' },
      { name: 'Revenue Tracking', description: 'Track payments and outstanding balances' }
    ]
  },
  {
    id: 'analytics',
    title: 'Analytics & Reporting',
    description: 'Data-driven insights to optimize your practice.',
    icon: <BarChartOutlined />,
    features: [
      { name: 'Dashboard Overview', description: 'At-a-glance view of key metrics' },
      { name: 'Financial Reports', description: 'Revenue, collections, and aging reports' },
      { name: 'Patient Analytics', description: 'Demographics, visits, and outcomes' },
      { name: 'Staff Performance', description: 'Track provider productivity and efficiency' },
      { name: 'Custom Reports', description: 'Build reports tailored to your needs' },
      { name: 'Export Options', description: 'Export data in Excel, PDF, and CSV formats' }
    ]
  },
  {
    id: 'administration',
    title: 'Administration',
    description: 'Powerful tools to manage your organization.',
    icon: <SettingOutlined />,
    features: [
      { name: 'Multi-Branch Support', description: 'Manage multiple locations from one account' },
      { name: 'Staff Management', description: 'Role-based access control and permissions' },
      { name: 'Attendance Tracking', description: 'Clock in/out and shift management' },
      { name: 'Audit Logs', description: 'Complete audit trail of all actions' },
      { name: 'Notification Settings', description: 'Customize alerts and notifications' },
      { name: 'System Configuration', description: 'Flexible settings for your workflow' }
    ]
  }
];

const highlights = [
  {
    icon: <ThunderboltOutlined />,
    title: 'Fast & Intuitive',
    description: 'Modern interface designed for speed. Most actions take just 2-3 clicks.'
  },
  {
    icon: <LockOutlined />,
    title: 'Enterprise Security',
    description: 'Bank-level encryption, HIPAA & NDPR compliant, with regular security audits.'
  },
  {
    icon: <SyncOutlined />,
    title: 'Real-Time Sync',
    description: 'Changes sync instantly across all devices and users.'
  },
  {
    icon: <MobileOutlined />,
    title: 'Mobile Friendly',
    description: 'Access NuncCare from any device—desktop, tablet, or smartphone.'
  },
  {
    icon: <CustomerServiceOutlined />,
    title: '24/7 Support',
    description: 'Our dedicated support team is always here to help you succeed.'
  },
  {
    icon: <ApiOutlined />,
    title: 'API Access',
    description: 'Integrate with your existing systems using our robust API.'
  }
];

const comparisonFeatures = [
  { feature: 'Patient Management', nunccare: true, legacy: true },
  { feature: 'Cloud-Based Access', nunccare: true, legacy: false },
  { feature: 'Real-Time Sync', nunccare: true, legacy: false },
  { feature: 'Mobile Responsive', nunccare: true, legacy: false },
  { feature: 'Automated Reminders', nunccare: true, legacy: false },
  { feature: 'Insurance Integration', nunccare: true, legacy: 'Limited' },
  { feature: 'Queue Management', nunccare: true, legacy: false },
  { feature: 'Multi-Branch Support', nunccare: true, legacy: 'Expensive Add-on' },
  { feature: 'HIPAA Compliant', nunccare: true, legacy: 'Varies' },
  { feature: 'Free Updates', nunccare: true, legacy: false },
  { feature: 'Implementation Time', nunccare: '1-2 Days', legacy: 'Weeks/Months' },
  { feature: 'African Payment Methods', nunccare: true, legacy: false }
];

export default function FeaturesPage() {
  return (
    <div className="features-page">
      <section className="features-hero">
        <div className="hero-badge">
          <SafetyCertificateFilled /> Enterprise-Grade Healthcare Software
        </div>
        <h1>Everything You Need to Run Your Practice</h1>
        <p>
          NuncCare combines powerful features with an intuitive interface, 
          giving you the tools to deliver exceptional patient care while 
          streamlining your operations.
        </p>
        <div className="hero-cta">
          <Link href="/signup" className="btn-primary">Start Free Trial</Link>
          <Link href="/demo" className="btn-secondary">Watch Demo</Link>
        </div>
      </section>

      <section className="highlights-section">
        <div className="highlights-grid">
          {highlights.map((item, index) => (
            <div key={index} className="highlight-card">
              <div className="highlight-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="categories-section">
        {featureCategories.map((category, index) => (
          <div 
            key={category.id} 
            id={category.id}
            className={`category-block ${index % 2 === 1 ? 'alternate' : ''}`}
          >
            <div className="category-header">
              <div className="category-icon">{category.icon}</div>
              <div className="category-intro">
                <h2>{category.title}</h2>
                <p>{category.description}</p>
              </div>
            </div>
            <div className="features-list">
              {category.features.map((feature, fIndex) => (
                <div key={fIndex} className="feature-item">
                  <CheckCircleFilled className="check-icon" />
                  <div className="feature-text">
                    <h4>{feature.name}</h4>
                    <p>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="screenshots-section">
        <div className="section-header">
          <h2>See NuncCare in Action</h2>
          <p>
            A modern, intuitive interface designed for healthcare professionals.
          </p>
        </div>
        <div className="screenshots-grid">
          <div className="screenshot-card">
            <div className="screenshot-mockup dashboard">
              <div className="mockup-header">
                <span>Dashboard Overview</span>
              </div>
              <div className="mockup-content">
                <div className="mockup-sidebar"></div>
                <div className="mockup-main">
                  <div className="mockup-stats">
                    <div className="stat-box"></div>
                    <div className="stat-box"></div>
                    <div className="stat-box"></div>
                    <div className="stat-box"></div>
                  </div>
                  <div className="mockup-chart"></div>
                  <div className="mockup-table"></div>
                </div>
              </div>
            </div>
            <h3>Real-Time Dashboard</h3>
            <p>Get an instant overview of your practice with key metrics and insights.</p>
          </div>
          <div className="screenshot-card">
            <div className="screenshot-mockup patient">
              <div className="mockup-header">
                <span>Patient Records</span>
              </div>
              <div className="mockup-content">
                <div className="mockup-sidebar"></div>
                <div className="mockup-main">
                  <div className="patient-header"></div>
                  <div className="patient-tabs"></div>
                  <div className="patient-content"></div>
                </div>
              </div>
            </div>
            <h3>Comprehensive Patient Records</h3>
            <p>Everything you need to know about your patients in one place.</p>
          </div>
          <div className="screenshot-card">
            <div className="screenshot-mockup schedule">
              <div className="mockup-header">
                <span>Appointment Calendar</span>
              </div>
              <div className="mockup-content">
                <div className="calendar-header"></div>
                <div className="calendar-grid">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="calendar-day">
                      <div className="calendar-event"></div>
                      <div className="calendar-event small"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <h3>Smart Scheduling</h3>
            <p>Visual calendar with drag-and-drop appointment management.</p>
          </div>
        </div>
      </section>

      <section className="comparison-section">
        <div className="section-header">
          <h2>NuncCare vs Legacy Systems</h2>
          <p>See why modern healthcare providers are switching to NuncCare.</p>
        </div>
        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th className="nunccare">NuncCare</th>
                <th>Legacy EMR</th>
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((item, index) => (
                <tr key={index}>
                  <td>{item.feature}</td>
                  <td className="nunccare">
                    {typeof item.nunccare === 'boolean' ? (
                      item.nunccare ? <CheckCircleFilled className="check" /> : <span className="cross">✕</span>
                    ) : (
                      item.nunccare
                    )}
                  </td>
                  <td>
                    {typeof item.legacy === 'boolean' ? (
                      item.legacy ? <CheckCircleFilled className="check" /> : <span className="cross">✕</span>
                    ) : (
                      <span className="limited">{item.legacy}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="integration-section">
        <div className="section-header">
          <h2>Integrations & Ecosystem</h2>
          <p>NuncCare works with the tools you already use.</p>
        </div>
        <div className="integrations-grid">
          <div className="integration-card">
            <DatabaseOutlined />
            <span>Lab Systems</span>
          </div>
          <div className="integration-card">
            <DollarOutlined />
            <span>Payment Gateways</span>
          </div>
          <div className="integration-card">
            <HeartOutlined />
            <span>Insurance Providers</span>
          </div>
          <div className="integration-card">
            <MobileOutlined />
            <span>SMS Providers</span>
          </div>
          <div className="integration-card">
            <CloudServerOutlined />
            <span>Cloud Storage</span>
          </div>
          <div className="integration-card">
            <ApiOutlined />
            <span>Custom API</span>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Modernize Your Practice?</h2>
          <p>
            Join 500+ healthcare providers who trust NuncCare. 
            Start your free 14-day trial—no credit card required.
          </p>
          <div className="cta-buttons">
            <Link href="/signup" className="btn-primary">Start Your Free Trial</Link>
            <Link href="/contact" className="btn-secondary">Talk to Sales</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
