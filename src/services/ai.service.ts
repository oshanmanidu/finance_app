
import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env['AIzaSyAEMt74Ztvb54ZmdK6a76aqzdakqgLCIJA'] || '' });
  }

  async analyzeReceipt(base64Image: string): Promise<any> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
            { text: 'Analyze this receipt. Return a JSON object with keys: category (string, keep it short), amount (number), date (YYYY-MM-DD), description (string). If unsure, guess reasonable values.' }
          ]
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              date: { type: Type.STRING },
              description: { type: Type.STRING }
            }
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (e) {
      console.error('AI Error', e);
      return null;
    }
  }

  async getFinancialAdvice(summary: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a financial advisor for a freelance video producer with a family. 
        Here is their current financial snapshot JSON: ${summary}. 
        Provide 3 short, actionable bullet points of advice to improve savings or cut costs. 
        Be encouraging but realistic. Format as simple HTML (<ul><li>...</li></ul>).`
      });
      return response.text || '';
    } catch (e) {
      return '<ul><li>Could not generate advice at this moment.</li></ul>';
    }
  }

  async getDashboardAdvice(transactions: any[]): Promise<string> {
     try {
       const recent = transactions.slice(0, 5).map(t => `${t.type}: ${t.amount} (${t.category})`).join(', ');
       const response = await this.ai.models.generateContent({
         model: 'gemini-2.5-flash',
         contents: `Based on these recent transactions: [${recent}], give one single, short, 1-sentence helpful financial tip or observation for a freelancer.`
       });
       return response.text || 'Keep tracking your expenses to save more!';
     } catch (e) {
       return 'Track every penny to grow your business.';
     }
  }
}
