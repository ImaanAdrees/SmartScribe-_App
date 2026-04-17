import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, Alert, DeviceEventEmitter } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function RecordingsScreen() {
  const router = useRouter();

  const [recordings, setRecordings] = useState<any[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [transcribingId, setTranscribingId] = useState<string | null>(null);
  const player = useAudioPlayer('');
  const status = useAudioPlayerStatus(player);

  const fetchRecordings = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) { console.warn('No user token found'); return; }

      const res = await fetch(`${API_URL}/api/recording/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) { console.warn('Fetch recordings failed', res.status); return; }

      const data = await res.json();
      if (data && data.success) {
        setRecordings(Array.isArray(data.recordings) ? data.recordings : []);
      }
    } catch (err) {
      console.error('Fetch recordings error', err);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchRecordings();
      return () => { };
    }, [])
  );

  useEffect(() => {
    const listener = DeviceEventEmitter.addListener('recordingUploaded', (payload: any) => {
      try {
        if (payload && payload.recording) {
          setRecordings((prev) => [payload.recording, ...prev]);
        } else {
          fetchRecordings();
        }
      } catch (e) {
        console.warn('Error handling recordingUploaded event', e);
        fetchRecordings();
      }
    });
    return () => { listener.remove(); };
  }, []);

  const insets = useSafeAreaInsets();

  const replayRecording = async (item: any) => {
    await playRecording(item, true);
  };

  const playRecording = async (item: any, restart = false) => {
    try {
      const uri = `${API_URL.replace(/\/$/, '')}/uploads/recording/${item.filename}`;

      if (playingId === item._id && status.playing && !restart) {
        player.pause();
        return;
      }
      if (playingId === item._id && !status.playing && !restart) {
        player.play();
        return;
      }

      setPlayingId(item._id);
      player.replace(uri);
      player.play();
    } catch (err) {
      console.error('Playback error', err);
    }
  };

  const stopPlayback = async () => {
    player.pause();
    setPlayingId(null);
  };

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [toDelete, setToDelete] = useState<any | null>(null);

  const deleteRecording = (item: any) => {
    setToDelete(item);
    setDeleteModalVisible(true);
  };

  const transcribeRecording = async (item: any) => {
    if (!item?._id) return;
    setTranscribingId(item._id);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Not signed in', 'Please sign in to transcribe recordings.');
        return;
      }
      const res = await fetch(`${API_URL}/api/recording/${item._id}/transcribe`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        Alert.alert('Transcription failed', data?.error || 'Could not start transcription.');
        return;
      }
      router.push({
        pathname: '/(tabs)/transcription',
        params: { recordingId: item._id },
      });
    } catch (err) {
      console.error('Transcribe recording error', err);
      Alert.alert('Transcription failed', 'Network error while starting transcription.');
    } finally {
      setTranscribingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return setDeleteModalVisible(false);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/api/recording/${toDelete._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setRecordings((prev) => prev.filter((r) => r._id !== toDelete._id));
        if (playingId === toDelete._id) await stopPlayback();
      } else {
        Alert.alert('Delete failed', data.error || 'Could not delete');
      }
    } catch (err) {
      console.error('Delete error', err);
      Alert.alert('Delete failed', 'Network error');
    } finally {
      setToDelete(null);
      setDeleteModalVisible(false);
    }
  };

  const formatMillis = (ms: number) => {
    if (!ms) return '00:00';
    const total = Math.floor(ms / 1000);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const renderItem = ({ item }: { item: any }) => {
    const active = playingId === item._id;
    const isPlaying = active && status.playing;
    const isTranscribing = transcribingId === item._id;

    return (
      <View style={styles.cardWrapper}>
        <View style={[styles.card, active && styles.cardActive]}>

          {/* Active indicator stripe */}
          {active && <View style={styles.activeStripe} />}

          {/* Top Row: icon + info + delete */}
          <View style={styles.topRow}>
            <LinearGradient
              colors={active ? ['#6366F1', '#8B5CF6'] : ['#EEF2FF', '#E0E7FF']}
              style={styles.iconCircle}
            >
              <Text style={styles.iconText}>🎙️</Text>
            </LinearGradient>

            <View style={styles.textSection}>
              <Text style={styles.recordingName} numberOfLines={1}>
                {item.name || item.originalName || item.filename}
              </Text>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={12} color="#9CA3AF" />
                <Text style={styles.metaText}>
                  {active ? formatMillis(status.currentTime * 1000) : (item.duration || '--:--')}
                </Text>
                <View style={styles.metaDot} />
                <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
                <Text style={styles.metaText}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>

              {active && (
                <View style={styles.statusBadge}>
                  <View style={[styles.statusDot, isPlaying && styles.statusDotActive]} />
                  <Text style={styles.statusLabel}>{isPlaying ? 'Playing' : 'Paused'}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteRecording(item)}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>

          {/* Bottom Row: action buttons */}
          <View style={styles.btnRow}>
            {/* Play / Pause */}
            <TouchableOpacity
              style={styles.btnFlex}
              onPress={() => (active && status.playing ? player.pause() : playRecording(item))}
            >
              <LinearGradient
                colors={active && isPlaying ? ['#EF4444', '#DC2626'] : ['#6366F1', '#4F46E5']}
                style={styles.primaryBtn}
              >
                <Ionicons
                  name={active && isPlaying ? 'pause' : 'play'}
                  size={14}
                  color="#FFF"
                />
                <Text style={styles.primaryBtnText}>
                  {active && isPlaying ? 'Pause' : 'Play'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Replay */}
            <TouchableOpacity style={styles.btnFlex} onPress={() => replayRecording(item)}>
              <View style={styles.secondaryBtn}>
                <Ionicons name="refresh" size={14} color="#6366F1" />
                <Text style={styles.secondaryBtnText}>Replay</Text>
              </View>
            </TouchableOpacity>

            {/* Transcribe */}
            <TouchableOpacity
              style={styles.btnFlex}
              onPress={() => transcribeRecording(item)}
              disabled={isTranscribing}
            >
              <LinearGradient
                colors={isTranscribing ? ['#9CA3AF', '#6B7280'] : ['#8B5CF6', '#7C3AED']}
                style={styles.primaryBtn}
              >
                <Ionicons name="document-text-outline" size={14} color="#FFF" />
                <Text style={styles.primaryBtnText}>
                  {isTranscribing ? 'Wait...' : 'Transcribe'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#F5F3FF', '#EEF2FF', '#F9FAFB']} style={styles.container}>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View>
          <Text style={styles.title}>Recordings</Text>
          <Text style={styles.subtitle}>{recordings.length} saved file{recordings.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.headerBadge}>
          <Ionicons name="mic" size={20} color="#6366F1" />
        </View>
      </View>

      <FlatList
        data={recordings}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: 30 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <LinearGradient colors={['#EEF2FF', '#E0E7FF']} style={styles.emptyIconCircle}>
              <Text style={styles.emptyIcon}>🎤</Text>
            </LinearGradient>
            <Text style={styles.emptyText}>No recordings yet</Text>
            <Text style={styles.emptySubtext}>Start recording to see your audio files here</Text>
          </View>
        }
      />

      {/* Delete confirmation modal */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="trash" size={28} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>Delete Recording</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete{' '}
              <Text style={{ fontWeight: '700' }}>
                "{toDelete?.originalName || toDelete?.filename}"
              </Text>
              ? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => { setDeleteModalVisible(false); setToDelete(null); }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalDelete} onPress={confirmDelete}>
                <Text style={styles.modalDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '500',
  },
  headerBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* List */
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  /* Card */
  cardWrapper: {
    marginBottom: 14,
    borderRadius: 18,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  cardActive: {
    borderColor: '#6366F1',
    backgroundColor: '#FAFAFE',
  },
  activeStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#6366F1',
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },

  /* Top row */
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 4,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: { fontSize: 20 },
  textSection: { flex: 1, marginRight: 8 },
  recordingName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    backgroundColor: '#EEF2FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
  },
  statusDotActive: { backgroundColor: '#10B981' },
  statusLabel: { fontSize: 11, color: '#4F46E5', fontWeight: '700' },

  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Button row */
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 4,
  },
  btnFlex: { flex: 1 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 5,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    gap: 5,
  },
  secondaryBtnText: {
    color: '#4F46E5',
    fontSize: 13,
    fontWeight: '700',
  },

  /* Empty */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIcon: { fontSize: 40 },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    width: '86%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    color: '#111827',
  },
  modalMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelText: { color: '#374151', fontWeight: '700', fontSize: 15 },
  modalDelete: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  modalDeleteText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});