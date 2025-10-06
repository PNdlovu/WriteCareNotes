import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { 
  Calendar, 
  Clock, 
  ArrowLeft,
  Share2,
  BookOpen,
  Tag,
  Heart,
  MessageCircle,
  ArrowRight
} from 'lucide-react'
import blogArticles from '../data/blogArticles'

const BlogPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [showComments, setShowComments] = useState(false)
  
  // Get the blog post - if not found, redirect to blog list
  const post = id && blogArticles[id] ? blogArticles[id] : null

  if (!post) {
    return (
      <div className="flex flex-col min-h-screen">
        <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Blog Post Not Found
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              The blog post you're looking for doesn't exist or has been moved.
            </p>
            <Link to="/blog">
              <Button size="lg">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </section>
      </div>
    )
  }

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
                {post.category || 'General'}
              </span>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                {post.readingTime || `${post.readTime} min read` || '5 min read'}
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
                    {post.author?.name.split(' ').map((n: string) => n[0]).join('') || 'WC'}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{post.author?.name || 'WriteCareNotes Team'}</div>
                  <div className="text-gray-600">{post.author?.role || 'Care Technology Experts'}</div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    {post.publishedAt}
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
          
          {/* Article Body */}
          <div className="prose prose-xl max-w-none">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
          
          {/* Tags */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center space-x-2 mb-6">
              <Tag className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Tags:</span>
              <div className="flex flex-wrap gap-2">
                {post.tags?.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {typeof tag === 'string' ? tag : tag}
                  </span>
                )) || []}
              </div>
            </div>
          </div>
          
          {/* Author Bio */}
          <div className="mt-12 p-8 bg-gray-50 rounded-2xl">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {post.author?.name.split(' ').map((n: string) => n[0]).join('') || 'WC'}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{post.author?.name || 'WriteCareNotes Team'}</h3>
                <p className="text-indigo-600 font-medium mb-3">{post.author?.role || 'Care Technology Experts'}</p>
                {post.author?.avatar && (
                  <p className="text-gray-600">Expert team focused on revolutionizing care home technology and compliance.</p>
                )}
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