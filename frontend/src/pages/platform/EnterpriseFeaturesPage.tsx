import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { 
  CheckCircle, 
  Shield, 
  ChevronDown,
  ChevronUp,
  Bot,
  Mic,
  Home,
  Zap,
  Heart,
  Globe,
  DollarSign,
  Award,
  Users,
  TrendingUp,
  Building
} from 'lucide-react'

interface FeatureCategory {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  color: string
  features: {
    title: string
    description: string
    benefits: string[]
  }[]
}

const enterpriseFeatures: FeatureCategory[] = [
  {
    id: 'ai-agents',
    title: 'AI-Powered Care Home Intelligence',
    description: 'Intelligent automation for care home operations and resident services',
    icon: Bot,
    color: 'from-violet-500 to-purple-600',
    features: [
      {
        title: 'Business Operations AI',
        description: 'Smart automation for daily care home management tasks',
        benefits: [
          'Automated staff scheduling and optimization',
          'Intelligent resident care planning',
          'Predictive maintenance scheduling',
          'Smart resource allocation and inventory management',
          'Automated compliance reporting and monitoring'
        ]
      },
      {
        title: 'Resident Services AI',
        description: 'Intelligent assistant for enhanced resident experience and family communication',
        benefits: [
          'Personalized activity recommendations',
          'Family communication automation',
          'Resident preference tracking and adaptation',
          'Social engagement optimization',
          'Quality of life enhancement suggestions'
        ]
      },
      {
        title: 'Business Intelligence & Analytics',
        description: 'Smart insights for care home operations and performance optimization',
        benefits: [
          'Occupancy forecasting and revenue optimization',
          'Staff efficiency and performance analytics',
          'Resident satisfaction trend analysis',
          'Operational cost optimization',
          'Regulatory compliance automation'
        ]
      }
    ]
  },
  {
    id: 'voice-tech',
    title: 'Voice-Enabled Operations Management',
    description: 'Hands-free documentation and communication for busy care home staff',
    icon: Mic,
    color: 'from-emerald-500 to-teal-600',
    features: [
      {
        title: 'Hands-Free Activity Documentation',
        description: 'Voice commands for recording resident activities and observations',
        benefits: [
          'Speak naturally to log daily activities',
          'Automatic transcription with care context understanding',
          'Instant activity verification and compliance',
          'Error reduction through voice confirmation',
          'Seamless integration with care records'
        ]
      },
      {
        title: 'Voice Care Notes & Updates',
        description: 'Update resident records and care plans using natural language',
        benefits: [
          'Dictate observations while providing care',
          'Natural language processing for care context',
          'Auto-formatting for professional documentation',
          'Voice-triggered incident reporting',
          'Multi-language support for diverse staff'
        ]
      },
      {
        title: 'Voice-Controlled Information Access',
        description: 'Instant access to resident information and care details through voice',
        benefits: [
          'Quick resident information retrieval',
          'Voice-activated care history access',
          'Hands-free during care delivery',
          'Emergency contact information via voice',
          'Integration with family communication systems'
        ]
      }
    ]
  },
  {
    id: 'system-integration',
    title: 'Complete Care Home System Integration',
    description: 'Seamless connectivity with regulatory bodies and external systems',
    icon: Heart,
    color: 'from-blue-500 to-indigo-600',
    features: [
      {
        title: 'Regulatory Body Integration',
        description: 'Direct connectivity with CQC, Care Inspectorate, CIW, and RQIA',
        benefits: [
          'Automated compliance reporting submissions',
          'Real-time regulatory update notifications',
          'Digital inspection preparation and documentation',
          'Automated quality standard monitoring',
          'Regulatory deadline tracking and alerts'
        ]
      },
      {
        title: 'Local Authority & GP Connect Integration',
        description: 'Seamless connection with local councils and resident GP practices',
        benefits: [
          'Social services referral management',
          'Local authority funding and placement coordination',
          'Resident GP consultation coordination',
          'GP practice communication for resident health updates',
          'Local healthcare service coordination'
        ]
      },
      {
        title: 'Financial & Business System Integration',
        description: 'Complete connectivity with accounting, payroll, and business systems',
        benefits: [
          'HMRC Real Time Information (RTI) submission',
          'Automated VAT and tax reporting',
          'Bank reconciliation and payment processing',
          'Pension scheme integration',
          'Insurance claim processing automation'
        ]
      }
    ]
  },
  {
    id: 'emergency-response',
    title: 'Emergency Response & Incident Management',
    description: 'Comprehensive emergency management with smart escalation protocols',
    icon: Shield,
    color: 'from-red-500 to-pink-600',
    features: [
      {
        title: 'Incident Response Management',
        description: '24/7 intelligent incident response and staff coordination',
        benefits: [
          'Automated staff notification systems',
          'Skill-based incident response assignment',
          'Multi-level escalation protocols',
          'Real-time staff availability tracking',
          'Emergency contact and family notification'
        ]
      },
      {
        title: 'Call Bell & Communication System',
        description: 'Advanced resident call system with intelligent routing',
        benefits: [
          'Priority-based call routing to available staff',
          'Response time monitoring and analytics',
          'Staff workload distribution optimization',
          'Emergency alert escalation protocols',
          'Real-time response dashboard and reporting'
        ]
      },
      {
        title: 'Crisis Management & Emergency Coordination',
        description: 'Comprehensive emergency response for care home operations',
        benefits: [
          'Multi-level incident classification system',
          'Automated emergency service coordination',
          'Real-time incident tracking and documentation',
          'Post-incident analysis and improvement',
          'Family notification and communication protocols'
        ]
      }
    ]
  },
  {
    id: 'mobile-operations',
    title: 'Mobile Care Home Management',
    description: 'Complete mobile-first operations with real-time connectivity',
    icon: Home,
    color: 'from-cyan-500 to-blue-600',
    features: [
      {
        title: 'Mobile Staff Management',
        description: 'Complete mobile workforce management for care home staff',
        benefits: [
          'Real-time staff check-in and location tracking',
          'Mobile shift management and updates',
          'Instant access to resident information',
          'Mobile incident reporting and documentation',
          'Staff communication and messaging system'
        ]
      },
      {
        title: 'Mobile Family Portal',
        description: 'Family engagement platform with real-time updates',
        benefits: [
          'Real-time resident activity updates',
          'Photo and video sharing capabilities',
          'Direct messaging with care staff',
          'Visit scheduling and coordination',
          'Care plan review and feedback'
        ]
      },
      {
        title: 'Mobile Operations Dashboard',
        description: 'Complete care home management from any device',
        benefits: [
          'Real-time operational oversight',
          'Mobile resident care tracking',
          'Staff performance monitoring',
          'Compliance checklist management',
          'Emergency response coordination'
        ]
      }
    ]
  },
  {
    id: 'compliance-legal',
    title: 'Regulatory Compliance & Legal Management',
    description: 'DOLS, Mental Capacity Act, and care home regulatory compliance',
    icon: CheckCircle,
    color: 'from-purple-500 to-indigo-600',
    features: [
      {
        title: 'DOLS & Mental Capacity Management',
        description: 'Deprivation of Liberty Safeguards and Mental Capacity Act compliance',
        benefits: [
          'Mental Capacity Act assessment tools',
          'DOLS authorization tracking and management',
          'Best interest decision documentation',
          'Capacity assessment workflows',
          'Legal compliance monitoring and alerts'
        ]
      },
      {
        title: 'Hospital Passport Integration',
        description: 'Comprehensive hospital transfer documentation',
        benefits: [
          'Automated hospital passport generation',
          'Key information transfer on admission',
          'Medical history and medication summary',
          'Care preferences and communication needs',
          'Emergency contact and GP information'
        ]
      },
      {
        title: 'Safeguarding & Clinical Governance',
        description: 'Complete safeguarding protocols and clinical oversight',
        benefits: [
          'Safeguarding alert systems',
          'Risk assessment and management',
          'Clinical governance frameworks',
          'Incident reporting and investigation',
          'Professional registration tracking'
        ]
      }
    ]
  },
  {
    id: 'telehealth-iot',
    title: 'Telehealth & IoT Integration',
    description: 'Modern healthcare delivery with smart monitoring',
    icon: Zap,
    color: 'from-orange-500 to-red-600',
    features: [
      {
        title: 'Telehealth Services',
        description: 'Integrated telehealth consultations and remote monitoring',
        benefits: [
          'GP video consultation scheduling',
          'Remote specialist appointments',
          'Digital prescription management',
          'Virtual family visit coordination',
          'Remote health assessments'
        ]
      },
      {
        title: 'IoT Device Integration',
        description: 'Smart sensor and wearable device management',
        benefits: [
          'Wearable health monitoring devices',
          'Fall detection and prevention systems',
          'Environmental monitoring sensors',
          'Sleep pattern analysis',
          'Automated health alerts and notifications'
        ]
      },
      {
        title: 'Smart Care Home Management',
        description: 'Intelligent building systems for optimal care environment',
        benefits: [
          'Temperature and air quality monitoring',
          'Motion detection and safety alerts',
          'Energy management and optimization',
          'Security system integration',
          'Predictive maintenance scheduling'
        ]
      }
    ]
  },
  {
    id: 'hr-workforce',
    title: 'Complete HR & Workforce Management',
    description: 'Comprehensive staff lifecycle with automated payroll and tax optimization',
    icon: Users,
    color: 'from-indigo-500 to-purple-600',
    features: [
      {
        title: 'Automated Payroll & Tax Optimization',
        description: 'Full HMRC integration with intelligent tax optimization strategies',
        benefits: [
          'Automated PAYE, National Insurance, and pension calculations',
          'Real-Time Information (RTI) submissions to HMRC',
          'Tax-efficient employment structure recommendations',
          'Salary sacrifice schemes and benefit optimization',
          'Statutory payments (SSP, SMP, SPP) automation'
        ]
      },
      {
        title: 'AI-Powered Workforce Scheduling',
        description: 'Intelligent staff scheduling with cost optimization and compliance',
        benefits: [
          'Skills-based staff matching and allocation',
          'Working Time Regulations compliance monitoring',
          'Cost optimization with agency staff integration',
          'Predictive staffing based on occupancy trends',
          'Automated break and overtime management'
        ]
      },
      {
        title: 'Complete Employee Lifecycle Management',
        description: 'End-to-end HR management from recruitment to retirement',
        benefits: [
          'Digital onboarding with compliance verification',
          'Performance management and appraisal workflows',
          'Training certification tracking and renewals',
          'Employment law compliance monitoring',
          'DBS checks and professional registration tracking'
        ]
      }
    ]
  },
  {
    id: 'cashflow-treasury',
    title: 'Advanced Cashflow & Treasury Management',
    description: 'Enterprise-grade financial planning with predictive analytics',
    icon: TrendingUp,
    color: 'from-green-500 to-teal-600',
    features: [
      {
        title: 'Real-Time Cashflow Forecasting',
        description: 'Daily, weekly, and monthly cash position monitoring with AI predictions',
        benefits: [
          'Live cash position with liquidity management',
          'Predictive cashflow analytics up to 18 months',
          'Scenario planning with probability weighting',
          'Working capital optimization recommendations',
          'Early warning systems for cash flow issues'
        ]
      },
      {
        title: 'Driver-Based Financial Planning',
        description: 'Sophisticated financial modeling based on operational drivers',
        benefits: [
          'Occupancy rate impact on revenue modeling',
          'Staff cost optimization with skill requirements',
          'NHS and LA funding prediction algorithms',
          'Seasonal variation analysis and planning',
          'Capital expenditure planning and ROI analysis'
        ]
      },
      {
        title: 'Built-In Financial Reporting & Analytics',
        description: 'Advanced financial analytics without external dependencies',
        benefits: [
          'Rolling 18-month forecasts with automatic updates',
          'Variance analysis with automated alerts',
          'Multi-scenario planning and stress testing',
          'Integrated spreadsheet system (no Excel needed)',
          'Real-time financial dashboard and KPIs'
        ]
      }
    ]
  },
  {
    id: 'financial-accounting',
    title: 'Complete Accounting & Reimbursement System',
    description: 'Full financial management with automated reimbursement processing',
    icon: DollarSign,
    color: 'from-emerald-500 to-green-600',
    features: [
      {
        title: 'Care Home Accounting System',
        description: 'Complete double-entry ledger system designed for care homes',
        benefits: [
          'Care home expense categorization and tracking',
          'Automated VAT calculations and HMRC compliance',
          'Chart of accounts optimized for care operations',
          'Financial transaction audit trails',
          'Budget management and variance analysis'
        ]
      },
      {
        title: 'Automated Reimbursement Processing',
        description: 'Intelligent reimbursement system for staff expenses and insurance claims',
        benefits: [
          'Automated expense approval workflows',
          'Insurance claim processing and tracking',
          'Government funding and LA payment management',
          'Staff expense reimbursement automation',
          'ROI tracking and financial analytics'
        ]
      },
      {
        title: 'Advanced Financial Analytics',
        description: 'Real-time financial reporting with predictive insights',
        benefits: [
          'Cash flow forecasting and management',
          'Profit & loss reporting with care home metrics',
          'Cost center analysis and optimization',
          'Revenue optimization recommendations',
          'Financial compliance monitoring'
        ]
      }
    ]
  },
  {
    id: 'rewards-recognition',
    title: 'Employee Rewards & Recognition System',
    description: 'Revolutionary staff motivation platform with ROI tracking',
    icon: Award,
    color: 'from-amber-500 to-orange-600',
    features: [
      {
        title: 'Performance-Based Rewards',
        description: 'Automated reward system based on care quality and performance metrics',
        benefits: [
          'Care quality milestone achievements',
          'Attendance and punctuality bonuses',
          'Training completion recognition',
          'Safety incident-free period awards',
          'Innovation and improvement contributions'
        ]
      },
      {
        title: 'Peer Recognition Program',
        description: 'Staff-nominated awards fostering team collaboration',
        benefits: [
          'Peer nomination system with structured criteria',
          'Team collaboration and support awards',
          'Exceptional care delivery recognition',
          'Mentorship and training excellence',
          'Family feedback-based recognition'
        ]
      },
      {
        title: 'ROI Analytics & Impact Tracking',
        description: 'Measure the return on investment of recognition programs',
        benefits: [
          'Staff retention rate improvement tracking',
          'Performance metrics correlation analysis',
          'Employee satisfaction impact measurement',
          'Cost-benefit analysis of reward programs',
          'Predictive insights for motivation strategies'
        ]
      }
    ]
  },
  {
    id: 'visitor-family',
    title: 'Advanced Visitor & Family Management',
    description: 'Digital visitor platform with security screening and family engagement',
    icon: Users,
    color: 'from-blue-500 to-indigo-600',
    features: [
      {
        title: 'Digital Visitor Registration & Screening',
        description: 'Advanced visitor management with automated security screening',
        benefits: [
          'Digital visitor registration and health screening',
          'Advanced security checks and background verification',
          'Real-time visitor tracking and badge management',
          'Automated visitor log and compliance reporting',
          'Integration with security systems and access control'
        ]
      },
      {
        title: 'Enhanced Family Communication Portal',
        description: 'Comprehensive family engagement platform with real-time updates',
        benefits: [
          'Family communication portal with real-time care updates',
          'Video calling and virtual visits integration',
          'Photo and video sharing with privacy controls',
          'Care plan access and family feedback collection',
          'Multi-language support including Welsh'
        ]
      },
      {
        title: 'Visitor Analytics & Pattern Recognition',
        description: 'Intelligent visitor analytics for enhanced security and care planning',
        benefits: [
          'Visitor pattern analysis and trend identification',
          'Family engagement metrics and insights',
          'Security incident prevention and risk assessment',
          'Visiting schedule optimization and planning',
          'Compliance monitoring and audit trail management'
        ]
      }
    ]
  },
  {
    id: 'quality-methodology',
    title: '5S Methodology & Quality Management',
    description: 'Workplace organization and continuous improvement with quality assurance',
    icon: Award,
    color: 'from-yellow-500 to-orange-600',
    features: [
      {
        title: '5S Workplace Organization System',
        description: 'Complete 5S implementation with tracking and continuous improvement',
        benefits: [
          'Sort, Set in Order, Shine, Standardize, Sustain tracking',
          'Workplace organization standards and auditing',
          'Visual management and workplace efficiency metrics',
          'Staff training and competency assessment',
          'Continuous improvement program management'
        ]
      },
      {
        title: 'Quality Assurance Integration',
        description: 'Comprehensive quality management with automated compliance tracking',
        benefits: [
          'Quality assurance integration with care standards',
          'Performance monitoring and improvement tracking',
          'Audit and compliance tracking across all services',
          'Root cause analysis and corrective action management',
          'Quality metrics dashboard and reporting'
        ]
      },
      {
        title: 'Continuous Improvement Programs',
        description: 'Data-driven improvement initiatives with staff engagement',
        benefits: [
          'Improvement initiative tracking and management',
          'Staff suggestion system and implementation tracking',
          'Performance benchmarking and best practice sharing',
          'Training and development program optimization',
          'Quality culture development and sustainability'
        ]
      }
    ]
  },
  {
    id: 'multi-jurisdiction',
    title: 'British Isles Multi-Jurisdiction Compliance',
    description: 'Complete compliance across all British Isles regulators',
    icon: Globe,
    color: 'from-green-500 to-emerald-600',
    features: [
      {
        title: 'All Regulatory Bodies Coverage',
        description: 'Comprehensive compliance for England, Scotland, Wales, Northern Ireland',
        benefits: [
          'CQC (England) compliance monitoring',
          'Care Inspectorate (Scotland) standards',
          'CIW (Wales) requirements including Welsh language',
          'RQIA (Northern Ireland) protocols',
          'Crown Dependencies support'
        ]
      },
      {
        title: 'Territory-Specific Templates',
        description: 'Customized compliance templates for each jurisdiction',
        benefits: [
          'Local authority integration',
          'Territory-specific forms and workflows',
          'Regional compliance reporting',
          'Language and cultural customization',
          'Local regulatory change tracking'
        ]
      },
      {
        title: 'Automated Compliance Monitoring',
        description: 'Proactive compliance tracking with predictive insights',
        benefits: [
          'Real-time compliance dashboard',
          'Predictive compliance risk assessment',
          'Automated evidence collection',
          'Inspection readiness scoring',
          'Continuous improvement recommendations'
        ]
      }
    ]
  },
  {
    id: 'communication-platform',
    title: 'WriteCareConnect Communication Platform',
    description: 'Revolutionary communication hub that transforms how families, staff, and healthcare professionals connect with your care home',
    icon: Building,
    color: 'from-blue-500 to-indigo-600',
    features: [
      {
        title: 'Enterprise Video Conferencing',
        description: 'Hospital-grade video calling that brings families closer to their loved ones while supporting medical consultations',
        benefits: [
          'Crystal-clear HD video calls that work on any device',
          'Secure medical consultations with automatic recording',
          'Multi-participant family meetings with up to 50 people',
          'Emergency communication protocols for urgent situations',
          'Fully encrypted and GDPR-compliant storage',
          'Integration with existing nurse call systems',
          'Automated scheduling with calendar sync'
        ]
      },
      {
        title: 'Secure Real-time Messaging',
        description: 'Enterprise-grade messaging designed specifically for care environments with military-level security',
        benefits: [
          'End-to-end encrypted messaging between all stakeholders',
          'Dedicated care team group chats with role-based access',
          'Priority messaging for urgent care situations',
          'Instant mobile notifications that never miss critical updates',
          'Complete message audit trails for all British Isles regulators',
          'File sharing for care documents and photos',
          'Read receipts and delivery confirmations'
        ]
      },
      {
        title: 'Universal Platform Integration',
        description: 'Seamlessly connects with Teams, Zoom, and other platforms your families already use',
        benefits: [
          'One-click family video visits through familiar platforms',
          'GP virtual consultations without software downloads',
          'External meeting scheduling with automatic invitations',
          'Screen sharing for collaborative care planning',
          'Automated session recordings for training and compliance',
          'Cross-platform compatibility ensuring everyone can join',
          'Branded experience maintaining your care home identity'
        ]
      },
      {
        title: 'Intelligent Consent Management',
        description: 'Revolutionary consent tracking that makes privacy protection effortless while ensuring full legal compliance',
        benefits: [
          'Granular consent controls for every type of communication',
          'GDPR Article 9 compliance with automated documentation',
          'Family member permission tracking with digital signatures',
          'Flexible data sharing authorization for different scenarios',
          'Automatic privacy preference enforcement across all systems',
          'One-click consent withdrawal with immediate effect',
          'Legal audit trail generation for regulatory inspections'
        ]
      }
    ]
  },
  {
    id: 'family-trust-engine',
    title: 'Family Trust & Transparency Engine',
    description: 'The secret to building unbreakable family trust through radical transparency and meaningful engagement',
    icon: Heart,
    color: 'from-amber-500 to-orange-600',
    features: [
      {
        title: 'Trust Intelligence System',
        description: 'AI-powered trust building that transforms family relationships and creates lasting confidence in your care',
        benefits: [
          'Real-time trust score monitoring with actionable insights',
          'Family satisfaction tracking with predictive analytics',
          'Automated relationship health assessments',
          'Personalized engagement recommendations for each family',
          'Early warning system for potential trust issues',
          'Competitive benchmarking against other care providers',
          'Trust recovery protocols for challenging situations'
        ]
      },
      {
        title: 'Live Transparency Portal',
        description: 'Netflix-style family portal that makes care visible, accessible, and engaging 24/7',
        benefits: [
          'Live care updates delivered instantly to family devices',
          'Beautiful photo and video sharing with privacy controls',
          'Interactive care plan progress with milestone celebrations',
          'Real-time meal and activity logs with nutritional insights',
          'Health status summaries in plain English',
          'Personalized family news feed with care highlights',
          'One-click communication with care team members'
        ]
      },
      {
        title: 'Communication Intelligence Analytics',
        description: 'Advanced analytics that reveal communication patterns and optimize family engagement strategies',
        benefits: [
          'Communication frequency analysis with optimal timing suggestions',
          'Response time monitoring with staff performance insights',
          'Sentiment analysis detecting family satisfaction trends',
          'Engagement pattern recognition for personalized outreach',
          'Satisfaction trend forecasting with proactive interventions',
          'Family preference learning for tailored communication styles',
          'Automated reporting for family meetings and reviews'
        ]
      }
    ]
  },
  {
    id: 'resident-voice-platform',
    title: 'Resident Voice & Empowerment Platform',
    description: 'Revolutionary platform that amplifies resident voices and transforms care through genuine person-centered approaches',
    icon: Users,
    color: 'from-purple-500 to-pink-600',
    features: [
      {
        title: 'Digital Voice Amplification',
        description: 'Cutting-edge technology that ensures every resident\'s voice is heard, valued, and acted upon',
        benefits: [
          'Anonymous feedback collection with multiple submission methods',
          'Voice recording and AI transcription in multiple languages',
          'Smart complaint tracking with automatic priority assignment',
          'Democratic suggestion box with resident voting systems',
          'Instant advocacy request submission with rapid response protocols',
          'Accessibility features for residents with communication challenges',
          'Real-time sentiment analysis of resident feedback'
        ]
      },
      {
        title: 'Professional Advocacy Coordination',
        description: 'Seamless advocacy management that ensures residents receive the support they deserve',
        benefits: [
          'Automatic independent advocate assignment based on case type',
          'Real-time case progress tracking with transparency for all parties',
          'Full legal requirement compliance with automated documentation',
          'Coordinated family involvement with consent management',
          'Comprehensive outcome measurement and impact reporting',
          'Integration with external advocacy services and legal representatives',
          'Escalation protocols for urgent advocacy needs'
        ]
      },
      {
        title: 'Wellbeing Intelligence System',
        description: 'AI-powered quality of life monitoring that creates personalized happiness and satisfaction insights',
        benefits: [
          'Regular quality of life surveys with trend analysis',
          'Personalized care preference learning and adaptation',
          'Activity participation tracking with engagement optimization',
          'Social interaction monitoring with loneliness prevention',
          'Happiness and wellbeing indicators with predictive analytics',
          'Automated care plan adjustments based on satisfaction data',
          'Family sharing of wellbeing insights with permission controls'
        ]
      }
    ]
  },
  {
    id: 'medication-safety',
    title: 'Complete Medication Management & eMAR System',
    description: 'Revolutionary digital medication management with electronic administration records, AI-powered safety intelligence, and zero-error administration protocols',
    icon: Shield,
    color: 'from-red-500 to-pink-600',
    features: [
      {
        title: 'Electronic Medication Administration Record (eMAR)',
        description: 'Paperless medication tracking with barcode scanning, digital signatures, and complete audit trails',
        benefits: [
          'Barcode scanning technology ensuring 100% medication accuracy',
          'Real-time administration logging with photo verification',
          'Digital signature capture for legal compliance and audit trails',
          'Intelligent missed dose alerts with escalation protocols',
          'Complete regulatory documentation for CQC, CIW, CIS, and RQIA',
          'Integration with GP prescribing systems and pharmacy networks',
          'Automated stock level monitoring and reordering based on consumption'
        ]
      },
      {
        title: 'AI-Powered Clinical Safety Intelligence',
        description: 'Advanced pharmaceutical intelligence providing real-time clinical guidance and error prevention',
        benefits: [
          'Real-time drug interaction alerts with severity ratings and alternatives',
          'Allergy and contraindication checking with alternative suggestions',
          'Intelligent dose adjustment recommendations based on resident factors',
          'Clinical decision support with evidence-based guidelines',
          'Automated pharmacy consultation integration for complex cases',
          'Predictive risk assessment for medication incidents',
          'Machine learning from near-miss patterns and safety improvements'
        ]
      },
      {
        title: 'Complete Prescription Lifecycle Management',
        description: 'End-to-end prescription automation from GP ordering to administration with full traceability',
        benefits: [
          'Direct GP practice integration for instant prescription updates',
          'Automated pharmacy ordering with delivery coordination and scheduling',
          'Smart inventory management with expiry date tracking and rotation',
          'Prescription review scheduling with clinical oversight and compliance',
          'Cost optimization through generic substitution analysis',
          'Automated repeat prescription management and renewal alerts',
          'Multi-pharmacy price comparison and real-time availability checking'
        ]
      },
      {
        title: 'Proactive Safety & Quality Assurance',
        description: 'Advanced incident prevention system that learns from data to prevent future medication errors',
        benefits: [
          'Near-miss incident logging with comprehensive trend analysis',
          'AI-powered root cause analysis with actionable recommendations',
          'Predictive risk identification before incidents occur',
          'Automated corrective action tracking with progress monitoring',
          'Learning and improvement cycles with staff training integration',
          'Benchmarking against industry safety standards and best practices',
          'Real-time safety score monitoring with continuous improvement suggestions'
        ]
      }
    ]
  },
  {
    id: 'british-isles-compliance',
    title: 'British Isles Regulatory Compliance',
    description: 'The only platform providing complete regulatory mastery across all British Isles territories - from England to Crown Dependencies',
    icon: Globe,
    color: 'from-green-500 to-emerald-600',
    features: [
      {
        title: 'CQC Excellence Automation',
        description: 'Revolutionary CQC compliance system that turns Outstanding ratings from aspiration into inevitability',
        benefits: [
          'Automated KLOEs evidence collection with real-time validation',
          'Continuous compliance monitoring with instant alerts',
          'Interactive inspection readiness dashboards with confidence scoring',
          'AI-powered quality improvement tracking with personalized recommendations',
          'Outstanding rating optimization with competitive benchmarking',
          'Automated evidence portfolio generation for inspections',
          'Real-time regulatory change notifications with impact assessments'
        ]
      },
      {
        title: 'NHS Digital Integration Excellence',
        description: 'Seamless NHS ecosystem integration that positions your care home at the forefront of digital healthcare',
        benefits: [
          'Complete Data Standards compliance (SNOMED, ICD-10, FHIR)',
          'Information Governance Toolkit automation with scoring optimization',
          'Digital Social Care Record standards with interoperability',
          'NHS Number verification with identity management',
          'Automated care record sharing with consent management',
          'Real-time GP practice integration with clinical decision support',
          'Future-ready digital health integration capabilities'
        ]
      },
      {
        title: 'Multi-Territory Mastery',
        description: 'Unmatched coverage ensuring compliance excellence across every corner of the British Isles',
        benefits: [
          'CIW Wales compliance automation with bilingual support',
          'Care Inspectorate Scotland integration with local requirements',
          'RQIA Northern Ireland standards with cross-border coordination',
          'Jersey Care Commission requirements with offshore compliance',
          'Guernsey Health & Social Care integration',
          'Isle of Man regulatory compliance with Crown Dependency expertise',
          'Automated multi-jurisdiction reporting with consolidated dashboards'
        ]
      },
      {
        title: 'Next-Generation Compliance Intelligence',
        description: 'Future-proof compliance automation that anticipates regulatory changes and ensures perpetual readiness',
        benefits: [
          'GDPR & Data Protection Act 2018 with automated privacy impact assessments',
          'Cyber Resilience Act compliance with advanced security monitoring',
          'DORA Financial regulation with operational resilience frameworks',
          'Brexit trade compliance with supply chain verification',
          'Environmental sustainability reporting with carbon footprint tracking',
          'AI governance compliance with algorithmic transparency',
          'Regulatory change prediction with proactive adaptation protocols'
        ]
      }
    ]
  },

  {
    id: 'hr-workforce-management',
    title: 'HR & Workforce Management Suite',
    description: 'Complete human resources automation covering recruitment, compliance, rewards, and workforce optimization',
    icon: Users,
    color: 'from-blue-500 to-indigo-600',
    features: [
      {
        title: 'DBS & Right to Work Verification',
        description: 'Automated background checking and compliance verification for all British Isles territories',
        benefits: [
          'Automated DBS check processing with real-time status updates',
          'Right to work verification with document scanning',
          'DVLA driving license verification for care roles',
          'Professional certification tracking and renewal alerts',
          'Immigration status monitoring with compliance alerts',
          'Criminal records checking with risk assessment',
          'Automated compliance reporting for regulatory inspections'
        ]
      },
      {
        title: 'Employee Rewards & Recognition',
        description: 'Innovative staff motivation platform that reduces turnover and increases satisfaction',
        benefits: [
          'Points-based reward system with instant gratification',
          'Performance-based bonus calculations with transparency',
          'Recognition badges and achievement tracking',
          'Peer-to-peer appreciation system with social features',
          'Long service awards with automated scheduling',
          'Team achievement celebrations with group rewards',
          'ROI tracking showing improved retention and satisfaction'
        ]
      },
      {
        title: 'Workforce Intelligence & Analytics',
        description: 'AI-powered workforce optimization that predicts and prevents staffing issues',
        benefits: [
          'Predictive analytics for staffing requirements',
          'Automated shift pattern optimization based on care needs',
          'Skill gap analysis with training recommendations',
          'Turnover prediction with early intervention strategies',
          'Overtime optimization with cost analysis',
          'Burnout prevention through workload monitoring',
          'Performance analytics with personalized development plans'
        ]
      }
    ]
  },
  {
    id: 'financial-management-accounting',
    title: 'Financial Management & Accounting',
    description: 'Enterprise-grade financial platform with HMRC integration, AI-powered analytics, and comprehensive accounting',
    icon: DollarSign,
    color: 'from-green-500 to-emerald-600',
    features: [
      {
        title: 'Enterprise Financial Planning',
        description: 'AI-powered financial forecasting and budget management with predictive analytics',
        benefits: [
          'AI-driven cashflow forecasting with 95% accuracy',
          'Automated budget creation based on occupancy trends',
          'Cost center analysis with profitability insights',
          'Fee optimization recommendations based on care complexity',
          'Investment planning with ROI calculations',
          'Risk assessment with scenario planning',
          'Financial performance benchmarking against industry standards'
        ]
      },
      {
        title: 'HMRC Payroll Integration',
        description: 'Fully automated payroll processing with real-time HMRC submission and compliance',
        benefits: [
          'Real-time HMRC payroll submissions with instant confirmation',
          'Automated tax calculations including IR35 compliance',
          'Pension auto-enrolment with provider integration',
          'Holiday pay calculations with statutory compliance',
          'Sick pay automation with SSP calculations',
          'P60 and P45 generation with electronic distribution',
          'Year-end processing with automated returns'
        ]
      },
      {
        title: 'Complete Accounting System',
        description: 'Full double-entry bookkeeping with automated reconciliation and reporting',
        benefits: [
          'Automated double-entry bookkeeping with real-time updates',
          'Bank reconciliation with AI-powered transaction matching',
          'Invoicing system with automated debt collection',
          'Expense management with receipt scanning and categorization',
          'VAT calculations with automated submissions',
          'Financial reporting with customizable dashboards',
          'Audit trail generation with compliance documentation'
        ]
      }
    ]
  },
  {
    id: 'care-planning-assessment',
    title: 'Care Planning & Assessment Engine',
    description: 'Intelligent care planning platform that creates personalized care pathways and tracks outcomes',
    icon: Heart,
    color: 'from-purple-500 to-pink-600',
    features: [
      {
        title: 'Intelligent Care Plan Creation',
        description: 'AI-powered care planning that adapts to individual needs and clinical best practices',
        benefits: [
          'AI-generated care plans based on assessment data',
          'Evidence-based intervention recommendations',
          'Goal setting with measurable outcomes tracking',
          'Risk assessment integration with mitigation strategies',
          'Care pathway optimization based on resident progress',
          'Multi-disciplinary team collaboration tools',
          'Family involvement planning with consent management'
        ]
      },
      {
        title: 'Comprehensive Assessment Tools',
        description: 'Digital assessment platform covering all aspects of resident care and wellbeing',
        benefits: [
          'Digital assessment forms with auto-completion',
          'Cognitive assessment tools with trend analysis',
          'Mobility and falls risk assessment with prevention planning',
          'Nutritional assessment with dietary planning integration',
          'Mental health screening with intervention protocols',
          'Social care assessment with activity planning',
          'Capacity assessment with legal compliance documentation'
        ]
      },
      {
        title: 'Care Intervention Management',
        description: 'Dynamic intervention tracking that ensures care plans are followed and outcomes achieved',
        benefits: [
          'Real-time intervention tracking with progress monitoring',
          'Care plan review scheduling with automated reminders',
          'Outcome measurement with statistical analysis',
          'Care effectiveness analysis with improvement recommendations',
          'Interdisciplinary team communication with care updates',
          'Regulatory compliance monitoring with evidence collection',
          'Family reporting with visual progress dashboards'
        ]
      }
    ]
  }
]

export const EnterpriseFeaturesPage: React.FC = () => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['ai-agents'])

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-4 rounded-full shadow-lg">
              <Bot className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
            Enterprise Care Home
            <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent block">
              Management System
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-10 leading-relaxed">
            Complete AI-powered care home management platform with regulatory compliance automation, 
            HMRC payroll integration, and comprehensive business operations. The all-in-one solution 
            for modern care home management across the British Isles.
          </p>
          
          {/* Platform Capabilities Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mb-12 text-sm">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-center space-x-2 text-blue-700">
                <Bot className="h-4 w-4" />
                <span className="font-medium">15+ AI Agents</span>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-center space-x-2 text-green-700">
                <Heart className="h-4 w-4" />
                <span className="font-medium">NHS Digital</span>
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-center space-x-2 text-purple-700">
                <Users className="h-4 w-4" />
                <span className="font-medium">HMRC Payroll</span>
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center justify-center space-x-2 text-orange-700">
                <Globe className="h-4 w-4" />
                <span className="font-medium">80+ Microservices</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/demo">
              <Button variant="care" size="lg" className="text-lg px-10 py-5 shadow-xl hover:shadow-2xl transition-all">
                <Bot className="h-6 w-6 mr-3" />
                Experience Live Platform Demo
              </Button>
            </Link>
            <Link to="/who-we-serve">
              <Button variant="outline" size="lg" className="text-lg px-10 py-5 border-2 hover:bg-gray-50">
                <Building className="h-6 w-6 mr-3" />
                Explore Care Home Solutions
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Categories */}
        <div className="space-y-8">
          {enterpriseFeatures.map((category) => {
            const IconComponent = category.icon
            const isExpanded = expandedCategories.includes(category.id)
            
            return (
              <div key={category.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Category Header */}
                <div 
                  className={`bg-gradient-to-r ${category.color} p-6 cursor-pointer`}
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-white/20 p-3 rounded-full">
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">{category.title}</h2>
                        <p className="text-white/90 mt-1">{category.description}</p>
                      </div>
                    </div>
                    <div className="text-white">
                      {isExpanded ? (
                        <ChevronUp className="h-6 w-6" />
                      ) : (
                        <ChevronDown className="h-6 w-6" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Category Content */}
                {isExpanded && (
                  <div className="p-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {category.features.map((feature, index) => (
                        <div key={index} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors">
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">
                            {feature.title}
                          </h3>
                          <p className="text-gray-600 mb-4">
                            {feature.description}
                          </p>
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Key Benefits:</h4>
                            {feature.benefits.map((benefit, benefitIndex) => (
                              <div key={benefitIndex} className="flex items-start space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-600">{benefit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Stats Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">The Most Comprehensive Care Home Platform Available</h2>
            <p className="text-gray-600">Complete British Isles regulatory compliance, intelligent communication platform, AI-powered care intelligence, family trust engine, resident empowerment, medication safety, NHS integration, HMRC payroll automation, advanced analytics, and enterprise security across all territories</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 lg:gap-6">
            <div className="text-center min-w-20 flex-shrink-0">
              <div className="text-lg font-bold text-violet-600 mb-1">15+</div>
              <div className="text-gray-600 text-xs">AI Agents</div>
            </div>
            <div className="text-center min-w-20 flex-shrink-0">
              <div className="text-lg font-bold text-emerald-600 mb-1">Live</div>
              <div className="text-gray-600 text-xs">Voice Tech</div>
            </div>
            <div className="text-center min-w-20 flex-shrink-0">
              <div className="text-lg font-bold text-blue-600 mb-1">NHS</div>
              <div className="text-gray-600 text-xs">Integration</div>
            </div>
            <div className="text-center min-w-20 flex-shrink-0">
              <div className="text-lg font-bold text-red-600 mb-1">24/7</div>
              <div className="text-gray-600 text-xs">On-Call</div>
            </div>
            <div className="text-center min-w-20 flex-shrink-0">
              <div className="text-lg font-bold text-cyan-600 mb-1">Family</div>
              <div className="text-gray-600 text-xs">Trust Engine</div>
            </div>
            <div className="text-center min-w-20 flex-shrink-0">
              <div className="text-lg font-bold text-purple-600 mb-1">DOLS</div>
              <div className="text-gray-600 text-xs">Compliant</div>
            </div>
            <div className="text-center min-w-20 flex-shrink-0">
              <div className="text-lg font-bold text-orange-600 mb-1">Video</div>
              <div className="text-gray-600 text-xs">Communication</div>
            </div>
            <div className="text-center min-w-20 flex-shrink-0">
              <div className="text-lg font-bold text-indigo-600 mb-1">HMRC</div>
              <div className="text-gray-600 text-xs">Payroll</div>
            </div>
            <div className="text-center min-w-20 flex-shrink-0">
              <div className="text-lg font-bold text-green-600 mb-1">AI</div>
              <div className="text-gray-600 text-xs">Cashflow</div>
            </div>
            <div className="text-center min-w-20 flex-shrink-0">
              <div className="text-lg font-bold text-emerald-600 mb-1">Full</div>
              <div className="text-gray-600 text-xs">Accounting</div>
            </div>
            <div className="text-center min-w-20 flex-shrink-0">
              <div className="text-lg font-bold text-amber-600 mb-1">ROI</div>
              <div className="text-gray-600 text-xs">Staff Rewards</div>
            </div>
            <div className="text-center min-w-20 flex-shrink-0">
              <div className="text-lg font-bold text-blue-600 mb-1">Digital</div>
              <div className="text-gray-600 text-xs">Visitor Mgmt</div>
            </div>
            <div className="text-center min-w-20 flex-shrink-0">
              <div className="text-lg font-bold text-green-600 mb-1">8</div>
              <div className="text-gray-600 text-xs">Territories</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Transform Your Care Home Operations Today</h2>
          <p className="text-white/90 mb-8 max-w-2xl mx-auto">
            Join care homes already using our AI-powered management system, HMRC-compliant payroll, 
            advanced financial planning, staff rewards program, and comprehensive regulatory compliance. 
            See how our 80+ microservices transform care home operations across the British Isles.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/demo">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                <Bot className="h-5 w-5 mr-2" />
                Try Platform Demo
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white text-violet-600 hover:bg-gray-100">
                <TrendingUp className="h-5 w-5 mr-2" />
                See Business Solutions
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnterpriseFeaturesPage