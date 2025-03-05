<template>
  <v-app theme="dark">
    <AppBar v-if="isAuthenticated" @toggle-drawer="drawer = !drawer" />

    <MainNavigation
      v-if="isAuthenticated"
      v-model:drawer="drawer"
      v-model:rail="rail"
    />

    <v-main>
      <v-container
        :class="[
          'pa-4',
          isAuthenticated ? 'ml-auto mr-4' : 'mx-auto',
          rail ? 'app-container--rail' : '',
          drawer ? 'app-container--drawer' : '',
        ]"
      >
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </v-container>
    </v-main>

    <v-footer v-if="!isAuthenticated" app class="d-flex flex-column">
      <div class="px-4 py-2 text-center w-100">
        <span class="text-caption text-grey">
          &copy; {{ new Date().getFullYear() }} Datagage - Your data integration
          platform
        </span>
      </div>
    </v-footer>

    <!-- Notification display component -->
    <NotificationDisplay />
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { auth } from "@/utils/auth";
import AppBar from "@/components/AppBar.vue";
import MainNavigation from "@/components/MainNavigation.vue";
import NotificationDisplay from "@/components/NotificationDisplay.vue";

// Log that app is mounting for debugging
console.log("[App] App component mounting");

// Authentication state
const isAuthenticated = computed(() => auth.isAuthenticated());

// Navigation state
const drawer = ref(true);
const rail = ref(false);

// Handle route changes
const route = useRoute();
watch(
  () => route.path,
  () => {
    // Close drawer on navigation in mobile view
    if (window.innerWidth < 960) {
      drawer.value = false;
    }
  }
);

// Initialize theme from localStorage
onMounted(() => {
  const theme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", theme);
});
</script>

<style>
/* Global styles */
:root {
  --primary-color: #2979ff;
  --primary-color-soft: rgba(41, 121, 255, 0.1);
  --secondary-color: #ff6e40;

  --background-color: #121212;
  --surface-color: #1e1e1e;
  --dark-surface: #252525;
  --dark-border: #333;

  --text-primary-color: rgba(255, 255, 255, 0.87);
  --text-secondary-color: rgba(255, 255, 255, 0.6);

  --border-color: #333;
}

body {
  font-family: "Inter", sans-serif;
  background-color: var(--background-color);
  color: var(--text-primary-color);
  transition: background-color 0.3s ease;
}

/* Container responsive adjustments */
.app-container--drawer {
  max-width: calc(100% - 260px) !important;
}

.app-container--rail {
  max-width: calc(100% - 56px) !important;
}

@media (max-width: 960px) {
  .app-container--drawer,
  .app-container--rail {
    max-width: 100% !important;
  }
}

/* Page transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
