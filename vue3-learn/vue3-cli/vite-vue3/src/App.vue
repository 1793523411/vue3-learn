<template>
<!-- <img alt="Vue logo" src="./assets/logo.png" /> -->
<div>
    <HelloWorld msg="Hello Vue 3.0 + Vite" />
    <Demo />
    <Demo02 @toggle="toggle" :msg="msg" />
</div>
</template>

<script>
import HelloWorld from "./components/HelloWorld.vue";
import Demo from "./components/Demo.vue";
import Demo02 from "./components/Demo02.vue";
import {
    ref
} from 'vue'
export default {
    name: "App",
    components: {
        HelloWorld,
        Demo,
        Demo02,
    },
    setup() {
        const msg = ref('Hello World')

        function toggle() {
            msg.value = msg.value === 'Hello World' ? 'Hello Vue' : 'Hello World'
        }
        return {
            toggle,
            msg
        }
    }
};
</script>
