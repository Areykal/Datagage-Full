<template>
  <div v-if="error" class="error-boundary">
    <v-card class="error-card">
      <v-card-item>
        <v-card-title>
          <v-icon color="error" class="mr-2">mdi-alert-circle</v-icon>
          Something went wrong
        </v-card-title>
      </v-card-item>

      <v-card-text>
        <p class="mb-4">
          We encountered an error while trying to display this content.
        </p>
        <v-expand-transition>
          <div v-if="showDetails">
            <v-sheet
              color="error"
              variant="tonal"
              class="pa-3 mb-3 error-details"
            >
              <pre>{{ errorMessage }}</pre>
            </v-sheet>
          </div>
        </v-expand-transition>
      </v-card-text>

      <v-card-actions>
        <v-btn @click="toggleDetails" variant="text">
          {{ showDetails ? "Hide" : "Show" }} Details
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="retry" :loading="retrying">
          Try Again
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
  <slot v-else></slot>
</template>

<script setup>
import { ref, onErrorCaptured, computed } from "vue";

// State
const error = ref(null);
const errorInfo = ref(null);
const showDetails = ref(false);
const retrying = ref(false);

// Computed
const errorMessage = computed(() => {
  if (!error.value) return "";
  return error.value.toString();
});

// Event emitter
const emit = defineEmits(["retry"]);

// Error handling
onErrorCaptured((err, instance, info) => {
  error.value = err;
  errorInfo.value = info;
  return false; // Prevent propagation
});

// Methods
const toggleDetails = () => {
  showDetails.value = !showDetails.value;
};

const retry = async () => {
  retrying.value = true;
  error.value = null;
  errorInfo.value = null;

  try {
    emit("retry");
  } finally {
    retrying.value = false;
  }
};
</script>

<style scoped>
.error-boundary {
  padding: 16px;
  display: flex;
  justify-content: center;
}

.error-card {
  max-width: 800px;
  width: 100%;
}

.error-details {
  overflow-x: auto;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9rem;
}
</style>
