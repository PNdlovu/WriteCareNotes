import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Get existing categories and tags
  const categories = await knex('blog_categories').select('*');
  const tags = await knex('blog_tags').select('*');

  const healthcareCategory = categories.find(c => c.slug === 'healthcare-technology');
  const careCategory = categories.find(c => c.slug === 'care-management');
  const complianceCategory = categories.find(c => c.slug === 'regulatory-compliance');
  const digitalCategory = categories.find(c => c.slug === 'digital-health');
  const insightsCategory = categories.find(c => c.slug === 'industry-insights');

  // High-quality SEO articles
  const articles = [
    {
      id: knex.raw('gen_random_uuid()'),
      title: 'AI-Powered Care Planning: Revolutionizing Healthcare Management in 2025',
      slug: 'ai-powered-care-planning-healthcare-management-2025',
      excerpt: 'Discover how artificial intelligence is transforming care planning and improving patient outcomes across the British Isles healthcare system.',
      content: `
        <h2>The Evolution of Care Planning Technology</h2>
        <p>Artificial intelligence is fundamentally changing how healthcare professionals approach care planning. In 2025, AI-powered systems are enabling more personalized, efficient, and effective care delivery across the British Isles.</p>
        
        <h2>Key Benefits of AI in Care Planning</h2>
        <h3>1. Predictive Analytics for Better Outcomes</h3>
        <p>AI algorithms analyze patient data to predict potential health risks, enabling proactive interventions that prevent complications and improve quality of life.</p>
        
        <h3>2. Automated Documentation and Compliance</h3>
        <p>Smart documentation systems reduce administrative burden while ensuring CQC compliance and maintaining comprehensive audit trails.</p>
        
        <h3>3. Personalized Care Recommendations</h3>
        <p>Machine learning models provide evidence-based care suggestions tailored to individual patient needs and medical histories.</p>
        
        <h2>Implementation Across Care Settings</h2>
        <p>From residential care homes to domiciliary care services, AI-powered platforms like WriteCareNotes are streamlining operations while improving care quality.</p>
        
        <h2>Regulatory Compliance and Data Security</h2>
        <p>Modern AI systems ensure full GDPR compliance and meet NHS Digital standards, providing healthcare providers with confidence in their technology choices.</p>
        
        <h2>Future Outlook</h2>
        <p>As AI technology continues to advance, we can expect even more sophisticated care planning tools that further enhance patient care and operational efficiency.</p>
      `,
      featuredImage: '/images/blog/ai-care-planning.jpg',
      metaTitle: 'AI-Powered Care Planning 2025 | Healthcare Management Technology',
      metaDescription: 'Explore how AI is revolutionizing care planning in healthcare. Learn about predictive analytics, automated compliance, and personalized care recommendations.',
      metaKeywords: ['AI care planning', 'healthcare technology', 'predictive analytics', 'care management software', 'NHS compliance'],
      status: 'published',
      featured: true,
      readTime: 7,
      publishedAt: new Date(),
      authorName: 'Dr. Emily Richardson',
      authorEmail: 'emily.richardson@writecarenotes.com'
    },
    {
      id: knex.raw('gen_random_uuid()'),
      title: 'NHS Digital Integration: Complete Guide for Care Providers',
      slug: 'nhs-digital-integration-guide-care-providers',
      excerpt: 'Essential guide to NHS Digital integration for care homes and domiciliary care providers. Ensure compliance and improve patient care coordination.',
      content: `
        <h2>Understanding NHS Digital Requirements</h2>
        <p>NHS Digital integration is essential for modern healthcare providers. This comprehensive guide covers everything you need to know about connecting your care management system with NHS services.</p>
        
        <h2>Key Integration Points</h2>
        <h3>NHS Spine Integration</h3>
        <p>Connect to the NHS Spine for patient demographics, allergies, and medication information. This ensures accurate, up-to-date patient data across all care settings.</p>
        
        <h3>Electronic Prescribing Service (EPS)</h3>
        <p>Integrate with EPS to receive electronic prescriptions directly from GPs, reducing errors and improving medication management efficiency.</p>
        
        <h3>Summary Care Record (SCR)</h3>
        <p>Access patient summary care records to provide informed care decisions and reduce duplicate testing or procedures.</p>
        
        <h2>Implementation Best Practices</h2>
        <ul>
          <li>Ensure robust data security measures</li>
          <li>Implement proper staff training protocols</li>
          <li>Maintain audit trails for all NHS data access</li>
          <li>Regular compliance monitoring and reporting</li>
        </ul>
        
        <h2>Benefits for Care Providers</h2>
        <p>NHS Digital integration reduces administrative burden, improves care quality, and ensures regulatory compliance across all British Isles jurisdictions.</p>
        
        <h2>Choosing the Right Technology Partner</h2>
        <p>Select a healthcare management platform that offers native NHS Digital integration with proven compliance track record.</p>
      `,
      featuredImage: '/images/blog/nhs-digital-integration.jpg',
      metaTitle: 'NHS Digital Integration Guide | Care Provider Compliance 2025',
      metaDescription: 'Complete guide to NHS Digital integration for care providers. Learn about Spine integration, EPS, SCR, and compliance requirements.',
      metaKeywords: ['NHS Digital integration', 'care provider compliance', 'NHS Spine', 'electronic prescribing', 'healthcare interoperability'],
      status: 'published',
      featured: true,
      readTime: 9,
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      authorName: 'Michael Davies',
      authorEmail: 'michael.davies@writecarenotes.com'
    },
    {
      id: knex.raw('gen_random_uuid()'),
      title: 'Medication Management Excellence: Best Practices for Care Homes',
      slug: 'medication-management-best-practices-care-homes',
      excerpt: 'Comprehensive guide to medication management best practices, ensuring safety, compliance, and optimal patient outcomes in care settings.',
      content: `
        <h2>The Importance of Robust Medication Management</h2>
        <p>Effective medication management is critical for patient safety and regulatory compliance. This guide outlines best practices for care homes across the British Isles.</p>
        
        <h2>Core Principles of Safe Medication Management</h2>
        <h3>The Five Rights of Medication Administration</h3>
        <ul>
          <li>Right patient</li>
          <li>Right medication</li>
          <li>Right dose</li>
          <li>Right route</li>
          <li>Right time</li>
        </ul>
        
        <h3>Documentation and Record Keeping</h3>
        <p>Maintain comprehensive medication administration records (MARs) with electronic systems that provide audit trails and error prevention.</p>
        
        <h2>Technology Solutions for Medication Safety</h2>
        <p>Modern medication management systems offer barcode scanning, automated alerts, and integration with pharmacy systems to reduce errors.</p>
        
        <h2>Controlled Substances Management</h2>
        <p>Special protocols for controlled substances including secure storage, dual verification, and detailed tracking requirements.</p>
        
        <h2>Staff Training and Competency</h2>
        <p>Regular training programs ensure staff competency in medication administration and understanding of legal requirements.</p>
        
        <h2>Regulatory Compliance</h2>
        <p>Meet CQC, MHRA, and local authority requirements through systematic approaches to medication management and regular audits.</p>
        
        <h2>Quality Improvement</h2>
        <p>Continuous monitoring and improvement of medication management processes to enhance patient safety and care quality.</p>
      `,
      featuredImage: '/images/blog/medication-management.jpg',
      metaTitle: 'Medication Management Best Practices | Care Home Safety Guide',
      metaDescription: 'Learn medication management best practices for care homes. Ensure safety, compliance, and optimal outcomes with expert guidance.',
      metaKeywords: ['medication management', 'care home safety', 'pharmaceutical care', 'CQC compliance', 'controlled substances'],
      status: 'published',
      featured: false,
      readTime: 8,
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      authorName: 'Sarah Phillips',
      authorEmail: 'sarah.phillips@writecarenotes.com'
    },
    {
      id: knex.raw('gen_random_uuid()'),
      title: 'CQC Inspection Preparation: Your Complete Checklist for 2025',
      slug: 'cqc-inspection-preparation-checklist-2025',
      excerpt: 'Comprehensive checklist for CQC inspection preparation. Ensure your care home is ready with our expert guidance and proven strategies.',
      content: `
        <h2>Understanding CQC Inspection Framework</h2>
        <p>The Care Quality Commission evaluates care providers against five key questions. This guide helps you prepare for inspections with confidence.</p>
        
        <h2>The Five Key Questions</h2>
        <h3>1. Are services safe?</h3>
        <ul>
          <li>Safeguarding procedures and training</li>
          <li>Risk assessments and management</li>
          <li>Infection prevention and control</li>
          <li>Medication safety protocols</li>
        </ul>
        
        <h3>2. Are services effective?</h3>
        <ul>
          <li>Evidence-based care delivery</li>
          <li>Staff competency and training</li>
          <li>Monitoring and improving outcomes</li>
          <li>Working with other organizations</li>
        </ul>
        
        <h3>3. Are services caring?</h3>
        <ul>
          <li>Dignity and respect in care delivery</li>
          <li>Person-centered care approaches</li>
          <li>Emotional support and wellbeing</li>
          <li>End of life care</li>
        </ul>
        
        <h3>4. Are services responsive?</h3>
        <ul>
          <li>Meeting individual needs</li>
          <li>Complaints handling procedures</li>
          <li>Accessible services</li>
          <li>Choice and control for service users</li>
        </ul>
        
        <h3>5. Are services well-led?</h3>
        <ul>
          <li>Leadership and management</li>
          <li>Governance and accountability</li>
          <li>Quality assurance systems</li>
          <li>Continuous improvement culture</li>
        </ul>
        
        <h2>Technology's Role in CQC Readiness</h2>
        <p>Modern care management systems provide the documentation, monitoring, and reporting capabilities essential for CQC compliance.</p>
        
        <h2>Pre-Inspection Checklist</h2>
        <p>Use our comprehensive checklist to ensure all documentation, policies, and procedures are current and accessible for inspection.</p>
      `,
      featuredImage: '/images/blog/cqc-inspection-preparation.jpg',
      metaTitle: 'CQC Inspection Preparation Checklist 2025 | Care Home Compliance',
      metaDescription: 'Complete CQC inspection preparation guide. Get ready for your inspection with our expert checklist and compliance strategies.',
      metaKeywords: ['CQC inspection', 'care home compliance', 'CQC preparation', 'care quality commission', 'healthcare inspection'],
      status: 'published',
      featured: true,
      readTime: 10,
      publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      authorName: 'David Wilson',
      authorEmail: 'david.wilson@writecarenotes.com'
    },
    {
      id: knex.raw('gen_random_uuid()'),
      title: 'Digital Transformation in Healthcare: Trends and Opportunities',
      slug: 'digital-transformation-healthcare-trends-opportunities',
      excerpt: 'Explore the latest digital transformation trends in healthcare and how they create opportunities for improved patient care and operational efficiency.',
      content: `
        <h2>The Digital Healthcare Revolution</h2>
        <p>Digital transformation is reshaping healthcare delivery across the British Isles. This comprehensive analysis explores current trends and future opportunities.</p>
        
        <h2>Key Digital Transformation Trends</h2>
        <h3>Cloud-Based Healthcare Systems</h3>
        <p>Migration to cloud platforms enables scalability, cost reduction, and improved accessibility for healthcare data and applications.</p>
        
        <h3>Internet of Medical Things (IoMT)</h3>
        <p>Connected devices and sensors provide real-time health monitoring and data collection, enabling proactive care interventions.</p>
        
        <h3>Telehealth and Remote Care</h3>
        <p>Virtual consultations and remote monitoring expand access to healthcare services and reduce unnecessary hospital visits.</p>
        
        <h2>Opportunities for Care Providers</h2>
        <h3>Enhanced Patient Engagement</h3>
        <p>Digital tools enable better communication between patients, families, and care teams, improving satisfaction and outcomes.</p>
        
        <h3>Operational Efficiency</h3>
        <p>Automation of routine tasks allows care staff to focus more time on direct patient care and relationship building.</p>
        
        <h3>Data-Driven Decision Making</h3>
        <p>Analytics platforms provide insights into care quality, resource utilization, and operational performance.</p>
        
        <h2>Overcoming Digital Transformation Challenges</h2>
        <p>Address common challenges including staff training, data migration, and change management with proven strategies.</p>
        
        <h2>Regulatory Considerations</h2>
        <p>Ensure digital transformation initiatives comply with GDPR, NHS Digital standards, and local regulatory requirements.</p>
        
        <h2>Choosing the Right Technology Partner</h2>
        <p>Select technology solutions that align with your organization's goals and provide comprehensive support throughout the transformation journey.</p>
      `,
      featuredImage: '/images/blog/digital-transformation-healthcare.jpg',
      metaTitle: 'Digital Transformation in Healthcare 2025 | Technology Trends & Opportunities',
      metaDescription: 'Comprehensive guide to digital transformation in healthcare. Explore trends, opportunities, and strategies for successful technology adoption.',
      metaKeywords: ['digital transformation', 'healthcare technology', 'IoMT', 'telehealth', 'cloud healthcare', 'healthcare innovation'],
      status: 'published',
      featured: false,
      readTime: 8,
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      authorName: 'Dr. Rachel Green',
      authorEmail: 'rachel.green@writecarenotes.com'
    },
    {
      id: knex.raw('gen_random_uuid()'),
      title: 'GDPR Compliance in Healthcare: Essential Guide for 2025',
      slug: 'gdpr-compliance-healthcare-essential-guide-2025',
      excerpt: 'Navigate GDPR compliance in healthcare with confidence. Essential guidance for care providers on data protection and privacy requirements.',
      content: `
        <h2>GDPR in Healthcare Context</h2>
        <p>The General Data Protection Regulation (GDPR) has specific implications for healthcare providers. Understanding these requirements is crucial for legal compliance and patient trust.</p>
        
        <h2>Key GDPR Principles for Healthcare</h2>
        <h3>Lawful Basis for Processing</h3>
        <p>Healthcare providers must establish clear lawful bases for processing personal data, typically vital interests or legitimate interests for care delivery.</p>
        
        <h3>Data Minimization</h3>
        <p>Collect and process only the personal data necessary for specific care purposes, avoiding excessive data collection.</p>
        
        <h3>Purpose Limitation</h3>
        <p>Use patient data only for the purposes it was collected, with clear consent for any additional uses.</p>
        
        <h2>Special Category Data in Healthcare</h2>
        <p>Health data receives special protection under GDPR, requiring additional safeguards and explicit consent or other lawful basis.</p>
        
        <h2>Patient Rights Under GDPR</h2>
        <ul>
          <li>Right to information about data processing</li>
          <li>Right of access to personal data</li>
          <li>Right to rectification of inaccurate data</li>
          <li>Right to erasure (with healthcare exceptions)</li>
          <li>Right to data portability</li>
        </ul>
        
        <h2>Technical and Organizational Measures</h2>
        <p>Implement appropriate security measures including encryption, access controls, and staff training to protect patient data.</p>
        
        <h2>Data Breach Response</h2>
        <p>Establish clear procedures for identifying, reporting, and responding to data breaches within the required 72-hour timeframe.</p>
        
        <h2>Technology Solutions for GDPR Compliance</h2>
        <p>Modern healthcare management platforms provide built-in GDPR compliance features including data encryption, audit trails, and consent management.</p>
      `,
      featuredImage: '/images/blog/gdpr-compliance-healthcare.jpg',
      metaTitle: 'GDPR Compliance in Healthcare 2025 | Data Protection Guide',
      metaDescription: 'Essential GDPR compliance guide for healthcare providers. Learn about data protection requirements, patient rights, and best practices.',
      metaKeywords: ['GDPR compliance', 'healthcare data protection', 'patient privacy', 'data security', 'healthcare regulations'],
      status: 'published',
      featured: false,
      readTime: 9,
      publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      authorName: 'Lisa Thompson',
      authorEmail: 'lisa.thompson@writecarenotes.com'
    },
    {
      id: knex.raw('gen_random_uuid()'),
      title: 'Domiciliary Care Technology: Enhancing Home-Based Healthcare',
      slug: 'domiciliary-care-technology-home-based-healthcare',
      excerpt: 'Discover how technology is transforming domiciliary care services, improving patient outcomes and operational efficiency in home-based healthcare.',
      content: `
        <h2>The Future of Home-Based Care</h2>
        <p>Domiciliary care services are increasingly important in healthcare delivery. Technology plays a crucial role in ensuring quality care in home settings.</p>
        
        <h2>Mobile Care Management Solutions</h2>
        <h3>Real-Time Care Documentation</h3>
        <p>Mobile applications enable care workers to document visits, medication administration, and care observations in real-time.</p>
        
        <h3>GPS Tracking and Visit Verification</h3>
        <p>Ensure visit compliance and provide family reassurance through GPS-enabled visit tracking and verification systems.</p>
        
        <h3>Offline Capability</h3>
        <p>Robust offline functionality ensures care documentation continues even in areas with poor connectivity.</p>
        
        <h2>Remote Monitoring Technologies</h2>
        <h3>Wearable Health Devices</h3>
        <p>Integration with wearable devices provides continuous health monitoring and early warning systems for health changes.</p>
        
        <h3>Smart Home Integration</h3>
        <p>Connected home devices can monitor daily activities, medication adherence, and environmental safety.</p>
        
        <h2>Family Engagement and Communication</h2>
        <p>Digital platforms enable better communication between care teams, patients, and families, providing transparency and peace of mind.</p>
        
        <h2>Regulatory Compliance in Domiciliary Care</h2>
        <p>Technology solutions help meet CQC requirements for domiciliary care services while maintaining comprehensive audit trails.</p>
        
        <h2>Implementing Technology in Domiciliary Services</h2>
        <p>Best practices for technology adoption including staff training, change management, and gradual implementation strategies.</p>
        
        <h2>ROI and Business Benefits</h2>
        <p>Technology investment in domiciliary care delivers measurable returns through improved efficiency, reduced travel time, and enhanced care quality.</p>
      `,
      featuredImage: '/images/blog/domiciliary-care-technology.jpg',
      metaTitle: 'Domiciliary Care Technology 2025 | Home Healthcare Innovation',
      metaDescription: 'Explore how technology is enhancing domiciliary care services. Learn about mobile solutions, remote monitoring, and compliance tools.',
      metaKeywords: ['domiciliary care technology', 'home healthcare', 'mobile care solutions', 'remote monitoring', 'care management'],
      status: 'published',
      featured: false,
      readTime: 7,
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      authorName: 'James Mitchell',
      authorEmail: 'james.mitchell@writecarenotes.com'
    }
    // I'll continue with more articles in the next part due to length constraints
  ];

  // Insert the first batch of articles
  await knex('blog_posts').insert(articles);

  // Create associations for the first articles
  const insertedPosts = await knex('blog_posts')
    .whereIn('slug', articles.map(a => a.slug))
    .select('id', 'slug');

  // Associate articles with categories and tags
  const associations = [];
  const tagAssociations = [];

  insertedPosts.forEach((post, index) => {
    const article = articles[index];
    
    // Category associations
    if (index === 0 && healthcareCategory) { // AI article
      associations.push({ post_id: post.id, category_id: healthcareCategory.id });
      associations.push({ post_id: post.id, category_id: digitalCategory?.id });
    } else if (index === 1 && complianceCategory) { // NHS integration
      associations.push({ post_id: post.id, category_id: complianceCategory.id });
      associations.push({ post_id: post.id, category_id: healthcareCategory?.id });
    } else if (index === 2 && careCategory) { // Medication management
      associations.push({ post_id: post.id, category_id: careCategory.id });
      associations.push({ post_id: post.id, category_id: complianceCategory?.id });
    } else if (index === 3 && careCategory) { // Domiciliary care
      associations.push({ post_id: post.id, category_id: careCategory.id });
      associations.push({ post_id: post.id, category_id: healthcareCategory?.id });
    }

    // Tag associations
    const aiTag = tags.find(t => t.slug === 'ai');
    const nhsTag = tags.find(t => t.slug === 'nhs-integration');
    const medicationTag = tags.find(t => t.slug === 'medication-management');
    const cqcTag = tags.find(t => t.slug === 'cqc-compliance');
    const digitalTag = tags.find(t => t.slug === 'digital-transformation');

    if (index === 0 && aiTag) {
      tagAssociations.push({ post_id: post.id, tag_id: aiTag.id });
      if (digitalTag) tagAssociations.push({ post_id: post.id, tag_id: digitalTag.id });
    } else if (index === 1 && nhsTag) {
      tagAssociations.push({ post_id: post.id, tag_id: nhsTag.id });
      if (cqcTag) tagAssociations.push({ post_id: post.id, tag_id: cqcTag.id });
    } else if (index === 2 && medicationTag) {
      tagAssociations.push({ post_id: post.id, tag_id: medicationTag.id });
      if (cqcTag) tagAssociations.push({ post_id: post.id, tag_id: cqcTag.id });
    }
  });

  // Insert associations
  if (associations.length > 0) {
    await knex('blog_post_categories').insert(associations);
  }
  if (tagAssociations.length > 0) {
    await knex('blog_post_tags').insert(tagAssociations);
  }

  console.log('Blog articles seed data (batch 1) inserted successfully');
}