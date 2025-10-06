import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Activity, CheckCircle, AlertCircle, XCircle, Clock, Zap, Server, Shield } from 'lucide-react'
import { monitoringService, SystemStatusData } from '../../services/monitoringService'

export const SystemStatusPage: React.FC = () => {
  const [statusData, setStatusData] = useState<SystemStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleString())

  useEffect(() => {
    const loadStatusData = async () => {
      try {
        setLoading(true)
        const data = await monitoringService.getSystemStatus()
        setStatusData(data)
        setLastUpdated(new Date().toLocaleString())
      } catch (error) {
        console.error('Failed to load system status:', error)
      } finally {
        setLoading(false)
      }
    }

    // Initial load
    loadStatusData()

    // Set up real-time updates
    const unsubscribe = monitoringService.subscribeToUpdates((data) => {
      setStatusData(data)
      setLastUpdated(new Date().toLocaleString())
    })

    return unsubscribe
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'outage':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'maintenance':
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-600'
      case 'degraded':
        return 'text-yellow-600'
      case 'outage':
        return 'text-red-600'
      case 'maintenance':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-50 border-green-200'
      case 'degraded':
        return 'bg-yellow-50 border-yellow-200'
      case 'outage':
        return 'bg-red-50 border-red-200'
      case 'maintenance':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <Activity className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading system status...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!statusData) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <XCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <p className="text-gray-600">Failed to load system status</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-6">
              {getStatusIcon(statusData.overallStatus)}
              <span className="ml-2">System {statusData.overallStatus.charAt(0).toUpperCase() + statusData.overallStatus.slice(1)}</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              System 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Status</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
              Real-time status and performance monitoring for all WriteCareNotes services 
              across the British Isles care home network.
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm">
              <Clock className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm text-gray-700">Last updated: {lastUpdated}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-grow py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Overall Status */}
          <section className="mb-12">
            <div className={`${getStatusBgColor(statusData.overallStatus)} border rounded-lg p-6 mb-8`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(statusData.overallStatus)}
                  <div>
                    <h2 className={`text-2xl font-bold ${getStatusColor(statusData.overallStatus)}`}>
                      All Systems {statusData.overallStatus.charAt(0).toUpperCase() + statusData.overallStatus.slice(1)}
                    </h2>
                    <p className="text-gray-700">
                      {statusData.overallStatus === 'operational' 
                        ? 'All services are running normally'
                        : statusData.overallStatus === 'degraded'
                        ? 'Some services are experiencing issues'
                        : statusData.overallStatus === 'outage'
                        ? 'Multiple services are currently down'
                        : 'Scheduled maintenance in progress'
                      }
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{statusData.uptime.last24h}%</div>
                  <div className="text-sm text-gray-600">24h uptime</div>
                </div>
              </div>
            </div>
          </section>

          {/* Services Status Grid */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Service Status</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {statusData.services.map((service) => (
                <div key={service.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(service.status)}
                      <div>
                        <h3 className="font-semibold text-gray-900">{service.name}</h3>
                        <p className={`text-sm font-medium ${getStatusColor(service.status)}`}>
                          {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Uptime:</span>
                      <span className="font-medium">{service.uptime}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Response Time:</span>
                      <span className="font-medium">{service.responseTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Checked:</span>
                      <span className="font-medium">{new Date(service.lastChecked).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  
                  {service.description && (
                    <p className="text-xs text-gray-500 mt-3">{service.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* System Metrics */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">System Performance</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Server className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{statusData.metrics.cpu}%</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">CPU Usage</h3>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${statusData.metrics.cpu}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-6 w-6 text-green-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{statusData.metrics.memory}%</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Memory Usage</h3>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${statusData.metrics.memory}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{statusData.metrics.disk}%</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Disk Usage</h3>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${statusData.metrics.disk}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Activity className="h-6 w-6 text-orange-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{statusData.metrics.network}%</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Network Usage</h3>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-600 h-2 rounded-full" 
                    style={{ width: `${statusData.metrics.network}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </section>

          {/* Uptime Statistics */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Uptime Statistics</h2>
            <div className="bg-gray-50 rounded-lg p-8">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{statusData.uptime.last24h}%</div>
                  <div className="text-sm text-gray-600">Last 24 Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{statusData.uptime.last30d}%</div>
                  <div className="text-sm text-gray-600">Last 30 Days</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{statusData.uptime.last90d}%</div>
                  <div className="text-sm text-gray-600">Last 90 Days</div>
                </div>
              </div>
            </div>
          </section>

          {/* Current Incidents */}
          {statusData.incidents.length > 0 && (
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Current Incidents</h2>
              <div className="space-y-4">
                {statusData.incidents.map((incident) => (
                  <div key={incident.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{incident.title}</h3>
                        <p className="text-gray-700 mb-3">{incident.description}</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            incident.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            incident.severity === 'major' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            incident.status === 'resolved' ? 'bg-green-100 text-green-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>Started: {new Date(incident.createdAt).toLocaleString()}</div>
                        <div>Updated: {new Date(incident.updatedAt).toLocaleString()}</div>
                        {incident.resolvedAt && (
                          <div>Resolved: {new Date(incident.resolvedAt).toLocaleString()}</div>
                        )}
                      </div>
                    </div>
                    {incident.affectedServices.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Affected Services:</h4>
                        <div className="flex flex-wrap gap-2">
                          {incident.affectedServices.map((serviceId) => {
                            const service = statusData.services.find(s => s.id === serviceId)
                            return (
                              <span key={serviceId} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                {service?.name || serviceId}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Contact Information */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Need Help?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Technical Support</h3>
                <p className="text-blue-800 mb-3">
                  For technical issues or questions about system status.
                </p>
                <div className="space-y-1 text-blue-800">
                  <p><strong>Email:</strong> support@writecarenotes.com</p>
                  <p><strong>Phone:</strong> +44 (0) 800 123 4567</p>
                  <p><strong>Available:</strong> 24/7</p>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-3">Status Notifications</h3>
                <p className="text-green-800 mb-3">
                  Subscribe to receive automatic updates about system status changes.
                </p>
                <div className="space-y-1 text-green-800">
                  <p><strong>Email:</strong> status-updates@writecarenotes.com</p>
                  <p><strong>SMS:</strong> Text "SUBSCRIBE" to 07xxx xxx xxx</p>
                  <p><strong>Updates:</strong> Real-time incidents only</p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer Navigation */}
          <div className="border-t border-gray-200 pt-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <div className="flex space-x-6 mb-4 sm:mb-0">
                <Link to="/security" className="text-blue-600 hover:text-blue-700 font-medium">
                  Security Information
                </Link>
                <Link to="/privacy-policy" className="text-blue-600 hover:text-blue-700 font-medium">
                  Privacy Policy
                </Link>
                <Link to="/contact" className="text-blue-600 hover:text-blue-700 font-medium">
                  Contact Support
                </Link>
              </div>
              <div className="text-sm text-gray-500">
                Page refreshes automatically every 30 seconds
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default SystemStatusPage