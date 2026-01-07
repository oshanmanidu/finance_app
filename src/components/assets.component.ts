
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService } from '../services/store.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-assets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full mx-auto space-y-6 pb-10">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
           <h2 class="text-3xl font-bold text-gray-900 dark:text-white">Asset Tracking</h2>
           <p class="text-sm text-gray-500 dark:text-neutral-500 mt-1">Track usage, service history, and value.</p>
        </div>

        <!-- Search Bar -->
        <div class="relative w-full md:w-64">
           <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
           <input type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" 
                  placeholder="Search assets..." 
                  class="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none shadow-sm">
        </div>
      </div>

      <!-- Grid Layout: Increased columns for smaller cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        @for (asset of filteredAssets(); track asset.id) {
          <div [class]="'rounded-xl overflow-hidden shadow-md border flex flex-col h-full transition-colors ' + 
              (asset.status === 'retired' 
               ? 'bg-gray-100 border-gray-200 dark:bg-neutral-800/50 dark:border-neutral-800 grayscale opacity-80' 
               : 'bg-white border-gray-200 dark:bg-neutral-900 dark:border-neutral-800')">
            
            <!-- Header with Icon (Reduced Height) -->
            <div class="h-24 bg-gray-50 dark:bg-neutral-800/50 relative overflow-hidden flex items-center justify-center shrink-0 group">
              <i [class]="'text-8xl opacity-5 dark:opacity-10 absolute -bottom-4 -right-4 text-gray-400 dark:text-white transition-transform group-hover:scale-110 ' + getIcon(asset.type)"></i>
              <div class="text-center z-10 relative w-full px-4">
                <i [class]="'text-3xl mb-1 text-brand-500 dark:text-brand-400 ' + getIcon(asset.type)"></i>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white truncate">{{ asset.name }}</h3>
                <div class="flex items-center justify-center space-x-2">
                   <p class="text-[10px] text-gray-500 dark:text-neutral-500 uppercase tracking-wider">{{ asset.type }}</p>
                   @if (asset.status === 'retired') {
                      <span class="inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-gray-300 text-gray-600 dark:bg-neutral-700 dark:text-neutral-300">Sold</span>
                   } @else {
                      <span class="inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400">Active</span>
                   }
                </div>
              </div>
            </div>

            <!-- Stats (Reduced Padding) -->
            <div class="p-4 space-y-4 flex-1 flex flex-col text-sm">
               <div class="flex justify-between items-end border-b border-gray-100 dark:border-neutral-800 pb-3">
                 <div>
                    <label class="text-[10px] text-gray-500 dark:text-neutral-500 uppercase font-bold">Usage</label>
                    <div class="flex items-baseline space-x-1">
                      <span class="text-xl font-bold text-gray-900 dark:text-white">{{ asset.usageMetric | number }}</span>
                      <span class="text-xs text-gray-400 dark:text-neutral-500">{{ isDrone(asset.type) ? 'hrs' : 'units' }}</span>
                    </div>
                 </div>
                 <div class="text-right">
                    <label class="text-[10px] text-gray-500 dark:text-neutral-500 uppercase font-bold">Next Service</label>
                    <div class="text-sm font-semibold text-brand-600 dark:text-brand-400">{{ asset.nextServiceAt | number }}</div>
                 </div>
               </div>

               <!-- Progress Bar -->
               @if (asset.status === 'active') {
                  <div>
                     <div class="flex justify-between text-[10px] mb-1">
                       <span class="text-gray-500 dark:text-neutral-400">Service Progress</span>
                       <span class="text-gray-500 dark:text-neutral-400">{{ getPercentage(asset) | number:'1.0-0' }}%</span>
                     </div>
                     <div class="w-full bg-gray-200 dark:bg-neutral-800 rounded-full h-1.5">
                       <div class="bg-brand-500 h-1.5 rounded-full" [style.width.%]="getPercentage(asset)"></div>
                     </div>
                  </div>

                  <!-- Update Form -->
                  <div class="bg-gray-50 dark:bg-neutral-900/50 p-2 rounded-lg border border-gray-100 dark:border-none flex gap-1">
                      <input type="number" [value]="asset.usageMetric" #inputVal class="w-full bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded px-2 py-1 text-xs text-gray-900 dark:text-white focus:border-brand-500 outline-none" placeholder="New Val">
                      <button (click)="update(asset.id, inputVal.value)" class="bg-brand-600 hover:bg-brand-500 text-white px-2 py-1 rounded text-xs font-medium transition">
                         Update
                      </button>
                  </div>
               }

               <!-- Service History -->
               <div class="mt-2 pt-2 border-t border-gray-100 dark:border-neutral-800 flex-1">
                  <div class="flex justify-between items-center mb-2">
                     <h4 class="text-[10px] font-bold text-gray-500 dark:text-neutral-500 uppercase">Recent Service</h4>
                  </div>
                  
                  <div class="space-y-1.5">
                     @for (svc of getFilteredServices(asset.id); track svc.id) {
                        <div class="flex justify-between items-center text-xs bg-gray-100 dark:bg-neutral-800/30 p-1.5 rounded">
                           <div class="flex flex-col truncate pr-2">
                              <span class="text-gray-900 dark:text-white font-medium truncate">{{ svc.category }}</span>
                              <span class="text-[10px] text-gray-500 dark:text-neutral-500">{{ svc.date }}</span>
                           </div>
                           <span class="text-red-500 dark:text-red-400 font-mono whitespace-nowrap">- {{ svc.amount | number }}</span>
                        </div>
                     }
                     @if (getFilteredServices(asset.id).length === 0) {
                        <p class="text-[10px] text-gray-400 dark:text-neutral-600 italic">No records found.</p>
                     }
                  </div>
               </div>
            </div>
          </div>
        }
        
        @if (filteredAssets().length === 0) {
           <div class="col-span-full py-12 text-center text-gray-500 dark:text-neutral-500">
             <i class="fa-solid fa-box-open text-4xl mb-3 opacity-30"></i>
             <p>No assets found matching "{{ searchQuery() }}"</p>
           </div>
        }
      </div>
    </div>
  `
})
export class AssetsComponent {
  store = inject(StoreService);
  searchQuery = signal('');

  filteredAssets = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return this.store.allAssets().filter(a => 
       a.name.toLowerCase().includes(q) || 
       a.type.toLowerCase().includes(q)
    );
  });

  getIcon(type: string): string {
    const t = type.toLowerCase();
    if (t.includes('drone')) return 'fa-solid fa-helicopter';
    if (t.includes('vehicle') || t.includes('car') || t.includes('van')) return 'fa-solid fa-car';
    if (t.includes('camera') || t.includes('cam')) return 'fa-solid fa-camera';
    if (t.includes('lens')) return 'fa-solid fa-eye';
    return 'fa-solid fa-box-open';
  }

  isDrone(type: string): boolean {
    return type.toLowerCase().includes('drone');
  }

  getPercentage(asset: any): number {
    const percent = (asset.usageMetric / (asset.nextServiceAt || 1)) * 100;
    return Math.min(Math.max(percent, 0), 100);
  }

  update(id: string, val: string) {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      this.store.updateAssetUsage(id, num);
    }
  }

  getFilteredServices(assetId: string) {
    // Show all history since we removed date filter from Asset Page
    // or we could show last 3 *ever*
    return this.store.getAssetHistory(assetId)
      // Show expenses or maintenance records
      .filter(t => t.type === 'expense' || t.assetAction === 'maintenance')
      .slice(0, 3); 
  }
}
