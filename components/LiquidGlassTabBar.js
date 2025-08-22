import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

const { width: screenWidth } = Dimensions.get('window');

const LiquidGlassTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  // Check if any route has tabBarStyle with display: 'none'
  const shouldHide = state.routes.some((route, index) => {
    const { options } = descriptors[route.key];
    const hasHideStyle = options.tabBarStyle?.display === 'none';
    if (hasHideStyle) {
      console.log('Tab bar should be hidden for route:', route.name);
    }
    return hasHideStyle;
  });

  console.log('LiquidGlassTabBar shouldHide:', shouldHide);

  // If tab bar should be hidden, return null
  if (shouldHide) {
    console.log('Hiding tab bar');
    return null;
  }

  const getIconName = (routeName, focused) => {
    switch (routeName) {
      case 'Home':
        return focused ? 'home' : 'home-outline';
      case 'Routines':
        return focused ? 'list' : 'list-outline';
      case 'Settings':
        return focused ? 'settings' : 'settings-outline';
      default:
        return 'circle-outline';
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Background blur effect */}
      <BlurView
        intensity={80}
        tint="systemMaterialDark"
        style={styles.blurContainer}
      >
        {/* Liquid glass overlay */}
        <View style={styles.glassOverlay} />
        
        {/* Tab items */}
        <View style={styles.tabContainer}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel !== undefined 
              ? options.tabBarLabel 
              : options.title !== undefined 
              ? options.title 
              : route.name;

            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                {/* Active tab indicator */}
                {isFocused && (
                  <View style={styles.activeIndicator}>
                    <BlurView
                      intensity={60}
                      tint="light"
                      style={styles.activeIndicatorBlur}
                    />
                  </View>
                )}
                
                {/* Icon */}
                <Ionicons
                  name={getIconName(route.name, isFocused)}
                  size={24}
                  color={isFocused ? '#FFFFFF' : '#FFFFFF80'}
                  style={styles.icon}
                />
                
                {/* Label */}
                <Text
                  style={[
                    styles.label,
                    {
                      color: isFocused ? '#FFFFFF' : '#FFFFFF80',
                      fontWeight: isFocused ? '600' : '400',
                    },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  blurContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 25,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    minHeight: 70,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    position: 'relative',
  },
  activeIndicator: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    overflow: 'hidden',
  },
  activeIndicatorBlur: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  icon: {
    marginBottom: 4,
    zIndex: 1,
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
    zIndex: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});

export default LiquidGlassTabBar; 