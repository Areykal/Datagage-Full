<template>
  <v-app-bar elevation="1">
    <v-app-bar-title class="ml-2">
      <router-link to="/" class="text-decoration-none">
        <Logo />
      </router-link>
    </v-app-bar-title>

    <v-spacer></v-spacer>

    <v-btn
      v-for="item in navItems"
      :key="item.title"
      :to="item.path"
      variant="text"
      :active="route.path === item.path"
      :prepend-icon="item.icon"
    >
      {{ item.title }}
    </v-btn>

    <v-menu v-if="user" location="bottom end">
      <template v-slot:activator="{ props }">
        <div v-bind="props">
          <Profile :user="user" :showName="false" />
        </div>
      </template>
      <v-list>
        <v-list-item>
          <v-list-item-title class="text-subtitle-2">{{
            user.name
          }}</v-list-item-title>
          <v-list-item-subtitle>{{ user.email }}</v-list-item-subtitle>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item
          prepend-icon="mdi-account"
          title="Profile"
          to="/profile"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-cog"
          title="Settings"
          to="/settings"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-logout"
          title="Logout"
          @click="handleLogout"
        ></v-list-item>
      </v-list>
    </v-menu>
  </v-app-bar>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useUiStore } from "@/stores/uiStore";
import { auth } from "@/utils/auth";
import { useRouter, useRoute } from "vue-router";
import Profile from "@/components/Profile.vue";
import Logo from "@/components/Logo.vue";

// Use the UI store for state management
const uiStore = useUiStore();
const router = useRouter();
const route = useRoute();

// Get current user
const user = computed(() => auth.getUser());

// Local reactive refs for better control
const isOpen = ref(true);
const isRail = computed(() => !isOpen.value);

// Sync with store state
watch(
  () => uiStore.navDrawerOpen,
  (newVal) => {
    isOpen.value = newVal;
  }
);

watch(isOpen, (newVal) => {
  uiStore.setNavDrawerOpen(newVal);
});

// Toggle drawer state with manual control
const toggleDrawer = () => {
  isOpen.value = !isOpen.value;
};

// Handle logout
const handleLogout = () => {
  auth.logout();
};

// Initialize from stored value on mount
onMounted(() => {
  // Force a re-render by briefly setting to null then to the stored value
  const storedValue = localStorage.getItem("nav_drawer_state") === "true";
  isOpen.value = storedValue;

  // Ensure the drawer is visible by forcing permanent attribute
  setTimeout(() => {
    const drawer = document.querySelector(".navigation-drawer");
    if (drawer) {
      drawer.setAttribute("aria-hidden", "false");
    }
  }, 100);
});

const navItems = ref([
  { title: "Dashboard", path: "/", icon: "mdi-view-dashboard" },
  { title: "Sources", path: "/sources", icon: "mdi-database" },
  { title: "Analytics", path: "/analytics", icon: "mdi-chart-bar" },
]);
</script>

<style scoped>
.navigation-container {
  position: relative;
  height: 100%;
}

.navigation-drawer {
  background-color: var(--dark-surface) !important;
  border-right: 1px solid var(--dark-border) !important;
  color: var(--text-primary-color) !important;
}

.logo-container {
  min-height: 56px;
}

.nav-title {
  background: linear-gradient(45deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  background-clip: border-box;
  -webkit-text-fill-color: transparent;
}

.nav-item {
  transition: all 0.2s ease;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.v-list-item--active {
  background: rgba(99, 102, 241, 0.15) !important;
}

.v-list-item--active .v-icon {
  color: rgb(99, 102, 241) !important;
}
</style>
