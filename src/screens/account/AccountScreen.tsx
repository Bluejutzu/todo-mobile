import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image } from 'react-native';
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
import { Platform, TouchableOpacity } from 'react-native';

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

  // Edit Profile State
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [editFirstName, setEditFirstName] = useState(user?.firstName || '');
  const [editLastName, setEditLastName] = useState(user?.lastName || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const greetingPhrases = [
    'what we up to now',
    'ready to crush some tasks',
    "let's make today count",
    'time to get things done',
    "what's on the agenda",
    "let's be productive",
    'ready for action',
    "let's make it happen",
  ];

  const [randomPhrase] = useState(
    () => greetingPhrases[Math.floor(Math.random() * greetingPhrases.length)]
  );

  React.useEffect(() => {
    checkExportReminder();
  }, []);

  const checkExportReminder = async () => {
    const shouldShow = await storage.shouldShowExportReminder();
    setShowExportReminder(shouldShow);
    const date = await storage.getLastExportDate();
    setLastExportDate(date);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      if (Platform.OS === 'android') {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'application/*',
          copyToCacheDirectory: false,
        });

        if (!result.canceled && result.assets[0]) {
          const directoryUri = result.assets[0].uri.substring(
            0,
            result.assets[0].uri.lastIndexOf('/')
          );
          const success = await storage.exportData(directoryUri);
          if (success) {
            Alert.alert('Success', 'Data exported successfully');
            await checkExportReminder();
          } else {
            Alert.alert('Error', 'Failed to export data');
          }
        }
      } else {
        const success = await storage.exportData();
        if (success) {
          Alert.alert('Success', 'Data exported successfully');
          await checkExportReminder();
        } else {
          Alert.alert('Error', 'Failed to export data');
        }
        setExporting(false);
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data');
      setExporting(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            console.error('Sign out error:', error);
            Alert.alert('Error', 'Failed to sign out');
          }
        },
      },
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
        await user?.setProfileImage({
          file: `data:${result.assets[0].mimeType};base64,${result.assets[0].base64}`,
        });
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
    if (!editFirstName.trim()) {
      Alert.alert('Error', 'First name is required');
      return;
    }

    try {
      setUpdatingProfile(true);
      await user?.update({
        firstName: editFirstName,
        lastName: editLastName,
      });
      setShowEditProfileDialog(false);
      Alert.alert('Success', 'Profile updated successfully!');
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

    Alert.alert(
      'Final Confirmation',
      'This action cannot be undone. All your data will be permanently deleted from our servers.',
      [
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
                  const userId = payload.sub;

                  const client = await storage.getSupabaseClient(getToken);
                  if (client) {
                    await client.from('todos').delete().eq('user_id', userId);
                  }
                }
              }

              await user?.delete();
              await storage.clearAll();
              await signOut();

              Alert.alert(
                'Account Deleted',
                'Your account and all data have been permanently deleted.'
              );
            } catch (error) {
              console.error('Delete account error:', error);
              Alert.alert(
                'Error',
                'Failed to delete account. Please try again or contact support.'
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content}>
        <View style={styles.greetingSection}>
          <View style={styles.greetingTextContainer}>
            <Text style={[styles.greetingText, { color: colors.text }]}>
              Hey{' '}
              <Text style={styles.greetingName}>
                {user?.firstName || preferences?.name || 'there'}
              </Text>
            </Text>
            <Text style={[styles.greetingPhrase, { color: colors.textSecondary }]}>
              {randomPhrase}
            </Text>
          </View>
          <TouchableOpacity onPress={handleUpdateImage} disabled={updatingProfile}>
            {user?.imageUrl && (
              <Image source={{ uri: user.imageUrl }} style={styles.profileImage} />
            )}
            <View style={[styles.editIconBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="pencil" size={12} />
            </View>
          </TouchableOpacity>
        </View>

        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text
              style={[styles.sectionTitle, styles.sectionTitleNoMargin, { color: colors.text }]}
            >
              Account Details
            </Text>
            <TouchableOpacity
              onPress={() => {
                setEditFirstName(user?.firstName || '');
                setEditLastName(user?.lastName || '');
                setShowEditProfileDialog(true);
              }}
            >
              <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.spacer16} />
          {user && (
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Ionicons name="person" size={20} color={colors.textSecondary} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Name</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {user.fullName ||
                      `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                      'Not set'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="mail" size={20} color={colors.textSecondary} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Email</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {user.primaryEmailAddress?.emailAddress || 'Not set'}
                  </Text>
                </View>
              </View>

              {user.phoneNumbers && user.phoneNumbers.length > 0 && (
                <View style={styles.detailRow}>
                  <Ionicons name="call" size={20} color={colors.textSecondary} />
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Phone</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {user.phoneNumbers[0].phoneNumber}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.detailRow}>
                <Ionicons name="calendar" size={20} color={colors.textSecondary} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Member Since
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="shield-checkmark" size={20} color={colors.textSecondary} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Email Verified
                  </Text>
                  <Text
                    style={[
                      styles.detailValue,
                      {
                        color:
                          user.primaryEmailAddress?.verification?.status === 'verified'
                            ? colors.success
                            : colors.warning,
                      },
                    ]}
                  >
                    {user.primaryEmailAddress?.verification?.status === 'verified' ? 'Yes' : 'No'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Export</Text>
          {showExportReminder && (
            <View
              style={[
                styles.reminderBanner,
                { backgroundColor: colors.warning + '20', borderColor: colors.warning },
              ]}
            >
              <Ionicons name="warning" size={20} color={colors.warning} />
              <Text style={[styles.reminderText, { color: colors.warning }]}>
                It&apos;s been 30 days since your last export
              </Text>
            </View>
          )}
          {lastExportDate && (
            <>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                Last export: {lastExportDate.toLocaleDateString()}
              </Text>
              <Text style={[styles.bodyText, { color: colors.text }]}>
                Next possible export: {new Date(lastExportDate.setDate(lastExportDate.getDate() + 30)).toLocaleDateString()}
              </Text>
            </>
          )}
          <Button
            title={exporting ? 'Exporting...' : 'Export Data'}
            onPress={handleExport}
            variant="secondary"
            disabled={!showExportReminder || exporting}
          />
        </Card>

        <Card style={[styles.section, styles.dangerSection]}>
          <Text style={[styles.sectionTitle, { color: colors.error }]}>Danger Zone</Text>
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="secondary"
            style={styles.signOutButton}
          />
          <Text style={[styles.bodyText, styles.dangerText, { color: colors.textSecondary }]}>
            Deleting your account will permanently remove all your data including todos,
            preferences, and account information from our cloud storage. This action cannot be
            undone.
          </Text>
          <Button
            title="Delete Account"
            onPress={() => setShowDeleteDialog(true)}
            variant="destructive"
          />
        </Card>
      </ScrollView>

      {showEditProfileDialog && (
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialogContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.dialogTitle, { color: colors.text }]}>Edit Profile</Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>First Name</Text>
              <Input
                value={editFirstName}
                onChangeText={setEditFirstName}
                placeholder="First Name"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Last Name</Text>
              <Input value={editLastName} onChangeText={setEditLastName} placeholder="Last Name" />
            </View>

            <View style={styles.dialogButtons}>
              <Button
                title="Cancel"
                onPress={() => setShowEditProfileDialog(false)}
                variant="secondary"
              />
              <Button
                title={updatingProfile ? 'Saving...' : 'Save Changes'}
                onPress={handleUpdateProfile}
                variant="primary"
                disabled={updatingProfile}
              />
            </View>
          </View>
        </View>
      )}

      {showDeleteDialog && (
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialogContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.dialogTitle, { color: colors.text }]}>Delete Account</Text>
            <Text style={[styles.dialogText, { color: colors.textSecondary }]}>
              Are you sure you want to delete your account? You will lose:
            </Text>
            <View style={styles.dataList}>
              <Text style={[styles.dataItem, { color: colors.textSecondary }]}>
                • All your todos
              </Text>
              <Text style={[styles.dataItem, { color: colors.textSecondary }]}>
                • Your preferences and settings
              </Text>
              <Text style={[styles.dataItem, { color: colors.textSecondary }]}>
                • Your account information
              </Text>
            </View>
            <Text style={[styles.dialogWarning, { color: colors.error }]}>
              No backup will be created. This action is permanent.
            </Text>

            <View style={styles.confirmSection}>
              <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>
                Type &quot;delete&quot; to confirm:
              </Text>
              <Input
                value={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
                placeholder="delete"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.dialogButtons}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirmText('');
                }}
                variant="secondary"
              />
              <Button
                title="Delete Account"
                onPress={handleDeleteAccount}
                variant="primary"
                disabled={deleteConfirmText.toLowerCase() !== 'delete'}
              />
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  greetingSection: {
    paddingVertical: 16,
    paddingHorizontal: 4,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingTextContainer: {
    flex: 1,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginLeft: 16,
  },
  greetingText: {
    fontSize: 28,
    marginBottom: 4,
  },
  greetingName: {
    fontWeight: '700',
  },
  greetingPhrase: {
    fontSize: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailsContainer: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  bodyText: {
    fontSize: 14,
    marginBottom: 12,
  },
  dangerText: {
    marginBottom: 16,
  },
  reminderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
  },
  reminderText: {
    fontSize: 14,
    flex: 1,
  },
  dangerSection: {
    borderColor: '#ff4444',
    borderWidth: 1,
  },
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  dialogTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  dialogText: {
    fontSize: 16,
    marginBottom: 12,
  },
  dataList: {
    marginBottom: 16,
    paddingLeft: 8,
  },
  dataItem: {
    fontSize: 14,
    marginBottom: 4,
  },
  dialogWarning: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 20,
  },
  confirmSection: {
    marginBottom: 24,
  },
  confirmLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  dialogButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  signOutButton: {
    marginBottom: 12,
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000000', // Will be overridden by theme if needed
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  sectionTitleNoMargin: {
    marginBottom: 0,
  },
  editButtonText: {
    fontWeight: '600',
  },
  spacer16: {
    height: 16,
  },
});
