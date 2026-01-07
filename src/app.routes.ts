import { Routes, CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { DashboardComponent } from './components/dashboard.component';
import { TransactionsComponent } from './components/transactions.component';
import { AssetsComponent } from './components/assets.component';
import { AdvisorComponent } from './components/advisor.component';
import { LoginComponent } from './components/login.component';
import { ContactComponent } from './components/contact.component';
import { BusinessesComponent } from './components/businesses.component';
import { CustomersComponent } from './components/customers.component';
import { AuthService } from './services/auth.service';

const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  if (auth.isLoggedIn()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { 
    path: '', 
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'transactions', component: TransactionsComponent },
      { path: 'businesses', component: BusinessesComponent },
      { path: 'customers', component: CustomersComponent },
      { path: 'assets', component: AssetsComponent },
      { path: 'advisor', component: AdvisorComponent },
      { path: 'contact', component: ContactComponent }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
