import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ChevronLeft, Layers3, Users } from 'lucide-react-native';
import api, { BASE_URL } from '../api/axios';
import { getEcho } from '../api/echo';
import { colors, shadows } from '../theme';

const TABS = {
  UPDATES: 'updates',
  TEAM: 'team',
};

export default function ProjectDetailsScreen({ route, navigation }) {
  const { projectId } = route.params;
  const [project, setProject] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [activeTab, setActiveTab] = useState(TABS.UPDATES);
  const [message, setMessage] = useState('');
  const [image, setImage] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    fetchDetails();
    const cleanupPromise = setupWebSockets();

    return () => {
      cleanupPromise.then((cleanup) => cleanup?.()).catch(() => null);
    };
  }, [projectId]);

  const fetchDetails = async () => {
    try {
      const [projectRes, teamRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/members`),
      ]);

      setProject(projectRes.data);
      setTeamMembers(teamRes.data || []);
    } catch (e) {
      console.log('Error fetching project details', e.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  const setupWebSockets = async () => {
    try {
      const echo = await getEcho();
      const channel = echo.private(`project.${projectId}`);

      channel.listen('.ProjectUpdatePosted', (e) => {
        setProject((prev) => ({
          ...prev,
          updates: [...(prev?.updates || []), e.update],
        }));
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      });

      return () => {
        echo.leave(`private-project.${projectId}`);
      };
    } catch (e) {
      console.log('Websocket setup failed', e.message);
      return null;
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const postUpdate = async () => {
    if (!message && !image) return;
    setIsPosting(true);

    const formData = new FormData();
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
      setProject((prev) => ({ ...prev, updates: [...(prev?.updates || []), res.data] }));
      setMessage('');
      setImage(null);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      console.log('Post failed', e.response?.data || e.message);
    } finally {
      setIsPosting(false);
    }
  };

  const getImageUrl = (path) => `${BASE_URL.replace('/api', '')}${path}`;

  const formatDate = (date) => {
    if (!date) return 'Not available';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'completed':
        return colors.success;
      case 'in progress':
        return colors.primary;
      case 'on hold':
        return colors.warning;
      default:
        return colors.textMuted;
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!project) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Project details could not be loaded.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ChevronLeft color={colors.textSoft} size={18} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.materialButton}
            onPress={() => navigation.navigate('MaterialComparison', { projectId, projectName: project.name })}
          >
            <Layers3 color={colors.primary} size={16} />
            <Text style={styles.materialButtonText}>Materials</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.titleBlock}>
            <Text style={styles.eyebrow}>Project workspace</Text>
            <Text style={styles.headerTitle}>{project.name}</Text>
            <Text style={styles.headerSub}>
              {project.client_name || 'Construction project'} . {project.location || 'Location not added'}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(project.status)}20` }]}>
                <Text style={[styles.statusText, { color: getStatusColor(project.status) }]}>{project.status}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Progress</Text>
              <Text style={styles.infoValue}>{project.progress || 0}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${project.progress || 0}%` }]} />
            </View>
          </View>

          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === TABS.UPDATES && styles.tabButtonActive]}
              onPress={() => setActiveTab(TABS.UPDATES)}
            >
              <Text style={[styles.tabText, activeTab === TABS.UPDATES && styles.tabTextActive]}>Live Updates</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === TABS.TEAM && styles.tabButtonActive]}
              onPress={() => setActiveTab(TABS.TEAM)}
            >
              <Text style={[styles.tabText, activeTab === TABS.TEAM && styles.tabTextActive]}>Team</Text>
            </TouchableOpacity>
          </View>

          {activeTab === TABS.UPDATES ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Live Site Updates</Text>
              <Text style={styles.sectionSub}>Photos and notes shared from the field.</Text>

              {project.updates?.length ? (
                project.updates.map((update) => (
                  <View key={update.id} style={styles.bubble}>
                    <Text style={styles.sender}>{update.user?.name} . {update.user?.role}</Text>
                    {update.message ? <Text style={styles.msgText}>{update.message}</Text> : null}
                    {update.image_path ? (
                      <Image source={{ uri: getImageUrl(update.image_path) }} style={styles.chatImage} />
                    ) : null}
                    <Text style={styles.metaText}>{formatDate(update.created_at)}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No live updates yet.</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.teamHeader}>
                <Text style={styles.sectionTitle}>Assigned Team</Text>
                <View style={styles.teamPill}>
                  <Users color={colors.primary} size={14} />
                  <Text style={styles.teamPillText}>{teamMembers.length}</Text>
                </View>
              </View>
              <Text style={styles.sectionSub}>People currently assigned to this project.</Text>

              {teamMembers.length ? (
                teamMembers.map((member) => (
                  <View key={member.id} style={styles.memberCard}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>{member.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <Text style={styles.memberRole}>{member.role?.toUpperCase() || 'USER'}</Text>
                      <Text style={styles.memberDate}>
                        Assigned {formatDate(member.pivot?.assigned_at || member.created_at)}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No team members assigned yet.</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {activeTab === TABS.UPDATES && (
          <View style={styles.inputArea}>
            {image && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                <TouchableOpacity onPress={() => setImage(null)}>
                  <Text style={styles.removeText}>Remove image</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.inputRow}>
              <TouchableOpacity onPress={pickImage} style={styles.iconBtn}>
                <Camera color={colors.textSoft} size={18} />
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="Write update..."
                placeholderTextColor={colors.textMuted}
                value={message}
                onChangeText={setMessage}
                multiline
              />
              <TouchableOpacity onPress={postUpdate} style={styles.sendBtn} disabled={isPosting}>
                <Text style={styles.sendBtnText}>{isPosting ? '...' : 'Post'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backText: { color: colors.textSoft, fontSize: 13, fontWeight: '800' },
  materialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  materialButtonText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  titleBlock: { marginBottom: 18 },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  headerTitle: { fontSize: 28, fontWeight: '900', color: colors.text },
  headerSub: { fontSize: 14, color: colors.textSoft, marginTop: 6, lineHeight: 21 },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { fontSize: 12, color: colors.textSoft, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  infoValue: { fontSize: 14, color: colors.text, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  progressBar: { height: 8, backgroundColor: colors.border, borderRadius: 999 },
  progressFill: { height: 8, backgroundColor: colors.primary, borderRadius: 999 },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    padding: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabButton: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  tabButtonActive: { backgroundColor: colors.surface, ...shadows.soft },
  tabText: { color: colors.textMuted, fontSize: 13, fontWeight: '800' },
  tabTextActive: { color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  sectionSub: { fontSize: 13, color: colors.textMuted, marginTop: 4, marginBottom: 14 },
  bubble: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sender: { fontSize: 11, color: colors.primary, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' },
  msgText: { fontSize: 14, color: colors.text, lineHeight: 21 },
  chatImage: { width: '100%', height: 200, borderRadius: 16, marginTop: 12, backgroundColor: colors.border },
  metaText: { marginTop: 10, fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  teamHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  teamPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  teamPillText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberAvatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  memberAvatarText: { color: colors.surface, fontSize: 18, fontWeight: '900' },
  memberInfo: { flex: 1 },
  memberName: { color: colors.text, fontSize: 15, fontWeight: '800' },
  memberRole: { color: colors.primary, fontSize: 11, fontWeight: '800', marginTop: 4, letterSpacing: 1 },
  memberDate: { color: colors.textMuted, fontSize: 12, marginTop: 5 },
  emptyBox: { paddingVertical: 30, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  inputArea: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 26 : 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    padding: 10,
    borderRadius: 16,
    marginBottom: 10,
  },
  imagePreview: { width: 54, height: 54, borderRadius: 12, marginRight: 12 },
  removeText: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end' },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 10,
    maxHeight: 110,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    backgroundColor: colors.dark,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  sendBtnText: { color: colors.surface, fontWeight: '800', fontSize: 13 },
});
