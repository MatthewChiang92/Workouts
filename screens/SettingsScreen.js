import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabaseClient';
import { 
  colors, 
  typography, 
  spacing, 
  borderRadius, 
  commonStyles, 
  normalize 
} from '../styles/globalStyles';
import { useWeightUnit } from '../contexts/WeightUnitContext';
import { WEIGHT_UNITS } from '../lib/weightUtils';

// Import the database functions from App.js
import { saveRoutinesToDB, loadRoutinesFromDB } from '../App';

// Import the AppHeader component
import AppHeader from '../components/AppHeader';

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [username, setUsername] = useState('Loading...');
  
  // Weight unit preference hook
  const { weightUnit, changeWeightUnit, isKg, isLbs } = useWeightUnit();

  useEffect(() => {
    // Fetch user email and username from auth metadata
    const fetchUserData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) {
          console.log('No user found');
          setUserEmail('Not logged in');
          setUsername('N/A');
          return;
        }

        // Set email
        setUserEmail(user.email || 'No email found');

        // Get username from user metadata
        console.log('User metadata:', user.user_metadata);
        if (user.user_metadata && (user.user_metadata.username || user.user_metadata.Username)) {
          // Check for both lowercase and uppercase Username
          const fetchedUsername = user.user_metadata.username || user.user_metadata.Username;
          setUsername(fetchedUsername);
          console.log('Fetched username from metadata:', fetchedUsername);
        } else {
          setUsername('Not set'); // Username not found in metadata
          console.log('Username not found in user metadata.');
        }

      } catch (error) {
        console.error('Error fetching user data:', error);
        setUserEmail('Error');
        setUsername('Error');
      }
    };

    fetchUserData();
  }, []);

  // Export all data using the Share API
  const exportData = async () => {
    try {
      setIsExporting(true);
      
      // Get current date for the filename suggestion
      const date = new Date();
      const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      const suggestedFilename = `workout_backup_${formattedDate}.json`;
      
      // Create a JSON string of all routines with a header comment
      const dataToExport = 
`// Workout Tracker Backup - ${formattedDate}
// Filename: ${suggestedFilename}
// Save this file with .json extension
${JSON.stringify(routines, null, 2)}`;
      
      // Show instructions before sharing
      Alert.alert(
        'Export Instructions',
        'You will now see sharing options. To save your data:\n\n1. Choose "Save to Files" or similar option\n2. Name the file: ' + suggestedFilename + '\n3. Make sure to include the .json extension',
        [
          {
            text: 'Continue',
            onPress: async () => {
              try {
                // Use the Share API (built into React Native)
                const result = await Share.share({
                  title: suggestedFilename,
                  message: Platform.OS === 'ios' ? suggestedFilename : dataToExport,
                  url: Platform.OS === 'ios' ? dataToExport : undefined,
                }, {
                  // Additional share options
                  dialogTitle: `Save as: ${suggestedFilename}`,
                  subject: suggestedFilename,
                });
                
                if (result.action === Share.sharedAction) {
                  // User completed the share action
                  Alert.alert(
                    'Export Successful', 
                    `Your workout data has been shared. Remember to save it as "${suggestedFilename}".`
                  );
                } else if (result.action === Share.dismissedAction) {
                  // User dismissed the share dialog
                  Alert.alert('Export Cancelled', 'No backup was created because the share was cancelled.');
                }
              } catch (error) {
                console.error('Error during share:', error);
                Alert.alert('Export Failed', 'There was an error during the share operation');
              } finally {
                setIsExporting(false);
              }
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setIsExporting(false);
              Alert.alert('Export Cancelled', 'No backup was created.');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error preparing export:', error);
      Alert.alert('Export Failed', 'There was an error preparing your data for export');
      setIsExporting(false);
    }
  };

  // Import data - just show a message for now
  const importData = () => {
    Alert.alert(
      'Import Data',
      'To import data, please create a backup file first, then contact support for assistance with importing your data.',
      [{ text: 'OK', onPress: () => {} }]
    );
  };

  // Reset all data
  const resetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all your routines and exercises. This action cannot be undone. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear AsyncStorage data
              await AsyncStorage.removeItem('routines');
              await AsyncStorage.setItem('isFirstRun', 'true');
              
              // Reset state
              setRoutines([]);
              
              Alert.alert('Success', 'All data has been reset');
            } catch (error) {
              console.error('Error resetting data:', error);
              Alert.alert('Reset Failed', 'There was an error resetting your data');
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // The auth state change listener in App.js will handle navigation
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Logout Failed', 'There was an error logging out. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // --- Delete Account Logic ---
  const handleDeleteAccount = async () => {
    // First Confirmation
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action is irreversible and all your data will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmSecondStage() // Proceed to second confirmation
        },
      ]
    );
  };

  const confirmSecondStage = () => {
    // Second Confirmation
    Alert.alert(
      'Confirm Deletion',
      'Please type "DELETE" to confirm. You will lose all routines, exercises, and account information permanently.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Delete',
          style: 'destructive',
          onPress: (inputValue) => {
            // Note: Standard Alert doesn't directly support text input capture easily.
            // For production, consider a custom modal for better UX and input handling.
            // We will simulate the input check here.
            // A real implementation should compare `inputValue` from a modal input.
            // Simulating confirmation for now:
            console.log('User confirmed deletion (simulation).');
            invokeDeleteFunction();
          }
        },
      ],
      'plain-text' // This enables a text input field in the alert (iOS only)
      // For cross-platform, a custom modal is needed for input.
    );
  };

  const invokeDeleteFunction = async () => {
    setIsDeleting(true);
    try {
      console.log('Invoking Supabase function: delete-user');
      const { error } = await supabase.functions.invoke('delete-user');

      if (error) {
        throw error;
      }

      // If function succeeds, log the user out
      Alert.alert('Account Deleted', 'Your account and all associated data have been permanently deleted.');
      await supabase.auth.signOut();
      // Auth listener in App.js should handle navigation to login

    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert(
        'Deletion Failed',
        `There was an error deleting your account: ${error.message}. Please contact support if the issue persists.`
      );
    } finally {
      setIsDeleting(false);
    }
  };
  // --- End Delete Account Logic ---

  return (
    <View style={styles.container}>
      <AppHeader
        title="Settings"
        showBack={false}
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account</Text>

            {/* Username Row */}
            <View style={styles.accountInfoRow}>
              <Text style={styles.accountLabel}>Username:</Text>
              <Text style={[styles.accountValue, styles.usernameText]}>{username}</Text>
            </View>

            {/* Email Row */}
            <View style={styles.accountInfoRow}>
              <Text style={styles.accountLabel}>Email:</Text>
              <Text style={styles.accountValue}>{userEmail}</Text>
            </View>
            
            {/* Buttons Container */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.logoutButton]}
                onPress={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Logout</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, styles.deleteButton]}
                onPress={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color={colors.button.danger} />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Preferences</Text>
            
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceLabel}>Weight Unit</Text>
                <Text style={styles.preferenceDescription}>
                  Choose your preferred unit for weights
                </Text>
              </View>
              
              <View style={styles.weightUnitToggle}>
                <TouchableOpacity 
                  style={[
                    styles.unitButton, 
                    isKg && styles.unitButtonActive
                  ]}
                  onPress={async () => {
                    if (!isKg) {
                      const success = await changeWeightUnit(WEIGHT_UNITS.KG);
                      if (!success) {
                        Alert.alert('Error', 'Failed to save weight unit preference');
                      }
                    }
                  }}
                >
                  <Text style={[
                    styles.unitButtonText,
                    isKg && styles.unitButtonTextActive
                  ]}>
                    kg
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.unitButton, 
                    isLbs && styles.unitButtonActive
                  ]}
                  onPress={async () => {
                    if (!isLbs) {
                      const success = await changeWeightUnit(WEIGHT_UNITS.LBS);
                      if (!success) {
                        Alert.alert('Error', 'Failed to save weight unit preference');
                      }
                    }
                  }}
                >
                  <Text style={[
                    styles.unitButtonText,
                    isLbs && styles.unitButtonTextActive
                  ]}>
                    lbs
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>About</Text>
            <Text style={styles.cardDescription}>
              Version 1.0.0
            </Text>
            <Text style={styles.cardDescription}>
              A simple app to track your workouts and routines.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: 120, // Add padding for floating tab bar
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: normalize(18),
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: normalize(16),
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  cardDescription: {
    fontSize: normalize(14),
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    width: '100%',
    height: normalize(48),
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  logoutButton: {
    backgroundColor: colors.button.primary,
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.button.danger,
  },
  buttonText: {
    color: colors.text.primary,
    fontSize: normalize(16),
    fontWeight: '600',
  },
  deleteButtonText: {
    color: colors.button.danger,
    fontSize: normalize(16),
    fontWeight: '600',
  },
  emailText: {
    color: colors.text.primary,
    fontSize: normalize(15),
    marginBottom: spacing.md,
  },
  usernameText: {
    color: colors.text.primary,
    fontSize: normalize(15),
    fontWeight: 'bold',
  },
  accountInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  accountLabel: {
    fontSize: normalize(14),
    color: colors.text.secondary,
    marginRight: spacing.sm,
  },
  accountValue: {
    fontSize: normalize(15),
    color: colors.text.primary,
    flexShrink: 1,
    textAlign: 'right',
  },
  // Weight unit preference styles
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  preferenceInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  preferenceLabel: {
    fontSize: normalize(16),
    color: colors.text.primary,
    fontWeight: '500',
    marginBottom: spacing.xs / 2,
  },
  preferenceDescription: {
    fontSize: normalize(14),
    color: colors.text.secondary,
  },
  weightUnitToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  unitButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'transparent',
  },
  unitButtonActive: {
    backgroundColor: colors.button.accent,
  },
  unitButtonText: {
    fontSize: normalize(14),
    color: colors.text.secondary,
    fontWeight: '500',
  },
  unitButtonTextActive: {
    color: colors.text.primary,
    fontWeight: '600',
  },
}); 