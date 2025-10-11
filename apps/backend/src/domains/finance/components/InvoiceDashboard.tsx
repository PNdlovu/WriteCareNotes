import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Plus,
  Search,
  Filter,
  Download,
  Send,
  Eye,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: string;
  status: string;
  recipientName: string;
  recipientEmail: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  currency: string;
  isOverdue: boolean;
  daysOverdue: number;
}

interface FinancialMetrics {
  totalInvoices: number;
  totalInvoiceValue: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueAmount: number;
  averageInvoiceValue: number;
  paymentRate: number;
  monthlyRevenue: number;
  quarterlyRevenue: number;
  yearlyRevenue: number;
}

const InvoiceDashboard: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    startDate: '',
    endDate: '',
    recipientName: '',
    isOverdue: false,
  });

  useEffect(() => {
    fetchInvoices();
    fetchMetrics();
  }, [filters]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/financial/invoices?${queryParams}`);
      const data = await response.json();
      setInvoices(data);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/financial/metrics?period=month');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'GBP') => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-orange-100 text-orange-800';
      case 'disputed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'resident_billing': return 'text-blue-600';
      case 'service_charge': return 'text-green-600';
      case 'additional_service': return 'text-purple-600';
      case 'medication': return 'text-red-600';
      case 'therapy': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/financial/invoices/${invoiceId}/send`, {
        method: 'POST',
      });
      
      if (response.ok) {
        await fetchInvoices(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to send invoice:', error);
    }
  };

  const handleViewInvoice = (invoiceId: string) => {
    window.open(`/invoices/${invoiceId}`, '_blank');
  };

  const handleGenerateRecurring = async () => {
    try {
      const response = await fetch('/api/financial/invoices/generate-recurring', {
        method: 'POST',
      });
      
      if (response.ok) {
        await fetchInvoices(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to generate recurring invoices:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoice Dashboard</h1>
          <p className="text-gray-600">Manage invoices, payments, and billing</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleGenerateRecurring}>
            <Clock className="h-4 w-4 mr-2" />
            Generate Recurring
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalInvoices}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(metrics.totalInvoiceValue)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.outstandingAmount)}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.paymentRate.toFixed(1)}% payment rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.overdueAmount)}</div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.averageInvoiceValue)}</div>
              <p className="text-xs text-muted-foreground">
                Per invoice
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Type</label>
              <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="resident_billing">Resident Billing</SelectItem>
                  <SelectItem value="service_charge">Service Charge</SelectItem>
                  <SelectItem value="additional_service">Additional Service</SelectItem>
                  <SelectItem value="medication">Medication</SelectItem>
                  <SelectItem value="therapy">Therapy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Recipient</label>
              <Input
                placeholder="Search by name..."
                value={filters.recipientName}
                onChange={(e) => setFilters({ ...filters, recipientName: e.target.value })}
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={filters.isOverdue}
                  onChange={(e) => setFilters({ ...filters, isOverdue: e.target.checked })}
                />
                <span className="text-sm font-medium">Overdue Only</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="font-medium">{invoice.invoiceNumber}</h3>
                    <p className="text-sm text-gray-600">{invoice.recipientName}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className={`text-xs font-medium ${getTypeColor(invoice.type)}`}>
                        {invoice.type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(invoice.invoiceDate)}
                      </span>
                      <span className="text-xs text-gray-500">
                        Due: {formatDate(invoice.dueDate)}
                      </span>
                      {invoice.isOverdue && (
                        <span className="text-xs text-red-600 font-medium">
                          {invoice.daysOverdue} days overdue
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(invoice.totalAmount, invoice.currency)}</div>
                    <div className="text-sm text-gray-500">
                      {formatCurrency(invoice.paidAmount, invoice.currency)} paid
                    </div>
                    {invoice.balanceAmount > 0 && (
                      <div className="text-sm text-red-600">
                        {formatCurrency(invoice.balanceAmount, invoice.currency)} outstanding
                      </div>
                    )}
                  </div>
                  <Badge className={getStatusColor(invoice.status)}>
                    {invoice.status}
                  </Badge>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewInvoice(invoice.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {invoice.status === 'draft' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendInvoice(invoice.id)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceDashboard;