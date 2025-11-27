'use client';

import Link from 'next/link';
import Image from 'next/image';
import { 
  HeartFilled,
  SafetyCertificateFilled,
  TeamOutlined,
  RocketOutlined,
  GlobalOutlined,
  CheckCircleFilled,
  TrophyOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  StarFilled
} from '@ant-design/icons';

const teamMembers = [
  {
    name: 'Dr. Adaeze Okafor',
    role: 'Co-Founder & CEO',
    bio: 'Former Medical Director with 15+ years in healthcare management. Passionate about bringing technology to African healthcare.',
    avatar: '/assets/img/avatars/avatar-01.jpg'
  },
  {
    name: 'Chukwuemeka Nwachukwu',
    role: 'Co-Founder & CTO',
    bio: 'Software engineer with experience at major tech companies. Leads our engineering team in building secure, scalable solutions.',
    avatar: '/assets/img/avatars/avatar-02.jpg'
  },
  {
    name: 'Fatima Bello',
    role: 'Head of Product',
    bio: 'Product leader focused on user experience. Ensures NuncCare meets the real needs of healthcare providers.',
    avatar: '/assets/img/avatars/avatar-03.jpg'
  },
  {
    name: 'Dr. Kwame Asante',
    role: 'Chief Medical Officer',
    bio: 'Practicing physician who bridges the gap between technology and clinical workflows.',
    avatar: '/assets/img/avatars/avatar-04.jpg'
  },
  {
    name: 'Ngozi Eze',
    role: 'Head of Customer Success',
    bio: 'Healthcare operations expert dedicated to ensuring our clients get the most from NuncCare.',
    avatar: '/assets/img/avatars/avatar-05.jpg'
  },
  {
    name: 'Oluwaseun Adebayo',
    role: 'Head of Engineering',
    bio: 'Full-stack engineer with expertise in healthcare systems and data security.',
    avatar: '/assets/img/avatars/avatar-06.jpg'
  }
];

const values = [
  {
    icon: <HeartFilled />,
    title: 'Patient-First',
    description: 'Every feature we build aims to improve patient care and outcomes. We never lose sight of the people our software ultimately serves.'
  },
  {
    icon: <SafetyCertificateFilled />,
    title: 'Security & Privacy',
    description: 'We treat patient data with the utmost respect. HIPAA and NDPR compliance are non-negotiable foundations of everything we build.'
  },
  {
    icon: <BulbOutlined />,
    title: 'Innovation',
    description: 'We continuously evolve our platform to incorporate the latest best practices in healthcare technology and user experience.'
  },
  {
    icon: <TeamOutlined />,
    title: 'Partnership',
    description: 'We view our customers as partners. Your success is our success, and we work closely with you to achieve your goals.'
  },
  {
    icon: <GlobalOutlined />,
    title: 'African Focus',
    description: 'Built specifically for African healthcare providers, understanding local regulations, insurance systems, and clinical workflows.'
  },
  {
    icon: <ThunderboltOutlined />,
    title: 'Simplicity',
    description: 'Healthcare is complex enough. We strive to make our software intuitive, reducing training time and increasing adoption.'
  }
];

const milestones = [
  {
    year: '2019',
    title: 'The Idea',
    description: 'Dr. Adaeze Okafor and Chukwuemeka Nwachukwu meet at a healthcare conference in Lagos. Frustrated by outdated systems, they envision a modern EMR for Africa.'
  },
  {
    year: '2020',
    title: 'NuncCare Founded',
    description: 'Company officially incorporated. First prototype developed and tested with 3 pilot clinics in Lagos, gathering crucial feedback.'
  },
  {
    year: '2021',
    title: 'First Customers',
    description: 'Launched commercial product. Onboarded 25 healthcare facilities across Nigeria and Ghana. Achieved HIPAA compliance certification.'
  },
  {
    year: '2022',
    title: 'Rapid Growth',
    description: 'Expanded to 150+ healthcare providers. Launched insurance integration module. Opened regional office in Accra.'
  },
  {
    year: '2023',
    title: 'Series A Funding',
    description: 'Raised $5M to accelerate product development and expansion. Introduced telemedicine and advanced analytics features.'
  },
  {
    year: '2024',
    title: 'Pan-African Expansion',
    description: 'Now serving 500+ healthcare providers across 8 African countries. Launched mobile app and patient portal.'
  }
];

const stats = [
  { value: '500+', label: 'Healthcare Providers' },
  { value: '8', label: 'Countries' },
  { value: '1M+', label: 'Patients Served' },
  { value: '50+', label: 'Team Members' }
];

export default function AboutPage() {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="hero-content">
          <h1>Transforming Healthcare Technology in Africa</h1>
          <p>
            NuncCare was founded with a simple mission: to give African healthcare providers 
            the modern, intuitive tools they need to deliver exceptional patient care.
          </p>
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

      <section className="mission-section">
        <div className="mission-content">
          <div className="mission-text">
            <div className="section-label">Our Mission</div>
            <h2>Empowering Healthcare Providers to Focus on What Matters Most</h2>
            <p>
              Too many healthcare providers across Africa are held back by outdated paper systems, 
              fragmented software, and tools designed for different markets. This wastes time, 
              increases errors, and ultimately affects patient care.
            </p>
            <p>
              NuncCare exists to change this. We build modern, secure, and intuitive healthcare 
              management software specifically designed for the African context. Our platform 
              handles the complexity of patient records, scheduling, billing, and compliance—so 
              healthcare providers can focus on what they do best: caring for patients.
            </p>
          </div>
          <div className="mission-vision">
            <div className="vision-card">
              <RocketOutlined />
              <h3>Our Vision</h3>
              <p>
                To become the leading healthcare technology platform in Africa, enabling 
                every healthcare facility—from small clinics to large hospitals—to operate 
                efficiently, securely, and at scale.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="values-section">
        <div className="section-header">
          <h2>Our Core Values</h2>
          <p>
            These principles guide every decision we make, from product development to customer support.
          </p>
        </div>
        <div className="values-grid">
          {values.map((value, index) => (
            <div key={index} className="value-card">
              <div className="value-icon">{value.icon}</div>
              <h3>{value.title}</h3>
              <p>{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="team-section">
        <div className="section-header">
          <h2>Meet Our Leadership Team</h2>
          <p>
            A diverse team of healthcare professionals, engineers, and operators united by our mission.
          </p>
        </div>
        <div className="team-grid">
          {teamMembers.map((member, index) => (
            <div key={index} className="team-card">
              <div className="team-avatar">
                <Image 
                  src={member.avatar} 
                  alt={member.name}
                  width={120}
                  height={120}
                />
              </div>
              <h3>{member.name}</h3>
              <span className="team-role">{member.role}</span>
              <p>{member.bio}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="journey-section">
        <div className="section-header">
          <h2>Our Journey</h2>
          <p>
            From a frustration to a mission—how NuncCare came to be.
          </p>
        </div>
        <div className="timeline">
          {milestones.map((milestone, index) => (
            <div key={index} className="timeline-item">
              <div className="timeline-marker">
                <span className="timeline-year">{milestone.year}</span>
              </div>
              <div className="timeline-content">
                <h3>{milestone.title}</h3>
                <p>{milestone.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="certifications-section">
        <div className="section-header">
          <h2>Certifications & Compliance</h2>
          <p>
            Your data security is our top priority. NuncCare meets the highest standards.
          </p>
        </div>
        <div className="certifications-grid">
          <div className="certification-card">
            <SafetyCertificateFilled />
            <h3>HIPAA Compliant</h3>
            <p>Full compliance with US healthcare privacy regulations</p>
          </div>
          <div className="certification-card">
            <SafetyCertificateFilled />
            <h3>NDPR Compliant</h3>
            <p>Nigeria Data Protection Regulation certified</p>
          </div>
          <div className="certification-card">
            <SafetyCertificateFilled />
            <h3>ISO 27001</h3>
            <p>International information security standard</p>
          </div>
          <div className="certification-card">
            <SafetyCertificateFilled />
            <h3>SOC 2 Type II</h3>
            <p>Verified security controls and practices</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Transform Your Practice?</h2>
          <p>
            Join hundreds of healthcare providers who trust NuncCare to manage their operations.
          </p>
          <div className="cta-buttons">
            <Link href="/signup" className="btn-primary">Start Your Free Trial</Link>
            <Link href="/contact" className="btn-secondary">Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
