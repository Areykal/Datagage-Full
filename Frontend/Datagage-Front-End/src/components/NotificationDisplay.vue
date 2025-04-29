<template>
  <div class="notification-container">
    <v-snackbar
      v-model="isVisible"
      :color="notificationType"
      :timeout="timeout"
      location="top right"
    >
      {{ message }}

      <template v-slot:actions>
        <v-btn icon @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { computed, watch } from "vue";
import { useNotificationStore } from "@/stores/notificationStore";

// Initialize the store
const notificationStore = useNotificationStore();

// Map notification types to Vuetify colors
const typeToColor = {
  success: "success",
  error: "error",
  info: "info",
  warning: "warning",
};

// Default timeout in ms
const timeout = 5000;

// Computed properties
const isVisible = computed({
  get: () => !!notificationStore.notification,
  set: (value) => {
    if (!value) notificationStore.clear();
  },
});

const message = computed(() =>
  notificationStore.notification ? notificationStore.notification.message : ""
);

const notificationType = computed(() => {
  if (!notificationStore.notification) return "info";
  const type = notificationStore.notification.type || "info";
  return typeToColor[type] || "info";
});

// Methods
function close() {
  notificationStore.clear();
}

// For debugging - log when notification changes
watch(
  () => notificationStore.notification,
  (newVal) => {
    console.log("[NotificationDisplay] Notification changed:", newVal);
  },
  { deep: true }
);
</script>

<style scoped>
.notification-container {
  position: fixed;
  z-index: 1000;
}
</style>
