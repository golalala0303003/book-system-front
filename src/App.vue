<template>
  <div>hello world</div>
  <el-button type="primary" :icon="Delete" @Click="OnDeleteBtn"/>
</template>

<script setup lang="ts">
import { Delete } from '@element-plus/icons-vue'

function OnDeleteBtn() {
  console.log("someone push delete btn")
}
</script>