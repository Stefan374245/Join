import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';
import { HeroComponent } from './features/landing/hero/hero.component';
import { RequestFormComponent } from './features/landing/hero/request/request-form.component';
import { EmailFormComponent } from './features/landing/hero/email-form/email-form.component';
import { LogoAnimationComponent } from './auth/logo-animation/logo-animation.component';
import { AddTaskViewComponent } from './features/add-task/presentational/add-task-view/add-task-view.component';
import { BoardViewComponent } from './features/board/presentational/board-view/board-view.component';
import { ContactsListComponent } from './features/contacts/contacts-list/contacts-list.component';
import { ContactDetailComponent } from './features/contacts/contact-detail/contact-detail.component';
import { SummaryViewComponent } from './features/summary/summary-view/summary-view.component';
import { LegalNoticeComponent } from './features/legal-notice/legal-notice.component';
import { PrivacyPolicyComponent } from './features/privacy-policy/privacy-policy.component';
import { HelpComponent } from './features/help/help.component';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/logo-animation', pathMatch: 'full' },
  {
    path: 'logo-animation',
    component: LogoAnimationComponent
  },
  {
    path: 'hero',
    component: HeroComponent,
    canActivate: [guestGuard]
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard]
  },
  {
    path: 'signup',
    component: SignupComponent
  },
  {
    path: 'request/:type',
    component: RequestFormComponent
  },
  {
    path: 'request',
    redirectTo: '/request/stakeholder',
    pathMatch: 'full'
  },
  {
    path: 'email-form',
    component: EmailFormComponent
  },
  {
    path: 'board',
    component: BoardViewComponent,
    canActivate: [authGuard]
  },
  {
    path: 'add-task',
    component: AddTaskViewComponent,
    canActivate: [authGuard]
  },
  {
    path: 'contacts',
    component: ContactsListComponent,
    canActivate: [authGuard]
  },
  {
    path: 'contacts/:email',
    component: ContactDetailComponent,
    canActivate: [authGuard]
  },
  {
    path: 'summary',
    component: SummaryViewComponent,
    canActivate: [authGuard]
  },
  {
    path: 'help',
    component: HelpComponent,
    canActivate: [authGuard]
  },
  {
    path: 'legal-notice',
    component: LegalNoticeComponent
  },
  {
    path: 'privacy-policy',
    component: PrivacyPolicyComponent
  },
  { path: '**', redirectTo: '/logo-animation' }
];
