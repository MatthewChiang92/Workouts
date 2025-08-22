# Workouts App - Claude Code Documentation

## Project Overview

**Workouts** is a React Native fitness tracking application built with Expo. The app allows users to create, manage, and track workout routines with a focus on strength training and structured exercise programs.

### Key Features
- **User Authentication**: Supabase-powered auth with email/password and username support
- **Routine Management**: Create, edit, delete, and activate workout routines
- **Exercise Tracking**: Support for strength training exercises with sets, reps, and weight
- **Weekly Planning**: Day-by-day workout scheduling with rest day management
- **Modern UI**: Dark theme with glassmorphism effects and smooth animations
- **Cross-Platform**: Built with React Native for iOS and Android

## Technical Architecture

### Core Technologies
- **Framework**: React Native with Expo SDK 52
- **Backend**: Supabase (PostgreSQL database, authentication, edge functions)
- **Navigation**: React Navigation v7 (Stack + Bottom Tabs)
- **UI Components**: Custom components with glassmorphism design
- **Animation**: React Native Reanimated + Animated API
- **State Management**: React hooks (useState, useEffect)

### Project Structure
```
/Users/matt/Workouts/
├── App.js                      # Main app entry point with navigation setup
├── app.json                    # Expo configuration
├── package.json                # Dependencies and scripts
├── metro.config.js             # Metro bundler config (Node.js polyfills)
├── components/                 # Reusable UI components
│   ├── AppHeader.js           # Consistent header component
│   ├── LiquidGlassTabBar.js   # Custom glassmorphism tab bar
│   ├── RoutineEditorScreen.js # Routine creation/editing interface
│   ├── AddStrengthExerciseModal.js
│   ├── ExerciseTypeModal.js
│   └── NewRoutineScreen.js
├── screens/                    # Main app screens
│   ├── AuthScreen.js          # Authentication wrapper
│   ├── LoginScreen.js         # User login
│   ├── SignupScreen.js        # User registration
│   ├── RoutinesScreen.js      # Routine management
│   └── SettingsScreen.js      # App settings and account management
├── lib/                       # Utility libraries
│   └── supabaseClient.js     # Supabase configuration
├── styles/                    # Global styling system
│   └── globalStyles.js       # Colors, typography, spacing constants
└── assets/                    # App icons and images
```

## Database Schema (Supabase)

### Tables
1. **routines**
   - `id` (uuid, primary key)
   - `name` (text)
   - `user_id` (uuid, foreign key to auth.users)
   - `training_days` (integer)
   - `rest_days` (integer)  
   - `is_active` (boolean)
   - `created_at` (timestamp)

2. **exercises**
   - `id` (uuid, primary key)
   - `routine_id` (uuid, foreign key to routines)
   - `user_id` (uuid, foreign key to auth.users)
   - `name` (text)
   - `sets` (integer)
   - `reps` (integer)
   - `weight` (integer)
   - `day` (text) - day of week
   - `type` (text) - 'strength' or 'cardio'
   - `created_at` (timestamp)

### Authentication
- Uses Supabase Auth with email/password
- User metadata stores username
- Row Level Security (RLS) policies protect user data

## Current Implementation Status

### ✅ Completed Features
1. **Authentication System**
   - Email/password signup and login
   - Username support in user metadata
   - Auto-login after successful signup
   - Logout functionality
   - Account deletion with confirmation

2. **Routine Management**
   - Create new routines with custom names
   - Edit existing routines (name, exercises, schedule)
   - Delete routines with confirmation
   - Set active routine (only one active at a time)
   - Automatic routine syncing with Supabase

3. **Exercise Management**
   - Add strength exercises with sets/reps/weight
   - Edit existing exercises
   - Remove exercises with confirmation
   - Day-specific exercise assignment
   - Exercise type selection (strength/cardio)

4. **UI/UX**
   - Dark theme with consistent color scheme
   - Custom glassmorphism tab bar with blur effects
   - Swipe-to-delete for routines
   - Loading states and error handling
   - Responsive design for different screen sizes

5. **Data Persistence**
   - Real-time sync with Supabase
   - Optimistic updates for better UX
   - Proper error handling and rollback

### 🔄 In Progress / Needs Attention

1. **Exercise Completion Tracking** (`App.js:104-127`)
   - `toggleExerciseCompletion` function exists but only updates local state
   - TODO comment indicates Supabase integration needed
   - `isCompleted` field not in database schema yet

2. **Personal Records (PR) Tracking** (`App.js:129-147`)
   - `setPR` function exists but only updates local state
   - TODO comment indicates Supabase integration needed
   - `isPR` field not in database schema yet

3. **Settings Screen Features** (`screens/SettingsScreen.js`)
   - Data export function incomplete (references undefined `routines` variable)
   - Import functionality shows placeholder message
   - Data reset function references AsyncStorage instead of Supabase

### ❌ Missing Features

1. **Workout Progress Tracking**
   - No history of completed workouts
   - No progress visualization/charts
   - No workout session tracking

2. **Enhanced Exercise Types**
   - Cardio exercises partially implemented
   - No time-based exercises
   - No bodyweight exercises

3. **Social Features**
   - No workout sharing
   - No routine templates/community routines

4. **Advanced Features**
   - No workout reminders/notifications
   - No rest timer
   - No exercise instructions/videos

## Key Files Deep Dive

### App.js (Main Application)
- **Lines 1-55**: Imports and constants
- **Lines 56-301**: MainApp component with home screen logic
- **Lines 104-147**: TODO items for exercise completion and PR tracking
- **Lines 443-611**: Main app component with auth and data fetching
- **Lines 957-1068**: WeekView component for weekly routine overview

### components/RoutineEditorScreen.js (Routine Editor)
- **Lines 39-184**: State initialization and exercise management
- **Lines 185-560**: Exercise modal handling and saving logic
- **Lines 612-764**: Save routine validation and Supabase integration
- **Lines 821-1109**: UI rendering with day cards and exercise lists

### screens/RoutinesScreen.js (Routine Management)
- **Lines 27-562**: Main routine management logic
- **Lines 100-135**: Delete routine functionality
- **Lines 243-439**: Save/update routine with Supabase integration
- **Lines 447-516**: Routine list rendering with swipe actions

## Development Commands

```bash
# Start development server
npm start

# Platform-specific development
npm run ios
npm run android
npm run web

# Install new dependencies
npm install <package-name>
```

## Environment Setup

### Required Environment Variables
- Supabase URL and anon key are hardcoded in `lib/supabaseClient.js`
- In production, these should be moved to environment variables

### Dependencies
- Core: React Native 0.76.9, Expo 52.0.37
- Backend: @supabase/supabase-js 2.49.4
- Navigation: @react-navigation/* v7
- UI: expo-blur, react-native-reanimated, react-native-gesture-handler
- Auth: @react-native-firebase/* for additional auth options

## Known Issues & Technical Debt

1. **Data Export Bug** (`screens/SettingsScreen.js:89-94`)
   - References undefined `routines` variable
   - Should receive routines as prop or fetch from Supabase

2. **Incomplete Exercise Tracking**
   - Exercise completion and PR features need database schema updates
   - Local state updates need Supabase persistence

3. **Error Handling**
   - Some Supabase operations lack comprehensive error handling
   - Network connectivity issues not fully addressed

4. **Performance**
   - Could benefit from React.memo optimization in exercise lists
   - Image loading and caching not implemented

## Next Steps & Recommendations

### Immediate Priorities (Week 1-2)
1. **Fix Data Export**: Update SettingsScreen to properly access routines data
2. **Implement Exercise Completion**: Add `isCompleted` field to database and complete Supabase integration
3. **Implement PR Tracking**: Add `isPR` field to database and complete Supabase integration

### Short-term Goals (Month 1)
1. **Workout Sessions**: Create session tracking system
2. **Progress Visualization**: Add charts/graphs for workout progress
3. **Exercise Library**: Expand exercise types and add instructions
4. **Offline Support**: Add local storage fallback for poor connectivity

### Long-term Vision (Months 2-3)
1. **Social Features**: Routine sharing and community templates
2. **Advanced Analytics**: Detailed progress tracking and insights
3. **Notifications**: Workout reminders and achievement notifications
4. **Integrations**: Health app sync, wearable device support

## Code Quality Notes

### Strengths
- Well-organized component structure
- Consistent styling system with globalStyles.js
- Good separation of concerns between UI and business logic
- Comprehensive prop validation and error handling in most areas
- Clean navigation structure

### Areas for Improvement
- Add TypeScript for better type safety
- Implement unit tests for critical functions
- Add loading skeletons for better UX
- Optimize bundle size (currently includes many dependencies)
- Add accessibility features for better inclusivity

## Git Status
- **Modified Files**: App.js, app.json, RoutineEditorScreen.js, supabaseClient.js, package files, screens
- **Untracked Files**: LiquidGlassTabBar.js, metro.config.js
- **Recent Commits**: Initial project setup

---

*Last Updated: August 22, 2025*
*Generated by Claude Code for systematic project tracking*