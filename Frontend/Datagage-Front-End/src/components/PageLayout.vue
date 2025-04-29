<template>
  <div class="page-layout">
    <!-- Page header -->
    <div class="page-header mb-6">
      <div>
        <div class="d-flex align-center">
          <v-btn
            v-if="showBack"
            icon="mdi-arrow-left"
            variant="text"
            size="small"
            class="mr-3"
            @click="goBack"
          ></v-btn>
          <h1 class="text-h5 font-weight-medium">{{ title }}</h1>
        </div>
        <p v-if="subtitle" class="text-subtitle-1 text-medium-emphasis mt-1">
          {{ subtitle }}
        </p>
      </div>
      <div v-if="$slots.actions" class="page-actions">
        <slot name="actions"></slot>
      </div>
    </div>

    <!-- Loading state -->
    <v-sheet v-if="loading" class="mb-6 pa-2">
      <v-progress-linear
        indeterminate
        color="primary"
      ></v-progress-linear>
    </v-sheet>

    <!-- Error handling -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      closable
      class="mb-6"
      @click:close="clearError"
    >
      {{ error }}
    </v-alert>

    <!-- Main content slot -->
    <slot></slot>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

// Props
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: "",
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: [String, null],
    default: null,
  },
  showBack: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["clearError"]);

// Methods
const goBack = () => {
  router.go(-1);
};

const clearError = () => {
  emit("clearError");
};
</script>

<style scoped>
.page-layout {
  animation: fadeIn 0.3s ease-out;
  padding: 0 1rem;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding: 1rem 0;
}

.page-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
