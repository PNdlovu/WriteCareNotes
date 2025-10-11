import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Calendar
} from 'lucide-react';

interface FinancialMetrics {
  revenue: {
    total: number;
    monthly: number;
    quarterly: number;
    yearly: number;
    growth: number;
  };
  expenses: {
    total: number;
    payroll: number;
    operational: number;
    overhead: number;
    growth: number;
  };
  profitability: {
    grossProfit: number;
    netProfit: number;
    profitMargin: number;
    ebitda: number;
  };
  payroll: {
    totalCost: number;
    averageSalary: number;
    employeeCount: number;
    costPerEmployee: number;
    overtimeCost: number;
    benefitsCost: number;
  };
}

interface PayrollRun {
  id: string;
  runName: string;
  payPeriod: string;
  payDate: string;
  status: string;
  totalGrossPay: number;
  totalTax: number;
  totalNationalInsurance: number;
  totalNetPay: number;
  employeeCount: number;
}

interface BudgetAnalysis {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercentage: number;
  status: 'over' | 'under' | 'on_track';
}

const FinanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [budgetAnalysis, setBudgetAnalysis] = useState<BudgetAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  useEffect(() => {
    fetchFinancialData();
  }, [selectedPeriod]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      // Fetch financial metrics
      const metricsResponse = await fetch(`/api/finance/analytics/metrics?period=${selectedPeriod}`);
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData);

      // Fetch payroll runs
      const payrollResponse = await fetch('/api/finance/payroll/runs?limit=10');
      const payrollData = await payrollResponse.json();
      setPayrollRuns(payrollData);

      // Fetch budget analysis
      const budgetResponse = await fetch('/api/finance/budget/analysis');
      const budgetData = await budgetResponse.json();
      setBudgetAnalysis(budgetData);

    } catch (error) {
      console.error('Failed to fetch financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBudgetStatusColor = (status: string) => {
    switch (status) {
      case 'over': return 'text-red-600';
      case 'under': return 'text-green-600';
      case 'on_track': return 'text-blue-600';
      default: return 'text-gray-600';
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
          <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="text-gray-600">Comprehensive financial overview and payroll management</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setSelectedPeriod('current')}>
            Current Period
          </Button>
          <Button variant="outline" onClick={() => setSelectedPeriod('quarterly')}>
            Quarterly
          </Button>
          <Button variant="outline" onClick={() => setSelectedPeriod('yearly')}>
            Yearly
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.revenue.total)}</div>
              <p className="text-xs text-muted-foreground">
                <span className={metrics.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatPercentage(metrics.revenue.growth)}
                </span>
                {' '}from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.expenses.total)}</div>
              <p className="text-xs text-muted-foreground">
                <span className={metrics.expenses.growth >= 0 ? 'text-red-600' : 'text-green-600'}>
                  {formatPercentage(metrics.expenses.growth)}
                </span>
                {' '}from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.profitability.netProfit)}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.profitability.profitMargin.toFixed(1)}% profit margin
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payroll Cost</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.payroll.totalCost)}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.payroll.employeeCount} employees
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="budget">Budget Analysis</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Monthly Revenue</span>
                    <span className="text-sm font-bold">{formatCurrency(metrics?.revenue.monthly || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Quarterly Revenue</span>
                    <span className="text-sm font-bold">{formatCurrency(metrics?.revenue.quarterly || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Yearly Revenue</span>
                    <span className="text-sm font-bold">{formatCurrency(metrics?.revenue.yearly || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Payroll</span>
                    <span className="text-sm font-bold">{formatCurrency(metrics?.expenses.payroll || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Operational</span>
                    <span className="text-sm font-bold">{formatCurrency(metrics?.expenses.operational || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Overhead</span>
                    <span className="text-sm font-bold">{formatCurrency(metrics?.expenses.overhead || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payroll Runs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payrollRuns.map((run) => (
                  <div key={run.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium">{run.runName}</h3>
                        <p className="text-sm text-gray-600">{run.payPeriod} • {run.employeeCount} employees</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(run.totalNetPay)}</div>
                        <div className="text-sm text-gray-600">Net Pay</div>
                      </div>
                      <Badge className={getStatusColor(run.status)}>
                        {run.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {budgetAnalysis.map((item) => (
                  <div key={item.category} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium capitalize">{item.category.replace('_', ' ')}</h3>
                      <p className="text-sm text-gray-600">
                        Budgeted: {formatCurrency(item.budgeted)} • 
                        Actual: {formatCurrency(item.actual)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${getBudgetStatusColor(item.status)}`}>
                        {formatCurrency(item.variance)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatPercentage(item.variancePercentage)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="font-medium">Financial Report</h3>
                    <p className="text-sm text-gray-600">Comprehensive financial overview</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Users className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="font-medium">Payroll Report</h3>
                    <p className="text-sm text-gray-600">Payroll analysis and trends</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <PieChart className="h-8 w-8 text-purple-600" />
                  <div>
                    <h3 className="font-medium">Budget Report</h3>
                    <p className="text-sm text-gray-600">Budget vs actual analysis</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceDashboard;