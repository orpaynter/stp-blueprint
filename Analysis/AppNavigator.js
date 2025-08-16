import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useAuth } from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../config/theme';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Main Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ProjectsScreen from '../screens/projects/ProjectsScreen';
import ProjectDetailScreen from '../screens/projects/ProjectDetailScreen';
import AssessmentsScreen from '../screens/assessments/AssessmentsScreen';
import AssessmentDetailScreen from '../screens/assessments/AssessmentDetailScreen';
import CameraScreen from '../screens/assessments/CameraScreen';
import ClaimsScreen from '../screens/claims/ClaimsScreen';
import ClaimDetailScreen from '../screens/claims/ClaimDetailScreen';
import PaymentsScreen from '../screens/payments/PaymentsScreen';
import PaymentDetailScreen from '../screens/payments/PaymentDetailScreen';
import MarketplaceScreen from '../screens/marketplace/MarketplaceScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import OfflineDataScreen from '../screens/offline/OfflineDataScreen';

// Create navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// Auth Navigator
const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{ title: 'Create Account' }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen} 
        options={{ title: 'Reset Password' }}
      />
    </Stack.Navigator>
  );
};

// Projects Stack Navigator
const ProjectsStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="ProjectsList" 
        component={ProjectsScreen} 
        options={{ title: 'Projects' }}
      />
      <Stack.Screen 
        name="ProjectDetail" 
        component={ProjectDetailScreen} 
        options={({ route }) => ({ title: route.params?.title || 'Project Details' })}
      />
    </Stack.Navigator>
  );
};

// Assessments Stack Navigator
const AssessmentsStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="AssessmentsList" 
        component={AssessmentsScreen} 
        options={{ title: 'Assessments' }}
      />
      <Stack.Screen 
        name="AssessmentDetail" 
        component={AssessmentDetailScreen} 
        options={{ title: 'Assessment Details' }}
      />
      <Stack.Screen 
        name="Camera" 
        component={CameraScreen} 
        options={{ title: 'Capture Damage', headerShown: false }}
      />
    </Stack.Navigator>
  );
};

// Claims Stack Navigator
const ClaimsStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="ClaimsList" 
        component={ClaimsScreen} 
        options={{ title: 'Claims' }}
      />
      <Stack.Screen 
        name="ClaimDetail" 
        component={ClaimDetailScreen} 
        options={{ title: 'Claim Details' }}
      />
    </Stack.Navigator>
  );
};

// Payments Stack Navigator
const PaymentsStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="PaymentsList" 
        component={PaymentsScreen} 
        options={{ title: 'Payments' }}
      />
      <Stack.Screen 
        name="PaymentDetail" 
        component={PaymentDetailScreen} 
        options={{ title: 'Payment Details' }}
      />
    </Stack.Navigator>
  );
};

// Main Tab Navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.disabled,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e2e8f0',
          paddingBottom: 5,
          paddingTop: 5,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Projects" 
        component={ProjectsStackNavigator} 
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="clipboard-list" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Assessments" 
        component={AssessmentsStackNavigator} 
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="home-roof" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Claims" 
        component={ClaimsStackNavigator} 
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="file-document" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="More" 
        component={DrawerNavigator} 
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="dots-horizontal" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Drawer Navigator
const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.text,
      }}
    >
      <Drawer.Screen 
        name="Payments" 
        component={PaymentsStackNavigator} 
        options={{
          headerShown: false,
          drawerIcon: ({ color, size }) => (
            <Icon name="credit-card" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Marketplace" 
        component={MarketplaceScreen} 
        options={{
          drawerIcon: ({ color, size }) => (
            <Icon name="store" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          drawerIcon: ({ color, size }) => (
            <Icon name="account" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
        options={{
          drawerIcon: ({ color, size }) => (
            <Icon name="bell" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Offline Data" 
        component={OfflineDataScreen} 
        options={{
          drawerIcon: ({ color, size }) => (
            <Icon name="cloud-off-outline" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{
          drawerIcon: ({ color, size }) => (
            <Icon name="cog" color={color} size={size} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

// Root Navigator
const AppNavigator = () => {
  const { userToken, isLoading } = useAuth();
  
  if (isLoading) {
    // We could show a splash screen here
    return null;
  }
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {userToken ? (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
