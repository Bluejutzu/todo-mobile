import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors } from '../../theme/colors';
import { storage } from '../../services/storage';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { MediaType } from 'expo-image-picker';
import { SubscriptionCard } from '../../components/subscription/SubscriptionCard';
import { PaywallModal } from '../../components/subscription/PaywallModal';
import { PremiumBadge } from '../../components/subscription/PremiumBadge';
import { spacing } from '../../theme/spacing';

const GREETINGS = [
  'what we up to now',
  'ready to crush some tasks',
  "let's make today count",
  'time to get things done',
  "let's be productive",
  'ready for action',
];

export function AccountScreen() {
  const { user } = useUser();
  const { signOut, getToken } = useAuth();
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const preferences = useUserStore(state => state.preferences);
  const colors = getThemeColors(theme);

  const [exporting, setExporting] = useState(false);
  const [showExportReminder, setShowExportReminder] = useState(false);
  const [lastExportDate, setLastExportDate] = useState<Date | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState(user?.firstName || '');
  const [editLastName, setEditLastName] = useState(user?.lastName || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [randomPhrase] = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);

  React.useEffect(() => {
    (async () => {
      setShowExportReminder(await storage.shouldShowExportReminder());
      setLastExportDate(await storage.getLastExportDate());
    })();
  }, []);

  const handleExport = async () => {
    try {
      setExporting(true);
      let success: boolean;
      if (Platform.OS === 'android') {
        const result = await DocumentPicker.getDocumentAsync({ type: 'application/*', copyToCacheDirectory: false });
        if (!result.canceled && result.assets[0]) {
          const dir = result.assets[0].uri.substring(0, result.assets[0].uri.lastIndexOf('/'));
          success = await storage.exportData(dir);
        } else {
          setExporting(false);
          return;
        }
      } else {
        success = await storage.exportData();
      }
      Alert.alert(success ? 'Success' : 'Error', success ? 'Data exported successfully' : 'Failed to export data');
      if (success) {
        setShowExportReminder(await storage.shouldShowExportReminder());
        setLastExportDate(await storage.getLastExportDate());
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut().catch(() => Alert.alert('Error', 'Failed to sign out')) },
    ]);
  };

  const handleUpdateImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'Images' as MediaType,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });
      if (!result.canceled && result.assets[0].base64) {
        setUpdatingProfile(true);
        await user?.setProfileImage({ file: `data:${result.assets[0].mimeType};base64,${result.assets[0].base64}` });
        Alert.alert('Success', 'Profile picture updated!');
      }
    } catch (error) {
      console.error('Update image error:', error);
      Alert.alert('Error', 'Failed to update profile picture');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editFirstName.trim()) { Alert.alert('Error', 'First name is required'); return; }
    try {
      setUpdatingProfile(true);
      await user?.update({ firstName: editFirstName, lastName: editLastName });
      setShowEditProfile(false);
      Alert.alert('Success', 'Profile updated!');
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== 'delete') {
      Alert.alert('Error', 'Please type "delete" to confirm');
      return;
    }
    Alert.alert('Final Confirmation', 'This cannot be undone. All data will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete Account',
        style: 'destructive',
        onPress: async () => {
          try {
            if (getToken) {
              const token = await getToken();
              if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const client = await storage.getSupabaseClient(getToken);
                if (client) await client.from('todos').delete().eq('user_id', payload.sub);
              }
            }
            await user?.delete();
            await storage.clearAll();
            await signOut();
          } catch (error) {
            console.error('Delete account error:', error);
            Alert.alert('Error', 'Failed to delete account. Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.greeting}>
          <View style={styles.greetingText}>
            <View style={styles.greetingRow}>
              <Text style={[styles.greetingHey, { color: colors.text }]}>
                Hey <Text style={styles.bold}>{user?.firstName || preferences?.name || 'there'}</Text>
              </Text>
              <PremiumBadge />
            </View>
            <Text style={[styles.phrase, { color: colors.textSecondary }]}>{randomPhrase}</Text>
          </View>
          <TouchableOpacity onPress={handleUpdateImage} disabled={updatingProfile}>
            {user?.imageUrl && <Image source={{ uri: user.imageUrl }} style={styles.avatar} />}
            <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="pencil" size={10} color={colors.onPrimary} />
            </View>
          </TouchableOpacity>
        </View>

        <SubscriptionCard onUpgrade={() => setShowPaywall(true)} />

        <Card style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Details</Text>
            <TouchableOpacity onPress={() => { setEditFirstName(user?.firstName || ''); setEditLastName(user?.lastName || ''); setShowEditProfile(true); }}>
              <Text style={[styles.editLink, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
          </View>
          {user && (
            <View style={styles.details}>
              <DetailRow icon="person" label="Name" value={user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Not set'} colors={colors} />
              <DetailRow icon="mail" label="Email" value={user.primaryEmailAddress?.emailAddress || 'Not set'} colors={colors} />
              <DetailRow icon="calendar" label="Member Since" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'} colors={colors} />
              <DetailRow
                icon="shield-checkmark"
                label="Verified"
                value={user.primaryEmailAddress?.verification?.status === 'verified' ? 'Yes' : 'No'}
                valueColor={user.primaryEmailAddress?.verification?.status === 'verified' ? colors.success : colors.warning}
                colors={colors}
              />
            </View>
          )}
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Export</Text>
          {showExportReminder && (
            <View style={[styles.banner, { backgroundColor: colors.warning + '18', borderColor: colors.warning + '40' }]}>
              <Ionicons name="warning" size={16} color={colors.warning} />
              <Text style={[styles.bannerText, { color: colors.warning }]}>30+ days since last export</Text>
            </View>
          )}
          {lastExportDate && (
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              Last export: {lastExportDate.toLocaleDateString()}
            </Text>
          )}
          <Button
            title={exporting ? 'Exporting...' : 'Export Data'}
            onPress={handleExport}
            variant="secondary"
            size="sm"
            disabled={!showExportReminder || exporting}
            style={styles.actionButton}
          />
        </Card>

        <Card style={[styles.section, { borderColor: colors.error + '40' }]}>
          <Text style={[styles.sectionTitle, { color: colors.error }]}>Danger Zone</Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            Sign out or permanently delete your account and all data.
          </Text>
          <View style={styles.dangerButtons}>
            <Button title="Sign Out" onPress={handleSignOut} variant="outline" size="sm" />
            <Button title="Delete Account" onPress={() => setShowDeleteDialog(true)} variant="destructive" size="sm" />
          </View>
        </Card>
      </ScrollView>

      {showEditProfile && (
        <View style={styles.overlay}>
          <View style={[styles.dialog, { backgroundColor: colors.surfaceElevated }]}>
            <Text style={[styles.dialogTitle, { color: colors.text }]}>Edit Profile</Text>
            <View style={styles.dialogField}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>First Name</Text>
              <Input value={editFirstName} onChangeText={setEditFirstName} placeholder="First Name" />
            </View>
            <View style={styles.dialogField}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Last Name</Text>
              <Input value={editLastName} onChangeText={setEditLastName} placeholder="Last Name" />
            </View>
            <View style={styles.dialogButtons}>
              <Button title="Cancel" onPress={() => setShowEditProfile(false)} variant="outline" size="sm" />
              <Button title={updatingProfile ? 'Saving...' : 'Save'} onPress={handleUpdateProfile} size="sm" disabled={updatingProfile} />
            </View>
          </View>
        </View>
      )}

      {showDeleteDialog && (
        <View style={styles.overlay}>
          <View style={[styles.dialog, { backgroundColor: colors.surfaceElevated }]}>
            <Text style={[styles.dialogTitle, { color: colors.text }]}>Delete Account</Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              This will permanently delete all todos, preferences, and account data. This cannot be undone.
            </Text>
            <View style={styles.dialogField}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Type "delete" to confirm:</Text>
              <Input value={deleteConfirmText} onChangeText={setDeleteConfirmText} placeholder="delete" autoCapitalize="none" />
            </View>
            <View style={styles.dialogButtons}>
              <Button title="Cancel" onPress={() => { setShowDeleteDialog(false); setDeleteConfirmText(''); }} variant="outline" size="sm" />
              <Button title="Delete" onPress={handleDeleteAccount} variant="destructive" size="sm" disabled={deleteConfirmText.toLowerCase() !== 'delete'} />
            </View>
          </View>
        </View>
      )}

      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value, valueColor, colors }: { icon: string; label: string; value: string; valueColor?: string; colors: any }) {
  return (
    <View style={detailStyles.row}>
      <Ionicons name={icon as any} size={18} color={colors.textSecondary} />
      <View style={detailStyles.content}>
        <Text style={[detailStyles.label, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[detailStyles.value, { color: valueColor || colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  content: { flex: 1 },
  label: { fontSize: 11, marginBottom: 1 },
  value: { fontSize: 14, fontWeight: '500' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 100 },
  greeting: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, marginBottom: 8 },
  greetingText: { flex: 1 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  greetingHey: { fontSize: 24 },
  bold: { fontWeight: '700' },
  phrase: { fontSize: 14 },
  avatar: { width: 44, height: 44, borderRadius: 22, marginLeft: 12 },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  section: { marginBottom: spacing.md },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing.sm },
  editLink: { fontSize: 13, fontWeight: '600' },
  details: { gap: 14 },
  meta: { fontSize: 13, marginBottom: 8 },
  banner: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, borderWidth: 1, gap: 8, marginBottom: 10 },
  bannerText: { fontSize: 13, flex: 1 },
  actionButton: { alignSelf: 'flex-start' },
  dangerButtons: { flexDirection: 'row', gap: 8, marginTop: 4 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dialog: { width: '100%', maxWidth: 360, borderRadius: 16, padding: 20 },
  dialogTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  dialogField: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, marginBottom: 6 },
  dialogButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
