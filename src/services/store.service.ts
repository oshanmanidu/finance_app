import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type TransactionType = 'income' | 'expense';
export type AssetType = string; 
export type AssetAction = 'purchase' | 'sale' | 'maintenance' | 'usage';
export type ColorTheme = 'Amber' | 'Red' | 'Orange' | 'Green' | 'Emerald' | 'Teal' | 'Cyan' | 'Sky' | 'Blue' | 'Indigo' | 'Violet' | 'Rose';

export interface Business {
    id: string;
    name: string;
    type: string;
    address?: string;
    contact?: string;
    slogan?: string;
    synced?: boolean;
    monthlyProfit?: number;
    yearlyProfit?: number;
}

export interface Customer {
    id:string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    synced?: boolean;
}

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  isBusiness: boolean; // true for business, false for home
  businessId?: string; // Link to specific business
  customerId?: string; // Link to a customer for invoicing
  isLoan?: boolean;    // true if it is a credit/loan transaction
  assetId?: string;    // Link to an asset
  assetAction?: AssetAction; // Specific action context
  attachment?: string; // Base64 Data URI for receipts/docs
  synced?: boolean;    // Sync status
  parentId?: string;   // Link expenses to a parent income transaction
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  status: 'active' | 'maintenance' | 'retired';
  usageMetric: number; // Odometer for SUV, Flight Hours for Drone
  nextServiceAt: number;
  synced?: boolean;
}

const THEME_PALETTES: Record<string, Record<number, string>> = {
  Amber: { 50: '255 251 235', 100: '254 243 199', 200: '253 230 138', 300: '252 211 77', 400: '251 191 36', 500: '245 158 11', 600: '217 119 6', 700: '180 83 9', 800: '146 64 14', 900: '120 53 15' },
  Red: { 50: '254 242 242', 100: '254 226 226', 200: '254 202 202', 300: '252 165 165', 400: '248 113 113', 500: '239 68 68', 600: '220 38 38', 700: '185 28 28', 800: '153 27 27', 900: '127 29 29' },
  Orange: { 50: '255 247 237', 100: '255 237 213', 200: '254 215 170', 300: '253 186 116', 400: '251 146 60', 500: '249 115 22', 600: '234 88 12', 700: '194 65 12', 800: '154 52 18', 900: '124 45 18' },
  Green: { 50: '240 253 244', 100: '220 252 231', 200: '187 247 208', 300: '134 239 172', 400: '74 222 128', 500: '34 197 94', 600: '22 163 74', 700: '21 128 61', 800: '22 101 52', 900: '20 83 45' },
  Emerald: { 50: '236 253 245', 100: '209 250 229', 200: '167 243 208', 300: '110 231 183', 400: '52 211 153', 500: '16 185 129', 600: '5 150 105', 700: '4 120 87', 800: '6 95 70', 900: '6 78 59' },
  Teal: { 50: '240 253 250', 100: '204 251 241', 200: '153 246 228', 300: '94 234 212', 400: '45 212 191', 500: '20 184 166', 600: '13 148 136', 700: '15 118 110', 800: '17 94 89', 900: '19 78 74' },
  Cyan: { 50: '236 254 255', 100: '207 250 254', 200: '165 243 252', 300: '103 232 249', 400: '34 211 238', 500: '6 182 212', 600: '8 145 178', 700: '14 116 144', 800: '21 94 117', 900: '22 78 99' },
  Sky: { 50: '240 249 255', 100: '224 242 254', 200: '186 230 253', 300: '125 211 252', 400: '56 189 248', 500: '14 165 233', 600: '2 132 199', 700: '3 105 161', 800: '7 89 133', 900: '12 74 110' },
  Blue: { 50: '239 246 255', 100: '219 234 254', 200: '191 219 254', 300: '147 197 253', 400: '96 165 250', 500: '59 130 246', 600: '37 99 235', 700: '29 78 216', 800: '30 64 175', 900: '30 58 138' },
  Indigo: { 50: '238 242 255', 100: '224 231 255', 200: '199 210 254', 300: '165 180 252', 400: '129 140 248', 500: '99 102 241', 600: '79 70 229', 700: '67 56 202', 800: '55 48 163', 900: '49 46 129' },
  Violet: { 50: '245 243 255', 100: '237 233 254', 200: '221 214 254', 300: '196 181 253', 400: '167 139 250', 500: '139 92 246', 600: '124 58 237', 700: '109 40 217', 800: '91 33 182', 900: '76 29 149' },
  Rose: { 50: '255 241 242', 100: '255 228 230', 200: '254 205 211', 300: '253 164 175', 400: '251 113 133', 500: '244 63 94', 600: '225 29 72', 700: '190 18 60', 800: '159 18 57', 900: '136 19 55' },
};

@Injectable({ providedIn: 'root' })
export class StoreService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://127.0.0.1:8000/api'; 

  // --- State Signals ---
  readonly isOnline = signal(navigator.onLine);
  readonly isLoading = signal(false);
  readonly theme = signal<'light' | 'dark'>('dark');
  readonly colorTheme = signal<ColorTheme>('Amber');

  // Filters
  readonly filterStartDate = signal<string>(this.getFirstDayOfMonth());
  readonly filterEndDate = signal<string>(this.getLastDayOfMonth());

  // Data
  readonly transactions = signal<Transaction[]>([]);
  readonly pagination = signal({ page: 1, totalPages: 1, totalDocs: 0, limit: 25 });
  readonly summary = signal({ totalIncome: 0, totalExpense: 0, netProfit: 0, businessIncome: 0, businessExpenses: 0, businessNet: 0, personalIncome: 0, personalExpenses: 0, personalNet: 0 });
  
  private assets = signal<Asset[]>(this.load('assets', []));
  private businesses = signal<Business[]>(this.load('businesses', []));
  private customers = signal<Customer[]>(this.load('customers', []));
  private offlineQueue = signal<any[]>(this.load('offline_queue', []));

  // --- Computed Signals ---
  readonly allAssets = computed(() => this.assets());
  readonly allBusinesses = computed(() => this.businesses());
  readonly allCustomers = computed(() => this.customers());

  readonly knownCategories = computed(() => {
    const cats = new Set(this.transactions().map(t => t.category));
    this.assets().forEach(a => cats.add(a.name)); 
    return Array.from(cats).sort();
  });

  constructor() {
    this.initializeTheme();
    this.initializeData();
    
    effect(() => localStorage.setItem('offline_queue', JSON.stringify(this.offlineQueue())));
    effect(() => localStorage.setItem('assets', JSON.stringify(this.assets())));
    effect(() => localStorage.setItem('businesses', JSON.stringify(this.businesses())));
    effect(() => localStorage.setItem('customers', JSON.stringify(this.customers())));

    window.addEventListener('online', () => { this.isOnline.set(true); this.syncData(); });
    window.addEventListener('offline', () => this.isOnline.set(false));
  }
  
  private initializeTheme() {
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    this.theme.set(storedTheme || (window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
    
    effect(() => {
      localStorage.setItem('theme', this.theme());
      document.documentElement.classList.toggle('dark', this.theme() === 'dark');
    });

    const storedColor = localStorage.getItem('colorTheme') as ColorTheme;
    if (storedColor && THEME_PALETTES[storedColor]) this.setColorTheme(storedColor);
  }

  private async initializeData() {
    if (this.isOnline()) {
      await this.syncData(); // Sync any offline changes first
      await this.fetchStaticData(); // Fetch assets, businesses etc.
      await this.loadTransactions(); // Load first page of transactions
    }
  }
  
  // --- Data Loading & Sync ---

  async loadTransactions(page: number = 1, filters: { q?: string; type?: string, isLoan?: boolean } = {}) {
    if (!this.isOnline()) {
      console.warn("Offline: Cannot load new data.");
      return;
    }
    this.isLoading.set(true);
    try {
      let params = new HttpParams()
        .set('page', page.toString())
        .set('limit', this.pagination().limit.toString())
        .set('startDate', this.filterStartDate())
        .set('endDate', this.filterEndDate());

      if (filters.q) params = params.set('q', filters.q);
      if (filters.type) params = params.set('type', filters.type);
      if (filters.isLoan) params = params.set('isLoan', 'true');

      const res: any = await firstValueFrom(this.http.get(`${this.API_URL}/transactions`, { params }));
      this.transactions.set(res.pagination.docs);
      this.pagination.set(res.pagination);
      this.summary.set(res.summary);
    } catch (err) {
      this.handleApiError(err);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async fetchStaticData() {
    if (!this.isOnline()) return;
    try {
      const data: any = await firstValueFrom(this.http.get(`${this.API_URL}/data`));
      this.assets.set(data.assets || []);
      this.businesses.set(data.businesses || []);
      this.customers.set(data.customers || []);
    } catch (err) { this.handleApiError(err); }
  }

  private async syncData() {
    if (!this.isOnline()) return;

    const queue = this.offlineQueue();
    if (queue.length === 0) return;

    console.log(`Syncing ${queue.length} offline items...`);
    try {
      const payload = this.groupQueueByType(queue);
      await firstValueFrom(this.http.post(`${this.API_URL}/sync`, payload));
      this.offlineQueue.set([]); // Clear queue on success
      localStorage.removeItem('offline_queue');
      console.log('Sync successful.');
    } catch (err) {
      this.handleApiError(err);
    }
  }
  
  // --- Actions ---

  addTransaction(t: Omit<Transaction, 'id' | 'synced'>, newAssetDetails?: { name: string, type: AssetType }): Transaction {
    const newT: Transaction = { ...t, id: crypto.randomUUID(), synced: !this.isOnline() };
    
    // Asset logic remains client-side for immediate feedback
    if (t.assetAction === 'purchase' && newAssetDetails) {
       const assetId = crypto.randomUUID();
       newT.assetId = assetId; 
       const newAsset: Asset = { id: assetId, name: newAssetDetails.name, type: newAssetDetails.type, status: 'active', usageMetric: 0, nextServiceAt: 100, synced: false };
       this.assets.update(prev => [...prev, newAsset]);
       this.addToOfflineQueue({ type: 'asset', data: newAsset });
    }
    if (t.assetAction === 'sale' && t.assetId) {
       this.assets.update(prev => prev.map(a => a.id === t.assetId ? { ...a, status: 'retired', synced: false } : a));
       this.addToOfflineQueue({ type: 'asset', data: this.assets().find(a=>a.id === t.assetId) });
    }

    this.addToOfflineQueue({ type: 'transaction', data: newT });

    // Add to current view for immediate feedback
    this.transactions.update(prev => [newT, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    if(this.isOnline()) this.syncData();
    return newT;
  }
  
  deleteTransaction(id: string) {
    // Note: Deleting is an online-only action in this simplified model.
    // A robust offline solution would queue deletions.
    if (!this.isOnline()) { alert('Cannot delete items while offline.'); return; }
    
    this.transactions.update(prev => prev.filter(t => t.id !== id));
    // Here you would make an API call to delete from the DB
    // e.g., firstValueFrom(this.http.delete(`${this.API_URL}/transactions/${id}`));
  }

  addBusiness(details: Omit<Business, 'id' | 'synced'>) {
    const newBiz: Business = { ...details, id: crypto.randomUUID(), synced: false };
    this.businesses.update(prev => [...prev, newBiz]);
    this.addToOfflineQueue({ type: 'business', data: newBiz });
    if(this.isOnline()) this.syncData().then(() => this.fetchStaticData());
  }

  addCustomer(details: Omit<Customer, 'id' | 'synced'>) {
    const newCustomer: Customer = { ...details, id: crypto.randomUUID(), synced: false };
    this.customers.update(prev => [...prev, newCustomer]);
    this.addToOfflineQueue({ type: 'customer', data: newCustomer });
    if(this.isOnline()) this.syncData().then(() => this.fetchStaticData());
  }
  
  setPresetDateFilter(type: 'today' | 'week' | 'month' | 'last_month') {
      const now = new Date();
      let startStr = '', endStr = '';
      const formatDate = (d: Date) => d.toISOString().split('T')[0];
      switch(type) {
          case 'today':
              startStr = endStr = formatDate(now); break;
          case 'week':
              const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
              startStr = formatDate(startOfWeek); endStr = formatDate(new Date()); break;
          case 'month':
              startStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
              endStr = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]; break;
          case 'last_month':
              const prevM = new Date(now.getFullYear(), now.getMonth() - 1, 1);
              startStr = prevM.toISOString().split('T')[0];
              endStr = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]; break;
      }
      this.filterStartDate.set(startStr); this.filterEndDate.set(endStr);
  }

  // --- Helpers ---
  toggleTheme() { this.theme.update(t => t === 'dark' ? 'light' : 'dark'); }

  setColorTheme(name: ColorTheme) {
    if (!THEME_PALETTES[name]) return;
    this.colorTheme.set(name);
    localStorage.setItem('colorTheme', name);
    const palette = THEME_PALETTES[name];
    Object.keys(palette).forEach(key => {
       document.documentElement.style.setProperty(`--color-brand-${key}`, palette[Number(key)]);
    });
  }
  
  private addToOfflineQueue(item: { type: string, data: any }) {
    this.offlineQueue.update(prev => [...prev, item]);
  }
  
  private groupQueueByType(queue: any[]) {
    return queue.reduce((acc, item) => {
        const key = `${item.type}s`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item.data);
        return acc;
    }, { transactions: [], assets: [], businesses: [], customers: [] });
  }

  private handleApiError(err: any) {
    if (err instanceof HttpErrorResponse && err.status === 0) {
       console.warn(`Backend unreachable. Operating in Offline Mode.`);
       this.isOnline.set(false);
    } else {
      console.error(`API Error:`, err);
    }
  }

  private load<T>(key: string, defaultVal: T): T {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultVal;
  }
  private getFirstDayOfMonth(): string {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  }
  private getLastDayOfMonth(): string {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
  }

  // --- Stubs for methods that would need modification or are online-only ---
  deleteBusiness(id: string) { if (!this.isOnline()) { alert('Cannot delete items while offline.'); return; } this.businesses.update(p => p.filter(b => b.id !== id)); /* API call needed */ }
  deleteCustomer(id: string) { if (!this.isOnline()) { alert('Cannot delete items while offline.'); return; } this.customers.update(p => p.filter(c => c.id !== id)); /* API call needed */ }
  updateAssetUsage(id: string, usage: number) { this.assets.update(prev => prev.map(a => a.id === id ? { ...a, usageMetric: usage, synced: false } : a)); this.addToOfflineQueue({ type: 'asset', data: this.assets().find(a=>a.id === id) }); if(this.isOnline()) this.syncData(); }
  getAssetHistory(assetId: string) { return this.transactions().filter(t => t.assetId === assetId); }
}
