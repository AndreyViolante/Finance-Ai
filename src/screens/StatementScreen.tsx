import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {
  getCardExpenses,
  removeCardExpense,
  updateCardExpense,
  totalForMonth,
} from '../services/storage';
import {CardExpense} from '../types';

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function StatementScreen() {
  const [expenses,   setExpenses]   = useState<CardExpense[]>([]);
  const [editTarget, setEditTarget] = useState<CardExpense | null>(null);
  const [editAmt,    setEditAmt]    = useState('');
  const [editMerch,  setEditMerch]  = useState('');

  function load() {
    setExpenses(
      getCardExpenses().sort((a, b) => b.timestamp - a.timestamp),
    );
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  function handleDelete(id: string) {
    Alert.alert('Remover gasto', 'Remover este lançamento?', [
      {text: 'Cancelar', style: 'cancel'},
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => { removeCardExpense(id); load(); },
      },
    ]);
  }

  function openEdit(expense: CardExpense) {
    setEditTarget(expense);
    setEditAmt(String(expense.amount));
    setEditMerch(expense.merchant);
  }

  function handleSaveEdit() {
    if (!editTarget) return;
    const amt = parseFloat(editAmt.replace(',', '.'));
    if (isNaN(amt) || amt <= 0 || !editMerch.trim()) {
      Alert.alert('Dados inválidos');
      return;
    }
    updateCardExpense({...editTarget, amount: amt, merchant: editMerch.trim().toUpperCase()});
    setEditTarget(null);
    load();
  }

  const monthKey   = currentMonthKey();
  const monthTotal = totalForMonth(monthKey);

  return (
    <View style={styles.container}>
      {/* ── Month total ── */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Total no cartão este mês</Text>
        <Text style={styles.headerValue}>
          {monthTotal.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
        </Text>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={e => e.id}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={load} tintColor="#6C5CE7" />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            Nenhum gasto capturado ainda.{'\n'}
            Habilite o acesso a notificações e aguarde as transações.
          </Text>
        }
        renderItem={({item}) => (
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.merchant}>{item.merchant}</Text>
              <Text style={styles.meta}>
                {item.appName} • {new Date(item.timestamp).toLocaleDateString('pt-BR')}
              </Text>
            </View>
            <Text style={styles.amount}>
              {item.amount.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
            </Text>
            <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
              <Text style={styles.actionEdit}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
              <Text style={styles.actionDelete}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* ── Edit Modal ── */}
      <Modal visible={!!editTarget} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar Lançamento</Text>
            <Text style={styles.modalLabel}>Estabelecimento</Text>
            <TextInput
              style={styles.modalInput}
              value={editMerch}
              onChangeText={setEditMerch}
              placeholderTextColor="#636e72"
            />
            <Text style={styles.modalLabel}>Valor (R$)</Text>
            <TextInput
              style={styles.modalInput}
              value={editAmt}
              onChangeText={setEditAmt}
              keyboardType="numeric"
              placeholderTextColor="#636e72"
            />
            <View style={styles.modalRow}>
              <TouchableOpacity
                style={[styles.modalBtn, {backgroundColor: '#636e72'}]}
                onPress={() => setEditTarget(null)}>
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, {backgroundColor: '#6C5CE7'}]}
                onPress={handleSaveEdit}>
                <Text style={styles.modalBtnText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   {flex: 1, backgroundColor: '#0f0f23'},
  header: {
    backgroundColor: '#1a1a2e',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  headerLabel: {color: '#a0a0b0', fontSize: 12},
  headerValue: {color: '#00b894', fontSize: 24, fontWeight: '700', marginTop: 4},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 10,
    padding: 14,
  },
  rowLeft:      {flex: 1},
  merchant:     {color: '#dfe6e9', fontSize: 14, fontWeight: '600'},
  meta:         {color: '#636e72', fontSize: 11, marginTop: 2},
  amount:       {color: '#e17055', fontSize: 15, fontWeight: '700', marginRight: 8},
  actionBtn:    {paddingHorizontal: 4},
  actionEdit:   {fontSize: 16},
  actionDelete: {fontSize: 16},
  empty: {
    color: '#636e72',
    textAlign: 'center',
    marginTop: 60,
    lineHeight: 24,
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle:   {color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 20},
  modalLabel:   {color: '#a0a0b0', fontSize: 12, marginBottom: 4},
  modalInput: {
    backgroundColor: '#0f0f23',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  modalRow:     {flexDirection: 'row', gap: 12, marginTop: 4},
  modalBtn:     {flex: 1, borderRadius: 8, padding: 14, alignItems: 'center'},
  modalBtnText: {color: '#fff', fontWeight: '700'},
});
