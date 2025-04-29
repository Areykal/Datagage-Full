<template>
  <PageLayout title="Notification System" subtitle="Demo and examples">
    <v-card class="mb-6">
      <v-card-title>Notification Types</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6" class="mb-4">
            <v-btn color="primary" block @click="showInfo" class="mb-2">
              Show Info Notification
            </v-btn>
            <v-btn color="success" block @click="showSuccess" class="mb-2">
              Show Success Notification
            </v-btn>
            <v-btn color="warning" block @click="showWarning" class="mb-2">
              Show Warning Notification
            </v-btn>
            <v-btn color="error" block @click="showError" class="mb-2">
              Show Error Notification
            </v-btn>
          </v-col>

          <v-col cols="12" md="6">
            <v-card variant="outlined" class="pa-4">
              <h3 class="text-h6 mb-2">Custom Notification</h3>
              <v-text-field
                v-model="customMessage"
                label="Message"
                variant="outlined"
                density="compact"
              />
              <v-text-field
                v-model="customTitle"
                label="Title (optional)"
                variant="outlined"
                density="compact"
              />
              <v-select
                v-model="customType"
                :items="notificationTypes"
                label="Type"
                variant="outlined"
                density="compact"
              />
              <v-select
                v-model="customPosition"
                :items="positionOptions"
                label="Position"
                variant="outlined"
                density="compact"
              />
              <v-slider
                v-model="customTimeout"
                label="Timeout (ms)"
                min="1000"
                max="10000"
                step="1000"
                thumb-label
              />
              <v-btn color="primary" block @click="showCustom">
                Show Custom Notification
              </v-btn>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card class="mb-6">
      <v-card-title>Usage Examples</v-card-title>
      <v-card-text>
        <v-tabs v-model="tab">
          <v-tab value="composition">Composition API</v-tab>
          <v-tab value="options">Options API</v-tab>
          <v-tab value="template">Template Usage</v-tab>
        </v-tabs>

        <v-window v-model="tab" class="mt-4">
          <v-window-item value="composition">
            <pre class="code-block"><code>
import { notify } from '@/utils/notifications';

// In your setup function
function showSuccess() {
  notify.success('Operation completed successfully');
}

function showError() {
  notify.error('An error occurred', { 
    title: 'Error Details',
    timeout: 8000 
  });
}
            </code></pre>
          </v-window-item>

          <v-window-item value="options">
            <pre class="code-block"><code>
// In options API component
import { notify } from '@/utils/notifications';

export default {
  methods: {
    showSuccess() {
      notify.success('Operation completed successfully');
    },
    showWithOptions() {
      notify.warning('Please check your input', {
        position: 'bottom-center',
        title: 'Validation Warning',
        timeout: 6000
      });
    }
  }
}
            </code></pre>
          </v-window-item>

          <v-window-item value="template">
            <pre class="code-block"><code>
&lt;template&gt;
  &lt;div&gt;
    &lt;v-btn @click="$notify.info('Hello from template!')">
      Show Notification
    &lt;/v-btn&gt;
    
    &lt;v-btn @click="$notify.success('Data saved successfully')">
      Save Data
    &lt;/v-btn&gt;
  &lt;/div&gt;
&lt;/template&gt;
            </code></pre>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </PageLayout>
</template>

<script setup>
import { ref } from "vue";
import PageLayout from "@/components/PageLayout.vue";
import { notify } from "@/utils/notifications";

// Custom notification state
const customMessage = ref("This is a custom notification");
const customTitle = ref("Custom Title");
const customType = ref("info");
const customPosition = ref("top-right");
const customTimeout = ref(5000);

// Tab state
const tab = ref("composition");

// Demo notification types
const notificationTypes = [
  { title: "Info", value: "info" },
  { title: "Success", value: "success" },
  { title: "Warning", value: "warning" },
  { title: "Error", value: "error" },
];

// Position options
const positionOptions = [
  { title: "Top Right", value: "top-right" },
  { title: "Top Left", value: "top-left" },
  { title: "Top Center", value: "top-center" },
  { title: "Bottom Right", value: "bottom-right" },
  { title: "Bottom Left", value: "bottom-left" },
  { title: "Bottom Center", value: "bottom-center" },
];

// Notification demo functions
function showInfo() {
  notify.info("This is an information notification");
}

function showSuccess() {
  notify.success("Operation completed successfully", { title: "Success" });
}

function showWarning() {
  notify.warning("Please review your inputs before continuing", {
    title: "Warning",
  });
}

function showError() {
  notify.error("An error occurred while processing your request", {
    title: "Error",
  });
}

function showCustom() {
  notify.show(
    customMessage.value,
    customType.value,
    customTimeout.value,
    customPosition.value,
    customTitle.value
  );
}
</script>

<style scoped>
.code-block {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
}
</style>
