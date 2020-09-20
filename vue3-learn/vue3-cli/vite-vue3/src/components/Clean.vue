<template>
<div v-if="state.showMsg">{{ state.msg }}</div>
<div v-else>{{ Math.random()}}</div>
<button @click="toggle">Toggle Msg</button>
<button @click="switchView">Switch View</button>
</template>

<script>
import {
    reactive
} from "vue";

export default {
    setup() {
        const state = reactive({
            msg: "Hello World",
            showMsg: true,
        });

        function toggle() {
            state.msg = state.msg === "Hello World" ? "Hello Vue" : "Hello World";
        }

        function switchView() {
            state.showMsg = !state.showMsg;
        }

        return {
            toggle,
            switchView,
            state,
        };
    },
};
</script>
