import { Component, ElementRef, ViewChild, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService } from '../services/store.service';
import { AiService } from '../services/ai.service';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import * as d3 from 'd3';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="space-y-6 pb-8">
      <!-- Header & Quick Action -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div class="w-full md:w-auto">
           <div class="flex items-center space-x-3">
             <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Financial Overview</h1>
             @if (!store.isOnline()) {
               <span class="bg-red-500/20 text-red-600 dark:text-red-400 text-xs px-2 py-1 rounded font-bold uppercase border border-red-500/30">
                 <i class="fa-solid fa-wifi-slash mr-1"></i> Offline Mode
               </span>
             } @else {
               <span class="bg-green-500/20 text-green-600 dark:text-green-400 text-xs px-2 py-1 rounded font-bold uppercase border border-green-500/30">
                 <i class="fa-solid fa-cloud mr-1"></i> Synced
               </span>
             }
           </div>
           
           <!-- Instant Profit Summaries -->
           <div class="flex flex-wrap gap-3 mt-4 mb-2">
              <div class="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg flex items-center space-x-2 shadow-sm">
                 <div class="flex flex-col">
                    <span class="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">This Month Profit</span>
                    <span class="text-sm font-bold text-gray-900 dark:text-white leading-tight">LKR {{ store.summary().netProfit | number:'1.0-0' }}</span>
                 </div>
              </div>
              <div class="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg flex items-center space-x-2 shadow-sm">
                 <div class="flex flex-col">
                    <span class="text-[10px] font-bold text-brand-700 dark:text-brand-500 uppercase tracking-wider">This Year Profit</span>
                    <span class="text-sm font-bold text-gray-900 dark:text-white leading-tight">LKR {{ store.summary().netProfit | number:'1.0-0' }}</span>
                 </div>
              </div>
           </div>
           
           <!-- Quick Date Filter Toolbar -->
           <div class="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
              <div class="flex bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-1 shadow-sm">
                 <button (click)="setDatePreset('today')" class="px-3 py-1 text-xs font-bold text-gray-600 dark:text-neutral-400 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition">Today</button>
                 <button (click)="setDatePreset('week')" class="px-3 py-1 text-xs font-bold text-gray-600 dark:text-neutral-400 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition">Week</button>
                 <button (click)="setDatePreset('month')" class="px-3 py-1 text-xs font-bold text-gray-600 dark:text-neutral-400 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition">Month</button>
                 <button (click)="setDatePreset('last_month')" class="px-3 py-1 text-xs font-bold text-gray-600 dark:text-neutral-400 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition">Last Month</button>
              </div>
              
              <div class="flex items-center space-x-2 bg-white dark:bg-neutral-900 p-1 rounded-lg border border-gray-200 dark:border-neutral-800 shadow-sm">
                  <input type="date" [ngModel]="store.filterStartDate()" (ngModelChange)="onDateChange($event, 'start')" class="bg-transparent text-gray-900 dark:text-white text-xs px-2 outline-none w-24">
                  <span class="text-gray-400 dark:text-neutral-600 text-xs">-</span>
                  <input type="date" [ngModel]="store.filterEndDate()" (ngModelChange)="onDateChange($event, 'end')" class="bg-transparent text-gray-900 dark:text-white text-xs px-2 outline-none w-24">
              </div>
           </div>
        </div>

        <a routerLink="/transactions" [queryParams]="{action: 'add'}" 
           class="bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-brand-500/20 flex items-center space-x-2 transition-transform transform hover:-translate-y-1 w-full md:w-auto justify-center mt-4 md:mt-0">
           <i class="fa-solid fa-plus-circle text-lg"></i>
           <span>Add Transaction</span>
        </a>
      </div>

      <!-- AI Quick Tip -->
      <div class="bg-gradient-to-r from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-900 border border-gray-200 dark:border-neutral-800 p-4 rounded-xl flex items-start space-x-4 shadow-md">
         <div class="bg-brand-100 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 p-2 rounded-lg shrink-0 mt-1">
            <i class="fa-solid fa-robot"></i>
         </div>
         <div>
            <h4 class="font-bold text-gray-800 dark:text-neutral-300 text-sm uppercase mb-1">AI Daily Insight</h4>
            <p class="text-gray-600 dark:text-neutral-400 text-sm italic">"{{ quickTip() }}"</p>
         </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Income -->
        <div class="bg-white dark:bg-neutral-900 p-5 rounded-xl border-l-4 border-green-500 shadow-md relative overflow-hidden group">
          <div class="flex justify-between items-start relative z-10">
            <div>
              <p class="text-gray-500 dark:text-neutral-500 text-sm font-medium uppercase">Total Income</p>
              <h3 class="text-2xl font-bold text-gray-900 dark:text-white mt-1">LKR {{ store.summary().totalIncome | number:'1.0-0' }}</h3>
            </div>
            <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-500">
              <i class="fa-solid fa-arrow-trend-up"></i>
            </div>
          </div>
          <div class="absolute -right-6 -bottom-6 text-8xl text-green-500/5 group-hover:text-green-500/10 transition-colors">
             <i class="fa-solid fa-money-bill-wave"></i>
          </div>
        </div>

        <!-- Expenses -->
        <div class="bg-white dark:bg-neutral-900 p-5 rounded-xl border-l-4 border-red-500 shadow-md relative overflow-hidden group">
          <div class="flex justify-between items-start relative z-10">
            <div>
              <p class="text-gray-500 dark:text-neutral-500 text-sm font-medium uppercase">Total Expenses</p>
              <h3 class="text-2xl font-bold text-gray-900 dark:text-white mt-1">LKR {{ store.summary().totalExpense | number:'1.0-0' }}</h3>
            </div>
            <div class="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-500">
              <i class="fa-solid fa-arrow-trend-down"></i>
            </div>
          </div>
          <div class="absolute -right-6 -bottom-6 text-8xl text-red-500/5 group-hover:text-red-500/10 transition-colors">
             <i class="fa-solid fa-receipt"></i>
          </div>
        </div>

        <!-- Net Profit -->
        <div class="bg-white dark:bg-neutral-900 p-5 rounded-xl border-l-4 border-brand-500 shadow-md relative overflow-hidden">
          <div class="flex justify-between items-start relative z-10">
            <div>
              <p class="text-gray-500 dark:text-neutral-500 text-sm font-medium uppercase">Net Profit</p>
              <h3 class="text-2xl font-bold mt-1" 
                 [class.text-green-600]="store.summary().netProfit > 0" [class.dark:text-green-400]="store.summary().netProfit > 0"
                 [class.text-red-600]="store.summary().netProfit < 0" [class.dark:text-red-400]="store.summary().netProfit < 0"
                 [class.text-gray-900]="store.summary().netProfit === 0" [class.dark:text-white]="store.summary().netProfit === 0">
                 LKR {{ store.summary().netProfit | number:'1.0-0' }}
              </h3>
            </div>
            <div class="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg text-brand-600 dark:text-brand-500">
              <i class="fa-solid fa-wallet"></i>
            </div>
          </div>
          <p class="text-xs text-gray-500 dark:text-neutral-500 mt-2 relative z-10">Target Savings (20%): LKR {{ store.summary().netProfit * 0.2 | number:'1.0-0' }}</p>
        </div>

        <!-- Asset Health -->
        <div class="bg-white dark:bg-neutral-900 p-5 rounded-xl border-l-4 border-neutral-500 shadow-md">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-gray-500 dark:text-neutral-500 text-sm font-medium uppercase">Asset Health</p>
              <h3 class="text-2xl font-bold text-gray-900 dark:text-white mt-1">Status</h3>
            </div>
            <div class="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-400">
              <i class="fa-solid fa-heart-pulse"></i>
            </div>
          </div>
          <p class="text-xs text-gray-500 dark:text-neutral-500 mt-2">Active Assets: {{ store.allAssets().length }}</p>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Chart -->
        <div class="lg:col-span-2 bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-neutral-800">
          <div class="flex justify-between items-center mb-4">
             <h3 class="text-lg font-bold text-gray-800 dark:text-neutral-200">Cashflow Trend</h3>
          </div>
          <div #chartContainer class="w-full h-64"></div>
        </div>

        <!-- Recent Activity (Filtered) -->
        <div class="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-neutral-800">
          <h3 class="text-lg font-bold text-gray-800 dark:text-neutral-200 mb-4">Recent Activity</h3>
          <div class="space-y-4">
            @for (t of store.transactions().slice(0, 5); track t.id) {
              <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition">
                <div class="flex items-center space-x-3">
                  <div [class]="'w-10 h-10 rounded-full flex items-center justify-center ' + 
                     (t.type === 'income' ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-500' : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-500')">
                    <i [class]="getIcon(t.category)"></i>
                  </div>
                  <div>
                    <div class="flex items-center space-x-2">
                       <p class="font-medium text-sm text-gray-900 dark:text-white">{{ t.category }}</p>
                       @if(t.isLoan) { <span class="text-[10px] bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400 px-1 rounded uppercase font-bold">Loan</span> }
                    </div>
                    <p class="text-xs text-gray-500 dark:text-neutral-500">{{ t.date }}</p>
                  </div>
                </div>
                <div class="text-right">
                   <span [class]="'block font-bold text-sm ' + (t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-neutral-300')">
                     {{ t.type === 'income' ? '+' : '-' }} LKR {{ t.amount | number }}
                   </span>
                   @if (t.attachment) {
                     <i class="fa-solid fa-paperclip text-xs text-gray-400 dark:text-neutral-600"></i>
                   }
                </div>
              </div>
            }
            @if (store.transactions().length === 0) {
              <p class="text-gray-500 dark:text-neutral-500 text-center py-4">No transactions in this date range.</p>
            }
          </div>
        </div>
      </div>

      <!-- Business vs Personal Breakdown -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
         <!-- Business Card -->
         <div class="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-neutral-800">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
               <i class="fa-solid fa-briefcase mr-2 text-brand-500"></i> Business Performance
            </h3>
            
            <div class="space-y-6">
               <!-- Net Business -->
               <div class="flex justify-between items-center bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-lg">
                  <span class="text-gray-500 dark:text-neutral-400">Net Business Profit</span>
                  <span class="text-xl font-bold" 
                     [class.text-green-600]="store.summary().businessNet > 0" [class.dark:text-green-400]="store.summary().businessNet > 0"
                     [class.text-red-600]="store.summary().businessNet < 0" [class.dark:text-red-400]="store.summary().businessNet < 0">
                     LKR {{ store.summary().businessNet | number:'1.0-0' }}
                  </span>
               </div>

               <!-- Bars -->
               <div class="space-y-4">
                  <div>
                     <div class="flex justify-between text-sm mb-1">
                        <span class="text-gray-500 dark:text-neutral-400">Income</span>
                        <span class="text-green-600 dark:text-green-400 font-bold">LKR {{ store.summary().businessIncome | number:'1.0-0' }}</span>
                     </div>
                     <div class="w-full bg-gray-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                        <div class="bg-green-500 h-full rounded-full" style="width: 100%"></div>
                     </div>
                  </div>
                  <div>
                     <div class="flex justify-between text-sm mb-1">
                        <span class="text-gray-500 dark:text-neutral-400">Expenses</span>
                        <span class="text-red-600 dark:text-red-400 font-bold">LKR {{ store.summary().businessExpenses | number:'1.0-0' }}</span>
                     </div>
                     <!-- Visual Ratio Bar -->
                     <div class="w-full bg-gray-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                        <div class="bg-red-500 h-full rounded-full" [style.width.%]="(store.summary().businessExpenses / (store.summary().businessIncome || 1)) * 100"></div>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <!-- Personal Card -->
         <div class="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-neutral-800">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
               <i class="fa-solid fa-house-chimney mr-2 text-brand-500"></i> Personal & Home
            </h3>

             <div class="space-y-6">
               <!-- Net Personal -->
               <div class="flex justify-between items-center bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-lg">
                  <span class="text-gray-500 dark:text-neutral-400">Personal Balance</span>
                  <span class="text-xl font-bold" 
                     [class.text-green-600]="store.summary().personalNet > 0" [class.dark:text-green-400]="store.summary().personalNet > 0"
                     [class.text-red-600]="store.summary().personalNet < 0" [class.dark:text-red-400]="store.summary().personalNet < 0">
                     LKR {{ store.summary().personalNet | number:'1.0-0' }}
                  </span>
               </div>

               <!-- Bars -->
               <div class="space-y-4">
                  <div>
                     <div class="flex justify-between text-sm mb-1">
                        <span class="text-gray-500 dark:text-neutral-400">Other Income</span>
                        <span class="text-green-600 dark:text-green-400 font-bold">LKR {{ store.summary().personalIncome | number:'1.0-0' }}</span>
                     </div>
                     <div class="w-full bg-gray-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                        <div class="bg-green-500 h-full rounded-full" style="width: 100%"></div>
                     </div>
                  </div>
                  <div>
                     <div class="flex justify-between text-sm mb-1">
                        <span class="text-gray-500 dark:text-neutral-400">Household Expenses</span>
                        <span class="text-red-600 dark:text-red-400 font-bold">LKR {{ store.summary().personalExpenses | number:'1.0-0' }}</span>
                     </div>
                      <div class="w-full bg-gray-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                        <div class="bg-red-500 h-full rounded-full" [style.width.%]="(store.summary().personalExpenses / ((store.summary().personalIncome + store.summary().businessNet) || 1)) * 100"></div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  `
})
export class DashboardComponent {
  store = inject(StoreService);
  //ai = inject(AiService);
  @ViewChild('chartContainer') chartContainer!: ElementRef;
  
  quickTip = signal('Analyzing data...');

  // constructor() {
  //   effect(() => {
  //     this.store.transactions(); 
  //     this.store.theme();
  //     setTimeout(() => this.renderChart(), 0);
  //   });
    
  //   setTimeout(async () => {
  //       if(this.store.isOnline()) {
  //            const tip = await this.ai.getDashboardAdvice(this.store.transactions().slice(0, 10));
  //            this.quickTip.set(tip);
  //       } else {
  //            this.quickTip.set("Offline Mode: Review your expenses manually today.");
  //       }
  //   }, 1000);
  // }

  setDatePreset(preset: 'today' | 'week' | 'month' | 'last_month') {
    this.store.setPresetDateFilter(preset);
    this.store.loadTransactions(); // Reload data on preset change
  }

  onDateChange(value: string, type: 'start' | 'end') {
      if (type === 'start') this.store.filterStartDate.set(value);
      else this.store.filterEndDate.set(value);
      this.store.loadTransactions();
  }

  getIcon(category: string): string {
    const map: any = {
      'Video Shoot': 'fa-solid fa-video', 'Drone Service': 'fa-solid fa-helicopter', 'Fuel': 'fa-solid fa-gas-pump',
      'Groceries': 'fa-solid fa-cart-shopping', 'Utilities': 'fa-solid fa-bolt',
      'Loan Received': 'fa-solid fa-hand-holding-dollar', 'Loan Repayment': 'fa-solid fa-money-bill-transfer'
    };
    return map[category] || 'fa-solid fa-money-bill';
  }

  renderChart() {
    if (!this.chartContainer) return;
    const element = this.chartContainer.nativeElement;
    d3.select(element).selectAll('*').remove();

    const data = this.store.transactions()
      .slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (data.length === 0) return;

    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = element.clientWidth - margin.left - margin.right;
    const height = element.clientHeight - margin.top - margin.bottom;

    const svg = d3.select(element).append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    let balance = 0;
    const lineData = data.map(d => {
      balance += (d.type === 'income' ? d.amount : -d.amount);
      return { date: new Date(d.date), value: balance };
    });

    const x = d3.scaleTime().domain(d3.extent(lineData, d => d.date) as [Date, Date]).range([0, width]);
    const y = d3.scaleLinear().domain([d3.min(lineData, d => d.value) || 0, d3.max(lineData, d => d.value) || 0]).range([height, 0]);
    const axisColor = this.store.theme() === 'dark' ? '#737373' : '#a3a3a3';

    svg.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x).ticks(5)).attr('color', axisColor);
    svg.append('g').call(d3.axisLeft(y)).attr('color', axisColor);
    
    svg.append('path').datum(lineData).attr('fill', 'none').attr('stroke', '#d97706').attr('stroke-width', 3)
      .attr('d', d3.line<any>().x(d => x(d.date)).y(d => y(d.value)).curve(d3.curveMonotoneX));
      
    svg.append("path").datum(lineData).attr("fill", "rgba(217, 119, 6, 0.1)")
      .attr("d", d3.area<any>().x(d => x(d.date)).y0(height).y1(d => y(d.value)).curve(d3.curveMonotoneX));
  }
}
