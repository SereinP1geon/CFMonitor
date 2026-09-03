<template>
  <div class="mynt-view mynt-dashboard-view">
    <Dashboard compact-mobile />
    <MyntFooter
      :version="VERSION"
      source-url="https://github.com/SereinP1geon/CFMonitor"
      license-url="./assets/licenses/GPL-3.0.txt"
    />
  </div>
</template>

<script setup>
import Dashboard from '@cf/views/Dashboard.vue'
import { VERSION } from '@cf/utils/api.js'
import MyntFooter from '../components/MyntFooter.vue'
</script>
