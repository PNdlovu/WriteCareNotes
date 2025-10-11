import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum MenuType {
  STANDARD = 'standard',
  VEGETARIAN = 'vegetarian',
  VEGAN = 'vegan',
  HALAL = 'halal',
  KOSHER = 'kosher',
  DIABETIC = 'diabetic',
  PUREED = 'pureed',
  SOFT = 'soft',
  MINCED = 'minced'
}

export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
  SUPPER = 'supper'
}

export enum TextureModification {
  REGULAR = 'regular',
  SOFT = 'soft',
  MINCED_MOIST = 'minced_moist',
  PUREED = 'pureed',
  LIQUIDISED = 'liquidised'
}

export interface NutritionalInfo {
  calories: number;
  protein: number; // grams
  carbohydrates: number; // grams
  fat: number; // grams
  fiber: number; // grams
  sodium: number; // mg
  sugar: number; // grams
  vitamins: { [vitamin: string]: number };
  minerals: { [mineral: string]: number };
}

export interface Allergen {
  name: string;
  present: boolean;
  mayContain: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  allergens: Allergen[];
  nutritionalInfo: NutritionalInfo;
  textureModifications: TextureModification[];
  preparationTime: number; // minutes
  cost: number; // GBP
  portionSize: string;
  dietaryFlags: string[]; // vegetarian, vegan, gluten-free, etc.
}

export interface MenuCycle {
  id: string;
  cycleName: string;
  duration: number; // days
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

@Entity('menus')
export class Menu extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  menuName: string;

  @Column({
    type: 'enum',
    enum: MenuType,
    default: MenuType.STANDARD
  })
  menuType: MenuType;

  @Column('date')
  effectiveDate: Date;

  @Column('date', { nullable: true })
  expiryDate?: Date;

  @Column('jsonb')
  menuItems: { [mealType: string]: MenuItem[] };

  @Column('jsonb')
  nutritionalTargets: {
    dailyCalories: number;
    dailyProtein: number;
    dailySodium: number;
    dailyFiber: number;
  };

  @Column('jsonb')
  menuCycle: MenuCycle;

  @Column()
  approvedBy: string;

  @Column('timestamp')
  approvalDate: Date;

  @Column('text', { nullable: true })
  notes?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  getMenuItemsForMeal(mealType: MealType): MenuItem[] {
    return this.menuItems[mealType] || [];
  }

  getTotalDailyCalories(): number {
    let totalCalories = 0;
    Object.values(this.menuItems).forEach(mealItems => {
      mealItems.forEach(item => {
        totalCalories += item.nutritionalInfo.calories;
      });
    });
    return totalCalories;
  }

  hasAllergen(allergenName: string): boolean {
    return Object.values(this.menuItems).some(mealItems =>
      mealItems.some(item =>
        item.allergens.some(allergen => 
          allergen.name.toLowerCase() === allergenName.toLowerCase() && allergen.present
        )
      )
    );
  }

  getItemsWithTextureModification(modification: TextureModification): MenuItem[] {
    constitems: MenuItem[] = [];
    Object.values(this.menuItems).forEach(mealItems => {
      mealItems.forEach(item => {
        if (item.textureModifications.includes(modification)) {
          items.push(item);
        }
      });
    });
    return items;
  }

  getDailyCost(): number {
    let totalCost = 0;
    Object.values(this.menuItems).forEach(mealItems => {
      mealItems.forEach(item => {
        totalCost += item.cost;
      });
    });
    return totalCost;
  }

  isNutritionallyBalanced(): boolean {
    const totalCalories = this.getTotalDailyCalories();
    const targets = this.nutritionalTargets;
    
    // Check if within 10% of target calories
    const calorieVariance = Math.abs(totalCalories - targets.dailyCalories) / targets.dailyCalories;
    return calorieVariance <= 0.1;
  }

  getMenuItemById(itemId: string): MenuItem | null {
    for (const mealItems of Object.values(this.menuItems)) {
      const item = mealItems.find(item => item.id === itemId);
      if (item) return item;
    }
    return null;
  }
}
