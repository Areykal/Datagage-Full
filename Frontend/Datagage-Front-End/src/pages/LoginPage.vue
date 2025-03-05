<template>
  <div class="login-container">
    <v-card class="login-card mx-auto" max-width="450" elevation="8">
      <v-card-item>
        <div class="d-flex justify-center mb-6">
          <v-avatar size="80" color="primary" class="elevation-2">
            <span class="text-h4 font-weight-bold">D</span>
          </v-avatar>
        </div>
        <v-card-title class="text-h4 text-center">Datagage</v-card-title>
        <v-card-subtitle class="text-center mt-2">
          Sign in to your account
        </v-card-subtitle>
      </v-card-item>

      <v-card-text>
        <v-form @submit.prevent="handleLogin" ref="loginForm">
          <v-alert
            v-if="loginError"
            type="error"
            variant="tonal"
            class="mb-4"
            closable
            @click:close="loginError = null"
          >
            {{ loginError }}
          </v-alert>

          <v-alert type="info" variant="tonal" class="mb-4">
            Demo mode: Just click "Sign In" to continue
          </v-alert>

          <v-text-field
            v-model="email"
            label="Email"
            prepend-inner-icon="mdi-email-outline"
            variant="outlined"
            hint="Demo: any email works"
            persistent-hint
            class="mb-2"
          />

          <v-text-field
            v-model="password"
            label="Password"
            prepend-inner-icon="mdi-lock-outline"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showPassword = !showPassword"
            variant="outlined"
            :type="showPassword ? 'text' : 'password'"
            hint="Demo: any password works"
            persistent-hint
          />

          <div class="d-flex justify-space-between align-center mt-2 mb-6">
            <v-checkbox
              v-model="rememberMe"
              label="Remember me"
              hide-details
              density="compact"
            />
            <v-btn
              variant="text"
              color="primary"
              density="compact"
              @click="forgotPassword"
              :disabled="isLoading"
            >
              Forgot password?
            </v-btn>
          </div>

          <v-btn
            type="submit"
            block
            color="primary"
            size="large"
            :loading="isLoading"
            class="mb-4"
          >
            Sign In
          </v-btn>

          <div class="text-center">
            <span class="text-medium-emphasis">Don't have an account?</span>
            <v-btn
              variant="text"
              color="primary"
              class="ml-2"
              @click="goToRegister"
            >
              Create Account
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { notify } from "@/utils/notifications";
import { auth } from "@/utils/auth";

const router = useRouter();
const route = useRoute();

// Form data
const email = ref("");
const password = ref("");
const rememberMe = ref(false);
const showPassword = ref(false);
const loginError = ref(null);
const isLoading = ref(false);
const loginForm = ref(null);
const redirectPath = ref(route.query.redirect || "/");

// Check if already logged in
onMounted(() => {
  if (auth.isAuthenticated()) {
    router.push("/");
  }
});

// Handle form submission - simplified for demo
const handleLogin = async () => {
  // Reset previous errors
  loginError.value = null;
  isLoading.value = true;

  try {
    // Use the auth utility for login
    const result = await auth.demoLogin(email.value, rememberMe.value);
    if (!result.success) {
      loginError.value = result.error;
    }
  } catch (error) {
    console.error("Login error:", error);
    loginError.value = error.message || "Failed to sign in. Please try again.";
  } finally {
    isLoading.value = false;
  }
};

const forgotPassword = () => {
  notify.info("Password reset functionality will be implemented soon");
};

const goToRegister = () => {
  notify.info("Registration functionality will be implemented soon");
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: var(--background-color);
}

.login-card {
  width: 100%;
  padding: 16px;
  background: var(--surface-color) !important;
  border: 1px solid var(--border-color) !important;
}

@media (max-width: 600px) {
  .login-card {
    box-shadow: none !important;
  }
}
</style>
