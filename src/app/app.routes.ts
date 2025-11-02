import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { SignupComponent } from './components/auth/signup/signup.component';
import { BoardViewComponent } from './components/board/board-view/board-view.component';
import { ContactsListComponent } from './components/contacts/contacts-list/contacts-list.component';
import { SummaryViewComponent } from './components/summary/summary-view/summary-view.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'board', component: BoardViewComponent },
  { path: 'contacts', component: ContactsListComponent },
  { path: 'summary', component: SummaryViewComponent },
  { path: '**', redirectTo: '/login' }
];
