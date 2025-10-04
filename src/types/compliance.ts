// Comprehensive compliance framework for all British Isles territories
export interface Territory {
  id: string
  name: string
  flag: string
  regulator: {
    name: string
    website: string
    inspectionCycle: number // months
    emergencyContact: string
  }
  compliance: {
    framework: string
    standards: string[]
    mandatoryReports: string[]
    inspectionTypes: string[]
    dataRetention: number // years
    staffTrainingHours: number // annual minimum
  }
  documentation: {
    carePlanFormat: string
    incidentReporting: string
    medicationManagement: string
    staffingRecords: string
  }
  support: {
    phone: string
    email: string
    timezone: string
    businessHours: string
  }
}

export const TERRITORIES: Record<string, Territory> = {
  england: {
    id: 'england',
    name: 'England',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    regulator: {
      name: 'Care Quality Commission (CQC)',
      website: 'https://www.cqc.org.uk',
      inspectionCycle: 24,
      emergencyContact: '03000 616161'
    },
    compliance: {
      framework: 'Health and Social Care Act 2008',
      standards: [
        'Safe',
        'Effective', 
        'Caring',
        'Responsive',
        'Well-led'
      ],
      mandatoryReports: [
        'Statutory notifications',
        'Annual returns',
        'Safeguarding reports',
        'Serious incident reports'
      ],
      inspectionTypes: [
        'Comprehensive',
        'Focused',
        'Responsive',
        'Special measures'
      ],
      dataRetention: 7,
      staffTrainingHours: 40
    },
    documentation: {
      carePlanFormat: 'Person-centered care plan (CQC)',
      incidentReporting: 'CQC incident notification',
      medicationManagement: 'MARS charts (CQC compliant)',
      staffingRecords: 'DBS and training matrix'
    },
    support: {
      phone: '+44 20 7946 0958',
      email: 'england@writecarenotes.co.uk',
      timezone: 'GMT',
      businessHours: 'Mon-Fri 8AM-6PM'
    }
  },
  scotland: {
    id: 'scotland',
    name: 'Scotland',
    flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    regulator: {
      name: 'Care Inspectorate',
      website: 'https://www.careinspectorate.com',
      inspectionCycle: 36,
      emergencyContact: '0345 600 9527'
    },
    compliance: {
      framework: 'Health and Social Care Standards',
      standards: [
        'I experience high quality care and support',
        'I am fully involved in all decisions',
        'I have confidence in the people',
        'I have confidence in the organisation',
        'I use a service and organisation'
      ],
      mandatoryReports: [
        'Annual return',
        'Incident notifications',
        'Safeguarding reports',
        'Complaints summary'
      ],
      inspectionTypes: [
        'Unannounced inspection',
        'Joint inspection',
        'Themed inspection',
        'Follow-up inspection'
      ],
      dataRetention: 6,
      staffTrainingHours: 35
    },
    documentation: {
      carePlanFormat: 'Outcome-focused care plan (CI)',
      incidentReporting: 'Care Inspectorate notification',
      medicationManagement: 'Scottish medication records',
      staffingRecords: 'PVG and SSSC registration'
    },
    support: {
      phone: '+44 131 558 8400',
      email: 'scotland@writecarenotes.co.uk',
      timezone: 'GMT',
      businessHours: 'Mon-Fri 8AM-6PM'
    }
  },
  wales: {
    id: 'wales',
    name: 'Wales',
    flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    regulator: {
      name: 'Care Inspectorate Wales (CIW)',
      website: 'https://careinspectorate.wales',
      inspectionCycle: 24,
      emergencyContact: '0300 7900 126'
    },
    compliance: {
      framework: 'Regulation and Inspection of Social Care (Wales) Act 2016',
      standards: [
        'Well-being',
        'People are protected',
        'Leadership and management',
        'Environment'
      ],
      mandatoryReports: [
        'Annual return',
        'Notifications of events',
        'Quality of care review',
        'Statement of purpose'
      ],
      inspectionTypes: [
        'Baseline assessment',
        'Focused inspection',
        'Performance evaluation',
        'Special inspection'
      ],
      dataRetention: 7,
      staffTrainingHours: 40
    },
    documentation: {
      carePlanFormat: 'Well-being focused care plan (CIW)',
      incidentReporting: 'CIW notification form',
      medicationManagement: 'Welsh medication administration',
      staffingRecords: 'DBS and Social Care Wales registration'
    },
    support: {
      phone: '+44 29 2090 5040',
      email: 'wales@writecarenotes.co.uk',
      timezone: 'GMT',
      businessHours: 'Mon-Fri 8AM-6PM (Welsh available)'
    }
  },
  northernireland: {
    id: 'northernireland',
    name: 'Northern Ireland',
    flag: '🇬🇧',
    regulator: {
      name: 'Regulation and Quality Improvement Authority (RQIA)',
      website: 'https://www.rqia.org.uk',
      inspectionCycle: 24,
      emergencyContact: '028 9051 7500'
    },
    compliance: {
      framework: 'The Health and Personal Social Services (Quality, Improvement and Regulation) (Northern Ireland) Order 2003',
      standards: [
        'Governance and management',
        'Staffing',
        'Care provision',
        'Environment',
        'Trust and confidence'
      ],
      mandatoryReports: [
        'Annual quality report',
        'Incident notifications',
        'Monthly monitoring returns',
        'Safeguarding reports'
      ],
      inspectionTypes: [
        'Unannounced inspection',
        'Announced inspection',
        'Follow-up inspection',
        'Themed inspection'
      ],
      dataRetention: 7,
      staffTrainingHours: 40
    },
    documentation: {
      carePlanFormat: 'Person-centered care plan (RQIA)',
      incidentReporting: 'RQIA notification system',
      medicationManagement: 'NI medication management',
      staffingRecords: 'Access NI and NISCC registration'
    },
    support: {
      phone: '+44 28 9051 7500',
      email: 'ni@writecarenotes.co.uk',
      timezone: 'GMT',
      businessHours: 'Mon-Fri 8AM-6PM'
    }
  },
  ireland: {
    id: 'ireland',
    name: 'Republic of Ireland',
    flag: '🇮🇪',
    regulator: {
      name: 'Health Information and Quality Authority (HIQA)',
      website: 'https://www.hiqa.ie',
      inspectionCycle: 18,
      emergencyContact: '+353 1 814 7400'
    },
    compliance: {
      framework: 'Health Act 2007 (Care and Support of Residents in Designated Centres for Persons (Children and Adults) with Disabilities) Regulations 2013',
      standards: [
        'Person-centred care and support',
        'Effective services',
        'Safe services',
        'Better health and wellbeing',
        'Leadership, governance and management'
      ],
      mandatoryReports: [
        'Annual review',
        'Incident notifications',
        'Six monthly returns',
        'Safeguarding and protection reports'
      ],
      inspectionTypes: [
        'Unannounced inspection',
        'Announced inspection',
        'Follow-up inspection',
        'Themed inspection'
      ],
      dataRetention: 7,
      staffTrainingHours: 40
    },
    documentation: {
      carePlanFormat: 'Person-centered care plan (HIQA)',
      incidentReporting: 'HIQA incident notification',
      medicationManagement: 'Irish medication management',
      staffingRecords: 'Garda vetting and qualifications'
    },
    support: {
      phone: '+353 1 814 7400',
      email: 'ireland@writecarenotes.co.uk',
      timezone: 'GMT',
      businessHours: 'Mon-Fri 8AM-6PM (Irish available)'
    }
  },
  jersey: {
    id: 'jersey',
    name: 'Jersey',
    flag: '🇯🇪',
    regulator: {
      name: 'Jersey Care Commission',
      website: 'https://carecommission.je',
      inspectionCycle: 24,
      emergencyContact: '+44 1534 445 500'
    },
    compliance: {
      framework: 'Care Standards (Jersey) Law 2014',
      standards: [
        'Person-centered care',
        'Safety and protection',
        'Health and wellbeing',
        'Choice and control',
        'Facilities and environment'
      ],
      mandatoryReports: [
        'Annual return',
        'Incident notifications',
        'Safeguarding reports',
        'Quality monitoring'
      ],
      inspectionTypes: [
        'Announced inspection',
        'Unannounced inspection',
        'Focused inspection',
        'Re-inspection'
      ],
      dataRetention: 7,
      staffTrainingHours: 35
    },
    documentation: {
      carePlanFormat: 'Jersey care plan template',
      incidentReporting: 'Jersey incident notification',
      medicationManagement: 'Jersey medication protocols',
      staffingRecords: 'DBS equivalent and registration'
    },
    support: {
      phone: '+44 1534 445 500',
      email: 'jersey@writecarenotes.co.uk',
      timezone: 'GMT',
      businessHours: 'Mon-Fri 8AM-6PM'
    }
  },
  guernsey: {
    id: 'guernsey',
    name: 'Guernsey',
    flag: '🇬🇬',
    regulator: {
      name: 'Committee for Health & Social Care',
      website: 'https://www.gov.gg',
      inspectionCycle: 36,
      emergencyContact: '+44 1481 717 000'
    },
    compliance: {
      framework: 'Care Standards (Guernsey) Law',
      standards: [
        'Quality of life',
        'Safety and security',
        'Health and wellbeing',
        'Choice and independence',
        'Complaints and concerns'
      ],
      mandatoryReports: [
        'Annual report',
        'Incident reports',
        'Safeguarding notifications',
        'Quality reviews'
      ],
      inspectionTypes: [
        'Regulatory inspection',
        'Compliance inspection',
        'Follow-up inspection',
        'Themed inspection'
      ],
      dataRetention: 6,
      staffTrainingHours: 30
    },
    documentation: {
      carePlanFormat: 'Guernsey care planning format',
      incidentReporting: 'Guernsey incident system',
      medicationManagement: 'Guernsey medication management',
      staffingRecords: 'Guernsey vetting requirements'
    },
    support: {
      phone: '+44 1481 717 000',
      email: 'guernsey@writecarenotes.co.uk',
      timezone: 'GMT',
      businessHours: 'Mon-Fri 8AM-6PM'
    }
  },
  isleofman: {
    id: 'isleofman',
    name: 'Isle of Man',
    flag: '🇮🇲',
    regulator: {
      name: 'Department of Health and Social Care',
      website: 'https://www.gov.im',
      inspectionCycle: 24,
      emergencyContact: '+44 1624 685 000'
    },
    compliance: {
      framework: 'Care Standards Act (Isle of Man)',
      standards: [
        'Person-centered care',
        'Health and safety',
        'Staffing',
        'Management and leadership',
        'Environment and facilities'
      ],
      mandatoryReports: [
        'Annual monitoring',
        'Incident notifications',
        'Safeguarding reports',
        'Inspection responses'
      ],
      inspectionTypes: [
        'Announced inspection',
        'Unannounced inspection',
        'Focused inspection',
        'Investigation'
      ],
      dataRetention: 7,
      staffTrainingHours: 35
    },
    documentation: {
      carePlanFormat: 'Isle of Man care plan',
      incidentReporting: 'IoM incident notification',
      medicationManagement: 'IoM medication procedures',
      staffingRecords: 'Isle of Man vetting and training'
    },
    support: {
      phone: '+44 1624 685 000',
      email: 'iom@writecarenotes.co.uk',
      timezone: 'GMT',
      businessHours: 'Mon-Fri 8AM-6PM'
    }
  }
}

export interface ComplianceRequirement {
  id: string
  territory: string
  category: 'documentation' | 'training' | 'reporting' | 'inspection' | 'safeguarding'
  title: string
  description: string
  deadline?: Date
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'as-needed'
  mandatory: boolean
  status: 'compliant' | 'due-soon' | 'overdue' | 'not-applicable'
}

export interface UserTerritory {
  primary: string // main territory
  additional?: string[] // for multi-region operations
  multiRegionLicense?: boolean
}

export const getTerritoryCompliance = (territoryId: string): Territory => {
  return TERRITORIES[territoryId]
}

export const getApplicableStandards = (userTerritories: UserTerritory): Territory[] => {
  const territories = [userTerritories.primary]
  if (userTerritories.additional) {
    territories.push(...userTerritories.additional)
  }
  
  return territories.map(id => TERRITORIES[id]).filter(Boolean)
}

export const validateComplianceAcrossTerms = (
  requirements: ComplianceRequirement[],
  territories: string[]
): { compliant: boolean; issues: string[] } => {
  const issues: string[] = []
  let compliant = true

  territories.forEach(territoryId => {
    const territory = TERRITORIES[territoryId]
    const territoryRequirements = requirements.filter(r => r.territory === territoryId)
    
    // Check mandatory requirements
    territory.compliance.mandatoryReports.forEach(report => {
      const hasRequirement = territoryRequirements.find(r => 
        r.title.toLowerCase().includes(report.toLowerCase())
      )
      if (!hasRequirement) {
        issues.push(`Missing ${report} requirement for ${territory.name}`)
        compliant = false
      }
    })
  })

  return { compliant, issues }
}