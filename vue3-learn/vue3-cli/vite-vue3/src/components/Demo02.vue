<template>
<div>
    <p>{{ msg }}</p>
    <button @click="onClick">Toggle</button>
</div>
</template>

<script>
export default {
    props: {
        msg: String,
    },
    setup(props, {
        emit
    }) {
        function onClick() {
            emit("toggle");
        }
        return {
            onClick,
        };
    },
};
</script>
