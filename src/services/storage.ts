import {MMKV} from 'react-native-mmkv';
import {CardExpense, FixedExpense, UserProfile} from '../types';

const store = new MMKV({id: 'finance-ai-store'});

// ─── Keys ────────────────────────────────────────────────────────────────────

const KEYS = {
  PROFILE:        'profile',
  FIXED_EXPENSES: 'fixed_expenses',
  CARD_EXPENSES:  'card_expenses',
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function get<T>(key: string, fallback: T): T {
  const raw = store.getString(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function set(key: string, value: unknown): void {
  store.set(key, JSON.stringify(value));
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export function getProfile(): UserProfile {
  return get<UserProfile>(KEYS.PROFILE, {name: '', monthlyIncome: 0, savingsGoal: 500});
}

export function saveProfile(profile: UserProfile): void {
  set(KEYS.PROFILE, profile);
}

// ─── Fixed Expenses ───────────────────────────────────────────────────────────

export function getFixedExpenses(): FixedExpense[] {
  return get<FixedExpense[]>(KEYS.FIXED_EXPENSES, []);
}

export function saveFixedExpenses(expenses: FixedExpense[]): void {
  set(KEYS.FIXED_EXPENSES, expenses);
}

export function addFixedExpense(expense: FixedExpense): void {
  const list = getFixedExpenses();
  list.push(expense);
  saveFixedExpenses(list);
}

export function removeFixedExpense(id: string): void {
  saveFixedExpenses(getFixedExpenses().filter(e => e.id !== id));
}

// ─── Card Expenses ────────────────────────────────────────────────────────────

export function getCardExpenses(): CardExpense[] {
  return get<CardExpense[]>(KEYS.CARD_EXPENSES, []);
}

export function saveCardExpenses(expenses: CardExpense[]): void {
  set(KEYS.CARD_EXPENSES, expenses);
}

export function addCardExpense(expense: CardExpense): void {
  const list = getCardExpenses();
  // Deduplicate by same amount + merchant within 60s window
  const isDupe = list.some(
    e =>
      e.merchant === expense.merchant &&
      e.amount === expense.amount &&
      Math.abs(e.timestamp - expense.timestamp) < 60_000,
  );
  if (isDupe) return;
  list.unshift(expense);
  saveCardExpenses(list);
}

export function updateCardExpense(updated: CardExpense): void {
  saveCardExpenses(
    getCardExpenses().map(e => (e.id === updated.id ? updated : e)),
  );
}

export function removeCardExpense(id: string): void {
  saveCardExpenses(getCardExpenses().filter(e => e.id !== id));
}

export function getExpensesForMonth(monthKey: string): CardExpense[] {
  return getCardExpenses().filter(e => e.monthKey === monthKey);
}

export function totalForMonth(monthKey: string): number {
  return getExpensesForMonth(monthKey).reduce((s, e) => s + e.amount, 0);
}

