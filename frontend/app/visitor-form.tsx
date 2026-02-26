import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { api } from '../src/services/api';

export default function VisitorFormScreen() {
  const { locationId } = useLocalSearchParams<{ locationId: string }>();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>('front');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [capturedMedia, setCapturedMedia] = useState<{ type: string; base64: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    purpose: '',
  });

  useEffect(() => {
    fetchLocationInfo();
  }, [locationId]);

  const fetchLocationInfo = async () => {
    try {
      if (locationId) {
        const location = await api.getLocation(locationId);
        setLocationName(location.name);
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      Alert.alert('Error', 'Invalid location. Please scan a valid QR code.');
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: true,
        });
        if (photo?.base64) {
          setCapturedMedia({ type: 'photo', base64: photo.base64 });
          setShowCamera(false);
        }
      } catch (error) {
        console.error('Error taking photo:', error);
        Alert.alert('Error', 'Failed to capture photo');
      }
    }
  };

  const handleRecordVideo = async () => {
    if (cameraRef.current) {
      if (isRecording) {
        setIsRecording(false);
        cameraRef.current.stopRecording();
      } else {
        try {
          setIsRecording(true);
          const video = await cameraRef.current.recordAsync({
            maxDuration: 10,
          });
          if (video?.uri) {
            // Convert video to base64
            const base64 = await FileSystem.readAsStringAsync(video.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            setCapturedMedia({ type: 'video', base64 });
            setShowCamera(false);
          }
        } catch (error) {
          console.error('Error recording video:', error);
          Alert.alert('Error', 'Failed to record video');
        } finally {
          setIsRecording(false);
        }
      }
    }
  };

  const handleSubmit = async () => {
    // Validate form
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (!formData.purpose.trim()) {
      Alert.alert('Error', 'Please enter the purpose of your visit');
      return;
    }
    if (!capturedMedia) {
      Alert.alert('Error', 'Please take a photo or record a video');
      return;
    }

    setSubmitting(true);
    try {
      await api.createVisitorRequest({
        location_id: locationId as string,
        visitor_name: formData.name,
        visitor_phone: formData.phone,
        visitor_email: formData.email,
        purpose: formData.purpose,
        media_type: capturedMedia.type,
        media_base64: capturedMedia.base64,
      });

      Alert.alert(
        'Request Sent!',
        'Your entry request has been sent to the property owner. They will be notified shortly.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting request:', error);
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos or videos.');
        return;
      }
    }
    setShowCamera(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c5ce7" />
      </View>
    );
  }

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraType}
          mode={mediaType === 'video' ? 'video' : 'picture'}
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.cameraCloseButton}
                onPress={() => setShowCamera(false)}
              >
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cameraFlipButton}
                onPress={() =>
                  setCameraType(cameraType === 'front' ? 'back' : 'front')
                }
              >
                <Ionicons name="camera-reverse" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.mediaTypeSelector}>
              <TouchableOpacity
                style={[
                  styles.mediaTypeButton,
                  mediaType === 'photo' && styles.mediaTypeButtonActive,
                ]}
                onPress={() => setMediaType('photo')}
              >
                <Ionicons
                  name="camera"
                  size={20}
                  color={mediaType === 'photo' ? '#6c5ce7' : '#fff'}
                />
                <Text
                  style={[
                    styles.mediaTypeText,
                    mediaType === 'photo' && styles.mediaTypeTextActive,
                  ]}
                >
                  Photo
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.mediaTypeButton,
                  mediaType === 'video' && styles.mediaTypeButtonActive,
                ]}
                onPress={() => setMediaType('video')}
              >
                <Ionicons
                  name="videocam"
                  size={20}
                  color={mediaType === 'video' ? '#6c5ce7' : '#fff'}
                />
                <Text
                  style={[
                    styles.mediaTypeText,
                    mediaType === 'video' && styles.mediaTypeTextActive,
                  ]}
                >
                  Video
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.cameraControls}>
              {mediaType === 'photo' ? (
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={handleTakePhoto}
                >
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.captureButton,
                    isRecording && styles.recordingButton,
                  ]}
                  onPress={handleRecordVideo}
                >
                  <View
                    style={[
                      styles.captureButtonInner,
                      isRecording && styles.recordingButtonInner,
                    ]}
                  />
                </TouchableOpacity>
              )}
              {isRecording && (
                <Text style={styles.recordingText}>Recording... (max 10s)</Text>
              )}
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.locationBadge}>
            <Ionicons name="location" size={20} color="#6c5ce7" />
            <Text style={styles.locationText}>{locationName}</Text>
          </View>
          <Text style={styles.title}>Visitor Entry Request</Text>
          <Text style={styles.subtitle}>
            Please fill in your details to request entry
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#636e72"
              value={formData.name}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, name: text }))
              }
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor="#636e72"
              value={formData.phone}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, phone: text }))
              }
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#636e72"
              value={formData.email}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, email: text }))
              }
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Purpose of Visit *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the purpose of your visit"
              placeholderTextColor="#636e72"
              value={formData.purpose}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, purpose: text }))
              }
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Photo/Video Verification *</Text>
            {capturedMedia ? (
              <View style={styles.mediaCaptured}>
                <Ionicons
                  name={capturedMedia.type === 'photo' ? 'image' : 'videocam'}
                  size={32}
                  color="#00cec9"
                />
                <Text style={styles.mediaCapturedText}>
                  {capturedMedia.type === 'photo' ? 'Photo' : 'Video'} captured
                </Text>
                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={() => setCapturedMedia(null)}
                >
                  <Text style={styles.retakeButtonText}>Retake</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.cameraButton} onPress={openCamera}>
                <Ionicons name="camera" size={32} color="#6c5ce7" />
                <Text style={styles.cameraButtonText}>
                  Take Photo or Record Video
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Submit Request</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 92, 231, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  locationText: {
    color: '#6c5ce7',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#b2bec3',
    textAlign: 'center',
    marginTop: 8,
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#b2bec3',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  cameraButton: {
    backgroundColor: 'rgba(108, 92, 231, 0.15)',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6c5ce7',
    borderStyle: 'dashed',
  },
  cameraButtonText: {
    color: '#6c5ce7',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  mediaCaptured: {
    backgroundColor: 'rgba(0, 206, 201, 0.15)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00cec9',
  },
  mediaCapturedText: {
    color: '#00cec9',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  retakeButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  // Camera styles
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
  },
  cameraCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraFlipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  mediaTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    gap: 8,
  },
  mediaTypeButtonActive: {
    backgroundColor: '#fff',
  },
  mediaTypeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  mediaTypeTextActive: {
    color: '#6c5ce7',
  },
  cameraControls: {
    alignItems: 'center',
    paddingBottom: 50,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  recordingButton: {
    borderColor: '#e74c3c',
  },
  recordingButtonInner: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#e74c3c',
  },
  recordingText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
  },
});
