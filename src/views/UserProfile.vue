<script setup>
import {useUserStore} from "@/stores/user.js";
const userStore = useUserStore()
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div>{{route.params.id}}</div>
  <div>{{route.params.id}}</div>
  <div>{{route.params.id}}</div>
  <div>{{route.params.id}}</div>
  <div>{{route.params.id}}</div>


</template>

<style scoped>

</style>