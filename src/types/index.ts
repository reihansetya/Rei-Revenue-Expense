export type AccountType = 'bank' | 'ewallet' | 'cash' | 'investment';
export type CategoryType = 'income' | 'expense';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionSource = 'web' | 'telegram';
export type TransferType = 'regular' | 'investment' | 'divestment';

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
  // Relations
  accounts?: { name: string } | null;
  categories?: { name: string; icon: string; color: string } | null;
}

// ============================================
// NEW: TRANSFER TYPE
// ============================================

export interface Transfer {
  id: string;
  user_id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  description: string | null;
  date: string;
  source: string;
  transfer_type: TransferType;
  created_at: string;
  // Relations (joined dari Supabase)
  from_account?: {
    id: string;
    name: string;
    type: AccountType;
    icon: string;
    color: string;
  };
  to_account?: {
    id: string;
    name: string;
    type: AccountType;
    icon: string;
    color: string;
  };
}

export interface InvestmentBalanceLog {
  id: string;
  user_id: string;
  account_id: string;
  old_balance: number;
  new_balance: number;
  gain_loss: number;
  gain_loss_percentage: number;
  notes: string | null;
  created_at: string;
  account?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
}

export interface BalanceSummary {
  total: number;
  wallet: number;
  investment: number;
}

export interface InvestmentGainLoss {
  account_id: string;
  account_name: string;
  current_balance: number;
  total_invested: number;
  total_gain_loss: number;
  gain_loss_percentage: number;
}

// Type untuk form input
export interface TransferFormData {
  from_account_id: string;
  to_account_id: string;
  amount: number;
  date: string;
  description?: string;
}

// ============================================
// HIDE NOMINAL TYPES
// ============================================

export interface HideNominalContextType {
  isHidden: boolean;
  toggle: () => void;
  show: () => void;
  hide: () => void;
}
