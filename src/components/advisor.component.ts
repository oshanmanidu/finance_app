import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService } from '../services/store.service';
import { AiService } from '../services/ai.service';

@Component({
  selector: 'app-advisor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-3xl mx-auto py-8">
      <div class="text-center mb-10">
         <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 mb-4">
            <i class="fa-solid fa-wand-magic-sparkles text-3xl"></i>
         </div>
         <h2 class="text-3xl font-bold text-gray-900 dark:text-white">Smart Financial Advisor</h2>
         <p class="text-gray-500 dark:text-neutral-400 mt-2 max-w-lg mx-auto">Get personalized advice based on your current month's income, business expenses, and household spending.</p>
      </div>

      <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-gray-200 dark:border-neutral-800 p-8">
         @if (loading()) {
            <div class="flex flex-col items-center justify-center py-12 space-y-4">
               <i class="fa-solid fa-circle-notch fa-spin text-4xl text-brand-500"></i>
               <p class="text-gray-600 dark:text-neutral-300 animate-pulse">Analyzing your finances...</p>
            </div>
         } @else {
            @if (!advice()) {
               <div class="text-center py-8">
                  <p class="text-gray-600 dark:text-neutral-300 mb-6">Ready to analyze your financial health for this month?</p>
                  <button (click)="generateAdvice()" class="bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white px-8 py-3 rounded-full font-bold shadow-lg transform hover:scale-105 transition-all">
                     Generate Advice
                  </button>
               </div>
            } @else {
               <div class="prose dark:prose-invert prose-neutral max-w-none">
                  <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Advisor Insights</h3>
                  <div [innerHTML]="advice()" class="text-gray-700 dark:text-neutral-300 space-y-2"></div>
               </div>
               <div class="mt-8 flex justify-center">
                  <button (click)="advice.set('')" class="text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white text-sm underline">Refresh Analysis</button>
               </div>
            }
         }
      </div>

      <!-- Context Preview -->
      <div class="mt-8 grid grid-cols-3 gap-4 text-center opacity-70 dark:opacity-50">
         <div class="bg-white dark:bg-neutral-800/50 p-4 rounded border border-gray-200 dark:border-neutral-800 shadow-sm">
            <p class="text-xs uppercase text-gray-500 dark:text-neutral-500">Income</p>
            <!-- FIX: Property 'totalIncome' does not exist on type 'StoreService'. It is on the 'summary' signal. -->
            <p class="text-lg font-bold text-green-600 dark:text-green-500">LKR {{ store.summary().totalIncome | number }}</p>
         </div>
         <div class="bg-white dark:bg-neutral-800/50 p-4 rounded border border-gray-200 dark:border-neutral-800 shadow-sm">
            <p class="text-xs uppercase text-gray-500 dark:text-neutral-500">Expense</p>
            <!-- FIX: Property 'totalExpense' does not exist on type 'StoreService'. It is on the 'summary' signal. -->
            <p class="text-lg font-bold text-red-600 dark:text-red-500">LKR {{ store.summary().totalExpense | number }}</p>
         </div>
         <div class="bg-white dark:bg-neutral-800/50 p-4 rounded border border-gray-200 dark:border-neutral-800 shadow-sm">
            <p class="text-xs uppercase text-gray-500 dark:text-neutral-500">Profit</p>
            <!-- FIX: Property 'netProfit' does not exist on type 'StoreService'. It is on the 'summary' signal. -->
            <p class="text-lg font-bold text-brand-600 dark:text-brand-500">LKR {{ store.summary().netProfit | number }}</p>
         </div>
      </div>
    </div>
  `
})
export class AdvisorComponent {
  store = inject(StoreService);
  //ai = inject(AiService);
  
  loading = signal(false);
  advice = signal('');

//   async generateAdvice() {
//     this.loading.set(true);
    
//     // FIX: Properties do not exist on type 'StoreService'. They are on the 'summary' signal.
//     const snapshot = {
//       income: this.store.summary().totalIncome,
//       expenses: this.store.summary().totalExpense,
//       businessCost: this.store.summary().businessExpenses,
//       homeCost: this.store.summary().personalExpenses, 
//       netProfit: this.store.summary().netProfit,
//       assets: this.store.allAssets().map(a => ({ name: a.name, status: a.status }))
//     };

//     const result = await this.ai.getFinancialAdvice(JSON.stringify(snapshot));
//     this.advice.set(result);
//     this.loading.set(false);
//   }
}