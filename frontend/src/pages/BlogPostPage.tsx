import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { 
  Calendar, 
  Clock, 
  User, 
  ArrowLeft,
  Share2,
  BookOpen,
  Tag,
  Heart,
  MessageCircle,
  ArrowRight,
  CheckCircle,
  Star
} from 'lucide-react'

// Sample blog post data - in a real app this would come from an API
const blogPosts = {
  '1': {
    id: 1,
    title: "How to Achieve Outstanding CQC Ratings in 2024: A Complete Guide",
    content: `
      <div class="prose prose-lg max-w-none">
        <p class="text-xl text-gray-600 mb-8">Learn the proven strategies that helped over 200 care homes improve their CQC ratings with WriteCareNotes. From documentation to staff training, discover what CQC inspectors really look for.</p>
        
        <h2>Understanding the CQC Framework</h2>
        <p>The Care Quality Commission (CQC) assesses care homes against five key domains: Safe, Effective, Caring, Responsive, and Well-led. Each domain requires specific evidence and documentation to achieve an Outstanding rating.</p>
        
        <h3>1. Safe Domain - Protecting People from Harm</h3>
        <p>The Safe domain focuses on:</p>
        <ul>
          <li>Safeguarding procedures and incident management</li>
          <li>Medication management and administration</li>
          <li>Infection prevention and control</li>
          <li>Risk assessments and environmental safety</li>
        </ul>
        
        <h3>2. Effective Domain - Achieving Good Outcomes</h3>
        <p>For the Effective domain, CQC inspectors look for:</p>
        <ul>
          <li>Evidence-based care and treatment</li>
          <li>Staff competency and training records</li>
          <li>Multidisciplinary working and referrals</li>
          <li>Mental Capacity Act compliance</li>
        </ul>
        
        <h2>Key Documentation Requirements</h2>
        <p>Outstanding care homes maintain comprehensive documentation including:</p>
        
        <h3>Care Planning and Reviews</h3>
        <p>Detailed, person-centered care plans that are regularly reviewed and updated based on changing needs.</p>
        
        <h3>Staff Training Matrix</h3>
        <p>Complete records of all mandatory and additional training, with clear renewal dates and competency assessments.</p>
        
        <h3>Quality Monitoring</h3>
        <p>Regular audits, surveys, and quality improvement initiatives with documented outcomes and action plans.</p>
        
        <h2>Best Practices for Outstanding Ratings</h2>
        <p>Based on our analysis of Outstanding-rated care homes, here are the key success factors:</p>
        
        <ol>
          <li><strong>Person-centered approach:</strong> Every aspect of care is tailored to individual needs and preferences</li>
          <li><strong>Continuous improvement culture:</strong> Regular feedback loops and improvement initiatives</li>
          <li><strong>Strong leadership:</strong> Clear vision, effective communication, and staff empowerment</li>
          <li><strong>Robust systems:</strong> Digital platforms that ensure consistency and compliance</li>
        </ol>
        
        <h2>Using Technology for CQC Excellence</h2>
        <p>WriteCareNotes helps care homes achieve Outstanding ratings through:</p>
        
        <ul>
          <li>Automated compliance monitoring and alerts</li>
          <li>Comprehensive audit trails for all care activities</li>
          <li>Real-time reporting and analytics</li>
          <li>Staff training management and tracking</li>
          <li>Quality assurance workflows and checks</li>
        </ul>
        
        <h2>Conclusion</h2>
        <p>Achieving an Outstanding CQC rating requires dedication, the right systems, and a commitment to continuous improvement. With proper planning and the right technology support, any care home can reach this level of excellence.</p>
        
        <p><strong>Ready to improve your CQC rating?</strong> Contact our compliance experts to learn how WriteCareNotes can support your journey to Outstanding.</p>
      </div>
    `,
    excerpt: "Learn the proven strategies that helped over 200 care homes improve their CQC ratings with WriteCareNotes. From documentation to staff training, discover what CQC inspectors really look for.",
    author: "Dr. Sarah Mitchell",
    authorRole: "CQC Compliance Expert",
    authorBio: "Dr. Sarah Mitchell has over 15 years of experience in care home compliance and has helped hundreds of care homes achieve Outstanding CQC ratings.",
    category: "CQC Compliance",
    publishDate: "2024-03-15",
    readTime: "8 min read",
    image: "/images/blog/cqc-outstanding.jpg",
    tags: ["CQC", "Outstanding Rating", "Compliance", "Best Practices"]
  },
  '2': {
    id: 2,
    title: "Digital Transformation in Care: 5 Essential Steps for Success",
    content: `
      <div class="prose prose-lg max-w-none">
        <p class="text-xl text-gray-600 mb-8">A practical roadmap for care homes transitioning from paper-based systems to digital platforms. Avoid common pitfalls and ensure staff buy-in with these proven strategies.</p>
        
        <h2>The Digital Transformation Journey</h2>
        <p>Digital transformation in care homes isn't just about adopting new technology—it's about fundamentally changing how care is delivered, documented, and managed to improve outcomes for residents and efficiency for staff.</p>
        
        <h2>Step 1: Assess Your Current State</h2>
        <p>Before implementing any digital solution, conduct a thorough assessment of your current processes:</p>
        <ul>
          <li>Document all current paper-based processes</li>
          <li>Identify pain points and inefficiencies</li>
          <li>Survey staff about their technology comfort levels</li>
          <li>Analyze compliance gaps and documentation issues</li>
        </ul>
        
        <h2>Step 2: Define Your Digital Vision</h2>
        <p>Establish clear goals for your digital transformation:</p>
        <ul>
          <li>Improved resident care outcomes</li>
          <li>Enhanced staff efficiency and satisfaction</li>
          <li>Better compliance and documentation</li>
          <li>Reduced administrative burden</li>
          <li>Enhanced family communication</li>
        </ul>
        
        <h2>Step 3: Choose the Right Technology Partner</h2>
        <p>Selecting the right digital platform is crucial. Look for:</p>
        <ul>
          <li>Care sector specialization and experience</li>
          <li>Comprehensive feature set covering all operations</li>
          <li>Strong support and training programs</li>
          <li>Proven track record with similar care homes</li>
          <li>Robust security and compliance features</li>
        </ul>
        
        <h2>Step 4: Implement with Care</h2>
        <p>A phased implementation approach reduces risk and improves adoption:</p>
        <ol>
          <li><strong>Phase 1:</strong> Core documentation and care planning</li>
          <li><strong>Phase 2:</strong> Staff management and scheduling</li>
          <li><strong>Phase 3:</strong> Advanced features and integrations</li>
          <li><strong>Phase 4:</strong> Analytics and reporting optimization</li>
        </ol>
        
        <h2>Step 5: Ensure Ongoing Success</h2>
        <p>Digital transformation is an ongoing journey:</p>
        <ul>
          <li>Provide continuous training and support</li>
          <li>Regularly review and optimize processes</li>
          <li>Celebrate wins and address challenges quickly</li>
          <li>Stay updated with new features and capabilities</li>
        </ul>
        
        <h2>Common Pitfalls to Avoid</h2>
        <ul>
          <li><strong>Rushing the process:</strong> Take time to plan and prepare properly</li>
          <li><strong>Inadequate training:</strong> Invest in comprehensive staff training</li>
          <li><strong>Resistance to change:</strong> Address concerns and involve staff in the process</li>
          <li><strong>Poor data migration:</strong> Ensure historical data is properly transferred</li>
        </ul>
        
        <h2>Measuring Success</h2>
        <p>Track key metrics to measure your digital transformation success:</p>
        <ul>
          <li>Time savings in documentation and administrative tasks</li>
          <li>Improved compliance scores and audit results</li>
          <li>Enhanced staff satisfaction and retention</li>
          <li>Better resident outcomes and family satisfaction</li>
          <li>Reduced operational costs and improved efficiency</li>
        </ul>
        
        <h2>Conclusion</h2>
        <p>Digital transformation in care homes is essential for staying competitive and providing the best possible care. With proper planning, the right technology partner, and a commitment to change management, your care home can successfully transition to digital operations and reap the benefits of improved efficiency, compliance, and care quality.</p>
      </div>
    `,
    excerpt: "A practical roadmap for care homes transitioning from paper-based systems to digital platforms. Avoid common pitfalls and ensure staff buy-in with these proven strategies.",
    author: "James Wilson",
    authorRole: "Care Technology Consultant",
    authorBio: "James Wilson specializes in helping care homes implement digital solutions with over 10 years of experience in healthcare technology transformation.",
    category: "Technology Updates",
    publishDate: "2024-03-12",
    readTime: "6 min read",
    image: "/images/blog/digital-transformation.jpg",
    tags: ["Digital Transformation", "Technology", "Change Management", "Implementation"]
  }
}

const relatedPosts = [
  {
    id: 3,
    title: "Staff Retention Strategies That Actually Work in Care Homes",
    excerpt: "Practical tips from care home managers who've improved retention rates by 40%.",
    category: "Staff Management",
    readTime: "5 min read",
    image: "/images/blog/staff-retention.jpg"
  },
  {
    id: 4,
    title: "Understanding the New CQC Regulations: What Changed in 2024",
    excerpt: "A breakdown of the latest CQC regulation updates and their impact.",
    category: "CQC Compliance",
    readTime: "7 min read",
    image: "/images/blog/cqc-regulations.jpg"
  },
  {
    id: 5,
    title: "Family Engagement in Care: Building Stronger Relationships",
    excerpt: "How technology can bridge the gap between care homes and families.",
    category: "Care Management",
    readTime: "4 min read",
    image: "/images/blog/family-engagement.jpg"
  }
]

const BlogPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [showComments, setShowComments] = useState(false)
  
  // Get the blog post data
  const post = id && blogPosts[id as keyof typeof blogPosts] ? blogPosts[id as keyof typeof blogPosts] : blogPosts['1']

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            to="/blog" 
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Link>
          
          <div className="mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                {post.category}
              </span>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                {post.readTime}
              </div>
            </div>
            
            <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {post.title}
            </h1>
            
            <p className="text-xl text-gray-600 mb-8">
              {post.excerpt}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">
                    {post.author.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{post.author}</div>
                  <div className="text-gray-600">{post.authorRole}</div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    {post.publishDate}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm">
                  <Heart className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <article className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Featured Image Placeholder */}
          <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl mb-12">
            <div className="flex items-center justify-center">
              <BookOpen className="h-20 w-20 text-indigo-300" />
            </div>
          </div>
          
          {/* Article Body - Clean Typography */}
          <div className="prose prose-xl max-w-none">
            {/* Excerpt */}
            <p className="text-2xl leading-relaxed text-gray-600 font-light mb-12 border-l-4 border-indigo-200 pl-6 italic">
              {post.excerpt}
            </p>
            
            {/* Clean Article Content */}
            <div className="article-content space-y-8">
              {post.id === 1 ? (
                <>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Understanding the CQC Framework</h2>
                    <p className="text-lg leading-relaxed text-gray-700 mb-6">
                      The Care Quality Commission (CQC) assesses care homes against five key domains: Safe, Effective, Caring, Responsive, and Well-led. Each domain requires specific evidence and documentation to achieve an Outstanding rating.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-4">1. Safe Domain - Protecting People from Harm</h3>
                    <p className="text-lg leading-relaxed text-gray-700 mb-4">The Safe domain focuses on:</p>
                    <ul className="space-y-3 text-lg text-gray-700 ml-6">
                      <li className="flex items-start">
                        <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                        Safeguarding procedures and incident management
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                        Medication management and administration
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                        Infection prevention and control
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                        Risk assessments and environmental safety
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-4">2. Effective Domain - Achieving Good Outcomes</h3>
                    <p className="text-lg leading-relaxed text-gray-700 mb-4">For the Effective domain, CQC inspectors look for:</p>
                    <ul className="space-y-3 text-lg text-gray-700 ml-6">
                      <li className="flex items-start">
                        <CheckCircle className="h-6 w-6 text-blue-500 mr-3 mt-1 flex-shrink-0" />
                        Evidence-based care and treatment
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-6 w-6 text-blue-500 mr-3 mt-1 flex-shrink-0" />
                        Staff competency and training records
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-6 w-6 text-blue-500 mr-3 mt-1 flex-shrink-0" />
                        Multidisciplinary working and referrals
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-6 w-6 text-blue-500 mr-3 mt-1 flex-shrink-0" />
                        Mental Capacity Act compliance
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Key Documentation Requirements</h2>
                    <p className="text-lg leading-relaxed text-gray-700 mb-6">
                      Outstanding care homes maintain comprehensive documentation including:
                    </p>

                    <div className="bg-indigo-50 rounded-xl p-8 mb-8">
                      <h3 className="text-xl font-semibold text-indigo-900 mb-3">Care Planning and Reviews</h3>
                      <p className="text-lg text-indigo-800">
                        Detailed, person-centered care plans that are regularly reviewed and updated based on changing needs.
                      </p>
                    </div>

                    <div className="bg-purple-50 rounded-xl p-8 mb-8">
                      <h3 className="text-xl font-semibold text-purple-900 mb-3">Staff Training Matrix</h3>
                      <p className="text-lg text-purple-800">
                        Complete records of all mandatory and additional training, with clear renewal dates and competency assessments.
                      </p>
                    </div>

                    <div className="bg-green-50 rounded-xl p-8 mb-8">
                      <h3 className="text-xl font-semibold text-green-900 mb-3">Quality Monitoring</h3>
                      <p className="text-lg text-green-800">
                        Regular audits, surveys, and quality improvement initiatives with documented outcomes and action plans.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Best Practices for Outstanding Ratings</h2>
                    <p className="text-lg leading-relaxed text-gray-700 mb-6">
                      Based on our analysis of Outstanding-rated care homes, here are the key success factors:
                    </p>
                    
                    <div className="space-y-6">
                      <div className="flex items-start space-x-4 p-6 bg-gray-50 rounded-xl">
                        <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                        <div>
                          <h4 className="text-xl font-semibold text-gray-900 mb-2">Person-centered approach</h4>
                          <p className="text-lg text-gray-700">Every aspect of care is tailored to individual needs and preferences</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-4 p-6 bg-gray-50 rounded-xl">
                        <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                        <div>
                          <h4 className="text-xl font-semibold text-gray-900 mb-2">Continuous improvement culture</h4>
                          <p className="text-lg text-gray-700">Regular feedback loops and improvement initiatives</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-4 p-6 bg-gray-50 rounded-xl">
                        <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                        <div>
                          <h4 className="text-xl font-semibold text-gray-900 mb-2">Strong leadership</h4>
                          <p className="text-lg text-gray-700">Clear vision, effective communication, and staff empowerment</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-4 p-6 bg-gray-50 rounded-xl">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
                        <div>
                          <h4 className="text-xl font-semibold text-gray-900 mb-2">Robust systems</h4>
                          <p className="text-lg text-gray-700">Digital platforms that ensure consistency and compliance</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Using Technology for CQC Excellence</h2>
                    <p className="text-lg leading-relaxed text-gray-700 mb-6">
                      WriteCareNotes helps care homes achieve Outstanding ratings through:
                    </p>
                    
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex items-center space-x-3">
                          <Star className="h-6 w-6 text-indigo-600" />
                          <span className="text-lg text-gray-700">Automated compliance monitoring and alerts</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Star className="h-6 w-6 text-purple-600" />
                          <span className="text-lg text-gray-700">Comprehensive audit trails for all care activities</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Star className="h-6 w-6 text-green-600" />
                          <span className="text-lg text-gray-700">Real-time reporting and analytics</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Star className="h-6 w-6 text-blue-600" />
                          <span className="text-lg text-gray-700">Staff training management and tracking</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
                    <h2 className="text-3xl font-bold mb-4">Ready to Achieve Outstanding?</h2>
                    <p className="text-xl mb-6">
                      Achieving an Outstanding CQC rating requires dedication, the right systems, and a commitment to continuous improvement. With proper planning and the right technology support, any care home can reach this level of excellence.
                    </p>
                    <p className="text-lg">
                      <strong>Ready to improve your CQC rating?</strong> Contact our compliance experts to learn how WriteCareNotes can support your journey to Outstanding.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">The Digital Transformation Journey</h2>
                    <p className="text-lg leading-relaxed text-gray-700 mb-6">
                      Digital transformation in care homes isn't just about adopting new technology—it's about fundamentally changing how care is delivered, documented, and managed to improve outcomes for residents and efficiency for staff.
                    </p>
                  </div>

                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">5 Essential Steps for Success</h2>
                    
                    <div className="space-y-8">
                      <div className="border-l-4 border-indigo-500 pl-6">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Step 1: Assess Your Current State</h3>
                        <p className="text-lg leading-relaxed text-gray-700 mb-4">Before implementing any digital solution, conduct a thorough assessment:</p>
                        <ul className="space-y-2 text-lg text-gray-700">
                          <li className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-indigo-500 mr-3 mt-1" />
                            Document all current paper-based processes
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-indigo-500 mr-3 mt-1" />
                            Identify pain points and inefficiencies
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-indigo-500 mr-3 mt-1" />
                            Survey staff about their technology comfort levels
                          </li>
                        </ul>
                      </div>

                      <div className="border-l-4 border-purple-500 pl-6">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Step 2: Define Your Digital Vision</h3>
                        <p className="text-lg leading-relaxed text-gray-700 mb-4">Establish clear goals for your transformation:</p>
                        <div className="bg-purple-50 rounded-xl p-6">
                          <div className="grid md:grid-cols-2 gap-4 text-lg text-purple-800">
                            <div>• Improved resident care outcomes</div>
                            <div>• Enhanced staff efficiency</div>
                            <div>• Better compliance and documentation</div>
                            <div>• Enhanced family communication</div>
                          </div>
                        </div>
                      </div>

                      <div className="border-l-4 border-green-500 pl-6">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Step 3: Choose the Right Technology Partner</h3>
                        <p className="text-lg leading-relaxed text-gray-700 mb-4">Look for these essential qualities:</p>
                        <div className="bg-green-50 rounded-xl p-6">
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <Star className="h-5 w-5 text-green-600" />
                              <span className="text-lg text-green-800">Care sector specialization and experience</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Star className="h-5 w-5 text-green-600" />
                              <span className="text-lg text-green-800">Comprehensive feature set covering all operations</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Star className="h-5 w-5 text-green-600" />
                              <span className="text-lg text-green-800">Strong support and training programs</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-l-4 border-blue-500 pl-6">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Step 4: Implement with Care</h3>
                        <p className="text-lg leading-relaxed text-gray-700 mb-4">A phased approach reduces risk:</p>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="bg-blue-50 rounded-lg p-4">
                            <div className="font-semibold text-blue-900 mb-2">Phase 1</div>
                            <div className="text-blue-800">Core documentation and care planning</div>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-4">
                            <div className="font-semibold text-blue-900 mb-2">Phase 2</div>
                            <div className="text-blue-800">Staff management and scheduling</div>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-4">
                            <div className="font-semibold text-blue-900 mb-2">Phase 3</div>
                            <div className="text-blue-800">Advanced features and integrations</div>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-4">
                            <div className="font-semibold text-blue-900 mb-2">Phase 4</div>
                            <div className="text-blue-800">Analytics and reporting optimization</div>
                          </div>
                        </div>
                      </div>

                      <div className="border-l-4 border-orange-500 pl-6">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Step 5: Ensure Ongoing Success</h3>
                        <div className="bg-orange-50 rounded-xl p-6">
                          <p className="text-lg text-orange-800 mb-4">Digital transformation is an ongoing journey that requires:</p>
                          <div className="space-y-2 text-lg text-orange-700">
                            <div>✓ Continuous training and support</div>
                            <div>✓ Regular process review and optimization</div>
                            <div>✓ Quick challenge resolution</div>
                            <div>✓ Staying updated with new capabilities</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
                    <h2 className="text-3xl font-bold mb-4">Transform Your Care Home Today</h2>
                    <p className="text-xl mb-6">
                      Digital transformation in care homes is essential for staying competitive and providing the best possible care. With proper planning, the right technology partner, and a commitment to change management, your care home can successfully transition to digital operations.
                    </p>
                    <p className="text-lg">
                      Ready to start your digital transformation journey? Our experts are here to guide you every step of the way.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Tags */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center space-x-2 mb-6">
              <Tag className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Tags:</span>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          {/* Author Bio */}
          <div className="mt-12 p-8 bg-gray-50 rounded-2xl">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {post.author.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{post.author}</h3>
                <p className="text-indigo-600 font-medium mb-3">{post.authorRole}</p>
                <p className="text-gray-600">{post.authorBio}</p>
              </div>
            </div>
          </div>
          
          {/* Comments Section */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Discussion</h3>
              <Button 
                variant="care" 
                size="sm"
                onClick={() => setShowComments(!showComments)}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Join Discussion
              </Button>
            </div>
            
            {showComments && (
              <div className="bg-gray-50 rounded-xl p-8">
                <p className="text-gray-600 text-center">
                  Comments feature coming soon! For now, feel free to share this article 
                  or contact us with your thoughts.
                </p>
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Related Posts */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Related Articles
            </h2>
            <p className="text-xl text-gray-600">
              Continue learning with these related insights
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {relatedPosts.map((relatedPost) => (
              <article key={relatedPost.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-gray-100 to-gray-200">
                  <div className="flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-gray-300" />
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {relatedPost.category}
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {relatedPost.readTime}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 leading-tight">
                    {relatedPost.title}
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm">
                    {relatedPost.excerpt}
                  </p>
                  <Link to={`/blog/${relatedPost.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Read Article
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Care Home?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Discover how WriteCareNotes can help you implement the strategies 
            discussed in this article and achieve Outstanding results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/demo">
              <Button size="lg" variant="secondary">
                Book a Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-indigo-600">
                Contact Experts
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="text-indigo-100 text-sm mt-6">
            Free consultation • CQC compliance experts • Outstanding results guaranteed
          </p>
        </div>
      </section>
    </div>
  )
}

export default BlogPostPage