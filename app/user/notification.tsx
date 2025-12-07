import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsScreen() {
  const router = useRouter();

  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Meeting Reminder', message: 'Marketing Sync in 30 minutes', time: '10:15 AM' },
    { id: '2', title: 'New Transcription', message: 'Lecture: AI Ethics transcription is ready', time: 'Yesterday' },
    { id: '3', title: 'Recording Saved', message: 'Client Call recording saved successfully', time: '2 days ago' },
  ]);

  const deleteNotification = (item: any) => {
    Alert.alert('Delete', `Delete "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setNotifications((prev) => prev.filter((n) => n.id !== item.id));
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: any }) => {
    return (
      <View style={styles.item}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteNotification(item)}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#4F46E5" />
        </TouchableOpacity>

      <Text style={styles.header}>Notifications</Text>

      {notifications.length === 0 ? (
        <View style={styles.center}>
          <Text>No notifications yet.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
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
  header: { fontSize: 22, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  item: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
    marginBottom: 12,
    alignItems: 'center',
  },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  message: { fontSize: 14, color: '#555', marginBottom: 2 },
  time: { fontSize: 12, color: '#888' },
  deleteBtn: { paddingVertical: 6, paddingHorizontal: 10 },
  deleteText: { color: '#E53935', fontWeight: '600' },
});
