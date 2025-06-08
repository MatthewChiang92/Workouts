import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cqragdmirejjyhclsxfy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxcmFnZG1pcmVqanloY2xzeGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3ODEzMTEsImV4cCI6MjA2MDM1NzMxMX0.pUut33MdQzu3oUeqn6lbkLVICGQRhI3j4Hye82_4x2Q';

// Initialize the Supabase client
// We pass AsyncStorage to the Supabase client for session persistence in React Native
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important for React Native
  },
}); 