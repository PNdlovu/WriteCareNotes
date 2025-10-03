import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, Eye, ArrowLeft, Share2, Bookmark, Tag, MessageCircle } from 'lucide-react';
import { BlogPost as BlogPostType, BlogComment } from '../../types/blog';
import { blogService } from '../../services/blogService';
import BlogCommentForm from './BlogCommentForm';
import RelatedPosts from './RelatedPosts';

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCommentForm, setShowCommentForm] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  useEffect(() => {
    // Update page title and meta description
    if (post) {
      document.title = post.metaTitle || `${post.title} | WriteCareNotes Blog`;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', post.metaDescription || post.excerpt || '');
      }

      // Update meta keywords
      if (post.metaKeywords && post.metaKeywords.length > 0) {
        const metaKeywords = document.querySelector('meta[name="keywords"]');
        if (metaKeywords) {
          metaKeywords.setAttribute('content', post.metaKeywords.join(', '));
        }
      }

      // Add structured data for SEO
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.excerpt || post.metaDescription,
        "image": post.featuredImage ? `https://writecarenotes.com${post.featuredImage}` : undefined,
        "author": {
          "@type": "Person",
          "name": post.authorName,
          "email": post.authorEmail
        },
        "publisher": {
          "@type": "Organization",
          "name": "WriteCareNotes",
          "logo": {
            "@type": "ImageObject",
            "url": "https://writecarenotes.com/logo.png"
          }
        },
        "datePublished": post.publishedAt || post.createdAt,
        "dateModified": post.updatedAt,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": `https://writecarenotes.com/blog/${post.slug}`
        }
      };

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(structuredData);
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
    }
  }, [post]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const postData = await blogService.getPostBySlug(slug!);
      setPost(postData);
      setComments(postData.comments?.filter(comment => comment.approved) || []);
    } catch (err) {
      setError('Failed to load blog post');
      console.error('Error fetching blog post:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt || '',
          url: window.location.href
        });
      } catch (err) {
        // Fallback to copying URL
        navigator.clipboard.writeText(window.location.href);
        alert('URL copied to clipboard!');
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      alert('URL copied to clipboard!');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleCommentAdded = (comment: BlogComment) => {
    setComments(prev => [comment, ...prev]);
    setShowCommentForm(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h1>
        <p className="text-gray-600 mb-6">
          The article you're looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={() => navigate('/blog')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Blog</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/blog')}
        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Blog</span>
      </button>

      {/* Article Header */}
      <article className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {post.featuredImage && (
          <div className="aspect-video overflow-hidden">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-8">
          {/* Categories and Featured Badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-wrap gap-2">
              {post.categories?.map((category) => (
                <Link
                  key={category.id}
                  to={`/blog/category/${category.slug}`}
                  className="inline-block px-3 py-1 text-sm font-medium rounded-full hover:opacity-80"
                  style={{ backgroundColor: category.color + '20', color: category.color }}
                >
                  {category.name}
                </Link>
              ))}
            </div>
            {post.featured && (
              <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full">
                Featured Article
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-6 pb-6 border-b">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>By {post.authorName}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(post.publishedAt || post.createdAt)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>{post.readTime} minute read</span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>{post.viewCount} views</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4 mb-8">
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Bookmark className="w-4 h-4" />
              <span>Save</span>
            </button>
          </div>

          {/* Article Content */}
          <div 
            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-8 pt-8 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    to={`/blog/tag/${tag.slug}`}
                    className="inline-flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <Tag className="w-3 h-3" />
                    <span>{tag.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>

      {/* Comments Section */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <MessageCircle className="w-6 h-6" />
            <span>Comments ({comments.length})</span>
          </h3>
          <button
            onClick={() => setShowCommentForm(!showCommentForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showCommentForm ? 'Cancel' : 'Add Comment'}
          </button>
        </div>

        {/* Comment Form */}
        {showCommentForm && (
          <div className="mb-8">
            <BlogCommentForm
              postId={post.id}
              onCommentAdded={handleCommentAdded}
              onCancel={() => setShowCommentForm(false)}
            />
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-6">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No comments yet. Be the first to share your thoughts!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{comment.authorName}</h4>
                    <p className="text-sm text-gray-500">
                      {formatDate(comment.createdAt)}
                    </p>
                  </div>
                </div>
                <div 
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: comment.content }}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Related Posts */}
      <div className="mt-8">
        <RelatedPosts postId={post.id} />
      </div>
    </div>
  );
};

export default BlogPost;