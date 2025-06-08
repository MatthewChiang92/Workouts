import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { 
  colors, 
  typography, 
  spacing, 
  borderRadius, 
  commonStyles, 
  normalize 
} from '../styles/globalStyles';

export default function LoginScreen({ navigation }) {
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>
      
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
      
      <TouchableOpacity 
        style={styles.loginButton}
        onPress={signInWithEmail}
        disabled={loading}
      >
        <Text style={styles.loginButtonText}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.footerLink}>Sign Up</Text>
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
  loginButton: {
    width: '100%',
    height: normalize(48),
    backgroundColor: colors.button.accent,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  loginButtonText: {
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