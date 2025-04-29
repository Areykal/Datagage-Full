/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Components
import App from "./App.vue";

// Composables
import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate"; // Import the plugin
import router from "./router";
import { notificationPlugin } from "@/utils/notifications";

import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";

import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { aliases, mdi } from "vuetify/iconsets/mdi";

import { setupErrorHandlers } from "./utils/errorHandler.js";

// Configure Vuetify
const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: "mdi",
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: "dark",
    themes: {
      dark: {
        dark: true,
        colors: {
          primary: "#2979FF",
          secondary: "#FF6E40",
          accent: "#FF4081",
          error: "#FF5252",
          info: "#2196F3",
          success: "#4CAF50",
          warning: "#FFC107",
        },
      },
      light: {
        dark: false,
        colors: {
          primary: "#1976D2",
          secondary: "#FF5722",
          accent: "#E91E63",
          error: "#F44336",
          info: "#2196F3",
          success: "#4CAF50",
          warning: "#FB8C00",
        },
      },
    },
  },
});

// Create app instance
const app = createApp(App);

// Create Pinia instance and add the plugin
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

// Install plugins
app.use(pinia); // Use the configured Pinia instance
app.use(router);
app.use(vuetify);
app.use(notificationPlugin);

// Set up global error handlers before mounting the app
setupErrorHandlers();

// Mount app
app.mount("#app");

// Log that the app is ready
console.log("Datagage application loaded successfully");
