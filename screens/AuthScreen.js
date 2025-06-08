import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabaseClient'; // Import supabase client
import { 
  colors, 
  typography, 
  spacing, 
  borderRadius, 
  commonStyles, 
  normalize 
} from '../styles/globalStyles';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          Alert.alert(
            'Email Not Confirmed',
            'Please check your email for the confirmation link. Would you like us to resend it?',
            [
              {
                text: 'Cancel',
                style: 'cancel'
              },
              {
                text: 'Resend',
                onPress: async () => {
                  const { error: resendError } = await supabase.auth.resend({
                    type: 'signup',
                    email: email,
                  });
                  if (resendError) {
                    Alert.alert('Error', resendError.message);
                  } else {
                    Alert.alert('Success', 'Confirmation email resent. Please check your inbox.');
                  }
                }
              }
            ]
          );
        } else {
          Alert.alert('Login Error', error.message);
        }
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function signUpWithEmail() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      // Sign up with email confirmation disabled
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: 'workoutapp://login',
          data: {
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
                // Clear the form
                setEmail('');
                setPassword('');
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
      <Text style={styles.title}>Workout App</Text>
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
        placeholder="Password"
        placeholderTextColor={colors.text.secondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textContentType="password"
        autoComplete="password"
        color={colors.text.primary}
      />
      <View style={styles.buttonContainer}>
        <Button
          title={loading ? 'Logging in...' : 'Login'}
          onPress={signInWithEmail}
          disabled={loading}
          color={colors.button.accent}
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title={loading ? 'Signing up...' : 'Sign Up'}
          onPress={signUpWithEmail}
          disabled={loading}
          color={colors.button.primary}
        />
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
    ...typography.h1,
    marginBottom: spacing.xl,
    color: colors.text.primary,
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
  buttonContainer: {
    width: '100%',
    marginTop: spacing.md,
  },
}); 