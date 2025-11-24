import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AISettingsPanel } from './AISettingsPanel';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { ScrollView } from 'react-native-gesture-handler';

interface AISettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

export function AISettingsModal({ visible, onClose }: AISettingsModalProps) {
    const theme = useUserStore(state => state.preferences?.theme || 'dark');
    const themeColors = getThemeColors(theme);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={onClose}
        >
            <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color={themeColors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: themeColors.text }]}>AI Settings</Text>
                    <View style={styles.placeholder} />
                </View>

                <ScrollView>
                    {/* AI Settings Panel */}
                    <AISettingsPanel /></ScrollView>
            </SafeAreaView>
        </Modal>
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
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
    },
    closeButton: {
        padding: spacing.xs,
    },
    title: {
        ...typography.h2,
        fontSize: 20,
    },
    placeholder: {
        width: 44, // Same width as close button for centering
    },
});
