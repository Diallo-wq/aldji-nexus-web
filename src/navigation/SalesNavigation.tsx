import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SalesScreen } from '../screens/SalesScreen';
import { AddEditSaleScreen } from '../screens/AddEditSaleScreen';

// Type pour la navigation des ventes
export type SalesStackParamList = {
  SalesList: undefined;
  AddEditSale: { saleId?: string };
};

const Stack = createStackNavigator<SalesStackParamList>();

export const SalesNavigation: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="SalesList" component={SalesScreen} />
      <Stack.Screen name="AddEditSale" component={AddEditSaleScreen} />
    </Stack.Navigator>
  );
};