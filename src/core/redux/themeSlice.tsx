"use client";
import { createSlice } from "@reduxjs/toolkit";


const defaultThemeSettings = {
  "data-bs-theme": "light",
  "data-sidebar": "light",
  "data-color": "primary",
  "data-topbar": "white",
  "data-layout": "default",
  "data-size": "default",
  "data-width": "fluid",
  "data-sidebarbg": "none",
  "dir": "ltr",
};

// Helper function to safely get theme settings from localStorage
const getInitialThemeSettings = () => {
  if (typeof window === "undefined") {
    return defaultThemeSettings;
  }
  
  try {
    const stored = localStorage.getItem("themeSettings");
    return stored ? JSON.parse(stored) : defaultThemeSettings;
  } catch (error) {
    console.warn("Failed to parse theme settings from localStorage:", error);
    return defaultThemeSettings;
  }
};

const initialState = {
  themeSettings: getInitialThemeSettings(),
};


const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    updateTheme: (state, { payload }) => {
      if (payload.dir === "rtl") {
        state.themeSettings = { ...defaultThemeSettings, dir: "rtl" };
      } else if (state.themeSettings.dir === "rtl" && payload.dir !== "rtl") {
        state.themeSettings = { ...defaultThemeSettings, ...payload, dir: "ltr" };
      } else {
        state.themeSettings = { ...state.themeSettings, ...payload };
      }

      // Safely update localStorage only on client side
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            "themeSettings",
            JSON.stringify(state.themeSettings)
          );
        } catch (error) {
          console.warn("Failed to save theme settings to localStorage:", error);
        }
      }
    },
    resetTheme: (state) => {
      state.themeSettings = defaultThemeSettings;
      
      // Safely remove from localStorage only on client side
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("themeSettings");
        } catch (error) {
          console.warn("Failed to remove theme settings from localStorage:", error);
        }
      }
    },
  },
});


export const { updateTheme, resetTheme } = themeSlice.actions;


export default themeSlice.reducer;





