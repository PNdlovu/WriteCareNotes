import React from 'react'
import { TERRITORIES, Territory, UserTerritory, ComplianceRequirement } from '../types/compliance'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  FileText,
  Calendar,
  Users,
  Building,
  Phone,
  ExternalLink,
  AlertCircle,
  TrendingUp
} from 'lucide-react'
import { Button } from './ui/Button'

interface ComplianceDashboardProps {
  userTerritories: UserTerritory
  requirements: ComplianceRequirement[]
}

export function ComplianceDashboard({ userTerritories, requirements }: ComplianceDashboardProps) {
  const primaryTerritory = TERRITORIES[userTerritories.primary]
  const additionalTerritories = userTerritories.additional?.map(id => TERRITORIES[id]) || []
  
  const allTerritories = [primaryTerritory, ...additionalTerritories]
  
  // Calculate compliance metrics
  const totalRequirements = requirements.length
  const compliantRequirements = requirements.filter(r => r.status === 'compliant').length
  const overdueRequirements = requirements.filter(r => r.status === 'overdue').length
  const dueSoonRequirements = requirements.filter(r => r.status === 'due-soon').length
  
  const complianceRate = totalRequirements > 0 ? Math.round((compliantRequirements / totalRequirements) * 100) : 100

  const getStatusIcon = (status: ComplianceRequirement['status']) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'due-soon':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'overdue':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: ComplianceRequirement['status']) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'due-soon':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'overdue':
        return 'bg-red-50 border-red-200 text-red-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Compliance Dashboard</h1>
            <p className="text-gray-600">
              Territory-specific regulatory compliance overview
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${complianceRate >= 90 ? 'text-green-600' : complianceRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                {complianceRate}%
              </div>
              <div className="text-sm text-gray-600">Compliance Rate</div>
            </div>
          </div>
        </div>

        {/* Territory Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {allTerritories.map((territory) => (
            <div key={territory.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{territory.flag}</span>
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{territory.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{territory.regulator.name}</p>
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="h-3 w-3 mr-1" />
                Next inspection: {territory.regulator.inspectionCycle} months
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Metrics */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{compliantRequirements}</div>
          <div className="text-sm text-gray-600">Compliant Requirements</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <Calendar className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{dueSoonRequirements}</div>
          <div className="text-sm text-gray-600">Due Soon</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{overdueRequirements}</div>
          <div className="text-sm text-gray-600">Overdue</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <Building className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{totalRequirements}</div>
          <div className="text-sm text-gray-600">Total Requirements</div>
        </div>
      </div>

      {/* Territory-Specific Requirements */}
      <div className="grid lg:grid-cols-2 gap-8">
        {allTerritories.map((territory) => {
          const territoryRequirements = requirements.filter(r => r.territory === territory.id)
          
          return (
            <div key={territory.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{territory.flag}</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{territory.name}</h3>
                    <p className="text-sm text-gray-600">{territory.regulator.name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4 mr-2" />
                    Support
                  </Button>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Regulator
                  </Button>
                </div>
              </div>

              {/* Compliance Standards */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Compliance Standards</h4>
                <div className="space-y-2">
                  {territory.compliance.standards.map((standard, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                      <span className="text-gray-700">{standard}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Requirements List */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Active Requirements</h4>
                {territoryRequirements.length > 0 ? (
                  territoryRequirements.slice(0, 5).map((requirement) => (
                    <div key={requirement.id} className={`p-3 rounded-lg border ${getStatusColor(requirement.status)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            {getStatusIcon(requirement.status)}
                            <span className="ml-2 font-medium text-sm">{requirement.title}</span>
                          </div>
                          <p className="text-xs opacity-75">{requirement.description}</p>
                          <div className="flex items-center mt-2 text-xs opacity-75">
                            <Calendar className="h-3 w-3 mr-1" />
                            {requirement.frequency}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No active requirements for this territory</p>
                  </div>
                )}
                
                {territoryRequirements.length > 5 && (
                  <Button variant="outline" size="sm" className="w-full">
                    View All {territoryRequirements.length} Requirements
                  </Button>
                )}
              </div>

              {/* Key Information */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Data Retention:</span>
                    <span className="ml-2 font-medium">{territory.compliance.dataRetention} years</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Training Hours:</span>
                    <span className="ml-2 font-medium">{territory.compliance.staffTrainingHours}/year</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Inspection Cycle:</span>
                    <span className="ml-2 font-medium">{territory.regulator.inspectionCycle} months</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Emergency:</span>
                    <span className="ml-2 font-medium">{territory.regulator.emergencyContact}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <Button variant="care" className="h-auto p-4 flex-col items-start">
            <FileText className="h-6 w-6 mb-2" />
            <div className="text-left">
              <div className="font-semibold">Generate Report</div>
              <div className="text-sm opacity-75">Create compliance reports for all territories</div>
            </div>
          </Button>
          
          <Button variant="outline" className="h-auto p-4 flex-col items-start">
            <Users className="h-6 w-6 mb-2" />
            <div className="text-left">
              <div className="font-semibold">Training Matrix</div>
              <div className="text-sm opacity-75">View staff training requirements</div>
            </div>
          </Button>
          
          <Button variant="outline" className="h-auto p-4 flex-col items-start">
            <Calendar className="h-6 w-6 mb-2" />
            <div className="text-left">
              <div className="font-semibold">Inspection Prep</div>
              <div className="text-sm opacity-75">Prepare for upcoming inspections</div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  )
}