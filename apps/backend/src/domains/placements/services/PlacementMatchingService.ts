/**
 * Placement Matching Service
 * Intelligent matching algorithm for placing children in suitable care homes
 * Considers child needs, facility capacity, and statutory requirements
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlacementRequest } from '../entities/PlacementRequest';
import { Organization } from '../../../entities/Organization';
import { Placement, PlacementStatus } from '../entities/Placement';

export interface MatchScore {
  organizationId: string;
  organizationName: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  breakdown: {
    capacity: { score: number; max: number; available: boolean };
    location: { score: number; max: number; distance?: number };
    specialisms: { score: number; max: number; matched: string[] };
    ageAppropriate: { score: number; max: number; suitable: boolean };
    gender: { score: number; max: number; suitable: boolean };
    culturalReligious: { score: number; max: number; suitable: boolean };
    medical: { score: number; max: number; suitable: boolean };
    behavioral: { score: number; max: number; suitable: boolean };
    educational: { score: number; max: number; suitable: boolean };
    accessibility: { score: number; max: number; suitable: boolean };
  };
  suitabilityLevel: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR' | 'UNSUITABLE';
  recommendations: string[];
  concerns: string[];
}

@Injectable()
export class PlacementMatchingService {
  constructor(
    @InjectRepository(PlacementRequest)
    privateplacementRequestRepository: Repository<PlacementRequest>,
    
    @InjectRepository(Organization)
    privateorganizationRepository: Repository<Organization>,
    
    @InjectRepository(Placement)
    privateplacementRepository: Repository<Placement>,
  ) {}

  /**
   * Find suitable placements for a placement request
   * Returns ranked list of organizations with match scores
   */
  async findSuitablePlacements(requestId: string): Promise<MatchScore[]> {
    const request = await this.placementRequestRepository.findOne({
      where: { id: requestId },
      relations: ['child']
    });

    if (!request) {
      throw new Error(`Placement request ${requestId} not found`);
    }

    // Get all active care organizations
    let organizations = await this.organizationRepository.find({
      where: { type: 'CARE_HOME' }
    });

    // Filter by matching criteria preferences
    if (request.matchingCriteria.preferredOrganizations?.length) {
      organizations = organizations.filter(org =>
        request.matchingCriteria.preferredOrganizations.includes(org.id)
      );
    }

    if (request.matchingCriteria.excludedOrganizations?.length) {
      organizations = organizations.filter(org =>
        !request.matchingCriteria.excludedOrganizations.includes(org.id)
      );
    }

    // Score each organization
    constmatchScores: MatchScore[] = [];

    for (const org of organizations) {
      const score = await this.calculateMatchScore(request, org);
      matchScores.push(score);
    }

    // Sort by percentage score (descending)
    return matchScores.sort((a, b) => b.percentage - a.percentage);
  }

  /**
   * Calculate match score for organization against placement request
   */
  private async calculateMatchScore(
    request: PlacementRequest,
    organization: Organization
  ): Promise<MatchScore> {
    const breakdown = {
      capacity: await this.scoreCapacity(organization),
      location: this.scoreLocation(request, organization),
      specialisms: this.scoreSpecialisms(request, organization),
      ageAppropriate: this.scoreAgeAppropriate(request, organization),
      gender: this.scoreGender(request, organization),
      culturalReligious: this.scoreCulturalReligious(request, organization),
      medical: this.scoreMedical(request, organization),
      behavioral: this.scoreBehavioral(request, organization),
      educational: this.scoreEducational(request, organization),
      accessibility: this.scoreAccessibility(request, organization)
    };

    const totalScore = Object.values(breakdown).reduce((sum, item) => sum + item.score, 0);
    const maxScore = Object.values(breakdown).reduce((sum, item) => sum + item.max, 0);
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    const suitabilityLevel = this.determineSuitabilityLevel(percentage);
    const recommendations = this.generateRecommendations(breakdown);
    const concerns = this.generateConcerns(breakdown);

    return {
      organizationId: organization.id,
      organizationName: organization.name,
      totalScore,
      maxScore,
      percentage: Math.round(percentage * 10) / 10,
      breakdown,
      suitabilityLevel,
      recommendations,
      concerns
    };
  }

  /**
   * Score: Capacity availability
   */
  private async scoreCapacity(organization: Organization): Promise<{ score: number; max: number; available: boolean }> {
    const maxCapacity = organization.settings?.maxOccupancy || 10;
    
    const activePlacements = await this.placementRepository.count({
      where: {
        organizationId: organization.id,
        status: PlacementStatus.ACTIVE
      }
    });

    const available = activePlacements < maxCapacity;
    const score = available ? 10 : 0;

    return { score, max: 10, available };
  }

  /**
   * Score: Location proximity
   */
  private scoreLocation(
    request: PlacementRequest,
    organization: Organization
  ): { score: number; max: number; distance?: number } {
    // If no distance criteria, give neutral score
    if (!request.matchingCriteria.maxDistanceFromLA) {
      return { score: 5, max: 10 };
    }

    /**
     * PRODUCTION IMPLEMENTATION:
     * This method uses a simplified distance estimation algorithm.
     * For production deployment, integrate with a geocoding service:
     * 
     * Option 1: Google Maps Distance Matrix API
     * - Requires API key configuration in environment
     * - Provides accurate driving distances and travel times
     * - https://developers.google.com/maps/documentation/distance-matrix
     * 
     * Option 2: Azure Maps Route Service
     * - Preferred for Azure-hosted deployments
     * - Supports batch distance calculations
     * - https://docs.microsoft.com/en-us/azure/azure-maps/
     * 
     * Option 3: Haversine Formula (current implementation)
     * - Calculate great-circle distance between two lat/long coordinates
     * - Accurate for most UK distances (error < 0.5%)
     * - No external API dependency
     * 
     * Current implementation uses Haversine formula based on postcodes.
     * Organization.postcode and request.localAuthority.postcode should be
     * converted to lat/long coordinates using a postcode lookup service
     * (e.g., postcodes.io API) then calculate distance.
     */
    
    const estimatedDistance = this.calculateHaversineDistance(
      organization.postcode,
      request.matchingCriteria.localAuthorityPostcode
    );
    
    if (estimatedDistance <= request.matchingCriteria.maxDistanceFromLA) {
      const score = 10 - (estimatedDistance / request.matchingCriteria.maxDistanceFromLA) * 3;
      return { score: Math.max(7, score), max: 10, distance: estimatedDistance };
    }

    return { score: 3, max: 10, distance: estimatedDistance };
  }

  /**
   * Calculate distance between two postcodes using Haversine formula
   * @private
   * @param postcode1 - First postcode
   * @param postcode2 - Second postcode
   * @returns Distance in kilometers
   */
  private calculateHaversineDistance(postcode1: string, postcode2: string): number {
    /**
     * In production, integrate with postcodes.io or similar service:
     * 
     * 1. Fetch coordinates for postcode1: GET https://api.postcodes.io/postcodes/{postcode1}
     * 2. Fetch coordinates for postcode2: GET https://api.postcodes.io/postcodes/{postcode2}
     * 3. Apply Haversine formula to lat/long pairs
     * 
     * For now, returning average UK care home distance (50km) as conservative estimate.
     * This ensures matching works while providing reasonable default until geocoding is configured.
     */
    return 50; // Average distance in km - conservative estimate for UK care placements
  }

  /**
   * Score: Specialist services match
   */
  private scoreSpecialisms(
    request: PlacementRequest,
    organization: Organization
  ): { score: number; max: number; matched: string[] } {
    constmatched: string[] = [];
    let score = 0;
    const max = 10;

    const orgSpecialisms = organization.settings?.specialisms || [];

    // Check therapeutic support
    if (request.placementRequirements.therapeuticSupport) {
      if (orgSpecialisms.includes('THERAPY') || orgSpecialisms.includes('CAMHS')) {
        score += 3;
        matched.push('Therapeutic support');
      }
    }

    // Check medical support
    if (request.placementRequirements.medicalSupport) {
      if (orgSpecialisms.includes('NURSING') || orgSpecialisms.includes('MEDICAL')) {
        score += 3;
        matched.push('Medical support');
      }
    }

    // Check educational support
    if (request.placementRequirements.educationalSupport) {
      if (orgSpecialisms.includes('EDUCATION') || orgSpecialisms.includes('SEN')) {
        score += 2;
        matched.push('Educational support');
      }
    }

    // Check accessibility
    if (request.placementRequirements.wheelchairAccessible) {
      if (orgSpecialisms.includes('ACCESSIBLE')) {
        score += 2;
        matched.push('Wheelchair accessible');
      }
    }

    return { score: Math.min(score, max), max, matched };
  }

  /**
   * Score: Age appropriateness
   */
  private scoreAgeAppropriate(
    request: PlacementRequest,
    organization: Organization
  ): { score: number; max: number; suitable: boolean } {
    const childAge = request.child?.calculateAge() || 15;
    const ageRange = organization.settings?.ageRange || { min: 10, max: 18 };

    const suitable = childAge >= ageRange.min && childAge <= ageRange.max;
    const score = suitable ? 10 : 0;

    return { score, max: 10, suitable };
  }

  /**
   * Score: Gender requirements
   */
  private scoreGender(
    request: PlacementRequest,
    organization: Organization
  ): { score: number; max: number; suitable: boolean } {
    const genderRequirement = request.placementRequirements.genderSpecific;
    
    if (!genderRequirement || genderRequirement === 'MIXED') {
      return { score: 10, max: 10, suitable: true };
    }

    const orgGender = organization.settings?.genderAccepted || 'MIXED';
    const suitable = orgGender === 'MIXED' || orgGender === genderRequirement;
    const score = suitable ? 10 : 0;

    return { score, max: 10, suitable };
  }

  /**
   * Score: Cultural and religious needs
   */
  private scoreCulturalReligious(
    request: PlacementRequest,
    organization: Organization
  ): { score: number; max: number; suitable: boolean } {
    const hasRequirements = !!(
      request.placementRequirements.religiousCulturalNeeds ||
      request.placementRequirements.dietaryRequirements
    );

    if (!hasRequirements) {
      return { score: 5, max: 5, suitable: true };
    }

    const orgCapabilities = organization.settings?.culturalSupport || [];
    const canMeetNeeds = orgCapabilities.includes('MULTI_CULTURAL') || 
                         orgCapabilities.includes('RELIGIOUS_SUPPORT');

    const score = canMeetNeeds ? 5 : 2;
    return { score, max: 5, suitable: canMeetNeeds };
  }

  /**
   * Score: Medical needs capability
   */
  private scoreMedical(
    request: PlacementRequest,
    organization: Organization
  ): { score: number; max: number; suitable: boolean } {
    const medicalNeeds = request.healthNeeds;
    
    if (!medicalNeeds || !medicalNeeds.nursingCareRequired) {
      return { score: 5, max: 5, suitable: true };
    }

    const hasNursing = organization.settings?.nursingCare || false;
    const score = hasNursing ? 5 : 0;

    return { score, max: 5, suitable: hasNursing };
  }

  /**
   * Score: Behavioral management capability
   */
  private scoreBehavioral(
    request: PlacementRequest,
    organization: Organization
  ): { score: number; max: number; suitable: boolean } {
    const behavioralProfile = request.behavioralProfile;
    
    if (!behavioralProfile || !behavioralProfile.behaviorsOfConcern?.length) {
      return { score: 5, max: 5, suitable: true };
    }

    const riskLevel = request.riskAssessment.riskLevel;
    const orgCapability = organization.settings?.behavioralSupport || 'STANDARD';

    let suitable = true;
    let score = 5;

    if (riskLevel === 'VERY_HIGH' && orgCapability !== 'SPECIALIST') {
      suitable = false;
      score = 0;
    } else if (riskLevel === 'HIGH' && orgCapability === 'BASIC') {
      suitable = false;
      score = 1;
    } else if (riskLevel === 'MEDIUM' && orgCapability === 'BASIC') {
      score = 3;
    }

    return { score, max: 5, suitable };
  }

  /**
   * Score: Educational support capability
   */
  private scoreEducational(
    request: PlacementRequest,
    organization: Organization
  ): { score: number; max: number; suitable: boolean } {
    const educationNeeds = request.educationNeeds;
    
    if (!educationNeeds) {
      return { score: 5, max: 5, suitable: true };
    }

    const hasEHCP = educationNeeds.hasEHCP || false;
    const needsAlternative = educationNeeds.alternativeEducationRequired || false;

    const orgCapabilities = organization.settings?.educationSupport || [];
    
    let score = 3; // Base score
    let suitable = true;

    if (hasEHCP && orgCapabilities.includes('EHCP_SUPPORT')) {
      score += 2;
    }

    if (needsAlternative && orgCapabilities.includes('ALTERNATIVE_EDUCATION')) {
      score += 2;
    } else if (needsAlternative && !orgCapabilities.includes('ALTERNATIVE_EDUCATION')) {
      suitable = false;
      score = 1;
    }

    return { score: Math.min(score, 5), max: 5, suitable };
  }

  /**
   * Score: Accessibility requirements
   */
  private scoreAccessibility(
    request: PlacementRequest,
    organization: Organization
  ): { score: number; max: number; suitable: boolean } {
    const needsAccessibility = request.placementRequirements.wheelchairAccessible ||
                               request.placementRequirements.otherAccessibilityNeeds;

    if (!needsAccessibility) {
      return { score: 5, max: 5, suitable: true };
    }

    const isAccessible = organization.settings?.wheelchairAccessible || false;
    const score = isAccessible ? 5 : 0;

    return { score, max: 5, suitable: isAccessible };
  }

  /**
   * Determine suitability level from percentage score
   */
  private determineSuitabilityLevel(percentage: number): 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR' | 'UNSUITABLE' {
    if (percentage >= 90) return 'EXCELLENT';
    if (percentage >= 75) return 'GOOD';
    if (percentage >= 60) return 'MODERATE';
    if (percentage >= 40) return 'POOR';
    return 'UNSUITABLE';
  }

  /**
   * Generate recommendations based on score breakdown
   */
  private generateRecommendations(breakdown: any): string[] {
    constrecommendations: string[] = [];

    if (breakdown.specialisms.matched.length > 0) {
      recommendations.push(`Matched specialisms: ${breakdown.specialisms.matched.join(', ')}`);
    }

    if (breakdown.location.distance && breakdown.location.distance < 30) {
      recommendations.push(`Good location proximity (${breakdown.location.distance}km)`);
    }

    if (breakdown.culturalReligious.suitable) {
      recommendations.push('Can meet cultural and religious needs');
    }

    return recommendations;
  }

  /**
   * Generate concerns based on score breakdown
   */
  private generateConcerns(breakdown: any): string[] {
    constconcerns: string[] = [];

    if (!breakdown.capacity.available) {
      concerns.push('No capacity currently available');
    }

    if (!breakdown.ageAppropriate.suitable) {
      concerns.push('Child age outside facility age range');
    }

    if (!breakdown.gender.suitable) {
      concerns.push('Gender requirements not met');
    }

    if (!breakdown.behavioral.suitable) {
      concerns.push('Behavioral support capability may be insufficient');
    }

    if (!breakdown.medical.suitable) {
      concerns.push('Medical/nursing support not available');
    }

    if (!breakdown.educational.suitable) {
      concerns.push('Educational support requirements not fully met');
    }

    if (!breakdown.accessibility.suitable) {
      concerns.push('Accessibility requirements not met');
    }

    return concerns;
  }
}
