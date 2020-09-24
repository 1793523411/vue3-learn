<template>
<div>
    {{ plusOne }}
</div>
<button @click="plus">plus</button>
</template>

<script>
// import {
//     ref,
//     computed
// } from "vue";
// export default {
//     setup(props) {
//         const count = ref(1);
//         const plusOne = computed({
//             get: () => count.value + 1,
//             set: (val) => {
//                 console.log('触发set')
//                 count.value = val - 1;
//             },
//         });
//         plusOne.value = 1;
//         console.log(count.value); // 0
//     },
// };
import {
    ref,
    computed
} from "vue";
import {
    effect
} from '@vue/reactivity'
export default {
    setup() {
        // const count = ref(0);
        // const plusOne = computed(() => {
        //     return count.value + 1;
        // });

        // function plus() {
        //     count.value++;
        // }

        // const count = ref(0);
        // const plusOne = computed(() => {
        //     return count.value + 1;
        // });
        // const plusTwo = computed(() => {
        //     return plusOne.value + 1;
        // });
        // console.log(plusTwo.value);

        const count = ref(0);
        const plusOne = computed(() => {
            return count.value + 1;
        });
        effect(() => {
            console.log(plusOne.value + count.value);
        });

        function plus() {
            count.value++;
        }
        // plus();

        return {
            plusOne,
            //   plusTwo,
            plus,
        };
    },
};
</script>

<style>
</style>
