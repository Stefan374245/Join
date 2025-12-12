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
  private cacheDuration = 30000; // 30 Sekunden Cache

  /**
   * Gibt ein Observable für Live-Updates zurück
   */
  getLimitInfo(): Observable<DailyLimitInfo> {
    return this.limitInfo$.asObservable();
  }

  /**
   * Gibt die aktuellen Limit-Infos zurück (synchron)
   */
  getCurrentLimitInfo(): DailyLimitInfo {
    return this.limitInfo$.value;
  }

  /**
   * Lädt die aktuellen Daily Limits aus Firestore
   * Nutzt Caching um Firebase-Requests zu minimieren
   */
  async fetchDailyLimit(forceRefresh = false): Promise<DailyLimitInfo> {
    const now = Date.now();
    
    // Cache-Check
    if (!forceRefresh && (now - this.lastFetchTime) < this.cacheDuration) {
      console.log('📊 Using cached daily limit info');
      return this.limitInfo$.value;
    }

    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const docId = `global_${today}`;
      
      console.log('📊 Fetching daily limit from Firestore...');
      console.log('   Collection: daily_limits');
      console.log('   Document ID:', docId);
      console.log('   Full path: daily_limits/' + docId);
      
      const docRef = doc(this.firestore, 'daily_limits', docId);
      const docSnap = await getDoc(docRef);

      let currentCount = 0;
      const maxLimit = 10;

      console.log('📡 Document exists?', docSnap.exists());

      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('📦 Raw Firestore data:', data);
        console.log('📦 Data keys:', Object.keys(data));
        
        // Versuche verschiedene Felder zu lesen
        currentCount = data['count'] || data['currentCount'] || 0;
        
        console.log('✅ Parsed count:', currentCount);
        console.log('   data["count"]:', data['count']);
        console.log('   data["currentCount"]:', data['currentCount']);
      } else {
        console.log('📝 No document found in Firestore, count is 0');
        console.log('   Expected path: daily_limits/' + docId);
      }

      const limitInfo: DailyLimitInfo = {
        currentCount,
        maxLimit,
        remainingRequests: Math.max(0, maxLimit - currentCount),
        date: today,
        isLimitReached: currentCount >= maxLimit
      };

      this.limitInfo$.next(limitInfo);
      this.lastFetchTime = now;

      return limitInfo;

    } catch (error) {
      console.error('❌ Error fetching daily limit:', error);
      
      // Bei Fehler: Optimistisch annehmen, dass Limit OK ist
      return {
        currentCount: 0,
        maxLimit: 10,
        remainingRequests: 10,
        date: new Date().toISOString().split('T')[0],
        isLimitReached: false
      };
    }
  }

  /**
   * Invalidiert den Cache und forciert einen Refresh beim nächsten Abruf
   */
  invalidateCache(): void {
    this.lastFetchTime = 0;
  }
}
