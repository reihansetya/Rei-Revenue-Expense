export type AccountType = 'bank' | 'ewallet' | 'cash' | 'investment';
export type CategoryType = 'income' | 'expense';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionSource = 'web' | 'telegram';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  telegram_id: number | null;
  default_currency: string;
  created_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string | null;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  description: string | null;
  date: string;
  source: TransactionSource;
  created_at: string;
}
