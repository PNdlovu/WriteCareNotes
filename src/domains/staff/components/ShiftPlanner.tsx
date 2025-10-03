import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Clock, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

interface Shift {
  id: string;
  date: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  requiredStaff: number;
  assignedStaff: Employee[];
  status: string;
  conflicts?: string[];
  coverage?: string[];
}

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  skills: string[];
  certifications: string[];
  isAvailable: boolean;
  isOvertime: boolean;
}

interface ShiftPlannerData {
  shifts: Shift[];
  employees: Employee[];
  conflicts: any[];
  coverage: any[];
}

const ShiftPlanner: React.FC = () => {
  const [plannerData, setPlannerData] = useState<ShiftPlannerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'day'>('week');
  const [filters, setFilters] = useState({
    department: '',
    role: '',
    skill: '',
    availability: 'all',
  });

  useEffect(() => {
    fetchShiftPlannerData();
  }, [selectedDate, viewMode]);

  const fetchShiftPlannerData = async () => {
    try {
      setLoading(true);
      const startDate = getStartDate();
      const endDate = getEndDate();
      
      const response = await fetch(`/api/hr/shift-planner?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      const data = await response.json();
      setPlannerData(data);
    } catch (error) {
      console.error('Failed to fetch shift planner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = (): Date => {
    const date = new Date(selectedDate);
    switch (viewMode) {
      case 'day':
        return date;
      case 'week':
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        return startOfWeek;
      case 'month':
        return new Date(date.getFullYear(), date.getMonth(), 1);
      default:
        return date;
    }
  };

  const getEndDate = (): Date => {
    const date = new Date(selectedDate);
    switch (viewMode) {
      case 'day':
        return date;
      case 'week':
        const endOfWeek = new Date(date);
        endOfWeek.setDate(date.getDate() - date.getDay() + 6);
        return endOfWeek;
      case 'month':
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
      default:
        return date;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const getShiftStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'understaffed': return 'bg-red-100 text-red-800';
      case 'overstaffed': return 'bg-blue-100 text-blue-800';
      case 'conflict': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getShiftTypeColor = (type: string) => {
    switch (type) {
      case 'day': return 'text-blue-600';
      case 'evening': return 'text-purple-600';
      case 'night': return 'text-indigo-600';
      case 'weekend': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const handleAssignEmployee = (shiftId: string, employeeId: string) => {
    // Implement employee assignment logic
    console.log('Assigning employee', employeeId, 'to shift', shiftId);
  };

  const handleRemoveEmployee = (shiftId: string, employeeId: string) => {
    // Implement employee removal logic
    console.log('Removing employee', employeeId, 'from shift', shiftId);
  };

  const handleCreateShift = () => {
    // Implement create shift logic
    console.log('Creating new shift');
  };

  const handleEditShift = (shiftId: string) => {
    // Implement edit shift logic
    console.log('Editing shift', shiftId);
  };

  const handleDeleteShift = (shiftId: string) => {
    // Implement delete shift logic
    console.log('Deleting shift', shiftId);
  };

  const getFilteredEmployees = (): Employee[] => {
    if (!plannerData) return [];
    
    return plannerData.employees.filter(employee => {
      if (filters.department && employee.department !== filters.department) return false;
      if (filters.role && employee.role !== filters.role) return false;
      if (filters.skill && !employee.skills.includes(filters.skill)) return false;
      if (filters.availability === 'available' && !employee.isAvailable) return false;
      if (filters.availability === 'unavailable' && employee.isAvailable) return false;
      return true;
    });
  };

  const getShiftsForDate = (date: Date): Shift[] => {
    if (!plannerData) return [];
    
    const dateString = date.toISOString().split('T')[0];
    return plannerData.shifts.filter(shift => shift.date.startsWith(dateString));
  };

  const renderDayView = () => {
    const shifts = getShiftsForDate(selectedDate);
    const employees = getFilteredEmployees();

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shifts.map((shift) => (
            <Card key={shift.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {shift.shiftType.charAt(0).toUpperCase() + shift.shiftType.slice(1)} Shift
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditShift(shift.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteShift(shift.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                  </span>
                  <Badge className={getShiftStatusColor(shift.status)}>
                    {shift.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Staff Required:</span>
                    <span className="text-sm">{shift.assignedStaff.length}/{shift.requiredStaff}</span>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Assigned Staff:</h4>
                    <div className="space-y-2">
                      {shift.assignedStaff.map((employee) => (
                        <div key={employee.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <span className="text-sm font-medium">{employee.name}</span>
                            <span className="text-xs text-gray-500 ml-2">{employee.role}</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveEmployee(shift.id, employee.id)}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Available Staff:</h4>
                    <div className="space-y-1">
                      {employees
                        .filter(emp => !shift.assignedStaff.some(assigned => assigned.id === emp.id))
                        .slice(0, 3)
                        .map((employee) => (
                          <div key={employee.id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <span className="text-sm font-medium">{employee.name}</span>
                              <span className="text-xs text-gray-500 ml-2">{employee.role}</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAssignEmployee(shift.id, employee.id)}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = getStartDate();
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-4">
          {days.map((date) => {
            const shifts = getShiftsForDate(date);
            return (
              <Card key={date.toISOString()}>
                <CardHeader>
                  <CardTitle className="text-sm">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </CardTitle>
                  <p className="text-xs text-gray-500">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {shifts.map((shift) => (
                      <div key={shift.id} className="p-2 bg-gray-50 rounded text-xs">
                        <div className="font-medium">{shift.shiftType} Shift</div>
                        <div className="text-gray-500">
                          {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span>{shift.assignedStaff.length}/{shift.requiredStaff}</span>
                          <Badge className={getShiftStatusColor(shift.status)}>
                            {shift.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
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
          <h1 className="text-3xl font-bold text-gray-900">Shift Planner</h1>
          <p className="text-gray-600">Manage staff schedules and assignments</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchShiftPlannerData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleCreateShift}>
            <Plus className="h-4 w-4 mr-2" />
            New Shift
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="text-sm font-medium">View Mode</label>
              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Department</label>
              <Select value={filters.department} onValueChange={(value) => setFilters({ ...filters, department: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Departments</SelectItem>
                  <SelectItem value="nursing">Nursing</SelectItem>
                  <SelectItem value="care">Care</SelectItem>
                  <SelectItem value="admin">Administration</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Role</label>
              <Select value={filters.role} onValueChange={(value) => setFilters({ ...filters, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Roles</SelectItem>
                  <SelectItem value="nurse">Nurse</SelectItem>
                  <SelectItem value="carer">Carer</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Availability</label>
              <Select value={filters.availability} onValueChange={(value) => setFilters({ ...filters, availability: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={() => setFilters({ department: '', role: '', skill: '', availability: 'all' })}>
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shift Planner Content */}
      {viewMode === 'day' && renderDayView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'month' && (
        <div className="text-center py-8">
          <p className="text-gray-500">Month view coming soon...</p>
        </div>
      )}
    </div>
  );
};

export default ShiftPlanner;