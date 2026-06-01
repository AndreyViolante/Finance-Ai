import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text} from 'react-native';

import DashboardScreen from '../screens/DashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import StatementScreen from '../screens/StatementScreen';

export type RootTabParamList = {
  Dashboard: undefined;
  Statement: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const ICONS: Record<string, string> = {
  Dashboard: '📊',
  Statement: '💳',
  Profile:   '👤',
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({route}) => ({
          tabBarIcon: () => (
            <Text style={{fontSize: 20}}>{ICONS[route.name]}</Text>
          ),
          tabBarActiveTintColor:   '#6C5CE7',
          tabBarInactiveTintColor: '#636e72',
          tabBarStyle: {
            backgroundColor: '#1a1a2e',
            borderTopColor:  '#2d2d44',
          },
          headerStyle:     {backgroundColor: '#1a1a2e'},
          headerTintColor: '#fff',
        })}>
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{title: 'Dashboard'}}
        />
        <Tab.Screen
          name="Statement"
          component={StatementScreen}
          options={{title: 'Extrato'}}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{title: 'Perfil'}}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
