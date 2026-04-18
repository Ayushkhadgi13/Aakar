import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { colors, shadows } from '../theme';

const statuses = ['Pending', 'In Progress', 'Completed'];

export default function TasksScreen() {
  const { user } = useContext(AuthContext);
  const [myTasks, setMyTasks] = useState([]);
  const [assignedByMe, setAssignedByMe] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [users, setUsers] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks');
      setMyTasks(res.data.my_tasks);
      setAssignedByMe(res.data.assigned_by_me || []);
    } catch (e) {
      console.log(e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users-list');
      setUsers(res.data);
    } catch (e) {
      console.log(e);
    }
  };

  const createTask = async () => {
    try {
      await api.post('/tasks', {
        title,
        description,
        assigned_to: assignedTo,
        due_date: dueDate,
      });
      setModalVisible(false);
      setTitle('');
      setDescription('');
      setAssignedTo('');
      setDueDate('');
      fetchTasks();
    } catch (e) {
      alert('Failed to assign task');
    }
  };

  const updateStatus = async (task, status) => {
    try {
      await api.put(`/tasks/${task.id}`, { status });
      fetchTasks();
    } catch (e) {
      alert('Failed to update status');
    }
  };

  useEffect(() => {
    fetchTasks();
    if (user?.role === 'admin') fetchUsers();
  }, []);

  const getStatusStyle = (status) => {
    if (status === 'Completed') return { bg: colors.successSoft, text: colors.success };
    if (status === 'In Progress') return { bg: colors.primarySoft, text: colors.primary };
    return { bg: colors.warningSoft, text: colors.warning };
  };

  const renderTask = ({ item, index }) => {
    const statusStyle = getStatusStyle(item.status);

    return (
      <View style={[styles.card, index === 0 && styles.firstCard]}>
        <View style={styles.cardTop}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.badgeText, { color: statusStyle.text }]}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.desc}>{item.description || 'No description provided.'}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Due</Text>
          <Text style={styles.metaValue}>{item.due_date}</Text>
        </View>

        <View style={styles.actionRow}>
          {statuses.map((status) => {
            const active = item.status === status;
            return (
              <TouchableOpacity
                key={status}
                style={[styles.statusBtn, active && styles.activeStatusBtn]}
                onPress={() => updateStatus(item, status)}
              >
                <Text style={[styles.statusText, active && styles.activeStatusText]}>{status}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        style={styles.container}
        data={myTasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTask}
        ListHeaderComponent={(
          <>
            <View style={styles.header}>
              <View>
                <Text style={styles.eyebrow}>Task workspace</Text>
                <Text style={styles.pageTitle}>My Tasks</Text>
                <Text style={styles.pageSub}>Stay on top of deadlines and daily assignments.</Text>
              </View>
              {user?.role === 'admin' && (
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
                  <Text style={styles.addBtnText}>Assign</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Assigned to me</Text>
                <Text style={styles.summaryValue}>{myTasks.length}</Text>
              </View>
              {user?.role === 'admin' && (
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Assigned by me</Text>
                  <Text style={styles.summaryValue}>{assignedByMe.length}</Text>
                </View>
              )}
            </View>

            <Text style={styles.sectionTitle}>Assigned to Me</Text>
          </>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No tasks found.</Text>}
        ListFooterComponent={user?.role === 'admin' && assignedByMe.length > 0 ? (
          <View style={styles.secondarySection}>
            <Text style={styles.sectionTitle}>Assigned by Me</Text>
            {assignedByMe.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.taskTitle}>{item.title}</Text>
                  <View style={[styles.badge, { backgroundColor: getStatusStyle(item.status).bg }]}>
                    <Text style={[styles.badgeText, { color: getStatusStyle(item.status).text }]}>{item.status}</Text>
                  </View>
                </View>
                <Text style={styles.desc}>{item.description || 'No description provided.'}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Assignee</Text>
                  <Text style={styles.metaValue}>{item.assignee?.name || 'Unknown'}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Due</Text>
                  <Text style={styles.metaValue}>{item.due_date}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : <View style={{ height: 24 }} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Assign New Task</Text>
            <Text style={styles.modalSub}>Create a clean handoff for your team.</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput style={styles.input} placeholder="Task title" placeholderTextColor={colors.textMuted} value={title} onChangeText={setTitle} />
              <TextInput style={[styles.input, styles.textarea]} placeholder="Description" placeholderTextColor={colors.textMuted} value={description} onChangeText={setDescription} multiline />
              <TextInput style={styles.input} placeholder="Due date (YYYY-MM-DD)" placeholderTextColor={colors.textMuted} value={dueDate} onChangeText={setDueDate} />
              <Text style={styles.label}>Assign To</Text>
              <TextInput
                style={styles.input}
                placeholder={users.length ? `User ID e.g. ${users[0].id}` : 'User ID'}
                placeholderTextColor={colors.textMuted}
                value={assignedTo}
                onChangeText={setAssignedTo}
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.saveBtn} onPress={createTask}>
                <Text style={styles.saveBtnText}>Save Task</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8, marginBottom: 18 },
  eyebrow: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8 },
  pageTitle: { fontSize: 30, fontWeight: '900', color: colors.text },
  pageSub: { fontSize: 14, color: colors.textSoft, marginTop: 6, maxWidth: 250, lineHeight: 21 },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16 },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 16,
    ...shadows.soft,
  },
  summaryLabel: { fontSize: 11, fontWeight: '800', color: colors.textSoft, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  summaryValue: { fontSize: 24, fontWeight: '900', color: colors.text },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 12 },
  secondarySection: { paddingTop: 8 },
  card: {
    backgroundColor: colors.surface,
    padding: 18,
    marginBottom: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  firstCard: { marginTop: 4 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
  taskTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: colors.text },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  desc: { color: colors.textSoft, marginVertical: 10, lineHeight: 20, fontSize: 14 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10 },
  metaLabel: { fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', fontWeight: '800', letterSpacing: 0.8 },
  metaValue: { fontSize: 13, color: colors.text, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  statusBtn: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 14, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border },
  activeStatusBtn: { backgroundColor: colors.dark, borderColor: colors.dark },
  statusText: { fontSize: 12, color: colors.textSoft, fontWeight: '800' },
  activeStatusText: { color: '#fff' },
  emptyText: { textAlign: 'center', color: colors.textMuted, marginTop: 40, fontSize: 15 },
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(17,24,39,0.35)' },
  modalContent: {
    backgroundColor: colors.surface,
    padding: 22,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '80%',
  },
  modalHandle: {
    alignSelf: 'center',
    width: 52,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  modalTitle: { fontSize: 22, fontWeight: '900', color: colors.text },
  modalSub: { color: colors.textSoft, marginTop: 6, marginBottom: 18, lineHeight: 20 },
  input: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: colors.dark, padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  cancelBtn: { padding: 14, alignItems: 'center', marginTop: 6 },
  cancelBtnText: { color: colors.textSoft, fontWeight: '700' },
  label: { fontSize: 12, color: colors.textSoft, marginBottom: 8, textTransform: 'uppercase', fontWeight: '800', letterSpacing: 0.8 },
});
