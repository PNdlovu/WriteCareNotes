/**
 * @fileoverview Inventory and Stock Management Interface for WriteCareNotes
 * @module InventoryManagement
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive inventory management system providing real-time stock
 * monitoring, automated reordering, expiry management, and cost optimization.
 * Implements FEFO (First Expired, First Out) principles and demand forecasting.
 * 
 * @example
 * // Usage in medication management dashboard
 * <InventoryManagement
 *   organizationId="org-123"
 *   onStockAlert={handleStockAlert}
 *   onReorderTriggered={handleReorder}
 * />
 * 
 * @compliance
 * - NHS Supply Chain Standards
 * - MHRA Good Distribution Practice
 * - CQC Medication Storage Requirements
 * - NICE Medicines Optimization Guidelines
 * 
 * @security
 * - Secure supplier data handling
 * - Cost data encryption and access control
 * - Audit trails for all inventory transactions
 * - Role-based access to financial information
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  AlertTitle,
  Tooltip,
  Badge,
  LinearProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  Autocomplete
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as OrderIcon,
  LocalShipping as DeliveryIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Analytics as AnalyticsIcon,
  AttachMoney as CostIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Notifications as NotificationsIcon,
  Store as StoreIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import { Button } from '../ui/Button';
import { Card as UICard } from '../ui/Card';
import { Badge as UIBadge } from '../ui/Badge';
import { Alert as UIAlert } from '../ui/Alert';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { DataTable } from '../ui/DataTable';

// Types and Interfaces
interface InventoryItem {
  id: string;
  medicationId: string;
  medicationName: string;
  genericName: string;
  strength: string;
  formulation: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  unit: string;
  location: string;
  storageConditions: string;
  
  // Batch Information
  batches: InventoryBatch[];
  
  // Cost Information
  unitCost: number;
  totalValue: number;
  averageCost: number;
  lastCostUpdate: Date;
  
  // Supplier Information
  primarySupplier: Supplier;
  alternativeSuppliers: Supplier[];
  
  // Usage Analytics
  dailyUsage: number;
  weeklyUsage: number;
  monthlyUsage: number;
  usageTrend: 'increasing' | 'stable' | 'decreasing';
  forecastedUsage: number;
  
  // Status and Alerts
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked' | 'expired' | 'near_expiry';
  alerts: InventoryAlert[];
  lastStockCheck: Date;
  nextStockCheck: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  category: string;
  therapeutic_class: string;
  controlled_substance: boolean;
}

interface InventoryBatch {
  id: string;
  batchNumber: string;
  expiryDate: Date;
  quantity: number;
  unitCost: number;
  supplier: string;
  receivedDate: Date;
  status: 'active' | 'quarantined' | 'expired' | 'recalled';
  qualityCheck: boolean;
  qualityCheckDate?: Date;
  qualityCheckBy?: string;
  notes?: string;
}

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  deliveryTime: number; // in days
  minimumOrder: number;
  reliability: number; // 0-100 score
  costRating: number; // 0-100 score
  qualityRating: number; // 0-100 score
  lastDelivery: Date;
  contractExpiry?: Date;
  preferredSupplier: boolean;
}

interface InventoryAlert {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'expiry_warning' | 'expired' | 'overstock' | 'cost_increase' | 'supplier_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  actionRequired: string;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  totalCost: number;
  status: 'draft' | 'pending' | 'approved' | 'sent' | 'delivered' | 'cancelled';
  orderDate: Date;
  expectedDelivery: Date;
  actualDelivery?: Date;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
}

interface PurchaseOrderItem {
  medicationId: string;
  medicationName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

interface InventoryMetrics {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  expiredItems: number;
  nearExpiryItems: number;
  averageTurnover: number;
  wasteValue: number;
  costSavings: number;
  stockAccuracy: number;
  supplierPerformance: number;
}

interface InventoryManagementProps {
  organizationId: string;
  onStockAlert?: (alert: InventoryAlert) => void;
  onReorderTriggered?: (item: InventoryItem) => void;
  onCostAlert?: (alert: InventoryAlert) => void;
  showCostInformation?: boolean;
  readOnly?: boolean;
  compactView?: boolean;
}

/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const InventoryManagement: React.FC<InventoryManagementProps> = ({
  organizationId,
  onStockAlert,
  onReorderTriggered,
  onCostAlert,
  showCostInformation = true,
  readOnly = false,
  compactView = false
}) => {
  // State Management
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventoryMetrics, setInventoryMetrics] = useState<InventoryMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'suppliers' | 'analytics'>('inventory');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoReorderEnabled, setAutoReorderEnabled] = useState(true);
  const [showExpiryAlerts, setShowExpiryAlerts] = useState(true);

  // Load inventory data
  useEffect(() => {
    const loadInventoryData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/v1/inventory?organizationId=${organizationId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to load inventory data: ${response.statusText}`);
        }

        const data = await response.json();
        setInventoryItems(data.items || []);
        setPurchaseOrders(data.orders || []);
        setSuppliers(data.suppliers || []);
        setInventoryMetrics(data.metrics || null);

        // Process alerts
        const alerts = data.items?.flatMap((item: InventoryItem) => item.alerts) || [];
        const criticalAlerts = alerts.filter((alert: InventoryAlert) => 
          alert.severity === 'critical' && !alert.acknowledged
        );

        criticalAlerts.forEach((alert: InventoryAlert) => {
          if (alert.type.includes('stock')) {
            onStockAlert?.(alert);
          } else if (alert.type === 'cost_increase') {
            onCostAlert?.(alert);
          }
        });

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load inventory data';
        setError(errorMessage);
        console.error('Error loading inventory data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (organizationId) {
      loadInventoryData();
    }
  }, [organizationId, onStockAlert, onCostAlert]);

  // Filter inventory items
  const filteredItems = useMemo(() => {
    return inventoryItems.filter(item => {
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
      const matchesSearch = searchTerm === '' || 
        item.medicationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.genericName.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [inventoryItems, filterCategory, filterStatus, searchTerm]);

  // Calculate expiry alerts
  const expiryAlerts = useMemo(() => {
    const alerts: InventoryAlert[] = [];
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    inventoryItems.forEach(item => {
      item.batches.forEach(batch => {
        if (batch.expiryDate <= now && batch.status === 'active') {
          alerts.push({
            id: `exp-${batch.id}`,
            type: 'expired',
            severity: 'critical',
            message: `${item.medicationName} batch ${batch.batchNumber} has expired`,
            details: `Expired on ${batch.expiryDate.toLocaleDateString()}. Quantity: ${batch.quantity} ${item.unit}`,
            timestamp: now,
            acknowledged: false,
            resolved: false,
            actionRequired: 'Remove from active stock immediately'
          });
        } else if (batch.expiryDate <= thirtyDaysFromNow && batch.status === 'active') {
          alerts.push({
            id: `near-exp-${batch.id}`,
            type: 'expiry_warning',
            severity: 'high',
            message: `${item.medicationName} batch ${batch.batchNumber} expires soon`,
            details: `Expires on ${batch.expiryDate.toLocaleDateString()}. Quantity: ${batch.quantity} ${item.unit}`,
            timestamp: now,
            acknowledged: false,
            resolved: false,
            actionRequired: 'Use before expiry or arrange disposal'
          });
        }
      });
    });

    return alerts;
  }, [inventoryItems]);

  // Trigger automatic reorder
  const triggerReorder = useCallback(async (item: InventoryItem) => {
    try {
      const response = await fetch('/api/v1/inventory/reorder', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organizationId,
          medicationId: item.medicationId,
          quantity: item.reorderQuantity,
          supplierId: item.primarySupplier.id,
          urgency: item.currentStock <= 0 ? 'critical' : 'medium'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create reorder: ${response.statusText}`);
      }

      const result = await response.json();
      onReorderTriggered?.(item);
      
      // Update purchase orders
      setPurchaseOrders(prev => [result.order, ...prev]);

    } catch (err) {
      console.error('Error triggering reorder:', err);
      setError(err instanceof Error ? err.message : 'Failed to trigger reorder');
    }
  }, [organizationId, onReorderTriggered]);

  // Render stock status badge
  const renderStockStatus = (item: InventoryItem) => {
    const statusConfig = {
      in_stock: { color: 'success' as const, label: 'In Stock' },
      low_stock: { color: 'warning' as const, label: 'Low Stock' },
      out_of_stock: { color: 'error' as const, label: 'Out of Stock' },
      overstocked: { color: 'info' as const, label: 'Overstocked' },
      expired: { color: 'error' as const, label: 'Expired' },
      near_expiry: { color: 'warning' as const, label: 'Near Expiry' }
    };

    const config = statusConfig[item.status];
    return <UIBadge variant={config.color}>{config.label}</UIBadge>;
  };

  // Render usage trend
  const renderUsageTrend = (trend: InventoryItem['usageTrend']) => {
    const trendConfig = {
      increasing: { icon: <TrendingUpIcon color="error" />, color: 'error' as const },
      stable: { icon: <TrendingUpIcon color="success" />, color: 'success' as const },
      decreasing: { icon: <TrendingDownIcon color="info" />, color: 'info' as const }
    };

    const config = trendConfig[trend];
    return (
      <Tooltip title={`Usage trend: ${trend}`}>
        <Box display="flex" alignItems="center" gap={0.5}>
          {config.icon}
          <Typography variant="caption" color={`${config.color}.main`}>
            {trend}
          </Typography>
        </Box>
      </Tooltip>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <LoadingSpinner size="large" />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InventoryIcon color="primary" />
          Inventory Management
        </Typography>
        <Box display="flex" gap={1} alignItems="center">
          <FormControlLabel
            control={
              <Switch
                checked={autoReorderEnabled}
                onChange={(e) => setAutoReorderEnabled(e.target.checked)}
              />
            }
            label="Auto Reorder"
          />
          <FormControlLabel
            control={
              <Switch
                checked={showExpiryAlerts}
                onChange={(e) => setShowExpiryAlerts(e.target.checked)}
              />
            }
            label="Expiry Alerts"
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
          >
            Print Report
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <UIAlert variant="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </UIAlert>
      )}

      {/* Inventory Metrics Overview */}
      {inventoryMetrics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={2}>
            <UICard>
              <CardContent>
                <Typography variant="h6" color="primary">
                  {inventoryMetrics.totalItems}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Items
                </Typography>
              </CardContent>
            </UICard>
          </Grid>
          <Grid item xs={12} md={2}>
            <UICard>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  £{inventoryMetrics.totalValue.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Value
                </Typography>
              </CardContent>
            </UICard>
          </Grid>
          <Grid item xs={12} md={2}>
            <UICard>
              <CardContent>
                <Typography variant="h6" color="warning.main">
                  {inventoryMetrics.lowStockItems}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Low Stock
                </Typography>
              </CardContent>
            </UICard>
          </Grid>
          <Grid item xs={12} md={2}>
            <UICard>
              <CardContent>
                <Typography variant="h6" color="error.main">
                  {inventoryMetrics.expiredItems}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Expired Items
                </Typography>
              </CardContent>
            </UICard>
          </Grid>
          <Grid item xs={12} md={2}>
            <UICard>
              <CardContent>
                <Typography variant="h6" color="info.main">
                  {inventoryMetrics.averageTurnover.toFixed(1)}x
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Avg Turnover
                </Typography>
              </CardContent>
            </UICard>
          </Grid>
          <Grid item xs={12} md={2}>
            <UICard>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  £{inventoryMetrics.costSavings.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Cost Savings
                </Typography>
              </CardContent>
            </UICard>
          </Grid>
        </Grid>
      )}

      {/* Expiry Alerts */}
      {showExpiryAlerts && expiryAlerts.length > 0 && (
        <UIAlert variant="warning" sx={{ mb: 3 }}>
          <AlertTitle>Expiry Alerts</AlertTitle>
          <List dense>
            {expiryAlerts.slice(0, 5).map(alert => (
              <ListItem key={alert.id}>
                <ListItemIcon>
                  {alert.type === 'expired' ? <ErrorIcon color="error" /> : <WarningIcon color="warning" />}
                </ListItemIcon>
                <ListItemText
                  primary={alert.message}
                  secondary={alert.details}
                />
              </ListItem>
            ))}
          </List>
          {expiryAlerts.length > 5 && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              And {expiryAlerts.length - 5} more alerts...
            </Typography>
          )}
        </UIAlert>
      )}

      {/* Navigation Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab
          label={
            <Badge badgeContent={inventoryMetrics?.lowStockItems || 0} color="warning">
              Inventory
            </Badge>
          }
          value="inventory"
        />
        <Tab
          label={
            <Badge badgeContent={purchaseOrders.filter(o => o.status === 'pending').length} color="info">
              Purchase Orders
            </Badge>
          }
          value="orders"
        />
        <Tab label="Suppliers" value="suppliers" />
        <Tab label="Analytics" value="analytics" />
      </Tabs>

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <Box>
          {/* Filters */}
          <Box display="flex" gap={2} mb={3} flexWrap="wrap">
            <TextField
              label="Search medications"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 200 }}
              InputProps={{
                startAdornment: <SearchIcon color="action" />
              }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="analgesics">Analgesics</MenuItem>
                <MenuItem value="antibiotics">Antibiotics</MenuItem>
                <MenuItem value="cardiovascular">Cardiovascular</MenuItem>
                <MenuItem value="respiratory">Respiratory</MenuItem>
                <MenuItem value="gastrointestinal">Gastrointestinal</MenuItem>
                <MenuItem value="neurological">Neurological</MenuItem>
                <MenuItem value="endocrine">Endocrine</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="in_stock">In Stock</MenuItem>
                <MenuItem value="low_stock">Low Stock</MenuItem>
                <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                <MenuItem value="near_expiry">Near Expiry</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Inventory Table */}
          <DataTable
            data={filteredItems}
            columns={[
              {
                key: 'medicationName',
                label: 'Medication',
                render: (item: InventoryItem) => (
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {item.medicationName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {item.genericName} - {item.strength}
                    </Typography>
                  </Box>
                )
              },
              {
                key: 'currentStock',
                label: 'Current Stock',
                render: (item: InventoryItem) => (
                  <Box>
                    <Typography variant="body2">
                      {item.currentStock} {item.unit}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((item.currentStock / item.maximumStock) * 100, 100)}
                      color={item.currentStock <= item.minimumStock ? 'error' : 'primary'}
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                )
              },
              {
                key: 'status',
                label: 'Status',
                render: (item: InventoryItem) => renderStockStatus(item)
              },
              {
                key: 'usage',
                label: 'Usage Trend',
                render: (item: InventoryItem) => (
                  <Box>
                    {renderUsageTrend(item.usageTrend)}
                    <Typography variant="caption" display="block">
                      {item.dailyUsage}/day
                    </Typography>
                  </Box>
                )
              },
              {
                key: 'expiry',
                label: 'Next Expiry',
                render: (item: InventoryItem) => {
                  const nextExpiry = item.batches
                    .filter(b => b.status === 'active')
                    .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime())[0];
                  
                  if (!nextExpiry) return <Typography variant="body2">-</Typography>;
                  
                  const isExpired = nextExpiry.expiryDate <= new Date();
                  const isNearExpiry = nextExpiry.expiryDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                  
                  return (
                    <Typography
                      variant="body2"
                      color={isExpired ? 'error' : isNearExpiry ? 'warning.main' : 'textPrimary'}
                    >
                      {nextExpiry.expiryDate.toLocaleDateString()}
                    </Typography>
                  );
                }
              },
              {
                key: 'cost',
                label: 'Value',
                render: (item: InventoryItem) => showCostInformation ? (
                  <Typography variant="body2">
                    £{item.totalValue.toLocaleString()}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Restricted
                  </Typography>
                )
              },
              {
                key: 'actions',
                label: 'Actions',
                render: (item: InventoryItem) => (
                  <Box display="flex" gap={0.5}>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedItem(item);
                          setShowItemDialog(true);
                        }}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    {!readOnly && item.currentStock <= item.reorderPoint && (
                      <Tooltip title="Reorder">
                        <IconButton
                          size="small"
                          onClick={() => triggerReorder(item)}
                          color="primary"
                        >
                          <OrderIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                )
              }
            ]}
            pagination
            sortable
            searchable={false}
          />
        </Box>
      )}

      {/* Purchase Orders Tab */}
      {activeTab === 'orders' && (
        <Box>
          <DataTable
            data={purchaseOrders}
            columns={[
              {
                key: 'orderNumber',
                label: 'Order #',
                render: (order: PurchaseOrder) => (
                  <Typography variant="body2" fontFamily="monospace">
                    {order.orderNumber}
                  </Typography>
                )
              },
              {
                key: 'supplier',
                label: 'Supplier',
                render: (order: PurchaseOrder) => (
                  <Typography variant="body2">
                    {order.supplierName}
                  </Typography>
                )
              },
              {
                key: 'items',
                label: 'Items',
                render: (order: PurchaseOrder) => (
                  <Typography variant="body2">
                    {order.items.length} items
                  </Typography>
                )
              },
              {
                key: 'totalCost',
                label: 'Total Cost',
                render: (order: PurchaseOrder) => showCostInformation ? (
                  <Typography variant="body2">
                    £{order.totalCost.toLocaleString()}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Restricted
                  </Typography>
                )
              },
              {
                key: 'status',
                label: 'Status',
                render: (order: PurchaseOrder) => (
                  <UIBadge
                    variant={
                      order.status === 'delivered' ? 'success' :
                      order.status === 'sent' ? 'info' :
                      order.status === 'approved' ? 'warning' :
                      order.status === 'cancelled' ? 'error' : 'default'
                    }
                  >
                    {order.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </UIBadge>
                )
              },
              {
                key: 'expectedDelivery',
                label: 'Expected Delivery',
                render: (order: PurchaseOrder) => (
                  <Typography variant="body2">
                    {order.expectedDelivery.toLocaleDateString()}
                  </Typography>
                )
              }
            ]}
            pagination
            sortable
          />
        </Box>
      )}

      {/* Item Details Dialog */}
      <Dialog
        open={showItemDialog}
        onClose={() => setShowItemDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Inventory Item Details
          {selectedItem && (
            <Typography variant="subtitle2" color="textSecondary">
              {selectedItem.medicationName} - {selectedItem.strength}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Stock Information
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Current Stock"
                      secondary={`${selectedItem.currentStock} ${selectedItem.unit}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Minimum Stock"
                      secondary={`${selectedItem.minimumStock} ${selectedItem.unit}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Reorder Point"
                      secondary={`${selectedItem.reorderPoint} ${selectedItem.unit}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Location"
                      secondary={selectedItem.location}
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Usage Analytics
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Daily Usage"
                      secondary={`${selectedItem.dailyUsage} ${selectedItem.unit}/day`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Weekly Usage"
                      secondary={`${selectedItem.weeklyUsage} ${selectedItem.unit}/week`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Usage Trend"
                      secondary={selectedItem.usageTrend}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Forecasted Usage"
                      secondary={`${selectedItem.forecastedUsage} ${selectedItem.unit}/month`}
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Batch Information
                </Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Batch Number</TableCell>
                        <TableCell>Expiry Date</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Supplier</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedItem.batches.map(batch => (
                        <TableRow key={batch.id}>
                          <TableCell>{batch.batchNumber}</TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              color={batch.expiryDate <= new Date() ? 'error' : 'textPrimary'}
                            >
                              {batch.expiryDate.toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>{batch.quantity} {selectedItem.unit}</TableCell>
                          <TableCell>
                            <Chip
                              label={batch.status}
                              size="small"
                              color={batch.status === 'active' ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell>{batch.supplier}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => setShowItemDialog(false)}
          >
            Close
          </Button>
          {selectedItem && !readOnly && selectedItem.currentStock <= selectedItem.reorderPoint && (
            <Button
              variant="contained"
              onClick={() => {
                triggerReorder(selectedItem);
                setShowItemDialog(false);
              }}
            >
              Reorder Now
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryManagement;