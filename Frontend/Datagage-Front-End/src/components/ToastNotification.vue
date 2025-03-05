<template>
  <div
    class="toast-notification"
    :class="type"
    role="alert"
    aria-live="assertive"
    @mouseenter="pauseTimer"
    @mouseleave="resumeTimer"
  >
    <div class="toast-content">
      <v-icon :icon="getIcon" class="mr-2"></v-icon>
      <div class="toast-text">
        <strong v-if="title" class="toast-title">{{ title }}</strong>
        <span>{{ message }}</span>
      </div>
    </div>
    <v-btn
      icon
      size="small"
      @click="dismiss"
      class="toast-close"
      aria-label="Close notification"
    >
      <v-icon>mdi-close</v-icon>
    </v-btn>
    <div v-if="duration > 0" class="toast-progress">
      <div class="toast-progress-bar" :style="progressStyle"></div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { useNotificationStore } from "@/stores/notification";

const props = defineProps({
  id: {
    type: Number,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "info",
  },
  position: {
    type: String,
    default: "top-right",
  },
  duration: {
    type: Number,
    default: 5000, // 5 seconds by default
  },
});

const notificationStore = useNotificationStore();
let timeout = null;
let startTime = 0;
let remainingTime = ref(props.duration);
const isPaused = ref(false);

const getIcon = computed(() => {
  const icons = {
    success: "mdi-check-circle",
    error: "mdi-alert-circle",
    warning: "mdi-alert",
    info: "mdi-information",
  };
  return icons[props.type] || icons.info;
});

const progressStyle = computed(() => ({
  width: `${((props.duration - remainingTime.value) / props.duration) * 100}%`,
}));

const dismiss = () => {
  clearTimeout(timeout);
  notificationStore.dismiss(props.id);
};

const pauseTimer = () => {
  if (props.duration > 0) {
    isPaused.value = true;
    clearTimeout(timeout);
    remainingTime.value = props.duration - (Date.now() - startTime);
  }
};

const resumeTimer = () => {
  if (props.duration > 0 && isPaused.value) {
    isPaused.value = false;
    startAutoClose();
  }
};

const startAutoClose = () => {
  if (props.duration > 0) {
    startTime = Date.now();
    timeout = setTimeout(() => {
      dismiss();
    }, remainingTime.value);
  }
};

onMounted(() => {
  remainingTime.value = props.duration;
  if (props.duration > 0) {
    startAutoClose();
  }
});

onBeforeUnmount(() => {
  clearTimeout(timeout);
});
</script>

<style scoped>
.toast-notification {
  min-width: 300px;
  max-width: 450px;
  padding: 16px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-bottom: 10px;
  pointer-events: auto;
  animation: slide-in 0.3s ease-out forwards;
  position: relative;
  overflow: hidden;
}

.toast-content {
  display: flex;
  align-items: flex-start;
  flex: 1;
}

.toast-text {
  display: flex;
  flex-direction: column;
}

.toast-title {
  margin-bottom: 4px;
}

.toast-close {
  margin: -8px -8px -8px 8px;
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.2);
}

.toast-progress-bar {
  height: 100%;
  background-color: rgba(255, 255, 255, 0.7);
  transition: width 0.1s linear;
}

.info {
  background-color: #1976d2;
  color: white;
}

.success {
  background-color: #4caf50;
  color: white;
}

.error {
  background-color: #f44336;
  color: white;
}

.warning {
  background-color: #ff9800;
  color: white;
}

@keyframes slide-in {
  from {
    transform: translateX(30px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
