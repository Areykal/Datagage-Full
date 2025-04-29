<template>
  <v-app-bar color="background" :elevation="0" border>
    <v-app-bar-nav-icon
      @click.stop="toggleDrawer"
      class="d-md-none"
    ></v-app-bar-nav-icon>

    <router-link to="/" class="text-decoration-none d-flex align-center">
      <Logo :small="true" />
      <span class="font-weight-medium text-h6 ml-2 d-none d-sm-block">Datagage</span>
    </router-link>

    <v-spacer></v-spacer>

    <!-- Search (optional) -->
    <v-btn icon="mdi-magnify" variant="text" class="mr-2"></v-btn>

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
        <v-card-title class="d-flex align-center pa-4">
          <span class="text-subtitle-1">Notifications</span>
          <v-spacer></v-spacer>
          <v-btn
            v-if="notifications.length"
            size="small"
            variant="text"
            density="comfortable"
            @click="markAllAsRead"
          >
            Mark all as read
          </v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-list v-if="notifications.length" class="notification-list" lines="two">
          <v-list-item
            v-for="(notification, index) in notifications"
            :key="index"
            :active="!notification.read"
            active-color="primary-lighten-4"
            class="notification-item py-2"
          >
            <template v-slot:prepend>
              <v-avatar
                :color="getNotificationColor(notification.type)"
                size="36"
              >
                <v-icon
                  :icon="getNotificationIcon(notification.type)"
                  color="white"
                  size="small"
                ></v-icon>
              </v-avatar>
            </template>

            <v-list-item-title>{{ notification.title }}</v-list-item-title>
            <v-list-item-subtitle>{{ notification.message }}</v-list-item-subtitle>
            <v-list-item-subtitle class="text-caption">
              {{ formatTime(notification.timestamp) }}
            </v-list-item-subtitle>

            <template v-slot:append>
              <v-btn
                icon="mdi-close"
                size="x-small"
                variant="text"
                @click.stop="dismissNotification(index)"
              ></v-btn>
            </template>
          </v-list-item>
        </v-list>

        <v-sheet v-else class="pa-6 d-flex flex-column align-center">
          <v-icon icon="mdi-bell-off" size="48" color="grey-lighten-1"></v-icon>
          <div class="text-body-1 mt-2">No notifications</div>
          <div class="text-caption text-medium-emphasis">You're all caught up!</div>
        </v-sheet>

        <v-divider></v-divider>
        <v-card-actions>
          <v-btn
            block
            variant="text"
            to="/settings/notifications"
            @click="showNotifications = false"
          >
            Manage Notifications
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>

    <!-- User Menu -->
    <v-menu location="bottom end" min-width="200">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" class="ml-2">
          <v-avatar size="32" color="primary" class="mr-2">
            <span class="text-white">{{ userInitials }}</span>
          </v-avatar>
          <span class="d-none d-md-block">{{ userName }}</span>
          <v-icon
            icon="mdi-chevron-down"
            size="small"
            class="ml-1"
          ></v-icon>
        </v-btn>
      </template>

      <v-card>
        <v-list density="comfortable">
          <v-list-item>
            <template v-slot:prepend>
              <v-avatar size="32" color="primary">
                <span class="text-white">{{ userInitials }}</span>
              </v-avatar>
            </template>
            <v-list-item-title>{{ userName }}</v-list-item-title>
            <v-list-item-subtitle>{{ userEmail }}</v-list-item-subtitle>
          </v-list-item>

          <v-divider class="my-2"></v-divider>

          <v-list-item to="/settings/profile" link prepend-icon="mdi-account-outline">
            Profile
          </v-list-item>
          <v-list-item to="/settings" link prepend-icon="mdi-cog-outline">
            Settings
          </v-list-item>
          <v-list-item link prepend-icon="mdi-help-circle-outline">
            Help & Support
          </v-list-item>

          <v-divider class="my-2"></v-divider>

          <v-list-item link prepend-icon="mdi-logout" @click="logout">
            Logout
          </v-list-item>
        </v-list>
      </v-card>
    </v-menu>
  </v-app-bar>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import Logo from "@/components/Logo.vue";
import { auth } from "@/utils/auth";

const router = useRouter();
const user = auth.getUser();
const showNotifications = ref(false);
const notifications = ref([
  {
    id: 1,
    title: "Sales Milestone",
    message: "Revenue goal reached for the month",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    read: false,
    type: "success"
  },
  {
    id: 2,
    title: "New Customer",
    message: "Tech Group Inc. just placed their first order",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false,
    type: "info"
  },
  {
    id: 3,
    title: "System Update",
    message: "New features have been added to the dashboard",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true,
    type: "system"
  }
]);

// Computed properties
const unreadNotifications = computed(() => {
  return notifications.value.filter(n => !n.read).length;
});

const userName = computed(() => {
  return user?.name || "Demo User";
});

const userEmail = computed(() => {
  return user?.email || "demo@datagage.com";
});

const userInitials = computed(() => {
  const name = userName.value;
  if (!name) return "U";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
});

// Methods
function toggleDrawer() {
  // Emit event to parent to toggle the drawer
  emit("toggle-drawer");
}

function dismissNotification(index) {
  notifications.value.splice(index, 1);
}

function markAllAsRead() {
  notifications.value = notifications.value.map(n => ({
    ...n,
    read: true
  }));
}

function formatTime(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMin = Math.round(diffMs / 60000);
  
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  
  const diffDays = Math.round(diffHr / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return new Date(date).toLocaleDateString();
}

function getNotificationColor(type) {
  switch (type) {
    case "success": return "success";
    case "warning": return "warning";
    case "error": return "error";
    case "info": return "info";
    case "system": return "primary";
    default: return "grey";
  }
}

function getNotificationIcon(type) {
  switch (type) {
    case "success": return "mdi-check-circle";
    case "warning": return "mdi-alert";
    case "error": return "mdi-alert-circle";
    case "info": return "mdi-information";
    case "system": return "mdi-cog";
    default: return "mdi-bell";
  }
}

function logout() {
  auth.logout();
  router.push("/login");
}

// Define emits
const emit = defineEmits(["toggle-drawer"]);
</script>

<style scoped>
.notification-list {
  max-height: 360px;
  overflow-y: auto;
}

.notification-item {
  cursor: default;
}
</style>
