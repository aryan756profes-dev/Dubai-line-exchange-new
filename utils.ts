import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export function generateRealisticUsername() {
  const names = [
    'Rahul', 'Aman', 'Vikash', 'Aryan', 'Suresh', 'Deepak', 'Arjun', 'Vijay', 
    'Prakash', 'Sunil', 'Amit', 'Rajesh', 'Sanjay', 'Rohit', 'Karan'
  ];
  const separators = ['@', '#', '_'];
  const name = names[Math.floor(Math.random() * names.length)];
  const separator = separators[Math.floor(Math.random() * separators.length)];
  const num = Math.floor(Math.random() * 99).toString().padStart(2, '0');
  return `${name}${separator}${num}`;
}

export function computeUserFinancials(balance: number, requiredWager: number, wagerCompleted: number) {
  const progressRatio = requiredWager > 0 ? Math.min(1, wagerCompleted / requiredWager) : 1;
  const withdrawableAmount = Math.floor(balance * progressRatio);
  return { progressRatio, withdrawableAmount };
}
