<template>
  <v-app>
    <!-- Navigation drawer - Set permanent and remove rail mode -->
    <v-navigation-drawer
      permanent
      app
      :width="260"
      color="surface"
      class="persistent-drawer"
    >
      <v-list-item
        prepend-avatar="/logo.svg"
        title="Datagage"
        nav
        class="mt-2 mb-2"
      >
        <!-- Removed append slot with toggle button -->
      </v-list-item>

      <v-divider></v-divider>

      <v-list density="compact" nav>
        <v-list-item
          v-for="item in navItems"
          :key="item.title"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          rounded="lg"
          class="my-1"
        ></v-list-item>
      </v-list>

      <template v-slot:append>
        <div class="pa-2">
          <v-btn
            block
            color="primary"
            to="/sources/new"
            prepend-icon="mdi-plus"
          >
            New Source
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Main content area with adjusted padding -->
    <v-main class="content-with-drawer">
      <div class="pa-4">
        <slot></slot>
      </div>

      <!-- Toast notifications -->
      <transition-group name="toast">
        <toast-notification
          v-for="notification in notificationStore.notifications"
          :key="notification.id"
          v-bind="notification"
        />
      </transition-group>
    </v-main>
  </v-app>
</template>

<script setup>
import { onMounted } from "vue";
import { useNotificationStore } from "@/stores/notification"; // Fixed the import path
import ToastNotification from "@/components/ToastNotification.vue";

const notificationStore = useNotificationStore();

const navItems = [
  { title: "Dashboard", icon: "mdi-view-dashboard-outline", to: "/" },
  { title: "Data Sources", icon: "mdi-database-outline", to: "/sources" },
  { title: "Analytics", icon: "mdi-chart-box-outline", to: "/analytics" },
  { title: "Settings", icon: "mdi-cog-outline", to: "/settings" },
];

// Force drawer visibility on mount
onMounted(() => {
  const drawerElement = document.querySelector(".persistent-drawer");
  if (drawerElement) {
    drawerElement.style.zIndex = "100";
    drawerElement.style.visibility = "visible";
    drawerElement.style.transform = "translateX(0)";

    // Add custom style to ensure it's fixed in place
    drawerElement.style.position = "fixed";
    drawerElement.style.top = "0";
    drawerElement.style.left = "0";
    drawerElement.style.bottom = "0";
    drawerElement.style.height = "100vh";
  }
});
</script>

<style scoped>
/* Apply dedicated class for our persistent drawer */
.persistent-drawer {
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  height: 100vh !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  transform: translateX(0) !important;
  visibility: visible !important;
  display: flex !important;
  z-index: 100 !important;
}

/* Add padding to content to account for drawer width */
.content-with-drawer {
  padding-left: 260px !important; /* Match drawer width */
}

:deep(.v-list-item--active) {
  background: rgba(99, 102, 241, 0.15) !important;
}

:deep(.v-list-item--active .v-icon) {
  color: rgb(99, 102, 241) !important;
}

/* Media query for mobile - optional */
@media (max-width: 768px) {
  .content-with-drawer {
    padding-left: 260px !important; /* Keep the drawer visible even on mobile */
  }
}
</style>
