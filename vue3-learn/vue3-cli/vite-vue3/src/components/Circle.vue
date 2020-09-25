<template>
  <div>
    <div>
      <p>{{ count }}s</p>
    </div>
  </div>
</template>

<script>
// import { onMounted, onBeforeUnmount } from "vue";
// export default {
//   setup() {
//     // 做一些初始化工作
//     console.log('做一些初始化工作~')
//     onMounted(() => {
//       // 可以拿到 DOM 节点
//       console.log('可以拿到 DOM 节点')
//     });
//     onBeforeUnmount(() => {
//       // 做一些清理操作
//       console.log('做一些清理操作')
//     });
//   },
// };

import { ref, onBeforeUnmount } from "vue";
export default {
  setup() {
    const count = ref(0);
    const timer = setInterval(() => {
      console.log(count.value++);
    }, 1000);
    onBeforeUnmount(() => {
      clearInterval(timer);
    });
    return {
      count,
    };
  },
};
</script>

<style>
</style>