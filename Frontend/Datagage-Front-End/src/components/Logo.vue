<template>
  <div class="logo" :class="{ 'logo--small': small }">
    <v-icon
      :size="small ? 24 : 32"
      color="primary"
      :icon="logoIcon"
      class="logo-icon"
    ></v-icon>
    <span
      v-if="!iconOnly"
      class="logo-text"
      :class="{ 'text-primary': themed }"
    >
      Data<span class="text-secondary">gage</span>
    </span>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  small: {
    type: Boolean,
    default: false,
  },
  iconOnly: {
    type: Boolean,
    default: false,
  },
  themed: {
    type: Boolean,
    default: true,
  },
  icon: {
    type: String,
    default: "mdi-database-cog",
  },
});

const logoIcon = computed(() => props.icon);
</script>

<style scoped>
.logo {
  display: flex;
  align-items: center;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.logo-icon {
  margin-right: 8px;
  transition: transform 0.3s ease;
}

.logo:hover .logo-icon {
  transform: rotate(-10deg);
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  user-select: none;
}

.logo--small .logo-text {
  font-size: 1.2rem;
}
</style>
