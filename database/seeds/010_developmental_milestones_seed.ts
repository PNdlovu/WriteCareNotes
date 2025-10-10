/**
 * Developmental Milestones Seed Data
 * 
 * Standard developmental milestones for children aged 0-5 years
 * Based on UK early years development frameworks:
 * - Early Years Foundation Stage (EYFS)
 * - Healthy Child Programme
 * - Ages and Stages Questionnaires (ASQ)
 * 
 * 5 Developmental Domains:
 * - MOTOR_SKILLS: Physical development, coordination
 * - LANGUAGE: Communication and language
 * - SOCIAL_EMOTIONAL: Personal, social and emotional development
 * - COGNITIVE: Problem solving, understanding, mathematics
 * - SELF_CARE: Independence, self-help skills
 * 
 * 9 Age Groups:
 * - 0-3 months, 3-6 months, 6-9 months, 9-12 months
 * - 12-18 months, 18-24 months
 * - 2-3 years, 3-4 years, 4-5 years
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class DevelopmentalMilestonesSeed1704900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if milestones already exist
    const existingCount = await queryRunner.query(
      `SELECT COUNT(*) FROM developmental_milestones_standards`
    );
    
    if (parseInt(existingCount[0].count) > 0) {
      console.log('Developmental milestones already seeded, skipping...');
      return;
    }

    console.log('Seeding developmental milestones...');

    const milestones = [
      // ==========================================
      // 0-3 MONTHS (10 milestones)
      // ==========================================
      // Motor Skills
      { domain: 'MOTOR_SKILLS', ageGroup: '0-3m', milestone: 'Lifts head briefly when on tummy', expectedMonths: 2, redFlag: false },
      { domain: 'MOTOR_SKILLS', ageGroup: '0-3m', milestone: 'Brings hands to mouth', expectedMonths: 2, redFlag: false },
      
      // Language
      { domain: 'LANGUAGE', ageGroup: '0-3m', milestone: 'Makes cooing sounds', expectedMonths: 2, redFlag: false },
      { domain: 'LANGUAGE', ageGroup: '0-3m', milestone: 'Turns toward sounds', expectedMonths: 3, redFlag: true },
      
      // Social-Emotional
      { domain: 'SOCIAL_EMOTIONAL', ageGroup: '0-3m', milestone: 'Smiles socially', expectedMonths: 2, redFlag: true },
      { domain: 'SOCIAL_EMOTIONAL', ageGroup: '0-3m', milestone: 'Makes eye contact', expectedMonths: 2, redFlag: true },
      
      // Cognitive
      { domain: 'COGNITIVE', ageGroup: '0-3m', milestone: 'Tracks objects with eyes', expectedMonths: 2, redFlag: false },
      { domain: 'COGNITIVE', ageGroup: '0-3m', milestone: 'Recognizes familiar faces', expectedMonths: 3, redFlag: false },
      
      // Self-Care
      { domain: 'SELF_CARE', ageGroup: '0-3m', milestone: 'Sucks well during feeding', expectedMonths: 1, redFlag: true },
      { domain: 'SELF_CARE', ageGroup: '0-3m', milestone: 'Shows distinct sleep patterns', expectedMonths: 2, redFlag: false },

      // ==========================================
      // 3-6 MONTHS (12 milestones)
      // ==========================================
      // Motor Skills
      { domain: 'MOTOR_SKILLS', ageGroup: '3-6m', milestone: 'Rolls over both ways', expectedMonths: 6, redFlag: false },
      { domain: 'MOTOR_SKILLS', ageGroup: '3-6m', milestone: 'Sits with support', expectedMonths: 5, redFlag: false },
      { domain: 'MOTOR_SKILLS', ageGroup: '3-6m', milestone: 'Reaches for toys', expectedMonths: 4, redFlag: false },
      
      // Language
      { domain: 'LANGUAGE', ageGroup: '3-6m', milestone: 'Babbles (ba-ba, ma-ma)', expectedMonths: 6, redFlag: false },
      { domain: 'LANGUAGE', ageGroup: '3-6m', milestone: 'Responds to own name', expectedMonths: 6, redFlag: true },
      { domain: 'LANGUAGE', ageGroup: '3-6m', milestone: 'Makes different sounds for different needs', expectedMonths: 5, redFlag: false },
      
      // Social-Emotional
      { domain: 'SOCIAL_EMOTIONAL', ageGroup: '3-6m', milestone: 'Laughs', expectedMonths: 4, redFlag: false },
      { domain: 'SOCIAL_EMOTIONAL', ageGroup: '3-6m', milestone: 'Shows affection to caregivers', expectedMonths: 6, redFlag: false },
      
      // Cognitive
      { domain: 'COGNITIVE', ageGroup: '3-6m', milestone: 'Explores objects with mouth', expectedMonths: 5, redFlag: false },
      { domain: 'COGNITIVE', ageGroup: '3-6m', milestone: 'Looks at objects when dropped', expectedMonths: 6, redFlag: false },
      
      // Self-Care
      { domain: 'SELF_CARE', ageGroup: '3-6m', milestone: 'Holds bottle independently', expectedMonths: 6, redFlag: false },
      { domain: 'SELF_CARE', ageGroup: '3-6m', milestone: 'Starts eating solid foods', expectedMonths: 6, redFlag: false },

      // ==========================================
      // 6-9 MONTHS (14 milestones)
      // ==========================================
      // Motor Skills
      { domain: 'MOTOR_SKILLS', ageGroup: '6-9m', milestone: 'Sits without support', expectedMonths: 7, redFlag: true },
      { domain: 'MOTOR_SKILLS', ageGroup: '6-9m', milestone: 'Crawls or bottom shuffles', expectedMonths: 9, redFlag: false },
      { domain: 'MOTOR_SKILLS', ageGroup: '6-9m', milestone: 'Pulls to standing', expectedMonths: 9, redFlag: false },
      { domain: 'MOTOR_SKILLS', ageGroup: '6-9m', milestone: 'Transfers objects hand to hand', expectedMonths: 7, redFlag: false },
      
      // Language
      { domain: 'LANGUAGE', ageGroup: '6-9m', milestone: 'Says mama or dada (non-specific)', expectedMonths: 8, redFlag: false },
      { domain: 'LANGUAGE', ageGroup: '6-9m', milestone: 'Understands "no"', expectedMonths: 9, redFlag: false },
      
      // Social-Emotional
      { domain: 'SOCIAL_EMOTIONAL', ageGroup: '6-9m', milestone: 'Shows stranger anxiety', expectedMonths: 8, redFlag: false },
      { domain: 'SOCIAL_EMOTIONAL', ageGroup: '6-9m', milestone: 'Plays peek-a-boo', expectedMonths: 9, redFlag: false },
      
      // Cognitive
      { domain: 'COGNITIVE', ageGroup: '6-9m', milestone: 'Looks for dropped objects', expectedMonths: 8, redFlag: false },
      { domain: 'COGNITIVE', ageGroup: '6-9m', milestone: 'Bangs objects together', expectedMonths: 9, redFlag: false },
      { domain: 'COGNITIVE', ageGroup: '6-9m', milestone: 'Points at objects', expectedMonths: 9, redFlag: false },
      
      // Self-Care
      { domain: 'SELF_CARE', ageGroup: '6-9m', milestone: 'Drinks from cup with help', expectedMonths: 9, redFlag: false },
      { domain: 'SELF_CARE', ageGroup: '6-9m', milestone: 'Eats finger foods', expectedMonths: 9, redFlag: false },
      { domain: 'SELF_CARE', ageGroup: '6-9m', milestone: 'Holds own bottle', expectedMonths: 8, redFlag: false },

      // ==========================================
      // 9-12 MONTHS (14 milestones)
      // ==========================================
      // Motor Skills
      { domain: 'MOTOR_SKILLS', ageGroup: '9-12m', milestone: 'Stands alone briefly', expectedMonths: 12, redFlag: false },
      { domain: 'MOTOR_SKILLS', ageGroup: '9-12m', milestone: 'Takes first steps', expectedMonths: 12, redFlag: false },
      { domain: 'MOTOR_SKILLS', ageGroup: '9-12m', milestone: 'Uses pincer grasp', expectedMonths: 10, redFlag: false },
      
      // Language
      { domain: 'LANGUAGE', ageGroup: '9-12m', milestone: 'Says mama or dada (specific)', expectedMonths: 12, redFlag: false },
      { domain: 'LANGUAGE', ageGroup: '9-12m', milestone: 'Says 1-2 words besides mama/dada', expectedMonths: 12, redFlag: false },
      { domain: 'LANGUAGE', ageGroup: '9-12m', milestone: 'Follows simple commands', expectedMonths: 12, redFlag: false },
      
      // Social-Emotional
      { domain: 'SOCIAL_EMOTIONAL', ageGroup: '9-12m', milestone: 'Waves bye-bye', expectedMonths: 11, redFlag: false },
      { domain: 'SOCIAL_EMOTIONAL', ageGroup: '9-12m', milestone: 'Shows preferences for toys', expectedMonths: 10, redFlag: false },
      
      // Cognitive
      { domain: 'COGNITIVE', ageGroup: '9-12m', milestone: 'Finds hidden objects', expectedMonths: 11, redFlag: false },
      { domain: 'COGNITIVE', ageGroup: '9-12m', milestone: 'Imitates gestures', expectedMonths: 12, redFlag: false },
      { domain: 'COGNITIVE', ageGroup: '9-12m', milestone: 'Uses objects correctly (phone to ear)', expectedMonths: 12, redFlag: false },
      
      // Self-Care
      { domain: 'SELF_CARE', ageGroup: '9-12m', milestone: 'Drinks from cup independently', expectedMonths: 12, redFlag: false },
      { domain: 'SELF_CARE', ageGroup: '9-12m', milestone: 'Feeds self with fingers', expectedMonths: 11, redFlag: false },
      { domain: 'SELF_CARE', ageGroup: '9-12m', milestone: 'Helps with dressing', expectedMonths: 12, redFlag: false },

      // ==========================================
      // 12-18 MONTHS (16 milestones)
      // ==========================================
      // Motor Skills
      { domain: 'MOTOR_SKILLS', ageGroup: '12-18m', milestone: 'Walks independently', expectedMonths: 15, redFlag: true },
      { domain: 'MOTOR_SKILLS', ageGroup: '12-18m', milestone: 'Climbs stairs with help', expectedMonths: 18, redFlag: false },
      { domain: 'MOTOR_SKILLS', ageGroup: '12-18m', milestone: 'Scribbles with crayon', expectedMonths: 16, redFlag: false },
      { domain: 'MOTOR_SKILLS', ageGroup: '12-18m', milestone: 'Kicks a ball', expectedMonths: 18, redFlag: false },
      
      // Language
      { domain: 'LANGUAGE', ageGroup: '12-18m', milestone: 'Says 3-6 words', expectedMonths: 15, redFlag: true },
      { domain: 'LANGUAGE', ageGroup: '12-18m', milestone: 'Points to body parts when asked', expectedMonths: 18, redFlag: false },
      { domain: 'LANGUAGE', ageGroup: '12-18m', milestone: 'Shakes head for "no"', expectedMonths: 14, redFlag: false },
      
      // Social-Emotional
      { domain: 'SOCIAL_EMOTIONAL', ageGroup: '12-18m', milestone: 'Shows interest in other children', expectedMonths: 15, redFlag: false },
      { domain: 'SOCIAL_EMOTIONAL', ageGroup: '12-18m', milestone: 'Plays simple pretend (feeding doll)', expectedMonths: 18, redFlag: false },
      { domain: 'SOCIAL_EMOTIONAL', ageGroup: '12-18m', milestone: 'Shows affection to familiar people', expectedMonths: 15, redFlag: false },
      
      // Cognitive
      { domain: 'COGNITIVE', ageGroup: '12-18m', milestone: 'Identifies objects in books', expectedMonths: 16, redFlag: false },
      { domain: 'COGNITIVE', ageGroup: '12-18m', milestone: 'Stacks 2-4 blocks', expectedMonths: 18, redFlag: false },
      { domain: 'COGNITIVE', ageGroup: '12-18m', milestone: 'Follows 1-step commands without gestures', expectedMonths: 18, redFlag: false },
      
      // Self-Care
      { domain: 'SELF_CARE', ageGroup: '12-18m', milestone: 'Uses spoon to feed self', expectedMonths: 18, redFlag: false },
      { domain: 'SELF_CARE', ageGroup: '12-18m', milestone: 'Drinks from cup without spilling', expectedMonths: 18, redFlag: false },
      { domain: 'SELF_CARE', ageGroup: '12-18m', milestone: 'Takes off shoes and socks', expectedMonths: 18, redFlag: false },

      // ==========================================
      // 18-24 MONTHS (16 milestones)
      // ==========================================
      // Motor Skills
      { domain: 'MOTOR_SKILLS', ageGroup: '18-24m', milestone: 'Runs steadily', expectedMonths: 24, redFlag: false },
      { domain: 'MOTOR_SKILLS', ageGroup: '18-24m', milestone: 'Jumps with both feet', expectedMonths: 24, redFlag: false },
      { domain: 'MOTOR_SKILLS', ageGroup: '18-24m', milestone: 'Throws ball overhand', expectedMonths: 22, redFlag: false },
      
      // Language
      { domain: 'LANGUAGE', ageGroup: '18-24m', milestone: 'Says 50+ words', expectedMonths: 24, redFlag: true },
      { domain: 'LANGUAGE', ageGroup: '18-24m', milestone: 'Combines 2 words', expectedMonths: 24, redFlag: true },
      { domain: 'LANGUAGE', ageGroup: '18-24m', milestone: 'Follows 2-step instructions', expectedMonths: 24, redFlag: false },
      { domain: 'LANGUAGE', ageGroup: '18-24m', milestone: 'Names familiar objects', expectedMonths: 22, redFlag: false },
      
      // Social-Emotional
      { domain: 'SOCIAL_EMOTIONAL', ageGroup: '18-24m', milestone: 'Plays alongside other children', expectedMonths: 24, redFlag: false },
      { domain: 'SOCIAL_EMOTIONAL', ageGroup: '18-24m', milestone: 'Shows defiant behavior', expectedMonths: 22, redFlag: false },
      
      // Cognitive
      { domain: 'COGNITIVE', ageGroup: '18-24m', milestone: 'Completes simple shape puzzles', expectedMonths: 24, redFlag: false },
      { domain: 'COGNITIVE', ageGroup: '18-24m', milestone: 'Sorts by color or shape', expectedMonths: 24, redFlag: false },
      { domain: 'COGNITIVE', ageGroup: '18-24m', milestone: 'Imitates household tasks', expectedMonths: 24, redFlag: false },
      
      // Self-Care
      { domain: 'SELF_CARE', ageGroup: '18-24m', milestone: 'Washes hands with help', expectedMonths: 24, redFlag: false },
      { domain: 'SELF_CARE', ageGroup: '18-24m', milestone: 'Brushes teeth with help', expectedMonths: 24, redFlag: false },
      { domain: 'SELF_CARE', ageGroup: '18-24m', milestone: 'Indicates wet or dirty diaper', expectedMonths: 24, redFlag: false },
      { domain: 'SELF_CARE', ageGroup: '18-24m', milestone: 'Puts on simple clothing', expectedMonths: 24, redFlag: false },

      // ==========================================
      // 2-3 YEARS (18 milestones)
      // ==========================================
      // Motor Skills
      { domain: 'MOTOR_SKILLS', ageGroup: '2-3y', milestone: 'Pedals tricycle', expectedMonths: 36, redFlag: false },
      { domain: 'MOTOR_SKILLS', ageGroup: '2-3y', milestone: 'Climbs well', expectedMonths: 30, redFlag: false },
      { domain: 'MOTOR_SKILLS', ageGroup: '2-3y', milestone: 'Stands on one foot briefly', expectedMonths: 36, redFlag: false },
      { domain: 'MOTOR_SKILLS', ageGroup: '2-3y', milestone: 'Copies circle', expectedMonths: 36, redFlag: false },
      
      // Language
      { domain: 'LANGUAGE', ageGroup: '2-3y', milestone: 'Speaks in 3-4 word sentences', expectedMonths: 36, redFlag: true },
      { domain: 'LANGUAGE', ageGroup: '2-3y', milestone: 'Uses pronouns (I, you, me)', expectedMonths: 36, redFlag: false },
      { domain: 'LANGUAGE', ageGroup: '2-3y', milestone: 'Asks "what" and "why" questions', expectedMonths: 36, redFlag: false },
      { domain: 'LANGUAGE', ageGroup: '2-3y', milestone: 'Speech mostly understood by strangers', expectedMonths: 36, redFlag: true },
      
      // Social-Emotional
      { domain: 'SOCIAL_EMOTIONAL', ageGroup: '2-3y', milestone: 'Plays simple games with others', expectedMonths: 36, redFlag: false },
      { domain: 'SOCIAL_EMOTIONAL', ageGroup: '2-3y', milestone: 'Shows concern for crying friend', expectedMonths: 36, redFlag: false },
      { domain: 'SOCIAL_EMOTIONAL', ageGroup: '2-3y', milestone: 'Understands "mine" and "theirs"', expectedMonths: 30, redFlag: false },
      
      // Cognitive
      { domain: 'COGNITIVE', ageGroup: '2-3y', milestone: 'Counts to 3', expectedMonths: 36, redFlag: false },
      { domain: 'COGNITIVE', ageGroup: '2-3y', milestone: 'Matches colors', expectedMonths: 36, redFlag: false },
      { domain: 'COGNITIVE', ageGroup: '2-3y', milestone: 'Completes 3-4 piece puzzles', expectedMonths: 36, redFlag: false },
      
      // Self-Care
      { domain: 'SELF_CARE', ageGroup: '2-3y', milestone: 'Uses toilet during day', expectedMonths: 36, redFlag: false },
      { domain: 'SELF_CARE', ageGroup: '2-3y', milestone: 'Eats without much spilling', expectedMonths: 30, redFlag: false },
      { domain: 'SELF_CARE', ageGroup: '2-3y', milestone: 'Puts on shoes (may be wrong feet)', expectedMonths: 36, redFlag: false },
      { domain: 'SELF_CARE', ageGroup: '2-3y', milestone: 'Washes and dries hands independently', expectedMonths: 36, redFlag: false },

      // ==========================================
      // 3-4 YEARS (20 milestones)
      // ==========================================
      // Motor Skills
      { domain: 'MOTOR_SKILLS', ageGroup: '3-4y', milestone: 'Hops on one foot', expectedMonths: 48, redFlag: false },
      { domain: 'MOTOR_SKILLS', ageGroup: '3-4y', milestone: 'Catches bounced ball', expectedMonths: 48, redFlag: false },
      { domain: 'MOTOR_SKILLS', ageGroup: '3-4y', milestone: 'Uses scissors', expectedMonths: 42, redFlag: false },
      { domain: 'MOTOR_SKILLS', ageGroup: '3-4y', milestone: 'Draws person with 3 parts', expectedMonths: 48, redFlag: false },
      
      // Language
      { domain: 'LANGUAGE', ageGroup: '3-4y', milestone: 'Tells stories', expectedMonths: 48, redFlag: false },
      { domain: 'LANGUAGE', ageGroup: '3-4y', milestone: 'Sings songs from memory', expectedMonths: 48, redFlag: false },
      { domain: 'LANGUAGE', ageGroup: '3-4y', milestone: 'States first and last name', expectedMonths: 48, redFlag: false },
      { domain: 'LANGUAGE', ageGroup: '3-4y', milestone: 'Uses past tense correctly', expectedMonths: 48, redFlag: false },
      
      // Social-Emotional
      { domain: 'SOCIAL_EMOTIONAL', ageGroup: '3-4y', milestone: 'Plays cooperatively with other children', expectedMonths: 48, redFlag: false },
      { domain: 'SOCIAL_EMOTIONAL', ageGroup: '3-4y', milestone: 'Shows preference for friends', expectedMonths: 48, redFlag: false },
      { domain: 'SOCIAL_EMOTIONAL', ageGroup: '3-4y', milestone: 'Understands turn-taking', expectedMonths: 42, redFlag: false },
      { domain: 'SOCIAL_EMOTIONAL', ageGroup: '3-4y', milestone: 'Separates from parents without crying', expectedMonths: 48, redFlag: false },
      
      // Cognitive
      { domain: 'COGNITIVE', ageGroup: '3-4y', milestone: 'Counts to 10', expectedMonths: 48, redFlag: false },
      { domain: 'COGNITIVE', ageGroup: '3-4y', milestone: 'Names some colors', expectedMonths: 48, redFlag: false },
      { domain: 'COGNITIVE', ageGroup: '3-4y', milestone: 'Understands same and different', expectedMonths: 48, redFlag: false },
      { domain: 'COGNITIVE', ageGroup: '3-4y', milestone: 'Follows 3-step instructions', expectedMonths: 48, redFlag: false },
      
      // Self-Care
      { domain: 'SELF_CARE', ageGroup: '3-4y', milestone: 'Dresses and undresses independently', expectedMonths: 48, redFlag: false },
      { domain: 'SELF_CARE', ageGroup: '3-4y', milestone: 'Uses toilet independently', expectedMonths: 48, redFlag: false },
      { domain: 'SELF_CARE', ageGroup: '3-4y', milestone: 'Pours drinks from jug', expectedMonths: 48, redFlag: false },
      { domain: 'SELF_CARE', ageGroup: '3-4y', milestone: 'Brushes teeth with supervision', expectedMonths: 48, redFlag: false },

      // ==========================================
      // 4-5 YEARS (20 milestones)
      // ==========================================
      // Motor Skills
      { domain: 'MOTOR_SKILLS', ageGroup: '4-5y', milestone: 'Skips', expectedMonths: 60, redFlag: false },
      { domain: 'MOTOR_SKILLS', ageGroup: '4-5y', milestone: 'Swings and climbs confidently', expectedMonths: 60, redFlag: false },
      { domain: 'MOTOR_SKILLS', ageGroup: '4-5y', milestone: 'Writes some letters', expectedMonths: 60, redFlag: false },
      { domain: 'MOTOR_SKILLS', ageGroup: '4-5y', milestone: 'Draws person with 6+ parts', expectedMonths: 60, redFlag: false },
      
      // Language
      { domain: 'LANGUAGE', ageGroup: '4-5y', milestone: 'Speaks in complete sentences (5-6 words)', expectedMonths: 60, redFlag: false },
      { domain: 'LANGUAGE', ageGroup: '4-5y', milestone: 'Uses future tense', expectedMonths: 60, redFlag: false },
      { domain: 'LANGUAGE', ageGroup: '4-5y', milestone: 'Tells longer stories', expectedMonths: 60, redFlag: false },
      { domain: 'LANGUAGE', ageGroup: '4-5y', milestone: 'Says address and phone number', expectedMonths: 60, redFlag: false },
      
      // Social-Emotional
      { domain: 'SOCIAL_EMOTIONAL', ageGroup: '4-5y', milestone: 'Wants to be like friends', expectedMonths: 60, redFlag: false },
      { domain: 'SOCIAL_EMOTIONAL', ageGroup: '4-5y', milestone: 'Shows independence', expectedMonths: 60, redFlag: false },
      { domain: 'SOCIAL_EMOTIONAL', ageGroup: '4-5y', milestone: 'Aware of gender', expectedMonths: 60, redFlag: false },
      { domain: 'SOCIAL_EMOTIONAL', ageGroup: '4-5y', milestone: 'Able to distinguish fantasy from reality', expectedMonths: 60, redFlag: false },
      
      // Cognitive
      { domain: 'COGNITIVE', ageGroup: '4-5y', milestone: 'Counts to 20 or more', expectedMonths: 60, redFlag: false },
      { domain: 'COGNITIVE', ageGroup: '4-5y', milestone: 'Names most colors', expectedMonths: 60, redFlag: false },
      { domain: 'COGNITIVE', ageGroup: '4-5y', milestone: 'Understands time concepts (morning, afternoon)', expectedMonths: 60, redFlag: false },
      { domain: 'COGNITIVE', ageGroup: '4-5y', milestone: 'Recalls part of a story', expectedMonths: 60, redFlag: false },
      
      // Self-Care
      { domain: 'SELF_CARE', ageGroup: '4-5y', milestone: 'Uses knife and fork correctly', expectedMonths: 60, redFlag: false },
      { domain: 'SELF_CARE', ageGroup: '4-5y', milestone: 'Ties shoelaces', expectedMonths: 60, redFlag: false },
      { domain: 'SELF_CARE', ageGroup: '4-5y', milestone: 'Goes to toilet alone', expectedMonths: 60, redFlag: false },
      { domain: 'SELF_CARE', ageGroup: '4-5y', milestone: 'Crosses road safely with supervision', expectedMonths: 60, redFlag: false }
    ];

    // Insert milestones
    for (const milestone of milestones) {
      await queryRunner.query(
        `INSERT INTO developmental_milestones_standards 
        (domain, age_group, milestone_description, expected_months, is_red_flag, created_at) 
        VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          milestone.domain,
          milestone.ageGroup,
          milestone.milestone,
          milestone.expectedMonths,
          milestone.redFlag
        ]
      );
    }

    console.log(`✅ Seeded ${milestones.length} developmental milestones`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM developmental_milestones_standards`);
    console.log('Removed developmental milestones seed data');
  }
}
