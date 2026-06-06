import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import {
  getProfile,
  saveProfile,
  getFixedExpenses,
  addFixedExpense,
  removeFixedExpense,
} from '../services/storage';
import {FixedExpense} from '../types';

export default function ProfileScreen() {
  const [name,          setName]          = useState('');
  const [income,        setIncome]        = useState('');
  const [savingsGoal,   setSavingsGoal]   = useState('500');
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [newFixedName,  setNewFixedName]  = useState('');
  const [newFixedAmt,   setNewFixedAmt]   = useState('');
  const [saved,         setSaved]         = useState(false);

  useEffect(() => {
    const p = getProfile();
    setName(p.name);
    setIncome(p.monthlyIncome > 0 ? String(p.monthlyIncome) : '');
    setSavingsGoal(p.savingsGoal > 0 ? String(p.savingsGoal) : '500');
    setFixedExpenses(getFixedExpenses());
  }, []);

  function handleSaveProfile() {
    const incomeNum = parseFloat(income.replace(',', '.'));
    const goalNum   = parseFloat(savingsGoal.replace(',', '.'));
    if (isNaN(incomeNum) || incomeNum <= 0) {
      Alert.alert('Renda inválida', 'Informe um valor numérico positivo.');
      return;
    }
    saveProfile({name: name.trim(), monthlyIncome: incomeNum, savingsGoal: isNaN(goalNum) ? 500 : goalNum});
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleAddFixed() {
    const amt = parseFloat(newFixedAmt.replace(',', '.'));
    if (!newFixedName.trim() || isNaN(amt) || amt <= 0) {
      Alert.alert('Dados inválidos', 'Preencha nome e valor da despesa fixa.');
      return;
    }
    const expense: FixedExpense = {
      id:     `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name:   newFixedName.trim(),
      amount: amt,
    };
    addFixedExpense(expense);
    setFixedExpenses(getFixedExpenses());
    setNewFixedName('');
    setNewFixedAmt('');
  }

  function handleRemoveFixed(id: string) {
    Alert.alert('Remover despesa', 'Confirma a remoção?', [
      {text: 'Cancelar', style: 'cancel'},
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          removeFixedExpense(id);
          setFixedExpenses(getFixedExpenses());
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView style={{flex: 1}} behavior="height">
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">

        {/* ── Perfil ── */}
        <Section title="Perfil">
          <Label>Nome</Label>
          <Input
            placeholder="Seu nome"
            value={name}
            onChangeText={setName}
          />
          <Label>Renda Mensal Líquida (R$)</Label>
          <Input
            placeholder="Ex: 5000.00"
            value={income}
            onChangeText={setIncome}
            keyboardType="numeric"
          />
          <Label>Meta de Economia Mensal (R$)</Label>
          <Input
            placeholder="Ex: 500.00"
            value={savingsGoal}
            onChangeText={setSavingsGoal}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
            <Text style={styles.saveBtnText}>
              {saved ? '✓ Salvo!' : 'Salvar Perfil'}
            </Text>
          </TouchableOpacity>
        </Section>

        {/* ── Despesas Fixas ── */}
        <Section title="Despesas Fixas">
          {fixedExpenses.length === 0 && (
            <Text style={styles.empty}>Nenhuma despesa fixa cadastrada.</Text>
          )}
          {fixedExpenses.map(e => (
            <View key={e.id} style={styles.fixedRow}>
              <View style={{flex: 1}}>
                <Text style={styles.fixedName}>{e.name}</Text>
                <Text style={styles.fixedAmt}>
                  {e.amount.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleRemoveFixed(e.id)}>
                <Text style={styles.removeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          <Text style={[styles.label, {marginTop: 16}]}>Adicionar despesa fixa</Text>
          <Input
            placeholder="Nome (ex: Aluguel, Internet)"
            value={newFixedName}
            onChangeText={setNewFixedName}
          />
          <Input
            placeholder="Valor (R$)"
            value={newFixedAmt}
            onChangeText={setNewFixedAmt}
            keyboardType="numeric"
          />
          <TouchableOpacity style={[styles.saveBtn, styles.addBtn]} onPress={handleAddFixed}>
            <Text style={styles.saveBtnText}>+ Adicionar</Text>
          </TouchableOpacity>
        </Section>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Label({children}: {children: string}) {
  return <Text style={styles.label}>{children}</Text>;
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor="#636e72"
      style={styles.input}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  container:    {flex: 1, backgroundColor: '#0f0f23', padding: 16},
  section: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {color: '#a29bfe', fontSize: 16, fontWeight: '700', marginBottom: 16},
  label:        {color: '#a0a0b0', fontSize: 12, marginBottom: 4},
  input: {
    backgroundColor: '#0f0f23',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  saveBtn: {
    backgroundColor: '#6C5CE7',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  addBtn:       {backgroundColor: '#00b894'},
  saveBtnText:  {color: '#fff', fontWeight: '700'},
  fixedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  fixedName:    {color: '#dfe6e9', fontSize: 14},
  fixedAmt:     {color: '#00b894', fontSize: 13, marginTop: 2},
  removeBtn:    {color: '#d63031', fontSize: 18, paddingHorizontal: 8},
  empty:        {color: '#636e72', textAlign: 'center', marginVertical: 12},
});
