import { Territory, TERRITORIES } from '../types/compliance'

// Territory-specific document templates
export interface DocumentTemplate {
  id: string
  territory: string
  category: 'care-plan' | 'incident-report' | 'medication-record' | 'staff-record' | 'inspection-report'
  name: string
  description: string
  fields: DocumentField[]
  mandatoryFields: string[]
  regulatoryRequirements: string[]
}

export interface DocumentField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'date' | 'time' | 'select' | 'checkbox' | 'number' | 'file'
  required: boolean
  options?: string[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  territorySpecific?: boolean
  regulatoryNote?: string
}

// Care Plan Templates for each territory
export const CARE_PLAN_TEMPLATES: Record<string, DocumentTemplate> = {
  england: {
    id: 'care-plan-england',
    territory: 'england',
    category: 'care-plan',
    name: 'CQC Person-Centered Care Plan',
    description: 'Care plan template compliant with CQC fundamental standards',
    fields: [
      {
        id: 'resident-details',
        label: 'Resident Details',
        type: 'text',
        required: true,
        regulatoryNote: 'Required under CQC Regulation 9 - Person-centered care'
      },
      {
        id: 'mental-capacity-assessment',
        label: 'Mental Capacity Assessment',
        type: 'textarea',
        required: true,
        territorySpecific: true,
        regulatoryNote: 'Mental Capacity Act 2005 compliance - CQC Regulation 11'
      },
      {
        id: 'safeguarding-concerns',
        label: 'Safeguarding Risk Assessment',
        type: 'textarea',
        required: true,
        regulatoryNote: 'CQC Regulation 13 - Safeguarding service users'
      },
      {
        id: 'dols-assessment',
        label: 'Deprivation of Liberty Safeguards (DoLS)',
        type: 'select',
        required: true,
        options: ['Not applicable', 'Under assessment', 'Authorized', 'Refused'],
        territorySpecific: true,
        regulatoryNote: 'DoLS compliance under Mental Capacity Act'
      }
    ],
    mandatoryFields: ['resident-details', 'mental-capacity-assessment', 'safeguarding-concerns'],
    regulatoryRequirements: [
      'CQC Regulation 9 - Person-centered care',
      'CQC Regulation 11 - Need for consent',
      'CQC Regulation 13 - Safeguarding service users',
      'Mental Capacity Act 2005',
      'Care Act 2014'
    ]
  },
  scotland: {
    id: 'care-plan-scotland',
    territory: 'scotland',
    category: 'care-plan',
    name: 'Health and Social Care Standards Care Plan',
    description: 'Outcome-focused care plan for Scottish care standards',
    fields: [
      {
        id: 'resident-outcomes',
        label: 'Personal Outcomes',
        type: 'textarea',
        required: true,
        regulatoryNote: 'Health and Social Care Standards - My personal outcomes'
      },
      {
        id: 'involvement-decision',
        label: 'Involvement in Decisions',
        type: 'textarea',
        required: true,
        territorySpecific: true,
        regulatoryNote: 'Standard: I am fully involved in all decisions about my care'
      },
      {
        id: 'awia-assessment',
        label: 'Adults with Incapacity Act Assessment',
        type: 'textarea',
        required: false,
        territorySpecific: true,
        regulatoryNote: 'Adults with Incapacity (Scotland) Act 2000'
      },
      {
        id: 'anticipatory-care',
        label: 'Anticipatory Care Planning',
        type: 'textarea',
        required: true,
        territorySpecific: true,
        regulatoryNote: 'Scottish approach to care planning and advance directives'
      }
    ],
    mandatoryFields: ['resident-outcomes', 'involvement-decision', 'anticipatory-care'],
    regulatoryRequirements: [
      'Health and Social Care Standards',
      'Adults with Incapacity (Scotland) Act 2000',
      'Social Care (Self-directed Support) (Scotland) Act 2013',
      'Adult Support and Protection (Scotland) Act 2007'
    ]
  },
  wales: {
    id: 'care-plan-wales',
    territory: 'wales',
    category: 'care-plan',
    name: 'Well-being Focused Care Plan (CIW)',
    description: 'Care plan focusing on well-being outcomes for Welsh compliance',
    fields: [
      {
        id: 'wellbeing-assessment',
        label: 'Well-being Assessment',
        type: 'textarea',
        required: true,
        regulatoryNote: 'Social Services and Well-being (Wales) Act 2014'
      },
      {
        id: 'welsh-language-preference',
        label: 'Welsh Language Preference',
        type: 'select',
        required: true,
        options: ['English only', 'Welsh only', 'Bilingual', 'No preference'],
        territorySpecific: true,
        regulatoryNote: 'Welsh Language (Wales) Measure 2011'
      },
      {
        id: 'advocacy-rights',
        label: 'Advocacy Rights Information',
        type: 'textarea',
        required: true,
        territorySpecific: true,
        regulatoryNote: 'Independent advocacy under Social Services and Well-being Act'
      },
      {
        id: 'deprivation-liberty',
        label: 'Deprivation of Liberty (Wales)',
        type: 'textarea',
        required: false,
        territorySpecific: true,
        regulatoryNote: 'Liberty Protection Safeguards implementation in Wales'
      }
    ],
    mandatoryFields: ['wellbeing-assessment', 'welsh-language-preference', 'advocacy-rights'],
    regulatoryRequirements: [
      'Social Services and Well-being (Wales) Act 2014',
      'Regulation and Inspection of Social Care (Wales) Act 2016',
      'Welsh Language (Wales) Measure 2011',
      'Mental Capacity Act 2005 (Wales)'
    ]
  },
  northernireland: {
    id: 'care-plan-ni',
    territory: 'northernireland',
    category: 'care-plan',
    name: 'RQIA Person-Centered Care Plan',
    description: 'Care plan template for Northern Ireland RQIA compliance',
    fields: [
      {
        id: 'care-needs-assessment',
        label: 'Care Needs Assessment',
        type: 'textarea',
        required: true,
        regulatoryNote: 'RQIA care standards for nursing homes'
      },
      {
        id: 'human-rights',
        label: 'Human Rights Considerations',
        type: 'textarea',
        required: true,
        territorySpecific: true,
        regulatoryNote: 'Human Rights Act 1998 and ECHR Article 8'
      },
      {
        id: 'safeguarding-procedures',
        label: 'Safeguarding Procedures (NI)',
        type: 'textarea',
        required: true,
        territorySpecific: true,
        regulatoryNote: 'Adult Safeguarding Prevention and Protection in Partnership (2015)'
      },
      {
        id: 'equality-impact',
        label: 'Equality Impact Assessment',
        type: 'textarea',
        required: false,
        territorySpecific: true,
        regulatoryNote: 'Section 75 Northern Ireland Act 1998'
      }
    ],
    mandatoryFields: ['care-needs-assessment', 'human-rights', 'safeguarding-procedures'],
    regulatoryRequirements: [
      'Health and Personal Social Services (Quality, Improvement and Regulation) Order 2003',
      'Human Rights Act 1998',
      'Northern Ireland Act 1998 Section 75',
      'Mental Capacity Act (Northern Ireland) 2016'
    ]
  },
  ireland: {
    id: 'care-plan-ireland',
    territory: 'ireland',
    category: 'care-plan',
    name: 'HIQA Person-Centered Care Plan',
    description: 'Care plan template compliant with Irish HIQA standards',
    fields: [
      {
        id: 'person-centered-plan',
        label: 'Person-Centered Plan',
        type: 'textarea',
        required: true,
        regulatoryNote: 'HIQA National Standards for Residential Care Settings'
      },
      {
        id: 'assisted-decision-making',
        label: 'Assisted Decision-Making Assessment',
        type: 'textarea',
        required: true,
        territorySpecific: true,
        regulatoryNote: 'Assisted Decision-Making (Capacity) Act 2015'
      },
      {
        id: 'safeguarding-dignity',
        label: 'Safeguarding and Dignity',
        type: 'textarea',
        required: true,
        territorySpecific: true,
        regulatoryNote: 'Safeguarding Vulnerable Persons at Risk of Abuse Policy'
      },
      {
        id: 'complaints-advocacy',
        label: 'Complaints and Advocacy Information',
        type: 'textarea',
        required: true,
        territorySpecific: true,
        regulatoryNote: 'HIQA complaint procedures and advocacy services'
      }
    ],
    mandatoryFields: ['person-centered-plan', 'assisted-decision-making', 'safeguarding-dignity'],
    regulatoryRequirements: [
      'Health Act 2007',
      'Assisted Decision-Making (Capacity) Act 2015',
      'HIQA National Standards for Residential Care Settings',
      'Data Protection Act 2018 (Ireland)'
    ]
  },
  jersey: {
    id: 'care-plan-jersey',
    territory: 'jersey',
    category: 'care-plan',
    name: 'Jersey Care Commission Care Plan',
    description: 'Care plan template for Jersey care standards',
    fields: [
      {
        id: 'individual-care-plan',
        label: 'Individual Care Plan',
        type: 'textarea',
        required: true,
        regulatoryNote: 'Care Standards (Jersey) Law 2014'
      },
      {
        id: 'capacity-assessment-jersey',
        label: 'Capacity Assessment (Jersey Law)',
        type: 'textarea',
        required: true,
        territorySpecific: true,
        regulatoryNote: 'Capacity and Self-Determination (Jersey) Law 2016'
      },
      {
        id: 'safeguarding-jersey',
        label: 'Safeguarding Arrangements',
        type: 'textarea',
        required: true,
        territorySpecific: true,
        regulatoryNote: 'Safeguarding Partnership Board Jersey procedures'
      }
    ],
    mandatoryFields: ['individual-care-plan', 'capacity-assessment-jersey', 'safeguarding-jersey'],
    regulatoryRequirements: [
      'Care Standards (Jersey) Law 2014',
      'Capacity and Self-Determination (Jersey) Law 2016',
      'Data Protection (Jersey) Law 2018'
    ]
  },
  guernsey: {
    id: 'care-plan-guernsey',
    territory: 'guernsey',
    category: 'care-plan',
    name: 'Guernsey Care Standards Plan',
    description: 'Care plan template for Guernsey care requirements',
    fields: [
      {
        id: 'care-assessment-guernsey',
        label: 'Care Assessment',
        type: 'textarea',
        required: true,
        regulatoryNote: 'Care Standards (Guernsey) Law requirements'
      },
      {
        id: 'mental-capacity-guernsey',
        label: 'Mental Capacity (Guernsey)',
        type: 'textarea',
        required: true,
        territorySpecific: true,
        regulatoryNote: 'Mental Health (Bailiwick of Guernsey) Law 2010'
      },
      {
        id: 'safeguarding-guernsey',
        label: 'Safeguarding Procedures',
        type: 'textarea',
        required: true,
        territorySpecific: true,
        regulatoryNote: 'Guernsey safeguarding procedures and policies'
      }
    ],
    mandatoryFields: ['care-assessment-guernsey', 'mental-capacity-guernsey', 'safeguarding-guernsey'],
    regulatoryRequirements: [
      'Care Standards (Guernsey) Law',
      'Mental Health (Bailiwick of Guernsey) Law 2010',
      'Data Protection (Bailiwick of Guernsey) Law 2017'
    ]
  },
  isleofman: {
    id: 'care-plan-iom',
    territory: 'isleofman',
    category: 'care-plan',
    name: 'Isle of Man Care Plan',
    description: 'Care plan template for Isle of Man standards',
    fields: [
      {
        id: 'care-plan-iom',
        label: 'Individual Care Plan',
        type: 'textarea',
        required: true,
        regulatoryNote: 'Care Standards Act (Isle of Man)'
      },
      {
        id: 'mental-health-iom',
        label: 'Mental Health Assessment',
        type: 'textarea',
        required: true,
        territorySpecific: true,
        regulatoryNote: 'Mental Health Act 1998 (Isle of Man)'
      },
      {
        id: 'adult-protection-iom',
        label: 'Adult Protection Considerations',
        type: 'textarea',
        required: true,
        territorySpecific: true,
        regulatoryNote: 'Adult Protection Act 2018 (Isle of Man)'
      }
    ],
    mandatoryFields: ['care-plan-iom', 'mental-health-iom', 'adult-protection-iom'],
    regulatoryRequirements: [
      'Care Standards Act (Isle of Man)',
      'Mental Health Act 1998 (Isle of Man)',
      'Adult Protection Act 2018 (Isle of Man)',
      'Data Protection Act 2018 (Isle of Man)'
    ]
  }
}

// Get template by territory
export const getCarePlanTemplate = (territoryId: string): DocumentTemplate => {
  return CARE_PLAN_TEMPLATES[territoryId]
}

// Get all templates for territories
export const getTemplatesForTerritories = (territoryIds: string[]): DocumentTemplate[] => {
  return territoryIds.map(id => CARE_PLAN_TEMPLATES[id]).filter(Boolean)
}

// Validate document against territory requirements
export const validateDocument = (
  document: Record<string, any>,
  template: DocumentTemplate
): { valid: boolean; errors: string[]; warnings: string[] } => {
  const errors: string[] = []
  const warnings: string[] = []

  // Check mandatory fields
  template.mandatoryFields.forEach(fieldId => {
    const field = template.fields.find(f => f.id === fieldId)
    if (field && (!document[fieldId] || document[fieldId].trim() === '')) {
      errors.push(`${field.label} is required for ${TERRITORIES[template.territory].name} compliance`)
    }
  })

  // Check field validations
  template.fields.forEach(field => {
    const value = document[field.id]
    if (field.validation && value) {
      if (field.validation.min && value.length < field.validation.min) {
        errors.push(`${field.label} must be at least ${field.validation.min} characters`)
      }
      if (field.validation.max && value.length > field.validation.max) {
        warnings.push(`${field.label} exceeds recommended length of ${field.validation.max} characters`)
      }
      if (field.validation.pattern && !new RegExp(field.validation.pattern).test(value)) {
        errors.push(field.validation.message || `${field.label} format is invalid`)
      }
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

// Generate territory-specific compliance report
export const generateComplianceReport = (
  territoryId: string,
  documents: Record<string, any>[]
): {
  territory: Territory
  totalDocuments: number
  compliantDocuments: number
  complianceRate: number
  issues: string[]
  recommendations: string[]
} => {
  const territory = TERRITORIES[territoryId]
  const template = CARE_PLAN_TEMPLATES[territoryId]
  const issues: string[] = []
  const recommendations: string[] = []
  
  let compliantDocuments = 0
  
  documents.forEach((doc, index) => {
    const validation = validateDocument(doc, template)
    if (validation.valid) {
      compliantDocuments++
    } else {
      issues.push(`Document ${index + 1}: ${validation.errors.join(', ')}`)
    }
    
    if (validation.warnings.length > 0) {
      recommendations.push(`Document ${index + 1}: ${validation.warnings.join(', ')}`)
    }
  })
  
  const complianceRate = documents.length > 0 ? (compliantDocuments / documents.length) * 100 : 100
  
  return {
    territory,
    totalDocuments: documents.length,
    compliantDocuments,
    complianceRate: Math.round(complianceRate),
    issues,
    recommendations
  }
}