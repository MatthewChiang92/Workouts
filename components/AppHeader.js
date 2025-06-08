import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, normalize } from '../styles/globalStyles';

/**
 * A consistent header component for use across the app
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Main title text
 * @param {string} [props.subtitle] - Optional subtitle text
 * @param {Function} [props.onBack] - Optional callback for back button press
 * @param {React.ReactNode} [props.rightElement] - Optional element to display on the right
 * @param {boolean} [props.showBack=true] - Whether to show the back button
 */
const AppHeader = ({ 
  title, 
  subtitle, 
  onBack, 
  rightElement, 
  showBack = true 
}) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.statusBar} />
      
      {/* Top row with back button and optional right element */}
      <View style={styles.topRow}>
        {showBack && onBack ? (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onBack}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}
        
        {rightElement && (
          <View style={styles.rightContainer}>
            {rightElement}
          </View>
        )}
      </View>
      
      {/* Title row */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
      </View>
      
      {/* Optional subtitle */}
      {subtitle && (
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  backButton: {
    padding: spacing.xs,
  },
  backButtonText: {
    color: colors.text.primary,
    fontSize: normalize(16),
  },
  spacer: {
    width: 60, // Approximately the width of the back button
  },
  rightContainer: {
    alignItems: 'flex-end',
  },
  titleContainer: {
    marginBottom: spacing.sm, // Fixed margin that doesn't depend on subtitle
  },
  title: {
    ...typography.title,
    fontSize: normalize(24),
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  subtitleContainer: {
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: normalize(16),
    color: colors.text.secondary,
  },
});

export default AppHeader; 