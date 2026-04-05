import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

export default function TasksScreen() {
  const { user } = useContext(AuthContext);
  const [myTasks, setMyTasks] = useState([]);
  const [assignedByMe, setAssignedByMe] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [users, setUsers] = useState([]);
  
  // New Task Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks');
      setMyTasks(res.data.my_tasks);
      setAssignedByMe(res.data.assigned_by_me || []);
    } catch (e) { console.log(e); }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users-list');
      setUsers(res.data);
    } catch (e) { console.log(e); }
  };

  const createTask = async () => {
    try {
      await api.post('/tasks', { title, description, assigned_to: assignedTo, due_date: dueDate });
      setModalVisible(false);
      fetchTasks();
    } catch (e) { alert('Failed to assign task'); }
  };

  const updateStatus = async (task, status) => {
    try {
      await api.put(`/tasks/${task.id}`, { status });
      fetchTasks();
    } catch (e) { alert('Failed to update status'); }
  };

  useEffect(() => { 
    fetchTasks(); 
    if (user?.role === 'admin') fetchUsers();
  }, []);

  const renderTask = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <Text style={styles.badge}>{item.status}</Text>
      </View>
      <Text style={styles.desc}>{item.description}</Text>
      <Text style={styles.meta}>📅 Due: {item.due_date}</Text>

      {/* Basic Status toggler for mobile simplicity */}
      <View style={styles.actionRow}>
        {['Pending', 'In Progress', 'Completed'].map(status => (
          <TouchableOpacity 
            key={status} 
            style={[styles.statusBtn, item.status === status && styles.activeStatusBtn]}
            onPress={() => updateStatus(item, status)}
          >
            <Text style={[styles.statusText, item.status === status && styles.activeStatusText]}>{status}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Tasks</Text>
        {user?.role === 'admin' && (
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Assign Task</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={myTasks}
        keyExtractor={item => item.id.toString()}
        renderItem={renderTask}
        ListHeaderComponent={<Text style={styles.sectionTitle}>Assigned to Me</Text>}
      />

      {/* TASK MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Task</Text>
            <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
            <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} />
            <TextInput style={styles.input} placeholder="Due Date (YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate} />
            
            <Text style={styles.label}>Assign To (Enter User ID for now)</Text>
            <TextInput style={styles.input} placeholder="User ID" value={assignedTo} onChangeText={setAssignedTo} keyboardType="numeric" />

            <TouchableOpacity style={styles.saveBtn} onPress={createTask}><Text style={styles.saveBtnText}>Save Task</Text></TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}><Text style={{color: '#64748B'}}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB', paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 },
  pageTitle: { fontSize: 24, fontWeight: 'bold' },
  addBtn: { backgroundColor: '#A65D43', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: 'white', fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#64748B', margin: 20 },
  card: { backgroundColor: '#fff', padding: 20, marginHorizontal: 20, marginBottom: 15, borderRadius: 12, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  taskTitle: { fontSize: 16, fontWeight: 'bold' },
  badge: { backgroundColor: '#FEF3C7', color: '#B45309', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, fontSize: 12, fontWeight: 'bold' },
  desc: { color: '#475569', marginVertical: 8 },
  meta: { fontSize: 12, color: '#94A3B8', marginBottom: 15 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statusBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#F1F5F9' },
  activeStatusBtn: { backgroundColor: '#111827' },
  statusText: { fontSize: 12, color: '#64748B', fontWeight: 'bold' },
  activeStatusText: { color: '#fff' },
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', padding: 25, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: '#F8F9FB', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  saveBtn: { backgroundColor: '#111827', padding: 15, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: 'bold' },
  cancelBtn: { padding: 15, alignItems: 'center', marginTop: 5 },
  label: { fontSize: 12, color: '#64748B', marginBottom: 5 }
});