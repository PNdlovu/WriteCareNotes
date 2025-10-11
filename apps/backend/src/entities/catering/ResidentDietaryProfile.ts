import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';

import { ResidentStatus } from '../entities/Resident';
import { BaseEntity } from '../BaseEntity';
import { Resident } from '../resident/Resident';
import { TextureModification } from './Menu';

export enum DietaryRestriction {
  VEGETARIAN = 'vegetarian',
  VEGAN = 'vegan',
  GLUTEN_FREE = 'gluten_free',
  DAIRY_FREE = 'dairy_free',
  LOW_SODIUM = 'low_sodium',
  LOW_SUGAR = 'low_sugar',
  LOW_FAT = 'low_fat',
  HIGH_PROTEIN = 'high_protein',
  DIABETIC = 'diabetic',
  RENAL = 'renal',
  CARDIAC = 'cardiac',
  HALAL = 'halal',
  KOSHER = 'kosher'
}

export enum NutritionalRisk {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

export enum HydrationLevel {
  ADEQUATE = 'adequate',
  AT_RISK = 'at_risk',
  DEHYDRATED = 'dehydrated'
}

export interface FoodAllergy {
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe' | 'anaphylaxis';
  symptoms: string[];
  lastReaction?: Date;
  epiPenRequired: boolean;
}

export interface CulturalPreference {
  cuisine: string;
  preferredFoods: string[];
  avoidedFoods: string[];
  religiousRequirements: string[];
  traditionalMeals: string[];
}

export interface NutritionalAssessment {
  assessmentDate: Date;
  assessor: string;
  bmi: number;
  weightStatus: 'underweight' | 'normal' | 'overweight' | 'obese';
  nutritionalRisk: NutritionalRisk;
  malnutritionRisk: boolean;
  supplementsRequired: string[];
  calorieRequirement: number;
  proteinRequirement: number;
  fluidRequirement: number; // ml per day
  notes: string;
}

export interface WeightRecord {
  date: Date;
  weight: number; // kg
  recordedBy: string;
  notes?: string;
}

export interface FluidIntakeRecord {
  date: Date;
  totalIntake: number; // ml
  targetIntake: number; // ml
  hydrationLevel: HydrationLevel;
  recordedBy: string;
  notes?: string;
}

export interface MealPreference {
  mealType: string;
  preferredTime: string;
  portionSize: 'small' | 'regular' | 'large';
  preferences: string[];
  dislikes: string[];
  textureModification: TextureModification;
}

export interface SupplementRecord {
  supplementName: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy: string;
  reason: string;
  status: ResidentStatus.ACTIVE | 'discontinued' | 'completed';
}

@Entity('resident_dietary_profiles')
export class ResidentDietaryProfile extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  residentId: string;

  @ManyToOne(() => Resident)
  @JoinColumn({ name: 'residentId' })
  resident: Resident;

  @Column('simple-array')
  dietaryRestrictions: DietaryRestriction[];

  @Column('jsonb')
  foodAllergies: FoodAllergy[];

  @Column('jsonb')
  culturalPreferences: CulturalPreference;

  @Column('jsonb')
  mealPreferences: MealPreference[];

  @Column({
    type: 'enum',
    enum: TextureModification,
    default: TextureModification.REGULAR
  })
  requiredTextureModification: TextureModification;

  @Column('jsonb')
  nutritionalAssessment: NutritionalAssessment;

  @Column('jsonb')
  weightHistory: WeightRecord[];

  @Column('jsonb')
  fluidIntakeHistory: FluidIntakeRecord[];

  @Column('jsonb')
  supplements: SupplementRecord[];

  @Column('text', { nullable: true })
  specialInstructions?: string;

  @Column('timestamp')
  lastReviewDate: Date;

  @Column('timestamp')
  nextReviewDate: Date;

  @Column()
  reviewedBy: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  hasAllergy(allergen: string): boolean {
    return this.foodAllergies.some(allergy => 
      allergy.allergen.toLowerCase() === allergen.toLowerCase()
    );
  }

  getSevereAllergies(): FoodAllergy[] {
    return this.foodAllergies.filter(allergy => 
      allergy.severity === 'severe' || allergy.severity === 'anaphylaxis'
    );
  }

  hasDietaryRestriction(restriction: DietaryRestriction): boolean {
    return this.dietaryRestrictions.includes(restriction);
  }

  requiresTextureModification(): boolean {
    return this.requiredTextureModification !== TextureModification.REGULAR;
  }

  getLatestWeight(): WeightRecord | null {
    if (this.weightHistory.length === 0) return null;
    return this.weightHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }

  getWeightTrend(days: number = 30): 'increasing' | 'decreasing' | 'stable' | 'insufficient_data' {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentWeights = this.weightHistory
      .filter(record => new Date(record.date) >= cutoffDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (recentWeights.length < 2) return 'insufficient_data';

    const firstWeight = recentWeights[0].weight;
    const lastWeight = recentWeights[recentWeights.length - 1].weight;
    const weightChange = lastWeight - firstWeight;
    const percentageChange = (weightChange / firstWeight) * 100;

    if (Math.abs(percentageChange) < 2) return 'stable';
    return percentageChange > 0 ? 'increasing' : 'decreasing';
  }

  getLatestFluidIntake(): FluidIntakeRecord | null {
    if (this.fluidIntakeHistory.length === 0) return null;
    return this.fluidIntakeHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }

  isAtRiskOfDehydration(): boolean {
    const latestIntake = this.getLatestFluidIntake();
    if (!latestIntake) return true;
    
    return latestIntake.hydrationLevel === HydrationLevel.AT_RISK || 
           latestIntake.hydrationLevel === HydrationLevel.DEHYDRATED;
  }

  getActiveSupplements(): SupplementRecord[] {
    return this.supplements.filter(supplement => supplement.status === 'active');
  }

  isNutritionalReviewDue(): boolean {
    return new Date() >= new Date(this.nextReviewDate);
  }

  isAtNutritionalRisk(): boolean {
    return this.nutritionalAssessment.nutritionalRisk === NutritionalRisk.HIGH ||
           this.nutritionalAssessment.nutritionalRisk === NutritionalRisk.VERY_HIGH ||
           this.nutritionalAssessment.malnutritionRisk;
  }

  getDailyCalorieTarget(): number {
    return this.nutritionalAssessment.calorieRequirement;
  }

  getDailyProteinTarget(): number {
    return this.nutritionalAssessment.proteinRequirement;
  }

  getDailyFluidTarget(): number {
    return this.nutritionalAssessment.fluidRequirement;
  }

  canEatMenuItem(menuItem: any): boolean {
    // Check allergies
    for (const allergy of this.foodAllergies) {
      if (menuItem.allergens.some((allergen: any) => 
        allergen.name.toLowerCase() === allergy.allergen.toLowerCase() && allergen.present
      )) {
        return false;
      }
    }

    // Check dietary restrictions
    for (const restriction of this.dietaryRestrictions) {
      if (restriction === DietaryRestriction.VEGETARIAN && !menuItem.dietaryFlags.includes('vegetarian')) {
        return false;
      }
      if (restriction === DietaryRestriction.VEGAN && !menuItem.dietaryFlags.includes('vegan')) {
        return false;
      }
      if (restriction === DietaryRestriction.GLUTEN_FREE && !menuItem.dietaryFlags.includes('gluten_free')) {
        return false;
      }
      // Add more restriction checks as needed
    }

    // Check texture modification
    if (!menuItem.textureModifications.includes(this.requiredTextureModification)) {
      return false;
    }

    return true;
  }

  getPersonalizedMenuItems(availableItems: any[]): any[] {
    return availableItems.filter(item => this.canEatMenuItem(item));
  }
}