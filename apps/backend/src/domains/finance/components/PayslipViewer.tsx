import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Print, 
  Mail,
  Calendar,
  User,
  CreditCard,
  Calculator,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface Payslip {
  id: string;
  payslipNumber: string;
  employeeName: string;
  employeeNumber: string;
  nationalInsuranceNumber: string;
  taxCode: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  payDate: string;
  basicPay: number;
  overtimePay: number;
  bonus: number;
  commission: number;
  allowances: number;
  grossPay: number;
  tax: number;
  nationalInsurance: number;
  pensionContribution: number;
  studentLoan: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  ytdGrossPay: number;
  ytdTax: number;
  ytdNationalInsurance: number;
  ytdPension: number;
  ytdNetPay: number;
  status: string;
  currency: string;
}

interface PayslipFilters {
  payPeriod: string;
  employeeName: string;
  status: string;
}

const PayslipViewer: React.FC = () => {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PayslipFilters>({
    payPeriod: '',
    employeeName: '',
    status: '',
  });

  useEffect(() => {
    fetchPayslips();
  }, [filters]);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(`/api/finance/payroll/payslips?${queryParams}`);
      const data = await response.json();
      setPayslips(data);
    } catch (error) {
      console.error('Failed to fetch payslips:', error);
    } finally {
      setLoading(false);
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
      case 'generated': return 'bg-blue-100 text-blue-800';
      case 'sent': return 'bg-green-100 text-green-800';
      case 'viewed': return 'bg-purple-100 text-purple-800';
      case 'disputed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownloadPayslip = (payslipId: string) => {
    // Implement PDF download
    console.log('Downloading payslip:', payslipId);
  };

  const handlePrintPayslip = (payslipId: string) => {
    // Implement print functionality
    window.print();
  };

  const handleEmailPayslip = (payslipId: string) => {
    // Implement email functionality
    console.log('Emailing payslip:', payslipId);
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
          <h1 className="text-3xl font-bold text-gray-900">Payslip Viewer</h1>
          <p className="text-gray-600">View and manage employee payslips</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Bulk Download
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Generate Payslips
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Pay Period</label>
              <input
                type="month"
                className="w-full mt-1 p-2 border rounded-md"
                value={filters.payPeriod}
                onChange={(e) => setFilters({ ...filters, payPeriod: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Employee Name</label>
              <input
                type="text"
                className="w-full mt-1 p-2 border rounded-md"
                placeholder="Search by name..."
                value={filters.employeeName}
                onChange={(e) => setFilters({ ...filters, employeeName: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                className="w-full mt-1 p-2 border rounded-md"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Statuses</option>
                <option value="generated">Generated</option>
                <option value="sent">Sent</option>
                <option value="viewed">Viewed</option>
                <option value="disputed">Disputed</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button onClick={fetchPayslips} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payslips List */}
        <Card>
          <CardHeader>
            <CardTitle>Payslips ({payslips.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {payslips.map((payslip) => (
                <div
                  key={payslip.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPayslip?.id === payslip.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedPayslip(payslip)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{payslip.employeeName}</h3>
                      <p className="text-sm text-gray-600">{payslip.payslipNumber}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500">
                          {formatDate(payslip.payPeriodStart)} - {formatDate(payslip.payPeriodEnd)}
                        </span>
                        <span className="text-xs text-gray-500">
                          Pay: {formatDate(payslip.payDate)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(payslip.netPay, payslip.currency)}</div>
                      <Badge className={getStatusColor(payslip.status)}>
                        {payslip.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payslip Detail */}
        {selectedPayslip ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payslip Details</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadPayslip(selectedPayslip.id)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrintPayslip(selectedPayslip.id)}
                  >
                    <Print className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEmailPayslip(selectedPayslip.id)}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="current" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="current">Current Period</TabsTrigger>
                  <TabsTrigger value="ytd">Year to Date</TabsTrigger>
                </TabsList>

                <TabsContent value="current" className="space-y-4">
                  {/* Employee Info */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Employee</div>
                      <div className="font-medium">{selectedPayslip.employeeName}</div>
                      <div className="text-sm text-gray-600">{selectedPayslip.employeeNumber}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">NI Number</div>
                      <div className="font-mono text-sm">{selectedPayslip.nationalInsuranceNumber}</div>
                      <div className="text-sm text-gray-600">Tax Code: {selectedPayslip.taxCode}</div>
                    </div>
                  </div>

                  {/* Earnings */}
                  <div>
                    <h3 className="font-medium mb-2">Earnings</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Basic Pay</span>
                        <span>{formatCurrency(selectedPayslip.basicPay, selectedPayslip.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Overtime Pay</span>
                        <span>{formatCurrency(selectedPayslip.overtimePay, selectedPayslip.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bonus</span>
                        <span>{formatCurrency(selectedPayslip.bonus, selectedPayslip.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Commission</span>
                        <span>{formatCurrency(selectedPayslip.commission, selectedPayslip.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Allowances</span>
                        <span>{formatCurrency(selectedPayslip.allowances, selectedPayslip.currency)}</span>
                      </div>
                      <div className="flex justify-between font-medium border-t pt-2">
                        <span>Gross Pay</span>
                        <span>{formatCurrency(selectedPayslip.grossPay, selectedPayslip.currency)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div>
                    <h3 className="font-medium mb-2">Deductions</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Income Tax</span>
                        <span>{formatCurrency(selectedPayslip.tax, selectedPayslip.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>National Insurance</span>
                        <span>{formatCurrency(selectedPayslip.nationalInsurance, selectedPayslip.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pension Contribution</span>
                        <span>{formatCurrency(selectedPayslip.pensionContribution, selectedPayslip.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Student Loan</span>
                        <span>{formatCurrency(selectedPayslip.studentLoan, selectedPayslip.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Other Deductions</span>
                        <span>{formatCurrency(selectedPayslip.otherDeductions, selectedPayslip.currency)}</span>
                      </div>
                      <div className="flex justify-between font-medium border-t pt-2">
                        <span>Total Deductions</span>
                        <span>{formatCurrency(selectedPayslip.totalDeductions, selectedPayslip.currency)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Pay */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Net Pay</span>
                      <span>{formatCurrency(selectedPayslip.netPay, selectedPayslip.currency)}</span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="ytd" className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Year to Date Totals</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Gross Pay (YTD)</span>
                        <span>{formatCurrency(selectedPayslip.ytdGrossPay, selectedPayslip.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax (YTD)</span>
                        <span>{formatCurrency(selectedPayslip.ytdTax, selectedPayslip.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>National Insurance (YTD)</span>
                        <span>{formatCurrency(selectedPayslip.ytdNationalInsurance, selectedPayslip.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pension (YTD)</span>
                        <span>{formatCurrency(selectedPayslip.ytdPension, selectedPayslip.currency)}</span>
                      </div>
                      <div className="flex justify-between font-medium border-t pt-2">
                        <span>Net Pay (YTD)</span>
                        <span>{formatCurrency(selectedPayslip.ytdNetPay, selectedPayslip.currency)}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select a payslip to view details</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PayslipViewer;