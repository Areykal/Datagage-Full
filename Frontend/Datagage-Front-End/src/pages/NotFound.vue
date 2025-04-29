<template>
  <div class="not-found-container">
    <div class="not-found-content text-center">
      <h1 class="text-h1 font-weight-bold primary--text mb-4">404</h1>
      <h2 class="text-h4 mb-6">Page Not Found</h2>
      <p class="text-subtitle-1 text-medium-emphasis mb-8">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <div class="d-flex justify-center">
        <v-btn color="primary" size="large" to="/" class="mr-4">
          Back to Home
        </v-btn>
        <v-btn variant="outlined" size="large" @click="goBack"> Go Back </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const goBack = () => {
  router.go(-1);
};
</script>

<style scoped>
.not-found-container {
  min-height: calc(100vh - 64px); /* Accounting for app bar height */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.not-found-content {
  max-width: 600px;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
