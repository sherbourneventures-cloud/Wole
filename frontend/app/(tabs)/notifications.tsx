import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../src/services/api';
import { useNotificationStore } from '../../src/store/notificationStore';

interface Notification {
  id: string;
  owner_email: string;
  visitor_request_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);

  const fetchNotifications = async () => {
    try {
      const email = await AsyncStorage.getItem('@user_email');
      if (email) {
        const data = await api.getNotifications(email);
        setNotifications(data);
        
        // Update unread count
        const unreadCount = data.filter((n: Notification) => !n.is_read).length;
        setUnreadCount(unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  // Poll for new notifications every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationPress = async (notification: Notification) => {
    try {
      if (!notification.is_read) {
        await api.markNotificationRead(notification.id);
        fetchNotifications();
      }
      // Navigate to visitors tab
      router.push('/(tabs)/visitors');
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const email = await AsyncStorage.getItem('@user_email');
      if (email) {
        await api.markAllNotificationsRead(email);
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.is_read && styles.unreadCard,
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <View
          style={[
            styles.iconContainer,
            !item.is_read && styles.unreadIconContainer,
          ]}
        >
          <Ionicons
            name="person-add"
            size={24}
            color={item.is_read ? '#636e72' : '#6c5ce7'}
          />
        </View>
        <View style={styles.messageContainer}>
          <Text
            style={[
              styles.messageText,
              !item.is_read && styles.unreadMessageText,
            ]}
          >
            {item.message}
          </Text>
          <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
        </View>
        {!item.is_read && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c5ce7" />
      </View>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={handleMarkAllRead}
        >
          <Ionicons name="checkmark-done" size={18} color="#6c5ce7" />
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchNotifications();
            }}
            tintColor="#6c5ce7"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#636e72" />
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySubtext}>
              You'll receive alerts when visitors scan your QR codes
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 8,
    gap: 6,
  },
  markAllText: {
    color: '#6c5ce7',
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    flexGrow: 1,
  },
  notificationCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  unreadCard: {
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    borderColor: 'rgba(108, 92, 231, 0.3)',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadIconContainer: {
    backgroundColor: 'rgba(108, 92, 231, 0.2)',
  },
  messageContainer: {
    flex: 1,
    marginLeft: 12,
  },
  messageText: {
    fontSize: 14,
    color: '#b2bec3',
    lineHeight: 20,
  },
  unreadMessageText: {
    color: '#fff',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 4,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6c5ce7',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#636e72',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
