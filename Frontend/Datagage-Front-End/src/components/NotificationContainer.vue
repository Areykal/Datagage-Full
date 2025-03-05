<template>
  <div class="notification-container" aria-live="polite" aria-atomic="true">
    <TransitionGroup name="toast" tag="div">
      <ToastNotification
        v-for="notification in notificationStore.notifications"
        :key="notification.id"
        v-bind="notification"
        :class="[notification.position || 'top-right']"
      />
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useNotificationStore } from "@/stores/notification";
import ToastNotification from "@/components/ToastNotification.vue";

const notificationStore = useNotificationStore();
</script>

<style scoped>
.notification-container {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  overflow: hidden;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateY(-30px);
  opacity: 0;
}

.toast-leave-to {
  opacity: 0;
}

/* Position variants */
:deep(.top-right) {
  position: fixed;
  top: 20px;
  right: 20px;
}

:deep(.top-left) {
  position: fixed;
  top: 20px;
  left: 20px;
}

:deep(.bottom-right) {
  position: fixed;
  bottom: 20px;
  right: 20px;
}

:deep(.bottom-left) {
  position: fixed;
  bottom: 20px;
  left: 20px;
}

:deep(.top-center) {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
}

:deep(.bottom-center) {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
}
</style>
