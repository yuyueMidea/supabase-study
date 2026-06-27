<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import ToastContainer from '@/components/ui/ToastContainer.vue'

const authStore = useAuthStore()
onMounted(() => authStore.init())
</script>

<template>
  <RouterView />
  <ToastContainer />
</template>
