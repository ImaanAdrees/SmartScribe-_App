import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function RecordingsScreen() {
  const router = useRouter();

  const [recordings, setRecordings] = useState([
    { id: '1', name: 'Meeting 1', duration: '35:12', date: '2 hours ago' },
    { id: '2', name: 'Lecture AI', duration: '45:20', date: '1 day ago' },
    { id: '3', name: 'Client Call', duration: '32:05', date: '3 days ago' },
  ]);

  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playRecording = (item: any) => {
    if (playingId === item.id && isPlaying) {
      setIsPlaying(false);
      return;
    }
    setPlayingId(item.id);
    setIsPlaying(true);
  };

  const replayRecording = (item: any) => {
    setPlayingId(item.id);
    setIsPlaying(true);
  };

  const deleteRecording = (item: any) => {
    Alert.alert('Delete Recording', `Are you sure you want to delete "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setRecordings((prev) => prev.filter((r) => r.id !== item.id));
          if (playingId === item.id) {
            setPlayingId(null);
            setIsPlaying(false);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: any }) => {
    const active = playingId === item.id;
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
                <Text style={styles.recordingName}>{item.name}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.duration}>⏱️ {item.duration}</Text>
                  <Text style={styles.date}>• {item.date}</Text>
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
              <TouchableOpacity onPress={() => playRecording(item)}>
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

  return (
    <LinearGradient
      colors={['#ffffffff', '#f9f9f9ff']}
      style={styles.container}
    >
      <FlatList
        data={recordings}
        keyExtractor={(item) => item.id}
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
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
});