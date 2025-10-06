import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { 
  Calendar, 
  Clock, 
  User, 
  ArrowRight,
  Search,
  FileText,
  TrendingUp,
  Heart,
  Shield,
  Users,
  BookOpen,
  Tag
} from 'lucide-react'

const blogCategories = [
  { id: 'ai-innovation', name: 'AI & Innovation', count: 5, color: 'bg-violet-100 text-violet-800' },
  { id: 'integration-connectivity', name: 'Integration & Connectivity', count: 7, color: 'bg-blue-100 text-blue-800' },
  { id: 'cqc-compliance', name: 'CQC Compliance', count: 12, color: 'bg-green-100 text-green-800' },
  { id: 'staff-productivity', name: 'Staff Productivity', count: 8, color: 'bg-orange-100 text-orange-800' },
  { id: 'service-efficiency', name: 'Service Efficiency', count: 10, color: 'bg-purple-100 text-purple-800' },
  { id: 'going-digital', name: 'Going Digital', count: 6, color: 'bg-indigo-100 text-indigo-800' },
  { id: 'best-practices', name: 'Best Practices', count: 15, color: 'bg-pink-100 text-pink-800' }
]

const featuredPosts = [
  {
    id: 9,
    title: "What is AI-Powered Care Management? The Complete Guide for UK Care Homes",
    excerpt: "Discover how AI-powered care management is revolutionizing UK care homes with intelligent automation, predictive analytics, and seamless integration. Learn why leading care providers are choosing AI technology for better resident outcomes.",
    author: "WriteCareNotes Team",
    role: "AI & Innovation Specialists",
    category: "AI & Innovation",
    publishDate: "2025-01-15",
    readTime: "8 min read",
    image: "/images/blog/ai-care-management.jpg",
    featured: true,
    tags: ["AI care management", "automated care planning", "intelligent care systems"]
  },
  {
    id: 10,
    title: "NHS Digital Integration for Care Homes: Complete Guide to GP Connect, eRedBag & DSCR",
    excerpt: "Complete guide to NHS Digital integration for UK care homes. Learn how GP Connect, eRedBag, and DSCR integration transforms care coordination and reduces administrative burden.",
    author: "WriteCareNotes Team",
    role: "NHS Digital Integration Experts",
    category: "Integration & Connectivity",
    publishDate: "2025-01-18",
    readTime: "10 min read",
    image: "/images/blog/nhs-digital-integration.jpg",
    featured: true,
    tags: ["NHS Digital integration", "GP Connect care homes", "eRedBag system"]
  }
]

const recentPosts = [
  {
    id: 3,
    title: "Staff Retention Strategies That Actually Work in Care Homes",
    excerpt: "Practical tips from care home managers who've improved retention rates by 40% using evidence-based approaches.",
    author: "Emma Thompson",
    role: "HR Director",
    category: "Staff Training",
    publishDate: "2024-03-10",
    readTime: "5 min read",
    tags: ["Staff Retention", "HR", "Management"]
  },
  {
    id: 4,
    title: "Understanding the New CQC Regulations: What Changed in 2024",
    excerpt: "A breakdown of the latest CQC regulation updates and how they affect your care home operations.",
    author: "Dr. Sarah Mitchell",
    role: "CQC Compliance Expert",
    category: "CQC Compliance", 
    publishDate: "2024-03-08",
    readTime: "7 min read",
    tags: ["CQC", "Regulations", "Compliance"]
  },
  {
    id: 5,
    title: "Family Engagement in Care: Building Stronger Relationships",
    excerpt: "How technology can bridge the gap between care homes and families, improving satisfaction and trust.",
    author: "Lisa Chen",
    role: "Family Liaison Specialist",
    category: "Care Management",
    publishDate: "2024-03-05",
    readTime: "4 min read",
    tags: ["Family Engagement", "Communication", "Technology"]
  },
  {
    id: 6,
    title: "Cost Management in Care Homes: 10 Proven Strategies",
    excerpt: "Learn how successful care homes are reducing operational costs while maintaining high-quality care standards.",
    author: "Robert Davies",
    role: "Operations Manager",
    category: "Best Practices",
    publishDate: "2024-03-02",
    readTime: "6 min read",
    tags: ["Cost Management", "Operations", "Efficiency"]
  },
  {
    id: 7,
    title: "Medication Management Best Practices for Care Homes",
    excerpt: "Essential guidelines for safe and effective medication administration in residential care settings.",
    author: "Dr. Amanda Foster",
    role: "Clinical Pharmacist",
    category: "Care Management",
    publishDate: "2024-02-28",
    readTime: "8 min read",
    tags: ["Medication Management", "Safety", "Clinical Practice"]
  },
  {
    id: 8,
    title: "Building a Culture of Continuous Improvement",
    excerpt: "How to foster an environment where staff are empowered to suggest and implement improvements.",
    author: "Michael Brown",
    role: "Quality Improvement Lead",
    category: "Best Practices",
    publishDate: "2024-02-25",
    readTime: "5 min read",
    tags: ["Quality Improvement", "Culture", "Staff Empowerment"]
  }
]

const BlogListPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  // Filter posts based on search and category
  const filteredPosts = recentPosts.filter(post => {
    const matchesSearch = searchQuery === '' || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === '' || 
      post.category.toLowerCase() === selectedCategory.toLowerCase()
    
    return matchesSearch && matchesCategory
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search is already handled by the filter above
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium mb-6">
              <BookOpen className="h-4 w-4 mr-2" />
              Care Industry Insights
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Knowledge Hub for 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600"> Care Excellence</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Expert insights, best practices, and practical guidance to help your care home 
              achieve Outstanding CQC ratings and deliver exceptional resident care.
            </p>
            
            <div className="max-w-2xl mx-auto mb-8">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search articles, guides, and best practices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-lg"
                />
              </form>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              {blogCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id === selectedCategory ? '' : category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category.id 
                      ? category.color 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Featured Articles
            </h2>
            <p className="text-xl text-gray-600">
              Our most popular and impactful content for care home professionals
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {featuredPosts.map((post) => (
              <article key={post.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-indigo-100 to-purple-100">
                  <div className="flex items-center justify-center">
                    <FileText className="h-20 w-20 text-indigo-300" />
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex items-center space-x-4 mb-4">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                      {post.category}
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {post.readTime}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white font-bold text-sm">
                          {post.author.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{post.author}</div>
                        <div className="text-sm text-gray-500">{post.role}</div>
                      </div>
                    </div>
                    <Link to={`/blog/${post.id}`}>
                      <Button variant="care" size="sm">
                        Read More
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Posts */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              {searchQuery || selectedCategory ? 'Search Results' : 'Recent Articles'}
            </h2>
            <p className="text-xl text-gray-600">
              {searchQuery || selectedCategory 
                ? `${filteredPosts.length} article${filteredPosts.length !== 1 ? 's' : ''} found`
                : 'Stay updated with the latest insights and best practices'
              }
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
              <article key={post.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {post.category}
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {post.readTime}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center mr-2">
                        <span className="text-white font-bold text-xs">
                          {post.author.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{post.author}</div>
                        <div className="text-xs text-gray-500">{post.publishDate}</div>
                      </div>
                    </div>
                    <Link to={`/blog/${post.id}`}>
                      <Button variant="outline" size="sm">
                        Read
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </article>
            ))
            ) : (
              <div className="col-span-full text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search terms or browse our categories.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('')
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Stay Informed with Our Newsletter
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Get the latest care industry insights, best practices, and WriteCareNotes 
            updates delivered to your inbox every month.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
            />
            <Button variant="secondary" size="lg">
              Subscribe
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          <p className="text-indigo-100 text-sm mt-4">
            No spam, unsubscribe anytime • 15,000+ care professionals trust us
          </p>
        </div>
      </section>
    </div>
  )
}

export default BlogListPage