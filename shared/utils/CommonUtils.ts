import { v4 as uuidv4 } from 'uuid';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TimeSlot {
  start: string; // HH:mm format
  end: string;   // HH:mm format
}

export class DateTimeHelper {
  /**
   * Get the start and end of a day for a given date
   */
  static getDayBounds(date: Date): DateRange {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }

  /**
   * Get the start and end of a week for a given date (Monday to Sunday)
   */
  static getWeekBounds(date: Date): DateRange {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }

  /**
   * Get the start and end of a month for a given date
   */
  static getMonthBounds(date: Date): DateRange {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }

  /**
   * Check if a date is within a date range
   */
  static isDateInRange(date: Date, range: DateRange): boolean {
    return date >= range.start && date <= range.end;
  }

  /**
   * Add business days to a date (excluding weekends)
   */
  static addBusinessDays(date: Date, days: number): Date {
    const result = new Date(date);
    let daysAdded = 0;
    
    while (daysAdded < days) {
      result.setDate(result.getDate() + 1);
      
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (result.getDay() !== 0 && result.getDay() !== 6) {
        daysAdded++;
      }
    }
    
    return result;
  }

  /**
   * Check if a date is a business day (Monday to Friday)
   */
  static isBusinessDay(date: Date): boolean {
    const day = date.getDay();
    return day !== 0 && day !== 6; // Not Sunday (0) or Saturday (6)
  }

  /**
   * Format date for UK locale
   */
  static formatUKDate(date: Date): string {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Format date and time for UK locale
   */
  static formatUKDateTime(date: Date): string {
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  /**
   * Format time in 24-hour format
   */
  static formatTime24(date: Date): string {
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  /**
   * Parse UK date format (DD/MM/YYYY)
   */
  static parseUKDate(dateString: string): Date | null {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateString.match(regex);
    
    if (!match) return null;
    
    const [, day, month, year] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Validate the date
    if (date.getDate() !== parseInt(day) || 
        date.getMonth() !== parseInt(month) - 1 || 
        date.getFullYear() !== parseInt(year)) {
      return null;
    }
    
    return date;
  }

  /**
   * Get age from date of birth
   */
  static getAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Check if time is within business hours (configurable)
   */
  static isBusinessHours(
    date: Date, 
    businessHours: TimeSlot = { start: '09:00', end: '17:00' }
  ): boolean {
    if (!this.isBusinessDay(date)) return false;
    
    const timeString = this.formatTime24(date);
    return timeString >= businessHours.start && timeString <= businessHours.end;
  }

  /**
   * Get next business day
   */
  static getNextBusinessDay(date: Date): Date {
    const next = new Date(date);
    do {
      next.setDate(next.getDate() + 1);
    } while (!this.isBusinessDay(next));
    
    return next;
  }

  /**
   * Calculate medication schedule based on frequency
   */
  static calculateMedicationSchedule(
    startDate: Date,
    frequency: 'daily' | 'twice-daily' | 'three-times-daily' | 'four-times-daily' | 'weekly',
    duration: number // in days
  ): Date[] {
    const schedule: Date[] = [];
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + duration);
    
    let current = new Date(startDate);
    
    while (current < endDate) {
      switch (frequency) {
        case 'daily':
          schedule.push(new Date(current));
          current.setDate(current.getDate() + 1);
          break;
          
        case 'twice-daily':
          const morning = new Date(current);
          morning.setHours(9, 0, 0, 0);
          schedule.push(morning);
          
          const evening = new Date(current);
          evening.setHours(21, 0, 0, 0);
          schedule.push(evening);
          
          current.setDate(current.getDate() + 1);
          break;
          
        case 'three-times-daily':
          [9, 13, 21].forEach(hour => {
            const time = new Date(current);
            time.setHours(hour, 0, 0, 0);
            schedule.push(time);
          });
          current.setDate(current.getDate() + 1);
          break;
          
        case 'four-times-daily':
          [8, 12, 16, 20].forEach(hour => {
            const time = new Date(current);
            time.setHours(hour, 0, 0, 0);
            schedule.push(time);
          });
          current.setDate(current.getDate() + 1);
          break;
          
        case 'weekly':
          schedule.push(new Date(current));
          current.setDate(current.getDate() + 7);
          break;
      }
    }
    
    return schedule.filter(date => date < endDate);
  }
}

export class StringHelper {
  /**
   * Generate a correlation ID for request tracking
   */
  static generateCorrelationId(): string {
    return uuidv4();
  }

  /**
   * Sanitize string for safe database storage
   */
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .trim();
  }

  /**
   * Convert string to title case
   */
  static toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  /**
   * Generate a random alphanumeric string
   */
  static generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Mask sensitive data for logging
   */
  static maskSensitiveData(str: string, visibleChars: number = 4): string {
    if (str.length <= visibleChars) {
      return '*'.repeat(str.length);
    }
    
    const masked = '*'.repeat(str.length - visibleChars);
    return str.slice(0, visibleChars) + masked;
  }

  /**
   * Extract initials from full name
   */
  static getInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .join('');
  }

  /**
   * Format NHS number for display (XXX XXX XXXX)
   */
  static formatNHSNumber(nhsNumber: string): string {
    const digits = nhsNumber.replace(/\D/g, '');
    if (digits.length !== 10) return nhsNumber;
    
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }

  /**
   * Format UK postcode
   */
  static formatPostcode(postcode: string): string {
    const cleaned = postcode.replace(/\s/g, '').toUpperCase();
    if (cleaned.length < 5) return postcode;
    
    const inward = cleaned.slice(-3);
    const outward = cleaned.slice(0, -3);
    
    return `${outward} ${inward}`;
  }
}

export class NumberHelper {
  /**
   * Format currency for UK locale
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  }

  /**
   * Round to specified decimal places
   */
  static roundTo(num: number, decimalPlaces: number): number {
    return Math.round(num * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
  }

  /**
   * Check if value is within range (inclusive)
   */
  static isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  /**
   * Generate random number between min and max (inclusive)
   */
  static randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Calculate BMI
   */
  static calculateBMI(weightKg: number, heightM: number): number {
    if (heightM <= 0) throw new Error('Height must be greater than 0');
    return this.roundTo(weightKg / (heightM * heightM), 1);
  }

  /**
   * Get BMI category
   */
  static getBMICategory(bmi: number): string {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }
}

export class ArrayHelper {
  /**
   * Group array of objects by a key
   */
  static groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const group = String(item[key]);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  /**
   * Remove duplicates from array based on a key
   */
  static uniqueBy<T>(array: T[], key: keyof T): T[] {
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }

  /**
   * Chunk array into smaller arrays of specified size
   */
  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Sort array of objects by multiple keys
   */
  static sortBy<T>(array: T[], ...keys: (keyof T)[]): T[] {
    return [...array].sort((a, b) => {
      for (const key of keys) {
        const aVal = a[key];
        const bVal = b[key];
        
        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;
      }
      return 0;
    });
  }
}

// Export all helpers as a single object
export const Utils = {
  DateTime: DateTimeHelper,
  String: StringHelper,
  Number: NumberHelper,
  Array: ArrayHelper
};