import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video, ResizeMode } from 'expo-av';
import { api } from '../../src/services/api';

interface VisitorRequest {
  id: string;
  location_id: string;
  visitor_name: string;
  visitor_phone: string;
  visitor_email: string;
  purpose: string;
  media_type: string;
  media_base64: string;
  status: string;
  created_at: string;
}

interface Location {
  id: string;
  name: string;
}

export default function VisitorsScreen() {
  const [visitors, setVisitors] = useState<VisitorRequest[]>([]);
  const [locations, setLocations] = useState<Record<string, Location>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorRequest | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const fetchData = async () => {
    try {
      const email = await AsyncStorage.getItem('@user_email');
      if (email) {
        // Fetch locations first
        const locs = await api.getLocations(email);
        const locMap: Record<string, Location> = {};
        locs.forEach((loc: Location) => {
          locMap[loc.id] = loc;
        });
        setLocations(locMap);

        // Fetch all visitors for user's locations
        const allVisitors: VisitorRequest[] = [];
        for (const loc of locs) {
          const locVisitors = await api.getVisitorRequests(loc.id);
          allVisitors.push(...locVisitors);
        }
        // Sort by created_at descending
        allVisitors.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setVisitors(allVisitors);
      }
    } catch (error) {
      console.error('Error fetching visitors:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const handleStatusUpdate = async (visitorId: string, status: string) => {
    try {
      await api.updateVisitorStatus(visitorId, status);
      fetchData();
      setDetailModalVisible(false);
      Alert.alert('Success', `Visitor ${status}`);
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#00cec9';
      case 'denied':
        return '#e74c3c';
      default:
        return '#fdcb6e';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderVisitorItem = ({ item }: { item: VisitorRequest }) => (
    <TouchableOpacity
      style={styles.visitorCard}
      onPress={() => {
        setSelectedVisitor(item);
        setDetailModalVisible(true);
      }}
    >
      <View style={styles.visitorHeader}>
        <View style={styles.avatarContainer}>
          {item.media_type === 'photo' && item.media_base64 ? (
            <Image
              source={{ uri: `data:image/jpeg;base64,${item.media_base64}` }}
              style={styles.avatar}
            />
          ) : (
            <Ionicons name="person" size={28} color="#6c5ce7" />
          )}
        </View>
        <View style={styles.visitorInfo}>
          <Text style={styles.visitorName}>{item.visitor_name}</Text>
          <Text style={styles.locationName}>
            {locations[item.location_id]?.name || 'Unknown Location'}
          </Text>
          <Text style={styles.visitTime}>{formatDate(item.created_at)}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.purposeText} numberOfLines={2}>
        {item.purpose}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c5ce7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={visitors}
        renderItem={renderVisitorItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchData();
            }}
            tintColor="#6c5ce7"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#636e72" />
            <Text style={styles.emptyText}>No visitors yet</Text>
            <Text style={styles.emptySubtext}>
              Visitors will appear here when they scan your QR codes
            </Text>
          </View>
        }
      />

      {/* Visitor Detail Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Visitor Details</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {selectedVisitor && (
              <>
                <View style={styles.mediaContainer}>
                  {selectedVisitor.media_type === 'photo' &&
                  selectedVisitor.media_base64 ? (
                    <Image
                      source={{
                        uri: `data:image/jpeg;base64,${selectedVisitor.media_base64}`,
                      }}
                      style={styles.mediaImage}
                    />
                  ) : selectedVisitor.media_type === 'video' &&
                    selectedVisitor.media_base64 ? (
                    <Video
                      source={{
                        uri: `data:video/mp4;base64,${selectedVisitor.media_base64}`,
                      }}
                      style={styles.mediaVideo}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                    />
                  ) : (
                    <View style={styles.noMediaContainer}>
                      <Ionicons name="image-outline" size={48} color="#636e72" />
                      <Text style={styles.noMediaText}>No media available</Text>
                    </View>
                  )}
                </View>

                <View style={styles.detailSection}>
                  <View style={styles.detailRow}>
                    <Ionicons name="person" size={20} color="#6c5ce7" />
                    <Text style={styles.detailLabel}>Name:</Text>
                    <Text style={styles.detailValue}>
                      {selectedVisitor.visitor_name}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="call" size={20} color="#6c5ce7" />
                    <Text style={styles.detailLabel}>Phone:</Text>
                    <Text style={styles.detailValue}>
                      {selectedVisitor.visitor_phone}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="mail" size={20} color="#6c5ce7" />
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue}>
                      {selectedVisitor.visitor_email}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="document-text" size={20} color="#6c5ce7" />
                    <Text style={styles.detailLabel}>Purpose:</Text>
                  </View>
                  <Text style={styles.purposeDetail}>
                    {selectedVisitor.purpose}
                  </Text>
                </View>

                {selectedVisitor.status === 'pending' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() =>
                        handleStatusUpdate(selectedVisitor.id, 'approved')
                      }
                    >
                      <Ionicons name="checkmark" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.denyButton]}
                      onPress={() =>
                        handleStatusUpdate(selectedVisitor.id, 'denied')
                      }
                    >
                      <Ionicons name="close" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Deny</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
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
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  visitorCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  visitorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(108, 92, 231, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  visitorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  visitorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  locationName: {
    fontSize: 13,
    color: '#6c5ce7',
    marginTop: 2,
  },
  visitTime: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  purposeText: {
    fontSize: 14,
    color: '#b2bec3',
    lineHeight: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  detailModalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  mediaContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mediaImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
  },
  mediaVideo: {
    width: 280,
    height: 200,
    borderRadius: 16,
  },
  noMediaContainer: {
    width: 200,
    height: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMediaText: {
    color: '#636e72',
    marginTop: 8,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    color: '#b2bec3',
    marginLeft: 10,
    fontSize: 14,
  },
  detailValue: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  purposeDetail: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 22,
    marginLeft: 30,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#00cec9',
  },
  denyButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
