import React, { useState, useEffect } from 'react'
import { ComplianceNudge, ComplianceNudgingSystem } from '../services/complianceNudging'
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  ArrowUp,
  User,
  Calendar,
  MessageSquare,
  Phone,
  Mail,
  Smartphone,
  Shield,
  TrendingUp,
  AlertCircle,
  XCircle
} from 'lucide-react'
import { Button } from './ui/Button'

interface ComplianceNudgeSystemProps {
  userId: string
  userRole: string
  careHomeId: string
}

export function ComplianceNudgeSystem({ userId, userRole, careHomeId }: ComplianceNudgeSystemProps) {
  const [nudgingSystem] = useState(new ComplianceNudgingSystem())
  const [activeNudges, setActiveNudges] = useState<ComplianceNudge[]>([])
  const [showAllNudges, setShowAllNudges] = useState(false)
  const [stats, setStats] = useState({
    totalNudges: 0,
    resolvedNudges: 0,
    overdueNudges: 0,
    criticalNudges: 0,
    complianceRate: 100
  })

  useEffect(() => {
    // Load active nudges for user
    const nudges = nudgingSystem.getActiveNudgesForUser(userId)
    setActiveNudges(nudges)
    
    // Load compliance stats
    const complianceStats = nudgingSystem.getComplianceStats()
    setStats(complianceStats)
    
    // Set up polling for real-time updates
    const interval = setInterval(() => {
      const updatedNudges = nudgingSystem.getActiveNudgesForUser(userId)
      setActiveNudges(updatedNudges)
      
      const updatedStats = nudgingSystem.getComplianceStats()
      setStats(updatedStats)
    }, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [nudgingSystem, userId])

  const handleAcknowledgeNudge = (nudgeId: string) => {
    const success = nudgingSystem.acknowledgeNudge(nudgeId, userId)
    if (success) {
      setActiveNudges(prev => prev.map(nudge => 
        nudge.id === nudgeId ? { ...nudge, acknowledged: true } : nudge
      ))
    }
  }

  const handleResolveNudge = (nudgeId: string, notes: string) => {
    const success = nudgingSystem.resolveNudge(nudgeId, userId, notes)
    if (success) {
      setActiveNudges(prev => prev.filter(nudge => nudge.id !== nudgeId))
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'high':
        return <AlertCircle className="h-5 w-5 text-orange-600" />
      case 'medium':
        return <Clock className="h-5 w-5 text-yellow-600" />
      default:
        return <Bell className="h-5 w-5 text-blue-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-50 border-red-200'
      case 'high':
        return 'bg-orange-50 border-orange-200'
      case 'medium':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const getEscalationBadge = (escalationLevel: number) => {
    const levels = ['Care Worker', 'Senior', 'Deputy Manager', 'Manager', 'Director']
    const colors = ['bg-gray-100', 'bg-blue-100', 'bg-yellow-100', 'bg-orange-100', 'bg-red-100']
    
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[escalationLevel] || 'bg-gray-100'}`}>
        <ArrowUp className="h-3 w-3 mr-1" />
        {levels[escalationLevel] || 'Escalated'}
      </div>
    )
  }

  const criticalNudges = activeNudges.filter(n => n.priority === 'critical')
  const highPriorityNudges = activeNudges.filter(n => n.priority === 'high')
  const otherNudges = activeNudges.filter(n => !['critical', 'high'].includes(n.priority))

  return (
    <div className="space-y-6">
      {/* Compliance Stats Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Shield className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-bold text-gray-900">Compliance Dashboard</h2>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            stats.complianceRate >= 95 ? 'bg-green-100 text-green-800' :
            stats.complianceRate >= 85 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {stats.complianceRate}% Compliant
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{activeNudges.length}</div>
            <div className="text-sm text-gray-600">Active Tasks</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.criticalNudges}</div>
            <div className="text-sm text-red-700">Critical</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{stats.overdueNudges}</div>
            <div className="text-sm text-orange-700">Overdue</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.resolvedNudges}</div>
            <div className="text-sm text-green-700">Completed</div>
          </div>
        </div>
      </div>

      {/* Critical Nudges */}
      {criticalNudges.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
            <h3 className="text-lg font-bold text-red-900">Critical Compliance Issues</h3>
            <div className="ml-auto bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
              {criticalNudges.length}
            </div>
          </div>
          <div className="space-y-3">
            {criticalNudges.map(nudge => (
              <NudgeCard
                key={nudge.id}
                nudge={nudge}
                onAcknowledge={handleAcknowledgeNudge}
                onResolve={handleResolveNudge}
                priority="critical"
              />
            ))}
          </div>
        </div>
      )}

      {/* High Priority Nudges */}
      {highPriorityNudges.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <AlertCircle className="h-6 w-6 text-orange-600 mr-3" />
            <h3 className="text-lg font-bold text-orange-900">High Priority Tasks</h3>
            <div className="ml-auto bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-bold">
              {highPriorityNudges.length}
            </div>
          </div>
          <div className="space-y-3">
            {highPriorityNudges.slice(0, showAllNudges ? undefined : 3).map(nudge => (
              <NudgeCard
                key={nudge.id}
                nudge={nudge}
                onAcknowledge={handleAcknowledgeNudge}
                onResolve={handleResolveNudge}
                priority="high"
              />
            ))}
          </div>
          {highPriorityNudges.length > 3 && !showAllNudges && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllNudges(true)}
              className="mt-3"
            >
              View All {highPriorityNudges.length} Tasks
            </Button>
          )}
        </div>
      )}

      {/* Other Nudges */}
      {otherNudges.length > 0 && showAllNudges && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <Bell className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-bold text-gray-900">Routine Tasks</h3>
            <div className="ml-auto bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
              {otherNudges.length}
            </div>
          </div>
          <div className="space-y-3">
            {otherNudges.map(nudge => (
              <NudgeCard
                key={nudge.id}
                nudge={nudge}
                onAcknowledge={handleAcknowledgeNudge}
                onResolve={handleResolveNudge}
                priority="medium"
              />
            ))}
          </div>
        </div>
      )}

      {/* No Active Nudges */}
      {activeNudges.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-green-900 mb-2">All Caught Up!</h3>
          <p className="text-green-700">
            No pending compliance tasks. Great job maintaining standards!
          </p>
        </div>
      )}
    </div>
  )
}

// Individual nudge card component
interface NudgeCardProps {
  nudge: ComplianceNudge
  onAcknowledge: (nudgeId: string) => void
  onResolve: (nudgeId: string, notes: string) => void
  priority: string
}

function NudgeCard({ nudge, onAcknowledge, onResolve, priority }: NudgeCardProps) {
  const [showResolveForm, setShowResolveForm] = useState(false)
  const [resolutionNotes, setResolutionNotes] = useState('')

  const handleResolve = () => {
    if (resolutionNotes.trim()) {
      onResolve(nudge.id, resolutionNotes)
      setShowResolveForm(false)
      setResolutionNotes('')
    }
  }

  const timeUntilDue = nudge.dueDate.getTime() - new Date().getTime()
  const hoursUntilDue = Math.floor(timeUntilDue / (1000 * 60 * 60))
  const isOverdue = timeUntilDue < 0

  return (
    <div className={`border rounded-lg p-4 ${getPriorityColor(priority)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <div className="flex items-center mr-4">
              {getPriorityIcon(priority)}
              <span className="ml-2 font-semibold text-gray-900">{nudge.title}</span>
            </div>
            {nudge.escalationLevel > 0 && getEscalationBadge(nudge.escalationLevel)}
          </div>
          <p className="text-gray-700 text-sm mb-2">{nudge.message}</p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {isOverdue ? (
                <span className="text-red-600 font-medium">
                  Overdue by {Math.abs(hoursUntilDue)} hours
                </span>
              ) : (
                <span>Due in {hoursUntilDue} hours</span>
              )}
            </div>
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              Level {nudge.escalationLevel + 1}
            </div>
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              Nudged {nudge.nudgeCount} times
            </div>
          </div>
        </div>
      </div>

      {!showResolveForm ? (
        <div className="flex items-center space-x-2">
          {!nudge.acknowledged && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAcknowledge(nudge.id)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Acknowledge
            </Button>
          )}
          <Button
            variant="care"
            size="sm"
            onClick={() => setShowResolveForm(true)}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark Complete
          </Button>
          
          {/* Contact options for escalated items */}
          {nudge.escalationLevel > 1 && (
            <div className="flex items-center space-x-1 ml-auto">
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resolution Notes *
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Describe how this compliance requirement was completed..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="care"
              size="sm"
              onClick={handleResolve}
              disabled={!resolutionNotes.trim()}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Task
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResolveForm(false)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {nudge.acknowledged && (
        <div className="mt-3 flex items-center text-sm text-green-600">
          <CheckCircle className="h-4 w-4 mr-1" />
          Acknowledged - Task in progress
        </div>
      )}
    </div>
  )
}

// Helper function to get priority colors
function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical':
      return 'bg-red-50 border-red-200'
    case 'high':
      return 'bg-orange-50 border-orange-200'
    case 'medium':
      return 'bg-yellow-50 border-yellow-200'
    default:
      return 'bg-blue-50 border-blue-200'
  }
}