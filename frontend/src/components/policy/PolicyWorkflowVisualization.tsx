import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import {
  CheckCircle, Circle, Clock, User, Edit, Eye, PlayArrow,
  Flag, AlertTriangle, FileText, Gavel, Upload, Archive,
  RefreshCw, Activity
} from 'lucide-react';
import { format } from 'date-fns';

interface PolicyWorkflowVisualizationProps {
  policyId: string;
  organizationId: string;
  onStatusUpdate?: (newStatus: string) => void;
  readOnly?: boolean;
}

type WorkflowStage = 'initiation' | 'drafting' | 'review' | 'compliance' | 'approval' | 'publication' | 'implementation' | 'monitoring';
type StepStatus = 'completed' | 'active' | 'pending' | 'skipped';

interface WorkflowStep {
  stage: WorkflowStage;
  status: StepStatus;
  title: string;
  description: string;
  icon: React.ReactNode;
  completedAt?: Date;
  assignee?: string;
  estimatedDuration?: string;
}

export const PolicyWorkflowVisualization: React.FC<PolicyWorkflowVisualizationProps> = ({
  policyId,
  organizationId,
  onStatusUpdate,
  readOnly = false
}) => {
  const [viewMode, setViewMode] = useState<'stepper' | 'timeline'>('stepper');

  // Mock workflow steps
  const steps: WorkflowStep[] = [
    {
      stage: 'initiation',
      status: 'completed',
      title: 'Policy Initiation',
      description: 'Policy creation and initial setup',
      icon: <FileText className="w-5 h-5" />,
      completedAt: new Date('2024-09-15'),
      assignee: 'Dr. Sarah Johnson',
      estimatedDuration: '1-2 days'
    },
    {
      stage: 'drafting',
      status: 'completed',
      title: 'Content Drafting',
      description: 'Writing and structuring policy content',
      icon: <Edit className="w-5 h-5" />,
      completedAt: new Date('2024-09-20'),
      assignee: 'Policy Team',
      estimatedDuration: '3-5 days'
    },
    {
      stage: 'review',
      status: 'active',
      title: 'Stakeholder Review',
      description: 'Review by relevant stakeholders and subject matter experts',
      icon: <Eye className="w-5 h-5" />,
      assignee: 'Review Committee',
      estimatedDuration: '5-7 days'
    },
    {
      stage: 'compliance',
      status: 'pending',
      title: 'Compliance Verification',
      description: 'Ensuring compliance with regulatory requirements',
      icon: <CheckCircle className="w-5 h-5" />,
      estimatedDuration: '2-3 days'
    },
    {
      stage: 'approval',
      status: 'pending',
      title: 'Management Approval',
      description: 'Final approval from management team',
      icon: <Gavel className="w-5 h-5" />,
      estimatedDuration: '1-2 days'
    },
    {
      stage: 'publication',
      status: 'pending',
      title: 'Policy Publication',
      description: 'Publishing policy and making it available to staff',
      icon: <Upload className="w-5 h-5" />,
      estimatedDuration: '1 day'
    },
    {
      stage: 'implementation',
      status: 'pending',
      title: 'Implementation',
      description: 'Rolling out policy and training staff',
      icon: <PlayArrow className="w-5 h-5" />,
      estimatedDuration: '2-4 weeks'
    },
    {
      stage: 'monitoring',
      status: 'pending',
      title: 'Ongoing Monitoring',
      description: 'Monitoring compliance and effectiveness',
      icon: <Activity className="w-5 h-5" />,
      estimatedDuration: 'Ongoing'
    }
  ];

  const getStatusBadge = (status: StepStatus) => {
    const variants = {
      completed: 'bg-green-100 text-green-800',
      active: 'bg-blue-100 text-blue-800',
      pending: 'bg-gray-100 text-gray-600',
      skipped: 'bg-slate-100 text-slate-600'
    };
    return <Badge className={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  const getStatusIcon = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'active':
        return <Circle className="w-6 h-6 text-blue-600 fill-blue-100" />;
      case 'pending':
        return <Clock className="w-6 h-6 text-gray-400" />;
      default:
        return <Circle className="w-6 h-6 text-gray-300" />;
    }
  };

  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900"> Policy Workflow</h2>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'stepper' ? 'default' : 'outline'}
            onClick={() => setViewMode('stepper')}
            size="sm"
          >
            Stepper
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'default' : 'outline'}
            onClick={() => setViewMode('timeline')}
            size="sm"
          >
            Timeline
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold"> Overall Progress</h3>
            <span className="text-3xl font-bold text-blue-600">{progressPercentage.toFixed(0)}%</span>
          </div>
          
          <Progress value={progressPercentage} className="h-3 mb-4" />
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{completedSteps}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {steps.filter(s => s.status === 'active').length}
              </p>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">
                {steps.filter(s => s.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stepper View */}
      {viewMode === 'stepper' && (
        <Card>
          <CardHeader>
            <CardTitle> Policy Workflow Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={step.stage} className="relative">
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div
                      className={`absolute left-3 top-12 w-0.5 h-16 ${
                        step.status === 'completed' ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    />
                  )}

                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {getStatusIcon(step.status)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-8">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{step.title}</h4>
                        {getStatusBadge(step.status)}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{step.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {step.assignee && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="w-4 h-4" />
                            <span>{step.assignee}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{step.estimatedDuration}</span>
                        </div>
                        
                        {step.completedAt && (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>Completed {format(step.completedAt, 'MMM dd, yyyy')}</span>
                          </div>
                        )}
                      </div>

                      {step.status === 'active' && !readOnly && (
                        <Button size="sm" className="mt-3">
                          Update Status
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <Card>
          <CardHeader>
            <CardTitle> Policy Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.stage} className="relative flex gap-4">
                  {/* Timeline connector */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-14 top-16 w-0.5 h-16 bg-gray-300" />
                  )}

                  {/* Date */}
                  <div className="w-24 flex-shrink-0 text-right pt-2">
                    <span className="text-sm text-gray-600">
                      {step.completedAt ? format(step.completedAt, 'MMM dd') : 'Pending'}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className={`p-2 rounded-full ${
                      step.status === 'completed' ? 'bg-green-100' :
                      step.status === 'active' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {step.icon}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-8">
                    <Card className="shadow-sm">
                      <CardContent className="pt-4">
                        <h4 className="font-semibold text-gray-900 mb-1">{step.title}</h4>
                        <p className="text-sm text-gray-600 mb-3">{step.description}</p>
                        <div className="flex gap-2 flex-wrap">
                          {getStatusBadge(step.status)}
                          {step.assignee && (
                            <Badge variant="outline" className="text-xs">
                              <User className="w-3 h-3 mr-1" />
                              {step.assignee}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PolicyWorkflowVisualization;