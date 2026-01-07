import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService } from '../services/store.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-5xl mx-auto space-y-8 pb-10">
       <div class="flex justify-between items-center">
          <div>
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white">Customer Management</h2>
            <p class="text-gray-500 dark:text-neutral-400 mt-1">Keep a directory of your clients for invoicing and records.</p>
          </div>
          <button (click)="showAddForm.set(!showAddForm())" class="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl font-bold flex items-center shadow-lg">
             <i class="fa-solid fa-plus mr-2"></i> Add Customer
          </button>
       </div>

       @if (showAddForm()) {
          <div class="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-800 animate-in fade-in slide-in-from-top-4 space-y-4">
             <h3 class="text-lg font-bold text-gray-900 dark:text-white">New Customer Profile</h3>
             <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" [(ngModel)]="newName" placeholder="Full Name" class="w-full bg-gray-100 dark:bg-neutral-800 border-none rounded-lg p-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500">
                <input type="email" [(ngModel)]="newEmail" placeholder="Email Address" class="w-full bg-gray-100 dark:bg-neutral-800 border-none rounded-lg p-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500">
                <input type="text" [(ngModel)]="newPhone" placeholder="Phone Number" class="w-full bg-gray-100 dark:bg-neutral-800 border-none rounded-lg p-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500">
                <textarea [(ngModel)]="newAddress" placeholder="Address" rows="2" class="md:col-span-2 w-full bg-gray-100 dark:bg-neutral-800 border-none rounded-lg p-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"></textarea>
             </div>
             <div class="flex justify-end">
                <button (click)="addCustomer()" [disabled]="!newName" class="bg-gray-900 dark:bg-neutral-700 hover:bg-black dark:hover:bg-neutral-600 text-white font-bold py-3 px-8 rounded-lg disabled:opacity-50">Save Customer</button>
             </div>
          </div>
       }

       <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (c of store.allCustomers(); track c.id) {
             <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-md border border-gray-200 dark:border-neutral-800 p-6 flex flex-col h-full">
                <div class="flex justify-between items-start mb-4">
                   <div class="flex items-center space-x-4">
                      <div class="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/20 text-brand-600 dark:text-brand-500 flex items-center justify-center text-xl">
                         <i class="fa-solid fa-user"></i>
                      </div>
                      <div>
                         <h3 class="text-lg font-bold text-gray-900 dark:text-white leading-tight">{{ c.name }}</h3>
                      </div>
                   </div>
                   <button (click)="confirmDelete(c.id, c.name)" class="text-gray-400 hover:text-red-500 transition p-2 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                      <i class="fa-solid fa-trash"></i>
                   </button>
                </div>

                <div class="text-xs text-gray-500 dark:text-neutral-400 space-y-2 border-t border-gray-100 dark:border-neutral-800 pt-4 mt-auto">
                   @if(c.email) { <p><i class="fa-solid fa-envelope w-4 text-center mr-1 text-gray-400"></i> {{c.email}}</p> }
                   @if(c.phone) { <p><i class="fa-solid fa-phone w-4 text-center mr-1 text-gray-400"></i> {{c.phone}}</p> }
                   @if(c.address) { <p class="leading-relaxed"><i class="fa-solid fa-location-dot w-4 text-center mr-1 text-gray-400"></i> {{c.address}}</p> }
                </div>
             </div>
          }
       </div>

    </div>
  `
})
export class CustomersComponent {
  store = inject(StoreService);
  
  showAddForm = signal(false);
  newName = '';
  newEmail = '';
  newPhone = '';
  newAddress = '';

  addCustomer() {
    if (this.newName) {
       this.store.addCustomer({
         name: this.newName, 
         email: this.newEmail,
         phone: this.newPhone,
         address: this.newAddress,
       });
       this.resetForm();
       this.showAddForm.set(false);
    }
  }

  resetForm() {
    this.newName = '';
    this.newEmail = '';
    this.newPhone = '';
    this.newAddress = '';
  }

  confirmDelete(id: string, name: string) {
    if (confirm(`Are you sure you want to delete ${name}? This will not delete their past transactions.`)) {
      this.store.deleteCustomer(id);
    }
  }
}
