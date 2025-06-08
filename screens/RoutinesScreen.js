import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { 
  colors, 
  typography, 
  spacing, 
  borderRadius, 
  commonStyles, 
  normalize 
} from '../styles/globalStyles';
import RoutineEditorScreen from '../components/RoutineEditorScreen';
import AppHeader from '../components/AppHeader';
import { supabase } from '../lib/supabaseClient';

// Fix the invalid hook call error
export default function RoutinesScreen({ routines, setRoutines, setActiveRoutine, activeRoutineIdState, setActiveRoutineIdState }) {
  const insets = useSafeAreaInsets();
  const [isCreatingRoutine, setIsCreatingRoutine] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const openSwipeableRef = useRef(null);
  const [sortedRoutines, setSortedRoutines] = useState([]);
  const animatedValues = useRef({}).current;
  
  // Create a map to store refs for each routine
  const swipeableRefs = useRef({}).current;
  
  // Find the active routine
  const activeRoutine = routines ? routines.find(r => r.is_active) : null;
  
  // Sort routines to put active ones at the top
  useEffect(() => {
    if (!routines) {
      setSortedRoutines([]);
      return;
    }
    
    // Create a sorted copy with active routines first
    const sorted = [...routines].sort((a, b) => {
      if (a.is_active && !b.is_active) return -1;
      if (!a.is_active && b.is_active) return 1;
      return 0;
    });
    
    // Initialize animation values for new routines
    sorted.forEach(routine => {
      if (!animatedValues[routine.id]) {
        animatedValues[routine.id] = new Animated.Value(0);
      }
    });
    
    setSortedRoutines(sorted);
  }, [routines]);
  
  // Custom setActiveRoutine function
  const handleSetActiveRoutine = async (routineId) => {
    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Deactivate all routines first
      const { error: deactivateError } = await supabase
        .from('routines')
        .update({ is_active: false })
        .eq('user_id', user.id);
      
      if (deactivateError) throw deactivateError;

      // Activate the selected routine
      const { error: activateError } = await supabase
        .from('routines')
        .update({ is_active: true })
        .eq('id', routineId);

      if (activateError) throw activateError;

      // Update local state
      const updatedRoutines = routines.map(r => ({
        ...r,
        is_active: r.id === routineId
      }));
      setRoutines(updatedRoutines);
      setActiveRoutine(routineId);
    } catch (error) {
      console.error('Error setting active routine:', error);
      Alert.alert('Error', 'Failed to set active routine. Please try again.');
    }
  };

  const handleDeleteRoutine = async (routineId) => {
    // Remove the outer Alert.alert wrapper
    // Directly execute the deletion logic
    try {
      console.log(`Attempting direct deletion of routine ID: ${routineId}`);
      // Delete all exercises for this routine first
      const { error: exercisesError } = await supabase
        .from('exercises')
        .delete()
        .eq('routine_id', routineId);
      
      if (exercisesError) throw exercisesError;
      console.log(`Exercises for routine ${routineId} deleted.`);

      // Then delete the routine
      const { error: routineError } = await supabase
        .from('routines')
        .delete()
        .eq('id', routineId);
      
      if (routineError) throw routineError;
      console.log(`Routine ${routineId} deleted from database.`);

      // Update local state
      const updatedRoutines = routines.filter(routine => routine.id !== routineId);
      setRoutines(updatedRoutines);
      
      // Reset editing state to navigate back
      setEditingRoutine(null); 
      console.log(`Routine ${routineId} deleted locally, navigating back.`);

    } catch (error) {
      console.error('Error deleting routine:', error);
      Alert.alert('Error', 'Failed to delete the routine. Please try again.');
    }
  };

  // Modified renderRightActions to use the swipeableRefs map
  const renderRightActions = (progress, dragX, routineId) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });
    
    return (
      <Animated.View 
        style={[
          styles.deleteButton,
          {
            transform: [{ translateX: 0 }]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.deleteButtonTouchable}
          onPress={() => {
            // Close the swipeable first
            const ref = swipeableRefs[routineId];
            if (ref && typeof ref.close === 'function') {
              ref.close();
            }
            // Add the confirmation Alert here
            Alert.alert(
              'Delete Routine',
              'Are you sure you want to delete this routine? This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete', 
                  style: 'destructive',
                  // Call handleDeleteRoutine only if confirmed
                  onPress: () => handleDeleteRoutine(routineId)
                },
              ]
            );
          }}
        >
          <Animated.Text 
            style={[
              styles.deleteButtonText,
              { opacity: trans }
            ]}
          >
            Delete
          </Animated.Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const handleEditRoutine = (routine) => {
    console.log('===== EDITING ROUTINE =====');
    console.log('Routine name:', routine.name);
    console.log('Routine ID:', routine.id);
    
    // Log the exercise details if present
    if (routine.exercises && routine.exercises.length > 0) {
      console.log(`Routine has ${routine.exercises.length} exercises:`);
      routine.exercises.forEach((ex, i) => {
        console.log(`  ${i + 1}. ${ex.name} (${ex.day || 'no day'}, ID: ${ex.id || 'missing ID'}, type: ${ex.type || 'unknown'})`);
      });
    } else {
      console.log('Routine has no exercises');
    }
    
    // Make a deep copy of the routine to avoid reference issues
    const routineToEdit = JSON.parse(JSON.stringify(routine));
    
    // Double-check the deep copy has the exercises
    if (routineToEdit.exercises) {
      console.log(`Deep copy has ${routineToEdit.exercises.length} exercises`);
    } else {
      console.warn('Deep copy is missing exercises property!');
      // Initialize exercises as an empty array if missing
      routineToEdit.exercises = [];
    }
    
    setEditingRoutine(routineToEdit);
  };

  const handleSaveRoutine = async (updatedRoutine, isActiveParam = false) => {
    try {
      console.log('===== SAVING ROUTINE =====');
      // Log the incoming exercises array
      console.log('Received exercises to save:', updatedRoutine.exercises?.map(ex => ({ name: ex.name, day: ex.day, sets: ex.sets, reps: ex.reps })) || 'No exercises array');

      console.log('Updated routine metadata:', {
        name: updatedRoutine.name,
        training_days: updatedRoutine.trainingDays || 0,
        rest_days: updatedRoutine.restDays || 0,
        exercises: updatedRoutine.exercises?.length || 0
      });
      console.log('Is active:', isActiveParam);
      console.log('Is editing:', !!editingRoutine);

      const isNewRoutine = !editingRoutine;
      console.log('Is new routine:', isNewRoutine);

      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error getting user:', userError);
        throw userError;
      }
      console.log('Got user ID:', user.id);

      // Determine if the routine should be active
      let shouldBeActive;
      if (isNewRoutine) {
        // New routines always become active
        shouldBeActive = true;
      } else {
        // If editing, keep its original active status
        // Check if the routine being edited was the active one
        shouldBeActive = editingRoutine.id === activeRoutineIdState;
      }
      console.log(`Determined active status: isEditing=${!isNewRoutine}, wasActive=${!isNewRoutine ? editingRoutine.id === activeRoutineIdState : 'N/A'}, shouldBeActive=${shouldBeActive}`);

      // Prepare routine data for Supabase
      const routineDataForSupabase = {
        name: updatedRoutine.name,
        training_days: updatedRoutine.trainingDays || 0,
        rest_days: updatedRoutine.restDays || 0,
        is_active: shouldBeActive,
        user_id: user.id
      };

      console.log('Prepared routine data for Supabase:', routineDataForSupabase);

      let savedRoutine; // Declare savedRoutine here

      // Deactivate other routines in Supabase if this one will be active
      if (shouldBeActive) {
        console.log('Deactivating other routines in Supabase...');
        let deactivateQuery = supabase
          .from('routines')
          .update({ is_active: false })
          .eq('user_id', user.id);

        // Only add the 'neq' condition if we are editing an existing routine
        if (!isNewRoutine && editingRoutine?.id) {
             console.log(`Excluding routine ID ${editingRoutine.id} from deactivation.`);
             deactivateQuery = deactivateQuery.neq('id', editingRoutine.id);
        } else {
          console.log('Deactivating all existing routines for user.');
        }

        const { error: deactivateError } = await deactivateQuery; // Execute the built query

        if (deactivateError) {
          console.error('Error deactivating other routines:', deactivateError);
          // Not throwing the error for now, just logging
        }
      }

      // Update or create routine in Supabase
      if (editingRoutine) {
        console.log('Updating existing routine:', editingRoutine.id);
        const { data, error } = await supabase
          .from('routines')
          .update(routineDataForSupabase)
          .eq('id', editingRoutine.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating routine:', error);
          throw error;
        }
        savedRoutine = data; // Assign to the outer savedRoutine
        console.log('Updated routine in Supabase:', savedRoutine);
      } else {
        console.log('Creating new routine...');
        const { data, error } = await supabase
          .from('routines')
          .insert([routineDataForSupabase])
          .select()
          .single();

        if (error) {
          console.error('Error creating routine:', error);
          throw error;
        }
        savedRoutine = data; // Assign to the outer savedRoutine
        console.log('Created new routine in Supabase:', {
          id: savedRoutine.id,
          name: savedRoutine.name,
          is_active: savedRoutine.is_active
        });
      }

      // Handle exercises
      if (updatedRoutine.exercises && updatedRoutine.exercises.length > 0) {
        console.log(`Processing ${updatedRoutine.exercises.length} exercises...`);
        
        // Delete existing exercises if updating
        if (editingRoutine) {
          console.log('Deleting existing exercises...');
          const { error: deleteError } = await supabase
            .from('exercises')
            .delete()
            .eq('routine_id', savedRoutine.id);
          
          if (deleteError) {
            console.error('Error deleting exercises:', deleteError);
            throw deleteError;
          }
        }

        // Prepare exercise data
        const exercisesData = updatedRoutine.exercises.map(exercise => ({
          routine_id: savedRoutine.id,
          user_id: user.id,
          name: exercise.name,
          sets: exercise.sets || 0,
          reps: exercise.reps || 0,
          weight: exercise.weight || 0,
          day: exercise.day,
          type: exercise.type || 'strength'
        }));

        console.log('Inserting exercises:', exercisesData);
        // Insert new exercises
        const { error: exercisesError } = await supabase
          .from('exercises')
          .insert(exercisesData);

        if (exercisesError) {
          console.error('Error inserting exercises:', exercisesError);
          throw exercisesError;
        }
        console.log(`Saved ${exercisesData.length} exercises to Supabase`);
      }

      // Initialize exercises array if not present locally
      savedRoutine.exercises = updatedRoutine.exercises || [];

      // Update local state
      let updatedRoutinesState;
      if (isNewRoutine) {
        // Deactivate all existing routines locally and add the new active one
        updatedRoutinesState = [
          ...(routines || []).map(r => ({ ...r, is_active: false })),
          { ...savedRoutine, is_active: true }
        ];
      } else {
        // Update existing routine, potentially changing active status
        updatedRoutinesState = routines.map(r =>
          r.id === savedRoutine.id
            ? { ...savedRoutine, is_active: shouldBeActive }
            : { ...r, is_active: shouldBeActive ? false : r.is_active }
        );
      }

      console.log('Final local routines array:', updatedRoutinesState.map(r => ({
        id: r.id,
        name: r.name,
        is_active: r.is_active,
        exercises: r.exercises?.length || 0
      })));

      // Update local routines state
      setRoutines(updatedRoutinesState);

      // Update the global active routine ID state if this routine should be active
      if (shouldBeActive && setActiveRoutineIdState) {
        console.log('Setting global active routine ID state:', savedRoutine.id);
        setActiveRoutineIdState(savedRoutine.id);
      }

      setEditingRoutine(null);
      setIsCreatingRoutine(false);

      console.log('===== FINISHED SAVING ROUTINE =====');
    } catch (error) {
      console.error('Error saving routine:', error);
      Alert.alert('Error', 'Failed to save the routine. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    console.log('Cancelling edit');
    setEditingRoutine(null);
    setIsCreatingRoutine(false);
  };

  // Modified renderRoutineItem to use handleSetActiveRoutine
  const renderRoutineItem = ({ item }) => {
    if (!item) return null;
    
    return (
      <View style={styles.itemContainer}>
        <Swipeable
          ref={ref => {
            if (ref) {
              swipeableRefs[item.id] = ref;
            }
          }}
          renderRightActions={(progress, dragX) => 
            renderRightActions(progress, dragX, item.id)
          }
          onSwipeableOpen={(direction) => {
            if (direction === 'right') {
              openSwipeableRef.current = item.id;
            }
          }}
          onSwipeableClose={() => {
            if (openSwipeableRef.current === item.id) {
              openSwipeableRef.current = null;
            }
          }}
          friction={2}
          rightThreshold={30}
          overshootRight={false}
        >
          <View style={[styles.routineCard, item.is_active && styles.activeRoutineCard]}>
            <TouchableOpacity
              style={styles.routineCardContent}
              onPress={() => {
                console.log('Setting active routine:', item.id);
                handleSetActiveRoutine(item.id);
              }}
            >
              <View style={styles.routineHeader}>
                <Text style={styles.routineName}>{item.name}</Text>
                <View style={styles.routineActions}>
                  {item.is_active && (
                    <View style={styles.activeIndicator}>
                      <Text style={styles.activeIndicatorText}>Active</Text>
                    </View>
                  )}
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={(e) => {
                      e.stopPropagation(); // Prevent triggering the parent onPress
                      handleEditRoutine(item);
                    }}
                  >
                    <Text style={styles.editButtonTextEmoji}>✏️</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.routineInfo}>
                <Text style={styles.routineInfoText}>
                  🏋️ {item.training_days || 0} training days
                </Text>
                <Text style={styles.routineInfoText}>
                  🛌 {item.rest_days || 0} rest days
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Swipeable>
      </View>
    );
  };

  // If editing or creating a routine, show the editor
  if (isCreatingRoutine || editingRoutine) {
    console.log('Rendering RoutineEditorScreen with routine:', editingRoutine?.name || 'new routine');
    return (
      <RoutineEditorScreen
        routine={editingRoutine}
        onSave={handleSaveRoutine}
        onCancel={handleCancelEdit}
        onDelete={handleDeleteRoutine}
      />
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Routines"
        subtitle={activeRoutine ? activeRoutine.name : 'No active routine'}
        showBack={false}
      />
      
      {/* All Routines Section */}
      <View style={styles.subheader}>
        <View style={styles.subheaderLeft}>
          <Text style={styles.subheaderTitle}>All Routines</Text>
          <TouchableOpacity 
            style={styles.addRoutineButton}
            onPress={() => setIsCreatingRoutine(true)}
          >
            <Text style={styles.addRoutineButtonText}>+ Add Routine</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Routines List */}
      <FlatList
        data={sortedRoutines}
        renderItem={renderRoutineItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No routines yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first workout routine to get started
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  subheader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  subheaderLeft: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subheaderTitle: {
    ...typography.title,
    fontSize: normalize(22),
  },
  addRoutineButton: {
    backgroundColor: colors.button.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
    marginLeft: spacing.md,
  },
  addRoutineButtonText: {
    ...typography.button,
    color: colors.text.primary,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  routineCard: {
    backgroundColor: colors.card,
    borderRadius: 0,
    overflow: 'hidden',
    marginBottom: 0,
  },
  activeRoutineCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.button.accent,
  },
  routineCardContent: {
    padding: spacing.md,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  routineName: {
    ...typography.body,
    fontWeight: 'bold',
    fontSize: normalize(18),
  },
  routineActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeIndicator: {
    backgroundColor: colors.button.accent,
    paddingVertical: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
  },
  activeIndicatorText: {
    color: colors.text.primary,
    fontSize: normalize(14),
  },
  editButton: {
    padding: spacing.xs,
  },
  editButtonTextEmoji: {
    fontSize: normalize(18),
  },
  routineInfo: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  routineInfoText: {
    ...typography.caption,
    fontSize: normalize(15),
    marginRight: spacing.md,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.body,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.caption,
    textAlign: 'center',
  },
  deleteButton: {
    width: 100,
    backgroundColor: colors.button.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: colors.text.primary,
    fontWeight: 'bold',
    fontSize: normalize(16),
  },
  itemContainer: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
}); 