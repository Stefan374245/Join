import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { SignupComponent } from './components/auth/signup/signup.component';
import { WelcomeComponent } from './components/welcome/welcome/welcome.component';
import { StakeholderComponent } from './components/welcome/stakeholder/stakeholder.component';
import { FeatureRequestComponent } from './components/welcome/feature-request/feature-request.component';
import { EmailMaskComponent } from './components/welcome/email-mask/email-mask.component';
import { LogoAnimationComponent } from './components/auth/logo-animation/logo-animation.component';
import { AddTaskComponent } from './components/add-task/add-task.component';
import { BoardViewComponent } from './components/board/board-view/board-view.component';
import { ContactsListComponent } from './components/contacts/contacts-list/contacts-list.component';
import { ContactDetailComponent } from './components/contacts/contact-detail/contact-detail.component';
import { SummaryViewComponent } from './components/summary/summary-view/summary-view.component';
import { LegalNoticeComponent } from './components/legal-notice/legal-notice.component';
import { PrivacyPolicyComponent } from './components/privacy-policy/privacy-policy.component';
import { authGuard, guestGuard } from './guards/auth.guard';
import { HelpComponent } from './components/help/help.component';

export const routes: Routes = [
  { path: '', redirectTo: '/logo-animation', pathMatch: 'full' },
  {
    path: 'logo-animation',
    component: LogoAnimationComponent,
    canActivate: [guestGuard]
  },
  {
    path: 'welcome',
    component: WelcomeComponent,
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
    path: 'stakeholder',
    component: StakeholderComponent
  },
  {
    path: 'feature-request',
    component: FeatureRequestComponent
  },
  {
    path: 'emailmask',
    component: EmailMaskComponent
  },
  // ❌ ENTFERNT: Duplicate Route
  // {
  //   path: 'create-request',
  //   component: StakeholderComponent
  // },
  {
    path: 'board',
    component: BoardViewComponent,
    canActivate: [authGuard]
  },
  {
    path: 'add-task',
    component: AddTaskComponent,
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
    path: 'legal-notice',
    component: LegalNoticeComponent
  },
  {
    path: 'privacy-policy',
    component: PrivacyPolicyComponent
  },
  {
    path: 'help',
    component: HelpComponent
  },
  { path: '**', redirectTo: '/login' }
];
