<template>
<!--vue3可以不只有一个跟标签，只不过编辑器会提示语法错误，但实际运行不会错-->
<div>
    <p>{{ msg }}</p>
    <p>{{ userMsg }}</p>
    <button @click="random">Random msg</button>
</div>
</template>

<script>
import {
    ref
} from "vue";
export default {
    data() {
        return {
            msg: "msg from data",
        };
    },
    setup() {
        const msg = ref("msg from setup");
        return {
            msg,
        };
    },
    created() {
        this.userMsg = "msg from user";
        console.log("msg" in this);
    },
    methods: {
        random() {
            this.msg = Math.random();
        },
    },
};
</script>
