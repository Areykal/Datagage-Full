<script setup>
import { computed } from "vue";
import { auth } from "@/utils/auth";

const user = computed(() => auth.getUser());

const userInitials = computed(() => {
  if (!user.value?.name) return "DU";

  const nameParts = user.value.name.split(" ");
  if (nameParts.length >= 2) {
    return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
  }
  return nameParts[0][0].toUpperCase();
});
</script>

<template>
  <v-card class="profile-card mb-6">
    <v-card-text>
      <div class="d-flex flex-column align-center">
        <v-avatar size="100" color="primary" class="mb-3">
          <span v-if="!user?.photoURL" class="text-h4">{{ userInitials }}</span>
          <v-img v-else :src="user.photoURL"></v-img>
        </v-avatar>

        <div class="text-h5 mb-1">{{ user?.name || "Demo User" }}</div>
        <div class="text-subtitle-1 text-medium-emphasis mb-3">
          {{ user?.email || "demo@datagage.com" }}
        </div>

        <v-chip class="mb-4">{{ user?.role || "Admin" }}</v-chip>

        <v-btn block color="primary" variant="outlined" to="/settings">
          Edit Profile
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.profile-card {
  background: var(--surface-color) !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-primary-color) !important;
  transition: all 0.3s ease;
}
</style>
