<template>
  <v-navigation-drawer
    v-model="isDrawerOpen"
    :rail="rail"
    @update:rail="updateRail"
    permanent
    border="end"
    color="background"
    :width="260"
    :rail-width="56"
    class="main-navigation"
  >
    <div class="pa-4 d-flex justify-center">
      <Logo :icon-only="rail" />
    </div>

    <v-divider class="mb-2"></v-divider>

    <v-list nav>
      <v-list-item
        v-for="item in navigationItems"
        :key="item.title"
        :to="item.to"
        :prepend-icon="item.icon"
        :title="rail ? '' : item.title"
        :value="item.title"
        rounded="lg"
      ></v-list-item>
    </v-list>

    <template v-slot:append>
      <div class="pa-2">
        <v-btn
          v-if="!rail"
          block
          color="primary"
          to="/sources/new"
          prepend-icon="mdi-plus"
        >
          Add Data Source
        </v-btn>
        <v-btn v-else icon="mdi-plus" color="primary" to="/sources/new"></v-btn>
      </div>

      <v-divider></v-divider>

      <div class="px-2 py-3">
        <v-tooltip
          :text="rail ? 'Expand Menu' : 'Collapse Menu'"
          location="end"
        >
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              variant="text"
              block
              :prepend-icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
              @click="toggleRail"
            >
              <span v-if="!rail">Collapse</span>
            </v-btn>
          </template>
        </v-tooltip>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, computed } from "vue";
import Logo from "@/components/Logo.vue";

const props = defineProps({
  drawer: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["update:drawer", "update:rail"]);

// Drawer state
const isDrawerOpen = computed({
  get: () => props.drawer,
  set: (val) => emit("update:drawer", val),
});

// Rail state (collapsed drawer)
const rail = ref(false);

// Update rail state
const updateRail = (value) => {
  emit("update:rail", value);
};

// Toggle rail state
const toggleRail = () => {
  rail.value = !rail.value;
  emit("update:rail", rail.value);
};

// Navigation items
const navigationItems = [
  {
    title: "Dashboard",
    icon: "mdi-view-dashboard",
    to: "/",
  },
  {
    title: "Data Sources",
    icon: "mdi-database",
    to: "/sources",
  },
  {
    title: "Analytics",
    icon: "mdi-chart-bar",
    to: "/analytics",
  },
  {
    title: "ETL Monitor",
    icon: "mdi-sync",
    to: "/etl-monitor",
  },
  {
    title: "Settings",
    icon: "mdi-cog",
    to: "/settings",
  },
];
</script>

<style scoped>
.main-navigation {
  -webkit-app-region: no-drag;
}
</style>
