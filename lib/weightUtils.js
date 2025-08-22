// Weight conversion utilities and preference management

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for weight unit preference
const WEIGHT_UNIT_KEY = 'weight_unit_preference';

// Weight unit constants
export const WEIGHT_UNITS = {
  KG: 'kg',
  LBS: 'lbs'
};

// Default weight unit
export const DEFAULT_WEIGHT_UNIT = WEIGHT_UNITS.KG;

// Conversion functions with better precision for round-trip accuracy
export const convertWeight = (weight, fromUnit, toUnit) => {
  if (fromUnit === toUnit) return weight;
  
  const numWeight = parseFloat(weight) || 0;
  
  if (fromUnit === WEIGHT_UNITS.KG && toUnit === WEIGHT_UNITS.LBS) {
    // kg to lbs (multiply by 2.20462)
    return Math.round(numWeight * 2.20462 * 100) / 100; // Round to 2 decimal places for better accuracy
  } else if (fromUnit === WEIGHT_UNITS.LBS && toUnit === WEIGHT_UNITS.KG) {
    // lbs to kg (divide by 2.20462) - store with high precision
    return numWeight / 2.20462; // Don't round storage weight for better round-trip accuracy
  }
  
  return numWeight;
};

// Format weight with unit (empty weights show nothing)
export const formatWeight = (weight, unit) => {
  const numWeight = parseFloat(weight) || 0;
  if (numWeight === 0) return '';
  return `${numWeight} ${unit}`;
};

// Get weight unit preference from storage
export const getWeightUnitPreference = async () => {
  try {
    const savedUnit = await AsyncStorage.getItem(WEIGHT_UNIT_KEY);
    return savedUnit || DEFAULT_WEIGHT_UNIT;
  } catch (error) {
    console.error('Error getting weight unit preference:', error);
    return DEFAULT_WEIGHT_UNIT;
  }
};

// Save weight unit preference to storage
export const saveWeightUnitPreference = async (unit) => {
  try {
    await AsyncStorage.setItem(WEIGHT_UNIT_KEY, unit);
    return true;
  } catch (error) {
    console.error('Error saving weight unit preference:', error);
    return false;
  }
};

// Display weight based on user preference (for database weights stored in kg)
export const displayWeightWithUnit = (storageWeight, preferredUnit) => {
  const numWeight = parseFloat(storageWeight) || 0;
  if (numWeight === 0) return '';
  
  // Convert from kg storage to user's preferred unit
  const displayWeight = convertWeight(storageWeight, WEIGHT_UNITS.KG, preferredUnit);
  return `${displayWeight} ${preferredUnit}`;
};

// Convert user input to storage format (always kg) with original preservation
export const convertInputToStorageWeight = (inputWeight, inputUnit) => {
  const numWeight = parseFloat(inputWeight) || 0;
  if (inputUnit === WEIGHT_UNITS.KG) {
    return numWeight; // No conversion needed, return exact input
  }
  return convertWeight(numWeight, inputUnit, WEIGHT_UNITS.KG);
};

// Enhanced weight storage that preserves original input
export const createWeightData = (inputWeight, inputUnit) => {
  const numWeight = parseFloat(inputWeight) || 0;
  return {
    value: numWeight,
    unit: inputUnit,
    kg: inputUnit === WEIGHT_UNITS.KG ? numWeight : convertWeight(numWeight, inputUnit, WEIGHT_UNITS.KG)
  };
};

// Convert storage weight to display format with smart rounding
export const convertStorageToDisplayWeight = (storageWeight, displayUnit) => {
  const converted = convertWeight(storageWeight, WEIGHT_UNITS.KG, displayUnit);
  // Round to nearest integer for common weight values to improve UX
  if (displayUnit === WEIGHT_UNITS.LBS && Math.abs(converted - Math.round(converted)) < 0.1) {
    return Math.round(converted);
  }
  return Math.round(converted * 10) / 10; // Otherwise round to 1 decimal place
};