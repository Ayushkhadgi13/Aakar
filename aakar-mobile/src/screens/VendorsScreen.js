import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PackagePlus } from 'lucide-react-native';
import api from '../api/axios';
import { colors, shadows } from '../theme';

const initialVendorForm = {
  name: '',
  project_id: '',
  contact_person: '',
  phone: '',
  material_name: '',
  unit_price: '',
  quantity: '',
};
const initialMaterialForm = { vendorId: null, material_name: '', unit_price: '', quantity: '' };

export default function VendorsScreen() {
  const [vendors, setVendors] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [materialModalVisible, setMaterialModalVisible] = useState(false);
  const [vendorForm, setVendorForm] = useState(initialVendorForm);
  const [materialForm, setMaterialForm] = useState(initialMaterialForm);

  const fetchVendors = async () => {
    try {
      const [vendorRes, projectRes] = await Promise.all([
        api.get('/finance/vendors'),
        api.get('/projects'),
      ]);
      setVendors(vendorRes.data || []);
      setProjects(projectRes.data || []);
    } catch (e) {
      console.log('Error fetching vendors', e.response?.data || e.message);
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
    if (
      !vendorForm.name.trim() ||
      !vendorForm.project_id ||
      !vendorForm.material_name.trim() ||
      !vendorForm.unit_price ||
      !vendorForm.quantity
    ) {
      Alert.alert('Error', 'Please complete the vendor, project, and first material details.');
      return;
    }

    try {
      await api.post('/finance/vendors', {
        name: vendorForm.name,
        project_id: Number(vendorForm.project_id),
        contact_person: vendorForm.contact_person,
        phone: vendorForm.phone,
        materials: [
          {
            material_name: vendorForm.material_name,
            unit_price: Number(vendorForm.unit_price),
            quantity: Number(vendorForm.quantity),
          },
        ],
      });
      setModalVisible(false);
      setVendorForm(initialVendorForm);
      fetchVendors();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to create vendor.');
    }
  };

  const openMaterialModal = (vendorId) => {
    setMaterialForm({ ...initialMaterialForm, vendorId });
    setMaterialModalVisible(true);
  };

  const submitMaterial = async () => {
    if (!materialForm.material_name.trim() || !materialForm.unit_price || !materialForm.quantity) {
      Alert.alert('Error', 'Please fill in all material fields.');
      return;
    }

    try {
      await api.post(`/finance/vendors/${materialForm.vendorId}/materials`, {
        material_name: materialForm.material_name,
        unit_price: Number(materialForm.unit_price),
        quantity: Number(materialForm.quantity),
      });

      setMaterialModalVisible(false);
      setMaterialForm(initialMaterialForm);
      fetchVendors();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to add material.');
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const getInitials = (name) =>
    name?.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase();

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.avatarBox}>
          <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.vendorName}>{item.name}</Text>
          {item.project?.name ? <Text style={styles.vendorDetail}>Project: {item.project.name}</Text> : null}
          {item.contact_person || item.phone ? (
            <Text style={styles.vendorDetail}>Phone: {item.contact_person || item.phone}</Text>
          ) : null}
          {item.email ? <Text style={styles.vendorDetail}>Email: {item.email}</Text> : null}
          {item.address ? <Text style={styles.vendorDetail}>{item.address}</Text> : null}
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.materials?.length || 0} items</Text>
        </View>
      </View>

      {!!item.materials?.length && (
        <View style={styles.materialList}>
          {item.materials.slice(0, 3).map((material) => (
            <View key={material.id} style={styles.materialRow}>
              <Text style={styles.materialName}>{material.material_name}</Text>
              <Text style={styles.materialMeta}>
                {Number(material.quantity || 0).toLocaleString()} x Rs. {Number(material.unit_price || 0).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.secondaryButton} onPress={() => openMaterialModal(item.id)}>
        <PackagePlus color={colors.primary} size={16} />
        <Text style={styles.secondaryButtonText}>Add Material</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Supply network</Text>
            <Text style={styles.pageTitle}>Vendors</Text>
            <Text style={styles.pageSub}>{vendors.length} registered vendors</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={vendors}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={(
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No vendors yet</Text>
              <Text style={styles.emptySub}>Tap Add to register your first vendor.</Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Vendor</Text>

            <Text style={styles.inputLabel}>Vendor name</Text>
            <TextInput
              style={styles.input}
              placeholder="ABC Supplies"
              placeholderTextColor={colors.textMuted}
              value={vendorForm.name}
              onChangeText={(value) => setVendorForm((prev) => ({ ...prev, name: value }))}
            />

            <Text style={styles.inputLabel}>Project</Text>
            <View style={styles.projectChipWrap}>
              {projects.map((project) => {
                const selected = Number(vendorForm.project_id) === project.id;
                return (
                  <TouchableOpacity
                    key={project.id}
                    style={[styles.projectChip, selected && styles.projectChipActive]}
                    onPress={() => setVendorForm((prev) => ({ ...prev, project_id: String(project.id) }))}
                  >
                    <Text style={[styles.projectChipText, selected && styles.projectChipTextActive]}>
                      {project.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>Contact number</Text>
            <TextInput
              style={styles.input}
              placeholder="9800000000"
              placeholderTextColor={colors.textMuted}
              value={vendorForm.phone}
              onChangeText={(value) => setVendorForm((prev) => ({ ...prev, phone: value }))}
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Contact person</Text>
            <TextInput
              style={styles.input}
              placeholder="Site coordinator"
              placeholderTextColor={colors.textMuted}
              value={vendorForm.contact_person}
              onChangeText={(value) => setVendorForm((prev) => ({ ...prev, contact_person: value }))}
            />

            <Text style={styles.inputLabel}>First material name</Text>
            <TextInput
              style={styles.input}
              placeholder="Cement"
              placeholderTextColor={colors.textMuted}
              value={vendorForm.material_name}
              onChangeText={(value) => setVendorForm((prev) => ({ ...prev, material_name: value }))}
            />

            <Text style={styles.inputLabel}>Unit price</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              value={vendorForm.unit_price}
              onChangeText={(value) => setVendorForm((prev) => ({ ...prev, unit_price: value }))}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              value={vendorForm.quantity}
              onChangeText={(value) => setVendorForm((prev) => ({ ...prev, quantity: value }))}
              keyboardType="numeric"
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

      <Modal visible={materialModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Material</Text>

            <Text style={styles.inputLabel}>Material name</Text>
            <TextInput
              style={styles.input}
              placeholder="Cement"
              placeholderTextColor={colors.textMuted}
              value={materialForm.material_name}
              onChangeText={(value) => setMaterialForm((prev) => ({ ...prev, material_name: value }))}
            />

            <Text style={styles.inputLabel}>Unit price</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              value={materialForm.unit_price}
              onChangeText={(value) => setMaterialForm((prev) => ({ ...prev, unit_price: value }))}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              value={materialForm.quantity}
              onChangeText={(value) => setMaterialForm((prev) => ({ ...prev, quantity: value }))}
              keyboardType="numeric"
            />

            <TouchableOpacity style={styles.saveBtn} onPress={submitMaterial}>
              <Text style={styles.saveBtnText}>Add Material</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setMaterialModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  eyebrow: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8 },
  pageTitle: { fontSize: 30, fontWeight: '900', color: colors.text },
  pageSub: { fontSize: 14, color: colors.textSoft, marginTop: 6 },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 14 },
  addBtnText: { color: colors.surface, fontWeight: '800', fontSize: 14 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  avatarBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: { color: colors.surface, fontWeight: '900', fontSize: 16 },
  info: { flex: 1, paddingRight: 10 },
  vendorName: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 6 },
  vendorDetail: { fontSize: 12, color: colors.textSoft, marginTop: 3, lineHeight: 18 },
  badge: { backgroundColor: colors.successSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '800', color: colors.success },
  materialList: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  materialRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3EEE7' },
  materialName: { fontSize: 13, fontWeight: '800', color: colors.text },
  materialMeta: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  secondaryButton: {
    marginTop: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryButtonText: { color: colors.primary, fontWeight: '800', fontSize: 13, marginLeft: 8 },
  emptyBox: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 18, fontWeight: '800', color: colors.text },
  emptySub: { fontSize: 13, color: colors.textMuted, marginTop: 6 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(17, 24, 39, 0.45)' },
  modalContent: {
    backgroundColor: colors.surface,
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: '900', color: colors.text, marginBottom: 20 },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  projectChipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  projectChip: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  projectChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  projectChipText: { color: colors.textSoft, fontSize: 12, fontWeight: '700' },
  projectChipTextActive: { color: colors.primary },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    marginBottom: 14,
  },
  saveBtn: { backgroundColor: colors.dark, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: colors.surface, fontWeight: '800', fontSize: 16 },
  cancelBtn: { padding: 14, alignItems: 'center' },
  cancelBtnText: { color: colors.textMuted, fontWeight: '700' },
});
