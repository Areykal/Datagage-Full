<template>
  <div class="page-layout">
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
          <h1 class="text-h4 font-weight-bold">{{ title }}</h1>
        </div>
        <p v-if="subtitle" class="text-subtitle-1 text-medium-emphasis mt-1">
          {{ subtitle }}
        </p>
      </div>
      <div v-if="$slots.actions" class="page-actions">
        <slot name="actions"></slot>
      </div>
    </div>

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

    <v-sheet v-if="loading" class="d-flex justify-center align-center py-8">
      <v-progress-circular
        indeterminate
        color="primary"
        size="64"
      ></v-progress-circular>
    </v-sheet>

    <div v-else>
      <slot></slot>
    </div>
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
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
