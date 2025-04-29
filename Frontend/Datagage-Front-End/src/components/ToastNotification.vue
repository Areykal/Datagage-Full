<template>
  <div class="toast-notification">
    <v-snackbar
      v-model="show"
      :timeout="notification.timeout || 5000"
      :color="notification.type"
      location="top right"
      multi-line
      class="mt-12"
    >
      {{ notification.message }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="close"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useNotificationStore } from '@/stores/notificationStore';

const props = defineProps({
  notification: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['close']);

const notificationStore = useNotificationStore();
const show = ref(true);

watch(show, (newValue) => {
  if (!newValue) {
    // Delay removal slightly to allow fade-out animation
    setTimeout(() => {
      // Use the correct method name: remove
      notificationStore.remove(props.notification.id);
      emit('close', props.notification.id); // Emit close event
    }, 300); // Adjust delay as needed
  }
});

const close = () => {
  show.value = false;
};

// Auto-close logic handled by v-snackbar timeout
</script>

<style scoped>
.toast-notification {
  /* Adding a wrapper element ensures we have a proper element for transitions */
  display: block;
  margin-top: 48px !important; /* Adjust based on your app bar height */
}
</style>
