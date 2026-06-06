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
  addCardExpense,
  totalForMonth,
} from '../services/storage';
import {CardExpense} from '../types';

const CARDS = [
  {label: 'Santander •••• XXXX', value: 'Santander •••• XXXX'},
  {label: 'Santander •••• YYYY (Online)', value: 'Santander •••• YYYY'},
  {label: 'Outro', value: 'Manual'},
];

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

type ModalMode = 'add' | 'edit' | null;

export default function StatementScreen() {
  const [expenses,   setExpenses]   = useState<CardExpense[]>([]);
  const [modalMode,  setModalMode]  = useState<ModalMode>(null);
  const [editTarget, setEditTarget] = useState<CardExpense | null>(null);

  // form fields
  const [fieldMerch, setFieldMerch] = useState('');
  const [fieldAmt,   setFieldAmt]   = useState('');
  const [fieldCard,  setFieldCard]  = useState(CARDS[0].value);

  function load() {
    setExpenses(getCardExpenses().sort((a, b) => b.timestamp - a.timestamp));
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  // ── Add manual ──────────────────────────────────────────────────────────────

  function openAdd() {
    setFieldMerch('');
    setFieldAmt('');
    setFieldCard(CARDS[0].value);
    setModalMode('add');
  }

  function handleAdd() {
    const amt = parseFloat(fieldAmt.replace(',', '.'));
    if (!fieldMerch.trim() || isNaN(amt) || amt <= 0) {
      Alert.alert('Dados inválidos', 'Preencha estabelecimento e valor.');
      return;
    }
    const now = Date.now();
    const monthKey = currentMonthKey();
    const expense: CardExpense = {
      id:          `manual-${now}-${Math.random().toString(36).slice(2, 5)}`,
      amount:      amt,
      merchant:    fieldMerch.trim().toUpperCase(),
      rawText:     `[manual] ${fieldMerch.trim()} R$ ${amt}`,
      appName:     fieldCard,
      packageName: 'manual',
      timestamp:   now,
      monthKey,
    };
    addCardExpense(expense);
    setModalMode(null);
    load();
  }

  // ── Edit ────────────────────────────────────────────────────────────────────

  function openEdit(expense: CardExpense) {
    setEditTarget(expense);
    setFieldMerch(expense.merchant);
    setFieldAmt(String(expense.amount));
    setFieldCard(expense.appName);
    setModalMode('edit');
  }

  function handleSaveEdit() {
    if (!editTarget) return;
    const amt = parseFloat(fieldAmt.replace(',', '.'));
    if (isNaN(amt) || amt <= 0 || !fieldMerch.trim()) {
      Alert.alert('Dados inválidos');
      return;
    }
    updateCardExpense({
      ...editTarget,
      amount:   amt,
      merchant: fieldMerch.trim().toUpperCase(),
      appName:  fieldCard,
    });
    setModalMode(null);
    setEditTarget(null);
    load();
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  function handleDelete(id: string) {
    Alert.alert('Remover gasto', 'Remover este lançamento?', [
      {text: 'Cancelar', style: 'cancel'},
      {text: 'Remover', style: 'destructive', onPress: () => { removeCardExpense(id); load(); }},
    ]);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const monthKey   = currentMonthKey();
  const monthTotal = totalForMonth(monthKey);
  const isAdd      = modalMode === 'add';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>Total no cartão este mês</Text>
          <Text style={styles.headerValue}>
            {monthTotal.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Adicionar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={e => e.id}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor="#6C5CE7" />}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Nenhum gasto ainda.{'\n'}
            Toque em "+ Adicionar" para lançar manualmente.
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
              <Text>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
              <Text>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Add / Edit Modal */}
      <Modal visible={!!modalMode} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {isAdd ? '+ Adicionar Gasto' : 'Editar Lançamento'}
            </Text>

            <Text style={styles.modalLabel}>Cartão</Text>
            <View style={styles.cardSelector}>
              {CARDS.map(c => (
                <TouchableOpacity
                  key={c.value}
                  style={[styles.cardChip, fieldCard === c.value && styles.cardChipActive]}
                  onPress={() => setFieldCard(c.value)}>
                  <Text style={[styles.cardChipText, fieldCard === c.value && styles.cardChipTextActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Estabelecimento</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: IFOOD, SUPERMERCADO..."
              placeholderTextColor="#636e72"
              value={fieldMerch}
              onChangeText={setFieldMerch}
              autoCapitalize="characters"
            />

            <Text style={styles.modalLabel}>Valor (R$)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="0,00"
              placeholderTextColor="#636e72"
              value={fieldAmt}
              onChangeText={setFieldAmt}
              keyboardType="numeric"
            />

            <View style={styles.modalRow}>
              <TouchableOpacity
                style={[styles.modalBtn, {backgroundColor: '#636e72'}]}
                onPress={() => { setModalMode(null); setEditTarget(null); }}>
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, {backgroundColor: '#6C5CE7'}]}
                onPress={isAdd ? handleAdd : handleSaveEdit}>
                <Text style={styles.modalBtnText}>{isAdd ? 'Adicionar' : 'Salvar'}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLabel: {color: '#a0a0b0', fontSize: 12},
  headerValue: {color: '#00b894', fontSize: 22, fontWeight: '700', marginTop: 4},
  addBtn: {
    backgroundColor: '#6C5CE7',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addBtnText:   {color: '#fff', fontWeight: '700', fontSize: 13},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 10,
    padding: 14,
  },
  rowLeft:  {flex: 1},
  merchant: {color: '#dfe6e9', fontSize: 14, fontWeight: '600'},
  meta:     {color: '#636e72', fontSize: 11, marginTop: 2},
  amount:   {color: '#e17055', fontSize: 15, fontWeight: '700', marginRight: 8},
  actionBtn:{paddingHorizontal: 4},
  empty: {
    color: '#636e72',
    textAlign: 'center',
    marginTop: 60,
    lineHeight: 24,
    paddingHorizontal: 32,
  },
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end'},
  modalCard: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle:  {color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 20},
  modalLabel:  {color: '#a0a0b0', fontSize: 12, marginBottom: 6},
  modalInput: {
    backgroundColor: '#0f0f23',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  cardSelector:       {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16},
  cardChip: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#2d2d44',
    backgroundColor: '#0f0f23',
  },
  cardChipActive:     {borderColor: '#6C5CE7', backgroundColor: '#2d2060'},
  cardChipText:       {color: '#636e72', fontSize: 12},
  cardChipTextActive: {color: '#a29bfe', fontWeight: '700'},
  modalRow:    {flexDirection: 'row', gap: 12, marginTop: 4},
  modalBtn:    {flex: 1, borderRadius: 8, padding: 14, alignItems: 'center'},
  modalBtnText:{color: '#fff', fontWeight: '700'},
});
