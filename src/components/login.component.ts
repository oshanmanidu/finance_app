
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-neutral-950 px-4">
       <div class="bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-neutral-800">
          
          <div class="text-center mb-8">
             <div class="w-16 h-16 bg-brand-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-3xl shadow-lg shadow-brand-500/30">
                <i class="fa-solid fa-chart-line"></i>
             </div>
             <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Finance Manager</h1>
             <p class="text-gray-500 dark:text-neutral-400 mt-2">Sign in to manage your business</p>
          </div>

          @if (error()) {
             <div class="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-500/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-6 text-sm text-center font-medium animate-pulse">
                {{ error() }}
             </div>
          }

          <form (ngSubmit)="onSubmit()" class="space-y-6">
             <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Username</label>
                <div class="relative">
                   <i class="fa-solid fa-user absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                   <input type="text" [(ngModel)]="username" name="username" class="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-xl py-3 pl-10 pr-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition" placeholder="Enter username" required>
                </div>
             </div>

             <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Password</label>
                <div class="relative">
                   <i class="fa-solid fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                   <input type="password" [(ngModel)]="password" name="password" class="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-xl py-3 pl-10 pr-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition" placeholder="Enter password" required>
                </div>
             </div>

             <button type="submit" [disabled]="isLoading()" class="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center">
                @if (isLoading()) {
                   <i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Signing In...
                } @else {
                   Sign In
                }
             </button>
          </form>
          
          <div class="mt-8 text-center text-xs text-gray-400 dark:text-neutral-500">
             <p>Powered by <span class="font-bold text-gray-600 dark:text-neutral-400">Mezota</span> Secure Systems</p>
          </div>
       </div>
    </div>
  `
})
export class LoginComponent {
  auth = inject(AuthService);
  router = inject(Router);

  username = '';
  password = '';
  error = signal('');
  isLoading = signal(false);

  async onSubmit() {
    if (!this.username || !this.password) {
      this.error.set('Please fill in all fields');
      return;
    }

    this.isLoading.set(true);
    this.error.set('');

    const success = await this.auth.login(this.username, this.password);
    
    if (success) {
      this.router.navigate(['/dashboard']);
    } else {
      this.error.set('Invalid username or password');
    }
    
    this.isLoading.set(false);
  }
}
