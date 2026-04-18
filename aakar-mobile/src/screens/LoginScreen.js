import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { BASE_URL } from '../api/axios';
import { colors, shadows } from '../theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useContext(AuthContext);

  const handleLogin = async () => {
    try {
      await login(email, password);
    } catch (error) {
      const backendMessage = error?.response?.data?.message;
      const networkMessage = error?.message === 'Network Error'
        ? `Cannot reach the backend at ${BASE_URL}.`
        : null;

      Alert.alert(
        'Login Failed',
        backendMessage || networkMessage || 'Unable to sign in. Please try again.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.heroGlowTop} />
        <View style={styles.heroGlowBottom} />

        <View style={styles.brandBox}>
          <Text style={styles.brandTitle}>AAKAR</Text>
          <Text style={styles.brandSubtitle}>CONSTRUCTION</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.eyebrow}>Team login</Text>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to manage projects, tasks, and daily operations.</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="name@aakar.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: colors.background,
  },
  heroGlowTop: {
    position: 'absolute',
    top: 40,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(166, 93, 67, 0.12)',
  },
  heroGlowBottom: {
    position: 'absolute',
    bottom: 40,
    left: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(166, 93, 67, 0.08)',
  },
  brandBox: { alignItems: 'center', marginBottom: 28 },
  brandTitle: { fontSize: 34, fontWeight: '900', color: colors.text, letterSpacing: 2 },
  brandSubtitle: { fontSize: 11, fontWeight: '700', color: colors.primary, letterSpacing: 5, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: { fontSize: 28, fontWeight: '900', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSoft, lineHeight: 22, marginTop: 8, marginBottom: 24 },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '800', color: colors.textSoft, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.dark,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },
});
