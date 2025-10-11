/**
 * @fileoverview Inventory Service Interfaces for WriteCareNotes
 * @module InventoryInterfaces
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive interfaces for inventory management operations
 * including medical supply and equipment inventory, automated reordering,
 * supplier management, asset tracking, and barcode scanning capabilities.
 * 
 * @compliance
 * - Medical Device Regulations (MDR)
 * - MHRA requirements for medical supplies
 * - CQC inventory management standards
 * - GDPR data protection for supplier information
 */

export interface CreateInventoryItemRequest {
  itemCode: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  
  // Stock management
  initialStock?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderLevel?: number;
  reorderQuantity?: number;
  
  // Pricing and costs
  unitCost?: number;
  unitPrice?: number;
  currency?: string;
  
  // Physical properties
  unit: string; // 'each', 'box', 'bottle', 'kg', 'litre', etc.
  weight?: number;
  dimensions?: ItemDimensions;
  
  // Storage and location
  storageLocation?: string;
  storageRequirements?: string[];
  temperatureRange?: TemperatureRange;
  
  // Supplier information
  primarySupplierId?: string;
  alternativeSupplierIds?: string[];
  
  // Compliance and safety
  isControlledSubstance?: boolean;
  requiresPrescription?: boolean;
  medicalDeviceClass?: 'I' | 'IIa' | 'IIb' | 'III';
  regulatoryApprovals?: RegulatoryApproval[];
  
  // Expiry and maintenance
  hasExpiryDate?: boolean;
  shelfLifeDays?: number;
  requiresMaintenance?: boolean;
  maintenanceIntervalDays?: number;
  
  // Barcode and identification
  barcode?: string;
  manufacturerCode?: string;
  batchTracking?: boolean;
  serialNumberTracking?: boolean;
  
  // Automation
  autoReorder?: boolean;
  criticalItem?: boolean;
  
  // System fields
  careHomeId: string;
  createdBy: string;
}

export interface UpdateInventoryItemRequest {
  inventoryItemId: string;
  name?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  
  // Stock levels
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderLevel?: number;
  reorderQuantity?: number;
  
  // Pricing
  unitCost?: number;
  unitPrice?: number;
  
  // Storage
  storageLocation?: string;
  storageRequirements?: string[];
  temperatureRange?: TemperatureRange;
  
  // Supplier updates
  primarySupplierId?: string;
  alternativeSupplierIds?: string[];
  
  // Status
  status?: 'active' | 'inactive' | 'discontinued';
  
  // Automation
  autoReorder?: boolean;
  
  // System fields
  updatedBy: string;
}

export interface CreatePurchaseOrderRequest {
  supplierId: string;
  orderItems: PurchaseOrderItemRequest[];
  
  // Order details
  priority: 'low' | 'normal' | 'high' | 'urgent';
  requestedDeliveryDate?: Date;
  deliveryAddress?: Address;
  
  // Financial
  currency: string;
  paymentTerms?: string;
  discountPercentage?: number;
  
  // Notes and references
  notes?: string;
  internalReference?: string;
  supplierReference?: string;
  
  // Approval
  requiresApproval?: boolean;
  approvalLimit?: number;
  
  // System fields
  careHomeId: string;
  createdBy: string;
}

export interface PurchaseOrderItemRequest {
  inventoryItemId: string;
  quantity: number;
  unitPrice: number;
  
  // Specifications
  specifications?: string;
  brandPreference?: string;
  
  // Delivery
  expectedDeliveryDate?: Date;
  partialDeliveryAccepted?: boolean;
  
  // Quality requirements
  qualityStandards?: string[];
  certificationRequired?: boolean;
}

export interface CreateSupplierRequest {
  name: string;
  supplierCode?: string;
  
  // Contact information
  contactPerson: string;
  email: string;
  phone: string;
  alternativePhone?: string;
  website?: string;
  
  // Address
  address: Address;
  billingAddress?: Address;
  
  // Business details
  companyRegistrationNumber?: string;
  vatNumber?: string;
  taxId?: string;
  
  // Trading terms
  paymentTerms: string;
  creditLimit?: number;
  currency: string;
  leadTimeDays: number;
  minimumOrderValue?: number;
  autoApprovalLimit?: number;
  
  // Categories and capabilities
  supplierCategories: string[];
  certifications?: string[];
  qualityRating?: number;
  
  // Compliance
  gdprCompliant?: boolean;
  iso9001Certified?: boolean;
  medicalDeviceLicense?: string;
  
  // Performance metrics
  onTimeDeliveryRate?: number;
  qualityScore?: number;
  
  // System fields
  careHomeId: string;
  createdBy: string;
}

export interface StockMovementRequest {
  inventoryItemId: string;
  movementType: 'stock_in' | 'stock_out' | 'adjustment' | 'transfer' | 'reserved' | 'unreserved' | 'expired' | 'damaged';
  quantity: number;
  
  // Movement details
  reason: string;
  reference?: string;
  batchNumber?: string;
  serialNumbers?: string[];
  expiryDate?: Date;
  
  // Location information
  fromLocation?: string;
  toLocation?: string;
  
  // Cost information
  unitCost?: number;
  totalCost?: number;
  
  // Quality and condition
  qualityStatus?: 'good' | 'damaged' | 'expired' | 'recalled';
  conditionNotes?: string;
  
  // Documentation
  documentReference?: string;
  attachments?: string[];
  
  // System fields
  performedBy: string;
}

export interface MaintenanceScheduleRequest {
  inventoryItemId: string;
  maintenanceType: 'preventive' | 'corrective' | 'calibration' | 'inspection' | 'cleaning';
  
  // Scheduling
  scheduledDate: Date;
  estimatedDuration?: number; // minutes
  priority: 'low' | 'normal' | 'high' | 'critical';
  
  // Maintenance details
  description: string;
  instructions?: string;
  requiredSkills?: string[];
  requiredTools?: string[];
  requiredParts?: MaintenancePartRequest[];
  
  // Service provider
  internalMaintenance?: boolean;
  serviceProviderId?: string;
  estimatedCost?: number;
  
  // Compliance
  regulatoryRequirement?: boolean;
  complianceStandard?: string;
  certificationRequired?: boolean;
  
  // System fields
  careHomeId: string;
  scheduledBy: string;
}

export interface MaintenancePartRequest {
  inventoryItemId: string;
  quantity: number;
  description?: string;
}

export interface InventorySearchFilters {
  careHomeId?: string;
  category?: string;
  subcategory?: string;
  supplierId?: string;
  
  // Stock filters
  lowStock?: boolean;
  outOfStock?: boolean;
  overStock?: boolean;
  criticalItems?: boolean;
  
  // Status filters
  status?: 'active' | 'inactive' | 'discontinued';
  
  // Expiry filters
  expiringBefore?: Date;
  expiredItems?: boolean;
  
  // Location filters
  storageLocation?: string;
  
  // Search terms
  searchTerm?: string; // Search in name, description, item code
  barcode?: string;
  
  // Pagination
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BarcodeRequest {
  barcode: string;
  operation: 'stock_check' | 'stock_in' | 'stock_out' | 'location_update' | 'maintenance_check';
  
  // Operation-specific data
  quantity?: number;
  location?: string;
  batchNumber?: string;
  expiryDate?: Date;
  notes?: string;
  
  // System fields
  scannedBy: string;
  scannedAt?: Date;
}

export interface InventoryReportRequest {
  reportType: 'stock_levels' | 'low_stock' | 'expiry_report' | 'movement_history' | 'supplier_performance' | 'cost_analysis' | 'usage_trends';
  careHomeId: string;
  
  // Time period
  period: 'current_month' | 'last_month' | 'current_quarter' | 'last_quarter' | 'current_year' | 'last_year' | 'custom';
  startDate?: Date;
  endDate?: Date;
  
  // Filters
  categories?: string[];
  suppliers?: string[];
  locations?: string[];
  
  // Report options
  format: 'json' | 'pdf' | 'excel' | 'csv';
  includeCharts?: boolean;
  includeDetails?: boolean;
  groupBy?: 'category' | 'supplier' | 'location' | 'month';
  
  // Cache control
  forceRefresh?: boolean;
  
  // System fields
  generatedBy: string;
}

export interface AssetTagRequest {
  inventoryItemId: string;
  tagType: 'qr_code' | 'rfid' | 'nfc' | 'barcode';
  
  // Tag details
  tagId: string;
  tagData?: Record<string, any>;
  
  // Physical properties
  tagLocation?: string;
  installationDate?: Date;
  
  // System fields
  assignedBy: string;
}

// Supporting interfaces

export interface ItemDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'mm' | 'cm' | 'm' | 'in' | 'ft';
}

export interface TemperatureRange {
  minTemperature: number;
  maxTemperature: number;
  unit: 'celsius' | 'fahrenheit';
}

export interface RegulatoryApproval {
  authority: string; // 'MHRA', 'FDA', 'CE', etc.
  approvalNumber: string;
  approvalDate: Date;
  expiryDate?: Date;
  status: 'active' | 'expired' | 'suspended' | 'revoked';
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
  country: string;
}

// Response interfaces

export interface InventoryListResponse {
  items: InventoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: InventorySearchFilters;
  summary: {
    totalItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    expiringItems: number;
    totalValue: number;
  };
}

export interface StockMovementHistoryResponse {
  movements: StockMovement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalMovements: number;
    stockIn: number;
    stockOut: number;
    adjustments: number;
    currentStock: number;
  };
}

export interface SupplierPerformanceResponse {
  supplierId: string;
  supplierName: string;
  period: string;
  
  // Performance metrics
  onTimeDeliveryRate: number;
  qualityScore: number;
  averageLeadTime: number;
  orderFulfillmentRate: number;
  
  // Financial metrics
  totalOrderValue: number;
  averageOrderValue: number;
  paymentTermsCompliance: number;
  
  // Order statistics
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  partialDeliveries: number;
  
  // Issues and complaints
  qualityIssues: number;
  deliveryIssues: number;
  invoicingIssues: number;
  
  // Recommendations
  performanceRating: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' | 'poor';
  recommendations: string[];
}

export interface MaintenanceScheduleResponse {
  schedules: MaintenanceRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    scheduledMaintenance: number;
    overdueMaintenance: number;
    completedMaintenance: number;
    totalMaintenanceCost: number;
  };
}

// Import types from entities
import type { 
  InventoryItem, 
  PurchaseOrder, 
  Supplier, 
  StockMovement, 
  MaintenanceRecord 
} from '@/entities/inventory/InventoryEntities';
