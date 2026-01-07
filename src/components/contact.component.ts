
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService, ColorTheme } from '../services/store.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-4xl mx-auto py-10 space-y-8 pb-20">
       <div class="text-center">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white">Contact Support</h2>
          <p class="text-gray-500 dark:text-neutral-400 mt-2">Need help with Finance Manager? We are here for you.</p>
       </div>

       <div class="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
          <div class="md:flex">
             <div class="md:w-1/2 bg-brand-600 p-10 text-white flex flex-col justify-between">
                <div>
                   <h3 class="text-2xl font-bold mb-4">Mezota Systems</h3>
                   <p class="text-brand-100 mb-8">Delivering premium financial software solutions for freelancers and small businesses.</p>
                </div>
                <div class="space-y-4">
                   <div class="flex items-center space-x-4">
                      <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                         <i class="fa-solid fa-phone"></i>
                      </div>
                      <span class="font-medium">+94 77 123 4567</span>
                   </div>
                   <div class="flex items-center space-x-4">
                      <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                         <i class="fa-solid fa-envelope"></i>
                      </div>
                      <span class="font-medium">support@mezota.com</span>
                   </div>
                   <div class="flex items-center space-x-4">
                      <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                         <i class="fa-solid fa-location-dot"></i>
                      </div>
                      <span class="font-medium">123 Tech Park, Colombo, LK</span>
                   </div>
                </div>
             </div>
             
             <div class="md:w-1/2 p-10">
                <div class="text-center flex flex-col items-center justify-center h-full space-y-6">
                    <div class="w-24 h-24 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                       <i class="fa-solid fa-headset text-4xl text-brand-600 dark:text-brand-400"></i>
                    </div>
                    <div>
                       <h4 class="text-xl font-bold text-gray-900 dark:text-white">24/7 Premium Support</h4>
                       <p class="text-gray-500 dark:text-neutral-400 mt-2">Our technical team is ready to assist you with any sync issues or feature requests.</p>
                    </div>
                    <button class="bg-gray-900 dark:bg-neutral-600 text-white px-6 py-3 rounded-full font-bold hover:bg-gray-800 dark:hover:bg-neutral-500 transition w-full">
                       Open Live Chat
                    </button>
                </div>
             </div>
          </div>
       </div>

       <!-- Theme Personalization -->
       <div class="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg border border-gray-200 dark:border-neutral-800 p-8">
          <div class="flex items-center space-x-3 mb-6">
             <i class="fa-solid fa-palette text-brand-600 text-2xl"></i>
             <h3 class="text-xl font-bold text-gray-900 dark:text-white">Personalize App</h3>
          </div>
          <p class="text-gray-500 dark:text-neutral-400 mb-6 text-sm">Choose a primary color theme for your application.</p>
          
          <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-4">
             @for (color of colors; track color.name) {
                <button (click)="store.setColorTheme(color.name)" 
                  class="flex flex-col items-center space-y-2 group focus:outline-none" 
                  title="{{ color.name }}">
                   <div [style.background-color]="'rgb(' + color.rgb + ')'" 
                        class="w-10 h-10 rounded-full shadow-md border-2 transition-transform transform group-hover:scale-110"
                        [class.border-white]="store.colorTheme() !== color.name"
                        [class.dark:border-neutral-800]="store.colorTheme() !== color.name"
                        [class.ring-2]="store.colorTheme() === color.name"
                        [class.ring-offset-2]="store.colorTheme() === color.name"
                        [class.ring-gray-900]="store.colorTheme() === color.name"
                        [class.dark:ring-white]="store.colorTheme() === color.name">
                   </div>
                </button>
             }
          </div>
       </div>
    </div>
  `
})
export class ContactComponent {
  store = inject(StoreService);

  colors: { name: ColorTheme, rgb: string }[] = [
    { name: 'Amber', rgb: '217 119 6' },
    { name: 'Red', rgb: '220 38 38' },
    { name: 'Orange', rgb: '234 88 12' },
    { name: 'Green', rgb: '22 163 74' },
    { name: 'Emerald', rgb: '5 150 105' },
    { name: 'Teal', rgb: '13 148 136' },
    { name: 'Cyan', rgb: '8 145 178' },
    { name: 'Sky', rgb: '2 132 199' },
    { name: 'Blue', rgb: '37 99 235' },
    { name: 'Indigo', rgb: '79 70 229' },
    { name: 'Violet', rgb: '124 58 237' },
    { name: 'Rose', rgb: '225 29 72' },
  ];
}
