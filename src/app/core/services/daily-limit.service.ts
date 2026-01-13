import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Interface für Informationen über das tägliche Limit
 * @interface DailyLimitInfo
 */
export interface DailyLimitInfo {
  /** Aktuelle Anzahl der Anfragen heute */
  currentCount: number;
  /** Maximales Limit pro Tag */
  maxLimit: number;
  /** Verbleibende Anfragen heute */
  remainingRequests: number;
  /** Datum im ISO-Format (YYYY-MM-DD) */
  date: string;
  /** Gibt an, ob das Limit erreicht wurde */
  isLimitReached: boolean;
}

/**
 * Service zur Verwaltung von täglichen Anfrage-Limits
 * 
 * Dieser Service verwaltet und überwacht das tägliche Limit für Anfragen:
 * - Abrufen der aktuellen Limit-Informationen aus Firestore
 * - Caching zur Reduzierung von Firestore-Anfragen
 * - Überwachung ob das Tageslimit erreicht wurde
 * - Bereitstellung von Limit-Informationen als Observable
 * 
 * @class DailyLimitService
 */
@Injectable({
  providedIn: 'root'
})
export class DailyLimitService {
  private firestore = inject(Firestore);

  /** BehaviorSubject für Limit-Informationen */
  private limitInfo$ = new BehaviorSubject<DailyLimitInfo>({
    currentCount: 0,
    maxLimit: 10,
    remainingRequests: 10,
    date: '',
    isLimitReached: false
  });

  /** Zeitstempel des letzten Firestore-Abrufs */
  private lastFetchTime = 0;
  /** Cache-Dauer in Millisekunden (30 Sekunden) */
  private cacheDuration = 30000;

  /**
   * Gibt ein Observable der Limit-Informationen zurück
   * @returns {Observable<DailyLimitInfo>} Observable Stream der Limit-Informationen
   */
  getLimitInfo(): Observable<DailyLimitInfo> {
    return this.limitInfo$.asObservable();
  }

  /**
   * Gibt die aktuellen Limit-Informationen synchron zurück
   * @returns {DailyLimitInfo} Aktueller Wert der Limit-Informationen
   */
  getCurrentLimitInfo(): DailyLimitInfo {
    return this.limitInfo$.value;
  }

  /**
   * Ruft die täglichen Limit-Informationen aus Firestore ab
   * Verwendet gecachte Daten wenn verfügbar und nicht abgelaufen
   * @param {boolean} [forceRefresh=false] - Erzwingt einen neuen Firestore-Abruf
   * @returns {Promise<DailyLimitInfo>} Promise mit den Limit-Informationen
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
   * Gibt das heutige Datum im ISO-Format zurück
   * @private
   * @returns {string} Datum im Format YYYY-MM-DD
   */
  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Ruft den aktuellen Zähler aus Firestore ab
   * @private
   * @param {string} date - Datum im Format YYYY-MM-DD
   * @returns {Promise<number>} Promise mit dem aktuellen Zähler
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
   * Erstellt ein DailyLimitInfo-Objekt aus den Daten
   * @private
   * @param {number} currentCount - Aktuelle Anzahl der Anfragen
   * @param {string} date - Datum im Format YYYY-MM-DD
   * @returns {DailyLimitInfo} Vollständiges Limit-Informations-Objekt
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
   * Aktualisiert den internen State mit neuen Limit-Informationen
   * @private
   * @param {DailyLimitInfo} limitInfo - Die neuen Limit-Informationen
   * @param {number} timestamp - Zeitstempel des Updates
   * @returns {void}
   */
  private updateLimitState(limitInfo: DailyLimitInfo, timestamp: number): void {
    this.limitInfo$.next(limitInfo);
    this.lastFetchTime = timestamp;
  }

  /**
   * Gibt Standard-Limit-Informationen zurück
   * Wird bei Fehlern oder als Fallback verwendet
   * @private
   * @returns {DailyLimitInfo} Standard-Limit-Informationen
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
   * Invalidiert den Cache und erzwingt einen neuen Abruf beim nächsten Aufruf
   * @returns {void}
   */
  invalidateCache(): void {
    this.lastFetchTime = 0;
  }
}
