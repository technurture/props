"use client";
import { configureStore } from '@reduxjs/toolkit';
import sidebarSlice from './sidebarSlice';
import themeReducer from './themeSlice';

// Create store with proper SSR handling
export const makeStore = () => {
  return configureStore({
    reducer: {
      sidebarSlice: sidebarSlice,
      theme: themeReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        },
      }),
  });
};

// Create the store
const store = makeStore();

// Types for RootState and AppDispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks for useDispatch and useSelector
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;





