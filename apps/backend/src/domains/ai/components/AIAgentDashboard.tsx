import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Activity, 
  Users, 
  Zap, 
  BarChart3, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Memory,
  Network
} from 'lucide-react';

interface AIAgent {
  id: string;
  name: string;
  displayName: string;
  description: string;
  type: string;
  status: 'active' | 'inactive' | 'maintenance' | 'error' | 'deprecated';
  priority: 'low' | 'normal' | 'high' | 'critical';
  version: string;
  model: string;
  endpoint: string;
  healthCheckUrl: string;
  maxConcurrentSessions: number;
  currentSessions: number;
  averageResponseTime: number;
  successRate: number;
  totalRequests: number;
  lastActiveAt: string;
  lastHealthCheck: string;
  errorMessage?: string;
}

interface AgentCapability {
  id: string;
  name: string;
  displayName: string;
  description: string;
  type: string;
  status: 'available' | 'unavailable' | 'deprecated' | 'beta';
  version: string;
  usageCount: number;
  successRate: number;
  averageResponseTime: number;
}

interface EventSubscription {
  id: string;
  eventType: string;
  agentId: string;
  agentName: string;
  conditions: any;
  priority: number;
  enabled: boolean;
}

const AIAgentDashboard: React.FC = () => {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [capabilities, setCapabilities] = useState<AgentCapability[]>([]);
  const [subscriptions, setSubscriptions] = useState<EventSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  useEffect(() => {
    fetchAgentData();
  }, []);

  const fetchAgentData = async () => {
    try {
      setLoading(true);
      
      // Fetch agents
      const agentsResponse = await fetch('/api/ai/agents');
      const agentsData = await agentsResponse.json();
      setAgents(agentsData);

      // Fetch capabilities
      const capabilitiesResponse = await fetch('/api/ai/capabilities');
      const capabilitiesData = await capabilitiesResponse.json();
      setCapabilities(capabilitiesData);

      // Fetch subscriptions
      const subscriptionsResponse = await fetch('/api/ai/event-subscriptions');
      const subscriptionsData = await subscriptionsResponse.json();
      setSubscriptions(subscriptionsData);

    } catch (error) {
      console.error('Failed to fetch agent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAgentAction = async (agentId: string, action: 'activate' | 'deactivate' | 'restart') => {
    try {
      const response = await fetch(`/api/ai/agents/${agentId}/${action}`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchAgentData(); // Refresh data
      }
    } catch (error) {
      console.error(`Failed to ${action} agent:`, error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'deprecated': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'normal': return 'text-blue-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const formatResponseTime = (time: number) => {
    return `${time.toFixed(2)}s`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
          <h1 className="text-3xl font-bold text-gray-900">AI Agent Dashboard</h1>
          <p className="text-gray-600">Manage and monitor AI agents and automation</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchAgentData}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.length}</div>
            <p className="text-xs text-muted-foreground">
              {agents.filter(a => a.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.reduce((sum, agent) => sum + agent.currentSessions, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {agents.reduce((sum, agent) => sum + agent.maxConcurrentSessions, 0)} max capacity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.length > 0 ? 
                formatResponseTime(agents.reduce((sum, agent) => sum + agent.averageResponseTime, 0) / agents.length) : 
                '0.00s'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Across all agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.length > 0 ? 
                formatPercentage(agents.reduce((sum, agent) => sum + agent.successRate, 0) / agents.length) : 
                '0.0%'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Overall performance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
          <TabsTrigger value="events">Event Subscriptions</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {agents.map((agent) => (
              <Card key={agent.id} className={`${selectedAgent === agent.id ? 'ring-2 ring-blue-500' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Bot className="h-6 w-6 text-blue-600" />
                      <div>
                        <CardTitle className="text-lg">{agent.displayName}</CardTitle>
                        <p className="text-sm text-gray-600">{agent.name} v{agent.version}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(agent.status)}>
                        {agent.status}
                      </Badge>
                      <span className={`text-sm font-medium ${getPriorityColor(agent.priority)}`}>
                        {agent.priority}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{agent.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Model</div>
                      <div className="text-sm">{agent.model}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Type</div>
                      <div className="text-sm capitalize">{agent.type.replace('_', ' ')}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Sessions</div>
                      <div className="text-sm">{agent.currentSessions}/{agent.maxConcurrentSessions}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Success Rate</div>
                      <div className="text-sm">{formatPercentage(agent.successRate)}</div>
                    </div>
                  </div>

                  {agent.errorMessage && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                        <span className="text-sm text-red-800">{agent.errorMessage}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    {agent.status === 'active' ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAgentAction(agent.id, 'deactivate')}
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Deactivate
                      </Button>
                    ) : (
                      <Button 
                        size="sm"
                        onClick={() => handleAgentAction(agent.id, 'activate')}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Activate
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAgentAction(agent.id, 'restart')}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restart
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="capabilities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {capabilities.map((capability) => (
                  <div key={capability.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium">{capability.displayName}</h3>
                        <p className="text-sm text-gray-600">{capability.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-gray-500">Type: {capability.type}</span>
                          <span className="text-xs text-gray-500">Version: {capability.version}</span>
                          <span className="text-xs text-gray-500">Used: {capability.usageCount} times</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatPercentage(capability.successRate)}</div>
                        <div className="text-xs text-gray-500">Success Rate</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatResponseTime(capability.averageResponseTime)}</div>
                        <div className="text-xs text-gray-500">Avg Response</div>
                      </div>
                      <Badge className={getStatusColor(capability.status)}>
                        {capability.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscriptions.map((subscription) => (
                  <div key={subscription.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{subscription.eventType}</h3>
                      <p className="text-sm text-gray-600">Agent: {subscription.agentName}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs text-gray-500">Priority: {subscription.priority}</span>
                        <span className="text-xs text-gray-500">
                          Conditions: {subscription.conditions ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={subscription.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {subscription.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Cpu className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="font-medium">CPU Usage</h3>
                    <p className="text-sm text-gray-600">System resource monitoring</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Memory className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="font-medium">Memory Usage</h3>
                    <p className="text-sm text-gray-600">Memory consumption tracking</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Network className="h-8 w-8 text-purple-600" />
                  <div>
                    <h3 className="font-medium">Network I/O</h3>
                    <p className="text-sm text-gray-600">Network traffic monitoring</p>
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

export default AIAgentDashboard;