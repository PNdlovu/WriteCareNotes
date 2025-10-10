/**
 * Life Skills Checklist Seed Data - BRITISH ISLES COMPLETE
 * 
 * Standard independent living skills for care leavers aged 16-25
 * 
 * BRITISH ISLES COVERAGE:
 * - England: Universal Credit, Council Tax Support, NHS England
 * - Scotland: Continuing Care to 26, Scottish Welfare Fund, NHS Scotland
 * - Wales: Welsh language support, Communities First, NHS Wales
 * - Northern Ireland: Health & Social Care Trusts, Housing Executive
 * 
 * COMPLIANCE:
 * - Children (Leaving Care) Act 2000 (England & Wales)
 * - Regulation of Care (Scotland) Act 2001
 * - Children (Leaving Care) Act (Northern Ireland) 2002
 * - Care Leavers (England) Regulations 2010
 * - Staying Put Scotland 2013
 * - Social Services and Well-being (Wales) Act 2014
 * 
 * 6 SKILL CATEGORIES:
 * 1. COOKING - Meal planning, nutrition, food safety
 * 2. BUDGETING - Money management, benefits, banking
 * 3. JOB_SEARCH - Employment, CVs, interviews, apprenticeships
 * 4. INDEPENDENT_LIVING - Housing, tenancy, home maintenance
 * 5. HEALTH - Physical health, mental health, sexual health
 * 6. RELATIONSHIPS - Family, friends, professional relationships
 * 
 * Total Skills: 54 (9 per category)
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class LifeSkillsChecklistSeed1704900001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if life skills already exist
    const existingCount = await queryRunner.query(
      `SELECT COUNT(*) FROM life_skills_standards`
    );
    
    if (parseInt(existingCount[0].count) > 0) {
      console.log('Life skills checklist already seeded, skipping...');
      return;
    }

    console.log('Seeding life skills checklist for British Isles...');

    const lifeSkills = [
      // ==========================================
      // CATEGORY 1: COOKING (9 skills)
      // ==========================================
      {
        category: 'COOKING',
        skillName: 'Plan weekly meals on a budget',
        description: 'Create meal plans using budget-friendly ingredients. British staples: potatoes, pasta, rice, seasonal vegetables. Use supermarket value ranges (Tesco Value, Asda Smart Price, Sainsbury\'s Basics).',
        difficulty: 'BEGINNER',
        estimatedHours: 2,
        resources: 'NHS Eatwell Guide, Change4Life meal planner app (England), Food Standards Agency (UK-wide)',
        jurisdiction: 'UK'
      },
      {
        category: 'COOKING',
        skillName: 'Cook basic nutritious meals',
        description: 'Prepare 5-10 simple healthy meals: pasta bolognese, jacket potatoes, stir-fry, omelettes, shepherds pie. Follow NHS healthy eating guidelines.',
        difficulty: 'BEGINNER',
        estimatedHours: 5,
        resources: 'NHS Live Well recipes, BBC Good Food budget meals, Change4Life recipe app',
        jurisdiction: 'UK'
      },
      {
        category: 'COOKING',
        skillName: 'Understand food safety and hygiene',
        description: 'Learn food storage, use-by dates, cooking temperatures, avoiding cross-contamination. Follow Food Standards Agency (FSA) guidelines.',
        difficulty: 'BEGINNER',
        estimatedHours: 1,
        resources: 'Food Standards Agency (FSA) UK, Food Safety Act 1990, Food Hygiene Rating Scheme',
        jurisdiction: 'UK'
      },
      {
        category: 'COOKING',
        skillName: 'Shop for groceries economically',
        description: 'Compare supermarket prices, use loyalty cards (Tesco Clubcard, Nectar, Co-op), buy own-brand, shop at discount stores (Aldi, Lidl, Iceland).',
        difficulty: 'BEGINNER',
        estimatedHours: 2,
        resources: 'MySupermarket price comparison, Tesco Clubcard, Nectar app, Too Good To Go (food waste app)',
        jurisdiction: 'UK'
      },
      {
        category: 'COOKING',
        skillName: 'Use kitchen appliances safely',
        description: 'Operate cooker (gas/electric), microwave, kettle, toaster. Understand electrical safety (UK 240V). Know emergency procedures.',
        difficulty: 'BEGINNER',
        estimatedHours: 2,
        resources: 'Electrical Safety First (UK), product instruction manuals, British Standards for appliances',
        jurisdiction: 'UK'
      },
      {
        category: 'COOKING',
        skillName: 'Batch cook and meal prep',
        description: 'Prepare multiple portions, freeze meals, reduce waste. Save money and time. Use Tupperware, freezer bags, labelling.',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 3,
        resources: 'Love Food Hate Waste (WRAP UK), batch cooking recipes, freezer meal ideas',
        jurisdiction: 'UK'
      },
      {
        category: 'COOKING',
        skillName: 'Read and follow recipes',
        description: 'Understand measurements (grams, ml, tablespoons), cooking terms (simmer, sauté, blanch), timing, oven temperatures (Celsius/Gas Mark).',
        difficulty: 'BEGINNER',
        estimatedHours: 2,
        resources: 'BBC Good Food, Jamie Oliver recipes, NHS recipe collections',
        jurisdiction: 'UK'
      },
      {
        category: 'COOKING',
        skillName: 'Clean and maintain kitchen',
        description: 'Wash dishes, clean surfaces, defrost fridge, descale kettle, prevent mould, manage bin collection (recycling, food waste, general).',
        difficulty: 'BEGINNER',
        estimatedHours: 2,
        resources: 'Council recycling guidelines (varies by local authority), Recycle Now website',
        jurisdiction: 'UK'
      },
      {
        category: 'COOKING',
        skillName: 'Understand nutrition and healthy eating',
        description: 'Follow NHS Eatwell Guide, 5-a-day portions, reduce sugar/salt/fat, read food labels (traffic light system), manage dietary needs.',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 3,
        resources: 'NHS Eatwell Guide, Change4Life, British Nutrition Foundation, Food Standards Agency',
        jurisdiction: 'UK'
      },

      // ==========================================
      // CATEGORY 2: BUDGETING (9 skills)
      // ==========================================
      {
        category: 'BUDGETING',
        skillName: 'Create and maintain a personal budget',
        description: 'Track income and expenses, use budgeting apps, plan for bills. Include: Universal Credit (England/Wales/Scotland), benefits, wages, leaving care allowance.',
        difficulty: 'BEGINNER',
        estimatedHours: 3,
        resources: 'Money Helper (UK gov), StepChange, MoneyBox app, YNAB, Universal Credit calculator',
        jurisdiction: 'UK'
      },
      {
        category: 'BUDGETING',
        skillName: 'Open and manage a bank account',
        description: 'Choose bank (basic account if no credit history), use debit card, online banking, set up standing orders, avoid overdrafts. Know banking rights.',
        difficulty: 'BEGINNER',
        estimatedHours: 2,
        resources: 'Money Helper, Citizens Advice, basic bank accounts (Barclays, Lloyds, NatWest, RBS Scotland)',
        jurisdiction: 'UK'
      },
      {
        category: 'BUDGETING',
        skillName: 'Understand UK benefits system',
        description: 'Apply for: Universal Credit, Housing Benefit, Council Tax Support (England/Wales), Council Tax Reduction (Scotland), Housing Benefit (NI). Know entitlements for care leavers.',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 4,
        resources: 'GOV.UK benefits calculator, Citizens Advice, Turn2Us, Entitledto.co.uk, mygov.scot (Scotland), nidirect (NI)',
        jurisdiction: 'UK'
      },
      {
        category: 'BUDGETING',
        skillName: 'Manage bills and direct debits',
        description: 'Set up payments for: rent, council tax, utilities (gas, electric, water), phone, internet. Use direct debits to avoid late fees. Understand meter readings.',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 3,
        resources: 'Money Helper, Citizens Advice, uSwitch (comparison), Energy Saving Trust',
        jurisdiction: 'UK'
      },
      {
        category: 'BUDGETING',
        skillName: 'Avoid and manage debt',
        description: 'Understand: payday loans (avoid), credit cards, store cards, catalogues, buy-now-pay-later. Get free debt advice if struggling.',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 3,
        resources: 'StepChange Debt Charity, National Debtline, Citizens Advice, Money Helper',
        jurisdiction: 'UK'
      },
      {
        category: 'BUDGETING',
        skillName: 'Use council tax exemptions for care leavers',
        description: 'Care leavers under 25 exempt from council tax in many local authorities (England/Wales/Scotland/NI). Apply through local council.',
        difficulty: 'BEGINNER',
        estimatedHours: 1,
        resources: 'Local council website, Become Charity, Care Leaver Covenant, GOV.UK council tax exemptions',
        jurisdiction: 'UK'
      },
      {
        category: 'BUDGETING',
        skillName: 'Access emergency funds',
        description: 'England/Wales: Local Welfare Assistance. Scotland: Scottish Welfare Fund. NI: Discretionary Support. Apply for crisis grants, budgeting loans.',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 2,
        resources: 'Local council, Scottish Welfare Fund, NI Discretionary Support, DWP Budgeting Advance',
        jurisdiction: 'UK'
      },
      {
        category: 'BUDGETING',
        skillName: 'Build savings habit',
        description: 'Start small (£5-10/week), use ISAs (tax-free up to £20,000/year), Help to Save scheme (if on Universal Credit), emergency fund (3 months expenses).',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 2,
        resources: 'Money Helper savings calculator, Help to Save (gov.uk), comparison sites (MoneySavingExpert)',
        jurisdiction: 'UK'
      },
      {
        category: 'BUDGETING',
        skillName: 'Understand payslips and tax',
        description: 'Read payslips, understand National Insurance, PAYE tax, tax codes, personal allowance (£12,570), check tax is correct. Know employment rights.',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 2,
        resources: 'GOV.UK tax checker, HMRC Personal Tax Account, Citizens Advice, ACAS',
        jurisdiction: 'UK'
      },

      // ==========================================
      // CATEGORY 3: JOB_SEARCH (9 skills)
      // ==========================================
      {
        category: 'JOB_SEARCH',
        skillName: 'Write effective CV and cover letter',
        description: 'Create professional CV (UK format: 2 pages max, no photo, reverse chronological). Tailor cover letters. Include care experience positively.',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 4,
        resources: 'National Careers Service, CV templates (GOV.UK), Skills Development Scotland, Careers Wales, NISRA careers',
        jurisdiction: 'UK'
      },
      {
        category: 'JOB_SEARCH',
        skillName: 'Search for jobs effectively',
        description: 'Use: Indeed, Reed, Totaljobs, GOV.UK Find a Job, Universal Jobmatch, local job centres. Apply early, track applications.',
        difficulty: 'BEGINNER',
        estimatedHours: 3,
        resources: 'GOV.UK Find a Job, Universal Jobmatch, local Jobcentre Plus, National Careers Service',
        jurisdiction: 'UK'
      },
      {
        category: 'JOB_SEARCH',
        skillName: 'Prepare for job interviews',
        description: 'Research company, prepare answers (STAR method), dress appropriately (UK business casual), arrive early, follow up. Practice common interview questions.',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 4,
        resources: 'National Careers Service interview tips, Skills Development Scotland, Careers Wales, mock interview practice',
        jurisdiction: 'UK'
      },
      {
        category: 'JOB_SEARCH',
        skillName: 'Understand employment rights',
        description: 'Know: minimum wage (£11.44/hour 21+, £8.60 18-20, £6.40 16-17), holiday pay (28 days), sick pay, maternity/paternity, contracts, unfair dismissal.',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 3,
        resources: 'GOV.UK employment rights, ACAS, Citizens Advice, TUC Know Your Rights',
        jurisdiction: 'UK'
      },
      {
        category: 'JOB_SEARCH',
        skillName: 'Apply for apprenticeships',
        description: 'Search GOV.UK apprenticeships, Scottish Apprenticeships, Apprenticeships Wales, ApprenticeshipsNI. Earn while learning (£6.40+/hour), gain qualifications.',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 3,
        resources: 'GOV.UK apprenticeships, Scottish Apprenticeships, Apprenticeships Wales, ApprenticeshipsNI, UCAS',
        jurisdiction: 'UK'
      },
      {
        category: 'JOB_SEARCH',
        skillName: 'Access care leaver employment support',
        description: 'Care Leaver Covenant guarantees interviews at many employers (Civil Service, local councils, NHS). Use Care Leaver Internship programmes.',
        difficulty: 'BEGINNER',
        estimatedHours: 2,
        resources: 'Care Leaver Covenant, Become Charity, local authority care leaver services, NHS care leaver programmes',
        jurisdiction: 'UK'
      },
      {
        category: 'JOB_SEARCH',
        skillName: 'Develop professional skills',
        description: 'Learn: communication, teamwork, time management, IT skills (Microsoft Office, email etiquette), customer service. Free courses available.',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 10,
        resources: 'FutureLearn free courses, OpenLearn, GOV.UK Skills Bootcamps, National Careers Service, online tutorials',
        jurisdiction: 'UK'
      },
      {
        category: 'JOB_SEARCH',
        skillName: 'Use LinkedIn and professional networking',
        description: 'Create LinkedIn profile, connect with professionals, join care leaver networks, attend career fairs, use alumni networks.',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 3,
        resources: 'LinkedIn Learning (free with library card), professional networking events, care leaver mentoring schemes',
        jurisdiction: 'UK'
      },
      {
        category: 'JOB_SEARCH',
        skillName: 'Understand workplace culture',
        description: 'Learn professional behaviour, punctuality, dress codes, workplace etiquette, handling feedback, resolving conflicts. Know grievance procedures.',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 2,
        resources: 'ACAS workplace guidance, National Careers Service, Jobcentre Plus work preparation',
        jurisdiction: 'UK'
      },

      // ==========================================
      // CATEGORY 4: INDEPENDENT_LIVING (9 skills)
      // ==========================================
      {
        category: 'INDEPENDENT_LIVING',
        skillName: 'Understand tenancy rights and responsibilities',
        description: 'Know: assured shorthold tenancy (England/Wales), private residential tenancy (Scotland), tenancy types (NI). Understand deposits (max 5 weeks rent), repairs, eviction process.',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 4,
        resources: 'Shelter England/Scotland/Cymru, Housing Rights NI, Citizens Advice, GOV.UK renting guide',
        jurisdiction: 'UK'
      },
      {
        category: 'INDEPENDENT_LIVING',
        skillName: 'Apply for social housing',
        description: 'Register with local council, understand housing priority (care leavers often priority), complete housing applications. Scotland: Common Housing Register. NI: Housing Executive.',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 3,
        resources: 'Local council housing department, Shelter, Housing Executive NI, Scottish Housing Regulator',
        jurisdiction: 'UK'
      },
      {
        category: 'INDEPENDENT_LIVING',
        skillName: 'Set up utilities and services',
        description: 'Arrange: gas, electricity (compare suppliers), water, council tax, TV licence (£159/year), broadband, phone. Use comparison sites.',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 3,
        resources: 'uSwitch, Compare the Market, MoneySuperMarket, Citizens Advice, Energy Saving Trust',
        jurisdiction: 'UK'
      },
      {
        category: 'INDEPENDENT_LIVING',
        skillName: 'Basic home maintenance and repairs',
        description: 'Handle: unblocking drains, changing lightbulbs, bleeding radiators, resetting fuse box, preventing damp. Know when to call landlord/emergency services.',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 4,
        resources: 'DIY YouTube tutorials, Shelter repairs guide, local handyperson schemes, Age UK handyperson (some accept 16+)',
        jurisdiction: 'UK'
      },
      {
        category: 'INDEPENDENT_LIVING',
        skillName: 'Manage household cleaning and laundry',
        description: 'Clean regularly, use washing machine, separate colours/whites, iron clothes, change bed sheets weekly, prevent pests, manage bin days.',
        difficulty: 'BEGINNER',
        estimatedHours: 3,
        resources: 'Good Housekeeping UK, cleaning product labels, council waste collection schedules',
        jurisdiction: 'UK'
      },
      {
        category: 'INDEPENDENT_LIVING',
        skillName: 'Use public transport effectively',
        description: 'Navigate buses, trains, trams, London Underground. Use: Oyster card, contactless payment, 16-25 Railcard (1/3 off), bus passes, journey planners.',
        difficulty: 'BEGINNER',
        estimatedHours: 2,
        resources: 'Trainline app, Citymapper, TfL (London), local bus operators, National Rail, 16-25 Railcard',
        jurisdiction: 'UK'
      },
      {
        category: 'INDEPENDENT_LIVING',
        skillName: 'Stay safe at home and online',
        description: 'Home safety: lock doors, smoke alarms, carbon monoxide detectors, fire escape plan. Online: strong passwords, spot scams, protect personal data (GDPR).',
        difficulty: 'BEGINNER',
        estimatedHours: 2,
        resources: 'National Fire Chiefs Council, Action Fraud (reporting scams), Get Safe Online, ICO (data protection)',
        jurisdiction: 'UK'
      },
      {
        category: 'INDEPENDENT_LIVING',
        skillName: 'Register with essential services',
        description: 'Register: GP surgery, NHS dentist (free until 19 in care), optician, electoral roll (voting from 18), council tax. Update address when moving.',
        difficulty: 'BEGINNER',
        estimatedHours: 2,
        resources: 'NHS.uk (England), NHS Scotland, NHS Wales, Health & Social Care NI, GOV.UK register to vote',
        jurisdiction: 'UK'
      },
      {
        category: 'INDEPENDENT_LIVING',
        skillName: 'Access leaving care financial support',
        description: 'England/Wales: Setting Up Home Grant (£2,000+). Scotland: Throughcare/Aftercare allowance. NI: Leaving care grant. Apply through local authority.',
        difficulty: 'BEGINNER',
        estimatedHours: 2,
        resources: 'Local authority leaving care team, Become Charity, Care Leaver Covenant, Coram Voice',
        jurisdiction: 'UK'
      },

      // ==========================================
      // CATEGORY 5: HEALTH (9 skills)
      // ==========================================
      {
        category: 'HEALTH',
        skillName: 'Register and access GP services',
        description: 'Register with NHS GP surgery (England/Scotland/Wales/NI). Free prescriptions until 19 if in care. Know how to book appointments, use NHS 111.',
        difficulty: 'BEGINNER',
        estimatedHours: 1,
        resources: 'NHS.uk find GP, NHS Scotland, NHS Wales, Health & Social Care NI, NHS 111 (non-emergency)',
        jurisdiction: 'UK'
      },
      {
        category: 'HEALTH',
        skillName: 'Manage physical health',
        description: 'Attend health checks, take prescribed medication, maintain healthy lifestyle (exercise 150min/week, sleep 8 hours, balanced diet). Free gym for care leavers in some areas.',
        difficulty: 'BEGINNER',
        estimatedHours: 2,
        resources: 'NHS Live Well, Couch to 5K app, local leisure centres (care leaver discounts), parkrun (free)',
        jurisdiction: 'UK'
      },
      {
        category: 'HEALTH',
        skillName: 'Understand mental health support',
        description: 'Access: CAMHS (until 18), adult mental health services, counselling (free NHS), crisis support (Samaritans 116 123). Know warning signs.',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 3,
        resources: 'NHS mental health services, Mind UK, YoungMinds, Samaritans, Papyrus, SHOUT text 85258',
        jurisdiction: 'UK'
      },
      {
        category: 'HEALTH',
        skillName: 'Access sexual health services',
        description: 'Use free NHS sexual health clinics, get contraception (free on NHS), STI testing, emergency contraception. Understand consent, healthy relationships.',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 2,
        resources: 'NHS sexual health services, Brook (under 25), FPA (sexual health charity), NHS contraception guide',
        jurisdiction: 'UK'
      },
      {
        category: 'HEALTH',
        skillName: 'Manage dental and optical health',
        description: 'Free NHS dental care until 19 if in care, eye tests free until 19. Register with NHS dentist, optician. Annual check-ups.',
        difficulty: 'BEGINNER',
        estimatedHours: 1,
        resources: 'NHS Find a Dentist, NHS eye test eligibility, local opticians, dental practices',
        jurisdiction: 'UK'
      },
      {
        category: 'HEALTH',
        skillName: 'Understand substance use and harm reduction',
        description: 'Know risks: alcohol (UK guidelines 14 units/week), smoking, drugs. Access support: FRANK helpline, local drug/alcohol services, NHS Stop Smoking.',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 2,
        resources: 'FRANK (0300 123 6600), NHS Stop Smoking, Drinkaware, local substance misuse services',
        jurisdiction: 'UK'
      },
      {
        category: 'HEALTH',
        skillName: 'Access health records and advocacy',
        description: 'Request health records (Subject Access Request), understand health passport, use health advocate. Care leavers entitled to see care files from 18.',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 2,
        resources: 'ICO Subject Access Request, local authority records, Coram BAAF for adoption records, Become Charity',
        jurisdiction: 'UK'
      },
      {
        category: 'HEALTH',
        skillName: 'Know when to access emergency services',
        description: '999 for emergencies (police, ambulance, fire). NHS 111 for urgent non-emergency. A&E for life-threatening. Walk-in centres for minor injuries.',
        difficulty: 'BEGINNER',
        estimatedHours: 1,
        resources: 'NHS 111, NHS emergency services guide, St John Ambulance first aid, local A&E/urgent care',
        jurisdiction: 'UK'
      },
      {
        category: 'HEALTH',
        skillName: 'Participate in health transition planning',
        description: 'Attend health transition meetings (16+), understand health conditions, medication, allergies. Complete health passport. Transfer from CAMHS to adult services.',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 2,
        resources: 'NHS transition planning, health passport template, leaving care health team, GP',
        jurisdiction: 'UK'
      },

      // ==========================================
      // CATEGORY 6: RELATIONSHIPS (9 skills)
      // ==========================================
      {
        category: 'RELATIONSHIPS',
        skillName: 'Maintain positive family contact',
        description: 'Manage contact with birth family (if safe), siblings, foster family (staying put). Set boundaries, use mediation if needed. Know rights under Adoption Contact Register.',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 3,
        resources: 'Family Rights Group, Reunite (mediation), Adoption Contact Register, local authority family support',
        jurisdiction: 'UK'
      },
      {
        category: 'RELATIONSHIPS',
        skillName: 'Build healthy friendships',
        description: 'Make friends, maintain friendships, recognize toxic relationships, set boundaries. Join clubs, volunteering, care leaver groups.',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 3,
        resources: 'Become Charity care leaver groups, local youth clubs, volunteering (Do-it.org), Meetup.com',
        jurisdiction: 'UK'
      },
      {
        category: 'RELATIONSHIPS',
        skillName: 'Understand healthy romantic relationships',
        description: 'Recognize healthy vs unhealthy relationships, respect, consent, communication, avoiding controlling behaviour. Know domestic abuse support.',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 3,
        resources: 'Respect relationship education, Women\'s Aid, Refuge, Men\'s Advice Line, National Domestic Abuse Helpline 0808 2000 247',
        jurisdiction: 'UK'
      },
      {
        category: 'RELATIONSHIPS',
        skillName: 'Communicate with professionals effectively',
        description: 'Speak with: personal advisor, social worker, GP, landlord, employer, Jobcentre. Ask questions, understand rights, keep records, follow up.',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 2,
        resources: 'Citizens Advice communication skills, Coram Voice advocacy, local advocacy services',
        jurisdiction: 'UK'
      },
      {
        category: 'RELATIONSHIPS',
        skillName: 'Access care leaver community and support',
        description: 'Connect with other care leavers: Become Charity groups, Who Cares? Scotland, Voices From Care Cymru (Wales), VOYPIC (NI). Attend events, peer mentoring.',
        difficulty: 'BEGINNER',
        estimatedHours: 2,
        resources: 'Become Charity, Who Cares? Scotland, Voices From Care Cymru, VOYPIC NI, Care Leaver Covenant',
        jurisdiction: 'UK'
      },
      {
        category: 'RELATIONSHIPS',
        skillName: 'Resolve conflicts constructively',
        description: 'Learn conflict resolution, compromise, active listening, calm communication. Use mediation services if needed. Understand tenancy disputes process.',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 3,
        resources: 'Mediation UK, Resolution (family mediation), Citizens Advice, local mediation services',
        jurisdiction: 'UK'
      },
      {
        category: 'RELATIONSHIPS',
        skillName: 'Build professional network and mentors',
        description: 'Find mentors (care leaver mentoring schemes, corporate volunteers), attend networking events, join professional bodies, use LinkedIn.',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 3,
        resources: 'Care Leaver Covenant mentoring, Become Charity mentors, Business in the Community, local mentoring schemes',
        jurisdiction: 'UK'
      },
      {
        category: 'RELATIONSHIPS',
        skillName: 'Understand parenting support (if applicable)',
        description: 'Access: Family Nurse Partnership, health visitors, Sure Start (England), Flying Start (Wales), local parenting classes. Know childcare support, Child Benefit.',
        difficulty: 'ADVANCED',
        estimatedHours: 4,
        resources: 'Family Nurse Partnership, NHS health visiting, local children\'s centres, GOV.UK childcare support',
        jurisdiction: 'UK'
      },
      {
        category: 'RELATIONSHIPS',
        skillName: 'Know how to access advocacy and complaints',
        description: 'Use advocacy services (free for care leavers), make complaints (local authority, NHS), know Ombudsman services (Local Government, NHS, Housing).',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 2,
        resources: 'Coram Voice advocacy, local advocacy services, Local Government Ombudsman, NHS complaints, SPSO (Scotland)',
        jurisdiction: 'UK'
      }
    ];

    // Insert life skills
    for (const skill of lifeSkills) {
      await queryRunner.query(
        `INSERT INTO life_skills_standards 
        (category, skill_name, description, difficulty_level, estimated_hours, resources, jurisdiction, created_at) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          skill.category,
          skill.skillName,
          skill.description,
          skill.difficulty,
          skill.estimatedHours,
          skill.resources,
          skill.jurisdiction
        ]
      );
    }

    console.log(`✅ Seeded ${lifeSkills.length} life skills for British Isles (England, Scotland, Wales, Northern Ireland)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM life_skills_standards`);
    console.log('Removed life skills checklist seed data');
  }
}
