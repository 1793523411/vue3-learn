<template>
  <div>
    <button @click="change">change1</button>
    <!--<button @click="change2">change2</button>-->
    <!--count:{{ state.count }}-->
  </div>
</template>

<script>
import { reactive, watch, ref } from "vue";
export default {
  setup(props) {
    // const state = reactive({ count: 0 });
    // watch(
    //   () => state.count,
    //   (count, prevCount) => {
    //     alert(state.count);
    //   }
    // );

    const state = reactive({
      count: {
        a: {
          b: 1,
        },
      },
    });
    // watch(state.count, (count, prevCount) => {
    //   console.log("---", count);
    // });
    // state.count.a.b = 2;

    // 直接侦听 state.count.a.b 可以吗？答案是不行，因为 state.count.a.b 已经是一个基础数字类型了，不符合 source 要求的参数类型，所以会在非生产环境下报警告
    watch(state.count.a, (newVal, oldVal) => {
      console.log(newVal);
    });
    state.count.a.b = 2;

// 那么有没有办法优化使得 traverse 不执行呢？答案是可以的。我们可以侦听一个 getter 函数,这样函数内部会访问并返回 state.count.a.b，一次 traverse 都不会执行并且依然可以侦听到它的变化从而执行 watcher 的回调函数
    watch(
      () => state.count.a.b,
      (newVal, oldVal) => {
        console.log(newVal);
      }
    );
    state.count.a.b = 2;

    // const count2 = ref(0);
    // watch(count2, (count2, prevCount) => {
    //   alert(count2)
    // });

    // import { ref, watch } from "vue";
    // const count = ref(0);
    // const count2 = ref(1);
    // watch([count, count2], ([count, count2], [prevCount, prevCount2]) => {
    //   // 当 count.value 或者 count2.value 更新，会触发此回调函数
    // });

    function change() {
      //   state.count++;
    }
    // function change2() {
    //   count2++;
    // }
    return {
      state,
      //   count2,
      change,
      //   change2,
    };
  },
};
</script>

<style>
</style>