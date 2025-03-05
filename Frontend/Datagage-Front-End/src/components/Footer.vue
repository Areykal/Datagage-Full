<script setup>
import { ref } from "vue";
import Logo from "@/components/Logo.vue";

const footerLinks = ref([
  { text: "Privacy", to: "/privacy" },
  { text: "Terms", to: "/terms" },
  { text: "Contact", to: "/contact" },
  { text: "About", to: "/about" },
]);
</script>

<template>
  <v-footer class="bg-transparent mt-8">
    <v-row no-gutters>
      <v-col cols="12" class="text-center">
        <span class="text-caption text-medium-emphasis">
          &copy; {{ new Date().getFullYear() }} Datagage - Your data integration
          platform
        </span>
      </v-col>
      <v-col cols="12" class="text-center mt-1">
        <v-btn
          v-for="link in footerLinks"
          :key="link.text"
          variant="text"
          density="compact"
          color="secondary"
          class="mx-1"
          :to="link.to"
        >
          {{ link.text }}
        </v-btn>
      </v-col>
    </v-row>
  </v-footer>
</template>

<style scoped>
/* Add any custom styling here */
</style>
