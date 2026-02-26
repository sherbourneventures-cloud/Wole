import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const [userEmail, setUserEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadUserEmail();
  }, []);

  const loadUserEmail = async () => {
    try {
      const email = await AsyncStorage.getItem('@user_email');
      if (email) {
        setUserEmail(email);
      }
    } catch (error) {
      console.error('Error loading email:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('@user_email');
              router.replace('/');
            } catch (error) {
              console.error('Error logging out:', error);
            }
          },
        },
      ]
    );
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
    danger = false,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View
        style={[
          styles.settingIcon,
          danger && styles.dangerIcon,
        ]}
      >
        <Ionicons
          name={icon as any}
          size={22}
          color={danger ? '#e74c3c' : '#6c5ce7'}
        />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && styles.dangerText]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color="#636e72" />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={40} color="#6c5ce7" />
        </View>
        <Text style={styles.emailText}>{userEmail}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <SettingItem
          icon="mail-outline"
          title="Email"
          subtitle={userEmail}
          showArrow={false}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <SettingItem
          icon="information-circle-outline"
          title="App Version"
          subtitle="1.0.0"
          showArrow={false}
        />
        <SettingItem
          icon="shield-checkmark-outline"
          title="Privacy Policy"
          onPress={() => Alert.alert('Privacy Policy', 'Coming soon')}
        />
        <SettingItem
          icon="document-text-outline"
          title="Terms of Service"
          onPress={() => Alert.alert('Terms of Service', 'Coming soon')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <SettingItem
          icon="notifications-outline"
          title="Push Notifications"
          subtitle="Enabled (In-App)"
          showArrow={false}
        />
        <SettingItem
          icon="mail-outline"
          title="Email Notifications"
          subtitle="sherbourneventures@gmail.com (MOCKED)"
          showArrow={false}
        />
      </View>

      <View style={styles.section}>
        <SettingItem
          icon="log-out-outline"
          title="Sign Out"
          onPress={handleLogout}
          showArrow={false}
          danger
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>QR Visitor Alert</Text>
        <Text style={styles.footerSubtext}>
          Secure visitor management for your locations
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(108, 92, 231, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emailText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  section: {
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    color: '#636e72',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(108, 92, 231, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerIcon: {
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
  },
  settingContent: {
    flex: 1,
    marginLeft: 14,
  },
  settingTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  dangerText: {
    color: '#e74c3c',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#636e72',
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  footerText: {
    fontSize: 16,
    color: '#636e72',
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#4a4a5a',
    marginTop: 4,
  },
});
