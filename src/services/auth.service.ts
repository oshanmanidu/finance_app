
import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  // Use 127.0.0.1 matching store service
  private readonly API_URL = 'http://127.0.0.1:3000/api';
  private readonly IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 Minutes
  
  private idleTimer: any;
  private eventCleanupFns: (() => void)[] = [];

  readonly isLoggedIn = signal<boolean>(!!localStorage.getItem('user_session'));
  readonly currentUser = signal<string>(localStorage.getItem('user_session') || '');

  constructor() {
    // If we have an existing session on load, start monitoring
    if (this.isLoggedIn()) {
      this.startIdleMonitoring();
    }
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      const res: any = await firstValueFrom(this.http.post(`${this.API_URL}/login`, { username, password }));
      
      if (res && res.success) {
        localStorage.setItem('user_session', res.username);
        this.currentUser.set(res.username);
        this.isLoggedIn.set(true);
        this.startIdleMonitoring(); // Start timer on login
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed', error);
      return false;
    }
  }

  logout() {
    localStorage.removeItem('user_session');
    this.currentUser.set('');
    this.isLoggedIn.set(false);
    this.stopIdleMonitoring(); // Stop timer on logout
    this.router.navigate(['/login']);
  }

  // --- Idle / Auto-Logout Logic ---

  private startIdleMonitoring() {
    this.stopIdleMonitoring(); // Clear any existing

    const events = ['mousemove', 'mousedown', 'keypress', 'touchmove', 'scroll', 'click'];
    
    // Function to reset the timer
    const resetTimer = () => {
      clearTimeout(this.idleTimer);
      this.idleTimer = setTimeout(() => {
        console.warn('User inactive for 15 minutes. Auto-logging out.');
        this.logout();
      }, this.IDLE_TIMEOUT_MS);
    };

    // Initial start
    resetTimer();

    // Attach listeners
    events.forEach(evt => {
      const handler = () => resetTimer();
      window.addEventListener(evt, handler, { passive: true });
      this.eventCleanupFns.push(() => window.removeEventListener(evt, handler));
    });
  }

  private stopIdleMonitoring() {
    clearTimeout(this.idleTimer);
    this.eventCleanupFns.forEach(fn => fn());
    this.eventCleanupFns = [];
  }

  ngOnDestroy() {
    this.stopIdleMonitoring();
  }
}
