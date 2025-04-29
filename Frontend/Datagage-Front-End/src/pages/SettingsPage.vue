<template>
  <PageLayout
    title="Settings"
    subtitle="Manage your application preferences"
    :loading="loading"
  >
    <v-row>
      <v-col cols="12" md="3">
        <v-card class="mb-4 settings-nav">
          <v-list nav density="comfortable">
            <v-list-item
              v-for="section in sections"
              :key="section.id"
              @click="activeSection = section.id"
              :active="activeSection === section.id"
              rounded="lg"
            >
              <template v-slot:prepend>
                <v-icon :icon="section.icon" size="small" class="mr-2"></v-icon>
              </template>
              <v-list-item-title>{{ section.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" md="9">
        <!-- Profile Settings -->
        <v-card v-if="activeSection === 'profile'" class="mb-4" variant="flat">
          <v-card-title class="pb-1">Profile Settings</v-card-title>
          <v-card-subtitle class="pb-4">Manage your personal information</v-card-subtitle>
          <v-divider></v-divider>
          <v-card-text>
            <v-form>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profileSettings.name"
                    label="Name"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    class="mb-3"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profileSettings.email"
                    label="Email"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    disabled
                    class="mb-3"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" @click="saveProfile" :loading="loading">
              Save Changes
            </v-btn>
          </v-card-actions>
        </v-card>

        <!-- Appearance Settings -->
        <v-card v-if="activeSection === 'appearance'" class="mb-4" variant="flat">
          <v-card-title class="pb-1">Appearance</v-card-title>
          <v-card-subtitle class="pb-4">Customize the look and feel of the application</v-card-subtitle>
          <v-divider></v-divider>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <h3 class="text-subtitle-1 mb-2">Theme</h3>
                <v-radio-group v-model="appearanceSettings.theme" hide-details>
                  <v-radio label="Light Mode" value="light"></v-radio>
                  <v-radio label="Dark Mode" value="dark"></v-radio>
                  <v-radio label="System Default" value="auto"></v-radio>
                </v-radio-group>
              </v-col>
              
              <v-col cols="12" md="6">
                <h3 class="text-subtitle-1 mb-2">Density</h3>
                <v-radio-group v-model="appearanceSettings.density" hide-details>
                  <v-radio label="Comfortable" value="comfortable"></v-radio>
                  <v-radio label="Compact" value="compact"></v-radio>
                </v-radio-group>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" @click="saveAppearance" :loading="loading">
              Save Changes
            </v-btn>
          </v-card-actions>
        </v-card>

        <!-- Notifications Settings -->
        <v-card v-if="activeSection === 'notifications'" class="mb-4" variant="flat">
          <v-card-title class="pb-1">Notifications</v-card-title>
          <v-card-subtitle class="pb-4">Configure notification preferences</v-card-subtitle>
          <v-divider></v-divider>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <h3 class="text-subtitle-1 mb-3">Email Notifications</h3>
                <v-switch
                  v-model="notificationSettings.emailAlerts"
                  label="Send email alerts for critical events"
                  color="primary"
                  hide-details
                  class="mb-3"
                ></v-switch>
                <v-switch
                  v-model="notificationSettings.weeklyDigest"
                  label="Send weekly digest"
                  color="primary"
                  hide-details
                ></v-switch>
              </v-col>
              
              <v-col cols="12" md="6">
                <h3 class="text-subtitle-1 mb-3">In-App Notifications</h3>
                <v-switch
                  v-model="notificationSettings.syncAlerts"
                  label="Data sync alerts"
                  color="primary"
                  hide-details
                  class="mb-3"
                ></v-switch>
                <v-switch
                  v-model="notificationSettings.systemMessages"
                  label="System messages"
                  color="primary"
                  hide-details
                ></v-switch>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" @click="saveNotifications" :loading="loading">
              Save Changes
            </v-btn>
          </v-card-actions>
        </v-card>

        <!-- Security Settings -->
        <v-card v-if="activeSection === 'security'" class="mb-4" variant="flat">
          <v-card-title class="pb-1">Security</v-card-title>
          <v-card-subtitle class="pb-4">Manage your account security settings</v-card-subtitle>
          <v-divider></v-divider>
          <v-card-text>
            <h3 class="text-subtitle-1 mb-3">Change Password</h3>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="securitySettings.currentPassword"
                  label="Current Password"
                  variant="outlined"
                  density="comfortable"
                  type="password"
                  hide-details
                  class="mb-3"
                ></v-text-field>
                
                <v-text-field
                  v-model="securitySettings.newPassword"
                  label="New Password"
                  variant="outlined"
                  density="comfortable"
                  type="password"
                  hide-details
                  class="mb-3"
                ></v-text-field>
                
                <v-text-field
                  v-model="securitySettings.confirmPassword"
                  label="Confirm New Password"
                  variant="outlined"
                  density="comfortable"
                  type="password"
                  hide-details
                  class="mb-3"
                ></v-text-field>
                
                <v-btn color="primary" @click="changePassword" :loading="loading">
                  Change Password
                </v-btn>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-sheet class="pa-4 rounded bg-primary-lighten-5 mb-4">
                  <h3 class="text-subtitle-1 mb-2">Password Requirements</h3>
                  <ul class="pl-4">
                    <li>At least 8 characters</li>
                    <li>Include uppercase and lowercase letters</li>
                    <li>Include at least one number</li>
                    <li>Include at least one special character</li>
                  </ul>
                </v-sheet>
              </v-col>
            </v-row>
            
            <v-divider class="my-4"></v-divider>
            
            <h3 class="text-subtitle-1 mb-3">Two-Factor Authentication</h3>
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-body-1">Enhanced security for your account</div>
                <div class="text-caption text-medium-emphasis">
                  Adds an extra layer of protection by requiring a verification code in addition to your password
                </div>
              </div>
              <v-switch v-model="securitySettings.twoFactor" color="primary" hide-details></v-switch>
            </div>
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
