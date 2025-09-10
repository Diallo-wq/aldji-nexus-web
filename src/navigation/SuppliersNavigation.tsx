import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SuppliersScreen } from '../screens/SuppliersScreen';
import { AddEditSupplierScreen } from '../screens/AddEditSupplierScreen';

export type SuppliersStackParamList = {
  SuppliersList: undefined;
  AddEditSupplier: { supplierId?: string };
};

const Stack = createStackNavigator<SuppliersStackParamList>();

export const SuppliersNavigation: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SuppliersList" component={SuppliersScreen} />
      <Stack.Screen name="AddEditSupplier" component={AddEditSupplierScreen} />
    </Stack.Navigator>
  );
};
