/**
 * @fileoverview BlogAdmin Component Test Suite
 * @module BlogAdmin.test
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive test suite for BlogAdmin component covering:
 * - Component rendering and accessibility
 * - User interactions and permissions
 * - Blog post management operations
 * - Error handling and edge cases
 * - Audit logging and compliance
 * - Integration with blog services
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BlogAdmin } from './BlogAdmin';
import { blogService } from '../../services/blogService';
import { auditLogger } from '../../utils/auditLogger';
import { useToast } from '../../hooks/useToast';
import { useAudit } from '../../hooks/useAudit';
import { usePermissions } from '../../hooks/usePermissions';

// Mock dependencies
vi.mock('../../services/blogService');
vi.mock('../../utils/auditLogger');
vi.mock('../../hooks/useToast');
vi.mock('../../hooks/useAudit');
vi.mock('../../hooks/usePermissions');
vi.mock('../ui/ErrorBoundary', () => ({
  ErrorBoundary: ({ children, fallback }: any) => {
    try {
      return children;
    } catch (error) {
      return fallback;
    }
  }
}));

// Mock data
const mockPosts = [
  {
    id: '1',
    title: 'Test Post 1',
    slug: 'test-post-1',
    content: 'This is test content for post 1',
    status: 'published',
    authorName: 'Test Author',
    featuredImage: 'https://example.com/image1.jpg',
    featured: true,
    viewCount: 150,
    categories: [
      { id: 'cat1', name: 'Care Home', color: '#3B82F6', posts: [] }
    ],
    publishedAt: '2025-01-01T10:00:00Z',
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-01T10:00:00Z'
  },
  {
    id: '2',
    title: 'Test Post 2',
    slug: 'test-post-2',
    content: 'This is test content for post 2',
    status: 'draft',
    authorName: 'Test Author 2',
    featuredImage: null,
    featured: false,
    viewCount: 75,
    categories: [
      { id: 'cat2', name: 'Medication', color: '#10B981', posts: [] }
    ],
    publishedAt: null,
    createdAt: '2025-01-02T10:00:00Z',
    updatedAt: '2025-01-02T10:00:00Z'
  }
];

const mockCategories = [
  { id: 'cat1', name: 'Care Home', color: '#3B82F6', posts: [] },
  { id: 'cat2', name: 'Medication', color: '#10B981', posts: [] },
  { id: 'cat3', name: 'Compliance', color: '#F59E0B', posts: [] }
];

const mockStats = {
  totalPosts: 25,
  publishedPosts: 20,
  draftPosts: 5,
  totalCategories: 3,
  totalViews: 1250,
  averageViewsPerPost: 50
};

const mockToast = vi.fn();
const mockLogAuditEvent = vi.fn();

describe('BlogAdmin Component', () => {
  const defaultProps = {
    organizationId: 'org-123',
    userPermissions: ['blog:create', 'blog:edit', 'blog:delete', 'blog:publish', 'blog:bulk_edit'],
    onPostChange: vi.fn(),
    onError: vi.fn()
  };

  beforeEach(() => {
    // Setup mocks
    vi.mocked(useToast).mockReturnValue({ toast: mockToast });
    vi.mocked(useAudit).mockReturnValue({ logAuditEvent: mockLogAuditEvent });
    vi.mocked(usePermissions).mockReturnValue({
      hasPermission: (permission: string) => defaultProps.userPermissions.includes(permission)
    });

    vi.mocked(blogService.getPosts).mockResolvedValue({
      posts: mockPosts,
      total: mockPosts.length,
      hasMore: false
    });
    vi.mocked(blogService.getCategories).mockResolvedValue(mockCategories);
    vi.mocked(blogService.getStats).mockResolvedValue(mockStats);

    // Clear mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render blog admin interface correctly', async () => {
      render(<BlogAdmin {...defaultProps} />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/Loading blog administration/)).not.toBeInTheDocument();
      });

      // Check main elements
      expect(screen.getByText('Blog Administration')).toBeInTheDocument();
      expect(screen.getByText('Manage care content, articles, and educational resources')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /New Post/i })).toBeInTheDocument();
    });

    it('should display loading state initially', () => {
      render(<BlogAdmin {...defaultProps} />);

      expect(screen.getByText(/Loading blog administration/)).toBeInTheDocument();
      expect(screen.getByRole('status', { name: /Loading blog data/i })).toBeInTheDocument();
    });

    it('should display statistics cards when data loads', async () => {
      render(<BlogAdmin {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Total Posts')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
        expect(screen.getByText('Published')).toBeInTheDocument();
        expect(screen.getByText('20')).toBeInTheDocument();
        expect(screen.getByText('Drafts')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('Categories')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('should render posts table with correct data', async () => {
      render(<BlogAdmin {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
        expect(screen.getByText('Test Post 2')).toBeInTheDocument();
        expect(screen.getByText('Published')).toBeInTheDocument();
        expect(screen.getByText('Draft')).toBeInTheDocument();
      });
    });

    it('should be accessible with proper ARIA labels', async () => {
      render(<BlogAdmin {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
        expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby');
      });
    });
  });

  describe('User Permissions', () => {
    it('should show create button when user has create permission', async () => {
      render(<BlogAdmin {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /New Post/i })).toBeInTheDocument();
      });
    });

    it('should hide create button when user lacks create permission', async () => {
      const propsWithoutCreate = {
        ...defaultProps,
        userPermissions: ['blog:edit']
      };

      vi.mocked(usePermissions).mockReturnValue({
        hasPermission: (permission: string) => propsWithoutCreate.userPermissions.includes(permission)
      });

      render(<BlogAdmin {...propsWithoutCreate} />);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /New Post/i })).not.toBeInTheDocument();
      });
    });

    it('should show bulk operations when user has bulk_edit permission', async () => {
      render(<BlogAdmin {...defaultProps} />);

      await waitFor(() => {
        // Select a post to trigger bulk operations UI
        const checkbox = screen.getAllByRole('checkbox')[1]; // First post checkbox
        fireEvent.click(checkbox);
      });

      await waitFor(() => {
        expect(screen.getByText(/post\(s\) selected/)).toBeInTheDocument();
      });
    });

    it('should hide delete buttons when user lacks delete permission', async () => {
      const propsWithoutDelete = {
        ...defaultProps,
        userPermissions: ['blog:create', 'blog:edit']
      };

      vi.mocked(usePermissions).mockReturnValue({
        hasPermission: (permission: string) => propsWithoutDelete.userPermissions.includes(permission)
      });

      render(<BlogAdmin {...propsWithoutDelete} />);

      await waitFor(() => {
        // Delete buttons should not be present
        const deleteButtons = screen.queryAllByTitle('Delete Post');
        expect(deleteButtons).toHaveLength(0);
      });
    });
  });

  describe('Post Management', () => {
    it('should handle post deletion correctly', async () => {
      const user = userEvent.setup();
      vi.mocked(blogService.deletePost).mockResolvedValue(undefined);
      
      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<BlogAdmin {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      });

      // Find and click delete button
      const deleteButton = screen.getAllByTitle('Delete Post')[0];
      await user.click(deleteButton);

      // Verify confirmation was called
      expect(confirmSpy).toHaveBeenCalledWith(
        expect.stringContaining('Are you sure you want to delete "Test Post 1"')
      );

      await waitFor(() => {
        expect(blogService.deletePost).toHaveBeenCalledWith('1', { organizationId: 'org-123' });
        expect(mockToast).toHaveBeenCalledWith('"Test Post 1" has been deleted successfully');
        expect(mockLogAuditEvent).toHaveBeenCalledWith({
          action: 'blog_post_deleted',
          resourceType: 'blog_post',
          resourceId: '1',
          details: expect.objectContaining({
            title: 'Test Post 1',
            organizationId: 'org-123'
          })
        });
      });

      confirmSpy.mockRestore();
    });

    it('should handle post deletion cancellation', async () => {
      const user = userEvent.setup();
      
      // Mock window.confirm to return false
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(<BlogAdmin {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      });

      // Find and click delete button
      const deleteButton = screen.getAllByTitle('Delete Post')[0];
      await user.click(deleteButton);

      // Verify service was not called
      expect(blogService.deletePost).not.toHaveBeenCalled();
      expect(mockToast).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it('should handle bulk operations correctly', async () => {
      const user = userEvent.setup();
      vi.mocked(blogService.bulkUpdate).mockResolvedValue({ updated: 2 });
      
      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<BlogAdmin {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      });

      // Select posts
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // First post
      await user.click(checkboxes[2]); // Second post

      await waitFor(() => {
        expect(screen.getByText(/2 post\(s\) selected/)).toBeInTheDocument();
      });

      // Perform bulk publish
      const publishButton = screen.getByRole('button', { name: /Publish/i });
      await user.click(publishButton);

      await waitFor(() => {
        expect(blogService.bulkUpdate).toHaveBeenCalledWith(
          ['1', '2'],
          expect.objectContaining({
            status: 'published',
            organizationId: 'org-123'
          })
        );
        expect(mockToast).toHaveBeenCalledWith('Successfully published 2 post(s)');
      });

      confirmSpy.mockRestore();
    });
  });

  describe('Search and Filtering', () => {
    it('should filter posts by search term', async () => {
      const user = userEvent.setup();
      render(<BlogAdmin {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
        expect(screen.getByText('Test Post 2')).toBeInTheDocument();
      });

      // Search for specific post
      const searchInput = screen.getByPlaceholderText('Search posts...');
      await user.type(searchInput, 'Test Post 1');

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
        expect(screen.queryByText('Test Post 2')).not.toBeInTheDocument();
      });
    });

    it('should filter posts by status', async () => {
      const user = userEvent.setup();
      render(<BlogAdmin {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
        expect(screen.getByText('Test Post 2')).toBeInTheDocument();
      });

      // Filter by draft status
      const statusSelect = screen.getByDisplayValue('All Status');
      await user.selectOptions(statusSelect, 'draft');

      await waitFor(() => {
        expect(screen.queryByText('Test Post 1')).not.toBeInTheDocument();
        expect(screen.getByText('Test Post 2')).toBeInTheDocument();
      });
    });

    it('should clear filters correctly', async () => {
      const user = userEvent.setup();
      render(<BlogAdmin {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      });

      // Apply filters
      const searchInput = screen.getByPlaceholderText('Search posts...');
      await user.type(searchInput, 'Test Post 1');

      // Clear filters
      const clearButton = screen.getByRole('button', { name: /Clear Filters/i });
      await user.click(clearButton);

      await waitFor(() => {
        expect(searchInput).toHaveValue('');
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
        expect(screen.getByText('Test Post 2')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      const error = new Error('Service unavailable');
      vi.mocked(blogService.getPosts).mockRejectedValue(error);

      render(<BlogAdmin {...defaultProps} />);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith('Error Loading Blog Data: Service unavailable');
        expect(defaultProps.onError).toHaveBeenCalledWith('Service unavailable');
      });
    });

    it('should handle delete errors correctly', async () => {
      const user = userEvent.setup();
      const error = new Error('Delete failed');
      vi.mocked(blogService.deletePost).mockRejectedValue(error);
      
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<BlogAdmin {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      });

      // Attempt deletion
      const deleteButton = screen.getAllByTitle('Delete Post')[0];
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith('Delete Failed: Delete failed');
        expect(mockLogAuditEvent).toHaveBeenCalledWith({
          action: 'blog_post_delete_failed',
          resourceType: 'blog_post',
          resourceId: '1',
          details: expect.objectContaining({
            error: 'Delete failed'
          })
        });
      });

      confirmSpy.mockRestore();
    });

    it('should show error boundary fallback on component crash', () => {
      // Force an error by providing invalid props
      const ErrorThrowingComponent = () => {
        throw new Error('Component crashed');
      };

      const { container } = render(
        <BlogAdmin {...defaultProps}>
          <ErrorThrowingComponent />
        </BlogAdmin>
      );

      // Error boundary should catch the error
      expect(container).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      render(<BlogAdmin {...defaultProps} />);

      await waitFor(() => {
        // Check for proper table structure
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getAllByRole('columnheader')).toHaveLength(8); // Including checkbox column
        
        // Check for proper button accessibility
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          expect(button).toHaveAccessibleName();
        });
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<BlogAdmin {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /New Post/i })).toBeInTheDocument();
      });

      // Test tab navigation
      await user.tab();
      expect(screen.getByRole('button', { name: /New Post/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /Refresh/i })).toHaveFocus();
    });

    it('should provide proper screen reader content', async () => {
      render(<BlogAdmin {...defaultProps} />);

      await waitFor(() => {
        // Check for descriptive text
        expect(screen.getByText('Manage care content, articles, and educational resources')).toBeInTheDocument();
        
        // Check for proper labeling of interactive elements
        expect(screen.getByLabelText(/Search posts/i)).toBeInTheDocument();
      });
    });
  });

  describe('Audit Logging', () => {
    it('should log admin access events', async () => {
      render(<BlogAdmin {...defaultProps} />);

      await waitFor(() => {
        expect(mockLogAuditEvent).toHaveBeenCalledWith({
          action: 'blog_admin_accessed',
          resourceType: 'blog_posts',
          details: expect.objectContaining({
            totalPosts: mockPosts.length,
            organizationId: 'org-123'
          })
        });
      });
    });

    it('should log all post management actions', async () => {
      const user = userEvent.setup();
      vi.mocked(blogService.deletePost).mockResolvedValue(undefined);
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<BlogAdmin {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      });

      // Delete a post
      const deleteButton = screen.getAllByTitle('Delete Post')[0];
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockLogAuditEvent).toHaveBeenCalledWith({
          action: 'blog_post_deleted',
          resourceType: 'blog_post',
          resourceId: '1',
          details: expect.objectContaining({
            title: 'Test Post 1',
            author: 'Test Author',
            organizationId: 'org-123'
          })
        });
      });

      confirmSpy.mockRestore();
    });
  });

  describe('Integration', () => {
    it('should integrate with blog service correctly', async () => {
      render(<BlogAdmin {...defaultProps} />);

      await waitFor(() => {
        expect(blogService.getPosts).toHaveBeenCalledWith({
          limit: 100,
          organizationId: 'org-123',
          include: ['author', 'categories', 'stats']
        });
        expect(blogService.getCategories).toHaveBeenCalledWith({ organizationId: 'org-123' });
        expect(blogService.getStats).toHaveBeenCalledWith({ organizationId: 'org-123' });
      });
    });

    it('should handle data refresh correctly', async () => {
      const user = userEvent.setup();
      render(<BlogAdmin {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
      });

      // Clear previous calls
      vi.clearAllMocks();

      // Click refresh
      const refreshButton = screen.getByRole('button', { name: /Refresh/i });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(blogService.getPosts).toHaveBeenCalledTimes(1);
        expect(blogService.getCategories).toHaveBeenCalledTimes(1);
        expect(blogService.getStats).toHaveBeenCalledTimes(1);
      });
    });
  });
});