import React, {useState, useCallback, useEffect, useRef} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  AppState,
} from 'react-native';

import {useNotificationListener} from '../hooks/useNotificationListener';
import {
  totalForMonth,
  getProfile,
  getFixedExpenses,
} from '../services/storage';

function getMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function fmt(value: number): string {
  return value.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
}

export default function DashboardScreen() {
  const [monthKey,   setMonthKey]   = useState(getMonthKey);
  const [totalCard,  setTotalCard]  = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const appState = useRef(AppState.currentState);

  function refresh() {
    const key = getMonthKey();
    setMonthKey(key);
    setTotalCard(totalForMonth(key));
  }

  useEffect(() => {
    refresh();
    // Re-check monthKey when app comes back to foreground (month rollover)
    const sub = AppState.addEventListener('change', next => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        refresh();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  useNotificationListener(refresh);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refresh();
    setRefreshing(false);
  }, []);

  const profile      = getProfile();
  const fixedTotal   = getFixedExpenses().reduce((s, e) => s + e.amount, 0);
  const savingsGoal  = profile.savingsGoal ?? 500;
  const spendingBudget = profile.monthlyIncome - fixedTotal - savingsGoal;
  const remaining      = spendingBudget - totalCard;
  const progress       = spendingBudget > 0 ? Math.min(totalCard / spendingBudget, 1) : 1;

  const goalStatus  = progress < 0.7 ? 'ok' : progress < 0.9 ? 'warning' : 'danger';
  const statusColor = {ok: '#00b894', warning: '#fdcb6e', danger: '#d63031'}[goalStatus];
  const statusEmoji = {ok: '✅', warning: '⚠️', danger: '🚨'}[goalStatus];
  const statusMsg   = remaining >= 0
    ? `Você ainda pode gastar ${fmt(remaining)} este mês.`
    : `Você ultrapassou o limite em ${fmt(Math.abs(remaining))}!`;

  const totalCommitted = fixedTotal + totalCard + savingsGoal;
  const percentCommitted = profile.monthlyIncome > 0
    ? (totalCommitted / profile.monthlyIncome) * 100
    : 0;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C5CE7" />
      }>

      {/* ── Meta de Economia ── */}
      <View style={[styles.goalCard, {borderColor: statusColor}]}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalTitle}>{statusEmoji} Meta de Economia</Text>
          <Text style={[styles.goalBadge, {backgroundColor: statusColor}]}>
            {fmt(savingsGoal)}/mês
          </Text>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {width: `${progress * 100}%` as any, backgroundColor: statusColor}]} />
        </View>

        <Text style={[styles.goalMsg, {color: statusColor}]}>{statusMsg}</Text>

        <View style={styles.goalDetails}>
          <GoalDetail label="Orçamento p/ gastos" value={fmt(spendingBudget)} />
          <GoalDetail label="Já gastou"           value={fmt(totalCard)} />
          <GoalDetail label="Restante"            value={fmt(remaining)} highlight={statusColor} />
        </View>
      </View>

      {/* ── Cards de resumo ── */}
      <View style={styles.row}>
        <SummaryCard label="Gastos no Cartão" value={fmt(totalCard)}             color="#e17055" />
        <SummaryCard label="Despesas Fixas"   value={fmt(fixedTotal)}            color="#fdcb6e" />
      </View>
      <View style={styles.row}>
        <SummaryCard label="Renda Mensal"     value={fmt(profile.monthlyIncome)} color="#00b894" />
        <SummaryCard label="Guardando"        value={fmt(savingsGoal)}           color="#a29bfe" />
      </View>

      {/* ── Resumo financeiro ── */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>📋 Resumo do Mês</Text>

        <Row label="Renda"          value={fmt(profile.monthlyIncome)} color="#00b894" />
        <Row label="Despesas fixas" value={`- ${fmt(fixedTotal)}`}     color="#fdcb6e" />
        <Row label="Gastos cartão"  value={`- ${fmt(totalCard)}`}      color="#e17055" />
        <Row label="Meta economia"  value={`- ${fmt(savingsGoal)}`}    color="#a29bfe" />

        <View style={styles.divider} />

        <Row
          label="Saldo livre"
          value={fmt(profile.monthlyIncome - totalCommitted)}
          color={profile.monthlyIncome - totalCommitted >= 0 ? '#00b894' : '#d63031'}
          bold
        />

        <Text style={styles.percentText}>
          {percentCommitted.toFixed(1)}% da renda comprometida
        </Text>
      </View>

    </ScrollView>
  );
}

function GoalDetail({label, value, highlight}: {label: string; value: string; highlight?: string}) {
  return (
    <View style={styles.goalDetailItem}>
      <Text style={styles.goalDetailLabel}>{label}</Text>
      <Text style={[styles.goalDetailValue, highlight ? {color: highlight} : {}]}>{value}</Text>
    </View>
  );
}

function SummaryCard({label, value, color}: {label: string; value: string; color: string}) {
  return (
    <View style={[styles.card, {borderLeftColor: color}]}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={[styles.cardValue, {color}]}>{value}</Text>
    </View>
  );
}

function Row({label, value, color, bold}: {label: string; value: string; color: string; bold?: boolean}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, bold && {fontWeight: '700', color: '#fff'}]}>{label}</Text>
      <Text style={[styles.summaryValue, {color}, bold && {fontSize: 16}]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0f0f23', padding: 16},

  goalCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
  },
  goalHeader:      {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12},
  goalTitle:       {color: '#fff', fontSize: 15, fontWeight: '700'},
  goalBadge:       {borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, fontSize: 12, fontWeight: '700', color: '#fff', overflow: 'hidden'},
  progressBar:     {height: 8, backgroundColor: '#2d2d44', borderRadius: 4, overflow: 'hidden', marginBottom: 10},
  progressFill:    {height: '100%', borderRadius: 4},
  goalMsg:         {fontSize: 13, fontWeight: '600', marginBottom: 14},
  goalDetails:     {flexDirection: 'row', justifyContent: 'space-between'},
  goalDetailItem:  {alignItems: 'center'},
  goalDetailLabel: {color: '#636e72', fontSize: 10, marginBottom: 2},
  goalDetailValue: {color: '#dfe6e9', fontSize: 13, fontWeight: '700'},

  row:       {flexDirection: 'row', gap: 12, marginBottom: 12},
  card:      {flex: 1, backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, borderLeftWidth: 4},
  cardLabel: {color: '#a0a0b0', fontSize: 12, marginBottom: 4},
  cardValue: {fontSize: 18, fontWeight: '700'},

  summaryCard:  {backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 16},
  summaryTitle: {color: '#a29bfe', fontSize: 15, fontWeight: '700', marginBottom: 14},
  summaryRow:   {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10},
  summaryLabel: {color: '#a0a0b0', fontSize: 13},
  summaryValue: {fontSize: 13, fontWeight: '600'},
  divider:      {height: 1, backgroundColor: '#2d2d44', marginVertical: 10},
  percentText:  {color: '#636e72', fontSize: 11, textAlign: 'right', marginTop: 8},
});
