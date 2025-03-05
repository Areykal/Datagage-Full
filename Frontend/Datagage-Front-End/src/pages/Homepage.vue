<script setup>
import PageLayout from "@/components/PageLayout.vue";
import Dashboard from "@/components/Dashboard.vue";
import Footer from "@/components/Footer.vue";
import Profile from "@/components/Profile.vue";
</script>

<template>
  <PageLayout title="Home" subtitle="Welcome to Datagage">
    <v-row>
      <v-col cols="12" md="8">
        <Dashboard />
      </v-col>
      <v-col cols="12" md="4">
        <Profile />
      </v-col>
    </v-row>
    <Footer />
  </PageLayout>
</template>

<style scoped>
/* Add any custom styling here */
</style>
