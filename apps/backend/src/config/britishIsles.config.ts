/**
 * British Isles Regional Configuration
 * 
 * Jurisdiction-specific settings for ALL 8 BRITISH ISLESJURISDICTIONS:
 * - England, Scotland, Wales, Northern Ireland (UK)
 * - Ireland (Republic of Ireland)
 * - Jersey, Guernsey, Isle of Man (Crown Dependencies)
 * 
 * Handles regional var iationsin:
 * - Leaving care ages and support
 * - Benefits systems
 * - Healthcare providers
 * - Housing authorities
 * - Statutory compliance
 * 
 * COMPLIANCE:
 * UK:
 * - Children (Leaving Care) Act 2000 (England & Wales)
 * - Regulation of Care (Scotland) Act 2001
 * - Children (Leaving Care) Act (NI) 2002
 * - Care Leavers (England) Regulations 2010
 * - Staying Put Scotland 2013
 * - Social Services and Well-being (Wales) Act 2014
 * 
 * Republic ofIreland:
 * - Child Care Act 1991
 * - Aftercare Act 2015
 * 
 * CrownDependencies:
 * - Children (Jersey) Law 2002
 * - Children (Guernsey and Alderney) Law 2008
 * - Children and Young Persons Act 2001 (Isle of Man)
 */

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export type Jurisdiction = 
  | 'England' 
  | 'Scotland' 
  | 'Wales' 
  | 'Northern Ireland'
  | 'Ireland'
  | 'Jersey'
  | 'Guernsey'
  | 'Isle of Man';

export interface RegionalConfig {
  jurisdiction: Jurisdiction;
  leavingCare: {
    eligibilityAge: number; // Age care leaver support starts
    maxSupportAge: number; // Maximum age for support
    continuingCareAge?: number; // Scotland-specific (up to 26)
    stayingPutEnabled: boolean;
    stayingPutMaxAge: number;
    pathwayPlanRequired: boolean;
    pathwayPlanStartAge: number;
  };
  benefits: {
    system: string; // e.g., "Universal Credit", "Scottish Welfare Fund"
    informationUrl: string;
    careLeaverEntitlements: string[];
    emergencyFund: string | null;
    settingUpHomeGrant: boolean;
  };
  healthcare: {
    provider: string; // NHS England, NHS Scotland, NHS Wales, HSC NI
    primaryCareUrl: string;
    mentalHealthService: string;
    transitionAge: number; // CAMHS to adult services
    careLeaverPriority: boolean;
  };
  housing: {
    authority: string; // Council, Housing Executive NI, Common Housing Register Scotland
    shelterBranch: string;
    homelessnessUrl: string;
    priorityNeed: boolean; // Care leavers as priority
    localConnectionRule: boolean;
  };
  employment: {
    careersService: string;
    apprenticeshipsUrl: string;
    careLeaverSupport: string[];
  };
  education: {
    system: string;
    pepRequired: boolean; // Personal Education Plan
    bursaryAvailable: boolean;
    careLeaverBursary: number | null; // Annual amount
  };
  statutory: {
    primaryAct: string;
    regulatoryBody: string;
    inspectorateUrl: string;
  };
  resources: {
    governmentPortal: string;
    careLeaverCharity: string;
    localAuthorityUrl: string;
  };
}

// ==========================================
// ENGLAND CONFIGURATION
// ==========================================

export const ENGLAND_CONFIG: RegionalConfig = {
  jurisdiction: 'England',
  leavingCare: {
    eligibilityAge: 16,
    maxSupportAge: 25,
    stayingPutEnabled: true,
    stayingPutMaxAge: 21,
    pathwayPlanRequired: true,
    pathwayPlanStartAge: 16
  },
  benefits: {
    system: 'Universal Credit',
    informationUrl: 'https://www.gov.uk/universal-credit',
    careLeaverEntitlements: [
      'Universal Credit (no work requirements until 22)',
      'Council Tax Support (exemption in some areas)',
      'Setting Up Home Grant (discretionary)',
      'Personal Independence Payment (if eligible)',
      'Housing Benefit (legacy cases)'
    ],
    emergencyFund: 'Discretionary Housing Payment',
    settingUpHomeGrant: true
  },
  healthcare: {
    provider: 'NHS England',
    primaryCareUrl: 'https://www.nhs.uk',
    mentalHealthService: 'CAMHS (under 18) / IAPT (18+)',
    transitionAge: 18,
    careLeaverPriority: true
  },
  housing: {
    authority: 'Local Council',
    shelterBranch: 'Shelter England',
    homelessnessUrl: 'https://england.shelter.org.uk',
    priorityNeed: true,
    localConnectionRule: true
  },
  employment: {
    careersService: 'National Careers Service',
    apprenticeshipsUrl: 'https://www.gov.uk/apply-apprenticeship',
    careLeaverSupport: [
      'Care Leaver Covenant',
      'Jobcentre Plus support',
      'Access to apprenticeships'
    ]
  },
  education: {
    system: 'England Education System',
    pepRequired: true,
    bursaryAvailable: true,
    careLeaverBursary: 2000 // £2,000 16-19 Bursary Fund
  },
  statutory: {
    primaryAct: 'Children (Leaving Care) Act 2000',
    regulatoryBody: 'Ofsted',
    inspectorateUrl: 'https://www.gov.uk/ofsted'
  },
  resources: {
    governmentPortal: 'https://www.gov.uk',
    careLeaverCharity: 'Become Charity',
    localAuthorityUrl: 'https://www.gov.uk/find-local-council'
  }
};

// ==========================================
// SCOTLAND CONFIGURATION
// ==========================================

export const SCOTLAND_CONFIG: RegionalConfig = {
  jurisdiction: 'Scotland',
  leavingCare: {
    eligibilityAge: 16,
    maxSupportAge: 26, // Extended to 26 in Scotland
    continuingCareAge: 26,
    stayingPutEnabled: true,
    stayingPutMaxAge: 21,
    pathwayPlanRequired: true,
    pathwayPlanStartAge: 16
  },
  benefits: {
    system: 'Universal Credit + Scottish Welfare Fund',
    informationUrl: 'https://www.mygov.scot/scottish-welfare-fund',
    careLeaverEntitlements: [
      'Universal Credit (no work requirements until 22)',
      'Scottish Welfare Fund (Crisis Grant, Community Care Grant)',
      'Council Tax Reduction',
      'Best Start Grant (if eligible)',
      'Funeral Support Payment (if eligible)'
    ],
    emergencyFund: 'Scottish Welfare Fund',
    settingUpHomeGrant: true
  },
  healthcare: {
    provider: 'NHS Scotland',
    primaryCareUrl: 'https://www.nhsinform.scot',
    mentalHealthService: 'CAMHS (under 18) / Adult Mental Health Services',
    transitionAge: 18,
    careLeaverPriority: true
  },
  housing: {
    authority: 'Common Housing Register',
    shelterBranch: 'Shelter Scotland',
    homelessnessUrl: 'https://scotland.shelter.org.uk',
    priorityNeed: true,
    localConnectionRule: false // Scotland abolished local connection test
  },
  employment: {
    careersService: 'Skills Development Scotland',
    apprenticeshipsUrl: 'https://www.apprenticeships.scot',
    careLeaverSupport: [
      'Throughcare and Aftercare services',
      'WhoCares? Scotland',
      'Modern Apprenticeships',
      'Foundation Apprenticeships'
    ]
  },
  education: {
    system: 'Scottish Qualifications Authority (SQA)',
    pepRequired: true,
    bursaryAvailable: true,
    careLeaverBursary: 8000 // Scotland has higher education maintenance (approx £8,000)
  },
  statutory: {
    primaryAct: 'Regulation of Care (Scotland) Act 2001',
    regulatoryBody: 'Care Inspectorate',
    inspectorateUrl: 'https://www.careinspectorate.com'
  },
  resources: {
    governmentPortal: 'https://www.mygov.scot',
    careLeaverCharity: 'WhoCares? Scotland',
    localAuthorityUrl: 'https://www.mygov.scot/find-your-local-council'
  }
};

// ==========================================
// WALES CONFIGURATION
// ==========================================

export const WALES_CONFIG: RegionalConfig = {
  jurisdiction: 'Wales',
  leavingCare: {
    eligibilityAge: 16,
    maxSupportAge: 25,
    stayingPutEnabled: true,
    stayingPutMaxAge: 21,
    pathwayPlanRequired: true,
    pathwayPlanStartAge: 16
  },
  benefits: {
    system: 'Universal Credit',
    informationUrl: 'https://www.gov.uk/universal-credit',
    careLeaverEntitlements: [
      'Universal Credit (no work requirements until 22)',
      'Council Tax Reduction',
      'Discretionary Assistance Fund (Wales)',
      'Personal Independence Payment (if eligible)'
    ],
    emergencyFund: 'Discretionary Assistance Fund',
    settingUpHomeGrant: true
  },
  healthcare: {
    provider: 'NHS Wales (GIG Cymru)',
    primaryCareUrl: 'https://www.nhs.wales',
    mentalHealthService: 'CAMHS (under 18) / Local Health Board MH Services',
    transitionAge: 18,
    careLeaverPriority: true
  },
  housing: {
    authority: 'Local Authority',
    shelterBranch: 'Shelter Cymru',
    homelessnessUrl: 'https://sheltercymru.org.uk',
    priorityNeed: true,
    localConnectionRule: true
  },
  employment: {
    careersService: 'Careers Wales',
    apprenticeshipsUrl: 'https://careerswales.gov.wales/apprenticeships',
    careLeaverSupport: [
      'Voices From Care Cymru',
      'Communities First (legacy program)',
      'Apprenticeships Wales',
      'Working Wales support'
    ]
  },
  education: {
    system: 'Welsh Education System (Qualifications Wales)',
    pepRequired: true,
    bursaryAvailable: true,
    careLeaverBursary: 2000 // Education Maintenance Allowance
  },
  statutory: {
    primaryAct: 'Social Services and Well-being (Wales) Act 2014',
    regulatoryBody: 'Care Inspectorate Wales (CIW)',
    inspectorateUrl: 'https://www.careinspectorate.wales'
  },
  resources: {
    governmentPortal: 'https://www.gov.wales',
    careLeaverCharity: 'Voices From Care Cymru',
    localAuthorityUrl: 'https://www.gov.wales/find-your-local-authority'
  }
};

// ==========================================
// NORTHERN IRELAND CONFIGURATION
// ==========================================

export const NORTHERN_IRELAND_CONFIG: RegionalConfig = {
  jurisdiction: 'Northern Ireland',
  leavingCare: {
    eligibilityAge: 16,
    maxSupportAge: 25,
    stayingPutEnabled: true,
    stayingPutMaxAge: 21,
    pathwayPlanRequired: true,
    pathwayPlanStartAge: 16
  },
  benefits: {
    system: 'Universal Credit',
    informationUrl: 'https://www.nidirect.gov.uk/universal-credit',
    careLeaverEntitlements: [
      'Universal Credit (no work requirements until 22)',
      'Discretionary Support (Community Care Grant)',
      'Rate Relief (Council Tax equivalent)',
      'Personal Independence Payment (if eligible)'
    ],
    emergencyFund: 'Discretionary Support',
    settingUpHomeGrant: true
  },
  healthcare: {
    provider: 'Health and Social Care (HSC) Trusts',
    primaryCareUrl: 'https://www.nidirect.gov.uk/health',
    mentalHealthService: 'CAMHS (under 18) / Adult Mental Health Services',
    transitionAge: 18,
    careLeaverPriority: true
  },
  housing: {
    authority: 'Northern Ireland Housing Executive',
    shelterBranch: 'Housing Rights NI',
    homelessnessUrl: 'https://www.housingrights.org.uk',
    priorityNeed: true,
    localConnectionRule: true
  },
  employment: {
    careersService: 'Northern Ireland Statistics and Research Agency (NISRA)',
    apprenticeshipsUrl: 'https://www.nidirect.gov.uk/apprenticeships',
    careLeaverSupport: [
      'Voice of Young People in Care (VOYPIC)',
      'ApprenticeshipsNI',
      'Jobcentre support',
      'Include Youth'
    ]
  },
  education: {
    system: 'Northern Ireland Education System (CCEA)',
    pepRequired: true,
    bursaryAvailable: true,
    careLeaverBursary: 2000 // Educational Maintenance Allowance
  },
  statutory: {
    primaryAct: 'Children (Leaving Care) Act (Northern Ireland) 2002',
    regulatoryBody: 'Regulation and Quality Improvement Authority (RQIA)',
    inspectorateUrl: 'https://www.rqia.org.uk'
  },
  resources: {
    governmentPortal: 'https://www.nidirect.gov.uk',
    careLeaverCharity: 'Voice of Young People in Care (VOYPIC)',
    localAuthorityUrl: 'https://www.nidirect.gov.uk/contacts/health-and-social-care-trusts'
  }
};

// ==========================================
// REPUBLIC OF IRELAND CONFIGURATION
// ==========================================

export const IRELAND_CONFIG: RegionalConfig = {
  jurisdiction: 'Ireland',
  leavingCare: {
    eligibilityAge: 18,
    maxSupportAge: 23, // Aftercare to 23 in Ireland
    stayingPutEnabled: false, // Not statutory in Ireland
    stayingPutMaxAge: 21,
    pathwayPlanRequired: true,
    pathwayPlanStartAge: 16
  },
  benefits: {
    system: 'Social Welfare Ireland',
    informationUrl: 'https://www.gov.ie/en/service/social-welfare',
    careLeaverEntitlements: [
      'Jobseeker\'s Allowance (reduced rate until 25)',
      'Supplementary Welfare Allowance',
      'Back to Education Allowance',
      'Rent Supplement',
      'Medical Card (automatic for care leavers)'
    ],
    emergencyFund: 'Exceptional Needs Payment',
    settingUpHomeGrant: true
  },
  healthcare: {
    provider: 'HSE (Health Service Executive)',
    primaryCareUrl: 'https://www.hse.ie',
    mentalHealthService: 'CAMHS (under 18) / Adult Mental Health Services',
    transitionAge: 18,
    careLeaverPriority: true
  },
  housing: {
    authority: 'Local Authority Housing',
    shelterBranch: 'Focus Ireland / Threshold',
    homelessnessUrl: 'https://www.focusireland.ie',
    priorityNeed: true,
    localConnectionRule: false
  },
  employment: {
    careersService: 'Intreo (Department of Social Protection)',
    apprenticeshipsUrl: 'https://www.apprenticeship.ie',
    careLeaverSupport: [
      'EPIC (Empowering People in Care)',
      'Youth Employment Support Scheme',
      'JobPath',
      'Local Employment Services'
    ]
  },
  education: {
    system: 'Irish Education System (State Examinations Commission)',
    pepRequired: false, // Not statutory in Ireland
    bursaryAvailable: true,
    careLeaverBursary: 5000 // SUSI Grant + Care Leaver supports
  },
  statutory: {
    primaryAct: 'Child Care Act 1991 + Aftercare Act 2015',
    regulatoryBody: 'HIQA (Health Information and Quality Authority)',
    inspectorateUrl: 'https://www.hiqa.ie'
  },
  resources: {
    governmentPortal: 'https://www.gov.ie',
    careLeaverCharity: 'EPIC (Empowering People in Care)',
    localAuthorityUrl: 'https://www.gov.ie/en/directory/category/local-authorities'
  }
};

// ==========================================
// JERSEY CONFIGURATION
// ==========================================

export const JERSEY_CONFIG: RegionalConfig = {
  jurisdiction: 'Jersey',
  leavingCare: {
    eligibilityAge: 16,
    maxSupportAge: 25,
    stayingPutEnabled: true,
    stayingPutMaxAge: 21,
    pathwayPlanRequired: true,
    pathwayPlanStartAge: 16
  },
  benefits: {
    system: 'Jersey Social Security',
    informationUrl: 'https://www.gov.je/benefits',
    careLeaverEntitlements: [
      'Income Support',
      'Special Payments (care leavers)',
      'Rent rebate',
      'Healthcare coverage',
      'Residential care costs (if applicable)'
    ],
    emergencyFund: 'Special Payments',
    settingUpHomeGrant: true
  },
  healthcare: {
    provider: 'Jersey Health and Community Services',
    primaryCareUrl: 'https://www.gov.je/health',
    mentalHealthService: 'CAMHS (under 18) / Adult Mental Health',
    transitionAge: 18,
    careLeaverPriority: true
  },
  housing: {
    authority: 'Andium Homes / Jersey Homes Trust',
    shelterBranch: 'Jersey Shelter Trust',
    homelessnessUrl: 'https://www.gov.je/housing',
    priorityNeed: true,
    localConnectionRule: true
  },
  employment: {
    careersService: 'Jersey Employment Trust / Highlands College',
    apprenticeshipsUrl: 'https://www.gov.je/skillsjersey',
    careLeaverSupport: [
      'Back to Work scheme',
      'Advance to Work',
      'Skills Jersey',
      'Care Leaver Covenant (Jersey)'
    ]
  },
  education: {
    system: 'Jersey Education System',
    pepRequired: true,
    bursaryAvailable: true,
    careLeaverBursary: 3000 // Jersey Student Finance
  },
  statutory: {
    primaryAct: 'Children (Jersey) Law 2002',
    regulatoryBody: 'Jersey Care Commission',
    inspectorateUrl: 'https://carecommission.je'
  },
  resources: {
    governmentPortal: 'https://www.gov.je',
    careLeaverCharity: 'Jersey Child Care Trust',
    localAuthorityUrl: 'https://www.gov.je/government/pages/statesgreffe/default.aspx'
  }
};

// ==========================================
// GUERNSEY CONFIGURATION
// ==========================================

export const GUERNSEY_CONFIG: RegionalConfig = {
  jurisdiction: 'Guernsey',
  leavingCare: {
    eligibilityAge: 16,
    maxSupportAge: 25,
    stayingPutEnabled: true,
    stayingPutMaxAge: 21,
    pathwayPlanRequired: true,
    pathwayPlanStartAge: 16
  },
  benefits: {
    system: 'Guernsey Social Security',
    informationUrl: 'https://www.gov.gg/benefits',
    careLeaverEntitlements: [
      'Income Support',
      'Supplementary Benefit',
      'Residential care allowance',
      'Severe Disability Benefit (if applicable)',
      'Medical coverage'
    ],
    emergencyFund: 'Supplementary Benefit',
    settingUpHomeGrant: true
  },
  healthcare: {
    provider: 'States of Guernsey Health & Social Care',
    primaryCareUrl: 'https://www.gov.gg/health',
    mentalHealthService: 'CAMHS (under 18) / Adult Mental Health Services',
    transitionAge: 18,
    careLeaverPriority: true
  },
  housing: {
    authority: 'Guernsey Housing Association',
    shelterBranch: 'Guernsey Welfare Service',
    homelessnessUrl: 'https://www.gov.gg/housing',
    priorityNeed: true,
    localConnectionRule: true
  },
  employment: {
    careersService: 'Guernsey Employment Trust / Skills Guernsey',
    apprenticeshipsUrl: 'https://www.gov.gg/apprenticeships',
    careLeaverSupport: [
      'Back to Work scheme',
      'Supported Employment',
      'GTA University Centre',
      'Care Leaver Employment Support'
    ]
  },
  education: {
    system: 'Guernsey Education System',
    pepRequired: true,
    bursaryAvailable: true,
    careLeaverBursary: 3000 // Guernsey Student Finance
  },
  statutory: {
    primaryAct: 'Children (Guernsey and Alderney) Law 2008',
    regulatoryBody: 'Committee for Health & Social Care',
    inspectorateUrl: 'https://www.gov.gg/healthandsocialcare'
  },
  resources: {
    governmentPortal: 'https://www.gov.gg',
    careLeaverCharity: 'Guernsey Welfare Service',
    localAuthorityUrl: 'https://www.gov.gg/committees'
  }
};

// ==========================================
// ISLE OF MAN CONFIGURATION
// ==========================================

export const ISLE_OF_MAN_CONFIG: RegionalConfig = {
  jurisdiction: 'Isle of Man',
  leavingCare: {
    eligibilityAge: 16,
    maxSupportAge: 25,
    stayingPutEnabled: true,
    stayingPutMaxAge: 21,
    pathwayPlanRequired: true,
    pathwayPlanStartAge: 16
  },
  benefits: {
    system: 'Isle of Man Social Security',
    informationUrl: 'https://www.gov.im/benefits',
    careLeaverEntitlements: [
      'Income Support',
      'Employed Person\'s Allowance',
      'Rent rebate',
      'Council Tax relief',
      'Healthcare coverage (free for care leavers)'
    ],
    emergencyFund: 'Crisis Loan',
    settingUpHomeGrant: true
  },
  healthcare: {
    provider: 'Manx Care (Isle of Man Health Service)',
    primaryCareUrl: 'https://www.manxcare.im',
    mentalHealthService: 'CAMHS (under 18) / Adult Mental Health',
    transitionAge: 18,
    careLeaverPriority: true
  },
  housing: {
    authority: 'Department of Infrastructure (Housing Division)',
    shelterBranch: 'Graih (Isle of Man homeless charity)',
    homelessnessUrl: 'https://www.gov.im/housing',
    priorityNeed: true,
    localConnectionRule: true
  },
  employment: {
    careersService: 'Department for Education, Sport & Culture',
    apprenticeshipsUrl: 'https://www.gov.im/apprenticeships',
    careLeaverSupport: [
      'Back to Work scheme',
      'Isle of Man College',
      'Workwise Employment Support',
      'Care Leaver Employment Programme'
    ]
  },
  education: {
    system: 'Isle of Man Education System',
    pepRequired: true,
    bursaryAvailable: true,
    careLeaverBursary: 2500 // Isle of Man Student Awards
  },
  statutory: {
    primaryAct: 'Children and Young Persons Act 2001',
    regulatoryBody: 'Registration and Inspection Unit',
    inspectorateUrl: 'https://www.gov.im/socialcare'
  },
  resources: {
    governmentPortal: 'https://www.gov.im',
    careLeaverCharity: 'Isle of Man Children\'s Centre',
    localAuthorityUrl: 'https://www.gov.im/government'
  }
};

// ==========================================
// CONFIGURATION LOOKUP
// ==========================================

/**
 * Get regional configuration by jurisdiction
 */
export function getRegionalConfig(jurisdiction: Jurisdiction): RegionalConfig {
  switch (jurisdiction) {
    case 'England':
      return ENGLAND_CONFIG;
    case 'Scotland':
      return SCOTLAND_CONFIG;
    case 'Wales':
      return WALES_CONFIG;
    case 'Northern Ireland':
      return NORTHERN_IRELAND_CONFIG;
    case 'Ireland':
      return IRELAND_CONFIG;
    case 'Jersey':
      return JERSEY_CONFIG;
    case 'Guernsey':
      return GUERNSEY_CONFIG;
    case 'Isle of Man':
      return ISLE_OF_MAN_CONFIG;
    default:
      return ENGLAND_CONFIG; // Default fallback
  }
}

/**
 * Get all available jurisdictions
 */
export function getAvailableJurisdictions(): Jurisdiction[] {
  return [
    'England', 
    'Scotland', 
    'Wales', 
    'Northern Ireland',
    'Ireland',
    'Jersey',
    'Guernsey',
    'Isle of Man'
  ];
}

/**
 * Validate jurisdiction name
 */
export function isValidJurisdiction(jurisdiction: string): jurisdiction is Jurisdiction {
  const valid: Jurisdiction[] = [
    'England', 
    'Scotland', 
    'Wales', 
    'Northern Ireland',
    'Ireland',
    'Jersey',
    'Guernsey',
    'Isle of Man'
  ];
  return valid.includes(jurisdiction as Jurisdiction);
}

/**
 * Get maximum support age by jurisdiction
 */
export function getMaxSupportAge(jurisdiction: Jurisdiction): number {
  const config = getRegionalConfig(jurisdiction);
  return config.leavingCare.maxSupportAge;
}

/**
 * Check if Staying Put is available in jurisdiction
 */
export function hasStayingPut(jurisdiction: Jurisdiction): boolean {
  const config = getRegionalConfig(jurisdiction);
  return config.leavingCare.stayingPutEnabled;
}

/**
 * Get benefits information URL by jurisdiction
 */
export function getBenefitsUrl(jurisdiction: Jurisdiction): string {
  const config = getRegionalConfig(jurisdiction);
  return config.benefits.informationUrl;
}

/**
 * Get care leaver charity by jurisdiction
 */
export function getCareLeaverCharity(jurisdiction: Jurisdiction): string {
  const config = getRegionalConfig(jurisdiction);
  return config.resources.careLeaverCharity;
}

// ==========================================
// EXPORT DEFAULT CONFIG MAP
// ==========================================

export const BRITISH_ISLES_CONFIG = {
  England: ENGLAND_CONFIG,
  Scotland: SCOTLAND_CONFIG,
  Wales: WALES_CONFIG,
  'Northern Ireland': NORTHERN_IRELAND_CONFIG,
  Ireland: IRELAND_CONFIG,
  Jersey: JERSEY_CONFIG,
  Guernsey: GUERNSEY_CONFIG,
  'Isle of Man': ISLE_OF_MAN_CONFIG
};

export default BRITISH_ISLES_CONFIG;
