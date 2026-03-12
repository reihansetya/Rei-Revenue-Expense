-- 1. Profiles Table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  telegram_id BIGINT UNIQUE,
  default_currency TEXT DEFAULT 'IDR',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Accounts Table
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bank', 'ewallet', 'cash', 'investment')),
  balance DECIMAL(15,2) DEFAULT 0,
  icon TEXT DEFAULT 'wallet',
  color TEXT DEFAULT '#3B82F6',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Categories Table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT DEFAULT 'tag',
  color TEXT DEFAULT '#3B82F6',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Transactions Table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  source TEXT DEFAULT 'web' CHECK (source IN ('web', 'telegram')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Transfers Table (Transfer antar akun)
CREATE TABLE transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  from_account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  to_account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  source TEXT DEFAULT 'web',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Security Policies (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own accounts" ON accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own categories" ON categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own transfers" ON transfers FOR ALL USING (auth.uid() = user_id);

-- Trigger for Auto-Creating Profile on Signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger for updating account balances on new transaction
create or replace function public.update_account_balance()
returns trigger
language plpgsql
as $$
begin
  if new.type = 'expense' then
    update accounts set balance = balance - new.amount where id = new.account_id;
  elsif new.type = 'income' then
    update accounts set balance = balance + new.amount where id = new.account_id;
  end if;
  return new;
end;
$$;

create trigger on_transaction_created
  after insert on transactions
  for each row execute procedure public.update_account_balance();

-- Trigger for updating account balances on transfer
create or replace function public.update_account_balance_on_transfer()
returns trigger
language plpgsql
as $$
begin
  update accounts set balance = balance - new.amount where id = new.from_account_id;
  update accounts set balance = balance + new.amount where id = new.to_account_id;
  return new;
end;
$$;

create trigger on_transfer_created
  after insert on transfers
  for each row execute procedure public.update_account_balance_on_transfer();
