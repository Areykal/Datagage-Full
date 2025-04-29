<template>
  <div class="notification-container">
    <div class="notifications-wrapper">
      <ToastNotification
        v-for="notification in notifications"
        :key="notification.id"
        :notification="notification"
        @close="removeNotification"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useNotificationStore } from '@/stores/notificationStore';
import ToastNotification from '@/components/ToastNotification.vue';

const notificationStore = useNotificationStore();

const notifications = computed(() => notificationStore.notifications);

const removeNotification = (id) => {
  // Use the correct method name from the notification store
  notificationStore.remove(id);
};
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 64px; /* Adjust based on your app bar height */
  right: 16px;
  z-index: 1000;
  width: 350px;
  pointer-events: none; /* Allow clicking through the container */
}

.notifications-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Make individual notifications clickable */
:deep(.toast-notification) {
  pointer-events: auto;
}
</style>
