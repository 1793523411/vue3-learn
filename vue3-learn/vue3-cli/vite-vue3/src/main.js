import { createApp } from 'vue'
import App from './App.vue'
import './index.css'

import { ref, computed } from 'vue' 
import { effect } from '@vue/reactivity' 
const count = ref(0) 
const plusOne = computed(() => { 
  return count.value + 1 
}) 
effect(() => { 
  console.log(plusOne.value + count.value) 
}) 
function plus() { 
  count.value++ 
} 
plus()

createApp(App).mount('#app')
