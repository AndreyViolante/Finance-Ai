export interface CardExpense {
  id: string;
  amount: number;
  merchant: string;
  rawText: string;
  appName: string;
  packageName: string;
  timestamp: number;
  /** month key: "2024-06" */
  monthKey: string;
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
}

export interface UserProfile {
  name: string;
  monthlyIncome: number;
  savingsGoal: number;
}

export interface AIDiagnosis {
  content: string;
  generatedAt: number;
  totalSpent: number;
  monthKey: string;
}

export interface RawNotificationPayload {
  packageName: string;
  appName: string;
  title: string;
  text: string;
  timestamp: number;
}
