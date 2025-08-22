import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RoutinesScreen from './screens/RoutinesScreen';
import SettingsScreen from './screens/SettingsScreen';
import AuthScreen from './screens/AuthScreen';
import ConfettiCannon from 'react-native-confetti-cannon';
import { 
  colors, 
  typography, 
  spacing, 
  borderRadius, 
  commonStyles, 
  normalize 
} from './styles/globalStyles';
import { format, startOfWeek, addDays } from 'date-fns';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DarkTheme, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React from 'react';
import AppHeader from './components/AppHeader';
import { supabase } from './lib/supabaseClient';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import LiquidGlassTabBar from './components/LiquidGlassTabBar';
import RoutineEditorScreen from './components/RoutineEditorScreen';

// Add this constant at the top of the file, after imports
const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

function MainApp({ navigation, routines, setRoutines, activeRoutineIdState, username }) {
  const insets = useSafeAreaInsets();
  const [activeScreen, setActiveScreen] = useState('home');
  const [activeView, setActiveView] = useState('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [confettiPosition, setConfettiPosition] = useState({ x: 0, y: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiRef = useRef(null);
  
  const activeRoutine = routines ? routines.find(r => r.id === activeRoutineIdState) : null;
  
  useEffect(() => {
    console.log('MainApp - Active routine ID state changed:', activeRoutineIdState);
  }, [activeRoutineIdState]);
  
  useEffect(() => {
    if (showConfetti && confettiRef.current) {
      confettiRef.current.start();
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);
  
  const isRestDay = () => {
    if (!activeRoutine) return false;
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[dayOfWeek];
    const exercisesForToday = activeRoutine.exercises?.filter(ex => ex.day === todayName);
    // const isConfiguredAsRestDay = activeRoutine.restDaysConfig?.[todayName] === true;
    // Simplified: Rest day if no exercises for today
    return !exercisesForToday || exercisesForToday.length === 0;
  };
  
  const todayIsRestDay = isRestDay();
  
  const getTodayName = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames[dayOfWeek];
  };
  
  const todayName = getTodayName();
  const todaysExercises = activeRoutine?.exercises?.filter(ex => ex.day === todayName) || [];
  
  // TODO: Update toggleExerciseCompletion and setPR to use Supabase later
  const toggleExerciseCompletion = (exerciseId, position = { x: Dimensions.get('window').width / 2, y: Dimensions.get('window').height / 2 }) => {
     console.warn("TODO: Implement toggleExerciseCompletion with Supabase");
     // Temporary local update for UI feedback
     if (!routines || !activeRoutine || !activeRoutine.exercises) return;
     const updatedRoutines = routines.map(routine => {
       if (routine.id === activeRoutine.id) {
         const updatedExercises = routine.exercises.map(exercise => {
           if (exercise.id === exerciseId) {
             if (!exercise.isCompleted) {
               setConfettiPosition(position);
               setShowConfetti(true);
             }
             // NOTE: isCompleted doesn't exist in DB schema yet
             return { ...exercise, isCompleted: !exercise.isCompleted }; 
           }
           return exercise;
         });
         return { ...routine, exercises: updatedExercises };
       }
       return routine;
     });
     setRoutines(updatedRoutines);
  };
  
  const setPR = (exerciseId) => {
    console.warn("TODO: Implement setPR with Supabase");
    // Temporary local update for UI feedback
     if (!routines || !activeRoutine || !activeRoutine.exercises) return;
     const updatedRoutines = routines.map(routine => {
       if (routine.id === activeRoutine.id) {
         const updatedExercises = routine.exercises.map(exercise => {
           if (exercise.id === exerciseId) {
             // NOTE: isPR doesn't exist in DB schema yet
             return { ...exercise, isPR: true }; 
           }
           return exercise;
         });
         return { ...routine, exercises: updatedExercises };
       }
       return routine;
     });
     setRoutines(updatedRoutines);
  };

  const ExerciseItem = React.memo(({ item, onToggleCompletion, onSetPR }) => {
    const checkboxRef = useRef(null);
    
    const handleToggleCompletion = () => {
      if (checkboxRef.current) {
        checkboxRef.current.measure((fx, fy, width, height, px, py) => {
          onToggleCompletion(item.id, { x: px + width/2, y: py + height/2 });
        });
      } else {
        onToggleCompletion(item.id);
      }
    };
    
    // Use temporary local state for UI feedback
    const isCompleted = item.isCompleted; // Get from temp state
    const isPR = item.isPR; // Get from temp state
    
    return (
      <View style={styles.exerciseCard}>
        <View style={styles.exerciseRow}>
          <TouchableOpacity
            ref={checkboxRef}
            style={styles.checkbox}
            onPress={handleToggleCompletion}
          >
            {isCompleted && <View style={styles.checkboxInner} />}
          </TouchableOpacity>
          
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName}>{item.name}</Text>
            <Text style={styles.exerciseStats}>
              {item.sets} sets × {item.reps} reps • {item.weight} lbs
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.prButton}
            onPress={() => onSetPR(item.id)}
          >
            <Text style={[
              styles.prButtonText, 
              isPR && { color: colors.button.accent }
            ]}>
              {isPR ? 'PR 🏆' : 'PR'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  });
  
  const renderExerciseItem = ({ item }) => (
    <ExerciseItem 
      item={item} 
      onToggleCompletion={toggleExerciseCompletion}
      onSetPR={setPR}
    />
  );
  
  return (
    <View style={styles.container}>
      <AppHeader
        title={`Welcome ${username || 'User'}!`}
        subtitle={activeRoutine ? activeRoutine.name : 'No active routine'}
        showBack={false}
      />
      
      {/* View Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={activeView === 'day' ? styles.tabActive : styles.tab}
          onPress={() => setActiveView('day')}
        >
          <Text style={activeView === 'day' ? styles.tabTextActive : styles.tabText}>
            Day
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={activeView === 'week' ? styles.tabActive : styles.tab}
          onPress={() => setActiveView('week')}
        >
          <Text style={activeView === 'week' ? styles.tabTextActive : styles.tabText}>
            Week
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Content Area - Includes both Rest Day Indicator and FlatList/WeekView */}
      {activeView === 'day' ? (
        <>
          {/* Rest Day Indicator */}
          {todayIsRestDay && (
            <View style={styles.restDayIndicator}>
              <Text style={styles.restDayEmoji}>🛌</Text>
              <Text style={styles.restDayTitle}>Rest Day</Text>
              <Text style={styles.restDaySubtitle}>
                Take it easy today! Your body needs time to recover.
              </Text>
            </View>
          )}
          
          {/* Exercise List */}
          <FlatList
            style={styles.list}
            contentContainerStyle={styles.listContent}
            data={todaysExercises}
            renderItem={renderExerciseItem}
            keyExtractor={item => item.id}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                {todayIsRestDay ? (
                  <Text style={styles.emptyText}>
                    
                  </Text>
                ) : (
                  <>
                    <Text style={styles.emptyText}>
                      No exercises for today
                    </Text>
                    <Text style={styles.emptySubtext}>
                      Go to Routines tab to set up your workout
                    </Text>
                  </>
                )}
              </View>
            }
          />
        </>
      ) : (
        <WeekView 
          routines={routines}
          activeRoutine={activeRoutine}
          selectedDate={selectedDate}
        />
      )}
      
      {/* Confetti Effect */}
      {showConfetti && (
        <ConfettiCannon
          ref={confettiRef}
          count={100}
          origin={confettiPosition}
          autoStart={false}
          explosionSpeed={350}
          fallSpeed={3000}
          fadeOut={true}
          colors={['#FFD700', '#FF6347', '#7B68EE', '#3CB371', '#00BFFF']}
        />
      )}
    </View>
  );
}

// Create both navigators
const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();
const RoutinesStack = createNativeStackNavigator();

// Auth Navigator
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background }
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

// Routines Stack Navigator
function RoutinesNavigator({ routines, setRoutines, setActiveRoutine, activeRoutineIdState, setActiveRoutineIdState }) {
  return (
    <RoutinesStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background }
      }}
    >
      <RoutinesStack.Screen name="RoutinesList">
        {props => (
          <RoutinesScreenWrapper
            {...props}
            routines={routines}
            setRoutines={setRoutines}
            setActiveRoutine={setActiveRoutine}
            activeRoutineIdState={activeRoutineIdState}
            setActiveRoutineIdState={setActiveRoutineIdState}
          />
        )}
      </RoutinesStack.Screen>
      <RoutinesStack.Screen 
        name="RoutineEditor" 
        component={RoutineEditorScreen}
      />
    </RoutinesStack.Navigator>
  );
}

// Main App Navigator
function MainNavigator({ routines, setRoutines, activeRoutineIdState, setActiveRoutineIdState, username }) {
  
  // Function to set active routine AND update Supabase
  const setActiveRoutine = async (newActiveRoutineId) => {
    console.log("Setting active routine in Supabase and state:", newActiveRoutineId);
    if (!routines) return;

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Update local state immediately for responsiveness
      setActiveRoutineIdState(newActiveRoutineId);
      const updatedLocalRoutines = routines.map(routine => ({
        ...routine,
        is_active: routine.id === newActiveRoutineId,
      }));
      setRoutines(updatedLocalRoutines);

      // Deactivate all routines first
      const { error: deactivateError } = await supabase
        .from('routines')
        .update({ is_active: false })
        .eq('user_id', user.id);
      
      if (deactivateError) throw deactivateError;

      // Set new routine to active
      const { error: activateError } = await supabase
        .from('routines')
        .update({ is_active: true })
        .eq('id', newActiveRoutineId);
      
      if (activateError) throw activateError;

      console.log("Supabase active routine updated successfully");
    } catch (error) {
      console.error("Error updating active routine in Supabase:", error);
      Alert.alert("Error", "Could not update active routine status in the database.");
    }
  };

  return (
    <Tab.Navigator
      tabBar={(props) => <LiquidGlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        lazy: false,
        unmountOnBlur: false,
      }}
    >
      <Tab.Screen name="Home">
        {props => (
          <MainApp
            {...props}
            routines={routines}
            setRoutines={setRoutines}
            activeRoutineIdState={activeRoutineIdState}
            username={username}
          />
        )}
      </Tab.Screen>
      <Tab.Screen 
        name="Routines"
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'RoutinesList';
          console.log('Current route name in Routines tab:', routeName);
          
          return {
            tabBarStyle: routeName === 'RoutineEditor' ? { display: 'none' } : undefined,
          };
        }}
      >
        {props => (
          <RoutinesNavigator
            {...props}
            routines={routines}
            setRoutines={setRoutines}
            setActiveRoutine={setActiveRoutine}
            activeRoutineIdState={activeRoutineIdState}
            setActiveRoutineIdState={setActiveRoutineIdState}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

// Main App component
export default function App() {
  const [routines, setRoutines] = useState([]); // Initialize as empty array
  const [activeRoutineIdState, setActiveRoutineIdState] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('User'); // Add username state

  // New function to fetch data from Supabase
  const fetchRoutinesAndExercises = async () => {
    console.log('\n==== FETCHING ROUTINES AND EXERCISES ====');
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      console.log("Fetching data for user:", user.id);

      // Fetch routines
      const { data: routinesData, error: routinesError } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (routinesError) throw routinesError;
      console.log("Fetched routines:", routinesData?.map(r => ({
        id: r.id,
        name: r.name,
        is_active: r.is_active
      })));

      // Fetch exercises
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select('*')
        .eq('user_id', user.id);

      if (exercisesError) throw exercisesError;
      console.log("Fetched exercises count by routine:", exercisesData.reduce((acc, ex) => {
        acc[ex.routine_id] = (acc[ex.routine_id] || 0) + 1;
        return acc;
      }, {}));

      // Combine routines and exercises
      const combinedRoutines = routinesData.map(routine => ({
        ...routine,
        exercises: exercisesData.filter(ex => ex.routine_id === routine.id)
      }));

      console.log("Combined routines:", combinedRoutines.map(r => ({
        id: r.id,
        name: r.name,
        is_active: r.is_active,
        exercise_count: r.exercises.length
      })));
      
      // Update local state with the fetched routines
      setRoutines(combinedRoutines);

      // --- Add Username Fetching --- 
      console.log('Extracting username from user metadata:', user.user_metadata);
      if (user.user_metadata && (user.user_metadata.username || user.user_metadata.Username)) {
          // Check for both lowercase and uppercase Username
          const fetchedUsername = user.user_metadata.username || user.user_metadata.Username;
          setUsername(fetchedUsername);
          console.log('Username set to:', fetchedUsername);
      } else {
          setUsername('User'); // Default if not found
          console.log("Username not found in metadata, defaulting to 'User'.");
      }
      // --- End Username Fetching ---

      // Find the active routine
      const activeRoutine = combinedRoutines.find(r => r.is_active);
      console.log("Found active routine:", activeRoutine ? {
        id: activeRoutine.id,
        name: activeRoutine.name,
        exercise_count: activeRoutine.exercises.length
      } : 'None');

      // Update active routine state
      if (activeRoutine) {
        console.log("Setting active routine ID:", activeRoutine.id);
        setActiveRoutineIdState(activeRoutine.id);
      } else {
        console.log("No active routine found");
        setActiveRoutineIdState(null);
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error Loading Data", error.message || "Could not load workout data.");
      setRoutines([]); // Set to empty array on error
      setActiveRoutineIdState(null);
      setUsername('User'); // Reset username on error too
    } finally {
      setLoading(false);
    }
  };

  // Supabase session handling
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchRoutinesAndExercises(); // Fetch data if session exists initially
      } else {
        setLoading(false); // No session, stop loading
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log("Auth state changed:", _event, !!session);
        setSession(session);
        if (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION') {
          await fetchRoutinesAndExercises(); // Fetch data on sign in
        } else if (_event === 'SIGNED_OUT') {
          setRoutines([]);
          setActiveRoutineIdState(null);
          setUsername('User'); // Reset username on sign out
          setLoading(false); // Stop loading on sign out
        }
      }
    );

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Add a listener for routines changes
  useEffect(() => {
    console.log('Routines updated:', routines?.length);
    console.log('Active routine ID:', activeRoutineIdState);
  }, [routines, activeRoutineIdState]);

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.text.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer theme={DarkTheme}>
          {session && session.user ? (
            <MainNavigator 
              routines={routines}
              setRoutines={setRoutines}
              activeRoutineIdState={activeRoutineIdState}
              setActiveRoutineIdState={setActiveRoutineIdState}
              username={username}
            />
          ) : (
            <AuthNavigator />
          )}
        </NavigationContainer>
        <StatusBar style="light" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// Updated styles using global style variables
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: 120, // Add padding for floating tab bar
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    paddingVertical: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
    width: '100%',
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navText: {
    color: colors.text.secondary,
    fontSize: normalize(12),
    marginTop: spacing.xs,
  },
  navTextActive: {
    color: colors.button.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  tab: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginRight: spacing.xs,
  },
  tabActive: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginRight: spacing.xs,
    backgroundColor: colors.text.primary,
    borderRadius: borderRadius.xl,
  },
  tabText: {
    color: colors.text.secondary,
    fontSize: normalize(16),
  },
  tabTextActive: {
    color: colors.background,
    fontSize: normalize(16),
    fontWeight: '500',
  },
  list: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  restDayIndicator: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  restDayEmoji: {
    fontSize: normalize(48),
    marginBottom: spacing.sm,
  },
  restDayTitle: {
    fontSize: normalize(24),
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  restDaySubtitle: {
    fontSize: normalize(16),
    color: colors.text.secondary,
    textAlign: 'center',
  },
  exerciseCard: {
    marginBottom: spacing.sm,
    width: '100%',
  },
  exerciseRow: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: normalize(24),
    height: normalize(24),
    borderRadius: borderRadius.circle / 2,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: normalize(12),
    height: normalize(12),
    borderRadius: borderRadius.circle / 4,
    backgroundColor: colors.button.primary,
  },
  exerciseInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  exerciseName: {
    ...typography.body,
    fontWeight: '500',
    marginBottom: spacing.xs / 2,
  },
  exerciseStats: {
    ...typography.caption,
  },
  prButton: {
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prButtonText: {
    color: colors.button.primary,
    fontSize: normalize(14),
  },
  viewTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  viewTab: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    borderRadius: borderRadius.xl,
  },
  activeViewTab: {
    backgroundColor: colors.text.primary,
  },
  viewTabText: {
    color: colors.text.secondary,
    fontSize: normalize(16),
  },
  activeViewTabText: {
    color: colors.background,
    fontWeight: '500',
  },
  dayViewContainer: {
    flex: 1,
    paddingHorizontal: 0,
  },
  cornerDateContainer: {
    alignSelf: 'flex-start',
    marginLeft: spacing.md,
    marginBottom: spacing.md,
  },
  cornerDayName: {
    fontSize: normalize(20),
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  cornerDateText: {
    fontSize: normalize(14),
    color: colors.text.secondary,
  },
  workoutContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  exerciseList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: normalize(18),
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  emptySubtext: {
    fontSize: normalize(14),
    color: colors.text.secondary,
    textAlign: 'center',
  },
  selectRoutineButton: {
    backgroundColor: colors.button.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  selectRoutineButtonText: {
    color: colors.text.primary,
    fontSize: normalize(16),
    fontWeight: '500',
  },
  weekViewContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  weekDayCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  weekDayName: {
    fontSize: normalize(16),
    fontWeight: '500',
    color: colors.text.primary,
  },
  restDayIndicator: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  restDayText: {
    color: colors.text.secondary,
    fontSize: normalize(14),
  },
  restDaySubtitle: {
    ...typography.body,
    textAlign: 'center',
    color: colors.text.secondary,
  },
  exerciseCountText: {
    color: colors.text.secondary,
    fontSize: normalize(14),
  },
  weekViewTitle: {
    fontSize: normalize(18),
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  weekDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  weekDayExercises: {
    marginTop: spacing.xs,
  },
  weekDayExerciseName: {
    color: colors.text.secondary,
    fontSize: normalize(14),
    marginBottom: spacing.xs / 2,
  },
  moreExercises: {
    color: colors.text.accent,
    fontSize: normalize(14),
    marginTop: spacing.xs / 2,
  },
  restDayCard: {
    opacity: 0.8,
    backgroundColor: colors.card,
  },
  screenHeader: {
    paddingTop: Platform.OS === 'ios' ? normalize(50, false) : normalize(20, false),
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    ...typography.subtitle,
    marginTop: spacing.xs,
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: normalize(14),
    marginTop: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

// Placeholder screen components
function HomeScreenPlaceholder() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: colors.text.primary }}>Home Screen</Text>
    </View>
  );
}

function RoutinesScreenPlaceholder() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: colors.text.primary }}>Routines Screen</Text>
    </View>
  );
}

function ProgressScreenPlaceholder() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: colors.text.primary }}>Progress Screen</Text>
    </View>
  );
}

function ProfileScreenPlaceholder() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: colors.text.primary }}>Profile Screen</Text>
    </View>
  );
}

// Add a wrapper component for RoutinesScreen
function RoutinesScreenWrapper({ navigation, routines, setRoutines, setActiveRoutine, activeRoutineIdState, setActiveRoutineIdState }) {
  console.log('RoutinesScreenWrapper rendered with routines:', routines?.length);
  
  // Function to set active routine WITHOUT navigating to Home
  const handleSetActiveRoutine = (routineId) => {
    console.log('Setting active routine in RoutinesScreenWrapper:', routineId);
    
    // Call the parent's setActiveRoutine function to update the global state
    setActiveRoutine(routineId);
    
    // Create a new array with the updated active status to update the local state
    const updatedRoutines = routines.map(routine => ({
      ...routine,
      is_active: routine.id === routineId
    }));
    
    // Update the routines state through the parent's setRoutines function
    setRoutines(updatedRoutines);
  };
  
  return (
    <RoutinesScreen 
      navigation={navigation}
      routines={routines} 
      setRoutines={setRoutines} 
      setActiveRoutine={handleSetActiveRoutine} 
      activeRoutineIdState={activeRoutineIdState}
      setActiveRoutineIdState={setActiveRoutineIdState}
    />
  );
}

function WeekView({ routines = [], activeRoutine = null, selectedDate }) {
  // Add null checks
  const startOfCurrentWeek = startOfWeek(selectedDate);
  
  // Add the formatted week dates
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    weekDays.push(addDays(startOfCurrentWeek, i));
  }
  
  // Function to determine if a specific day is a rest day
  const isDayRestDay = (dayName) => {
    // If there are no exercises for this day, it's a rest day
    if (!activeRoutine?.exercises) return true;
    
    const exercisesForDay = activeRoutine.exercises.filter(ex => ex.day === dayName);
    return exercisesForDay.length === 0;
  };
  
  return (
    <ScrollView style={styles.weekViewContainer}>
      <Text style={styles.weekViewTitle}>Week Schedule</Text>
      
      {weekDays.map((date, index) => {
        // Get the day name for this date
        const dayName = format(date, 'EEEE'); // 'Monday', 'Tuesday', etc.
        
        // Determine if this day is a rest day
        const isRestDay = isDayRestDay(dayName);
        
        // Get exercises for this day if not a rest day
        const dayExercises = !isRestDay && activeRoutine?.exercises 
          ? activeRoutine.exercises.filter(ex => ex.day === dayName).slice(0, 3) 
          : [];
          
        return (
          <View 
            key={index}
            style={[
              styles.weekDayCard,
              isRestDay && styles.restDayCard
            ]}
          >
            <View style={styles.weekDayHeader}>
              <Text style={styles.weekDayName}>{dayName}</Text>
              
              {isRestDay ? (
                <View style={styles.restDayIndicator}>
                  <Text style={styles.restDayText}>Rest Day</Text>
                </View>
              ) : (
                <View style={styles.exerciseCount}>
                  <Text style={styles.exerciseCountText}>
                    {dayExercises?.length || 0} exercises
                  </Text>
                </View>
              )}
            </View>
            
            {!isRestDay && dayExercises?.length > 0 && (
              <View style={styles.weekDayExercises}>
                {dayExercises.map((exercise, idx) => (
                  <Text key={idx} style={styles.weekDayExerciseName}>
                    • {exercise?.name || 'Unknown exercise'}
                  </Text>
                ))}
                
                {activeRoutine?.exercises?.filter(ex => ex.day === dayName).length > 3 && (
                  <Text style={styles.moreExercises}>
                    + {activeRoutine.exercises.filter(ex => ex.day === dayName).length - 3} more
                  </Text>
                )}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}
