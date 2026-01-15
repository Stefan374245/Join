import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';


export interface DailyLimitInfo {
  currentCount: number;
  maxLimit: number;
  remainingRequests: number;
  date: string;
  isLimitReached: boolean;
}

/**
 * Service for managing daily request limits with Firestore integration
 */
@Injectable({
  providedIn: 'root'
})
export class DailyLimitService {
  private firestore = inject(Firestore);

  private limitInfo$ = new BehaviorSubject<DailyLimitInfo>({
    currentCount: 0,
    maxLimit: 10,
    remainingRequests: 10,
    date: '',
    isLimitReached: false
  });

  private lastFetchTime = 0;
  private cacheDuration = 30000;

  /**
   * Returns Observable of limit information
   * @returns Observable stream of limit information
   */
  getLimitInfo(): Observable<DailyLimitInfo> {
    return this.limitInfo$.asObservable();
  }

  /**
   * Returns current limit information synchronously
   * @returns Current limit information value
   */
  getCurrentLimitInfo(): DailyLimitInfo {
    return this.limitInfo$.value;
  }

  /**
   * Fetches daily limit information from Firestore with caching
   * @param forceRefresh - Forces new Firestore fetch
   * @returns Promise with limit information
   */
  async fetchDailyLimit(forceRefresh = false): Promise<DailyLimitInfo> {
    const now = Date.now();

    if (!forceRefresh && (now - this.lastFetchTime) < this.cacheDuration) {
      return this.limitInfo$.value;
    }

    try {
      const today = this.getTodayDate();
      const currentCount = await this.fetchCountFromFirestore(today);
      const limitInfo = this.createLimitInfo(currentCount, today);

      this.updateLimitState(limitInfo, now);
      return limitInfo;
    } catch (error) {
      console.error('❌ Error fetching daily limit:', error);
      return this.getDefaultLimitInfo();
    }
  }

  /**
   * Returns today's date in ISO format
   * @returns Date in YYYY-MM-DD format
   */
  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Fetches current count from Firestore
   * @param date - Date in YYYY-MM-DD format
   * @returns Promise with current count
   */
  private async fetchCountFromFirestore(date: string): Promise<number> {
    const docId = `global_${date}`;
    const docRef = doc(this.firestore, 'daily_limits', docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data['count'] || data['currentCount'] || 0;
    }
    return 0;
  }

  /**
   * Creates DailyLimitInfo object from data
   * @param currentCount - Current number of requests
   * @param date - Date in YYYY-MM-DD format
   * @returns Complete limit information object
   */
  private createLimitInfo(currentCount: number, date: string): DailyLimitInfo {
    const maxLimit = 10;
    return {
      currentCount,
      maxLimit,
      remainingRequests: Math.max(0, maxLimit - currentCount),
      date,
      isLimitReached: currentCount >= maxLimit
    };
  }

  /**
   * Updates internal state with new limit information
   * @param limitInfo - The new limit information
   * @param timestamp - Timestamp of the update
   */
  private updateLimitState(limitInfo: DailyLimitInfo, timestamp: number): void {
    this.limitInfo$.next(limitInfo);
    this.lastFetchTime = timestamp;
  }

  /**
   * Returns default limit information for errors or fallback
   * @returns Default limit information
   */
  private getDefaultLimitInfo(): DailyLimitInfo {
    return {
      currentCount: 0,
      maxLimit: 10,
      remainingRequests: 10,
      date: this.getTodayDate(),
      isLimitReached: false
    };
  }

  /**
   * Invalidates cache and forces new fetch on next call
   */
  invalidateCache(): void {
    this.lastFetchTime = 0;
  }
}
