import React, { useContext } from 'react';
import { ActivityIndicator, View, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, FolderGit2, CheckSquare, DollarSign, Users, LogOut, Truck } from 'lucide-react-native';
import { colors } from '../theme';

import { AuthContext } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import ProjectDetailsScreen from '../screens/ProjectDetailsScreen';
import TasksScreen from '../screens/TasksScreen';
import FinanceScreen from '../screens/FinanceScreen';
import EmployeesScreen from '../screens/EmployeesScreen';
import VendorsScreen from '../screens/VendorsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const ProjectStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProjectList" component={ProjectsScreen} />
    <Stack.Screen name="ProjectDetails" component={ProjectDetailsScreen} />
  </Stack.Navigator>
);

function MainTabs() {
  const { logout, user } = useContext(AuthContext);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 78,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '800',
        },
        headerRight: () => (
          <TouchableOpacity
            onPress={logout}
            style={{
              marginRight: 16,
              width: 40,
              height: 40,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.dangerSoft,
            }}
          >
            <LogOut color={colors.danger} size={18} />
          </TouchableOpacity>
        ),
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color }) => <Home color={color} size={22} />,
          title: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="Projects"
        component={ProjectStack}
        options={{
          tabBarIcon: ({ color }) => <FolderGit2 color={color} size={22} />,
          title: 'Projects',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          tabBarIcon: ({ color }) => <CheckSquare color={color} size={22} />,
          title: 'Tasks',
        }}
      />

      {user?.role === 'admin' && (
        <>
          <Tab.Screen
            name="Finance"
            component={FinanceScreen}
            options={{
              tabBarIcon: ({ color }) => <DollarSign color={color} size={22} />,
              title: 'Finance',
            }}
          />
          <Tab.Screen
            name="Vendors"
            component={VendorsScreen}
            options={{
              tabBarIcon: ({ color }) => <Truck color={color} size={22} />,
              title: 'Vendors',
            }}
          />
          <Tab.Screen
            name="Employees"
            component={EmployeesScreen}
            options={{
              tabBarIcon: ({ color }) => <Users color={color} size={22} />,
              title: 'Employees',
            }}
          />
        </>
      )}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isLoading, userToken } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken !== null ? (
          <Stack.Screen name="Root" component={MainTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
