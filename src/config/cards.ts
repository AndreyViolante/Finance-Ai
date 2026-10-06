// Finais dos cartões do Santander monitorados. Ficam no .env (fora do git):
// EXPO_PUBLIC_SANTANDER_CARDS=1234,5678
export const SANTANDER_CARDS: string[] = (process.env.EXPO_PUBLIC_SANTANDER_CARDS ?? '')
  .split(',')
  .map(card => card.trim())
  .filter(Boolean);
