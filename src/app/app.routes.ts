import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { SignupComponent } from './components/auth/signup/signup.component';
import { AddTaskComponent } from './components/add-task/add-task.component';
import { BoardViewComponent } from './components/board/board-view/board-view.component';
import { ContactsListComponent } from './components/contacts/contacts-list/contacts-list.component';
import { SummaryViewComponent } from './components/summary/summary-view/summary-view.component';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { 
    path: 'login', 
    component: LoginComponent
    // guestGuard entfernt - User können jederzeit zur Login-Seite
  },
  { 
    path: 'signup', 
    component: SignupComponent
    // guestGuard entfernt
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
    path: 'summary', 
    component: SummaryViewComponent,
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '/login' }
];
