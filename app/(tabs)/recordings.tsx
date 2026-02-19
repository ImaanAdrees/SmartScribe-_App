import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, Alert, Platform } from 'react-native';
import { DeviceEventEmitter } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-audio';
// import API_URL from '@/utils/api';
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
export default function RecordingsScreen() {
  const router = useRouter();

  const [recordings, setRecordings] = useState<any[]>([]);

  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMillis, setPositionMillis] = useState<number>(0);
  const [durationMillis, setDurationMillis] = useState<number | null>(null);
  const soundRef = useRef<any | null>(null);

  const fetchRecordings = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/api/recording/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setRecordings(data.recordings);
    } catch (err) {
      console.error('Fetch recordings error', err);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchRecordings();
      return () => {};
    }, [])
  );

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

    // Listen for recordingUploaded events for real-time updates
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

    return () => {
      listener.remove();
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, []);

  const replayRecording = async (item: any) => {
    await playRecording(item, true);
  };

  const playRecording = async (item: any, restart = false) => {
    try {
      // If same item and playing -> pause
      if (playingId === item._id && isPlaying && !restart) {
        if (soundRef.current) await soundRef.current.pauseAsync();
        setIsPlaying(false);
        return;
      }

      // If same item and paused -> resume
      if (playingId === item._id && !isPlaying && soundRef.current && !restart) {
        await soundRef.current.playAsync();
        setIsPlaying(true);
        return;
      }

      // New item: unload previous
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const token = await AsyncStorage.getItem('userToken');
      const uri = `${API_URL.replace(/\/$/, '')}/uploads/recording/${item.filename}`;
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      soundRef.current = sound;
      setPlayingId(item._id);
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status) return;
        if (status.isLoaded) {
          setPositionMillis(status.positionMillis || 0);
          setDurationMillis(status.durationMillis || null);
          if (!status.isPlaying && status.didJustFinish) {
            setIsPlaying(false);
            setPlayingId(null);
            setPositionMillis(0);
          }
        }
      });
    } catch (err) {
      console.error('Playback error', err);
    }
  };

  const stopPlayback = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setIsPlaying(false);
    setPlayingId(null);
    setPositionMillis(0);
    setDurationMillis(null);
  };

  // modal-based delete flow
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [toDelete, setToDelete] = useState<any | null>(null);

  const deleteRecording = (item: any) => {
    setToDelete(item);
    setDeleteModalVisible(true);
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

  const renderItem = ({ item }: { item: any }) => {
    const active = playingId === item._id;
    return (
      <View style={styles.recordingCard}>
        
        <LinearGradient
          colors={active ? ['#4F46E5', '#1E3A8A'] : ['#ffffffff', '#ffffffff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.cardContent}>
            <View style={styles.infoSection}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>🎙️</Text>
              </View>
              <View style={styles.textSection}>
                <Text style={styles.recordingName}>{item.name || item.originalName || item.filename}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.duration}>⏱️ {active ? formatMillis(positionMillis) : (item.duration || '--:--')}</Text>
                  <Text style={styles.date}>• {new Date(item.createdAt).toLocaleString()}</Text>
                </View>
                {active && (
                  <View style={styles.statusBadge}>
                    <View style={[styles.statusDot, isPlaying && styles.statusDotActive]} />
                    <Text style={styles.statusText}>{isPlaying ? 'Playing' : 'Paused'}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={() => (active && isPlaying ? stopPlayback() : playRecording(item))}>
                <LinearGradient
                  colors={active && isPlaying ? ['#EF4444', '#DC2626'] : ['#7B2FF7', '#7B2FF7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionBtn}
                >
                  <Text style={styles.actionBtnText}>
                    {active && isPlaying ? '⏸️ Pause' : '▶️ Play'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => replayRecording(item)}>
                <View style={styles.secondaryBtn}>
                  <Text style={styles.secondaryBtnText}>🔄 Replay</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => deleteRecording(item)}>
                <View style={styles.deleteButton}>
                  <Text style={styles.deleteBtnText}>🗑️</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const formatMillis = (ms: number) => {
    if (!ms) return '00:00';
    const total = Math.floor(ms / 1000);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <LinearGradient
      colors={['#ffffffff', '#f9f9f9ff']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Saved Recordings</Text>
      </View>
      <FlatList
        data={recordings}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎤</Text>
            <Text style={styles.emptyText}>No recordings yet</Text>
            <Text style={styles.emptySubtext}>Start recording to see your audio files here</Text>
          </View>
        }
      />
      {/* Delete confirmation modal */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Delete Recording</Text>
            <Text style={styles.modalMessage}>Are you sure you want to delete "{toDelete?.originalName || toDelete?.filename}"?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => { setDeleteModalVisible(false); setToDelete(null); }}>
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
  container: {
    flex: 1,
    paddingTop: 10,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    elevation: 2,
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.08)",
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  recordingCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.3)",
  },
  cardGradient: {
    borderRadius: 16,
  },
  cardContent: {
    padding: 16,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  textSection: {
    flex: 1,
  },
  recordingName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000ff',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  duration: {
    fontSize: 13,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  date: {
    fontSize: 13,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
    marginRight: 6,
  },
  statusDotActive: {
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 11,
    color: '#000000ff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryBtnText: {
    color: '#000000ff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  deleteBtnText: {
    fontSize: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    width: '86%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    color: '#111827',
  },
  modalMessage: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  modalCancel: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#111827',
    fontWeight: '700',
  },
  modalDelete: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  modalDeleteText: {
    color: '#fff',
    fontWeight: '800',
  },
});