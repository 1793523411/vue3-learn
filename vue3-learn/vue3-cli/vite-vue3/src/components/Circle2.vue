<template> 
  <div> 
    <div> 
      <p>Circle2:{{count}}</p> 
      <button @click="increase">Increase</button> 
    </div> 
  </div> 
</template> 
<script> 
  import { ref, onRenderTracked, onRenderTriggered } from 'vue' 
  export default { 
    setup () { 
      const count = ref(0) 
      function increase () { 
        count.value++ 
      } 
      onRenderTracked((e) => { 
        console.log(e) 
        // debugger 
      }) 
      onRenderTriggered((e) => { 
        console.log(e) 
        // debugger 
      }) 
      return { 
        count, 
        increase 
      } 
    } 
  } 
</script> 
