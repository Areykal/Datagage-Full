<script setup>
import { ref } from "vue";
import PageLayout from "@/components/PageLayout.vue";

const loading = ref(false);
const error = ref(null);
const saving = ref(false);

const settings = ref({
  theme: localStorage.getItem("theme") || "dark",
  notifications: true,
});

const themeOptions = [
  { title: "Dark Theme", value: "dark" },
  { title: "Light Theme", value: "light" },
];

const saveSettings = () => {
  saving.value = true;
  localStorage.setItem("theme", settings.value.theme);
  // Placeholder for settings save functionality
  setTimeout(() => {
    saving.value = false;
    window.location.reload(); // Reload the page to apply the new theme
  }, 1000);
};
</script>

<template>
  <PageLayout
    title="Settings"
    subtitle="Configure your preferences"
    :loading="loading"
    :error="error"
  >
    <v-row>
      <v-col cols="12" md="8">
        <v-card class="settings-card">
          <v-card-title>General Settings</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="saveSettings">
              <v-select
                v-model="settings.theme"
                label="Theme"
                :items="themeOptions"
                variant="outlined"
                class="mb-4"
              ></v-select>

              <v-switch
                v-model="settings.notifications"
                label="Enable Notifications"
                color="primary"
                class="mb-4"
              ></v-switch>

              <v-btn color="primary" type="submit" :loading="saving">
                Save Changes
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </PageLayout>
</template>

<style scoped>
.settings-card {
  background: var(--surface-color) !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-primary-color) !important;
}
</style>
