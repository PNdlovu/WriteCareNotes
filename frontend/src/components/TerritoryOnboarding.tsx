import React, { useState } from 'react'
import { TERRITORIES, Territory, UserTerritory } from '../types/compliance'
import { Button } from '../components/ui/Button'
import { 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  Flag,
  Building,
  Users,
  FileText,
  Phone,
  ArrowRight,
  Info
} from 'lucide-react'

interface TerritoryOnboardingProps {
  onComplete: (userTerritories: UserTerritory) => void
}

export function TerritoryOnboarding({ onComplete }: TerritoryOnboardingProps) {
  const [step, setStep] = useState(1)
  const [selectedPrimary, setSelectedPrimary] = useState<string>('')
  const [selectedAdditional, setSelectedAdditional] = useState<string[]>([])
  const [isMultiRegion, setIsMultiRegion] = useState(false)
  const [careHomeDetails, setCareHomeDetails] = useState({
    name: '',
    address: '',
    registrationNumber: '',
    capacity: ''
  })

  const handleTerritorySelect = (territoryId: string) => {
    setSelectedPrimary(territoryId)
  }

  const handleAdditionalToggle = (territoryId: string) => {
    setSelectedAdditional(prev => 
      prev.includes(territoryId) 
        ? prev.filter(id => id !== territoryId)
        : [...prev, territoryId]
    )
  }

  const handleComplete = () => {
    const userTerritories: UserTerritory = {
      primary: selectedPrimary,
      additional: selectedAdditional.length > 0 ? selectedAdditional : undefined,
      multiRegionLicense: isMultiRegion
    }
    onComplete(userTerritories)
  }

  const primaryTerritory = selectedPrimary ? TERRITORIES[selectedPrimary] : null
  const additionalTerritories = selectedAdditional.map(id => TERRITORIES[id])

  if (step === 1) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to WriteCareNotes
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Let's configure your compliance framework
          </p>
          <p className="text-gray-500">
            We'll set up the correct regulatory requirements for your care home's location
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Complete British Isles Coverage
              </h3>
              <p className="text-blue-800 text-sm">
                WriteCareNotes supports all UK nations, Republic of Ireland, and Crown Dependencies. 
                Each territory has specific compliance requirements that will be automatically configured.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Where is your primary care home located?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.values(TERRITORIES).map((territory) => (
              <div
                key={territory.id}
                onClick={() => handleTerritorySelect(territory.id)}
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedPrimary === territory.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">{territory.flag}</div>
                  <h3 className="font-bold text-gray-900 mb-2">{territory.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{territory.regulator.name}</p>
                  {selectedPrimary === territory.id && (
                    <CheckCircle className="h-6 w-6 text-blue-600 mx-auto" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedPrimary && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-center mb-4">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <h3 className="font-semibold text-green-900">
                Primary Territory Selected: {primaryTerritory?.name}
              </h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-green-800">
                  <strong>Regulator:</strong> {primaryTerritory?.regulator.name}
                </p>
                <p className="text-green-800">
                  <strong>Framework:</strong> {primaryTerritory?.compliance.framework}
                </p>
              </div>
              <div>
                <p className="text-green-800">
                  <strong>Inspection Cycle:</strong> Every {primaryTerritory?.regulator.inspectionCycle} months
                </p>
                <p className="text-green-800">
                  <strong>Data Retention:</strong> {primaryTerritory?.compliance.dataRetention} years
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="multiRegion"
              checked={isMultiRegion}
              onChange={(e) => setIsMultiRegion(e.target.checked)}
              className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="multiRegion" className="ml-3 text-gray-900 font-medium">
              I operate care homes in multiple territories
            </label>
          </div>
          
          {isMultiRegion && (
            <div className="ml-8 space-y-3">
              <p className="text-gray-600 text-sm mb-4">
                Select additional territories where you operate care homes:
              </p>
              {Object.values(TERRITORIES)
                .filter(t => t.id !== selectedPrimary)
                .map((territory) => (
                  <div key={territory.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={territory.id}
                      checked={selectedAdditional.includes(territory.id)}
                      onChange={() => handleAdditionalToggle(territory.id)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor={territory.id} className="ml-3 text-gray-700 flex items-center">
                      <span className="mr-2">{territory.flag}</span>
                      {territory.name} ({territory.regulator.name})
                    </label>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => setStep(2)}
            disabled={!selectedPrimary}
            size="lg"
            variant="care"
          >
            Continue Setup
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Care Home Details
          </h1>
          <p className="text-xl text-gray-600">
            Tell us about your care home for territory-specific setup
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Care Home Name *
              </label>
              <input
                type="text"
                value={careHomeDetails.name}
                onChange={(e) => setCareHomeDetails(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                placeholder="Enter care home name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Number *
              </label>
              <input
                type="text"
                value={careHomeDetails.registrationNumber}
                onChange={(e) => setCareHomeDetails(prev => ({ ...prev, registrationNumber: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                placeholder={`${primaryTerritory?.regulator.name} registration number`}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Address *
              </label>
              <textarea
                value={careHomeDetails.address}
                onChange={(e) => setCareHomeDetails(prev => ({ ...prev, address: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                placeholder="Enter complete address including postcode"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resident Capacity *
              </label>
              <input
                type="number"
                value={careHomeDetails.capacity}
                onChange={(e) => setCareHomeDetails(prev => ({ ...prev, capacity: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                placeholder="Maximum number of residents"
              />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-blue-900 mb-4">Territory-Specific Configuration</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-blue-800">Primary Territory:</span>
              <span className="font-medium text-blue-900">
                {primaryTerritory?.flag} {primaryTerritory?.name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-800">Regulatory Framework:</span>
              <span className="font-medium text-blue-900 text-sm">
                {primaryTerritory?.compliance.framework}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-800">Support Contact:</span>
              <span className="font-medium text-blue-900">
                {primaryTerritory?.support.phone}
              </span>
            </div>
            {additionalTerritories.length > 0 && (
              <div className="border-t border-blue-200 pt-4">
                <span className="text-blue-800 block mb-2">Additional Territories:</span>
                {additionalTerritories.map(territory => (
                  <div key={territory.id} className="flex items-center justify-between text-sm">
                    <span className="text-blue-700">
                      {territory.flag} {territory.name}
                    </span>
                    <span className="text-blue-800">{territory.regulator.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            onClick={() => setStep(1)}
            variant="outline"
            size="lg"
          >
            Back
          </Button>
          <Button
            onClick={handleComplete}
            disabled={!careHomeDetails.name || !careHomeDetails.registrationNumber || !careHomeDetails.address || !careHomeDetails.capacity}
            size="lg"
            variant="care"
          >
            Complete Setup
            <CheckCircle className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    )
  }

  return null
}