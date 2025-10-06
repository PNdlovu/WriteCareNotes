import React, { useState } from 'react';
import { Send, X, User, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { BlogComment } from '../../types/blog';
import { blogService } from '../../services/blogService';

interface BlogCommentFormProps {
  postId: string;
  onCommentAdded: (comment: BlogComment) => void;
  onCancel: () => void;
  isUserLoggedIn?: boolean;
  userInfo?: {
    name: string;
    email: string;
    isVerified: boolean;
  };
}

const BlogCommentForm: React.FC<BlogCommentFormProps> = ({ 
  postId, 
  onCommentAdded, 
  onCancel, 
  isUserLoggedIn = false,
  userInfo 
}) => {
  const [formData, setFormData] = useState({
    content: '',
    authorName: userInfo?.name || '',
    authorEmail: userInfo?.email || '',
    authorWebsite: '',
    isPublicComment: !isUserLoggedIn
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      setError('Please enter your comment');
      return;
    }

    if (!isUserLoggedIn && (!formData.authorName.trim() || !formData.authorEmail.trim())) {
      setError('Please fill in your name and email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const comment = await blogService.createComment({
        ...formData,
        postId
      });
      
      onCommentAdded(comment);
      setSuccess(
        isUserLoggedIn && userInfo?.isVerified 
          ? 'Your comment has been published!' 
          : 'Your comment has been submitted and is awaiting moderation.'
      );
      
      // Reset form
      setFormData({
        content: '',
        authorName: userInfo?.name || '',
        authorEmail: userInfo?.email || '',
        authorWebsite: '',
        isPublicComment: !isUserLoggedIn
      });

      // Auto-close success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
        if (isUserLoggedIn && userInfo?.isVerified) {
          onCancel();
        }
      }, 3000);

    } catch (err) {
      setError('Failed to submit comment. Please try again.');
      console.error('Error submitting comment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h4 className="text-lg font-semibold text-gray-900">Leave a Comment</h4>
          {isUserLoggedIn ? (
            <div className="flex items-center space-x-2">
              <div className="flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                <User className="w-3 h-3 mr-1" />
                <span>Logged in as {userInfo?.name}</span>
              </div>
              {userInfo?.isVerified && (
                <div className="flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  <span>Verified</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
              <AlertCircle className="w-3 h-3 mr-1" />
              <span>Public comment (requires moderation)</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {!isUserLoggedIn && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="authorName" className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                id="authorName"
                name="authorName"
                value={formData.authorName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Your full name"
              />
            </div>
            
            <div>
              <label htmlFor="authorEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                id="authorEmail"
                name="authorEmail"
                value={formData.authorEmail}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="your.email@example.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your email will not be published
              </p>
            </div>
          </div>
        )}

        {!isUserLoggedIn && (
          <div className="mb-4">
            <label htmlFor="authorWebsite" className="block text-sm font-medium text-gray-700 mb-2">
              Website (optional)
            </label>
            <input
              type="url"
              id="authorWebsite"
              name="authorWebsite"
              value={formData.authorWebsite}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="https://yourwebsite.com"
            />
          </div>
        )}

        <div className="mb-6">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Comment *
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical transition-colors"
            placeholder="Share your thoughts, experiences, or ask questions..."
          />
          <p className="text-xs text-gray-500 mt-1">
            {isUserLoggedIn && userInfo?.isVerified 
              ? 'Your comment will be published immediately.'
              : 'Comments are moderated and will be published after approval to ensure quality discussion.'
            }
          </p>
        </div>

        {!isUserLoggedIn && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <User className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <h5 className="font-medium text-blue-900 mb-1">Want faster comment approval?</h5>
                <p className="text-blue-700 mb-2">
                  Register for a free account to get verified status and skip the moderation queue.
                </p>
                <div className="flex space-x-3">
                  <a href="/register" className="text-blue-600 hover:text-blue-800 font-medium">
                    Create Account
                  </a>
                  <span className="text-blue-400">•</span>
                  <a href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                    Sign In
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {!isUserLoggedIn && (
              <span>By commenting, you agree to our community guidelines.</span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>
                    {isUserLoggedIn && userInfo?.isVerified ? 'Publish Comment' : 'Submit for Review'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BlogCommentForm;