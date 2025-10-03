import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Search, Calendar, Tag, User, Clock, ChevronRight } from 'lucide-react';

interface BlogLayoutProps {
  children?: React.ReactNode;
}

const BlogLayout: React.FC<BlogLayoutProps> = ({ children }) => {
  const location = useLocation();

  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(segment => segment);
    const breadcrumbs = [{ name: 'Home', href: '/' }];

    let currentPath = '';
    for (const segment of pathSegments) {
      currentPath += `/${segment}`;
      const name = segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' ');
      breadcrumbs.push({ name, href: currentPath });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">WCN</span>
                </div>
                <span className="ml-3 text-xl font-semibold text-gray-900">WriteCareNotes</span>
              </Link>
              <nav className="hidden md:ml-8 md:flex space-x-8">
                <Link to="/blog" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                  Blog
                </Link>
                <Link to="/blog/categories" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                  Categories
                </Link>
                <Link to="/about" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                  About
                </Link>
                <Link to="/contact" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                  Contact
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <Link
                to="/blog/rss"
                className="text-gray-700 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100"
                title="RSS Feed"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3.429 2.571c9.714 0 17.571 7.857 17.571 17.571h-3.429c0-7.714-6.286-14-14-14v-3.571zM3.429 9.714c4 0 7.286 3.286 7.286 7.286h-3.429c0-2.143-1.714-3.857-3.857-3.857v-3.429zM6.857 16.571c0.571 0 1.143 0.571 1.143 1.143s-0.571 1.143-1.143 1.143-1.143-0.571-1.143-1.143 0.571-1.143 1.143-1.143z"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center py-3 text-sm">
            {breadcrumbs.map((breadcrumb, index) => (
              <React.Fragment key={breadcrumb.href}>
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
                )}
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-gray-500">{breadcrumb.name}</span>
                ) : (
                  <Link
                    to={breadcrumb.href}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {breadcrumb.name}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children || <Outlet />}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">WCN</span>
                </div>
                <span className="ml-3 text-xl font-semibold">WriteCareNotes</span>
              </div>
              <p className="text-gray-300 mb-4">
                The leading healthcare management platform for care homes and domiciliary care providers across the British Isles.
              </p>
              <div className="flex space-x-4">
                <Link to="/blog/rss" className="text-gray-400 hover:text-white">
                  <span className="sr-only">RSS</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3.429 2.571c9.714 0 17.571 7.857 17.571 17.571h-3.429c0-7.714-6.286-14-14-14v-3.571zM3.429 9.714c4 0 7.286 3.286 7.286 7.286h-3.429c0-2.143-1.714-3.857-3.857-3.857v-3.429zM6.857 16.571c0.571 0 1.143 0.571 1.143 1.143s-0.571 1.143-1.143 1.143-1.143-0.571-1.143-1.143 0.571-1.143 1.143-1.143z"/>
                  </svg>
                </Link>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Blog</h3>
              <ul className="space-y-2">
                <li><Link to="/blog" className="text-gray-300 hover:text-white">All Articles</Link></li>
                <li><Link to="/blog/category/healthcare-technology" className="text-gray-300 hover:text-white">Healthcare Technology</Link></li>
                <li><Link to="/blog/category/care-management" className="text-gray-300 hover:text-white">Care Management</Link></li>
                <li><Link to="/blog/category/regulatory-compliance" className="text-gray-300 hover:text-white">Compliance</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-300 hover:text-white">About Us</Link></li>
                <li><Link to="/contact" className="text-gray-300 hover:text-white">Contact</Link></li>
                <li><Link to="/privacy" className="text-gray-300 hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-gray-300 hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 WriteCareNotes. All rights reserved. | Healthcare Management Platform for the British Isles
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlogLayout;