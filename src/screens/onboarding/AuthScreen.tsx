import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSignIn, useSignUp, useSSO, useAuth } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors } from '../../theme/colors';
import { storage } from '../../services/storage';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

export function AuthScreen() {
  const { isSignedIn } = useAuth();
  const { signIn, setActive: setSignInActive, isLoaded: isSignInLoaded } = useSignIn();
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp();
  const { startSSOFlow } = useSSO();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [resetPasswordEmail, setResetPasswordEmail] = useState('');
  const [resetPasswordCode, setResetPasswordCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetStep, setResetStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);

  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const colors = getThemeColors(theme);

  // Navigate to Main when user is signed in
  useEffect(() => {
    if (isSignedIn) {
      storage.setOnboardingCompleted(true);
      // Navigation will be handled by AppNavigator when onboarding is completed
    }
  }, [isSignedIn]);

  const onSelectOAuth = async (strategy: 'oauth_google' | 'oauth_apple') => {
    if (!isSignInLoaded || !isSignUpLoaded) return;

    setLoading(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({ strategy });

      if (createdSessionId) {
        setActive!({ session: createdSessionId });
        await storage.setOnboardingCompleted(true);
      }
    } catch (err: any) {
      console.error('OAuth error', err);
      // Handle "already signed in" error gracefully
      if (err.errors?.[0]?.message?.includes('already signed in')) {
        await storage.setOnboardingCompleted(true);
        return; // Let useEffect handle navigation
      }
      Alert.alert('Error', err.errors?.[0]?.message || 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  const onSignInPress = async () => {
    if (!isSignInLoaded) return;
    setLoading(true);
    try {
      const completeSignIn = await signIn.create({
        identifier: email,
        password,
      });
      await setSignInActive({ session: completeSignIn.createdSessionId });
      await storage.setOnboardingCompleted(true);
    } catch (err: any) {
      Alert.alert('Error', err.errors?.[0]?.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const onSignUpPress = async () => {
    if (!isSignUpLoaded) return;
    setLoading(true);
    try {
      await signUp.create({
        emailAddress: email,
        password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      // Here you would typically navigate to a verification screen
      // For simplicity in this task, we'll just show an alert
      Alert.alert('Verify Email', 'Please check your email for a verification code.');
    } catch (err: any) {
      Alert.alert('Error', err.errors?.[0]?.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const onForgotPasswordPress = async () => {
    if (!isSignInLoaded) return;
    setLoading(true);
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: resetPasswordEmail,
      });
      setResetStep('code');
      Alert.alert('Success', 'Reset code sent to your email');
    } catch (err: any) {
      Alert.alert('Error', err.errors?.[0]?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const onResetPasswordPress = async () => {
    if (!isSignInLoaded) return;
    setLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: resetPasswordCode,
        password: newPassword,
      });

      if (result.status === 'complete') {
        await setSignInActive({ session: result.createdSessionId });
        setShowResetDialog(false);
        Alert.alert('Success', 'Password reset successfully!');
      } else {
        Alert.alert('Error', 'Failed to reset password. Please check the code and try again.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.errors?.[0]?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sign in to sync your tasks
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.input,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Email"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.input,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Password"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {!isSignUp && (
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={() => setShowResetDialog(true)}
            >
              <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={isSignUp ? onSignUpPress : onSignInPress}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
            <Text style={[styles.orText, { color: colors.textSecondary }]}>OR</Text>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            style={[
              styles.socialButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => onSelectOAuth('oauth_google')}
            disabled={loading}
          >
            <Ionicons name="logo-google" size={24} color={colors.text} />
            <Text style={[styles.socialButtonText, { color: colors.text }]}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.socialButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => onSelectOAuth('oauth_apple')}
            disabled={loading}
          >
            <Ionicons name="logo-apple" size={24} color={colors.text} />
            <Text style={[styles.socialButtonText, { color: colors.text }]}>
              Continue with Apple
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.switchButton} onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={[styles.switchText, { color: colors.textSecondary }]}>
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>

        {showResetDialog && (
          <View style={styles.dialogOverlay}>
            <View style={[styles.dialogContainer, { backgroundColor: colors.surface }]}>
              <Text style={[styles.dialogTitle, { color: colors.text }]}>Reset Password</Text>

              {resetStep === 'email' ? (
                <>
                  <TextInput
                    style={[
                      styles.input,
                      styles.dialogInput,
                      {
                        backgroundColor: colors.background,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.textSecondary}
                    value={resetPasswordEmail}
                    onChangeText={setResetPasswordEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  <View style={styles.dialogButtons}>
                    <TouchableOpacity
                      style={[
                        styles.dialogButton,
                        styles.dialogButtonOutline,
                        { borderColor: colors.border },
                      ]}
                      onPress={() => setShowResetDialog(false)}
                    >
                      <Text style={[styles.dialogButtonText, { color: colors.text }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.dialogButton, { backgroundColor: colors.primary }]}
                      onPress={onForgotPasswordPress}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color={colors.onPrimary} />
                      ) : (
                        <Text style={[styles.dialogButtonText, { color: colors.onPrimary }]}>
                          Send Code
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <TextInput
                    style={[
                      styles.input,
                      styles.dialogInput,
                      {
                        backgroundColor: colors.background,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    placeholder="Reset Code"
                    placeholderTextColor={colors.textSecondary}
                    value={resetPasswordCode}
                    onChangeText={setResetPasswordCode}
                    keyboardType="number-pad"
                  />
                  <TextInput
                    style={[
                      styles.input,
                      styles.dialogInput,
                      {
                        backgroundColor: colors.background,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    placeholder="New Password"
                    placeholderTextColor={colors.textSecondary}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                  />
                  <View style={styles.dialogButtons}>
                    <TouchableOpacity
                      style={[
                        styles.dialogButton,
                        styles.dialogButtonOutline,
                        { borderColor: colors.border },
                      ]}
                      onPress={() => {
                        setResetStep('email');
                        setShowResetDialog(false);
                      }}
                    >
                      <Text style={[styles.dialogButtonText, { color: colors.text }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.dialogButton, { backgroundColor: colors.primary }]}
                      onPress={onResetPasswordPress}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color={colors.onPrimary} />
                      ) : (
                        <Text style={[styles.dialogButtonText, { color: colors.onPrimary }]}>
                          Reset Password
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    gap: 12,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  line: {
    flex: 1,
    height: 1,
  },
  orText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  socialButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  switchButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
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
    marginBottom: 24,
  },
  dialogButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  dialogButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dialogInput: {
    marginBottom: 16,
  },
  dialogButtonOutline: {
    borderWidth: 1,
  },
});
