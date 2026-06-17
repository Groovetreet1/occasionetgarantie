import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, useColorScheme, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PIN_KEY = '@mad_pin_code';

export default function PinScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const [pin, setPin] = useState(['', '', '', '']);
  const [mode, setMode] = useState<'unlock' | 'create' | 'confirm'>('unlock');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(PIN_KEY).then(saved => {
      if (!saved) setMode('create');
    });
  }, []);

  const handleChange = (val: string, idx: number) => {
    if (val.length > 1) return;
    const newPin = [...pin];
    newPin[idx] = val;
    setPin(newPin);
    setError('');

    if (val && idx < 3) {
      inputs.current[idx + 1]?.focus();
    }

    if (val && idx === 3) {
      const code = newPin.join('');
      setTimeout(() => handleSubmit(code), 200);
    }
  };

  const handleKeyPress = (key: string, idx: number) => {
    if (key === 'Backspace' && !pin[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleSubmit = async (code: string) => {
    if (mode === 'unlock') {
      const saved = await AsyncStorage.getItem(PIN_KEY);
      if (code === saved) {
        router.replace('/(tabs)');
      } else {
        setError('Code PIN incorrect');
        setPin(['', '', '', '']);
        inputs.current[0]?.focus();
      }
    } else if (mode === 'create') {
      setFirstPin(code);
      setMode('confirm');
      setPin(['', '', '', '']);
      setTimeout(() => inputs.current[0]?.focus(), 300);
    } else {
      if (code === firstPin) {
        await AsyncStorage.setItem(PIN_KEY, code);
        router.replace('/(tabs)');
      } else {
        setError('Les codes ne correspondent pas');
        setPin(['', '', '', '']);
        setMode('create');
        setFirstPin('');
        setTimeout(() => inputs.current[0]?.focus(), 300);
      }
    }
  };

  const bg = isDark ? '#0f172a' : '#f8fafc';
  const textColor = isDark ? '#f1f5f9' : '#1e293b';
  const muted = isDark ? '#94a3b8' : '#64748b';
  const inputBg = isDark ? '#1e293b' : '#e2e8f0';
  const border = isDark ? '#334155' : '#cbd5e1';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: '#05966920' }]}>
          <Ionicons name="lock-closed" size={36} color="#059669" />
        </View>

        <Text style={[styles.title, { color: textColor }]}>
          {mode === 'unlock' ? 'Déverrouiller' : mode === 'create' ? 'Créer un code PIN' : 'Confirmer le code PIN'}
        </Text>
        <Text style={[styles.subtitle, { color: muted }]}>
          {mode === 'unlock' ? 'Entrez votre code PIN' : mode === 'create' ? 'Choisissez un code à 4 chiffres' : 'Entrez à nouveau le code PIN'}
        </Text>

        <View style={styles.dotsRow}>
          {pin.map((val, i) => (
            <TextInput
              key={i}
              ref={ref => { inputs.current[i] = ref; }}
              value={val}
              onChangeText={v => handleChange(v, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={1}
              secureTextEntry
              selectTextOnFocus
              style={[
                styles.dotInput,
                {
                  backgroundColor: inputBg,
                  borderColor: val ? '#059669' : border,
                  color: textColor,
                },
                val ? styles.dotFilled : null,
              ]}
            />
          ))}
        </View>

        {error ? (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle" size={14} color="#f43f5e" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {mode === 'confirm' && (
          <TouchableOpacity onPress={() => { setMode('create'); setFirstPin(''); setPin(['','','','']); setError(''); }}
            style={{ marginTop: 16 }}>
            <Text style={{ color: '#059669', fontWeight: '600', fontSize: 13 }}>← Recommencer</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: '900', marginBottom: 8 },
  subtitle: { fontSize: 13, fontWeight: '500', marginBottom: 32, textAlign: 'center' },
  dotsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  dotInput: {
    width: 56, height: 64, borderRadius: 14, borderWidth: 2,
    textAlign: 'center', fontSize: 22, fontWeight: '800',
  },
  dotFilled: { borderWidth: 2 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  errorText: { color: '#f43f5e', fontSize: 13, fontWeight: '600' },
});
