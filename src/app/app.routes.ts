import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';
import { WelcomeComponent } from './features/public/welcome/welcome.component';
import { RolePageComponent } from './features/public/welcome/role-page/role-page.component';
import { EmailMaskComponent } from './features/public/welcome/email-mask/email-mask.component';
import { LogoAnimationComponent } from './auth/logo-animation/logo-animation.component';
import { AddTaskComponent } from './features/add-task/add-task.component';
import { BoardViewComponent } from './features/board/containers/board-view/board-view.component';
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
    path: 'role/:type',
    component: RolePageComponent
  },
  {
    path: 'emailmask',
    component: EmailMaskComponent
  },
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
  { path: '**', redirectTo: '/logo-animation' }
];
