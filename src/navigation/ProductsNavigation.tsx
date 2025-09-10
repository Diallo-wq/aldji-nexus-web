import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ProductsScreen } from '../screens/ProductsScreen';
import { AddEditProductScreen } from '../screens/AddEditProductScreen';

// Type pour la navigation des produits
export type ProductsStackParamList = {
  ProductsList: undefined;
  AddEditProduct: { productId?: string };
};

const Stack = createStackNavigator<ProductsStackParamList>();

export const ProductsNavigation: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ProductsList" component={ProductsScreen} />
      <Stack.Screen name="AddEditProduct" component={AddEditProductScreen} />
    </Stack.Navigator>
  );
};