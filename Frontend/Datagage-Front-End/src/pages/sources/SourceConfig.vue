<template>
  <PageLayout
    :title="sourceType?.name || 'Configure Source'"
    subtitle="Configure your data source connection"
    :loading="loading"
    :error="error"
    showBack
  >
    <v-card variant="outlined" class="config-card">
      <v-form @submit.prevent="createSource" class="pa-4">
        <v-text-field
          v-model="formData.name"
          label="Source Name"
          placeholder="Enter a name for this source"
          required
          variant="outlined"
          class="mb-4"
        ></v-text-field>

        <v-divider class="mb-4"></v-divider>

        <div class="text-subtitle-1 mb-4">Connection Details</div>

        <template v-for="field in sourceType?.formFields" :key="field.name">
          <v-tooltip :text="field.description" location="top">
            <template v-slot:activator="{ props }">
              <div v-bind="props">
                <v-text-field
                  v-if="field.type === 'text' || field.type === 'password'"
                  v-model="formData[field.name]"
                  :label="field.label"
                  :type="field.type"
                  :required="field.required"
                  :hint="field.hint"
                  variant="outlined"
                  class="mb-4"
                  :prepend-inner-icon="getFieldIcon(field.name)"
                ></v-text-field>

                <v-text-field
                  v-else-if="field.type === 'number'"
                  v-model.number="formData[field.name]"
                  :label="field.label"
                  type="number"
                  :required="field.required"
                  variant="outlined"
                  class="mb-4"
                ></v-text-field>

                <v-switch
                  v-else-if="field.type === 'checkbox'"
                  v-model="formData[field.name]"
                  :label="field.label"
                  color="primary"
                  class="mb-4"
                ></v-switch>

                <v-text-field
                  v-else-if="field.type === 'date'"
                  v-model="formData[field.name]"
                  :label="field.label"
                  type="date"
                  :required="field.required"
                  variant="outlined"
                  class="mb-4"
                ></v-text-field>
              </div>
            </template>
          </v-tooltip>
        </template>

        <v-card-actions class="pa-0 mt-4">
          <v-spacer></v-spacer>
          <v-btn @click="goBack" variant="tonal"> Cancel </v-btn>
          <v-btn
            color="primary"
            type="submit"
            :loading="isSubmitting"
            :disabled="!isFormValid"
          >
            Create Source
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { sourceService } from "@/services/sourceService";
import PageLayout from "@/components/PageLayout.vue";

const route = useRoute();
const router = useRouter();
const sourceType = ref(null);
const loading = ref(true);
const error = ref(null);
const formData = ref({});
const isSubmitting = ref(false);
const isFormValid = computed(() => {
  return formData.value.name && Object.keys(formData.value).length > 0;
});

const getFieldIcon = (fieldName) => {
  const icons = {
    host: "mdi-server",
    port: "mdi-numeric",
    database: "mdi-database",
    username: "mdi-account",
    password: "mdi-key",
  };
  return icons[fieldName];
};

onMounted(async () => {
  try {
    const typeDetails = await sourceService.getSourceTypeDetails(
      route.params.sourceType
    );
    sourceType.value = typeDetails;

    // Initialize form data with default values
    typeDetails.formFields.forEach((field) => {
      formData.value[field.name] = field.default || "";
    });
  } catch (err) {
    error.value = "Failed to load source configuration";
    console.error(err);
  } finally {
    loading.value = false;
  }
});

const createSource = async () => {
  try {
    isSubmitting.value = true;
    await sourceService.createSource({
      sourceName: formData.value.name,
      sourceType: route.params.sourceType,
      sourceConfig: formData.value,
    });
    router.replace({ name: "sources" });
  } catch (err) {
    error.value = "Failed to create source";
    console.error(err);
  } finally {
    isSubmitting.value = false;
  }
};

const goBack = () => {
  router.replace({ name: "source-types" });
};
</script>

<style scoped>
.config-card {
  background: linear-gradient(145deg, var(--dark-surface), #1a1a1a) !important;
  border: 1px solid var(--dark-border) !important;
}
</style>
