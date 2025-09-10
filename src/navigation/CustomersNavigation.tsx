import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { CustomersScreen } from '../screens/CustomersScreen';
import { AddEditCustomerScreen } from '../screens/AddEditCustomerScreen';

// Type pour la navigation des clients
export type CustomersStackParamList = {
  CustomersList: undefined;
  AddEditCustomer: { customerId?: string };
};

const Stack = createStackNavigator<CustomersStackParamList>();

export const CustomersNavigation: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="CustomersList" component={CustomersScreen} />
      <Stack.Screen name="AddEditCustomer" component={AddEditCustomerScreen} />
    </Stack.Navigator>
  );
};
