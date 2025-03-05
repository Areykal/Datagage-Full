<template>
  <v-dialog v-model="dialog" max-width="400px" @keydown.esc="cancel">
    <v-card class="confirm-dialog">
      <v-card-title class="text-h5 pb-2">{{ title }}</v-card-title>
      <v-card-text>{{ message }}</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          variant="plain"
          @click="cancel"
          ref="cancelBtn"
          @keydown.tab.exact="focusConfirmBtn"
        >
          Cancel
        </v-btn>
        <v-btn
          :color="confirmColor"
          :loading="loading"
          @click="confirm"
          ref="confirmBtn"
          @keydown.tab.shift="focusCancelBtn"
          @keydown.enter="confirm"
        >
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, nextTick } from "vue";

const props = defineProps({
  title: { type: String, required: true },
  message: { type: String, required: true },
  confirmText: { type: String, default: "Confirm" },
  confirmColor: { type: String, default: "error" },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(["confirm", "cancel"]);
const dialog = ref(false);
const cancelBtn = ref(null);
const confirmBtn = ref(null);

const show = () => {
  dialog.value = true;
};

const confirm = () => {
  emit("confirm");
};

const cancel = () => {
  dialog.value = false;
  emit("cancel");
};

const focusConfirmBtn = () => {
  confirmBtn.value?.$el.focus();
};

const focusCancelBtn = () => {
  cancelBtn.value?.$el.focus();
};

// Focus the confirm button when the dialog opens
watch(dialog, (newVal) => {
  if (newVal) {
    nextTick(() => {
      confirmBtn.value?.$el.focus();
    });
  }
});

defineExpose({ show });
</script>

<style scoped>
.confirm-dialog {
  background: linear-gradient(145deg, var(--dark-surface), #1a1a1a) !important;
  border: 1px solid var(--dark-border) !important;
}
</style>
