
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export interface MonthlyData {
  name: string;
  income: number;
  expense: number;
}

export enum AspectRatio {
  Square = "1:1",
  Standard = "4:3",
  Portrait = "3:4",
  Widescreen = "16:9",
  Vertical = "9:16",
  Cinematic = "21:9",
  Photo = "3:2",
  Landscape = "2:3",
}

export interface GeminiResponse {
  text: string;
  image?: string;
  sources?: Array<{ title: string; uri: string }>;
}

export type Language = 'es' | 'en';
export type Currency = '€' | '$' | '£';
export type Theme = 'dark' | 'light' | 'system';

export interface RecurringItem {
  id: string;
  label: string;
  type: TransactionType;
  category: string;
  defaultAmount: number;
  icon: string;
  dayOfMonth?: number; // The day (1-31) this transaction occurs
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  customCategories?: string[]; // Optional: store custom categories here if needed
}
