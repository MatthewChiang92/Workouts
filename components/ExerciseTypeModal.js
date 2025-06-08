import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Animated,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  TextInput,
} from 'react-native';
import { 
  colors, 
  typography, 
  spacing, 
  borderRadius, 
  normalize,
  commonStyles,
} from '../styles/globalStyles';

// Fallback exercises when user doesn't have any previous exercises
const fallbackExercises = [
  { id: 'e1', name: 'Bench Press', type: 'strength', sets: '3', reps: '8-12', weight: '135' },
  { id: 'e2', name: 'Squats', type: 'strength', sets: '3', reps: '8-12', weight: '185' },
  { id: 'e3', name: 'Deadlifts', type: 'strength', sets: '3', reps: '8-12', weight: '225' },
  { id: 'e4', name: 'Push-ups', type: 'strength', sets: '3', reps: '10-15', weight: 'body' },
  { id: 'e5', name: 'Running', type: 'cardio', duration: '30', distance: '3', calories: '300' },
  { id: 'e6', name: 'Cycling', type: 'cardio', duration: '45', distance: '10', calories: '400' },
];

export default function ExerciseTypeModal({ visible, onClose, onSelectType, activeRoutine }) {
  // Animation value for popup
  const [animation] = useState(new Animated.Value(0));
  const [searchQuery, setSearchQuery] = useState('');
  const [previousExercises, setPreviousExercises] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  
  // Log to debug
  console.log('ExerciseTypeModal visible:', visible);
  
  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start();
      
      // Extract unique exercises from user's routines
      if (activeRoutine?.exercises?.length) {
        const uniqueExercises = [];
        const exerciseNames = new Set();
        
        activeRoutine.exercises.forEach(exercise => {
          if (!exerciseNames.has(exercise.name)) {
            exerciseNames.add(exercise.name);
            uniqueExercises.push(exercise);
          }
        });
        
        setPreviousExercises(uniqueExercises);
      } else {
        // Use fallback exercises if user has no previous exercises
        setPreviousExercises(fallbackExercises);
      }
      
      // Reset search results
      setSearchResults([]);
    } else {
      // Animate out
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      // Reset search when modal closes
      setSearchQuery('');
    }
  }, [visible, activeRoutine]);
  
  // Filter exercises when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
    } else {
      const filtered = previousExercises.filter(exercise => 
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
    }
  }, [searchQuery, previousExercises]);
  
  // Calculate animation styles
  const popupScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });
  
  const popupOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  
  const handleSelectType = (type, exercise = null) => {
    console.log('Selected exercise type:', type, exercise?.name);
    onSelectType(type, exercise);
  };
  
  const handleSelectStrength = () => {
    console.log('Strength option selected in ExerciseTypeModal');
    onSelectType('strength');
  };

  const handleSelectCardio = () => {
    console.log('Cardio option selected in ExerciseTypeModal');
    onSelectType('cardio');
  };

  const handleSelectExercise = (exercise) => {
    console.log('Exercise selected from search:', exercise.name);
    // Pass the complete exercise object along with its type
    // This ensures all data (name, sets, reps, weight) is available in AddStrengthExerciseModal
    onSelectType('previous', {
      ...exercise,
      day: exercise.day || null, // Ensure day is preserved if it exists
    });
    
    // Close the modal immediately after selection
    onClose();
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
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Select Exercise Type</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  console.log('Close button pressed in ExerciseTypeModal');
                  onClose();
                }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search your exercises..."
                placeholderTextColor={colors.text.secondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            {/* Show search results or exercise types */}
            {searchQuery.trim() === '' ? (
              <View style={styles.typesContainer}>
                <TouchableOpacity 
                  style={styles.typeButton}
                  onPress={handleSelectStrength}
                >
                  <View style={styles.typeIconContainer}>
                    <Text style={styles.typeIcon}>💪</Text>
                  </View>
                  <Text style={styles.typeText}>Strength Training</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.typeButton}
                  onPress={handleSelectCardio}
                >
                  <View style={styles.typeIconContainer}>
                    <Text style={styles.typeIcon}>🏃</Text>
                  </View>
                  <Text style={styles.typeText}>Cardio</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                style={styles.searchResultsContainer}
                contentContainerStyle={styles.searchResultsContent}
                data={searchResults}
                keyExtractor={(item, index) => item.id || index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.exerciseItem}
                    onPress={() => handleSelectExercise(item)}
                  >
                    <View style={styles.exerciseTypeIcon}>
                      <Text>
                        {item.type === 'strength' ? '💪' : '🏃'}
                      </Text>
                    </View>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{item.name}</Text>
                      <Text style={styles.exerciseDetails}>
                        {item.type === 'strength' 
                          ? `${item.sets} sets • ${item.reps} reps • ${item.weight} ${item.weight === 'body' ? 'weight' : 'lbs'}` 
                          : `${item.duration} min • ${item.distance} ${item.distance === '0' ? '' : 'miles'}`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptySearchContainer}>
                    <Text style={styles.emptySearchText}>
                      No exercises found matching your search
                    </Text>
                    <Text style={styles.emptySearchSubtext}>
                      Try a different search term or create a new exercise
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  title: {
    ...typography.title,
    flex: 1,
  },
  closeButton: {
    padding: spacing.md,
  },
  closeButtonText: {
    ...typography.body,
    color: colors.text.primary,
  },
  typesContainer: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  typeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  typeIcon: {
    fontSize: normalize(20),
  },
  typeText: {
    ...typography.body,
    flex: 1,
  },
  searchContainer: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    color: colors.text.primary,
    fontSize: normalize(16),
    height: 44,
  },
  searchResultsContainer: {
    flexGrow: 1,
  },
  searchResultsContent: {
    padding: spacing.md,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  exerciseTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    ...typography.body,
    fontSize: normalize(16),
    fontWeight: '500',
    marginBottom: spacing.xs / 2,
  },
  exerciseDetails: {
    ...typography.caption,
  },
  emptySearchContainer: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySearchText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySearchSubtext: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
}); 