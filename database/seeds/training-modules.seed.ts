/**
 * @fileoverview Database Seed Script - Training Modules
 * @module Database/seeds/training-modules
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * 
 * @description Seeds the database with pre-built training modules for all roles.
 * Run this AFTER database migration to populate initial training content.
 * 
 * @usage
 * npm run seed:training-modules
 * OR
 * ts-node database/seeds/training-modules.seed.ts
 */

import { DataSource } from 'typeorm';
import { APP_TRAINING_MODULES, ROLE_TRAINING_REQUIREMENTS } from '../../src/services/academy-training/app-training-modules';

/**
 * Main seed function
 */
export async function seedTrainingModules(dataSource: DataSource): Promise<void> {
  console.log('🌱 Starting training modules seed...');

  const courseRepository = dataSource.getRepository('TrainingCourse');
  const contentRepository = dataSource.getRepository('TrainingContent');
  const assessmentRepository = dataSource.getRepository('TrainingAssessment');

  let coursesCreated = 0;
  let contentCreated = 0;
  let assessmentsCreated = 0;

  try {
    // Loop through all training modules
    for (const [moduleKey, moduleData] of Object.entries(APP_TRAINING_MODULES)) {
      console.log(`  📘 Creating module: ${moduleData.title}`);

      // 1. Create the training course
      const course = courseRepository.create({
        title: moduleData.title,
        description: moduleData.description,
        category: moduleData.category,
        trainingType: moduleData.trainingType || 'internal_app',
        level: moduleData.level,
        duration: moduleData.duration,
        credits: moduleData.credits || 0,
        targetAudience: moduleData.targetAudience,
        isMandatory: moduleData.isMandatory,
        learningObjectives: moduleData.learningObjectives,
        tags: moduleData.tags || [],
        isActive: moduleData.isActive !== false,
        // Compliance fields (nullable for internal training)
        accreditedProvider: null,
        awardingBody: null,
        qualificationLevel: null,
        metadata: {
          moduleKey,
          version: '1.0.0',
          createdBy: 'system_seed',
          lastUpdated: new Date().toISOString()
        }
      });

      const savedCourse = await courseRepository.save(course);
      coursesCreated++;

      // 2. Create content items for this course
      if (moduleData.content && Array.isArray(moduleData.content)) {
        for (const contentItem of moduleData.content) {
          const content = contentRepository.create({
            courseId: savedCourse.id,
            title: contentItem.title,
            description: contentItem.description,
            type: contentItem.type,
            content: contentItem.content,
            duration: contentItem.duration,
            order: contentItem.order,
            isRequired: contentItem.isRequired !== false,
            metadata: {
              contentId: contentItem.id
            }
          });

          await contentRepository.save(content);
          contentCreated++;
        }
      }

      // 3. Create assessments (quizzes) for this course
      if (moduleData.assessments && Array.isArray(moduleData.assessments)) {
        for (const assessmentItem of moduleData.assessments) {
          const assessment = assessmentRepository.create({
            courseId: savedCourse.id,
            title: assessmentItem.title,
            description: assessmentItem.description,
            type: assessmentItem.type,
            questions: assessmentItem.questions,
            passingScore: assessmentItem.passingScore || 70,
            timeLimit: assessmentItem.timeLimit,
            attemptsAllowed: assessmentItem.attemptsAllowed || 3,
            isRequired: assessmentItem.isRequired !== false,
            order: assessmentItem.order,
            metadata: {
              assessmentId: assessmentItem.id
            }
          });

          await assessmentRepository.save(assessment);
          assessmentsCreated++;
        }
      }

      console.log(`  ✅ Module created: ${savedCourse.title}`);
    }

    console.log('\n📊 Seed Summary:');
    console.log(`  ✅ Training Courses: ${coursesCreated}`);
    console.log(`  ✅ Content Items: ${contentCreated}`);
    console.log(`  ✅ Assessments: ${assessmentsCreated}`);
    console.log('\n🎉 Training modules seed completed successfully!\n');

  } catch (error) {
    console.error('❌ Error seeding training modules:', error);
    throw error;
  }
}

/**
 * Seed role-based training assignments
 */
export async function seedRoleTrainingAssignments(dataSource: DataSource): Promise<void> {
  console.log('🌱 Creating role-based training assignment templates...');

  const roleTrainingRepository = dataSource.getRepository('RoleTraining');
  const courseRepository = dataSource.getRepository('TrainingCourse');

  try {
    for (const [role, moduleKeys] of Object.entries(ROLE_TRAINING_REQUIREMENTS)) {
      console.log(`  👤 Processing role: ${role}`);

      for (const moduleKey of moduleKeys) {
        // Find the course by metadata.moduleKey
        const course = await courseRepository.findOne({
          where: { 
            metadata: { moduleKey } 
          } as any
        });

        if (course) {
          const roleTraining = roleTrainingRepository.create({
            role,
            courseId: course.id,
            isRequired: course.isMandatory,
            autoEnroll: true,
            metadata: {
              moduleKey,
              assignedAt: new Date().toISOString()
            }
          });

          await roleTrainingRepository.save(roleTraining);
        } else {
          console.warn(`  ⚠️  Course not found for module: ${moduleKey}`);
        }
      }
    }

    console.log('  ✅ Role-based training assignments created\n');

  } catch (error) {
    console.error('❌ Error creating role assignments:', error);
    throw error;
  }
}

/**
 * Run all seeds
 */
export async function runAllTrainingSeeds(dataSource: DataSource): Promise<void> {
  await seedTrainingModules(dataSource);
  await seedRoleTrainingAssignments(dataSource);
}

// If running directly
if (require.main === module) {
  // Import your database connection
  // const AppDataSource = require('../config/database').AppDataSource;
  
  console.log('⚠️  This script should be run through npm script:');
  console.log('   npm run seed:training-modules\n');
  console.log('Or import and call from your seed runner.');
}
