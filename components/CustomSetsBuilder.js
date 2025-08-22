import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { 
  colors, 
  typography, 
  spacing, 
  borderRadius, 
  normalize,
} from '../styles/globalStyles';
import { useWeightUnit } from '../contexts/WeightUnitContext';
import { 
  addSetToCustomSets, 
  removeSetFromCustomSets, 
  updateSetInCustomSets,
  createEmptySet,
} from '../lib/customSetsUtils';

export default function CustomSetsBuilder({ 
  customSets = [], 
  onSetsChange, 
  style 
}) {
  const { weightUnit } = useWeightUnit();
  
  // Add a new set
  const handleAddSet = () => {
    const newSets = addSetToCustomSets(customSets);
    onSetsChange(newSets);
  };
  
  // Remove a set
  const handleRemoveSet = (index) => {
    if (customSets.length <= 1) {
      Alert.alert('Cannot Remove', 'You must have at least one set');
      return;
    }
    
    const newSets = removeSetFromCustomSets(customSets, index);
    onSetsChange(newSets);
  };
  
  // Update a set's reps or weight
  const handleUpdateSet = (index, field, value) => {
    const updatedSet = { [field]: value };
    const newSets = updateSetInCustomSets(customSets, index, updatedSet);
    onSetsChange(newSets);
  };
  
  // Initialize with one set if empty
  React.useEffect(() => {
    console.log('CustomSetsBuilder mounted, customSets length:', customSets.length);
    if (customSets.length === 0) {
      console.log('Adding initial empty set');
      onSetsChange([createEmptySet()]);
    }
  }, []);
  
  console.log('CustomSetsBuilder rendering with', customSets.length, 'sets:', customSets);
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>Custom Sets</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddSet}
        >
          <Text style={styles.addButtonText}>+ Add Set</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.setsContainer}
        showsVerticalScrollIndicator={false}
      >
        {customSets.map((set, index) => (
          <View key={index} style={styles.setRow}>
            <View style={styles.setNumber}>
              <Text style={styles.setNumberText}>{index + 1}</Text>
            </View>
            
            <View style={styles.setInputs}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reps</Text>
                <TextInput
                  style={styles.input}
                  value={set.reps}
                  onChangeText={(value) => handleUpdateSet(index, 'reps', value)}
                  placeholder="12"
                  placeholderTextColor={colors.text.secondary}
                  keyboardType="numeric"
                  returnKeyType="next"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Weight</Text>
                <View style={styles.weightInput}>
                  <TextInput
                    style={[styles.input, styles.weightInputField]}
                    value={set.weight}
                    onChangeText={(value) => handleUpdateSet(index, 'weight', value)}
                    placeholder="60"
                    placeholderTextColor={colors.text.secondary}
                    keyboardType="numeric"
                    returnKeyType="next"
                  />
                  <Text style={styles.weightUnit}>{weightUnit}</Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => handleRemoveSet(index)}
            >
              <Text style={styles.removeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          Total: {customSets.length} set{customSets.length !== 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Remove flex: 1 to prevent layout issues
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.subtitle,
    fontWeight: '600',
    color: colors.text.primary,
  },
  addButton: {
    backgroundColor: colors.button.accent,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  addButtonText: {
    color: colors.text.primary,
    fontSize: normalize(14),
    fontWeight: '500',
  },
  setsContainer: {
    maxHeight: 300, // Prevent it from taking too much space
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  setNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.button.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  setNumberText: {
    color: colors.text.primary,
    fontSize: normalize(14),
    fontWeight: 'bold',
  },
  setInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: normalize(12),
    color: colors.text.secondary,
    marginBottom: spacing.xs / 2,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    color: colors.text.primary,
    fontSize: normalize(16),
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
  },
  weightInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightInputField: {
    flex: 1,
    marginRight: spacing.xs,
  },
  weightUnit: {
    color: colors.text.secondary,
    fontSize: normalize(12),
    fontWeight: '500',
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.button.danger,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  removeButtonText: {
    color: colors.text.primary,
    fontSize: normalize(18),
    fontWeight: 'bold',
    lineHeight: normalize(20),
  },
  summary: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  summaryText: {
    color: colors.text.secondary,
    fontSize: normalize(14),
    fontWeight: '500',
  },
});