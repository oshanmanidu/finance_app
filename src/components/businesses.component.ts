import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService, Business } from '../services/store.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-businesses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-5xl mx-auto space-y-8 pb-10">
       <div class="flex justify-between items-center">
          <div>
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white">Business Management</h2>
            <p class="text-gray-500 dark:text-neutral-400 mt-1">Manage multiple business entities and track their specific performance.</p>
          </div>
          <button (click)="showAddForm.set(!showAddForm())" class="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl font-bold flex items-center shadow-lg">
             <i class="fa-solid fa-plus mr-2"></i> Add Business
          </button>
       </div>

       @if (showAddForm()) {
          <div class="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-800 animate-in fade-in slide-in-from-top-4 space-y-4">
             <h3 class="text-lg font-bold text-gray-900 dark:text-white">New Business Profile</h3>
             <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" [(ngModel)]="newName" placeholder="Business Name" class="w-full bg-gray-100 dark:bg-neutral-800 border-none rounded-lg p-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500">
                <input type="text" [(ngModel)]="newType" placeholder="Industry/Type" class="w-full bg-gray-100 dark:bg-neutral-800 border-none rounded-lg p-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500">
                <input type="text" [(ngModel)]="newContact" placeholder="Contact (Phone/Email)" class="w-full bg-gray-100 dark:bg-neutral-800 border-none rounded-lg p-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500">
                <input type="text" [(ngModel)]="newAddress" placeholder="Address" class="w-full bg-gray-100 dark:bg-neutral-800 border-none rounded-lg p-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500">
             </div>
             <input type="text" [(ngModel)]="newSlogan" placeholder="Slogan for Invoices" class="w-full bg-gray-100 dark:bg-neutral-800 border-none rounded-lg p-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500">
             <div class="flex justify-end">
                <button (click)="addBusiness()" [disabled]="!newName" class="bg-gray-900 dark:bg-neutral-700 hover:bg-black dark:hover:bg-neutral-600 text-white font-bold py-3 px-8 rounded-lg disabled:opacity-50">Create</button>
             </div>
          </div>
       }

       <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          @for (biz of store.allBusinesses(); track biz.id) {
             <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-md border border-gray-200 dark:border-neutral-800 p-6 flex flex-col h-full">
                <div class="flex justify-between items-start mb-4">
                   <div class="flex items-center space-x-3">
                      <div class="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/20 text-brand-600 dark:text-brand-500 flex items-center justify-center text-xl">
                         <i class="fa-solid fa-briefcase"></i>
                      </div>
                      <div>
                         <h3 class="text-xl font-bold text-gray-900 dark:text-white leading-tight">{{ biz.name }}</h3>
                         <span class="text-xs uppercase font-bold text-gray-400 dark:text-neutral-500 tracking-wider">{{ biz.type }}</span>
                      </div>
                   </div>
                   <button (click)="openDeleteModal(biz.id)" class="text-gray-400 hover:text-red-500 transition p-2 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                      <i class="fa-solid fa-trash"></i>
                   </button>
                </div>

                <div class="text-xs text-gray-500 dark:text-neutral-400 space-y-2 border-t border-gray-100 dark:border-neutral-800 pt-4 mb-4">
                   @if(biz.slogan) { <p class="italic">"{{biz.slogan}}"</p> }
                   @if(biz.address) { <p><i class="fa-solid fa-location-dot w-4 text-center mr-1"></i> {{biz.address}}</p> }
                   @if(biz.contact) { <p><i class="fa-solid fa-phone w-4 text-center mr-1"></i> {{biz.contact}}</p> }
                </div>

                <div class="grid grid-cols-1 gap-4 flex-1 mt-auto">
                   <div class="bg-gray-50 dark:bg-neutral-800/40 rounded-xl p-4 border border-gray-100 dark:border-neutral-700/50">
                      <p class="text-[10px] font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest mb-1">Monthly Profit</p>
                      <span class="text-2xl font-bold" [class]="getProfitColor(biz.monthlyProfit || 0)">
                        LKR {{ (biz.monthlyProfit || 0) | number }}
                      </span>
                   </div>
                   <div class="bg-gray-50 dark:bg-neutral-800/40 rounded-xl p-4 border border-gray-100 dark:border-neutral-700/50">
                      <p class="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-1">Yearly Profit</p>
                      <span class="text-2xl font-bold" [class]="getProfitColor(biz.yearlyProfit || 0)">
                        LKR {{ (biz.yearlyProfit || 0) | number }}
                      </span>
                   </div>
                </div>
             </div>
          }
       </div>

       <!-- Secure Delete Modal -->
       @if (deleteTargetId()) {
          <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in">
             <div class="bg-white dark:bg-neutral-900 p-8 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-neutral-800 text-center space-y-6">
                <div class="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto text-red-600 dark:text-red-500 text-3xl">
                   <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <div>
                   <h3 class="text-xl font-bold text-gray-900 dark:text-white">Delete Business?</h3>
                   <p class="text-gray-500 dark:text-neutral-400 mt-2 text-sm">
                      Warning: If you delete this business, <strong>all associated financial records</strong> will also be permanently deleted. This action cannot be undone.
                   </p>
                </div>
                <div class="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg border border-gray-200 dark:border-neutral-700">
                   <label class="block text-xs font-bold text-gray-500 dark:text-neutral-400 mb-2 uppercase">Type "8656252" to confirm</label>
                   <input type="text" [(ngModel)]="deleteCode" placeholder="Code" class="w-full text-center text-xl font-mono tracking-widest bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-600 rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none dark:text-white">
                </div>
                <div class="flex space-x-3">
                   <button (click)="closeDeleteModal()" class="flex-1 px-4 py-3 bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-white rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-neutral-700 transition">Cancel</button>
                   <button (click)="confirmDelete()" [disabled]="deleteCode !== '8656252'" class="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed">Delete Forever</button>
                </div>
             </div>
          </div>
       }
    </div>
  `
})
export class BusinessesComponent {
  store = inject(StoreService);
  
  showAddForm = signal(false);
  newName = '';
  newType = '';
  newAddress = '';
  newContact = '';
  newSlogan = '';

  deleteTargetId = signal<string | null>(null);
  deleteCode = '';

  addBusiness() {
    if (this.newName) {
       this.store.addBusiness({
         name: this.newName, 
         type: this.newType || 'General',
         address: this.newAddress,
         contact: this.newContact,
         slogan: this.newSlogan,
       });
       this.newName = '';
       this.newType = '';
       this.newAddress = '';
       this.newContact = '';
       this.newSlogan = '';
       this.showAddForm.set(false);
    }
  }

  getProfitColor(amount: number): string {
    if (amount > 0) return 'text-green-600 dark:text-green-400';
    if (amount < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-900 dark:text-white';
  }

  openDeleteModal(id: string) {
     this.deleteTargetId.set(id);
     this.deleteCode = '';
  }

  closeDeleteModal() {
     this.deleteTargetId.set(null);
     this.deleteCode = '';
  }

  confirmDelete() {
     const id = this.deleteTargetId();
     if (id && this.deleteCode === '8656252') {
        this.store.deleteBusiness(id);
        this.closeDeleteModal();
     }
  }
}
