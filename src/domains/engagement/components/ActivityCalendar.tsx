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
  MapPin,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface Activity {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  location: string;
  specificLocation: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  currentParticipants: number;
  requiresRSVP: boolean;
  facilitator: string;
  cost: number;
  currency: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: string;
  status: string;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  requiresRSVP: boolean;
  facilitator: string;
}

const ActivityCalendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    location: '',
    search: '',
  });

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, viewMode, filters]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const startDate = getStartDate();
      const endDate = getEndDate();
      
      const queryParams = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ...(filters.type && { type: filters.type }),
        ...(filters.status && { status: filters.status }),
        ...(filters.location && { location: filters.location }),
      });

      const response = await fetch(`/api/engagement/calendar?${queryParams}`);
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = (): Date => {
    const date = new Date(currentDate);
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
    const date = new Date(currentDate);
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'postponed': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'physical': return 'text-green-600';
      case 'cognitive': return 'text-blue-600';
      case 'social': return 'text-purple-600';
      case 'creative': return 'text-orange-600';
      case 'educational': return 'text-indigo-600';
      case 'therapeutic': return 'text-pink-600';
      case 'recreational': return 'text-cyan-600';
      case 'spiritual': return 'text-amber-600';
      default: return 'text-gray-600';
    }
  };

  const handleStartActivity = async (activityId: string) => {
    try {
      const response = await fetch(`/api/engagement/activities/${activityId}/start`, {
        method: 'POST',
      });
      
      if (response.ok) {
        await fetchCalendarData();
      }
    } catch (error) {
      console.error('Failed to start activity:', error);
    }
  };

  const handleCompleteActivity = async (activityId: string) => {
    try {
      const response = await fetch(`/api/engagement/activities/${activityId}/complete`, {
        method: 'POST',
      });
      
      if (response.ok) {
        await fetchCalendarData();
      }
    } catch (error) {
      console.error('Failed to complete activity:', error);
    }
  };

  const handleCancelActivity = async (activityId: string) => {
    try {
      const response = await fetch(`/api/engagement/activities/${activityId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Cancelled by user' }),
      });
      
      if (response.ok) {
        await fetchCalendarData();
      }
    } catch (error) {
      console.error('Failed to cancel activity:', error);
    }
  };

  const renderMonthView = () => {
    const startDate = getStartDate();
    const endDate = getEndDate();
    const days = [];
    
    for (let i = 0; i < 35; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center font-medium text-gray-500">
              {day}
            </div>
          ))}
          {days.map((date, index) => {
            const dayEvents = events.filter(event => 
              new Date(event.start).toDateString() === date.toDateString()
            );
            
            return (
              <Card key={index} className={`min-h-24 ${dayEvents.length > 0 ? 'bg-blue-50' : ''}`}>
                <CardContent className="p-2">
                  <div className="text-sm font-medium mb-1">
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="text-xs p-1 bg-white rounded border cursor-pointer hover:bg-gray-50"
                        onClick={() => console.log('View event:', event.id)}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        <div className="text-gray-500">
                          {formatTime(event.start)} - {formatTime(event.end)}
                        </div>
                        <Badge className={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
            const dayEvents = events.filter(event => 
              new Date(event.start).toDateString() === date.toDateString()
            );
            
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
                    {dayEvents.map((event) => (
                      <div key={event.id} className="p-2 bg-gray-50 rounded text-xs">
                        <div className="font-medium">{event.title}</div>
                        <div className="text-gray-500">
                          {formatTime(event.start)} - {formatTime(event.end)}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <Badge className={getStatusColor(event.status)}>
                            {event.status}
                          </Badge>
                          <span className="text-gray-500">
                            {event.currentParticipants}/{event.maxParticipants}
                          </span>
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

  const renderDayView = () => {
    const dayEvents = events.filter(event => 
      new Date(event.start).toDateString() === currentDate.toDateString()
    );

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dayEvents.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatTime(event.start)} - {formatTime(event.end)}
                  </span>
                  <span className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {event.location}
                  </span>
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {event.currentParticipants}/{event.maxParticipants}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(event.status)}>
                      {event.status}
                    </Badge>
                    <Badge className={getTypeColor(event.type)}>
                      {event.type}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <div>Facilitator: {event.facilitator}</div>
                    {event.requiresRSVP && (
                      <div className="text-orange-600">RSVP Required</div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    {event.status === 'scheduled' && (
                      <Button
                        size="sm"
                        onClick={() => handleStartActivity(event.id)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    )}
                    {event.status === 'in_progress' && (
                      <Button
                        size="sm"
                        onClick={() => handleCompleteActivity(event.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    )}
                    {(event.status === 'scheduled' || event.status === 'in_progress') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelActivity(event.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
          <h1 className="text-3xl font-bold text-gray-900">Activity Calendar</h1>
          <p className="text-gray-600">Manage activities and engagement programs</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchCalendarData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Activity
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
                value={currentDate.toISOString().split('T')[0]}
                onChange={(e) => setCurrentDate(new Date(e.target.value))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Type</label>
              <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="physical">Physical</SelectItem>
                  <SelectItem value="cognitive">Cognitive</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                  <SelectItem value="therapeutic">Therapeutic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search activities..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={() => setFilters({ type: '', status: '', location: '', search: '' })}>
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Content */}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}
    </div>
  );
};

export default ActivityCalendar;