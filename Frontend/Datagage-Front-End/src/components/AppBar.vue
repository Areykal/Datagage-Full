<template>
  <v-app-bar color="background" :elevation="0" border>
    <v-app-bar-nav-icon
      @click.stop="toggleDrawer"
      class="d-md-none"
    ></v-app-bar-nav-icon>

    <router-link to="/" class="text-decoration-none d-md-none">
      <Logo :small="isMobile" />
    </router-link>

    <!-- Show page title on desktop instead of logo -->
    <h2 class="text-h6 d-none d-md-flex">{{ currentPageTitle }}</h2>

    <v-spacer></v-spacer>

    <!-- Notifications -->
    <v-menu
      v-model="showNotifications"
      :close-on-content-click="false"
      location="bottom end"
      min-width="360"
    >
      <template v-slot:activator="{ props }">
        <v-badge
          :content="unreadNotifications"
          :model-value="unreadNotifications > 0"
          color="error"
          offset-x="3"
          offset-y="3"
        >
          <v-btn v-bind="props" icon="mdi-bell" variant="text"></v-btn>
        </v-badge>
      </template>

      <v-card>
        <v-card-title class="d-flex align-center">
          Notifications
          <v-spacer></v-spacer>
          <v-btn
            v-if="notifications.length"
            size="small"
            variant="text"
            @click="markAllAsRead"
          >
            Mark all as read
          </v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-list v-if="notifications.length" lines="two">
          <v-list-item
            v-for="notification in notifications"
            :key="notification.id"
            :subtitle="formatDate(notification.timestamp)"
            :active="!notification.read"
          >
            <template v-slot:prepend>
              <v-avatar :color="getNotificationColor(notification)" size="36">
                <v-icon :icon="getNotificationIcon(notification)"></v-icon>
              </v-avatar>
            </template>
            <v-list-item-title>{{ notification.title }}</v-list-item-title>
          </v-list-item>
        </v-list>

        <v-card-text v-else class="text-center py-4">
          <v-icon size="48" color="primary" class="mb-2"
            >mdi-bell-outline</v-icon
          >
          <div>No new notifications</div>
        </v-card-text>
      </v-card>
    </v-menu>

    <!-- User menu -->
    <v-menu location="bottom end">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" class="ml-2">
          <v-avatar size="32" color="primary" class="mr-2">
            <span class="text-caption">{{ userInitials }}</span>
          </v-avatar>
          <span v-if="!isMobile" class="d-none d-sm-flex">
            {{ user?.name || "User" }}
          </span>
          <v-icon end>mdi-chevron-down</v-icon>
        </v-btn>
      </template>

      <v-list>
        <v-list-item to="/settings" prepend-icon="mdi-account-cog">
          <v-list-item-title>Profile & Settings</v-list-item-title>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item @click="logout" prepend-icon="mdi-logout">
          <v-list-item-title>Logout</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-app-bar>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useDisplay } from "vuetify";
import { auth } from "@/utils/auth";
import { useNotificationStore } from "@/stores/notificationStore";
import { useRoute } from "vue-router";
import Logo from "@/components/Logo.vue";

const emit = defineEmits(["toggle-drawer"]);
const route = useRoute();

// Responsive display
const { mobile } = useDisplay();
const isMobile = computed(() => mobile.value);

// Current page title based on route
const currentPageTitle = computed(() => {
  const routeMap = {
    "/": "Dashboard",
    "/sources": "Data Sources",
    "/analytics": "Analytics",
    "/settings": "Settings",
  };
  return routeMap[route.path] || route.name || "";
});

// User data
const user = computed(() => auth.getUser());
const userInitials = computed(() => {
  if (!user.value?.name) return "U";
  return user.value.name
    .split(" ")
    .map((n) => n[0])
    .join("");
});

// Drawer control
const toggleDrawer = () => {
  emit("toggle-drawer");
};

// Notification system
const notificationStore = useNotificationStore();
const showNotifications = ref(false);

const notifications = computed(() => notificationStore.notifications);
const unreadNotifications = computed(() => notificationStore.unread);

// Notification helpers
const getNotificationColor = (notification) => {
  const typeColors = {
    success: "success",
    error: "error",
    warning: "warning",
    info: "info",
  };
  return typeColors[notification.type] || "primary";
};

const getNotificationIcon = (notification) => {
  const typeIcons = {
    success: "mdi-check-circle",
    error: "mdi-alert-circle",
    warning: "mdi-alert",
    info: "mdi-information",
  };
  return typeIcons[notification.type] || "mdi-bell";
};

const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleString();
};

const markAllAsRead = () => {
  notificationStore.markAllAsRead();
};

// Logout handler
const logout = () => {
  auth.logout();
};

// Add some demo notifications on mount
onMounted(() => {
  // Add welcome notification
  notificationStore.add({
    title: "Welcome to Datagage",
    message: "Your data integration platform is ready!",
    type: "info",
  });

  // Add system notification
  setTimeout(() => {
    notificationStore.add({
      title: "System Update",
      message: "New features are available",
      type: "success",
    });
  }, 2000);
});
</script>

<style scoped>
/* Add any custom styling here */
</style>
