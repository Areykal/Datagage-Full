<template>
  <v-app>
    <!-- Single sidebar navigation -->
    <v-navigation-drawer
      v-model="drawer"
      app
      :width="260"
      :rail-width="56"
      :rail="rail"
      @update:rail="rail = $event"
      class="primary-navigation"
    >
      <div class="pa-4 d-flex justify-center">
        <Logo :icon-only="rail" />
      </div>

      <v-divider class="mb-2"></v-divider>

      <v-list nav>
        <v-list-item
          v-for="item in navigationItems"
          :key="item.title"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="rail ? '' : item.title"
          :value="item.title"
          rounded="lg"
        ></v-list-item>

        <!-- NEW: Dark Mode Toggle -->
        <v-list-item
          :prepend-icon="isDark ? 'mdi-weather-night' : 'mdi-weather-sunny'"
          :title="rail ? '' : 'Toggle Theme'"
          @click="toggleTheme"
          rounded="lg"
        >
          <template v-slot:append v-if="!rail">
            <v-switch
              :model-value="isDark"
              @click.stop="toggleTheme" 
              hide-details
              inset
              color="primary"
            ></v-switch>
          </template>
        </v-list-item>
      </v-list>

      <template v-slot:append>
        <div class="pa-2">
          <v-btn
            v-if="!rail"
            block
            color="primary"
            @click="redirectToAirbyte" 
            prepend-icon="mdi-plus"
          >
            Add Data Source
          </v-btn>
          <v-btn v-else icon="mdi-plus" color="primary" @click="redirectToAirbyte"></v-btn>
        </div>

        <v-divider></v-divider>

        <div class="px-2 py-3">
          <v-btn
            block
            variant="text"
            :icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
            @click="rail = !rail"
          >
            {{ rail ? '' : 'Collapse' }}
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- App bar -->
    <v-app-bar app elevation="1">
      <v-app-bar-nav-icon 
        class="d-lg-none"
        @click="drawer = !drawer"
      ></v-app-bar-nav-icon>
      
      <v-toolbar-title>
        <span class="text-h6">{{ currentPageTitle }}</span>
      </v-toolbar-title>
      
      <v-spacer></v-spacer>
      
      <Profile />
    </v-app-bar>

    <v-main>
      <NotificationContainer />
      <v-container fluid class="pa-6">
        <router-view></router-view>  
      </v-container>
    </v-main>

    <v-footer app class="text-center d-flex flex-column">
      <div>© {{ new Date().getFullYear() }} Datagage - Your data integration platform</div>
    </v-footer>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useTheme } from 'vuetify'; // Import useTheme
import Logo from '@/components/Logo.vue';
import Profile from '@/components/Profile.vue';
import NotificationContainer from '@/components/NotificationContainer.vue';

const route = useRoute();
const drawer = ref(true);
const rail = ref(false);
const theme = useTheme(); // Initialize theme

// Navigation items - REMOVED Settings
const navigationItems = [
  {
    title: 'Dashboard',
    icon: 'mdi-view-dashboard',
    to: '/',
  },
  {
    title: 'Data Sources',
    icon: 'mdi-database',
    to: '/sources',
  },  {
    title: 'Analytics',
    icon: 'mdi-chart-bar',
    to: '/analytics',
  },
  // Settings removed
];

// NEW: Computed property for dark mode state
const isDark = computed(() => theme.global.current.value.dark);

// NEW: Method to toggle theme
const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark';
};

// NEW: Method to redirect to external Airbyte URL
const redirectToAirbyte = () => {
  window.location.href = 'http://localhost:8000/workspaces/eb09b0c2-fe1b-4f53-9054-64903c0245f4/connections';
};

// Get current page title from route meta
const currentPageTitle = computed(() => {
  return route.meta.title || 'Datagage';
});
</script>

<style scoped>
.primary-navigation {
  border-right: 1px solid rgba(255, 255, 255, 0.12);
}
</style>
