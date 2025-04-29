<template>
  <div class="help-tooltip-wrapper">
    <v-tooltip
      :text="text"
      :location="location"
      :open-delay="openDelay"
      max-width="300"
    >
      <template v-slot:activator="{ props }">
        <v-icon
          v-bind="props"
          :icon="icon"
          :size="size"
          :color="color"
          class="help-icon"
          @click="showFullHelp"
        ></v-icon>
      </template>
    </v-tooltip>
    
    <!-- Full Help Dialog -->
    <v-dialog v-model="dialogOpen" max-width="600px">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon :icon="icon" class="mr-2" :color="color"></v-icon>
          {{ title || 'Help' }}
          <v-spacer></v-spacer>
          <v-btn icon @click="dialogOpen = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text>
          <div v-if="fullContent" v-html="fullContent"></div>
          <div v-else>
            <p>{{ text }}</p>
            <div v-if="relatedTopics && relatedTopics.length > 0" class="mt-4">
              <div class="text-subtitle-2 mb-2">Related Topics:</div>
              <v-chip-group>
                <v-chip
                  v-for="(topic, index) in relatedTopics"
                  :key="index"
                  size="small"
                  color="primary"
                  variant="tonal"
                  class="mr-2"
                  @click="navigateToTopic(topic.ref)"
                >
                  {{ topic.title }}
                </v-chip>
              </v-chip-group>
            </div>
          </div>
        </v-card-text>
        
        <v-divider v-if="showHelpCenter"></v-divider>
        
        <v-card-actions v-if="showHelpCenter">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="openHelpCenter">
            <v-icon start>mdi-help-circle</v-icon>
            Open Help Center
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { HELP_SEARCH_INDEX } from '@/utils/helpDocumentation';

const props = defineProps({
  // Required props
  text: {
    type: String,
    required: true,
    default: 'Helpful information'
  },
  
  // Optional props
  title: {
    type: String,
    default: ''
  },
  fullContent: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: 'mdi-help-circle-outline'
  },
  color: {
    type: String,
    default: 'grey-darken-1'
  },
  size: {
    type: String,
    default: 'small'
  },
  location: {
    type: String,
    default: 'top'
  },
  openDelay: {
    type: Number,
    default: 200
  },
  showHelpCenter: {
    type: Boolean,
    default: true
  },
  helpKey: {
    type: String,
    default: ''
  }
});

// State
const dialogOpen = ref(false);
const router = useRouter();

// Computed
const relatedTopics = computed(() => {
  if (!props.helpKey) return [];
  
  // Find related topics based on keywords matching
  return HELP_SEARCH_INDEX.filter(topic => 
    topic.keywords.includes(props.helpKey) || 
    topic.category === props.helpKey
  ).slice(0, 3);
});

// Methods
const showFullHelp = (event) => {
  // Only open dialog if clicking directly on the icon
  // (not when activating the tooltip)
  if (event) {
    event.preventDefault();
    event.stopPropagation();
    dialogOpen.value = true;
  }
};

const navigateToTopic = (topicRef) => {
  // In a real implementation, this would navigate to the specific help topic
  console.log('Navigate to topic:', topicRef);
  dialogOpen.value = false;
  
  // Example implementation:
  // router.push({ name: 'help-center', params: { topic: topicRef } });
};

const openHelpCenter = () => {
  dialogOpen.value = false;
  // Example implementation:
  // router.push({ name: 'help-center' });
};
</script>

<style scoped>
.help-tooltip-wrapper {
  display: inline-block;
}

.help-icon {
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.help-icon:hover {
  opacity: 1;
}
</style>
