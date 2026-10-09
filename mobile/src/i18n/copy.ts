import type { LanguageCode } from '../lib/model';

const en = {
  name: 'Cashweft',
  tagline: 'Your Money. Your Patterns. Your Privacy.',
  home: 'Home',
  activity: 'Activity',
  insights: 'Insights',
  budgets: 'Budgets',
  you: 'You',
  spent: 'Spent',
  income: 'Income',
  ask: 'Ask Cashweft',
  review: 'Needs review',
  cash: 'Estimated cash',
  language: 'Language',
  english: 'English',
  urdu: 'اردو',
};

const ur: typeof en = {
  name: 'کیش ویفٹ',
  tagline: 'آپ کا پیسہ۔ آپ کے پیٹرن۔ آپ کی پرائیویسی۔',
  home: 'ہوم',
  activity: 'سرگرمی',
  insights: 'جائزہ',
  budgets: 'بجٹ',
  you: 'آپ',
  spent: 'خرچ',
  income: 'آمدن',
  ask: 'کیش ویفٹ سے پوچھیں',
  review: 'جائزہ درکار',
  cash: 'تخمینی نقد',
  language: 'زبان',
  english: 'English',
  urdu: 'اردو',
};

export function copy(language: LanguageCode) {
  return language === 'ur' ? ur : en;
}
