import React, { useEffect, useState, useContext } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  RefreshControl, 
  TextInput, 
  Modal, 
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

export default function ProjectsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';

  const [projects, setProjects] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    client_name: '',
    location: '',
    budget: '',
    start_date: '',
    status: 'Upcoming',
    progress: '0'
  });

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects', { params: { search: searchQuery } });
      setProjects(res.data);
    } catch (e) {
      console.log('Error fetching projects', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProjects();
    setRefreshing(false);
  };

  useEffect(() => { 
    fetchProjects(); 
  }, [searchQuery]); // Re-fetch when search query changes

  // --- ADMIN FUNCTIONS ---
  const openCreateModal = () => {
    setIsEditing(false);
    setForm({ name: '', client_name: '', location: '', budget: '', start_date: '', status: 'Upcoming', progress: '0' });
    setShowModal(true);
  };

  const openEditModal = (project) => {
    setIsEditing(true);
    setEditId(project.id);
    setForm({
      name: project.name,
      client_name: project.client_name,
      location: project.location || '',
      budget: project.budget.toString(),
      start_date: project.start_date,
      status: project.status,
      progress: project.progress.toString()
    });
    setShowModal(true);
  };

  const saveProject = async () => {
    setIsSaving(true);
    try {
      const payload = { ...form, progress: parseInt(form.progress) || 0 };
      if (isEditing) {
        await api.put(`/projects/${editId}`, payload);
      } else {
        await api.post('/projects', payload);
      }
      setShowModal(false);
      fetchProjects();
    } catch (e) {
      Alert.alert("Error", "Failed to save project. Please check all fields.");
      console.log(e.response?.data || e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProject = (id) => {
    Alert.alert(
      "Delete Project",
      "Are you sure you want to delete this project? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/projects/${id}`);
              fetchProjects();
            } catch (e) {
              Alert.alert("Error", "Failed to delete project.");
            }
          }
        }
      ]
    );
  };

  // --- UI HELPERS ---
  const getProgressColor = (p) => p >= 75 ? '#10B981' : p >= 40 ? '#F59E0B' : '#EF4444';
  
  const getStatusStyle = (status) => {
    switch(status) {
      case 'Upcoming': return { bg: '#F1F5F9', text: '#475569' };
      case 'In Progress': return { bg: '#FEF3C7', text: '#B45309' };
      case 'On Hold': return { bg: '#FEE2E2', text: '#B91C1C' };
      case 'Completed': return { bg: '#DCFCE7', text: '#15803D' };
      default: return { bg: '#F1F5F9', text: '#475569' };
    }
  };

  const renderItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('ProjectDetails', { projectId: item.id })}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.statusBadge, { backgroundColor: statusStyle.bg, color: statusStyle.text }]}>
            {item.status}
          </Text>
        </View>

        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.client}>Client: {item.client_name}</Text>
        <Text style={styles.location}>📍 {item.location || 'N/A'}</Text>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressLabel}>{item.progress}%</Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${item.progress}%`, backgroundColor: getProgressColor(item.progress) }]} />
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.footerLabel}>Budget</Text>
            <Text style={styles.footerValue}>Rs. {Number(item.budget).toLocaleString()}</Text>
          </View>
          <View>
            <Text style={styles.footerLabel}>Start Date</Text>
            <Text style={styles.footerValue}>{item.start_date}</Text>
          </View>
        </View>

        {/* Admin Actions */}
        {isAdmin && (
          <View style={styles.adminActions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
              <Text style={styles.editBtnText}>✏️ Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteProject(item.id)}>
              <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header & Search */}
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Projects</Text>
          <Text style={styles.pageSubtitle}>Active construction sites</Text>
        </View>
        {isAdmin && (
          <TouchableOpacity style={styles.addBtn} onPress={openCreateModal}>
            <Text style={styles.addBtnText}>+ New</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput 
          style={styles.searchInput}
          placeholder="Search projects..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Project List */}
      <FlatList 
        data={projects}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏗️</Text>
            <Text style={styles.emptyText}>No projects found.</Text>
          </View>
        }
      />

      {/* CREATE / EDIT MODAL */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView 
          style={styles.modalBackdrop} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditing ? 'Edit Project' : 'New Project'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Project Name</Text>
              <TextInput style={styles.input} value={form.name} onChangeText={(val) => setForm({...form, name: val})} placeholder="e.g. Skyline Residency" />

              <Text style={styles.label}>Client Name</Text>
              <TextInput style={styles.input} value={form.client_name} onChangeText={(val) => setForm({...form, client_name: val})} placeholder="Full name or company" />

              <Text style={styles.label}>Location</Text>
              <TextInput style={styles.input} value={form.location} onChangeText={(val) => setForm({...form, location: val})} placeholder="City/Site Area" />

              <Text style={styles.label}>Budget (Rs.)</Text>
              <TextInput style={styles.input} value={form.budget} onChangeText={(val) => setForm({...form, budget: val})} keyboardType="numeric" placeholder="Min. Rs. 1" />

              <Text style={styles.label}>Start Date (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} value={form.start_date} onChangeText={(val) => setForm({...form, start_date: val})} placeholder="2026-01-01" />

              <Text style={styles.label}>Progress (%)</Text>
              <TextInput style={styles.input} value={form.progress} onChangeText={(val) => setForm({...form, progress: val})} keyboardType="numeric" placeholder="0 - 100" />

              <Text style={styles.label}>Status</Text>
              <View style={styles.statusRow}>
                {['Upcoming', 'In Progress', 'On Hold', 'Completed'].map(s => (
                  <TouchableOpacity 
                    key={s} 
                    style={[styles.statusSelectBtn, form.status === s && styles.statusSelectBtnActive]}
                    onPress={() => setForm({...form, status: s})}
                  >
                    <Text style={[styles.statusSelectText, form.status === s && styles.statusSelectTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={saveProject} disabled={isSaving}>
                <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save Project'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10 },
  pageTitle: { fontSize: 28, fontWeight: '900', color: '#111827' },
  pageSubtitle: { fontSize: 14, color: '#64748B', marginTop: 2 },
  addBtn: { backgroundColor: '#A65D43', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, marginTop: 10, paddingHorizontal: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  searchIcon: { marginRight: 10, fontSize: 16 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#111827' },

  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9' },
  cardHeader: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 },
  statusBadge: { fontSize: 10, fontWeight: 'bold', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, overflow: 'hidden', textTransform: 'uppercase' },
  
  title: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 5 },
  client: { fontSize: 14, color: '#475569', marginBottom: 5 },
  location: { fontSize: 13, color: '#64748B', fontWeight: '500', backgroundColor: '#F8F9FB', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },

  progressSection: { marginVertical: 20 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 13, fontWeight: '700', color: '#111827' },
  progressContainer: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4 },
  progressBar: { height: '100%', borderRadius: 4 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#F1F5F9', paddingTop: 15 },
  footerLabel: { fontSize: 10, color: '#94A3B8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  footerValue: { fontSize: 14, fontWeight: 'bold', color: '#111827' },

  adminActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderColor: '#F1F5F9' },
  editBtn: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  editBtnText: { color: '#475569', fontWeight: 'bold', fontSize: 12 },
  deleteBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  deleteBtnText: { color: '#B91C1C', fontWeight: 'bold', fontSize: 12 },

  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { color: '#64748B', fontSize: 16 },

  /* MODAL STYLES */
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 25, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  closeBtn: { fontSize: 24, color: '#64748B', paddingHorizontal: 10 },
  
  label: { fontSize: 12, fontWeight: 'bold', color: '#64748B', marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: '#F8F9FB', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 15, color: '#111827' },
  
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 10 },
  statusSelectBtn: { backgroundColor: '#F1F5F9', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
  statusSelectBtnActive: { backgroundColor: '#fff', borderColor: '#A65D43' },
  statusSelectText: { color: '#64748B', fontSize: 13, fontWeight: 'bold' },
  statusSelectTextActive: { color: '#A65D43' },

  saveBtn: { backgroundColor: '#111827', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 25, marginBottom: 20 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});