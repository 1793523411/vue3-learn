<template>
  <!-- <img alt="Vue logo" src="./assets/logo.png" /> -->
  <div>
    <Inject />
    <Circle2 />
    <Circle />
    <WatchDemo />
    <HelloWorld msg="Hello Vue 3.0 + Vite" />
    <Demo />
    <Demo02 @toggle="toggle" :msg="msg" />
    <clean />
    <ComputedDemo />
  </div>
</template>

<script>
import HelloWorld from "./components/HelloWorld.vue";
import Demo from "./components/Demo.vue";
import Demo02 from "./components/Demo02.vue";
import Clean from "./components/Clean.vue";
import ComputedDemo from "./components/ComputedDemo.vue";
import WatchDemo from "./components/WhatchDemo.vue";
import Circle from "./components/Circle.vue";
import Circle2 from "./components/Circle2.vue";
import Inject from "./components/Inject.vue";
import { ref,provide } from "vue";
export default {
  name: "App",
  components: {
    HelloWorld,
    Demo,
    Demo02,
    Clean,
    ComputedDemo,
    WatchDemo,
    Circle,
    Circle2,
    Inject,
  },
  setup() {
    const msg = ref("Hello World");

    function toggle() {
      msg.value = msg.value === "Hello World" ? "Hello Vue" : "Hello World";
    }
    const theme = ref("dark");
    provide("theme", theme);
    return {
      toggle,
      msg,
    };
  },
};
</script>
