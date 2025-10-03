import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Star, Clock, ArrowRight, Calendar, User, Eye } from 'lucide-react';
import { BlogPost, BlogCategory } from '../types/blog';
import { blogService } from '../services/blogService';

const BlogHomePage: React.FC = () => {
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [popularPosts, setPopularPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [featured, recent, popular, cats] = await Promise.all([
        blogService.getFeaturedPosts(3),
        blogService.getRecentPosts(6),
        blogService.getPopularPosts(5),
        blogService.getCategories()
      ]);

      setFeaturedPosts(featured);
      setRecentPosts(recent);
      setPopularPosts(popular);
      setCategories(cats);
    } catch (err) {
      console.error('Error fetching blog data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section>
          <div className="flex items-center space-x-3 mb-8">
            <Star className="w-6 h-6 text-yellow-500" />
            <h2 className="text-3xl font-bold text-gray-900">Featured Articles</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {featuredPosts.map((post, index) => (
              <article
                key={post.id}
                className={`group ${index === 0 ? 'lg:col-span-2 lg:row-span-2' : ''}`}
              >
                <div className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-shadow duration-300 overflow-hidden h-full">
                  {post.featuredImage && (
                    <div className={`aspect-video overflow-hidden ${index === 0 ? 'lg:aspect-[2/1]' : ''}`}>
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  
                  <div className={`p-6 ${index === 0 ? 'lg:p-8' : ''}`}>
                    {/* Categories */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.categories?.slice(0, 2).map((category) => (
                        <Link
                          key={category.id}
                          to={`/blog/category/${category.slug}`}
                          className="inline-block px-3 py-1 text-xs font-medium rounded-full"
                          style={{ backgroundColor: category.color + '20', color: category.color }}
                        >
                          {category.name}
                        </Link>
                      ))}
                    </div>

                    <h3 className={`font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors ${
                      index === 0 ? 'text-2xl lg:text-3xl' : 'text-xl'
                    }`}>
                      <Link to={`/blog/${post.slug}`} className="hover:underline">
                        {post.title}
                      </Link>
                    </h3>

                    {post.excerpt && (
                      <p className={`text-gray-600 mb-4 ${index === 0 ? 'text-lg' : ''}`}>
                        {post.excerpt}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{post.authorName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{post.readTime} min</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>{post.viewCount}</span>
                      </div>
                    </div>

                    <Link
                      to={`/blog/${post.slug}`}
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Read full article
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Recent Posts */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <Clock className="w-6 h-6 text-blue-600" />
              <h2 className="text-3xl font-bold text-gray-900">Latest Articles</h2>
            </div>
            <Link
              to="/blog/posts"
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="space-y-6">
            {recentPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-shadow duration-300 overflow-hidden"
              >
                <div className="md:flex">
                  {post.featuredImage && (
                    <div className="md:w-48 aspect-video md:aspect-square overflow-hidden">
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  
                  <div className="p-6 flex-1">
                    {/* Categories */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.categories?.slice(0, 2).map((category) => (
                        <Link
                          key={category.id}
                          to={`/blog/category/${category.slug}`}
                          className="inline-block px-2 py-1 text-xs font-medium rounded-full"
                          style={{ backgroundColor: category.color + '20', color: category.color }}
                        >
                          {category.name}
                        </Link>
                      ))}
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-3 hover:text-blue-600 transition-colors">
                      <Link to={`/blog/${post.slug}`} className="hover:underline">
                        {post.title}
                      </Link>
                    </h3>

                    {post.excerpt && (
                      <p className="text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{post.authorName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{post.readTime} min</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>{post.viewCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Popular Posts */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center space-x-3 mb-6">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="text-xl font-bold text-gray-900">Popular Articles</h3>
            </div>
            
            <div className="space-y-4">
              {popularPosts.map((post, index) => (
                <article key={post.id} className="group">
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                        <Link to={`/blog/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h4>
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>{post.viewCount}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{post.readTime}m</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Categories</h3>
            
            <div className="space-y-3">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/blog/category/${category.slug}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className="font-medium text-gray-900 group-hover:text-blue-600">
                      {category.name}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {category.posts?.length || 0}
                  </span>
                </Link>
              ))}
            </div>
            
            <Link
              to="/blog/categories"
              className="block mt-4 text-center text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              View all categories
            </Link>
          </div>

          {/* Newsletter Signup */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-xl p-6">
            <h3 className="text-xl font-bold mb-3">Stay Updated</h3>
            <p className="text-blue-100 mb-4 text-sm">
              Get the latest healthcare technology insights delivered to your inbox.
            </p>
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-3 py-2 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              />
              <button className="w-full bg-white text-blue-600 font-medium py-2 rounded-lg hover:bg-gray-100 transition-colors">
                Subscribe
              </button>
            </div>
          </div>

          {/* RSS Feed */}
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-3">RSS Feed</h3>
            <p className="text-gray-600 text-sm mb-4">
              Subscribe to our RSS feed to never miss an update.
            </p>
            <Link
              to="/blog/rss"
              className="inline-flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3.429 2.571c9.714 0 17.571 7.857 17.571 17.571h-3.429c0-7.714-6.286-14-14-14v-3.571zM3.429 9.714c4 0 7.286 3.286 7.286 7.286h-3.429c0-2.143-1.714-3.857-3.857-3.857v-3.429zM6.857 16.571c0.571 0 1.143 0.571 1.143 1.143s-0.571 1.143-1.143 1.143-1.143-0.571-1.143-1.143 0.571-1.143 1.143-1.143z"/>
              </svg>
              <span>Subscribe to RSS</span>
            </Link>
          </div>
        </section>
      )}

      {/* Recent Posts */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-blue-600" />
            <h2 className="text-3xl font-bold text-gray-900">Latest Articles</h2>
          </div>
          <Link
            to="/blog/posts"
            className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
          >
            <span>View all articles</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recentPosts.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-shadow duration-300 overflow-hidden group"
            >
              {post.featuredImage && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              
              <div className="p-6">
                {/* Categories */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.categories?.slice(0, 2).map((category) => (
                    <Link
                      key={category.id}
                      to={`/blog/category/${category.slug}`}
                      className="inline-block px-3 py-1 text-xs font-medium rounded-full"
                      style={{ backgroundColor: category.color + '20', color: category.color }}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  <Link to={`/blog/${post.slug}`} className="hover:underline line-clamp-2">
                    {post.title}
                  </Link>
                </h3>

                {post.excerpt && (
                  <p className="text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{post.readTime}m</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{post.viewCount}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl p-8 md:p-12 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Care Management?</h2>
        <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Join thousands of care providers who trust WriteCareNotes for comprehensive healthcare management across the British Isles.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/demo"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Request Demo
          </Link>
          <Link
            to="/contact"
            className="bg-white text-gray-900 px-8 py-3 rounded-lg hover:bg-gray-100 font-medium transition-colors"
          >
            Contact Sales
          </Link>
        </div>
      </section>
    </div>
  );
};

export default BlogHomePage;