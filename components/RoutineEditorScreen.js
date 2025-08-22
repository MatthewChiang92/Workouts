import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  Animated,
  PanResponder,
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
import ExerciseTypeModal from './ExerciseTypeModal';
import AddStrengthExerciseModal from './AddStrengthExerciseModal';
import AppHeader from './AppHeader';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export default function RoutineEditorScreen({ navigation, route }) {
  // Get props from navigation params if available, otherwise use direct props
  const { routine = null, onSave, onCancel, onDelete } = route?.params || {};
  console.log('RoutineEditorScreen rendered with routine:', routine?.name);
  
  const insets = useSafeAreaInsets();
  const isEditMode = !!routine;
  
  // Initialize state from routine if in edit mode
  const [name, setName] = useState(routine?.name || 'New Routine');
  const [trainingDays, setTrainingDays] = useState(() => {
    if (routine) {
      // Use existing value for edit mode
      return routine.trainingDays?.toString() || '0';
    }
    // Default to 0 for new routines
    return '0';
  });
  const [restDays, setRestDays] = useState(() => {
    if (routine) {
      // Use existing value for edit mode
      return routine.restDays?.toString() || '7';
    }
    // Default to 7 for new routines
    return '7';
  });
  const [isActive, setIsActive] = useState(routine?.isActive || false);
  
  // Log state initialization
  useEffect(() => {
    console.log('RoutineEditorScreen initialized with:', {
      isEditMode,
      name, 
      trainingDays, 
      restDays,
      isActive
    });
  }, []);
  
  // Initialize rest days based on existing training/rest day counts
  const [restDaysConfig, setRestDaysConfig] = useState(() => {
    if (routine) {
      // If the routine has exercises, determine which days are rest days
      // based on which days have exercises
      const defaultRestDays = {
        Monday: true,
        Tuesday: true,
        Wednesday: true,
        Thursday: true,
        Friday: true,
        Saturday: true,
        Sunday: true
      };
      
      // If the routine has exercises, mark those days as non-rest days
      if (routine.exercises && routine.exercises.length > 0) {
        console.log('Initializing rest days based on existing exercises');
        // Get unique days that have exercises
        const daysWithExercises = new Set(routine.exercises.map(ex => ex.day).filter(Boolean));
        console.log('Days with exercises:', Array.from(daysWithExercises));
        
        // Mark these days as non-rest days only if they have exercises
        daysWithExercises.forEach(day => {
          if (defaultRestDays.hasOwnProperty(day) && routine.exercises.some(ex => ex.day === day)) {
            defaultRestDays[day] = false;
          }
        });
      }
      
      console.log('Initial rest days config:', defaultRestDays);
      return defaultRestDays;
    }
    
    // Default all days to rest days for new routines
    return {
      Monday: true,
      Tuesday: true,
      Wednesday: true,
      Thursday: true,
      Friday: true,
      Saturday: true,
      Sunday: true
    };
  });
  
  const [exercises, setExercises] = useState(() => {
    // Initialize empty arrays for each day
    const exercisesByDay = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: []
    };
    
    // If we're editing an existing routine, add its exercises to the appropriate days
    if (routine && routine.exercises) {
      console.log('Loading exercises from routine:', routine.name);
      console.log('Exercises to load:', routine.exercises.length);
      
      // Make sure exercises is an array
      const routineExercises = Array.isArray(routine.exercises) ? routine.exercises : [];
      
      routineExercises.forEach(exercise => {
        if (!exercise) return; // Skip undefined exercises
        
        // Make sure the exercise has a valid day
        const exerciseDay = exercise.day || 'Monday';
        
        if (exercisesByDay[exerciseDay]) {
          // Create a clean copy of the exercise with normalized data types
          const exerciseCopy = { 
            ...exercise,
            // Ensure essential properties exist
            id: exercise.id || `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            name: exercise.name || 'Unnamed Exercise',
            day: exerciseDay,
            routineId: routine.id,
            // Normalize numeric fields to strings to match form inputs
            sets: String(exercise.sets || '3'),
            reps: String(exercise.reps || '10'),
            weight: String(exercise.weight || '0'),
            // Ensure other fields exist
            type: exercise.type || 'strength',
            isCompleted: exercise.isCompleted || false,
            isPR: exercise.isPR || false
          };
          
          // Add to the appropriate day
          exercisesByDay[exerciseDay].push(exerciseCopy);
          console.log(`Added exercise "${exerciseCopy.name}" to ${exerciseDay}`);
        }
      });
      
      // Log exercise count by day
      DAYS_OF_WEEK.forEach(day => {
        console.log(`${day} has ${exercisesByDay[day].length} exercises`);
      });
    } else {
      console.log('No exercises to load (new routine or no exercises)');
    }
    
    return exercisesByDay;
  });
  
  // State for modal visibility
  const [isEditingName, setIsEditingName] = useState(false);
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [strengthExerciseModalVisible, setStrengthExerciseModalVisible] = useState(false);
  
  // Add debug logging for modal visibility state changes
  useEffect(() => {
    console.log('Exercise type modal visibility changed to:', exerciseModalVisible);
  }, [exerciseModalVisible]);

  // Track if any changes have been made
  const [hasChanges, setHasChanges] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Store initial state snapshot for comparison
  const [initialSnapshot, setInitialSnapshot] = useState(null);

  // First, add a new state variable to track the exercise being edited
  const [editingExercise, setEditingExercise] = useState(null);

  // Mark initial load as complete after component mounts and take snapshot
  useEffect(() => {
    const timer = setTimeout(() => {
      // Take a snapshot of the initial state
      const snapshot = {
        name: name,
        trainingDays: trainingDays,
        restDays: restDays,
        exercises: JSON.parse(JSON.stringify(exercises)), // Deep copy
        restDaysConfig: { ...restDaysConfig }
      };
      
      setInitialSnapshot(snapshot);
      setInitialLoadComplete(true);
      console.log('Initial load complete, snapshot taken:', snapshot);
    }, 500); // Increased delay to ensure all initial state is properly set
    
    return () => clearTimeout(timer);
  }, []);

  // Update hasChanges whenever routine data changes (only after initial load)
  useEffect(() => {
    // Don't check for changes until initial load is complete and we have a snapshot
    if (!initialLoadComplete || !initialSnapshot) return;
    
    // Compare current state with initial snapshot
    const hasNameChanged = name !== initialSnapshot.name;
    const hasTrainingDaysChanged = trainingDays !== initialSnapshot.trainingDays;
    const hasRestDaysChanged = restDays !== initialSnapshot.restDays;
    
    // Compare exercises by converting both to JSON strings for deep comparison
    const currentExercisesJson = JSON.stringify(exercises);
    const initialExercisesJson = JSON.stringify(initialSnapshot.exercises);
    const hasExercisesChanged = currentExercisesJson !== initialExercisesJson;
    
    // Compare rest days config
    const currentRestDaysJson = JSON.stringify(restDaysConfig);
    const initialRestDaysJson = JSON.stringify(initialSnapshot.restDaysConfig);
    const hasRestDaysConfigChanged = currentRestDaysJson !== initialRestDaysJson;
    
    console.log('Snapshot-based change detection:', {
      hasNameChanged,
      hasTrainingDaysChanged,
      hasRestDaysChanged,
      hasExercisesChanged,
      hasRestDaysConfigChanged,
      initialName: initialSnapshot.name,
      currentName: name,
      initialTrainingDays: initialSnapshot.trainingDays,
      currentTrainingDays: trainingDays,
      initialRestDays: initialSnapshot.restDays,
      currentRestDays: restDays
    });
    
    if (hasExercisesChanged) {
      console.log('Exercise comparison details:');
      console.log('Initial exercises JSON:', initialExercisesJson);
      console.log('Current exercises JSON:', currentExercisesJson);
    }
    
    const hasAnyChanges = 
      hasNameChanged || 
      hasTrainingDaysChanged || 
      hasRestDaysChanged ||
      hasExercisesChanged ||
      hasRestDaysConfigChanged;
    
    setHasChanges(hasAnyChanges);
  }, [name, trainingDays, restDays, exercises, restDaysConfig, initialLoadComplete, initialSnapshot]);

  // When initializing restDaysConfig, count the days and update trainingDays/restDays
  useEffect(() => {
    // Only update counts after initial load to avoid triggering change detection
    if (!initialLoadComplete) return;
    
    // Count training and rest days based on current config
    let trainingDayCount = 0;
    let restDayCount = 0;
    
    Object.values(restDaysConfig).forEach(isRest => {
      if (isRest) {
        restDayCount++;
      } else {
        trainingDayCount++;
      }
    });
    
    // Update the counts to match the configuration
    setTrainingDays(trainingDayCount.toString());
    setRestDays(restDayCount.toString());
    
    console.log(`Updated counts - Training: ${trainingDayCount}, Rest: ${restDayCount}`);
  }, [restDaysConfig, initialLoadComplete]); // Run this effect when restDaysConfig changes

  const toggleRestDay = (day) => {
    console.log(`Toggling rest day for ${day}`);
    
    // Update the rest day configuration
    setRestDaysConfig(prev => {
      const newConfig = {
        ...prev,
        [day]: !prev[day]
      };
      
      // If we're setting it to a rest day, remove all exercises for that day
      if (newConfig[day]) {
        setExercises(prevExercises => ({
          ...prevExercises,
          [day]: [] // Clear exercises for this day
        }));
      }
      
      // Calculate updated counts
      let trainingDayCount = 0;
      let restDayCount = 0;
      
      DAYS_OF_WEEK.forEach(dayName => {
        if (newConfig[dayName]) {
          restDayCount++;
        } else {
          trainingDayCount++;
        }
      });
      
      // Update the counts immediately
      setTrainingDays(trainingDayCount.toString());
      setRestDays(restDayCount.toString());
      
      console.log(`Training days: ${trainingDayCount}, Rest days: ${restDayCount}`);
      
      return newConfig;
    });
    
    setHasChanges(true);
  };

  const addExercise = (day) => {
    console.log('Adding exercise for day:', day);
    // Set the selected day for the new exercise
    setSelectedDay(day);
    
    // Show the exercise type selection modal
    setExerciseModalVisible(true);
    
    // Log to confirm the modal should be visible
    console.log('ExerciseTypeModal should now be visible:', true);
  };

  const handleExerciseTypeSelect = (type, previousExercise = null) => {
    console.log(`Selected ${type} exercise for ${selectedDay}`);
    
    if (type === 'strength') {
      // Show the strength exercise form
      setExerciseModalVisible(false);
      
      // Add additional logging
      console.log('About to show strength exercise modal');
      console.log('Current strengthExerciseModalVisible state:', strengthExerciseModalVisible);
      
      // Set the strength modal visible immediately
      setStrengthExerciseModalVisible(true);
      
      // Add post-state-change logging
      console.log('After setting strengthExerciseModalVisible to true');
    } else if (type === 'cardio') {
      // For now, just add a default cardio exercise
      if (selectedDay) {
        // Create a unique ID with timestamp and random number
        const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
        const newExercise = {
          id: uniqueId,
          name: 'Cardio Exercise',
          type: 'cardio',
          duration: '30',
          distance: '5',
          day: selectedDay,
          isCompleted: false,
          isPR: false
        };
        
        addExerciseToDay(selectedDay, newExercise);
      }
      setExerciseModalVisible(false);
    } else if (type === 'previous' && previousExercise) {
      // Add the previously saved exercise directly
      if (selectedDay) {
        // Create a unique ID with timestamp and random number
        const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
        // Make sure the exercise is assigned to the selected day
        const exerciseWithDay = {
          ...previousExercise,
          id: uniqueId, // Give it a new unique ID
          day: selectedDay
        };
        
        addExerciseToDay(selectedDay, exerciseWithDay);
      }
      // Modal is already closed by the ExerciseTypeModal
    }
  };

  // Helper function to add an exercise to a specific day
  const addExerciseToDay = (day, exercise) => {
    if (!exercise || !day) return; // Guard against undefined values
    
    const uniqueId = exercise.id || `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    // Don't set routineId for new routines - it will be set when saving
    
    console.log(`Adding exercise "${exercise.name}" to ${day} with ID: ${uniqueId}`);
    
    setExercises(prev => {
      const newExercises = {
        ...prev,
        [day]: [...(prev[day] || []), {
          ...exercise,
          id: uniqueId,
          day: day
          // routineId will be set when saving to database
        }]
      };
      console.log(`${day} now has ${newExercises[day].length} exercises`);
      return newExercises;
    });
    
    // Mark that changes have been made
    setHasChanges(true);
  };

  // Update the handleEditExercise function to also set the selectedDay
  const handleEditExercise = (exercise) => {
    setEditingExercise(exercise);
    setSelectedDay(exercise.day); // Make sure we set the selected day to match the exercise
    
    if (exercise.type === 'strength') {
      setStrengthExerciseModalVisible(true);
    } else if (exercise.type === 'cardio') {
      // For now, we'll just add a default cardio exercise
      // In a full implementation, you'd show a cardio exercise modal
      console.log('Editing cardio exercise not implemented yet');
    }
  };

  // Update the handleSaveStrengthExercise function to include debug logging
  const handleSaveStrengthExercise = (exercise) => {
    console.log('Saving strength exercise:', exercise);
    
    // Ensure the exercise has a proper type
    const completeExercise = {
      ...exercise,
      type: 'strength',
      isCompleted: false,
      isPR: false
    };
    
    let actualChangeMade = false;
    
    if (editingExercise) {
      // We're editing an existing exercise
      console.log(`Editing existing exercise ${editingExercise.id} in ${exercise.day}`);
      
      // Check if there are actual changes by comparing key fields
      // Convert to strings for comparison to handle number vs string differences
      const hasNameChanged = (exercise.name || '').trim() !== (editingExercise.name || '').trim();
      const hasSetsChanged = String(exercise.sets || '').trim() !== String(editingExercise.sets || '').trim();
      const hasRepsChanged = String(exercise.reps || '').trim() !== String(editingExercise.reps || '').trim();
      const hasWeightChanged = String(exercise.weight || '').trim() !== String(editingExercise.weight || '').trim();
      const hasDayChanged = (exercise.day || '') !== (editingExercise.day || '');
      
      const hasActualChanges = hasNameChanged || hasSetsChanged || hasRepsChanged || hasWeightChanged || hasDayChanged;
      
      console.log('Exercise change detection:', {
        hasNameChanged,
        hasSetsChanged,
        hasRepsChanged,
        hasWeightChanged,
        hasDayChanged,
        hasActualChanges
      });
      
      if (hasActualChanges) {
        actualChangeMade = true;
        
        setExercises(prev => {
          const updatedExercises = { ...prev };
          const dayExercises = [...updatedExercises[exercise.day]];
          
          // Find and replace the exercise
          const index = dayExercises.findIndex(ex => ex.id === editingExercise.id);
          if (index !== -1) {
            // Preserve the ID of the original exercise
            completeExercise.id = editingExercise.id;
            completeExercise.day = exercise.day;
            // routineId will be set when saving to database
            
            dayExercises[index] = completeExercise;
            console.log(`Updated exercise at index ${index}, new values:`, completeExercise);
          } else {
            console.error(`Could not find exercise with id ${editingExercise.id} to update`);
          }
          
          updatedExercises[exercise.day] = dayExercises;
          return updatedExercises;
        });
      } else {
        console.log('No changes detected in exercise, skipping update');
      }
      
      // Reset editing state
      setEditingExercise(null);
    } else {
      // We're adding a new exercise
      actualChangeMade = true;
      
      if (selectedDay) {
        // Generate a unique ID
        const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
        // Add all necessary fields
        const exerciseWithId = { 
          ...completeExercise, 
          id: uniqueId,
          day: selectedDay
          // routineId will be set when saving to database
        };
        
        console.log(`Adding new strength exercise "${exerciseWithId.name}" with ID: ${uniqueId} to ${selectedDay}`);
        
        setExercises(prev => {
          const updatedExercises = {
            ...prev,
            [selectedDay]: [...prev[selectedDay], exerciseWithId]
          };
          
          console.log(`${selectedDay} now has ${updatedExercises[selectedDay].length} exercises`);
          return updatedExercises;
        });
      } else {
        console.error("No selected day when trying to add strength exercise");
      }
    }
    
    // Only set hasChanges to true if an actual change was made
    if (actualChangeMade) {
      setHasChanges(true);
      console.log('Changes detected, setting hasChanges to true');
    } else {
      console.log('No changes detected, hasChanges remains unchanged');
    }
    
    console.log('Closing strength exercise modal');
    setStrengthExerciseModalVisible(false);
  };

  // Add a function to close the modal and reset editing state
  const handleCloseStrengthExerciseModal = () => {
    console.log('Closing strength exercise modal');
    setStrengthExerciseModalVisible(false);
    setEditingExercise(null);
  };

  // Add this new function to handle exercise removal
  const handleRemoveExercise = (day, exerciseId) => {
    setExercises(prev => {
      const newExercises = {
        ...prev,
        [day]: prev[day].filter(ex => ex.id !== exerciseId)
      };
      
      // If this was the last exercise for this day, mark it as a rest day
      if (newExercises[day].length === 0) {
        setRestDaysConfig(prevConfig => {
          const newRestConfig = {
            ...prevConfig,
            [day]: true
          };
          
          // Count training and rest days
          let trainingDayCount = 0;
          let restDayCount = 0;
          
          Object.values(newRestConfig).forEach(isRest => {
            if (isRest) {
              restDayCount++;
            } else {
              trainingDayCount++;
            }
          });
          
          // Update the training and rest day counts
          setTrainingDays(trainingDayCount.toString());
          setRestDays(restDayCount.toString());
          
          return newRestConfig;
        });
      }
      
      return newExercises;
    });
    
    setHasChanges(true);
  };

  // Update the handleSave function to validate training days have exercises
  const handleSave = () => {
    // Validate input
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a routine name');
      return;
    }
    
    // Check for training days without exercises
    const daysWithoutExercises = [];
    
    DAYS_OF_WEEK.forEach(day => {
      // If it's not a rest day but has no exercises
      if (!restDaysConfig[day] && (!exercises[day] || exercises[day].length === 0)) {
        daysWithoutExercises.push(day);
      }
    });
    
    // If we found training days without exercises, show an alert
    if (daysWithoutExercises.length > 0) {
      const dayList = daysWithoutExercises.join(', ');
      
      Alert.alert(
        "Missing Exercises",
        `You have training days without exercises: ${dayList}. Would you like to add exercises or mark these as rest days?`,
        [
          {
            text: "Add Exercises",
            onPress: () => {
              // Prompt to add exercise for the first empty day
              if (daysWithoutExercises.length > 0) {
                addExercise(daysWithoutExercises[0]);
              }
            }
          },
          {
            text: "Mark as Rest Days",
            onPress: () => {
              // Convert all empty training days to rest days
              const updatedRestDaysConfig = { ...restDaysConfig };
              daysWithoutExercises.forEach(day => {
                updatedRestDaysConfig[day] = true;
              });
              
              setRestDaysConfig(updatedRestDaysConfig);
              
              // Recalculate counts
              const trainingDayCount = Object.values(updatedRestDaysConfig).filter(isRest => !isRest).length;
              const restDayCount = Object.values(updatedRestDaysConfig).filter(isRest => isRest).length;
              
              setTrainingDays(trainingDayCount.toString());
              setRestDays(restDayCount.toString());
              
              // Now proceed with the save after fixing the rest day configuration
              setTimeout(completeSave, 100);
            }
          },
          {
            text: "Cancel",
            style: "cancel"
          }
        ]
      );
      return;
    }
    
    // If everything is valid, complete the save
    completeSave();
  };

  // Extract the save logic into a separate function that can be called after validation
  const completeSave = () => {
    // Ensure rest day config matches the reality of exercises
    const updatedRestDaysConfig = { ...restDaysConfig };
    
    DAYS_OF_WEEK.forEach(day => {
      const dayExercises = exercises[day] || [];
      // A day is a rest day if it has no exercises
      updatedRestDaysConfig[day] = dayExercises.length === 0;
    });
    
    // Calculate final training and rest day counts
    let trainingDayCount = 0;
    let restDayCount = 0;
    
    DAYS_OF_WEEK.forEach(day => {
      if (updatedRestDaysConfig[day]) {
        restDayCount++;
      } else {
        trainingDayCount++;
      }
    });
    
    // Create a fresh array to store all exercises that should be saved
    let allExercisesToSave = [];
    
    // Include exercises from all days
    DAYS_OF_WEEK.forEach(day => {
      const dayExercises = exercises[day] || [];
      
      if (dayExercises.length > 0) {
        console.log(`Processing ${dayExercises.length} exercises for ${day}`);
        
        dayExercises.forEach(exercise => {
          if (!exercise || !exercise.name) {
            console.warn('Skipping invalid exercise:', exercise);
            return;
          }
          
          // Create a complete exercise object with all required fields
          const completeExercise = {
            ...exercise,
            id: exercise.id || `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            day: day,
            type: exercise.type || 'strength'
            // routineId will be set by Supabase when saving
          };
          
          // Add default values for exercise properties
          if (completeExercise.type === 'strength') {
            completeExercise.sets = completeExercise.sets || '3';
            completeExercise.reps = completeExercise.reps || '10';
            completeExercise.weight = completeExercise.weight || '0';
          } else if (completeExercise.type === 'cardio') {
            completeExercise.duration = completeExercise.duration || '30';
            completeExercise.distance = completeExercise.distance || '5';
          }
          
          completeExercise.isCompleted = completeExercise.isCompleted || false;
          completeExercise.isPR = completeExercise.isPR || false;
          
          allExercisesToSave.push(completeExercise);
        });
      }
    });
    
    // Create the final routine data with accurate training/rest day counts
    const routineData = {
      // Don't include ID for new routines - let Supabase generate it
      ...(routine?.id && { id: routine.id }),
      name: name.trim(),
      trainingDays: trainingDayCount,
      restDays: restDayCount,
      isActive: isActive,
      exercises: allExercisesToSave
    };
    
    console.log(`Saving routine "${name}" with training days: ${trainingDayCount}, rest days: ${restDayCount}`);
    // Add detailed log before calling onSave
    console.log('Routine data being passed to onSave:', JSON.stringify(routineData, null, 2));
    if (onSave) {
      onSave(routineData);
    }
    navigation.goBack();
  };

  // Add these at the top of your component
  const pan = useRef(new Animated.ValueXY()).current;
  const [swiping, setSwiping] = useState(false);
  
  // Create pan responder
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to horizontal gestures starting from left edge
        return !hasChanges && 
               gestureState.dx > 5 && 
               Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
               gestureState.moveX < 50;
      },
      onPanResponderGrant: () => {
        setSwiping(true);
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 120) {
          // Swipe threshold met, complete the swipe
          Animated.timing(pan, {
            toValue: { x: 400, y: 0 },
            duration: 300,
            useNativeDriver: false,
          }).start(() => {
            onCancel();
          });
        } else {
          // Reset position
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: false,
          }).start(() => {
            setSwiping(false);
          });
        }
      }
    })
  ).current;

  // Reset pan value when routine changes
  useEffect(() => {
    pan.setValue({ x: 0, y: 0 });
  }, [routine]);

  // Add a useEffect to monitor the modal visibility state
  useEffect(() => {
    console.log('StrengthExerciseModal visibility changed:', strengthExerciseModalVisible);
  }, [strengthExerciseModalVisible]);

  return (
    <Animated.View 
      style={[
        { flex: 1 },
        { transform: [{ translateX: pan.x }] }
      ]}
      {...panResponder.panHandlers}
    >
      <KeyboardAvoidingView 
        style={commonStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="light-content" backgroundColor={colors.statusBar} />
        
        <AppHeader
          title={isEditMode ? 'Edit Routine' : 'Create Routine'}
          onBack={() => {
            console.log('Back button pressed, hasChanges:', hasChanges, 'isEditMode:', isEditMode);
            // Only show popup if there are actual changes that can be saved
            const hasUnsavedChanges = hasChanges && (isEditMode || (!isEditMode && (name !== 'New Routine' || Object.values(exercises).some(dayExercises => dayExercises.length > 0))));
            
            if (hasUnsavedChanges) {
              Alert.alert(
                "Unsaved Changes",
                "You have unsaved changes. Are you sure you want to go back?",
                [
                  { text: "Stay", style: "cancel" },
                  { 
                    text: "Discard Changes", 
                    onPress: () => {
                      if (onCancel) onCancel();
                      navigation.goBack();
                    }, 
                    style: "destructive" 
                  }
                ]
              );
            } else {
              console.log('No unsaved changes, going back');
              if (onCancel) onCancel();
              navigation.goBack();
            }
          }}
        />

        {/* Add name input field */}
        <View style={styles.nameInputContainer}>
          <Text style={styles.nameLabel}>Routine Name</Text>
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="Enter routine name"
            placeholderTextColor={colors.text.secondary}
          />
        </View>

        {/* Add training/rest days inputs */}
        <View style={styles.daysInputsContainer}>
          <View style={styles.daysInputRow}>
            <Text style={styles.daysLabel}>Training Days</Text>
            <TextInput
              style={styles.daysInput}
              value={trainingDays}
              onChangeText={setTrainingDays}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>
          
          <View style={styles.daysInputRow}>
            <Text style={styles.daysLabel}>Rest Days</Text>
            <TextInput
              style={styles.daysInput}
              value={restDays}
              onChangeText={setRestDays}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {DAYS_OF_WEEK.map((day) => {
            // Log the exercises for this day to debug
            const dayExercises = exercises[day] || [];
            console.log(`Rendering ${day} with ${dayExercises.length} exercises`);
            
            return (
              <View key={day} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayName}>{day}</Text>
                  <TouchableOpacity style={styles.editButton}>
                    <Text style={styles.editButtonText}>✏️</Text>
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
                        {restDaysConfig[day] ? '↓' : '↑'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {!restDaysConfig[day] && (
                    <>
                      {dayExercises.length > 0 ? (
                        <>
                          {dayExercises.map((exercise, index) => {
                            console.log(`Rendering exercise ${index}: ${exercise.name} (ID: ${exercise.id})`);
                            return (
                              <View 
                                key={`${exercise.id || 'unknown'}-${index}`} 
                                style={styles.exerciseItem}
                              >
                                <View style={styles.exerciseInfoRow}>
                                  <View style={styles.exerciseDetailsContainer}>
                                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                                    <Text style={styles.exerciseDetails}>
                                      {exercise.type === 'strength' 
                                        ? `${exercise.sets || '?'} sets • ${exercise.reps || '?'} reps • ${exercise.weight || '?'} lbs` 
                                        : `${exercise.duration || '?'} min • ${exercise.distance || '?'} km`}
                                    </Text>
                                  </View>
                                  <View style={styles.exerciseActions}>
                                    <TouchableOpacity 
                                      style={styles.editExerciseButton}
                                      onPress={() => handleEditExercise(exercise)}
                                    >
                                      <Text style={styles.editExerciseIcon}>✏️</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                      style={styles.removeExerciseButton}
                                      onPress={() => {
                                        Alert.alert(
                                          'Remove Exercise',
                                          `Are you sure you want to remove "${exercise.name}"?`,
                                          [
                                            { text: 'Cancel', style: 'cancel' },
                                            { 
                                              text: 'Remove', 
                                              style: 'destructive',
                                              onPress: () => handleRemoveExercise(day, exercise.id)
                                            },
                                          ]
                                        );
                                      }}
                                    >
                                      <Text style={styles.removeExerciseIcon}>🗑️</Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              </View>
                            );
                          })}
                          
                          <TouchableOpacity 
                            style={[styles.addExerciseButton, { marginTop: spacing.sm }]}
                            onPress={() => addExercise(day)}
                          >
                            <Text style={styles.addExerciseText}>+ Add Exercise</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <TouchableOpacity 
                          style={styles.addExerciseButton}
                          onPress={() => addExercise(day)}
                        >
                          <Text style={styles.addExerciseText}>+ Add First Exercise</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom || spacing.md }]}>
          <View style={styles.footerButtonsContainer}>
            {isEditMode && (
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => {
                  Alert.alert(
                    "Delete Routine",
                    "Are you sure you want to delete this routine? This action cannot be undone.",
                    [
                      {
                        text: "Cancel",
                        style: "cancel"
                      },
                      { 
                        text: "Delete", 
                        onPress: () => {
                          if (onDelete && routine?.id) {
                            console.log('Calling onDelete with ID:', routine.id);
                            onDelete(routine.id);
                            navigation.goBack();
                          } else {
                            console.error('onDelete function or routine ID missing!');
                            Alert.alert('Error', 'Could not delete routine.');
                          }
                        },
                        style: "destructive"
                      }
                    ]
                  );
                }}
              >
                <View style={styles.trashIconContainer}>
                  <Text style={styles.trashIcon}>🗑️</Text>
                </View>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.saveButton, 
                isEditMode && styles.updateButton,
                hasChanges && styles.saveButtonWithChanges,
                !hasChanges && isEditMode && styles.saveButtonDisabled
              ]}
              onPress={() => {
                console.log('Save button pressed, hasChanges:', hasChanges);
                if (hasChanges || !isEditMode) {
                  handleSave();
                } else {
                  console.log('No changes to save');
                }
              }}
              disabled={isEditMode && !hasChanges}
            >
              <Text style={[
                styles.saveButtonText,
                !hasChanges && isEditMode && styles.saveButtonTextDisabled
              ]}>
                {isEditMode ? 'Save Changes' : 'Save Routine'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modals - Make sure they're at the end of the component for proper rendering */}
        <ExerciseTypeModal
          visible={exerciseModalVisible}
          onClose={() => {
            console.log('Closing ExerciseTypeModal');
            setExerciseModalVisible(false);
          }}
          onSelectType={(type, exercise) => {
            console.log('Exercise type selected:', type);
            handleExerciseTypeSelect(type, exercise);
          }}
          activeRoutine={routine}
        />
        
        <AddStrengthExerciseModal
          visible={strengthExerciseModalVisible}
          onClose={() => {
            console.log('Closing strength exercise modal from onClose prop');
            handleCloseStrengthExerciseModal();
          }}
          onSave={(exercise) => {
            console.log('Saving strength exercise from onSave prop');
            handleSaveStrengthExercise(exercise);
          }}
          day={selectedDay}
          exercise={editingExercise}
          isEditing={!!editingExercise}
        />
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...typography.title,
    flex: 1,
  },
  // Add input styles
  nameInputContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  nameLabel: {
    color: colors.text.secondary,
    fontSize: normalize(14),
    marginBottom: spacing.xs,
  },
  nameInput: {
    backgroundColor: colors.card,
    color: colors.text.primary,
    fontSize: normalize(16),
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  daysInputsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  daysInputRow: {
    flex: 1,
    marginRight: spacing.sm,
  },
  daysLabel: {
    color: colors.text.secondary,
    fontSize: normalize(14),
    marginBottom: spacing.xs,
  },
  daysInput: {
    backgroundColor: colors.card,
    color: colors.text.primary,
    fontSize: normalize(16),
    padding: spacing.md,
    borderRadius: borderRadius.md,
    textAlign: 'center',
  },
  editButton: {
    padding: spacing.sm,
  },
  editButtonText: {
    color: colors.text.secondary,
    fontSize: normalize(14),
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
    marginBottom: spacing.sm,
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
    color: colors.text.primary,
    fontSize: normalize(14),
    fontWeight: 'normal',
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
    fontSize: normalize(14),
    marginRight: spacing.xs,
  },
  restDayText: {
    color: colors.text.secondary,
    fontSize: normalize(14),
  },
  toggleButton: {
    padding: spacing.xs,
  },
  toggleButtonText: {
    color: colors.text.secondary,
    fontSize: normalize(16),
  },
  exerciseItem: {
    backgroundColor: '#333',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  exerciseItemEditing: {
    borderWidth: 1,
    borderColor: colors.button.accent,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs / 2,
  },
  exerciseName: {
    color: colors.text.primary,
    fontSize: normalize(14),
    fontWeight: '500',
  },
  exerciseDetails: {
    color: colors.text.secondary,
    fontSize: normalize(12),
  },
  editExerciseButton: {
    padding: spacing.xs,
  },
  editExerciseIcon: {
    fontSize: normalize(14),
  },
  addExerciseButton: {
    backgroundColor: '#222',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  addExerciseText: {
    color: colors.button.accent,
    fontSize: normalize(14),
  },
  footer: {
    padding: spacing.md,
  },
  footerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#000',
    padding: spacing.md,
    borderRadius: 12,
    marginRight: spacing.md,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  trashIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trashIcon: {
    fontSize: normalize(20),
    color: colors.text.primary,
  },
  saveButton: {
    backgroundColor: colors.button.accent,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    flex: 1,
  },
  updateButton: {
    flex: 1,
  },
  saveButtonWithChanges: {
    backgroundColor: '#5cb85c', // Green color to indicate changes are ready to save
  },
  saveButtonDisabled: {
    backgroundColor: '#333', // Darker gray for disabled state
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.text.primary,
    fontSize: normalize(16),
    fontWeight: 'bold',
  },
  saveButtonTextDisabled: {
    color: colors.text.secondary,
  },
  backButton: {
    marginBottom: spacing.sm,
  },
  backButtonText: {
    color: colors.text.primary,
    fontSize: normalize(16),
  },
  exerciseInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseDetailsContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeExerciseButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  removeExerciseIcon: {
    fontSize: normalize(18),
    color: colors.button.danger,
  },
}); 