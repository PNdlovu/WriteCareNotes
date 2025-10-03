import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ChevronUp, ChevronDown, Search, Filter } from 'lucide-react';

interface Column<T> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

interface AccessibleDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T, index: number) => void;
  onSort?: (column: keyof T, direction: 'asc' | 'desc') => void;
  onFilter?: (column: keyof T, value: string) => void;
  sortColumn?: keyof T;
  sortDirection?: 'asc' | 'desc';
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

/**
 * Accessible Data Table Component
 * Provides full WCAG 2.1 AA compliance with keyboard navigation and screen reader support
 */
export function AccessibleDataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  onSort,
  onFilter,
  sortColumn,
  sortDirection = 'asc',
  searchable = true,
  searchPlaceholder = 'Search table...',
  emptyMessage = 'No data available',
  loading = false,
  className = '',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props
}: AccessibleDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedRowIndex, setFocusedRowIndex] = useState<number | null>(null);
  const [focusedColumnIndex, setFocusedColumnIndex] = useState<number | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter data based on search term
  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(row =>
      columns.some(column => {
        const value = row[column.key];
        return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, columns]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTableElement>) => {
    const { key } = event;
    
    switch (key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedRowIndex(prev => {
          const nextIndex = prev === null ? 0 : Math.min(prev + 1, filteredData.length - 1);
          return nextIndex;
        });
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        setFocusedRowIndex(prev => {
          const nextIndex = prev === null ? filteredData.length - 1 : Math.max(prev - 1, 0);
          return nextIndex;
        });
        break;
        
      case 'ArrowRight':
        event.preventDefault();
        setFocusedColumnIndex(prev => {
          const nextIndex = prev === null ? 0 : Math.min(prev + 1, columns.length - 1);
          return nextIndex;
        });
        break;
        
      case 'ArrowLeft':
        event.preventDefault();
        setFocusedColumnIndex(prev => {
          const nextIndex = prev === null ? columns.length - 1 : Math.max(prev - 1, 0);
          return nextIndex;
        });
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedRowIndex !== null && onRowClick) {
          onRowClick(filteredData[focusedRowIndex], focusedRowIndex);
        }
        break;
        
      case 'Home':
        event.preventDefault();
        setFocusedRowIndex(0);
        setFocusedColumnIndex(0);
        break;
        
      case 'End':
        event.preventDefault();
        setFocusedRowIndex(filteredData.length - 1);
        setFocusedColumnIndex(columns.length - 1);
        break;
        
      case 'Escape':
        setFocusedRowIndex(null);
        setFocusedColumnIndex(null);
        break;
    }
  }, [filteredData, columns, onRowClick, focusedRowIndex]);

  // Handle column sorting
  const handleSort = useCallback((column: keyof T) => {
    if (!onSort) return;
    
    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(column, newDirection);
  }, [onSort, sortColumn, sortDirection]);

  // Handle search
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  // Focus management
  useEffect(() => {
    if (focusedRowIndex !== null && tableRef.current) {
      const row = tableRef.current.querySelector(`[data-row-index="${focusedRowIndex}"]`) as HTMLElement;
      if (row) {
        row.focus();
      }
    }
  }, [focusedRowIndex]);

  // Render sort indicator
  const renderSortIndicator = (column: Column<T>) => {
    if (!column.sortable) return null;
    
    const isActive = sortColumn === column.key;
    const direction = isActive ? sortDirection : 'asc';
    
    return (
      <button
        className="sort-indicator"
        onClick={() => handleSort(column.key)}
        aria-label={`Sort by ${column.title} ${isActive ? (direction === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}
        tabIndex={-1}
      >
        {direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
    );
  };

  return (
    <div className={`accessible-data-table ${className}`} {...props}>
      {/* Search and Controls */}
      {searchable && (
        <div className="table-controls" role="search" aria-label="Table search">
          <div className="search-container">
            <Search className="search-icon" size={16} />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              aria-label="Search table data"
              className="search-input"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-container" role="region" aria-label={ariaLabel || 'Data table'} aria-describedby={ariaDescribedBy}>
        <Table
          ref={tableRef}
          className="data-table"
          role="table"
          aria-label={ariaLabel || 'Data table'}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <TableHeader>
            <TableRow role="row">
              {columns.map((column, index) => (
                <TableHead
                  key={String(column.key)}
                  role="columnheader"
                  aria-sort={
                    column.sortable
                      ? sortColumn === column.key
                        ? sortDirection === 'asc' ? 'ascending' : 'descending'
                        : 'none'
                      : undefined
                  }
                  style={{ width: column.width }}
                  className={`column-header ${column.sortable ? 'sortable' : ''}`}
                >
                  <div className="column-header-content">
                    <span>{column.title}</span>
                    {renderSortIndicator(column)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="loading-cell">
                  <div className="loading-spinner" aria-label="Loading data">
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="empty-cell">
                  <div className="empty-message" role="status" aria-live="polite">
                    {emptyMessage}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  role="row"
                  data-row-index={rowIndex}
                  className={`data-row ${focusedRowIndex === rowIndex ? 'focused' : ''}`}
                  onClick={() => onRowClick?.(row, rowIndex)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onRowClick?.(row, rowIndex);
                    }
                  }}
                  tabIndex={focusedRowIndex === rowIndex ? 0 : -1}
                  aria-label={`Row ${rowIndex + 1} of ${filteredData.length}`}
                >
                  {columns.map((column, colIndex) => (
                    <TableCell
                      key={String(column.key)}
                      role="gridcell"
                      className={`data-cell ${focusedColumnIndex === colIndex ? 'focused' : ''}`}
                      tabIndex={focusedRowIndex === rowIndex && focusedColumnIndex === colIndex ? 0 : -1}
                    >
                      {column.render ? column.render(row[column.key], row) : String(row[column.key] || '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Table Summary */}
      <div className="table-summary" role="status" aria-live="polite">
        Showing {filteredData.length} of {data.length} rows
        {searchTerm && ` matching "${searchTerm}"`}
      </div>
    </div>
  );
}

export default AccessibleDataTable;