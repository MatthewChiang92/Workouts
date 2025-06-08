import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  colors, 
  typography, 
  spacing, 
  borderRadius, 
  commonStyles, 
  normalize 
} from '../styles/globalStyles';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export default function NewRoutineScreen({ onSave, onCancel }) {
  const insets = useSafeAreaInsets();
  const [routineName, setRoutineName] = useState('New Routine');
  const [restDays, setRestDays] = useState({
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
    Saturday: true,
    Sunday: true
  });
  const [exercises, setExercises] = useState({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: []
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [trainingDayCount, setTrainingDayCount] = useState(0);
  const [restDayCount, setRestDayCount] = useState(7);

  useEffect(() => {
    const initialTrainingDays = Object.values(restDays).filter(isRest => !isRest).length;
    const initialRestDays = Object.values(restDays).filter(isRest => isRest).length;
    
    setTrainingDayCount(initialTrainingDays);
    setRestDayCount(initialRestDays);
    
    console.log(`Initial counts - Training: ${initialTrainingDays}, Rest: ${initialRestDays}`);
  }, []);

  const toggleRestDay = (day) => {
    setRestDays(prev => {
      const newRestDays = {
        ...prev,
        [day]: !prev[day]
      };
      
      const newTrainingDayCount = Object.values(newRestDays).filter(isRest => !isRest).length;
      const newRestDayCount = Object.values(newRestDays).filter(isRest => isRest).length;
      
      setTimeout(() => {
        setTrainingDayCount(newTrainingDayCount);
        setRestDayCount(newRestDayCount);
        console.log(`Updated counts - Training: ${newTrainingDayCount}, Rest: ${newRestDayCount}`);
      }, 0);
      
      console.log(`${day} is now ${newRestDays[day] ? 'a rest day' : 'a training day'}`);
      return newRestDays;
    });
  };

  const addExercise = (day) => {
    // This would open a modal or navigate to an add exercise screen
    // For now, we'll just log it
    console.log(`Adding exercise to ${day}`);
  };

  const saveRoutine = () => {
    // Double-check counts before saving (defensive programming)
    const finalTrainingDays = Object.values(restDays).filter(isRest => !isRest).length;
    const finalRestDays = Object.values(restDays).filter(isRest => isRest).length;
    
    // Create the new routine object
    const newRoutine = {
      name: routineName.trim() || 'New Routine',
      is_active: true,
      training_days: finalTrainingDays,
      rest_days: finalRestDays,
      exercises: []
    };
    
    console.log(`Saving routine with training days: ${finalTrainingDays}, rest days: ${finalRestDays}`);
    onSave(newRoutine);
  };

  return (
    <View style={[commonStyles.container, { paddingTop: insets.top }]}>
      <View style={commonStyles.screenHeader}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={typography.title}>Create New Routine</Text>
      </View>
      
      <View style={styles.countContainer}>
        <View style={styles.countItem}>
          <Text style={styles.countLabel}>Training Days</Text>
          <Text style={styles.countValue}>{trainingDayCount}</Text>
        </View>
        
        <View style={styles.countItem}>
          <Text style={styles.countLabel}>Rest Days</Text>
          <Text style={styles.countValue}>{restDayCount}</Text>
        </View>
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={commonStyles.contentContainer}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
        >
          {DAYS_OF_WEEK.map((day) => (
            <View key={day} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayName}>{day}</Text>
                <TouchableOpacity style={styles.editButton}>
                  <Text style={styles.editButtonText}>✎</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.dayContent}>
                <View style={styles.restDayRow}>
                  <View style={styles.restDayContainer}>
                    <Text style={styles.bedIcon}>🛌</Text>
                    <Text style={styles.restDayText}>Rest Day</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.toggleButton}
                    onPress={() => toggleRestDay(day)}
                  >
                    <Text style={styles.toggleButtonText}>
                      {restDays[day] ? '↓' : '+'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {!restDays[day] && (
                  <TouchableOpacity 
                    style={styles.addExerciseButton}
                    onPress={() => addExercise(day)}
                  >
                    <Text style={styles.addExerciseText}>+ Add First Exercise</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom || spacing.md }]}>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={saveRoutine}
          >
            <Text style={styles.saveButtonText}>Save Routine</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    marginBottom: spacing.sm,
    padding: spacing.xs,
  },
  backButtonText: {
    color: colors.text.primary,
    fontSize: normalize(24),
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  dayCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayName: {
    ...typography.body,
    fontWeight: 'bold',
  },
  dayContent: {
    padding: spacing.md,
  },
  restDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  restDayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bedIcon: {
    fontSize: normalize(16),
    marginRight: spacing.xs,
  },
  restDayText: {
    color: colors.text.secondary,
    fontSize: normalize(16),
  },
  toggleButton: {
    padding: spacing.xs,
  },
  toggleButtonText: {
    color: colors.text.secondary,
    fontSize: normalize(20),
  },
  addExerciseButton: {
    backgroundColor: '#222',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  addExerciseText: {
    color: colors.button.accent,
    fontSize: normalize(16),
  },
  footer: {
    padding: spacing.md,
  },
  saveButton: {
    backgroundColor: colors.button.accent,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.text.primary,
    fontSize: normalize(16),
    fontWeight: 'bold',
  },
  countContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  countItem: {
    flex: 1,
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    alignItems: 'center',
  },
  countLabel: {
    color: colors.text.secondary,
    fontSize: normalize(14),
    marginBottom: spacing.xs,
  },
  countValue: {
    color: colors.text.primary,
    fontSize: normalize(24),
    fontWeight: 'bold',
  },
}); 