import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  WEIGHT_UNITS, 
  DEFAULT_WEIGHT_UNIT, 
  getWeightUnitPreference, 
  saveWeightUnitPreference 
} from '../lib/weightUtils';

// Create the context
const WeightUnitContext = createContext();

// Hook to use the context
export const useWeightUnit = () => {
  const context = useContext(WeightUnitContext);
  if (!context) {
    throw new Error('useWeightUnit must be used within a WeightUnitProvider');
  }
  return context;
};

// Provider component
export const WeightUnitProvider = ({ children }) => {
  const [weightUnit, setWeightUnit] = useState(DEFAULT_WEIGHT_UNIT);
  const [loading, setLoading] = useState(true);

  // Load saved preference on mount
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const savedUnit = await getWeightUnitPreference();
        setWeightUnit(savedUnit);
      } catch (error) {
        console.error('Error loading weight unit preference:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreference();
  }, []);

  // Function to change weight unit preference
  const changeWeightUnit = async (newUnit) => {
    try {
      const success = await saveWeightUnitPreference(newUnit);
      if (success) {
        setWeightUnit(newUnit);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error changing weight unit preference:', error);
      return false;
    }
  };

  const value = {
    weightUnit,
    changeWeightUnit,
    loading,
    isKg: weightUnit === WEIGHT_UNITS.KG,
    isLbs: weightUnit === WEIGHT_UNITS.LBS,
    WEIGHT_UNITS,
  };

  return (
    <WeightUnitContext.Provider value={value}>
      {children}
    </WeightUnitContext.Provider>
  );
};