import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';
import { AccessibleButton } from '../../frontend/src/components/accessibility/AccessibleButton';
import { AccessibleDataTable } from '../../frontend/src/components/accessibility/AccessibleDataTable';
import { AccessibleModal } from '../../frontend/src/components/accessibility/AccessibleModal';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  describe('AccessibleButton', () => {
    test('should not have accessibility violations', async () => {
      const { container } = render(
        <AccessibleButton ariaLabel="Test button">
          Click me
        </AccessibleButton>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should support keyboard navigation', () => {
      const { getByRole } = render(
        <AccessibleButton ariaLabel="Test button">
          Click me
        </AccessibleButton>
      );
      
      const button = getByRole('button');
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    test('should have proper ARIA attributes', () => {
      const { getByRole } = render(
        <AccessibleButton 
          ariaLabel="Test button"
          ariaDescribedBy="button-description"
          ariaPressed={true}
        >
          Click me
        </AccessibleButton>
      );
      
      const button = getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Test button');
      expect(button).toHaveAttribute('aria-describedby', 'button-description');
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    test('should be disabled when loading', () => {
      const { getByRole } = render(
        <AccessibleButton loading={true}>
          Click me
        </AccessibleButton>
      );
      
      const button = getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('AccessibleDataTable', () => {
    const mockData = [
      { id: 1, name: 'John Doe', age: 30 },
      { id: 2, name: 'Jane Smith', age: 25 },
    ];

    const mockColumns = [
      { key: 'id', title: 'ID', sortable: true },
      { key: 'name', title: 'Name', sortable: true },
      { key: 'age', title: 'Age', sortable: true },
    ];

    test('should not have accessibility violations', async () => {
      const { container } = render(
        <AccessibleDataTable
          data={mockData}
          columns={mockColumns}
          ariaLabel="Test data table"
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have proper table structure', () => {
      const { getByRole } = render(
        <AccessibleDataTable
          data={mockData}
          columns={mockColumns}
          ariaLabel="Test data table"
        />
      );
      
      const table = getByRole('table');
      expect(table).toBeInTheDocument();
      
      const columnHeaders = table.querySelectorAll('[role="columnheader"]');
      expect(columnHeaders).toHaveLength(3);
      
      const rows = table.querySelectorAll('[role="row"]');
      expect(rows).toHaveLength(3); // Header + 2 data rows
    });

    test('should support keyboard navigation', () => {
      const { getByRole } = render(
        <AccessibleDataTable
          data={mockData}
          columns={mockColumns}
          ariaLabel="Test data table"
        />
      );
      
      const table = getByRole('table');
      table.focus();
      expect(document.activeElement).toBe(table);
    });
  });

  describe('AccessibleModal', () => {
    test('should not have accessibility violations when open', async () => {
      const { container } = render(
        <AccessibleModal
          isOpen={true}
          onClose={() => {}}
          title="Test Modal"
        >
          <p>Modal content</p>
        </AccessibleModal>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have proper modal attributes', () => {
      const { getByRole } = render(
        <AccessibleModal
          isOpen={true}
          onClose={() => {}}
          title="Test Modal"
        >
          <p>Modal content</p>
        </AccessibleModal>
      );
      
      const dialog = getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    test('should not render when closed', () => {
      const { queryByRole } = render(
        <AccessibleModal
          isOpen={false}
          onClose={() => {}}
          title="Test Modal"
        >
          <p>Modal content</p>
        </AccessibleModal>
      );
      
      const dialog = queryByRole('dialog');
      expect(dialog).not.toBeInTheDocument();
    });
  });

  describe('Color Contrast', () => {
    test('should have sufficient color contrast', async () => {
      const { container } = render(
        <div>
          <button style={{ backgroundColor: '#000', color: '#fff' }}>
            High contrast button
          </button>
          <p style={{ color: '#333' }}>
            Text with sufficient contrast
          </p>
        </div>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Focus Management', () => {
    test('should manage focus properly', () => {
      const { getByRole } = render(
        <div>
          <button>First button</button>
          <AccessibleButton ariaLabel="Second button">
            Second button
          </AccessibleButton>
          <button>Third button</button>
        </div>
      );
      
      const buttons = getAllByRole('button');
      buttons[1].focus();
      expect(document.activeElement).toBe(buttons[1]);
    });
  });

  describe('Screen Reader Support', () => {
    test('should have proper ARIA labels', () => {
      const { getByLabelText } = render(
        <AccessibleButton ariaLabel="Close dialog">
          ×
        </AccessibleButton>
      );
      
      const button = getByLabelText('Close dialog');
      expect(button).toBeInTheDocument();
    });

    test('should have proper heading structure', () => {
      const { container } = render(
        <div>
          <h1>Main Heading</h1>
          <h2>Section Heading</h2>
          <h3>Subsection Heading</h3>
        </div>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    test('should support Tab navigation', () => {
      const { getByRole } = render(
        <div>
          <AccessibleButton ariaLabel="First button">First</AccessibleButton>
          <AccessibleButton ariaLabel="Second button">Second</AccessibleButton>
          <AccessibleButton ariaLabel="Third button">Third</AccessibleButton>
        </div>
      );
      
      const buttons = getAllByRole('button');
      
      // Test Tab navigation
      buttons[0].focus();
      expect(document.activeElement).toBe(buttons[0]);
      
      // Simulate Tab key
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      buttons[0].dispatchEvent(tabEvent);
      
      // Focus should move to next button
      expect(document.activeElement).toBe(buttons[1]);
    });

    test('should support Enter and Space activation', () => {
      const mockOnClick = jest.fn();
      const { getByRole } = render(
        <AccessibleButton onClick={mockOnClick} ariaLabel="Test button">
          Click me
        </AccessibleButton>
      );
      
      const button = getByRole('button');
      
      // Test Enter key
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      button.dispatchEvent(enterEvent);
      expect(mockOnClick).toHaveBeenCalled();
      
      // Test Space key
      mockOnClick.mockClear();
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      button.dispatchEvent(spaceEvent);
      expect(mockOnClick).toHaveBeenCalled();
    });
  });

  describe('Form Accessibility', () => {
    test('should have proper form labels', () => {
      const { container } = render(
        <form>
          <label htmlFor="name">Name</label>
          <input id="name" type="text" />
          
          <label htmlFor="email">Email</label>
          <input id="email" type="email" />
        </form>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have proper fieldset and legend', () => {
      const { container } = render(
        <form>
          <fieldset>
            <legend>Personal Information</legend>
            <label htmlFor="first-name">First Name</label>
            <input id="first-name" type="text" />
            
            <label htmlFor="last-name">Last Name</label>
            <input id="last-name" type="text" />
          </fieldset>
        </form>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});