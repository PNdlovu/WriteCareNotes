import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { Alert } from '../ui/Alert';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import {
  Search, Plus, Edit, Eye, Download, RefreshCw, Flag,
  CheckCircle, Clock, XCircle, FilterIcon, TrendingUp,
  Calendar, User, AlertTriangle
} from 'lucide-react';

interface PolicyTrackerDashboardProps {
  organizationId: string;
  userRole: 'admin' | 'manager' | 'user';
}

type PolicyStatus = 'draft' | 'review' | 'approved' | 'active' | 'archived' | 'expired';
type PolicyPriority = 'high' | 'medium' | 'low';

interface Policy {
  id: string;
  title: string;
  version: string;
  status: PolicyStatus;
  priority: PolicyPriority;
  category: string;
  effectiveDate: string;
  expiryDate: string;
  owner: string;
  lastModified: string;
  affectedStaff: number;
  complianceRate: number;
}

const PolicyTrackerDashboard: React.FC<PolicyTrackerDashboardProps> = ({
  organizationId,
  userRole
}) => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<PolicyStatus | 'all'>('all');
  const [activeTab, setActiveTab] = useState('all');

  // Status badge styling
  const getStatusBadge = (status: PolicyStatus) => {
    const variants = {
      draft: 'bg-gray-100 text-gray-800',
      review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      active: 'bg-emerald-100 text-emerald-800',
      archived: 'bg-slate-100 text-slate-800',
      expired: 'bg-red-100 text-red-800'
    };
    return <Badge className={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  const getPriorityBadge = (priority: PolicyPriority) => {
    const variants = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return <Badge className={variants[priority]}>{priority.toUpperCase()}</Badge>;
  };

  // Mock data
  const mockPolicies: Policy[] = [
    {
      id: 'POL-001',
      title: 'Medication Administration Protocol',
      version: '3.2',
      status: 'active',
      priority: 'high',
      category: 'Clinical',
      effectiveDate: '2024-01-15',
      expiryDate: '2025-01-15',
      owner: 'Dr. Sarah Johnson',
      lastModified: '2024-10-05',
      affectedStaff: 125,
      complianceRate: 98
    }
  ];

  // Filtered policies
  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || policy.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Policy Tracker</h1>
          <p className="text-gray-600 mt-1">Manage and monitor organizational policies</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Policy
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Policies</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Compliance Rate</p>
                <p className="text-2xl font-bold text-gray-900">96%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Policies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search policies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <FilterIcon className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Policy</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {mockPolicies.map((policy) => (
                    <tr key={policy.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{policy.title}</p>
                          <p className="text-sm text-gray-500">v{policy.version}  {policy.id}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">{getStatusBadge(policy.status)}</td>
                      <td className="px-4 py-4">{getPriorityBadge(policy.priority)}</td>
                      <td className="px-4 py-4 text-gray-600">{policy.category}</td>
                      <td className="px-4 py-4 text-gray-600">{policy.expiryDate}</td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PolicyTrackerDashboard;