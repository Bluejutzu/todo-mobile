import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors } from '../../theme/colors';

export function AccountManagementScreen() {
    const navigation = useNavigation();
    const { user } = useUser();
    const { signOut } = useAuth();
    const theme = useUserStore(state => state.preferences?.theme || 'dark');
    const colors = getThemeColors(theme);

    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [updating, setUpdating] = useState(false);

    const handleUpdateProfile = async () => {
        if (!user) return;

        setUpdating(true);
        try {
            await user.update({
                firstName,
                lastName,
            });
            Alert.alert('Success', 'Profile updated successfully');
        } catch (error: any) {  // eslint-disable-line @typescript-eslint/no-explicit-any
            Alert.alert('Error', error.errors?.[0]?.message || 'Failed to update profile');
        } finally {
            setUpdating(false);
        }
    };

    const handleSignOut = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Account Management</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content}>
                {/* Profile Section */}
                <Card style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile</Text>

                    <Input
                        label="First Name"
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="Enter first name"
                    />

                    <Input
                        label="Last Name"
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="Enter last name"
                    />

                    <Button
                        title={updating ? 'Updating...' : 'Update Profile'}
                        onPress={handleUpdateProfile}
                        variant="primary"
                        disabled={updating}
                    />
                </Card>

                {/* Email Section */}
                <Card style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Email</Text>
                    <View style={styles.emailRow}>
                        <Ionicons name="mail" size={20} color={colors.textSecondary} />
                        <Text style={[styles.emailText, { color: colors.text }]}>
                            {user?.primaryEmailAddress?.emailAddress}
                        </Text>
                    </View>
                    <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                        Email management is handled through your authentication provider
                    </Text>
                </Card>

                {/* Connected Accounts */}
                {user?.externalAccounts && user.externalAccounts.length > 0 && (
                    <Card style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Connected Accounts</Text>
                        {user.externalAccounts.map((account, index) => (
                            <View key={index} style={styles.accountRow}>
                                <Ionicons
                                    name={account.provider === 'google' ? 'logo-google' : 'logo-apple'}
                                    size={20}
                                    color={colors.textSecondary}
                                />
                                <Text style={[styles.accountText, { color: colors.text }]}>
                                    {account.emailAddress || account.provider}
                                </Text>
                            </View>
                        ))}
                    </Card>
                )}

                {/* Danger Zone */}
                <Card style={[styles.section, styles.dangerSection]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Danger Zone</Text>
                    <Button
                        title="Sign Out"
                        onPress={handleSignOut}
                        variant="secondary"
                    />
                </Card>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    emailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    emailText: {
        fontSize: 16,
    },
    helperText: {
        fontSize: 14,
        marginTop: 8,
    },
    accountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
    },
    accountText: {
        fontSize: 16,
    },
    dangerSection: {
        borderColor: '#ff4444',
        borderWidth: 1,
    },
});
