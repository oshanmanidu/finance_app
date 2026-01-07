import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService, Transaction, Customer, Business } from '../services/store.service';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray, FormsModule } from '@angular/forms';
import { AiService } from '../services/ai.service';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';

type FilterType = 'all' | 'income' | 'expense' | 'loan';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto space-y-6 pb-8">
      
      <!-- Action Bar -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div class="w-full md:w-auto">
           <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h2>
           <div class="flex flex-col sm:flex-row gap-2 mt-3">
               <div class="flex bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-1 shadow-sm h-10 items-center">
                 <button (click)="store.setPresetDateFilter('today')" class="px-3 py-1 text-xs font-bold text-gray-600 dark:text-neutral-400 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition">Today</button>
                 <button (click)="store.setPresetDateFilter('week')" class="px-3 py-1 text-xs font-bold text-gray-600 dark:text-neutral-400 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition">Week</button>
                 <button (click)="store.setPresetDateFilter('month')" class="px-3 py-1 text-xs font-bold text-gray-600 dark:text-neutral-400 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition">Month</button>
              </div>
              <div class="flex items-center space-x-2 bg-white dark:bg-neutral-900 p-1 rounded-lg border border-gray-200 dark:border-neutral-800 h-10 shadow-sm">
                  <input type="date" [ngModel]="store.filterStartDate()" (ngModelChange)="store.filterStartDate.set($event)" class="bg-transparent text-gray-900 dark:text-white text-xs px-2 outline-none w-24">
                  <span class="text-gray-400 dark:text-neutral-600 text-xs">-</span>
                  <input type="date" [ngModel]="store.filterEndDate()" (ngModelChange)="store.filterEndDate.set($event)" class="bg-transparent text-gray-900 dark:text-white text-xs px-2 outline-none w-24">
              </div>
              <div class="relative flex-1 min-w-[150px] h-10">
                <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                <input type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" 
                       placeholder="Search..." 
                       class="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg pl-8 pr-4 py-1.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none shadow-sm h-full">
              </div>
           </div>
        </div>

        <div class="flex space-x-2 w-full md:w-auto justify-end">
           <button (click)="downloadReport()" 
             class="bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 border border-gray-200 dark:border-neutral-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition shadow-sm text-sm font-medium h-10 hover:bg-gray-50 dark:hover:bg-neutral-700">
             <i class="fa-solid fa-download"></i>
             <span class="hidden sm:inline">Report</span>
           </button>
           <button (click)="isScanning.set(true)" 
             class="bg-neutral-600 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition shadow-lg text-sm font-medium h-10">
             <i class="fa-solid fa-camera"></i>
           </button>
           <button (click)="openForm()" 
             class="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition shadow-lg text-sm font-medium h-10">
             <i class="fa-solid fa-plus"></i>
             <span class="hidden sm:inline">Add</span>
           </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button (click)="filter.set('all')" [class]="'p-4 rounded-xl font-bold text-lg transition-all shadow-md flex flex-col items-center justify-center gap-2 ' + (filter() === 'all' ? 'bg-neutral-700 text-white border-2 border-neutral-500' : 'bg-white dark:bg-neutral-900 text-gray-500 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800')"><i class="fa-solid fa-list-ul text-2xl"></i> ALL</button>
        <button (click)="filter.set('income')" [class]="'p-4 rounded-xl font-bold text-lg transition-all shadow-md flex flex-col items-center justify-center gap-2 ' + (filter() === 'income' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border-2 border-green-500' : 'bg-white dark:bg-neutral-900 text-gray-500 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800')"><i class="fa-solid fa-arrow-trend-up text-2xl"></i> INCOME</button>
        <button (click)="filter.set('expense')" [class]="'p-4 rounded-xl font-bold text-lg transition-all shadow-md flex flex-col items-center justify-center gap-2 ' + (filter() === 'expense' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 border-2 border-red-500' : 'bg-white dark:bg-neutral-900 text-gray-500 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800')"><i class="fa-solid fa-arrow-trend-down text-2xl"></i> EXPENSE</button>
        <button (click)="filter.set('loan')" [class]="'p-4 rounded-xl font-bold text-lg transition-all shadow-md flex flex-col items-center justify-center gap-2 ' + (filter() === 'loan' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 border-2 border-yellow-500' : 'bg-white dark:bg-neutral-900 text-gray-500 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800')"><i class="fa-solid fa-hand-holding-dollar text-2xl"></i> LOANS</button>
      </div>

      <!-- Receipt Scanner Modal -->
      @if (isScanning()) {
        <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div class="bg-white dark:bg-neutral-900 p-6 rounded-xl max-w-md w-full space-y-4 shadow-2xl border border-gray-200 dark:border-neutral-800">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white">Scan Receipt with AI</h3>
            <label class="block cursor-pointer bg-gray-50 dark:bg-neutral-800 border border-dashed border-gray-400 dark:border-neutral-600 rounded-lg p-8 text-center hover:bg-gray-100 dark:hover:bg-neutral-700 transition">
              <input type="file" accept="image/*" (change)="handleFileScan($event)" class="hidden" />
              <i class="fa-solid fa-cloud-arrow-up text-3xl text-gray-400 dark:text-neutral-400 mb-2"></i>
              <span class="block text-gray-600 dark:text-neutral-300">Click to upload image</span>
            </label>
            @if (scanningState() === 'scanning') {
              <div class="flex items-center space-x-2 text-brand-500 animate-pulse">
                <i class="fa-solid fa-circle-notch fa-spin"></i> <span>Analyzing image...</span>
              </div>
            }
            <div class="flex justify-end pt-4">
              <button (click)="isScanning.set(false); scanningState.set('idle')" class="text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white">Cancel</button>
            </div>
          </div>
        </div>
      }

      <!-- Add Form -->
      @if (showForm()) {
        <div class="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-800 animate-in fade-in slide-in-from-top-4">
           <div class="flex justify-between items-center mb-6">
              <h3 class="text-lg font-bold text-gray-900 dark:text-white">New Transaction</h3>
              <button (click)="showForm.set(false)" class="text-gray-400 hover:text-gray-900 dark:hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
           </div>
           
           <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-6">
              <div>
                <label class="block text-xs font-medium text-gray-500 dark:text-neutral-500 mb-2 uppercase tracking-wide">Transaction Type</label>
                <div class="grid grid-cols-3 gap-4">
                  <label class="cursor-pointer relative group"><input type="radio" formControlName="uiType" value="income" class="peer sr-only"><div class="p-4 rounded-lg border-2 border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50 text-center group-hover:bg-gray-100 dark:group-hover:bg-neutral-800 peer-checked:border-green-500 peer-checked:bg-green-100 dark:peer-checked:bg-green-500/10 peer-checked:text-green-600 dark:peer-checked:text-green-500 transition-all"><i class="fa-solid fa-arrow-up mb-2 text-xl block"></i><span class="font-bold text-sm">Income</span></div></label>
                  <label class="cursor-pointer relative group"><input type="radio" formControlName="uiType" value="expense" class="peer sr-only"><div class="p-4 rounded-lg border-2 border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50 text-center group-hover:bg-gray-100 dark:group-hover:bg-neutral-800 peer-checked:border-red-500 peer-checked:bg-red-100 dark:peer-checked:bg-red-500/10 peer-checked:text-red-600 dark:peer-checked:text-red-500 transition-all"><i class="fa-solid fa-arrow-down mb-2 text-xl block"></i><span class="font-bold text-sm">Expense</span></div></label>
                  <label class="cursor-pointer relative group"><input type="radio" formControlName="uiType" value="loan" class="peer sr-only"><div class="p-4 rounded-lg border-2 border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50 text-center group-hover:bg-gray-100 dark:group-hover:bg-neutral-800 peer-checked:border-yellow-500 peer-checked:bg-yellow-100 dark:peer-checked:bg-yellow-500/10 peer-checked:text-yellow-600 dark:peer-checked:text-yellow-500 transition-all"><i class="fa-solid fa-hand-holding-dollar mb-2 text-xl block"></i><span class="font-bold text-sm">Loan</span></div></label>
                </div>
              </div>

              @if (form.get('uiType')?.value === 'loan') {
                 <div class="bg-gray-50 dark:bg-neutral-950 p-4 rounded-lg border border-gray-200 dark:border-neutral-800"><label class="block text-xs font-medium text-gray-500 dark:text-neutral-500 mb-2">Loan Action</label><div class="flex flex-col sm:flex-row gap-4"><label class="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 transition flex-1"><input type="radio" formControlName="loanAction" value="borrow" class="text-brand-600 focus:ring-brand-500 bg-gray-200 dark:bg-neutral-800 border-none"><span class="text-sm text-gray-900 dark:text-white font-medium">Borrowing (Cash In)</span></label><label class="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 transition flex-1"><input type="radio" formControlName="loanAction" value="repay" class="text-brand-600 focus:ring-brand-500 bg-gray-200 dark:bg-neutral-800 border-none"><span class="text-sm text-gray-900 dark:text-white font-medium">Repaying (Cash Out)</span></label></div></div>
              }

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div><label class="block text-xs font-medium text-gray-500 dark:text-neutral-500 mb-1">Date</label><input type="date" formControlName="date" class="w-full bg-gray-100 dark:bg-neutral-800 border-gray-200 dark:border-none rounded-lg p-3 text-gray-900 dark:text-white outline-none"></div>
                 <div><label class="block text-xs font-medium text-gray-500 dark:text-neutral-500 mb-1">Amount</label><div class="relative"><span class="absolute left-3 top-3 text-gray-500 dark:text-neutral-500">LKR</span><input type="number" formControlName="amount" class="w-full bg-gray-100 dark:bg-neutral-800 border-gray-200 dark:border-none rounded-lg p-3 pl-12 text-gray-900 dark:text-white outline-none" placeholder="0.00"></div></div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label class="block text-xs font-medium text-gray-500 dark:text-neutral-500 mb-1">Category</label><input type="text" formControlName="category" list="categoryList" class="w-full bg-gray-100 dark:bg-neutral-800 border-gray-200 dark:border-none rounded-lg p-3 text-gray-900 dark:text-white outline-none" placeholder="e.g. Fuel"><datalist id="categoryList">@for (cat of store.knownCategories(); track cat) {<option [value]="cat"></option>}</datalist></div>
                  <div><label class="block text-xs font-medium text-gray-500 dark:text-neutral-500 mb-1">Description</label><input type="text" formControlName="description" class="w-full bg-gray-100 dark:bg-neutral-800 border-gray-200 dark:border-none rounded-lg p-3 text-gray-900 dark:text-white outline-none"></div>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                 <div>
                     <label class="block text-xs font-medium text-gray-500 dark:text-neutral-500 mb-1">Business Context</label>
                     <select formControlName="businessId" class="w-full bg-gray-100 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 rounded-lg p-3 text-gray-900 dark:text-white outline-none"><option [ngValue]="null">Personal / Household</option>@for (biz of store.allBusinesses(); track biz.id) {<option [value]="biz.id">{{ biz.name }}</option>}</select>
                 </div>
                 @if (form.get('uiType')?.value === 'income' && form.get('businessId')?.value) {
                    <div>
                        <label class="block text-xs font-medium text-gray-500 dark:text-neutral-500 mb-1">Customer (for Invoice)</label>
                        <select formControlName="customerId" class="w-full bg-gray-100 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 rounded-lg p-3 text-gray-900 dark:text-white outline-none"><option [ngValue]="null">-- No Customer --</option>@for (c of store.allCustomers(); track c.id) {<option [value]="c.id">{{ c.name }}</option>}</select>
                    </div>
                 }
              </div>

              <div class="pt-2">
                <label class="block text-xs font-medium text-gray-500 dark:text-neutral-500 mb-1">Receipt / Proof</label>
                <div class="flex space-x-2 h-[48px]"><input type="file" #fileInput (change)="handleAttachment($event)" accept="image/*,application/pdf" class="hidden"><button type="button" (click)="fileInput.click()" class="flex-1 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-500 dark:text-neutral-400 rounded-lg text-sm border border-gray-300 dark:border-neutral-700 border-dashed flex items-center justify-center"><i class="fa-solid fa-paperclip mr-2"></i> {{ attachmentName() || 'Attach Invoice' }}</button>@if (attachmentData()) {<button type="button" (click)="clearAttachment()" class="text-red-500 hover:text-red-400 px-3 bg-gray-100 dark:bg-neutral-800 rounded-lg border border-gray-300 dark:border-neutral-700"><i class="fa-solid fa-trash"></i></button>}</div>
              </div>

              @if (form.get('businessId')?.value) {
                 <div class="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-200 dark:border-blue-500/20 space-y-3"><div class="flex items-center space-x-2"><input type="checkbox" formControlName="linkToAsset" id="linkAsset" class="w-4 h-4 rounded bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-500 text-blue-500"><label for="linkAsset" class="text-sm font-bold text-blue-700 dark:text-blue-300 cursor-pointer select-none">Link to Asset</label></div>
                    @if (form.get('linkToAsset')?.value) {
                       <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          <div>
                             <label class="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1">Action Type</label>
                             @if (form.get('uiType')?.value === 'expense') {<div class="flex flex-col space-y-2 pt-2"><label class="flex items-center space-x-2 cursor-pointer"><input type="radio" formControlName="assetAction" value="maintenance" class="text-blue-500 bg-gray-200 dark:bg-neutral-800"><span class="text-sm text-gray-700 dark:text-neutral-300">Service/Repair (Existing Asset)</span></label><label class="flex items-center space-x-2 cursor-pointer"><input type="radio" formControlName="assetAction" value="purchase" class="text-blue-500 bg-gray-200 dark:bg-neutral-800"><span class="text-sm text-gray-700 dark:text-neutral-300">Purchase (New Asset)</span></label></div>}
                             @if (form.get('uiType')?.value === 'income') {<div class="flex flex-col space-y-2 pt-2"><label class="flex items-center space-x-2 cursor-pointer"><input type="radio" formControlName="assetAction" value="usage" class="text-blue-500 bg-gray-200 dark:bg-neutral-800"><span class="text-sm text-gray-700 dark:text-neutral-300">Usage/Rent (Existing Asset)</span></label><label class="flex items-center space-x-2 cursor-pointer"><input type="radio" formControlName="assetAction" value="sale" class="text-blue-500 bg-gray-200 dark:bg-neutral-800"><span class="text-sm text-gray-700 dark:text-neutral-300">Selling (Retire Asset)</span></label></div>}
                          </div>
                          <div>
                             @if (form.get('assetAction')?.value === 'purchase' && form.get('uiType')?.value === 'expense') {
                                <div class="space-y-3 p-3 bg-white dark:bg-neutral-800 rounded border border-blue-200 dark:border-blue-500/30"><p class="text-xs text-blue-600 dark:text-blue-300 font-bold uppercase">New Asset Details</p><input type="text" formControlName="newAssetName" placeholder="Asset Name" class="w-full bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded px-2 py-1 text-sm text-gray-900 dark:text-white"><input type="text" formControlName="newAssetType" list="assetTypesList" placeholder="Category" class="w-full bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded px-2 py-1 text-sm text-gray-900 dark:text-white"><datalist id="assetTypesList"><option value="Drone"></option><option value="Vehicle"></option><option value="Camera"></option></datalist></div>
                             } @else {
                                <label class="block text-xs font-medium text-gray-500 dark:text-neutral-500 mb-1">Select Asset</label><select formControlName="assetId" class="w-full bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded px-3 py-2 text-gray-900 dark:text-white outline-none"><option [ngValue]="null">-- Choose Asset --</option>@for (a of store.allAssets(); track a.id) {<option [value]="a.id" [disabled]="a.status === 'retired'">{{ a.name }} {{ a.status === 'retired' ? '(Sold)' : '' }}</option>}</select>
                             }
                          </div>
                       </div>
                    }
                 </div>
              }

              @if (form.get('uiType')?.value === 'income' && form.get('businessId')?.value) {
                <div class="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-200 dark:border-red-500/20 space-y-3"><div class="flex justify-between items-center"><h4 class="text-xs font-bold text-red-600 dark:text-red-300 uppercase flex items-center"><i class="fa-solid fa-receipt mr-2"></i> Related Job Expenses</h4><button type="button" (click)="addRelatedExpense()" class="text-xs bg-red-600/80 text-white px-3 py-1.5 rounded-lg"><i class="fa-solid fa-plus mr-1"></i> Add Cost</button></div><div formArrayName="relatedExpenses" class="space-y-2">@for (item of relatedExpenses.controls; track $index) {<div [formGroupName]="$index" class="flex gap-2 items-start"><div class="flex-1"><input type="text" formControlName="category" placeholder="Expense" class="w-full bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded px-2 py-2 text-sm text-gray-900 dark:text-white"></div><div class="w-24"><input type="number" formControlName="amount" placeholder="LKR" class="w-full bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded px-2 py-2 text-sm text-gray-900 dark:text-white"></div><button type="button" (click)="removeRelatedExpense($index)" class="text-gray-400 hover:text-red-500 p-2"><i class="fa-solid fa-trash text-sm"></i></button></div>}</div></div>
              }

              <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-neutral-800">
                 <button type="button" (click)="showForm.set(false)" class="px-6 py-2 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition">Cancel</button>
                 <button type="submit" [disabled]="form.invalid" class="bg-brand-600 hover:bg-brand-500 text-white px-8 py-2 rounded-lg font-bold shadow-lg disabled:opacity-50">Save</button>
              </div>
           </form>
        </div>
      }

      <!-- List -->
      <div class="bg-white dark:bg-neutral-900 rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-neutral-800">
         <div class="p-4 bg-gray-50 dark:bg-neutral-900/30 border-b border-gray-200 dark:border-neutral-800 text-xs text-gray-500 dark:text-neutral-500 flex justify-between"><span>Showing records for selected date range</span><span>Total: {{ filteredTransactions().length }}</span></div>
         <div class="overflow-x-auto">
           <table class="w-full text-left border-collapse min-w-[600px]">
              <thead class="bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 text-xs uppercase"><tr><th class="p-4 font-medium">Date</th><th class="p-4 font-medium">Category</th><th class="p-4 font-medium">Context</th><th class="p-4 font-medium text-right">Amount</th><th class="p-4 font-medium text-center">Actions</th></tr></thead>
              <tbody class="divide-y divide-gray-200 dark:divide-neutral-800 text-sm">
                 @for (t of filteredTransactions(); track t.id) {
                    <tr class="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition group">
                       <td class="p-4 text-gray-600 dark:text-neutral-300 whitespace-nowrap">{{ t.date }}</td>
                       <td class="p-4 text-gray-900 dark:text-white font-medium">
                          <div class="flex flex-col">
                            <span class="flex items-center gap-2">{{ t.category }} @if(t.isLoan) { <span class="text-[10px] bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-1 rounded uppercase font-bold">Loan</span> } @if(t.assetId) { <i class="fa-solid fa-link text-blue-400 text-xs" title="Linked to Asset"></i> }</span>
                            <span class="text-xs text-gray-500 dark:text-neutral-400 max-w-xs truncate">{{ t.description }}</span>
                          </div>
                       </td>
                       <td class="p-4">
                          @if (t.isBusiness) {<span class="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">{{ getBizName(t.businessId) }}</span>} @else {<span class="px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30">Personal</span>}
                       </td>
                       <td [class]="'p-4 text-right font-bold ' + (t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-neutral-200')">{{ t.type === 'income' ? '+' : '-' }} LKR {{ t.amount | number:'1.2-2' }}</td>
                       <td class="p-4 text-center">
                          <div class="flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            @if (t.attachment) {<button (click)="viewAttachment(t.attachment)" class="text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 bg-brand-50 dark:bg-brand-400/10 p-2 rounded-lg transition" title="View Attachment"><i class="fa-solid fa-file-lines"></i></button>}
                            @if (t.isBusiness && t.type === 'income' && t.customerId) {<button (click)="downloadInvoice(t)" class="text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 bg-purple-50 dark:bg-purple-400/10 p-2 rounded-lg transition" title="Download Invoice"><i class="fa-solid fa-file-invoice-dollar"></i></button>}
                            <button (click)="store.deleteTransaction(t.id)" class="text-gray-400 hover:text-red-500 transition p-2 rounded-lg" title="Delete"><i class="fa-solid fa-trash"></i></button>
                          </div>
                       </td>
                    </tr>
                 }
                 @if (filteredTransactions().length === 0) {
                    <tr><td colspan="5" class="p-8 text-center text-gray-500 dark:text-neutral-500">No transactions match this filter.</td></tr>
                 }
              </tbody>
           </table>
         </div>
      </div>
    </div>
  `
})
export class TransactionsComponent implements OnInit {
  store = inject(StoreService);
  //ai = inject(AiService);
  auth = inject(AuthService);
  fb: FormBuilder = inject(FormBuilder);
  route: ActivatedRoute = inject(ActivatedRoute);
  
  showForm = signal(false);
  isScanning = signal(false);
  scanningState = signal<'idle' | 'scanning'>('idle');
  filter = signal<FilterType>('all');
  searchQuery = signal('');
  
  attachmentData = signal<string | null>(null);
  attachmentName = signal<string | null>(null);

  form = this.fb.group({
    uiType: ['expense', Validators.required], 
    loanAction: ['repay'],
    date: [new Date().toISOString().split('T')[0], Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    category: ['', Validators.required],
    description: [''],
    businessId: [null as string | null],
    customerId: [null as string | null],
    relatedExpenses: this.fb.array([]),
    linkToAsset: [false],
    assetId: [null as string | null],
    assetAction: ['maintenance'], 
    newAssetName: [''],
    newAssetType: ['']
  });

  filteredTransactions = computed(() => {
    // FIX: Property 'filteredTransactions' does not exist on type 'StoreService'. Using 'transactions' instead.
    const all = this.store.transactions();
    const mode = this.filter();
    const q = this.searchQuery().toLowerCase();

    const textFiltered = q ? all.filter(t => t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)) : all;

    if (mode === 'all') return textFiltered;
    if (mode === 'loan') return textFiltered.filter(t => t.isLoan);
    return textFiltered.filter(t => t.type === mode && !t.isLoan && !t.parentId); 
  });

  get relatedExpenses() {
    return this.form.get('relatedExpenses') as FormArray;
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'add') this.openForm();
    });
    
    this.form.get('assetAction')?.valueChanges.subscribe(val => {
       this.form.get('assetId')?.clearValidators();
       this.form.get('newAssetName')?.clearValidators();
       if (val === 'purchase') {
          this.form.get('assetId')?.setValue(null);
          this.form.get('newAssetName')?.setValidators(Validators.required);
       } else if (this.form.get('linkToAsset')?.value) {
          this.form.get('assetId')?.setValidators(Validators.required);
       }
       this.form.get('assetId')?.updateValueAndValidity();
       this.form.get('newAssetName')?.updateValueAndValidity();
    });
  }

  openForm() {
    this.showForm.set(true);
    this.form.reset({
      uiType: 'expense',
      loanAction: 'repay',
      date: new Date().toISOString().split('T')[0],
      businessId: null,
      customerId: null,
      linkToAsset: false,
      assetAction: 'maintenance',
      newAssetType: 'Drone'
    });
    this.relatedExpenses.clear();
    this.clearAttachment();
  }

  addRelatedExpense() {
    this.relatedExpenses.push(this.fb.group({
      category: ['', Validators.required],
      amount: [null as number | null, [Validators.required, Validators.min(0.01)]]
    }));
  }

  removeRelatedExpense(index: number) { this.relatedExpenses.removeAt(index); }
  getBizName(id?: string) { return id ? this.store.allBusinesses().find(x => x.id === id)?.name ?? 'Business' : 'Personal'; }
  getCustName(id?: string) { return id ? this.store.allCustomers().find(x => x.id === id)?.name ?? 'Customer' : ''; }

  submit() {
    if (!this.form.valid) return;
    const val = this.form.value;
    let finalType: 'income' | 'expense' = val.uiType as any;
    let isLoan = false;

    if (val.uiType === 'loan') {
        isLoan = true;
        finalType = val.loanAction === 'borrow' ? 'income' : 'expense';
    }
    
    const mainTx = this.store.addTransaction({
      type: finalType,
      date: val.date!,
      amount: val.amount!,
      category: val.category!,
      description: val.description || '',
      isBusiness: !!val.businessId,
      businessId: val.businessId || undefined,
      customerId: val.customerId || undefined,
      isLoan: isLoan,
      attachment: this.attachmentData() || undefined,
      assetId: (val.linkToAsset && val.assetId) ? val.assetId : undefined,
      assetAction: (val.linkToAsset && val.assetAction) ? val.assetAction as any : undefined
    }, (val.linkToAsset && val.assetAction === 'purchase' && val.newAssetName) ? { name: val.newAssetName, type: val.newAssetType || 'General' } : undefined);

    if (val.uiType === 'income' && val.businessId) {
       (val.relatedExpenses as any[])?.forEach(exp => {
          if (exp.category && exp.amount) {
             this.store.addTransaction({
                type: 'expense', date: val.date!, amount: exp.amount, category: exp.category,
                description: `Cost for job: ${val.category}`, isBusiness: true, businessId: val.businessId!, isLoan: false,
                parentId: mainTx.id
             });
          }
       });
    }
    this.showForm.set(false);
  }

  handleAttachment(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.attachmentName.set(file.name);
      const reader = new FileReader();
      reader.onload = (e) => this.attachmentData.set(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  clearAttachment() {
    this.attachmentData.set(null);
    this.attachmentName.set(null);
  }

  viewAttachment(dataUri: string) {
    const win = window.open();
    if (win) {
        win.document.write(dataUri.includes('pdf') ? `<iframe src="${dataUri}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;"></iframe>` : `<img src="${dataUri}" style="max-width:100%;">`);
    }
  }

  async handleFileScan(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.scanningState.set('scanning');
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Full = e.target?.result as string;
        //const result = await this.ai.analyzeReceipt(base64Full.split(',')[1]);
        // if (result) {
        //   this.form.patchValue({ uiType: 'expense', ...result });
        //   this.attachmentData.set(base64Full);
        //   this.attachmentName.set(file.name);
        //   this.isScanning.set(false);
        //   this.showForm.set(true);
        // }
        this.scanningState.set('idle');
      };
      reader.readAsDataURL(file);
    }
  }

  private escapeHtml(str: string): string {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  private generateDailyTableRows(transactions: Transaction[], context: 'business' | 'home'): string {
      const dailySummaries = new Map<string, { income: number, expense: number }>();
      
      transactions.forEach(t => {
          const day = t.date;
          const summary = dailySummaries.get(day) || { income: 0, expense: 0 };
          if (t.type === 'income') summary.income += t.amount;
          else summary.expense += t.amount;
          dailySummaries.set(day, summary);
      });

      const sortedDays = Array.from(dailySummaries.keys()).sort();

      return sortedDays.map(day => {
          const summary = dailySummaries.get(day)!;
          const profit = summary.income - summary.expense;
          const profitColor = profit >= 0 ? 'text-green-600' : 'text-red-600';
          return `
              <tr class="border-b border-gray-200">
                  <td class="p-2 text-xs">${day}</td>
                  <td class="p-2 text-xs text-right font-mono text-green-600">+ ${summary.income.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                  <td class="p-2 text-xs text-right font-mono text-red-600">- ${summary.expense.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                  <td class="p-2 text-xs text-right font-mono ${profitColor}">${profit.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
              </tr>
          `;
      }).join('');
  }

  async downloadReport() {
    // FIX: Property 'filteredTransactions' does not exist on type 'StoreService'. Using component's computed signal 'filteredTransactions()'.
    const txs = this.filteredTransactions();
    if (txs.length === 0) {
        alert('No data to export for the selected date range.');
        return;
    }

    const businessTxs = txs.filter(t => t.isBusiness && !t.isLoan);
    const homeTxs = txs.filter(t => !t.isBusiness && !t.isLoan);

    const totalBusinessIncome = businessTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalBusinessExpenses = businessTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const businessProfit = totalBusinessIncome - totalBusinessExpenses;

    const totalHomeIncome = homeTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalHomeExpenses = homeTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const homeBalance = totalHomeIncome - totalHomeExpenses;
    
    const totalProfit = businessProfit + homeBalance;
    const letterheadName = this.store.allBusinesses()[0]?.name || this.auth.currentUser();

    const reportHTML = `
      <div class="font-sans text-gray-800 bg-white">
        <div class="p-8" style="min-height: 270mm;">
          <header class="flex justify-between items-start pb-4 border-b">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">${this.escapeHtml(letterheadName)}</h1>
              <h2 class="text-xl text-gray-600">Financial Report</h2>
            </div>
            <div class="text-right text-xs text-gray-500">
              <p><strong>Period:</strong> ${this.store.filterStartDate()} to ${this.store.filterEndDate()}</p>
              <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            </div>
          </header>

          <main>
            <!-- Business Section -->
            <section class="mt-8">
              <h3 class="text-xl font-bold text-blue-700 border-b-2 border-blue-200 pb-2 mb-4">Business Report</h3>
              <table class="w-full text-left table-auto">
                <thead><tr class="text-xs bg-gray-100 text-gray-600"><th class="p-2">Date</th><th class="p-2 text-right">Daily Income</th><th class="p-2 text-right">Daily Expenses</th><th class="p-2 text-right">Daily Profit/Loss</th></tr></thead>
                <tbody>${this.generateDailyTableRows(businessTxs, 'business')}</tbody>
              </table>
              <div class="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div class="bg-green-50 text-green-800 p-3 rounded-lg"><strong class="block">Total Income</strong><span class="font-mono text-lg">LKR ${totalBusinessIncome.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
                <div class="bg-red-50 text-red-800 p-3 rounded-lg"><strong class="block">Total Expenses</strong><span class="font-mono text-lg">LKR ${totalBusinessExpenses.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
                <div class="bg-blue-50 text-blue-800 p-3 rounded-lg"><strong class="block">Net Profit</strong><span class="font-mono text-lg">LKR ${businessProfit.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
              </div>
            </section>

            <!-- Home Section -->
            <section class="mt-10">
              <h3 class="text-xl font-bold text-purple-700 border-b-2 border-purple-200 pb-2 mb-4">Home & Personal Report</h3>
              <table class="w-full text-left table-auto">
                 <thead><tr class="text-xs bg-gray-100 text-gray-600"><th class="p-2">Date</th><th class="p-2 text-right">Daily Income</th><th class="p-2 text-right">Daily Expenses</th><th class="p-2 text-right">Daily Profit/Loss</th></tr></thead>
                 <tbody>${this.generateDailyTableRows(homeTxs, 'home')}</tbody>
              </table>
              <div class="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div class="bg-green-50 text-green-800 p-3 rounded-lg"><strong class="block">Total Income</strong><span class="font-mono text-lg">LKR ${totalHomeIncome.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
                <div class="bg-red-50 text-red-800 p-3 rounded-lg"><strong class="block">Total Expenses</strong><span class="font-mono text-lg">LKR ${totalHomeExpenses.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
                <div class="bg-purple-50 text-purple-800 p-3 rounded-lg"><strong class="block">Net Balance</strong><span class="font-mono text-lg">LKR ${homeBalance.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
              </div>
            </section>
            
            <!-- Grand Summary -->
            <section class="mt-10 pt-6 border-t-4 border-gray-300">
              <div class="w-1/2 ml-auto bg-gray-100 p-4 rounded-lg">
                 <h3 class="text-lg font-bold text-right mb-2">Overall Summary</h3>
                 <div class="flex justify-between text-sm py-1"><span class="text-gray-600">Business Net Profit</span><span class="font-bold">LKR ${businessProfit.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
                 <div class="flex justify-between text-sm py-1"><span class="text-gray-600">Home Net Balance</span><span class="font-bold">LKR ${homeBalance.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
                 <div class="flex justify-between text-lg py-2 mt-2 border-t-2"><span class="font-bold">GRAND TOTAL</span><span class="font-bold text-brand-600">LKR ${totalProfit.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
              </div>
            </section>
          </main>
        </div>
        <footer class="p-4 text-center text-xs text-gray-400 border-t bg-gray-50">
          Finance Manager by <a href="http://mezota.com" target="_blank" class="text-blue-600 hover:underline">mezota.com</a>
        </footer>
      </div>
    `;

    const reportElement = document.createElement('div');
    reportElement.style.position = 'absolute';
    reportElement.style.left = '-9999px';
    reportElement.style.top = '0';
    reportElement.style.width = '210mm';
    reportElement.innerHTML = reportHTML;
    document.body.appendChild(reportElement);

    await new Promise(resolve => setTimeout(resolve, 100));

    const html2canvas = (window as any).html2canvas;
    const canvas = await html2canvas(reportElement, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    
    const { jsPDF } = (window as any).jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`finance-report-${this.store.filterStartDate()}-to-${this.store.filterEndDate()}.pdf`);

    document.body.removeChild(reportElement);
  }

  downloadInvoice(tx: Transaction) {
      const biz = this.store.allBusinesses().find(b => b.id === tx.businessId);
      const cust = this.store.allCustomers().find(c => c.id === tx.customerId);
      if (!biz || !cust) { alert('Business or Customer not found.'); return; }

      const relatedExpenses = this.store.transactions().filter(t => t.parentId === tx.id);
      const totalCosts = relatedExpenses.reduce((sum, t) => sum + t.amount, 0);
      
      const expensesHtml = relatedExpenses.length > 0 ? `
        <h4 class="text-sm font-bold mt-6 mb-2 text-gray-600">Associated Job Costs</h4>
        <table class="w-full text-left">
           <thead class="bg-gray-50"><tr class="text-xs text-gray-500 uppercase"><th class="p-3 w-full">Cost Description</th><th class="p-3 text-right">Amount</th></tr></thead>
           <tbody>
             ${relatedExpenses.map(exp => `
                <tr class="border-b">
                  <td class="p-3"><p class="font-medium text-gray-700 text-sm">${this.escapeHtml(exp.category)}</p></td>
                  <td class="p-3 text-right font-mono text-sm text-red-600">- LKR ${exp.amount.toFixed(2)}</td>
                </tr>
             `).join('')}
           </tbody>
        </table>
      ` : '';

      const invoiceHTML = `
      <html>
        <head><title>Invoice ${tx.id.substring(0,8)}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style> body { -webkit-print-color-adjust: exact; } </style>
        </head>
        <body class="bg-gray-100 font-sans p-8">
          <div class="max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
            <header class="bg-gray-800 text-white p-8 rounded-t-lg">
              <div class="flex justify-between items-center">
                <div>
                  <h1 class="text-3xl font-bold">${this.escapeHtml(biz.name)}</h1>
                  <p class="text-gray-300">${this.escapeHtml(biz.slogan || biz.type)}</p>
                </div>
                <div class="text-right">
                  <h2 class="text-4xl font-light uppercase tracking-widest">Invoice</h2>
                  <p class="text-sm text-gray-400 mt-1">#${tx.id.substring(0, 8).toUpperCase()}</p>
                </div>
              </div>
            </header>
            <section class="p-8">
              <div class="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 class="text-sm text-gray-500 uppercase font-bold mb-2">Billed To</h3>
                  <p class="font-bold text-lg text-gray-900">${this.escapeHtml(cust.name)}</p>
                  ${cust.address ? `<p class="text-gray-600">${this.escapeHtml(cust.address).replace(/\n/g, '<br>')}</p>` : ''}
                  ${cust.email ? `<p class="text-gray-600">${this.escapeHtml(cust.email)}</p>` : ''}
                  ${cust.phone ? `<p class="text-gray-600">${this.escapeHtml(cust.phone)}</p>` : ''}
                </div>
                <div class="text-right">
                  <h3 class="text-sm text-gray-500 uppercase font-bold mb-2">From</h3>
                  <p class="font-bold text-lg text-gray-900">${this.escapeHtml(biz.name)}</p>
                  ${biz.address ? `<p class="text-gray-600">${this.escapeHtml(biz.address).replace(/\n/g, '<br>')}</p>` : ''}
                  ${biz.contact ? `<p class="text-gray-600">${this.escapeHtml(biz.contact)}</p>` : ''}
                </div>
              </div>
              <div class="grid grid-cols-2 gap-8"><div class="text-sm"><p class="text-gray-500 font-bold">Invoice Date</p><p class="text-gray-800">${tx.date}</p></div></div>
            </section>
            <section class="p-8">
              <h4 class="text-sm font-bold mb-2 text-gray-600">Service Rendered</h4>
              <table class="w-full text-left">
                <thead class="bg-gray-50"><tr class="text-xs text-gray-500 uppercase"><th class="p-3 w-full">Description</th><th class="p-3 text-right">Amount</th></tr></thead>
                <tbody><tr class="border-b">
                  <td class="p-3"><p class="font-medium text-gray-800">${this.escapeHtml(tx.category)}</p><p class="text-xs text-gray-500">${this.escapeHtml(tx.description)}</p></td>
                  <td class="p-3 text-right font-mono text-gray-800">LKR ${tx.amount.toFixed(2)}</td>
                </tr></tbody>
              </table>
              ${expensesHtml}
            </section>
            <footer class="p-8 border-t bg-gray-50 rounded-b-lg flex justify-end">
              <div class="text-right w-1/2 space-y-2">
                 <div class="flex justify-between"><p class="text-sm text-gray-500">Subtotal</p><p class="font-mono text-gray-800">LKR ${tx.amount.toFixed(2)}</p></div>
                 @if(totalCosts > 0) {
                   <div class="flex justify-between"><p class="text-sm text-gray-500">Total Costs</p><p class="font-mono text-gray-800">- LKR ${totalCosts.toFixed(2)}</p></div>
                 }
                 <div class="flex justify-between border-t pt-2 mt-2"><p class="text-lg font-bold">Total Due</p><p class="text-2xl font-bold text-gray-900">LKR ${tx.amount.toFixed(2)}</p></div>
              </div>
            </footer>
          </div>
          <div class="text-center mt-8 print:hidden"><button onclick="window.print()" class="bg-gray-800 text-white px-6 py-2 rounded">Print Invoice</button></div>
        </body>
      </html>`;
      
      const win = window.open('', '_blank');
      win?.document.write(invoiceHTML);
      win?.document.close();
  }
}