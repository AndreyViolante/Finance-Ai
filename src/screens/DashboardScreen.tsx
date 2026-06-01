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

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
}

export default function DashboardScreen() {
  const [loading, setLoading]     = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<AIDiagnosis | null>(null);
  const [totalCard, setTotalCard] = useState(0);
  const [error, setError]         = useState<string | null>(null);

  const monthKey = currentMonthKey();

  function refresh() {
    setTotalCard(totalForMonth(monthKey));
    setDiagnosis(getDiagnosis());
  }

  useEffect(() => {
    refresh();
  }, []);

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

  const profile   = getProfile();
  const fixedTotal = getFixedExpenses().reduce((s, e) => s + e.amount, 0);
  const available  = profile.monthlyIncome - fixedTotal - totalCard;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C5CE7" />
      }>

      {/* ── Summary Cards ── */}
      <View style={styles.row}>
        <SummaryCard label="Gastos no Cartão" value={formatCurrency(totalCard)} color="#e17055" />
        <SummaryCard label="Despesas Fixas"   value={formatCurrency(fixedTotal)} color="#fdcb6e" />
      </View>
      <View style={styles.row}>
        <SummaryCard label="Renda Mensal"    value={formatCurrency(profile.monthlyIncome)} color="#00b894" />
        <SummaryCard label="Saldo Estimado"  value={formatCurrency(available)} color={available >= 0 ? '#6C5CE7' : '#d63031'} />
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
          <Text style={styles.diagnosisTitle}>
            Diagnóstico — {diagnosis.monthKey}
          </Text>
          <Text style={styles.diagnosisDate}>
            Gerado em {new Date(diagnosis.generatedAt).toLocaleString('pt-BR')}
          </Text>
          <Text style={styles.diagnosisContent}>{diagnosis.content}</Text>
        </View>
      )}

      {!diagnosis && !loading && (
        <View style={styles.emptyHint}>
          <Text style={styles.emptyHintText}>
            Toque em "Analisar com IA" para obter um diagnóstico financeiro
            personalizado com base nos seus gastos.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function SummaryCard({
  label, value, color,
}: {label: string; value: string; color: string}) {
  return (
    <View style={[styles.card, {borderLeftColor: color}]}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={[styles.cardValue, {color}]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   {flex: 1, backgroundColor: '#0f0f23', padding: 16},
  row:         {flexDirection: 'row', gap: 12, marginBottom: 12},
  card: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
  },
  cardLabel:   {color: '#a0a0b0', fontSize: 12, marginBottom: 4},
  cardValue:   {fontSize: 18, fontWeight: '700'},
  aiButton: {
    backgroundColor: '#6C5CE7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 16,
  },
  aiButtonDisabled: {opacity: 0.6},
  aiButtonText:     {color: '#fff', fontSize: 16, fontWeight: '700'},
  errorBox: {
    backgroundColor: '#3d1c1c',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText:       {color: '#ff7675', fontSize: 13},
  diagnosisCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  diagnosisTitle:   {color: '#a29bfe', fontSize: 16, fontWeight: '700', marginBottom: 4},
  diagnosisDate:    {color: '#636e72', fontSize: 11, marginBottom: 12},
  diagnosisContent: {color: '#dfe6e9', fontSize: 14, lineHeight: 22},
  emptyHint: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyHintText: {color: '#636e72', textAlign: 'center', lineHeight: 22},
});
