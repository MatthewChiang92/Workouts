import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { 
  colors, 
  typography, 
  spacing, 
  borderRadius, 
  commonStyles, 
  normalize 
} from '../styles/globalStyles';

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signUpWithEmail() {
    if (!email || !username || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: 'workoutapp://login',
          data: {
            Username: username.trim(),
            email_confirm: true
          }
        }
      });

      if (signUpError) throw signUpError;

      // Attempt to sign in immediately after signup
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (signInError) {
        // If sign in fails, show the standard success message
        Alert.alert(
          'Sign Up Successful',
          'Your account has been created. Please check your email for a confirmation link to complete the registration.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Clear the form and go back to login
                setEmail('');
                setUsername('');
                setPassword('');
                setConfirmPassword('');
                navigation.navigate('Login');
              }
            }
          ]
        );
      }
      // If sign in succeeds, the auth listener in App.js will handle navigation

    } catch (error) {
      Alert.alert('Sign Up Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Sign up to get started</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.text.secondary}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        color={colors.text.primary}
      />
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor={colors.text.secondary}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        textContentType="username"
        autoComplete="username-new"
        color={colors.text.primary}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.text.secondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textContentType="newPassword"
        autoComplete="password-new"
        color={colors.text.primary}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor={colors.text.secondary}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        textContentType="newPassword"
        autoComplete="password-new"
        color={colors.text.primary}
      />
      
      <TouchableOpacity 
        style={styles.signupButton}
        onPress={signUpWithEmail}
        disabled={loading}
      >
        <Text style={styles.signupButtonText}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.footerLink}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    fontSize: normalize(24),
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: normalize(16),
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  input: {
    width: '100%',
    height: normalize(48),
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    fontSize: normalize(16),
    borderWidth: 1,
    borderColor: colors.border,
  },
  signupButton: {
    width: '100%',
    height: normalize(48),
    backgroundColor: colors.button.primary,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  signupButtonText: {
    color: colors.text.primary,
    fontSize: normalize(16),
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    marginTop: spacing.xl,
  },
  footerText: {
    color: colors.text.secondary,
    fontSize: normalize(14),
  },
  footerLink: {
    color: colors.button.accent,
    fontSize: normalize(14),
    fontWeight: '600',
  },
}); 