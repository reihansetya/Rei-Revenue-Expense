"use server";

import { createClient } from "@/lib/supabase/server";
import type { Account, InvestmentGainLoss } from "@/types";

export async function getInvestmentAccounts(): Promise<Account[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .eq("type", "investment")
    .order("created_at", { ascending: true });

  if (error) return [];
  return data || [];
}

export async function getInvestmentGainLoss(): Promise<InvestmentGainLoss[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: accounts, error } = await supabase
    .from("accounts")
    .select(`id, name, balance, investment_balance_logs(gain_loss)`)
    .eq("user_id", user.id)
    .eq("type", "investment");

  if (error) return [];

  return (accounts || []).map((account) => {
    const logs = (account.investment_balance_logs as { gain_loss: number }[]) || [];
    const totalGainLoss = logs.reduce((sum, log) => sum + Number(log.gain_loss), 0);
    const currentBalance = Number(account.balance);
    const totalInvested = currentBalance - totalGainLoss;
    const percentage = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

    return {
      account_id: account.id,
      account_name: account.name,
      current_balance: currentBalance,
      total_invested: totalInvested,
      total_gain_loss: totalGainLoss,
      gain_loss_percentage: parseFloat(percentage.toFixed(2)),
    };
  });
}
