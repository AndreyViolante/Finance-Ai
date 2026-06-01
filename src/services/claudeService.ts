import axios from 'axios';
import Constants from 'expo-constants';
import {
  getProfile,
  getFixedExpenses,
  getExpensesForMonth,
  totalForMonth,
  saveDiagnosis,
} from './storage';
import {AIDiagnosis} from '../types';

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function buildPrompt(monthKey: string): string {
  const profile      = getProfile();
  const fixedList    = getFixedExpenses();
  const cardExpenses = getExpensesForMonth(monthKey);
  const totalCard    = totalForMonth(monthKey);
  const totalFixed   = fixedList.reduce((s, e) => s + e.amount, 0);
  const available    = profile.monthlyIncome - totalFixed - totalCard;

  const cardLines = cardExpenses
    .slice(0, 50)
    .map(e => `  - ${e.merchant}: R$ ${e.amount.toFixed(2)}`)
    .join('\n');

  const fixedLines = fixedList
    .map(e => `  - ${e.name}: R$ ${e.amount.toFixed(2)}`)
    .join('\n');

  return `Você é um analista financeiro pessoal especializado em finanças pessoais brasileiras. Seja direto, use formatação markdown, e sempre use R$ em valores monetários.

## Dados Financeiros — ${monthKey}

**Renda Mensal:** R$ ${profile.monthlyIncome.toFixed(2)}

**Despesas Fixas (R$ ${totalFixed.toFixed(2)} total):**
${fixedLines || '  (nenhuma cadastrada)'}

**Gastos no Cartão este mês (R$ ${totalCard.toFixed(2)} total — capturado via notificações):**
${cardLines || '  (nenhum gasto registrado ainda)'}

**Saldo disponível estimado:** R$ ${available.toFixed(2)}

---

Com base nesses dados, forneça:

1. **Diagnóstico Financeiro**: Avalie a saúde financeira atual, porcentagem da renda comprometida e padrões de consumo identificados.

2. **3 Pontos de Economia**: Liste 3 oportunidades concretas de redução de gastos, com valores estimados de economia mensal para cada um.

3. **Estratégia de Investimento**: Calcule o potencial de investimento mensal considerando uma reserva de emergência. Sugira alocação (ex: Tesouro Direto, CDB, fundos) compatível com o perfil identificado.

Seja objetivo. Use valores numéricos sempre que possível.`;
}

export async function generateDiagnosis(): Promise<AIDiagnosis> {
  const apiKey = Constants.expoConfig?.extra?.geminiApiKey as string | undefined;
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada no .env / app.config.js');

  const monthKey   = currentMonthKey();
  const prompt     = buildPrompt(monthKey);

  const response = await axios.post(
    `${GEMINI_API_URL}?key=${apiKey}`,
    {
      contents: [{parts: [{text: prompt}]}],
      generationConfig: {
        maxOutputTokens: 1024,
        temperature:     0.7,
      },
    },
    {
      headers: {'content-type': 'application/json'},
      timeout: 30_000,
    },
  );

  const content: string =
    response.data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!content) throw new Error('Resposta vazia da API Gemini');

  const diagnosis: AIDiagnosis = {
    content,
    generatedAt: Date.now(),
    totalSpent:  totalForMonth(monthKey),
    monthKey,
  };

  saveDiagnosis(diagnosis);
  return diagnosis;
}
