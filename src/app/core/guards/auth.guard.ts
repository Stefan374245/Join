import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard zum Schutz von Routes - nur authentifizierte Benutzer haben Zugriff
 * Nutzt Signal-basiertes Auth-State-Management
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  } else {
    router.navigate(['/logo-animation']);
    return false;
  }
};

/**
 * Guard für öffentliche Routes - nur nicht-authentifizierte Benutzer haben Zugriff
 * Nutzt Signal-basiertes Auth-State-Management
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  } else {
    router.navigate(['/board']);
    return false;
  }
};
