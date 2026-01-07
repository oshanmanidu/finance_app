import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StoreService } from './services/store.service';
import { AuthService } from './services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  template: `
    @if (!auth.isLoggedIn()) {
       <router-outlet></router-outlet>
    } @else {
      <div class="flex h-screen overflow-hidden relative transition-colors duration-300">
      
        <!-- Global Offline Banner -->
        @if (!store.isOnline()) {
           <div class="absolute top-0 left-0 right-0 bg-red-600 text-white text-xs font-bold text-center py-1 z-50 shadow-md animate-pulse">
              <i class="fa-solid fa-triangle-exclamation mr-1"></i> NO INTERNET CONNECTION. Changes saved offline.
           </div>
        }

        <!-- Sidebar Desktop -->
        <aside class="w-72 bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 hidden md:flex flex-col pt-4 transition-colors duration-300 relative">
          <!-- Logo Area -->
          <div class="px-6 pb-6 flex items-center space-x-3 border-b border-gray-100 dark:border-neutral-800">
            <div class="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
               <i class="fa-solid fa-chart-line text-xl"></i>
            </div>
            <div>
               <h1 class="text-lg font-bold tracking-tight text-gray-900 dark:text-white leading-none">Finance</h1>
               <span class="text-sm text-gray-500 dark:text-neutral-500 font-medium">Manager</span>
            </div>
          </div>
          
          <nav class="flex-1 px-4 space-y-2 mt-6">
            @for (item of navItems; track item.label) {
              <a [routerLink]="item.path" routerLinkActive="bg-brand-600 text-white shadow-md" 
                 [class.text-gray-600]="!rla.isActive" [class.dark:text-neutral-400]="!rla.isActive"
                 [class.hover:bg-gray-100]="!rla.isActive" [class.dark:hover:bg-neutral-800]="!rla.isActive"
                 class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors group" #rla="routerLinkActive">
                <i [class]="item.icon + ' w-6 text-center transition-transform group-hover:scale-110'"></i>
                <span class="font-medium">{{ item.label }}</span>
              </a>
            }
          </nav>

          <div class="p-4 space-y-2 mb-2">
             <!-- Contact Link -->
             <a routerLink="/contact" routerLinkActive="text-brand-600 dark:text-brand-400" 
                class="flex items-center space-x-3 px-4 py-2 text-sm text-gray-500 dark:text-neutral-500 hover:text-brand-600 dark:hover:text-brand-400 transition">
                <i class="fa-solid fa-headset w-6 text-center"></i>
                <span>Contact Provider</span>
             </a>

             <div class="border-t border-gray-200 dark:border-neutral-800 pt-4 space-y-3">
               <button (click)="store.toggleTheme()" class="w-full flex items-center justify-between px-4 py-2 rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700 transition">
                  <span class="text-sm font-bold">Theme</span>
                  <i [class]="store.theme() === 'dark' ? 'fa-solid fa-moon text-brand-400' : 'fa-solid fa-sun text-orange-500'"></i>
               </button>

               <div class="flex items-center justify-between px-2">
                  <div class="flex items-center space-x-2">
                     <div class="h-8 w-8 rounded-full bg-brand-600 flex items-center justify-center font-bold text-white text-xs">A</div>
                     <div class="text-xs">
                        <p class="font-semibold text-gray-900 dark:text-white">{{ auth.currentUser() }}</p>
                     </div>
                  </div>
                  <button (click)="auth.logout()" class="text-gray-400 hover:text-red-500 transition" title="Logout">
                     <i class="fa-solid fa-right-from-bracket"></i>
                  </button>
               </div>
             </div>
          </div>
        </aside>

        <!-- Main Content -->
        <div class="flex-1 flex flex-col h-full overflow-hidden relative bg-gray-50 dark:bg-neutral-950 transition-colors duration-300">
          <!-- Mobile Header -->
          <header class="md:hidden bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 p-4 flex justify-between items-center z-20 mt-6 md:mt-0 shadow-sm">
             <div class="flex items-center space-x-2">
               <div class="w-8 h-8 bg-brand-600 rounded flex items-center justify-center text-white">
                  <i class="fa-solid fa-chart-line"></i>
               </div>
               <span class="font-bold text-lg text-gray-900 dark:text-white">Finance Manager</span>
             </div>
             <div class="flex items-center space-x-4">
               <button (click)="store.toggleTheme()" class="text-gray-500 dark:text-neutral-400 focus:outline-none">
                  <i [class]="store.theme() === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun'"></i>
               </button>
               <button (click)="mobileMenuOpen.set(!mobileMenuOpen())" class="text-gray-700 dark:text-neutral-300 focus:outline-none">
                 <i class="fa-solid fa-bars text-2xl"></i>
               </button>
             </div>
          </header>

          <!-- Mobile Menu Overlay -->
          @if (mobileMenuOpen()) {
            <div class="absolute inset-0 bg-white/95 dark:bg-neutral-900/95 z-30 flex flex-col p-6 space-y-4 md:hidden">
              <div class="flex justify-between items-center mb-4">
                <span class="font-bold text-xl text-gray-900 dark:text-white">Menu</span>
                <button (click)="mobileMenuOpen.set(false)" class="text-gray-900 dark:text-white">
                  <i class="fa-solid fa-xmark text-3xl"></i>
                </button>
              </div>
              @for (item of navItems; track item.label) {
                <a [routerLink]="item.path" (click)="mobileMenuOpen.set(false)" 
                   class="flex items-center space-x-4 text-xl py-3 border-b border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-neutral-300">
                  <i [class]="item.icon"></i>
                  <span>{{ item.label }}</span>
                </a>
              }
              <a routerLink="/contact" (click)="mobileMenuOpen.set(false)" 
                 class="flex items-center space-x-4 text-xl py-3 border-b border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-neutral-300">
                 <i class="fa-solid fa-headset"></i>
                 <span>Contact Provider</span>
              </a>
              <button (click)="auth.logout()" class="flex items-center space-x-4 text-xl py-3 text-red-500 mt-auto">
                 <i class="fa-solid fa-right-from-bracket"></i>
                 <span>Logout</span>
              </button>
            </div>
          }

          <main class="flex-1 overflow-y-auto p-4 md:p-8 relative flex flex-col">
             <div class="flex-1">
                <router-outlet></router-outlet>
             </div>
             
             <!-- Footer Watermark -->
             <footer class="mt-10 py-6 border-t border-gray-200 dark:border-neutral-900 flex flex-col items-center justify-center opacity-60 hover:opacity-100 transition-opacity">
                 <div class="flex items-center space-x-2 mb-1">
                    <span class="text-xs font-semibold text-gray-500 dark:text-neutral-600 uppercase tracking-widest">Powered by</span>
                    <div class="flex items-center space-x-1">
                       <i class="fa-solid fa-cube text-brand-600 dark:text-brand-500 text-sm"></i>
                       <span class="text-sm font-bold text-gray-700 dark:text-neutral-400">Mezota</span>
                    </div>
                 </div>
                 <p class="text-[10px] text-gray-400 dark:text-neutral-700">&copy; {{ year }} Finance Manager Suite. All rights reserved.</p>
             </footer>
          </main>
        </div>
      </div>
    }
  `
})
export class AppComponent {
  store = inject(StoreService);
  auth = inject(AuthService);
  mobileMenuOpen = signal(false);
  year = new Date().getFullYear();

  navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'fa-solid fa-chart-pie' },
    { label: 'Transactions', path: '/transactions', icon: 'fa-solid fa-money-bill-transfer' },
    { label: 'Businesses', path: '/businesses', icon: 'fa-solid fa-briefcase' },
    { label: 'Customers', path: '/customers', icon: 'fa-solid fa-users' },
    { label: 'Assets & Gear', path: '/assets', icon: 'fa-solid fa-truck-pickup' },
    { label: 'Smart Advisor', path: '/advisor', icon: 'fa-solid fa-wand-magic-sparkles' }
  ];
}
