import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { BASE_URL } from '../api/axios';

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
    <View style={styles.container}>
      <View style={styles.brandBox}>
        <Text style={styles.brandTitle}>AAKAR</Text>
        <Text style={styles.brandSubtitle}>CONSTRUCTION</Text>
      </View>

      <Text style={styles.title}>Welcome Back</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>EMAIL ADDRESS</Text>
        <TextInput 
          style={styles.input} 
          placeholder="name@aakar.com" 
          value={email} 
          onChangeText={setEmail} 
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>PASSWORD</Text>
        <TextInput 
          style={styles.input} 
          placeholder="••••••••" 
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>SIGN IN</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 30, backgroundColor: '#F8F9FB' },
  brandBox: { alignItems: 'center', marginBottom: 50 },
  brandTitle: { fontSize: 32, fontWeight: '900', color: '#111827', letterSpacing: 2 },
  brandSubtitle: { fontSize: 12, fontWeight: '700', color: '#A65D43', letterSpacing: 4 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 30 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#64748B', marginBottom: 8 },
  input: { borderBottomWidth: 2, borderBottomColor: '#E2E8F0', paddingVertical: 10, fontSize: 16, color: '#111827' },
  button: { backgroundColor: '#111827', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
