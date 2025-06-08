import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native';
import { 
  colors, 
  typography, 
  spacing, 
  borderRadius, 
  normalize,
  commonStyles,
} from '../styles/globalStyles';
import { Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function AddStrengthExerciseModal({ visible, onClose, onSave, day, exercise, isEditing }) {
  console.log('AddStrengthExerciseModal rendered with visible =', visible);
  
  // Track visibility changes for debugging
  useEffect(() => {
    console.log('AddStrengthExerciseModal visibility changed to:', visible);
    if (visible) {
      console.log('Modal should be visible with exercise:', exercise);
    }
  }, [visible]);
  
  const [exerciseName, setExerciseName] = useState(exercise?.name || '');
  const [isQuickAdd, setIsQuickAdd] = useState(true);
  const [trackingType, setTrackingType] = useState('reps'); // 'reps' or 'time'
  const [sets, setSets] = useState(exercise?.sets?.toString() || '3');
  const [isFixedReps, setIsFixedReps] = useState(true);
  const [reps, setReps] = useState(exercise?.reps?.toString() || '12');
  const [repsMin, setRepsMin] = useState('');
  const [repsMax, setRepsMax] = useState('');
  const [weight, setWeight] = useState(exercise?.weight?.toString() || '0');
  const [notes, setNotes] = useState(exercise?.notes || '');
  
  // Animation value for popup
  const [animation] = useState(new Animated.Value(0));
  
  // Add these state variables inside the component
  const [previousExercises, setPreviousExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  
  // Add a ref to track dropdown state
  const dropdownDisabled = useRef(false);
  
  // This effect runs when the modal becomes visible or when the exercise prop changes
  useEffect(() => {
    console.log('AddStrengthExerciseModal visibility changed to:', visible);
    
    if (visible) {
      // If we're editing an existing exercise or received a preselected exercise, populate the form
      if (exercise) {
        console.log('Populating form with exercise:', exercise);
        
        // Set dropdown disabled temporarily to prevent it from showing
        // when we set the exercise name
        dropdownDisabled.current = true;
        
        setExerciseName(exercise.name || '');
        setSets(exercise.sets?.toString() || '3');
        
        // Handle rep ranges
        if (exercise.reps && exercise.reps.includes('-')) {
          // It's a range like "8-12"
          setIsFixedReps(false);
          const [min, max] = exercise.reps.split('-');
          setRepsMin(min || '');
          setRepsMax(max || '');
        } else {
          // It's a fixed value
          setIsFixedReps(true);
          setReps(exercise.reps?.toString() || '12');
        }
        
        setWeight(exercise.weight?.toString() || '0');
        setTrackingType(exercise.trackingType || 'reps');
        
        // Only switch to custom mode if we're editing (not if just selecting from search)
        if (isEditing) {
          setIsQuickAdd(false);
        }
        
        // Re-enable dropdown after a short delay
        setTimeout(() => {
          dropdownDisabled.current = false;
        }, 500);
      } else {
        // Reset form for a new exercise
        resetForm();
      }
      
      // Animate in
      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start();
      loadPreviousExercises();
    } else {
      // Animate out
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, exercise, isEditing]);

  // Remove the isEditing check from the dropdown useEffect
  useEffect(() => {
    // Check if dropdown is disabled
    if (dropdownDisabled.current) {
      setShowNameDropdown(false);
      return;
    }
    
    // Normal dropdown behavior for both new and editing exercises
    if (exerciseName.trim() === '') {
      setShowNameDropdown(false);
    } else {
      const filtered = previousExercises.filter(exercise => 
        exercise.name.toLowerCase().includes(exerciseName.toLowerCase())
      );
      setFilteredExercises(filtered);
      setShowNameDropdown(filtered.length > 0);
    }
  }, [exerciseName, previousExercises]);

  const handleSave = () => {
    // Validate input
    if (!exerciseName.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }
    
    // Convert inputs to appropriate types
    const exerciseData = {
      name: exerciseName.trim(),
      sets: sets || '3',
      reps: isFixedReps ? (reps || '12') : `${repsMin || '8'}-${repsMax || '12'}`,
      weight: weight || '0',
      notes: notes.trim(),
      type: 'strength',
      day: day,
      isCompleted: false,
      isPR: false
    };
    
    console.log('Saving exercise data:', exerciseData);
    onSave(exerciseData);
  };

  const resetForm = () => {
    setExerciseName('');
    setIsQuickAdd(true);
    setTrackingType('reps');
    setSets('3');
    setIsFixedReps(true);
    setReps('12');
    setRepsMin('');
    setRepsMax('');
    setWeight('0');
    setNotes('');
    
    // Reset dropdown state without disabling it
    dropdownDisabled.current = false;
    setShowNameDropdown(false);
    setFilteredExercises([]);
  };
  
  // Calculate animation styles
  const popupScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });
  
  const popupOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Add this function to load previous exercises
  const loadPreviousExercises = async () => {
    try {
      const routinesJson = await AsyncStorage.getItem('routines');
      if (routinesJson) {
        const routines = JSON.parse(routinesJson);
        
        // Extract all unique exercise names
        const uniqueExercises = [];
        const exerciseNames = new Set();
        
        routines.forEach(routine => {
          if (routine.exercises && routine.exercises.length > 0) {
            routine.exercises.forEach(exercise => {
              if (!exerciseNames.has(exercise.name)) {
                exerciseNames.add(exercise.name);
                uniqueExercises.push(exercise);
              }
            });
          }
        });
        
        setPreviousExercises(uniqueExercises);
      }
    } catch (error) {
      console.error('Error loading previous exercises:', error);
    }
  };

  // Update the handleSelectExercise function to ensure dropdown disappears
  const handleSelectExercise = (exercise) => {
    // First, hide the dropdown
    setShowNameDropdown(false);
    
    // Then update the fields with a slight delay to prevent the dropdown from reappearing
    setTimeout(() => {
      setExerciseName(exercise.name);
      setSets(exercise.sets?.toString() || '3');
      setReps(exercise.reps?.toString() || '12');
      setWeight(exercise.weight?.toString() || '0');
      
      // Disable dropdown for a longer period
      dropdownDisabled.current = true;
      setTimeout(() => {
        dropdownDisabled.current = false;
      }, 500);
    }, 100);
  };

  const handleSelectTrackingType = (type) => {
    setTrackingType(type);
  };

  const handleToggleAddType = (isQuick) => {
    setIsQuickAdd(isQuick);
  };

  const handleToggleRepsType = (isFixed) => {
    setIsFixedReps(isFixed);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalContainer}>
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [{ scale: popupScale }],
                opacity: popupOpacity
              }
            ]}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Add Strength Exercise</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  console.log('Close button pressed');
                  onClose();
                }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.nameInput}
              value={exerciseName}
              onChangeText={setExerciseName}
              placeholder="Exercise Name"
              placeholderTextColor="#666"
            />
            
            <View style={styles.toggleContainer}>
              <TouchableOpacity 
                style={[
                  styles.toggleButton, 
                  isQuickAdd && styles.toggleButtonActive
                ]}
                onPress={() => handleToggleAddType(true)}
              >
                <Text style={styles.toggleButtonIcon}>⚡</Text>
                <Text style={styles.toggleButtonText}>Quick Add</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.toggleButton, 
                  !isQuickAdd && styles.toggleButtonActive
                ]}
                onPress={() => handleToggleAddType(false)}
              >
                <Text style={styles.toggleButtonIcon}>⚙️</Text>
                <Text style={styles.toggleButtonText}>Custom</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.sectionTitle}>Details</Text>
            
            <View style={styles.trackingTypeContainer}>
              <TouchableOpacity 
                style={[
                  styles.trackingTypeButton, 
                  trackingType === 'reps' && styles.trackingTypeButtonActive,
                  { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }
                ]}
                onPress={() => handleSelectTrackingType('reps')}
              >
                <Text style={styles.trackingTypeButtonText}>Reps</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.trackingTypeButton, 
                  trackingType === 'time' && styles.trackingTypeButtonActive,
                  { borderTopRightRadius: 8, borderBottomRightRadius: 8 }
                ]}
                onPress={() => handleSelectTrackingType('time')}
              >
                <Text style={styles.trackingTypeButtonText}>Time</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Number of Sets</Text>
              <TextInput
                style={styles.input}
                value={sets}
                onChangeText={setSets}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.formGroup}>
              <View style={styles.repsLabelRow}>
                <Text style={styles.inputLabel}>Reps</Text>
                <View style={styles.repsToggleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.repsToggleButton,
                      isFixedReps && styles.repsToggleButtonActive,
                      { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }
                    ]}
                    onPress={() => handleToggleRepsType(true)}
                  >
                    <Text style={styles.repsToggleButtonText}>Fixed</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.repsToggleButton,
                      !isFixedReps && styles.repsToggleButtonActive,
                      { borderTopRightRadius: 8, borderBottomRightRadius: 8 }
                    ]}
                    onPress={() => handleToggleRepsType(false)}
                  >
                    <Text style={styles.repsToggleButtonText}>Range</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.repsInputContainer}>
                <TextInput
                  style={styles.input}
                  value={reps}
                  onChangeText={setReps}
                  keyboardType="numeric"
                />
                <Text style={styles.inputUnit}>reps</Text>
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Weight (optional)</Text>
              <View style={styles.weightInputContainer}>
                <TextInput
                  style={styles.input}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="Leave empty for bodyweight"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />
                <Text style={styles.inputUnit}>kg</Text>
              </View>
            </View>
            
            <View style={styles.footer}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={onClose}
              >
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleSave}
              >
                <Text style={styles.addButtonText}>Add Exercise</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    color: '#999',
    fontSize: 20,
  },
  nameInput: {
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#444',
  },
  toggleButtonIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 16,
  },
  trackingTypeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  trackingTypeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222',
    paddingVertical: 12,
  },
  trackingTypeButtonActive: {
    backgroundColor: '#444',
  },
  trackingTypeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    flex: 1,
  },
  repsLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  repsToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#222',
    borderRadius: 8,
    overflow: 'hidden',
  },
  repsToggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  repsToggleButtonActive: {
    backgroundColor: '#444',
  },
  repsToggleButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  repsInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputUnit: {
    color: '#999',
    marginLeft: 8,
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 16,
  },
  backButton: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 20,
  },
  addButton: {
    flex: 1,
    backgroundColor: '#7c6aef',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 