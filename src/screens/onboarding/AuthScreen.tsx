import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSignIn, useSignUp, useSSO } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors } from '../../theme/colors';
import { storage } from '../../services/storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

type Step = 'auth' | 'verify';
type Flow = 'signin' | 'signup';

export function AuthScreen() {
  const { signIn, setActive: setSignInActive, isLoaded: isSignInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: isSignUpLoaded } = useSignUp();
  const { startSSOFlow } = useSSO();

  const [step, setStep] = useState<Step>('auth');
  const [flow, setFlow] = useState<Flow>('signin');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset password state
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetStep, setResetStep] = useState<'email' | 'code'>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const colors = getThemeColors(theme);

  const finishAuth = async () => {
    await storage.setOnboardingCompleted(true);
  };

  // ── Sign-in ──────────────────────────────────────────────────────────────

  const onSignInPress = async () => {
    if (!isSignInLoaded) return;
    setLoading(true);
    try {
      // Don't pass password at all when empty — passing password:undefined can
      // cause Clerk to select the wrong auth strategy on passwordless instances.
      const result = await signIn.create(
        password ? { identifier: email, password } : { identifier: email }
      );

      if (result.status === 'complete') {
        await setSignInActive({ session: result.createdSessionId });
        await finishAuth();
        return;
      }

      if (result.status === 'needs_first_factor') {
        const emailFactor = result.supportedFirstFactors?.find(
          f => f.strategy === 'email_code'
        ) as { strategy: string; emailAddressId: string } | undefined;

        if (!emailFactor) {
          Alert.alert('Error', 'No supported verification method found for this account.');
          return;
        }

        await signIn.prepareFirstFactor({
          strategy: 'email_code',
          emailAddressId: emailFactor.emailAddressId,
        });

        setFlow('signin');
        setStep('verify');
        return;
      }

      Alert.alert('Error', `Unexpected sign-in status: ${result.status}`);
    } catch (err: any) {
      const msg = err.errors?.[0]?.longMessage ?? err.errors?.[0]?.message ?? 'Failed to sign in';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const onVerifySignIn = async () => {
    if (!isSignInLoaded) return;
    setLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({ strategy: 'email_code', code });

      if (result.status === 'complete') {
        await setSignInActive({ session: result.createdSessionId });
        await finishAuth();
        return;
      }

      // MFA is required — surface it clearly rather than showing "Verification failed"
      if (result.status === 'needs_second_factor') {
        Alert.alert(
          'Second factor required',
          'This account has multi-factor authentication enabled. MFA is not yet supported in this app.'
        );
        return;
      }

      Alert.alert('Error', `Unexpected status after verify: ${result.status}`);
    } catch (err: any) {
      const msg = err.errors?.[0]?.longMessage ?? err.errors?.[0]?.message ?? 'Invalid code';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Sign-up ──────────────────────────────────────────────────────────────

  const onSignUpPress = async () => {
    if (!isSignUpLoaded) return;
    setLoading(true);
    try {
      await signUp.create({ emailAddress: email, password: password || undefined });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setFlow('signup');
      setStep('verify');
    } catch (err: any) {
      Alert.alert('Error', err.errors?.[0]?.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const onVerifySignUp = async () => {
    if (!isSignUpLoaded) return;
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === 'complete') {
        await setSignUpActive({ session: result.createdSessionId });
        await finishAuth();
      } else {
        Alert.alert('Error', 'Verification failed. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.errors?.[0]?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  // ── SSO ──────────────────────────────────────────────────────────────────

  const onSelectOAuth = async (strategy: 'oauth_google' | 'oauth_apple') => {
    if (!isSignInLoaded || !isSignUpLoaded) return;
    setLoading(true);
    try {
      const {
        createdSessionId,
        setActive,
        signIn: ssoSignIn,
        signUp: ssoSignUp,
      } = await startSSOFlow({
        strategy,
        redirectUrl: Linking.createURL('/'),
      });

      // Existing user — session ready immediately
      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
        await finishAuth();
        return;
      }

      // New user — SSO sign-up completed fully
      if (ssoSignUp?.createdSessionId) {
        await setActive!({ session: ssoSignUp.createdSessionId });
        await finishAuth();
        return;
      }

      // New user — sign-up exists but needs extra fields before it can complete
      if (ssoSignUp?.status === 'missing_requirements') {
        const missing = ssoSignUp.missingFields ?? [];
        console.log('[SSO] missingFields:', missing);

        const patch: Record<string, string> = {};
        for (const field of missing) {
          if (field === 'username') {
            const base = (ssoSignUp.emailAddress ?? 'user')
              .split('@')[0]
              .replace(/[^a-z0-9]/gi, '')
              .toLowerCase()
              .slice(0, 15);
            patch.username = `${base}${Math.floor(Math.random() * 9000) + 1000}`;
          }
        }

        const stillMissing = missing.filter(f => !(f in patch));
        if (stillMissing.length > 0) {
          Alert.alert(
            'Sign up incomplete',
            `This sign-in method requires additional information: ${stillMissing.join(', ')}`
          );
          return;
        }

        const completed = await ssoSignUp.update(patch as any);
        if (completed.status === 'complete' && completed.createdSessionId) {
          await setActive!({ session: completed.createdSessionId });
          await finishAuth();
          return;
        }

        console.warn('[SSO] After update — status:', completed.status, 'missing:', completed.missingFields);
        Alert.alert('Sign up incomplete', 'Could not complete sign-up. Please try again.');
        return;
      }

      // Sign-in that completed via the signIn sub-object
      if (ssoSignIn?.createdSessionId) {
        await setActive!({ session: ssoSignIn.createdSessionId });
        await finishAuth();
        return;
      }

      console.warn('[SSO] No session. signIn:', ssoSignIn?.status, 'signUp:', ssoSignUp?.status);
      Alert.alert('Sign in incomplete', 'Authentication completed but no session was created.');
    } catch (err: any) {
      console.error('[SSO] error:', err);
      const msg =
        err.errors?.[0]?.longMessage ??
        err.errors?.[0]?.message ??
        err.message ??
        'An error occurred during sign in';
      if (msg.includes('already signed in')) {
        await finishAuth();
        return;
      }
      Alert.alert('Sign In Error', msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Reset password ────────────────────────────────────────────────────────

  const onSendResetCode = async () => {
    if (!isSignInLoaded) return;
    setLoading(true);
    try {
      await signIn.create({ strategy: 'reset_password_email_code', identifier: resetEmail });
      setResetStep('code');
    } catch (err: any) {
      Alert.alert('Error', err.errors?.[0]?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async () => {
    if (!isSignInLoaded) return;
    setLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: resetCode,
        password: newPassword,
      });

      if (result.status === 'complete') {
        await setSignInActive({ session: result.createdSessionId });
        setShowResetDialog(false);
        await finishAuth();
      } else {
        Alert.alert('Error', 'Failed to reset password. Please check the code and try again.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.errors?.[0]?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (step === 'verify') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Check your email</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We sent a 6-digit code to {email}
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.input, color: colors.text, borderColor: colors.border },
              ]}
              placeholder="000000"
              placeholderTextColor={colors.textSecondary}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={flow === 'signup' ? onVerifySignUp : onVerifySignIn}
              disabled={loading || code.length < 6}
            >
              {loading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Verify</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                setStep('auth');
                setCode('');
              }}
            >
              <Text style={[styles.switchText, { color: colors.textSecondary }]}>
                ← Back to sign in
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {isSignUpMode ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sign in to sync your tasks
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.input, color: colors.text, borderColor: colors.border },
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
              { backgroundColor: colors.input, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="Password (optional)"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {!isSignUpMode && (
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
            onPress={isSignUpMode ? onSignUpPress : onSignInPress}
            disabled={loading || !email}
          >
            {loading ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
                {isSignUpMode ? 'Sign Up' : 'Sign In'}
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

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsSignUpMode(m => !m)}
        >
          <Text style={[styles.switchText, { color: colors.textSecondary }]}>
            {isSignUpMode
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
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
                    value={resetEmail}
                    onChangeText={setResetEmail}
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
                      onPress={onSendResetCode}
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
                    value={resetCode}
                    onChangeText={setResetCode}
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
                      onPress={onResetPassword}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color={colors.onPrimary} />
                      ) : (
                        <Text style={[styles.dialogButtonText, { color: colors.onPrimary }]}>
                          Reset
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
  container: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16 },
  form: { gap: 12 },
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
  buttonText: { fontSize: 16, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  line: { flex: 1, height: 1 },
  orText: { marginHorizontal: 16, fontSize: 14 },
  socialButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  socialButtonText: { fontSize: 16, fontWeight: '500' },
  switchButton: { marginTop: 24, alignItems: 'center' },
  switchText: { fontSize: 14 },
  forgotPasswordButton: { alignSelf: 'flex-end', marginBottom: 8 },
  forgotPasswordText: { fontSize: 14, fontWeight: '500' },
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContainer: { width: '100%', maxWidth: 400, borderRadius: 16, padding: 24 },
  dialogTitle: { fontSize: 24, fontWeight: '700', marginBottom: 24 },
  dialogButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  dialogButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogButtonText: { fontSize: 16, fontWeight: '600' },
  dialogInput: { marginBottom: 16 },
  dialogButtonOutline: { borderWidth: 1 },
});
