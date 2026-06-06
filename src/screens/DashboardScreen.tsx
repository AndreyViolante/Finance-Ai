import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';

import {useNotificationListener} from '../hooks/useNotificationListener';
import {generateDiagnosis} from '../services/claudeService';
import {
  totalForMonth,
  getDiagnosis,
  getProfile,
  getFixedExpenses,
} from '../services/storage';
import {AIDiagnosis} from '../types';

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function fmt(value: number): string {
  return value.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
}

export default function DashboardScreen() {
  const [loading,    setLoading]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [diagnosis,  setDiagnosis]  = useState<AIDiagnosis | null>(null);
  const [totalCard,  setTotalCard]  = useState(0);
  const [error,      setError]      = useState<string | null>(null);

  const monthKey = currentMonthKey();

  function refresh() {
    setTotalCard(totalForMonth(monthKey));
    setDiagnosis(getDiagnosis());
  }

  useEffect(() => { refresh(); }, []);
  useNotificationListener(refresh);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refresh();
    setRefreshing(false);
  }, []);

  async function handleGenerateDiagnosis() {
    setLoading(true);
    setError(null);
    try {
      const result = await generateDiagnosis();
      setDiagnosis(result);
      setTotalCard(totalForMonth(monthKey));
    } catch (err: any) {
      setError(err?.message ?? 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  const profile     = getProfile();
  const fixedTotal  = getFixedExpenses().reduce((s, e) => s + e.amount, 0);
  const savingsGoal = profile.savingsGoal ?? 500;

  // Quanto pode gastar no cartão sem comprometer a meta
  const spendingBudget = profile.monthlyIncome - fixedTotal - savingsGoal;
  const remaining      = spendingBudget - totalCard;
  const progress       = spendingBudget > 0
    ? Math.min(totalCard / spendingBudget, 1)
    : 1;

  // Status: verde < 70% | amarelo 70–90% | vermelho > 90%
  const goalStatus =
    progress < 0.7 ? 'ok' :
    progress < 0.9 ? 'warning' : 'danger';

  const statusColor = {ok: '#00b894', warning: '#fdcb6e', danger: '#d63031'}[goalStatus];
  const statusEmoji = {ok: '✅', warning: '⚠️', danger: '🚨'}[goalStatus];
  const statusMsg   =
    remaining >= 0
      ? `Você ainda pode gastar ${fmt(remaining)} este mês.`
      : `Você ultrapassou o limite em ${fmt(Math.abs(remaining))}!`;

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

        {/* Barra de progresso */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {width: `${progress * 100}%` as any, backgroundColor: statusColor}]} />
        </View>

        <Text style={[styles.goalMsg, {color: statusColor}]}>{statusMsg}</Text>

        <View style={styles.goalDetails}>
          <GoalDetail label="Orçamento p/ gastos" value={fmt(spendingBudget)} />
          <GoalDetail label="Já gastou" value={fmt(totalCard)} />
          <GoalDetail label="Restante" value={fmt(remaining)} highlight={statusColor} />
        </View>
      </View>

      {/* ── Summary Cards ── */}
      <View style={styles.row}>
        <SummaryCard label="Gastos no Cartão" value={fmt(totalCard)}            color="#e17055" />
        <SummaryCard label="Despesas Fixas"   value={fmt(fixedTotal)}           color="#fdcb6e" />
      </View>
      <View style={styles.row}>
        <SummaryCard label="Renda Mensal"     value={fmt(profile.monthlyIncome)} color="#00b894" />
        <SummaryCard label="Guardando"        value={fmt(savingsGoal)}           color="#a29bfe" />
      </View>

      {/* ── AI Button ── */}
      <TouchableOpacity
        style={[styles.aiButton, loading && styles.aiButtonDisabled]}
        onPress={handleGenerateDiagnosis}
        disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.aiButtonText}>✨ Analisar com IA</Text>
        }
      </TouchableOpacity>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* ── Diagnosis ── */}
      {diagnosis && (
        <View style={styles.diagnosisCard}>
          <Text style={styles.diagnosisTitle}>Diagnóstico — {diagnosis.monthKey}</Text>
          <Text style={styles.diagnosisDate}>
            Gerado em {new Date(diagnosis.generatedAt).toLocaleString('pt-BR')}
          </Text>
          <Text style={styles.diagnosisContent}>{diagnosis.content}</Text>
        </View>
      )}

      {!diagnosis && !loading && (
        <View style={styles.emptyHint}>
          <Text style={styles.emptyHintText}>
            Toque em "Analisar com IA" para obter um diagnóstico financeiro personalizado.
          </Text>
        </View>
      )}
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

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0f0f23', padding: 16},

  goalCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
  },
  goalHeader:    {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12},
  goalTitle:     {color: '#fff', fontSize: 15, fontWeight: '700'},
  goalBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    overflow: 'hidden',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2d2d44',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill:  {height: '100%', borderRadius: 4},
  goalMsg:       {fontSize: 13, fontWeight: '600', marginBottom: 14},
  goalDetails:   {flexDirection: 'row', justifyContent: 'space-between'},
  goalDetailItem:{alignItems: 'center'},
  goalDetailLabel:{color: '#636e72', fontSize: 10, marginBottom: 2},
  goalDetailValue:{color: '#dfe6e9', fontSize: 13, fontWeight: '700'},

  row:       {flexDirection: 'row', gap: 12, marginBottom: 12},
  card: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
  },
  cardLabel: {color: '#a0a0b0', fontSize: 12, marginBottom: 4},
  cardValue: {fontSize: 18, fontWeight: '700'},

  aiButton:         {backgroundColor: '#6C5CE7', borderRadius: 12, padding: 16, alignItems: 'center', marginVertical: 16},
  aiButtonDisabled: {opacity: 0.6},
  aiButtonText:     {color: '#fff', fontSize: 16, fontWeight: '700'},

  errorBox:  {backgroundColor: '#3d1c1c', borderRadius: 8, padding: 12, marginBottom: 12},
  errorText: {color: '#ff7675', fontSize: 13},

  diagnosisCard:    {backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 16},
  diagnosisTitle:   {color: '#a29bfe', fontSize: 16, fontWeight: '700', marginBottom: 4},
  diagnosisDate:    {color: '#636e72', fontSize: 11, marginBottom: 12},
  diagnosisContent: {color: '#dfe6e9', fontSize: 14, lineHeight: 22},

  emptyHint:     {backgroundColor: '#1a1a2e', borderRadius: 12, padding: 20, alignItems: 'center', marginTop: 8},
  emptyHintText: {color: '#636e72', textAlign: 'center', lineHeight: 22},
});
