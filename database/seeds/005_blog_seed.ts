import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data
  await knex('blog_post_tags').del();
  await knex('blog_post_categories').del();
  await knex('blog_comments').del();
  await knex('blog_posts').del();
  await knex('blog_tags').del();
  await knex('blog_categories').del();

  // Insert blog categories
  const categories = await knex('blog_categories').insert([
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Healthcare Technology',
      slug: 'healthcare-technology',
      description: 'Latest trends and innovations in healthcare technology',
      color: '#3B82F6',
      sortOrder: 1
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Care Management',
      slug: 'care-management',
      description: 'Best practices for managing care homes and domiciliary care',
      color: '#10B981',
      sortOrder: 2
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Regulatory Compliance',
      slug: 'regulatory-compliance',
      description: 'Updates on healthcare regulations and compliance requirements',
      color: '#F59E0B',
      sortOrder: 3
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Digital Health',
      slug: 'digital-health',
      description: 'Digital transformation in healthcare and care services',
      color: '#8B5CF6',
      sortOrder: 4
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Industry Insights',
      slug: 'industry-insights',
      description: 'Expert insights and analysis of the healthcare industry',
      color: '#EF4444',
      sortOrder: 5
    }
  ]).returning('*');

  // Insert blog tags
  const tags = await knex('blog_tags').insert([
    { id: knex.raw('gen_random_uuid()'), name: 'AI', slug: 'ai', color: '#3B82F6' },
    { id: knex.raw('gen_random_uuid()'), name: 'Machine Learning', slug: 'machine-learning', color: '#10B981' },
    { id: knex.raw('gen_random_uuid()'), name: 'NHS Integration', slug: 'nhs-integration', color: '#F59E0B' },
    { id: knex.raw('gen_random_uuid()'), name: 'GDPR', slug: 'gdpr', color: '#8B5CF6' },
    { id: knex.raw('gen_random_uuid()'), name: 'CQC Compliance', slug: 'cqc-compliance', color: '#EF4444' },
    { id: knex.raw('gen_random_uuid()'), name: 'Medication Management', slug: 'medication-management', color: '#06B6D4' },
    { id: knex.raw('gen_random_uuid()'), name: 'Care Planning', slug: 'care-planning', color: '#84CC16' },
    { id: knex.raw('gen_random_uuid()'), name: 'Digital Transformation', slug: 'digital-transformation', color: '#EC4899' },
    { id: knex.raw('gen_random_uuid()'), name: 'Healthcare Software', slug: 'healthcare-software', color: '#6B7280' },
    { id: knex.raw('gen_random_uuid()'), name: 'Care Home Management', slug: 'care-home-management', color: '#F97316' }
  ]).returning('*');

  // Insert sample blog posts
  const samplePosts = [
    {
      id: knex.raw('gen_random_uuid()'),
      title: 'The Future of Healthcare Technology in 2025',
      slug: 'future-healthcare-technology-2025',
      excerpt: 'Explore the cutting-edge technologies that will transform healthcare delivery in 2025 and beyond.',
      content: `
        <h2>Introduction</h2>
        <p>Healthcare technology is evolving at an unprecedented pace. As we move into 2025, several key technologies are set to revolutionize how we deliver care, manage patient data, and ensure regulatory compliance.</p>
        
        <h2>Artificial Intelligence in Healthcare</h2>
        <p>AI is transforming healthcare delivery through predictive analytics, automated care planning, and intelligent monitoring systems. Our WriteCareNotes platform leverages AI to provide intelligent care suggestions and automate routine documentation tasks.</p>
        
        <h2>Integration with NHS Systems</h2>
        <p>Seamless integration with NHS Digital services is becoming essential for healthcare providers. Our platform ensures full compliance with NHS standards while providing real-time data synchronization.</p>
        
        <h2>Regulatory Compliance Automation</h2>
        <p>Automated compliance monitoring helps care providers stay ahead of regulatory requirements, reducing manual oversight and ensuring consistent quality of care.</p>
        
        <h2>Conclusion</h2>
        <p>The future of healthcare technology lies in intelligent, integrated systems that prioritize both efficiency and patient care quality. WriteCareNotes is at the forefront of this transformation.</p>
      `,
      featuredImage: '/images/blog/healthcare-technology-2025.jpg',
      metaTitle: 'Future of Healthcare Technology 2025 | WriteCareNotes',
      metaDescription: 'Discover the latest healthcare technology trends for 2025. Learn about AI, NHS integration, and compliance automation in healthcare.',
      metaKeywords: ['healthcare technology', 'AI in healthcare', 'NHS integration', 'care management software'],
      status: 'published',
      featured: true,
      viewCount: 0,
      readTime: 5,
      publishedAt: new Date(),
      authorName: 'Dr. Sarah Mitchell',
      authorEmail: 'sarah.mitchell@writecarenotes.com'
    },
    {
      id: knex.raw('gen_random_uuid()'),
      title: 'CQC Compliance Made Simple: A Complete Guide',
      slug: 'cqc-compliance-complete-guide',
      excerpt: 'Everything you need to know about CQC compliance for care homes and domiciliary care providers.',
      content: `
        <h2>Understanding CQC Requirements</h2>
        <p>The Care Quality Commission (CQC) sets the standards for health and social care in England. Understanding these requirements is crucial for all care providers.</p>
        
        <h2>Key Areas of Compliance</h2>
        <ul>
          <li>Safe care delivery</li>
          <li>Effective treatment and care</li>
          <li>Caring and compassionate staff</li>
          <li>Responsive services</li>
          <li>Well-led organizations</li>
        </ul>
        
        <h2>How WriteCareNotes Helps</h2>
        <p>Our platform automates compliance monitoring, provides real-time alerts, and generates comprehensive reports for CQC inspections.</p>
        
        <h2>Best Practices</h2>
        <p>Regular training, continuous monitoring, and proper documentation are essential for maintaining CQC compliance. Our system helps streamline all these processes.</p>
      `,
      featuredImage: '/images/blog/cqc-compliance-guide.jpg',
      metaTitle: 'CQC Compliance Guide 2025 | Care Home Regulations',
      metaDescription: 'Complete guide to CQC compliance for care homes. Learn about requirements, best practices, and how technology can help.',
      metaKeywords: ['CQC compliance', 'care home regulations', 'healthcare compliance', 'care quality commission'],
      status: 'published',
      featured: false,
      viewCount: 0,
      readTime: 8,
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      authorName: 'James Thompson',
      authorEmail: 'james.thompson@writecarenotes.com'
    }
  ];

  const insertedPosts = await knex('blog_posts').insert(samplePosts).returning('*');

  // Create some sample associations
  if (categories.length > 0 && tags.length > 0 && insertedPosts.length > 0) {
    // Associate first post with Healthcare Technology category and relevant tags
    await knex('blog_post_categories').insert([
      { post_id: insertedPosts[0].id, category_id: categories[0].id },
      { post_id: insertedPosts[0].id, category_id: categories[3].id } // Digital Health
    ]);

    await knex('blog_post_tags').insert([
      { post_id: insertedPosts[0].id, tag_id: tags[0].id }, // AI
      { post_id: insertedPosts[0].id, tag_id: tags[2].id }, // NHS Integration
      { post_id: insertedPosts[0].id, tag_id: tags[7].id }  // Digital Transformation
    ]);

    // Associate second post with Regulatory Compliance category and relevant tags
    if (insertedPosts.length > 1) {
      await knex('blog_post_categories').insert([
        { post_id: insertedPosts[1].id, category_id: categories[2].id } // Regulatory Compliance
      ]);

      await knex('blog_post_tags').insert([
        { post_id: insertedPosts[1].id, tag_id: tags[4].id }, // CQC Compliance
        { post_id: insertedPosts[1].id, tag_id: tags[3].id }  // GDPR
      ]);
    }
  }

  console.log('Blog seed data inserted successfully');
}