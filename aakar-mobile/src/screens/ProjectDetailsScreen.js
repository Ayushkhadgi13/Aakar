import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../api/axios';
import { getEcho } from '../api/echo';

export default function ProjectDetailsScreen({ route, navigation }) {
  const { projectId } = route.params;
  const [project, setProject] = useState(null);
  const [message, setMessage] = useState('');
  const [image, setImage] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const scrollViewRef = useRef();

  useEffect(() => {
    fetchDetails();
    setupWebSockets();
  }, []);

  const fetchDetails = async () => {
    try {
      const res = await api.get(`/projects/${projectId}`);
      setProject(res.data);
    } catch (e) {
      console.log('Error fetching project details', e);
    }
  };

  const setupWebSockets = async () => {
    const echo = await getEcho();
    echo.private(`project.${projectId}`)
      .listen('.ProjectUpdatePosted', (e) => {
        setProject(prev => ({
          ...prev,
          updates: [...(prev.updates || []), e.update]
        }));
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      });
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const postUpdate = async () => {
    if (!message && !image) return;
    setIsPosting(true);
    
    let formData = new FormData();
    if (message) formData.append('message', message);
    if (image) {
      formData.append('image', {
        uri: image.uri,
        name: image.uri.split('/').pop(),
        type: 'image/jpeg',
      });
    }

    try {
      const res = await api.post(`/projects/${projectId}/updates`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProject(prev => ({ ...prev, updates: [...(prev.updates || []), res.data] }));
      setMessage('');
      setImage(null);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      console.log('Post failed', e);
    } finally {
      setIsPosting(false);
    }
  };

  const getImageUrl = (path) => {
    const host = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
    return `${host}${path}`;
  };

  if (!project) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#A65D43" />;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backBtn}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{project.name}</Text>
      </View>

      <ScrollView ref={scrollViewRef} style={styles.chatArea}>
        <View style={styles.infoCard}>
          <Text style={styles.label}>Status: <Text style={styles.status}>{project.status}</Text></Text>
          <Text style={styles.label}>Progress: {project.progress}%</Text>
        </View>

        <Text style={styles.feedTitle}>Live Site Updates</Text>
        {project.updates?.map(update => (
          <View key={update.id} style={styles.bubble}>
            <Text style={styles.sender}>{update.user?.name} ({update.user?.role})</Text>
            {update.message ? <Text style={styles.msgText}>{update.message}</Text> : null}
            {update.image_path ? (
              <Image source={{ uri: getImageUrl(update.image_path) }} style={styles.chatImage} />
            ) : null}
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputArea}>
        {image && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: image.uri }} style={styles.imagePreview} />
            <TouchableOpacity onPress={() => setImage(null)}><Text style={{ color: 'red' }}>✕ Remove</Text></TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          <TouchableOpacity onPress={pickImage} style={styles.iconBtn}><Text>📷</Text></TouchableOpacity>
          <TextInput 
            style={styles.input} 
            placeholder="Write update..." 
            value={message} 
            onChangeText={setMessage} 
            multiline 
          />
          <TouchableOpacity onPress={postUpdate} style={styles.sendBtn} disabled={isPosting}>
            <Text style={styles.sendBtnText}>{isPosting ? '...' : 'Post'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  header: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center' },
  backBtn: { color: '#64748B', fontWeight: 'bold', marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  infoCard: { backgroundColor: '#fff', padding: 15, margin: 15, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
  label: { fontWeight: 'bold', color: '#475569', marginBottom: 5 },
  status: { color: '#A65D43' },
  chatArea: { flex: 1, paddingHorizontal: 15 },
  feedTitle: { fontWeight: 'bold', color: '#64748B', marginVertical: 10 },
  bubble: { backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 10, alignSelf: 'flex-start', maxWidth: '85%' },
  sender: { fontSize: 10, color: '#A65D43', fontWeight: 'bold', marginBottom: 5 },
  msgText: { fontSize: 14, color: '#111827' },
  chatImage: { width: 200, height: 150, borderRadius: 10, marginTop: 10 },
  inputArea: { backgroundColor: '#fff', padding: 15, borderTopWidth: 1, borderColor: '#E2E8F0' },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginHorizontal: 10, maxHeight: 100 },
  iconBtn: { padding: 10 },
  sendBtn: { backgroundColor: '#111827', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20 },
  sendBtnText: { color: '#fff', fontWeight: 'bold' },
  imagePreviewContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  imagePreview: { width: 50, height: 50, borderRadius: 5, marginRight: 10 }
});