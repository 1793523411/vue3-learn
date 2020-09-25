<template>
  <div>
    {{theme}}
  </div>
</template>

<script>
import { inject } from 'vue' 
export default { 
  setup() { 
    const theme = inject('theme', 'light') 
    return { 
      theme 
    } 
  } 
}
</script>

<style>

</style>