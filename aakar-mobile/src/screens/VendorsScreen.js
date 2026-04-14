import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  RefreshControl, ActivityIndicator, TouchableOpacity, Modal,
  TextInput, Alert
} from 'react-native';
import api from '../api/axios';

export default function VendorsScreen() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const fetchVendors = async () => {
    try {
      const res = await api.get('/finance/vendors');
      setVendors(res.data);
    } catch (e) {
      console.log('Error fetching vendors', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVendors();
    setRefreshing(false);
  };

  const createVendor = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Vendor name is required.');
      return;
    }
    try {
      await api.post('/finance/vendors', { name, contact, email, address });
      setModalVisible(false);
      setName(''); setContact(''); setEmail(''); setAddress('');
      fetchVendors();
    } catch (e) {
      Alert.alert('Error', 'Failed to create vendor.');
    }
  };

  useEffect(() => { fetchVendors(); }, []);

  const getInitials = (name) => name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.avatarBox}>
        <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.vendorName}>{item.name}</Text>
        {item.email ? <Text style={styles.vendorDetail}>✉ {item.email}</Text> : null}
        {item.contact || item.phone
          ? <Text style={styles.vendorDetail}>📞 {item.contact || item.phone}</Text>
          : null}
        {item.address ? <Text style={styles.vendorDetail}>📍 {item.address}</Text> : null}
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Active</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#A65D43" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Vendors</Text>
          <Text style={styles.pageSub}>{vendors.length} registered vendors</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={vendors}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A65D43" />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🏢</Text>
            <Text style={styles.emptyText}>No vendors yet</Text>
            <Text style={styles.emptySub}>Tap + Add to register your first vendor</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 30 }}
      />

      {/* Add Vendor Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Vendor</Text>

            <Text style={styles.inputLabel}>VENDOR NAME *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. ABC Supplies"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.inputLabel}>CONTACT NUMBER</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 9800000000"
              value={contact}
              onChangeText={setContact}
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. vendor@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>ADDRESS</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Kathmandu, Nepal"
              value={address}
              onChangeText={setAddress}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={createVendor}>
              <Text style={styles.saveBtnText}>Save Vendor</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 55, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#E2E8F0',
  },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  pageSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  addBtn: { backgroundColor: '#A65D43', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12,
    padding: 16, borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  avatarBox: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: '#A65D43', justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  info: { flex: 1 },
  vendorName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  vendorDetail: { fontSize: 12, color: '#64748B', marginTop: 2 },
  badge: {
    backgroundColor: '#ECFDF5', paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#10B981' },

  emptyBox: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#111827' },
  emptySub: { fontSize: 13, color: '#94A3B8', marginTop: 6 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalContent: {
    backgroundColor: '#fff', padding: 24,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 20 },
  inputLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 1, marginBottom: 6 },
  input: {
    backgroundColor: '#F8F9FB', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 10, padding: 14, fontSize: 15, color: '#111827', marginBottom: 14,
  },
  saveBtn: { backgroundColor: '#111827', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelBtn: { padding: 14, alignItems: 'center' },
  cancelBtnText: { color: '#94A3B8', fontWeight: '600' },
});