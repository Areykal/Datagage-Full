<template>
  <PageLayout
    title="Settings"
    subtitle="Manage application preferences"
    :loading="loading"
  >
    <v-row>
      <v-col cols="12" md="3">
        <v-card class="mb-6 settings-nav">
          <v-list>
            <v-list-item
              v-for="section in sections"
              :key="section.id"
              @click="activeSection = section.id"
              :active="activeSection === section.id"
              rounded="lg"
            >
              <template v-slot:prepend>
                <v-icon :icon="section.icon"></v-icon>
              </template>
              <v-list-item-title>{{ section.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" md="9">
        <!-- Profile Settings -->
        <v-card v-if="activeSection === 'profile'" class="mb-6">
          <v-card-title>Profile Settings</v-card-title>
          <v-card-text>
            <v-form>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profileSettings.name"
                    label="Name"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profileSettings.email"
                    label="Email"
                    variant="outlined"
                    disabled
                  ></v-text-field>
                </v-col>
              </v-row>

              <div class="d-flex mt-4">
                <v-btn color="primary" @click="saveProfile">Save Changes</v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>

        <!-- Appearance Settings -->
        <v-card v-if="activeSection === 'appearance'" class="mb-6">
          <v-card-title>Appearance</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-subheader>Theme</v-list-subheader>
              <v-list-item>
                <v-radio-group v-model="appearanceSettings.theme" inline>
                  <v-radio label="Light Mode" value="light"></v-radio>
                  <v-radio label="Dark Mode" value="dark"></v-radio>
                  <v-radio label="System Default" value="auto"></v-radio>
                </v-radio-group>
              </v-list-item>

              <v-divider class="my-4"></v-divider>

              <v-list-subheader>Density</v-list-subheader>
              <v-list-item>
                <v-radio-group v-model="appearanceSettings.density" inline>
                  <v-radio label="Comfortable" value="comfortable"></v-radio>
                  <v-radio label="Compact" value="compact"></v-radio>
                </v-radio-group>
              </v-list-item>
            </v-list>

            <div class="d-flex mt-4">
              <v-btn color="primary" @click="saveAppearance"
                >Save Changes</v-btn
              >
            </div>
          </v-card-text>
        </v-card>

        <!-- Notifications Settings -->
        <v-card v-if="activeSection === 'notifications'" class="mb-6">
          <v-card-title>Notifications</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-subheader>Email Notifications</v-list-subheader>

              <v-list-item>
                <v-checkbox
                  v-model="notificationSettings.emailAlerts"
                  label="Send email alerts for critical events"
                ></v-checkbox>
              </v-list-item>

              <v-list-item>
                <v-checkbox
                  v-model="notificationSettings.weeklyDigest"
                  label="Send weekly digest"
                ></v-checkbox>
              </v-list-item>

              <v-divider class="my-4"></v-divider>

              <v-list-subheader>In-App Notifications</v-list-subheader>

              <v-list-item>
                <v-checkbox
                  v-model="notificationSettings.syncAlerts"
                  label="Data sync alerts"
                ></v-checkbox>
              </v-list-item>

              <v-list-item>
                <v-checkbox
                  v-model="notificationSettings.systemMessages"
                  label="System messages"
                ></v-checkbox>
              </v-list-item>
            </v-list>

            <div class="d-flex mt-4">
              <v-btn color="primary" @click="saveNotifications"
                >Save Changes</v-btn
              >
            </div>
          </v-card-text>
        </v-card>

        <!-- Security Settings -->
        <v-card v-if="activeSection === 'security'" class="mb-6">
          <v-card-title>Security</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-subheader>Change Password</v-list-subheader>

              <v-list-item>
                <v-form style="width: 100%">
                  <v-text-field
                    v-model="securitySettings.currentPassword"
                    label="Current Password"
                    variant="outlined"
                    type="password"
                    class="mb-2"
                  ></v-text-field>

                  <v-text-field
                    v-model="securitySettings.newPassword"
                    label="New Password"
                    variant="outlined"
                    type="password"
                    class="mb-2"
                  ></v-text-field>

                  <v-text-field
                    v-model="securitySettings.confirmPassword"
                    label="Confirm New Password"
                    variant="outlined"
                    type="password"
                    class="mb-4"
                  ></v-text-field>

                  <v-btn color="primary" @click="changePassword"
                    >Change Password</v-btn
                  >
                </v-form>
              </v-list-item>

              <v-divider class="my-4"></v-divider>

              <v-list-subheader>Two-Factor Authentication</v-list-subheader>

              <v-list-item>
                <div class="d-flex align-center justify-space-between w-100">
                  <div>
                    <div class="text-subtitle-1">Two-factor authentication</div>
                    <div class="text-caption text-medium-emphasis">
                      Add an extra layer of security
                    </div>
                  </div>
                  <v-switch v-model="securitySettings.twoFactor"></v-switch>
                </div>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { auth } from "@/utils/auth";
import PageLayout from "@/components/PageLayout.vue";
import { notify } from "@/utils/notifications";

const loading = ref(false);
const activeSection = ref("profile");
const user = auth.getUser();

// Settings sections
const sections = [
  { id: "profile", title: "Profile", icon: "mdi-account-outline" },
  { id: "appearance", title: "Appearance", icon: "mdi-palette-outline" },
  { id: "notifications", title: "Notifications", icon: "mdi-bell-outline" },
  { id: "security", title: "Security", icon: "mdi-shield-outline" },
];

// Settings data
const profileSettings = ref({
  name: user?.name || "Demo User",
  email: user?.email || "demo@datagage.com",
});

const appearanceSettings = ref({
  theme: localStorage.getItem("theme") || "dark",
  density: localStorage.getItem("density") || "comfortable",
});

const notificationSettings = ref({
  emailAlerts: true,
  weeklyDigest: true,
  syncAlerts: true,
  systemMessages: true,
});

const securitySettings = ref({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  twoFactor: false,
});

// Save methods (simulated)
const saveProfile = () => {
  loading.value = true;

  // Simulate API call
  setTimeout(() => {
    // Update user in localStorage
    const updatedUser = { ...user, name: profileSettings.value.name };
    localStorage.setItem("user", JSON.stringify(updatedUser));

    notify.success("Profile updated successfully");
    loading.value = false;
  }, 500);
};

const saveAppearance = () => {
  loading.value = true;

  // Save theme to localStorage
  localStorage.setItem("theme", appearanceSettings.value.theme);
  document.documentElement.setAttribute(
    "data-theme",
    appearanceSettings.value.theme
  );

  // Save density to localStorage
  localStorage.setItem("density", appearanceSettings.value.density);

  // Show success message
  setTimeout(() => {
    notify.success("Appearance settings saved");
    loading.value = false;
  }, 300);
};

const saveNotifications = () => {
  loading.value = true;

  // Simulate API call
  setTimeout(() => {
    // In a real app, would save to server
    localStorage.setItem(
      "notification_settings",
      JSON.stringify(notificationSettings.value)
    );

    notify.success("Notification preferences updated");
    loading.value = false;
  }, 500);
};

const changePassword = () => {
  // Basic validation
  if (!securitySettings.value.currentPassword) {
    notify.error("Please enter your current password");
    return;
  }

  if (
    securitySettings.value.newPassword !==
    securitySettings.value.confirmPassword
  ) {
    notify.error("New passwords don't match");
    return;
  }

  loading.value = true;

  // Simulate API call
  setTimeout(() => {
    notify.success("Password changed successfully");
    securitySettings.value.currentPassword = "";
    securitySettings.value.newPassword = "";
    securitySettings.value.confirmPassword = "";
    loading.value = false;
  }, 800);
};

// Load settings (simulated)
onMounted(() => {
  loading.value = true;

  // Simulate loading saved settings
  setTimeout(() => {
    // In a real app, would fetch from server
    const savedNotificationSettings = localStorage.getItem(
      "notification_settings"
    );
    if (savedNotificationSettings) {
      notificationSettings.value = JSON.parse(savedNotificationSettings);
    }

    loading.value = false;
  }, 400);
});
</script>

<style scoped>
.settings-nav {
  position: sticky;
  top: 24px;
}
</style>
