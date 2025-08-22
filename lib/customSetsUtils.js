// Custom Sets Utility Functions

export const EXERCISE_MODES = {
  QUICK: 'quick',
  CUSTOM: 'custom'
};

// Create a new empty set
export const createEmptySet = () => ({
  reps: '',
  weight: ''
});

// Create default sets for custom mode (3 sets with same values)
export const createDefaultCustomSets = (reps = '12', weight = '60') => [
  { reps, weight },
  { reps, weight },
  { reps, weight }
];

// Convert quick mode exercise to custom mode
export const convertQuickToCustom = (exercise) => {
  const reps = exercise.reps || '12';
  const weight = exercise.weight || '60';
  const sets = parseInt(exercise.sets) || 3;
  
  return {
    ...exercise,
    exercise_mode: EXERCISE_MODES.CUSTOM,
    custom_sets: Array(sets).fill().map(() => ({ reps, weight }))
  };
};

// Convert custom mode exercise to quick mode (uses averages/first set values)
export const convertCustomToQuick = (exercise) => {
  if (!exercise.custom_sets || exercise.custom_sets.length === 0) {
    return {
      ...exercise,
      exercise_mode: EXERCISE_MODES.QUICK,
      sets: '3',
      reps: '12',
      weight: '60'
    };
  }
  
  // Use first set values for quick mode
  const firstSet = exercise.custom_sets[0];
  
  return {
    ...exercise,
    exercise_mode: EXERCISE_MODES.QUICK,
    sets: exercise.custom_sets.length.toString(),
    reps: firstSet.reps.toString(),
    weight: firstSet.weight.toString()
  };
};

// Calculate total volume (sets × reps × weight) for custom sets
export const calculateCustomVolume = (customSets, weightUnit = 'kg') => {
  if (!customSets || customSets.length === 0) return 0;
  
  return customSets.reduce((total, set) => {
    const reps = parseInt(set.reps) || 0;
    const weight = parseFloat(set.weight) || 0;
    return total + (reps * weight);
  }, 0);
};

// Get display text for custom sets
export const getCustomSetsDisplayText = (customSets, weightUnit = 'kg') => {
  if (!customSets || customSets.length === 0) return '';
  
  const setCount = customSets.length;
  
  // If all sets are identical, show like quick mode
  const allIdentical = customSets.every(set => 
    set.reps === customSets[0].reps && set.weight === customSets[0].weight
  );
  
  if (allIdentical) {
    const firstSet = customSets[0];
    return `${setCount} sets • ${firstSet.reps} reps • ${firstSet.weight} ${weightUnit}`;
  }
  
  // Show range format for different sets
  const repsRange = getRangeText(customSets.map(s => parseInt(s.reps) || 0));
  const weightRange = getRangeText(customSets.map(s => parseFloat(s.weight) || 0));
  
  return `${setCount} sets • ${repsRange} reps • ${weightRange} ${weightUnit}`;
};

// Helper to get range text (e.g., "8-12" or "10" if all same)
const getRangeText = (values) => {
  const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
  if (uniqueValues.length === 1) {
    return uniqueValues[0].toString();
  }
  return `${uniqueValues[0]}-${uniqueValues[uniqueValues.length - 1]}`;
};

// Validate custom sets data
export const validateCustomSets = (customSets) => {
  if (!customSets || !Array.isArray(customSets) || customSets.length === 0) {
    return { valid: false, error: 'At least one set is required' };
  }
  
  for (let i = 0; i < customSets.length; i++) {
    const set = customSets[i];
    
    if (!set.reps || isNaN(parseInt(set.reps)) || parseInt(set.reps) <= 0) {
      return { valid: false, error: `Set ${i + 1}: Reps must be a positive number` };
    }
    
    if (set.weight && isNaN(parseFloat(set.weight))) {
      return { valid: false, error: `Set ${i + 1}: Weight must be a valid number` };
    }
  }
  
  return { valid: true };
};

// Add a new set to custom sets array
export const addSetToCustomSets = (customSets, newSet = null) => {
  const sets = customSets || [];
  const setToAdd = newSet || createEmptySet();
  
  // If adding to existing sets, use the last set's values as default
  if (sets.length > 0 && !newSet) {
    const lastSet = sets[sets.length - 1];
    setToAdd.reps = lastSet.reps;
    setToAdd.weight = lastSet.weight;
  }
  
  return [...sets, setToAdd];
};

// Remove a set from custom sets array
export const removeSetFromCustomSets = (customSets, index) => {
  if (!customSets || index < 0 || index >= customSets.length) return customSets;
  return customSets.filter((_, i) => i !== index);
};

// Update a specific set in custom sets array
export const updateSetInCustomSets = (customSets, index, updatedSet) => {
  if (!customSets || index < 0 || index >= customSets.length) return customSets;
  
  const newSets = [...customSets];
  newSets[index] = { ...newSets[index], ...updatedSet };
  return newSets;
};