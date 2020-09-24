# 学习 vue.js 3.0

## vue.js 3.0 的优化

在迭代 2.x 版本的过程中，尤大发现了很多需要解决的痛点，比如源码自身的维护性，数据量大后带来的渲染和更新的性能问题，一些想舍弃但为了兼容一直保留的鸡肋 API 等；另外，尤大还希望能给开发人员带来更好的编程体验，比如更好的 TypeScript 支持、更好的逻辑复用实践等，所以他希望能从源码、性能和语法 API 三个大的方面优化框架

### 源码优化

Vue.js 3.0 ，整个源码是通过 monorepo 的方式维护的，根据功能将不同的模块拆分到 packages 目录下面不同的子目录中，对于 Vue.js 2.x 的源码组织方式，monorepo 把这些模块拆分到不同的 package 中，每个 package 有各自的 API、类型定义和测试。这样使得模块拆分更细化，职责划分更明确，模块之间的依赖关系也更加明确，开发人员也更容易阅读、理解和更改所有模块源码，提高代码的可维护性，另外一些 package（比如 reactivity 响应式库）是可以独立于 Vue.js 使用的，这样用户如果只想使用 Vue.js 3.0 的响应式能力，可以单独依赖这个响应式库而不用去依赖整个 Vue.js，减小了引用包的体积大小，而 Vue.js 2 .x 是做不到这一点的

源码的优化还体现在 Vue.js 3.0 自身采用了 TypeScript 开发， Vue.js 3.0 的时候抛弃 Flow 转而采用 TypeScript 重构了整个项目，Flow 是 Facebook 出品的 JavaScript 静态类型检查工具，它可以以非常小的成本对已有的 JavaScript 代码迁入，非常灵活，这也是 Vue.js 2.0 当初选型它时一方面的考量。但是 Flow 对于一些复杂场景类型的检查，支持得并不好。记得在看 Vue.js 2.x 源码的时候，在某行代码的注释中看到了对 Flow 的吐槽，比如在组件更新 props 的地方出现了

`const propOptions: any = vm.$options.props // wtf flow?`

由于这里 Flow 并没有正确推导出 vm.\$options.props 的类型 ，开发人员不得不强制申明 propsOptions 的类型为 any，显得很不合理

Vue.js 3.0 抛弃 Flow 后，使用 TypeScript 重构了整个项目。 TypeScript 提供了更好的类型检查，能支持复杂的类型推导；由于源码就使用 TypeScript 编写，也省去了单独维护 d.ts 文件的麻烦；就整个 TypeScript 的生态来看，TypeScript 团队也是越做越好,TypeScript 本身保持着一定频率的迭代和更新，支持的 feature 也越来越多

### 性能优化

首先是源码体积优化，我们在平时工作中也经常会尝试优化静态资源的体积，因为 JavaScript 包体积越小，意味着网络传输时间越短，JavaScript 引擎解析包的速度也越快，首先，移除一些冷门的 feature（比如 filter、inline-template 等），其次，引入 tree-shaking 的技术，减少打包体积

其次是数据劫持优化。Vue.js 区别于 React 的一大特色是它的数据是响应式的，这个特性从 Vue.js 1.x 版本就一直伴随着，这也是 Vue.js 粉喜欢 Vue.js 的原因之一，DOM 是数据的一种映射，数据发生变化后可以自动更新 DOM，用户只需要专注于数据的修改，没有其余的心智负担，Vue.js 1.x 和 Vue.js 2.x 内部都是通过 Object.defineProperty 这个 API 去劫持数据的 getter 和 setter，但这个 API 有一些缺陷，它必须预先知道要拦截的 key 是什么，所以它并不能检测对象属性的添加和删除。尽管 Vue.js 为了解决这个问题提供了 $set 和 $delete 实例方法，但是对于用户来说，还是增加了一定的心智负担，另外 Object.defineProperty 的方式还有一个问题，举个例子，比如这个嵌套层级比较深的对象，由于 Vue.js 无法判断你在运行时到底会访问到哪个属性，所以对于这样一个嵌套层级较深的对象，如果要劫持它内部深层次的对象变化，就需要递归遍历这个对象，执行 Object.defineProperty 把每一层对象数据都变成响应式的。毫无疑问，如果我们定义的响应式数据过于复杂，这就会有相当大的性能负担

**为了解决上述 2 个问题，Vue.js 3.0 使用了 Proxy API 做数据劫持**，但要注意的是，Proxy API 并不能监听到内部深层次的对象变化，因此 Vue.js 3.0 的处理方式是在 getter 中去递归响应式，这样的好处是真正访问到的内部对象才会变成响应式，而不是无脑递归，这样无疑也在很大程度上提升了性能

最后是编译优化，想优化整个 Vue.js 的运行时，除了数据劫持部分的优化，我们可以在耗时相对较多的 patch 阶段想办法，Vue.js 3.0 也是这么做的，并且它通过在编译阶段优化编译的结果，来实现运行时 patch 过程的优化，；ue.js 3.0 通过编译阶段对静态模板的分析，编译生成了 Block tree。Block tree 是一个将模版基于动态节点指令切割的嵌套区块，每个区块内部的节点结构是固定的，而且每个区块只需要以一个 Array 来追踪自身包含的动态节点。借助 Block tree，Vue.js 将 vnode 更新性能由与模版整体大小相关提升为与**动态内容的数量相关**，这是一个非常大的性能突破；Vue.js 3.0 在编译阶段还包含了对 Slot 的编译优化、事件侦听函数的缓存优化，并且在运行时重写了 diff 算法

### 语法 API 优化：Composition API

首先，是优化逻辑组织，在 Vue.js 1.x 和 2.x 版本中，编写组件本质就是在编写一个“包含了描述组件选项的对象”，我们把它称为 Options API，它的好处是在于写法非常符合直觉思维，Vue.js 3.0 提供了一种新的 API：Composition API，将某个逻辑关注点相关的代码全都放在一个函数里，这样当需要修改一个功能时，就不再需要在文件中跳来跳去

其次，是优化逻辑复用，当我们开发项目变得复杂的时候，免不了需要抽象出一些复用的逻辑。在 Vue.js 2.x 中，我们通常会用 mixins 去复用逻辑，使用单个 mixin 似乎问题不大，但是当我们一个组件混入大量不同的 mixins 的时候，会存在两个非常明显的问题：命名冲突和数据来源不清晰，首先每个 mixin 都可以定义自己的 props、data，它们之间是无感的，所以很容易定义相同的变量，导致命名冲突。另外对组件而言，如果模板中使用不在当前组件中定义的变量，那么就会不太容易知道这些变量在哪里定义的，这就是数据来源不清晰。但是 Vue.js 3.0 设计的 Composition API，就很好地帮助我们解决了 mixins 的这两个问题

Composition API 除了在逻辑复用方面有优势，也会有更好的类型支持，因为它们都是一些函数，在调用函数时，自然所有的类型就被推导出来了，不像 Options API 所有的东西使用 this。另外，Composition API 对 tree-shaking 友好，代码也更容易压缩，Composition API 属于 API 的增强，它并不是 Vue.js 3.0 组件开发的范式，如果你的组件足够简单，你还是可以使用 Options API

### 引入 RFC：使每个版本改动可控

## 组件渲染：vnode 到真实 DOM 是如何转变的

```js
// 在 Vue.js 3.0 中，初始化一个应用的方式如下
import { createApp } from "vue";
import App from "./app";
const app = createApp(App);
app.mount("#app");
```

createApp 主要做了两件事情：创建 app 对象和重写 app.mount 方法

### 创建 app 对象

首先，我们使用 ensureRenderer().createApp() 来创建 app 对象,其中 ensureRenderer() 用来创建一个渲染器对象,先用 ensureRenderer() 来延时创建渲染器，这样做的好处是当用户只依赖响应式包的时候，就不会创建渲染器，因此可以通过 tree-shaking 的方式移除核心渲染逻辑相关的代码,这里涉及了渲染器的概念，它是为跨平台渲染做准备的,可以简单地把渲染器理解为包含平台渲染核心逻辑的 JavaScript 对象

在 Vue.js 3.0 内部通过 createRenderer 创建一个渲染器，这个渲染器内部会有一个 createApp 方法，它是执行 createAppAPI 方法返回的函数，接受了 rootComponent 和 rootProps 两个参数，我们在应用层面执行 createApp(App) 方法时，会把 App 组件对象作为根组件传递给 rootComponent。这样，createApp 内部就创建了一个 app 对象，它会提供 mount 方法，这个方法是用来挂载组件的

在整个 app 对象创建过程中，Vue.js 利用闭包和函数柯里化的技巧，很好地实现了参数保留。比如，在执行 app.mount 的时候，并不需要传入渲染器 render，这是因为在执行 createAppAPI 的时候渲染器 render 参数已经被保留下来了

### 重写 app.mount 方法

根据前面的分析，我们知道 createApp 返回的 app 对象已经拥有了 mount 方法了，但在入口函数中，接下来的逻辑却是对 app.mount 方法的重写,这是因为 Vue.js 不仅仅是为 Web 平台服务，它的目标是支持跨平台渲染，而 createApp 函数内部的 app.mount 方法是一个标准的可跨平台的组件渲染流程,标准的跨平台渲染流程是先创建 vnode，再渲染 vnode。此外参数 rootContainer 也可以是不同类型的值，比如，在 Web 平台它是一个 DOM 对象，而在其他平台（比如 Weex 和小程序）中可以是其他类型的值。所以这里面的代码不应该包含任何特定平台相关的逻辑，也就是说这些代码的执行逻辑都是与平台无关的。因此我们需要在外部重写这个方法，来完善 Web 平台下的渲染逻辑

看 app.mount 重写都做了哪些事情,首先是通过 normalizeContainer 标准化容器（这里可以传字符串选择器或者 DOM 对象，但如果是字符串选择器，就需要把它转成 DOM 对象，作为最终挂载的容器），然后做一个 if 判断，如果组件对象没有定义 render 函数和 template 模板，则取容器的 innerHTML 作为组件模板内容；接着在挂载前清空容器内容，最终再调用 app.mount 的方法走标准的组件渲染流程,重写的逻辑都是和 Web 平台相关的，所以要放在外部实现。此外，这么做的目的是既能让用户在使用 API 时可以更加灵活，也兼容了 Vue.js 2.x 的写法，比如 app.mount 的第一个参数就同时支持选择器字符串和 DOM 对象两种类型

从 app.mount 开始，才算真正进入组件渲染流程,核心渲染流程做的两件事情：创建 vnode 和渲染 vnode

### 核心渲染流程,创建 vnode

Vue.js 3.0 内部还针对 vnode 的 type，做了更详尽的分类，包括 Suspense、Teleport 等，且把 vnode 的类型信息做了编码，以便在后面的 patch 阶段，可以根据不同的类型执行相应的处理逻辑,vnode 的性能一定比手动操作原生 DOM 好，这个其实是不一定的,因为，首先这种基于 vnode 实现的 MVVM 框架，在每次 render to vnode 的过程中，渲染组件会有一定的 JavaScript 耗时，特别是大组件，比如一个 1000 _ 10 的 Table 组件，render to vnode 的过程会遍历 1000 _ 10 次去创建内部 cell vnode，整个耗时就会变得比较长，加上 patch vnode 的过程也会有一定的耗时，当我们去更新组件的时候，用户会感觉到明显的卡顿。虽然 diff 算法在减少 DOM 操作方面足够优秀，但最终还是免不了操作 DOM，所以说性能并不是 vnode 的优势

Vue.js 内部是如何创建这些 vnode 的呢？

回顾 app.mount 函数的实现，内部是通过 createVNode 函数创建了根组件的 vnode,createVNode 做的事情很简单，就是：对 props 做标准化处理、对 vnode 的类型信息编码、创建 vnode 对象，标准化子节点 children 。我们现在拥有了这个 vnode 对象，接下来要做的事情就是把它渲染到页面中去

### 核心渲染流程,渲染 vnode

渲染函数 render 的实现很简单，如果它的第一个参数 vnode 为空，则执行销毁组件的逻辑，否则执行创建或者更新组件的逻辑,patch 本意是打补丁的意思，这个函数有两个功能，一个是根据 vnode 挂载 DOM，一个是根据新旧 vnode 更新 DOM,在创建的过程中，patch 函数接受多个参数，这里我们目前只重点关注前三个：第一个参数 n1 表示旧的 vnode，当 n1 为 null 的时候，表示是一次挂载的过程,第二个参数 n2 表示新的 vnode 节点，后续会根据这个 vnode 类型执行不同的处理逻辑,第三个参数 container 表示 DOM 容器，也就是 vnode 渲染生成 DOM 后，会挂载到 container 下面,对于渲染的节点，我们这里重点关注两种类型节点的渲染逻辑：对组件的处理和对普通 DOM 元素的处理

先来看对组件的处理。由于初始化渲染的是 App 组件，它是一个组件 vnode,首先是用来处理组件的 processComponent 函数,该函数的逻辑很简单，如果 n1 为 null，则执行挂载组件的逻辑，否则执行更新组件的逻辑,我们接着来看挂载组件的 mountComponent 函数,挂载组件函数 mountComponent 主要做三件事情：创建组件实例、设置组件实例、设置并运行带副作用的渲染函数

首先是**创建组件实例**，Vue.js 3.0 虽然不像 Vue.js 2.x 那样通过类的方式去实例化组件，但内部也通过对象的方式去创建了当前渲染的组件实例,其次**设置组件实例**，instance 保留了很多组件相关的数据，维护了组件的上下文，包括对 props、插槽，以及其他实例的属性的初始化处理。最后是**运行带副作用的渲染函数** setupRenderEffect,该函数利用响应式库的 effect 函数创建了一个副作用渲染函数 componentEffect,副作用，这里你可以简单地理解为，当组件的数据发生变化时，effect 函数包裹的内部渲染函数 componentEffect 会重新执行一遍，从而达到重新渲染组件的目的,渲染函数内部也会判断这是一次初始渲染还是组件更新。这里我们只分析初始渲染流程

初始渲染主要做两件事情：渲染组件生成 subTree、把 subTree 挂载到 container 中

首先，是渲染组件生成 subTree，它也是一个 vnode 对象。这里要注意别把 subTree 和 initialVNode 弄混了（其实在 Vue.js 3.0 中，根据命名我们已经能很好地区分它们了，而在 Vue.js 2.x 中它们分别命名为 \_vnode 和 \$vnode）

处理普通 DOM 元素的 processElement 函数,该函数的逻辑很简单，如果 n1 为 null，走挂载元素节点的逻辑，否则走更新元素节点逻辑,挂载元素的 mountElement 函数,挂载元素函数主要做四件事：创建 DOM 元素节点、处理 props、处理 children、挂载 DOM 元素到 container 上

首先是创建 DOM 元素节点，通过 hostCreateElement 方法创建，这是一个平台相关的方法,web 环境下，它调用了底层的 DOM API document.createElement 创建元素，所以本质上 Vue.js 强调不去操作 DOM ，只是希望用户不直接碰触 DOM，它并没有什么神奇的魔法，底层还是会操作 DOM，另外，如果是其他平台比如 Weex，hostCreateElement 方法就不再是操作 DOM ，而是平台相关的 API 了，这些平台相关的方法是在创建渲染器阶段作为参数传入的，创建完 DOM 节点后，接下来要做的是判断如果有 props 的话，给这个 DOM 节点添加相关的 class、style、event 等属性，并做相关的处理，这些逻辑都是在 hostPatchProp 函数内部做的，这里就不展开讲了

接下来是对子节点的处理，我们知道 DOM 是一棵树，vnode 同样也是一棵树，并且它和 DOM 结构是一一映射的，如果子节点是纯文本，则执行 hostSetElementText 方法，它在 Web 环境下通过设置 DOM 元素的 textContent 属性设置文本，如果子节点是数组，则执行 mountChildren 方法，子节点的挂载逻辑同样很简单，遍历 children 获取到每一个 child，然后递归执行 patch 方法挂载每一个 child 。注意，这里有对 child 做预处理的情况

mountChildren 函数的第二个参数是 container，而我们调用 mountChildren 方法传入的第二个参数是在 mountElement 时创建的 DOM 节点，这就很好地建立了父子关系，另外，通过递归 patch 这种深度优先遍历树的方式，我们就可以构造完整的 DOM 树，完成组件的渲染，处理完所有子节点后，最后通过 hostInsert 方法把创建的 DOM 元素节点挂载到 container 上，web 环境下会做一个 if 判断，如果有参考元素 anchor，就执行 parent.insertBefore ，否则执行 parent.appendChild 来把 child 添加到 parent 下，完成节点的挂载，因为 insert 的执行是在处理子节点后，所以挂载的顺序是先子节点，后父节点，最终挂载到最外层的容器上

在 mountChildren 的时候递归执行的是 patch 函数，而不是 mountElement 函数，这是因为子节点可能有其他类型的 vnode，比如组件 vnode

![](img/01.png)

## 组件更新：完整的 DOM diff 流程是怎样的

件渲染的过程本质上就是把各种类型的 vnode 渲染成真实 DOM。我们也知道了组件是由模板、组件描述对象和数据构成的，数据的变化会影响组件的变化。组件的渲染过程中创建了一个带副作用的渲染函数，当数据变化的时候就会执行这个渲染函数来触发组件的更新。那么接下来，我们就具体分析一下组件的更新过程

### 副作用渲染函数更新组件的过程

带副作用渲染函数 setupRenderEffect，我们要重点关注更新组件部分的逻辑，更新组件主要做三件事情：更新组件 vnode 节点、渲染新的子树 vnode、根据新旧子树 vnode 执行 patch 逻辑

### 核心逻辑：patch 流程

首先判断新旧节点是否是相同的 vnode 类型，如果不同，比如一个 div 更新成一个 ul，那么最简单的操作就是删除旧的 div 节点，再去挂载新的 ul 节点。如果是相同的 vnode 类型，就需要走 diff 更新流程了，接着会根据不同的 vnode 类型执行不同的处理逻辑，这里我们仍然只分析普通元素类型和组件类型的处过程

#### 1. 处理组件

更新过程也是一个树的深度优先遍历过程，更新完当前节点后，就会遍历更新它的子节点，执行 processComponent，processComponent 主要通过执行 updateComponent 函数来更新子组件，updateComponent 函数在更新子组件的时候，会先执行 shouldUpdateComponent 函数，根据新旧子组件 vnode 来判断是否需要更新子组件，在 shouldUpdateComponent 函数的内部，主要是通过检测和对比组件 vnode 中的 props、chidren、dirs、transiton 等属性，来决定子组件是否需要更新

我们接着看 updateComponent 函数，如果 shouldUpdateComponent 返回 true ，那么在它的最后，先执行 invalidateJob（instance.update）避免子组件由于自身数据变化导致的重复更新，然后又执行了子组件的副作用渲染函数 instance.update 来主动触发子组件的更新

我们在更新组件的 DOM 前，需要先更新组件 vnode 节点信息，包括更改组件实例的 vnode 指针、更新 props 和更新插槽等一系列操作，因为组件在稍后执行 renderComponentRoot 时会重新渲染新的子树 vnode ，它依赖了更新后的组件 vnode 中的 props 和 slots 等数据

所以我们现在知道了一个组件重新渲染可能会有两种场景，一种是组件本身的数据变化，这种情况下 next 是 null；另一种是父组件在更新的过程中，遇到子组件节点，先判断子组件是否需要更新，如果需要则主动执行子组件的重新渲染方法，这种情况下 next 就是新的子组件 vnode

你可能还会有疑问，这个子组件对应的新的组件 vnode 是什么时候创建的呢？答案很简单，它是在父组件重新渲染的过程中，通过 renderComponentRoot 渲染子树 vnode 的时候生成，因为子树 vnode 是个树形结构，通过遍历它的子节点就可以访问到其对应的组件 vnode

所以 processComponent 处理组件 vnode，本质上就是去判断子组件是否需要更新，如果需要则递归执行子组件的副作用渲染函数来更新，否则仅仅更新一些 vnode 的属性，并让子组件实例保留对组件 vnode 的引用，用于子组件自身数据变化引起组件重新渲染的时候，在渲染函数内部可以拿到新的组件 vnode

组件是抽象的，组件的更新最终还是会落到对普通 DOM 元素的更新。所以接下来我们详细分析一下组件更新中对普通元素的处理流程

#### 2. 处理普通元素

更新元素的过程主要做两件事情：更新 props 和更新子节点。其实这是很好理解的，因为一个 DOM 节点元素就是由它自身的一些属性和子节点构成的，首先是更新 props，这里的 patchProps 函数就是在更新 DOM 节点的 class、style、event 以及其它的一些 DOM 属性

其次是更新子节点，来看一下这里的 patchChildren 函数，对于一个元素的子节点 vnode 可能会有三种情况：纯文本、vnode 数组和空。那么根据排列组合对于新旧子节点来说就有九种情况

首先来看一下旧子节点是纯文本的情况：

- 如果新子节点也是纯文本，那么做简单地文本替换即可；

- 如果新子节点是空，那么删除旧子节点即可；

- 如果新子节点是 vnode 数组，那么先把旧子节点的文本清空，再去旧子节点的父容器下添加多个新子节点。

接下来看一下旧子节点是空的情况：

- 如果新子节点是纯文本，那么在旧子节点的父容器下添加新文本节点即可；

- 如果新子节点也是空，那么什么都不需要做；

- 如果新子节点是 vnode 数组，那么直接去旧子节点的父容器下添加多个新子节点即可。

最后来看一下旧子节点是 vnode 数组的情况：

- 如果新子节点是纯文本，那么先删除旧子节点，再去旧子节点的父容器下添加新文本节点；

- 如果新子节点是空，那么删除旧子节点即可；

- 如果新子节点也是 vnode 数组，那么就需要做完整的 diff 新旧子节点了，这是最复杂的情况，内部运用了核心 diff 算法。

## 复杂的 diff 算法

新子节点数组相对于旧子节点数组的变化，无非是通过更新、删除、添加和移动节点来完成，而核心 diff 算法，就是在已知旧子节点的 DOM 结构、vnode 和新子节点的 vnode 情况下，以较低的成本完成子节点的更新为目的，求解生成新子节点 DOM 的系列操作

对于相同的节点，我们只需要做对比更新即可，所以 diff 算法的第一步从头部开始同步

### 同步头部节点

在整个 diff 的过程，我们需要维护几个变量：头部的索引 i、旧子节点的尾部索引 e1 和新子节点的尾部索引 e2，同步头部节点就是从头部开始，依次对比新节点和旧节点，如果它们相同的则执行 patch 更新节点；如果不同或者索引 i 大于索引 e1 或者 e2，则同步过程结束

### 同步尾部节点

接着从尾部开始同步尾部节点，同步尾部节点就是从尾部开始，依次对比新节点和旧节点，如果相同的则执行 patch 更新节点；如果不同或者索引 i 大于索引 e1 或者 e2，则同步过程结束

### 添加新的节点

首先要判断新子节点是否有剩余的情况，如果满足则添加新子节点，如果索引 i 大于尾部索引 e1 且 i 小于 e2，那么从索引 i 开始到索引 e2 之间，我们直接挂载新子树这部分的节点

### 删除多余节点

如果不满足添加新节点的情况，我就要接着判断旧子节点是否有剩余，如果满足则删除旧子节点，如果索引 i 大于尾部索引 e2，那么从索引 i 开始到索引 e1 之间，我们直接删除旧子树这部分的节点。

### 处理未知子序列

单纯的添加和删除节点都是比较理想的情况，操作起来也很容易，但是有些时候并非这么幸运，我们会遇到比较复杂的未知子序列，这时候 diff 算法会怎么做呢

其实无论多复杂的情况，最终无非都是通过更新、删除、添加、移动这些动作来操作节点，而我们要做的就是找到相对优的解,当两个节点类型相同时，我们执行更新操作；当新子节点中没有旧子节点中的某些节点时，我们执行删除操作；当新子节点中多了旧子节点中没有的节点时，我们执行添加操作，这些操作我们在前面已经阐述清楚了。相对来说这些操作中最麻烦的就是移动，我们既要判断哪些节点需要移动也要清楚如何移动

#### 移动子节点

那么什么时候需要移动呢，就是当子节点排列顺序发生变化的时候

```js
var prev = [1, 2, 3, 4, 5, 6];
var next = [1, 3, 2, 6, 4, 5];
```

可以看到，从 prev 变成 next，数组里的一些元素的顺序发生了变化，我们可以把子节点类比为元素，现在问题就简化为我们如何用最少的移动使元素顺序从 prev 变化为 next ,一种思路是在 next 中找到一个递增子序列，比如 [1, 3, 6] 、[1, 2, 4, 5]。之后对 next 数组进行倒序遍历，移动所有不在递增序列中的元素即可,递增子序列越长，所需要移动元素的次数越少，所以如何移动的问题就回到了求解最长递增子序列的问题

我们现在要做的是在新旧子节点序列中找出相同节点并更新，找出多余的节点删除，找出新的节点添加，找出是否有需要移动的节点，如果有该如何移动,在查找过程中需要对比新旧子序列，那么我们就要遍历某个序列，如果在遍历旧子序列的过程中需要判断某个节点是否在新子序列中存在，这就需要双重循环，而双重循环的复杂度是 O(n2) ，为了优化这个复杂度，我们可以用一种空间换时间的思路，建立索引图，把时间复杂度降低到 O(n)。\*\*\*\*

#### 建立索引图

通常我们在开发过程中， 会给 v-for 生成的列表中的每一项分配唯一 key 作为项的唯一 ID，这个 key 在 diff 过程中起到很关键的作用。对于新旧子序列中的节点，我们认为 key 相同的就是同一个节点，直接执行 patch 更新即可

#### 更新和移除旧节点

接下来，我们就需要遍历旧子序列，有相同的节点就通过 patch 更新，并且移除那些不在新子序列中的节点，同时找出是否有需要移动的节点

我们建立了一个 newIndexToOldIndexMap 的数组，来存储新子序列节点的索引和旧子序列节点的索引之间的映射关系，用于确定最长递增子序列，这个数组的长度为新子序列的长度，每个元素的初始值设为 0， 它是一个特殊的值，如果遍历完了仍有元素的值为 0，则说明遍历旧子序列的过程中没有处理过这个节点，这个节点是新添加的

下面我们说说具体的操作过程：正序遍历旧子序列，根据前面建立的 keyToNewIndexMap(一个 map) 查找旧子序列中的节点在新子序列中的索引，如果找不到就说明新子序列中没有该节点，就删除它；如果找得到则将它在旧子序列中的索引更新到 newIndexToOldIndexMap 中

遍历过程中，我们用变量 maxNewIndexSoFar 跟踪判断节点是否移动，maxNewIndexSoFar 始终存储的是上次求值的 newIndex，一旦本次求值的 newIndex 小于 maxNewIndexSoFar，这说明顺序遍历旧子序列的节点在新子序列中的索引并不是一直递增的，也就说明存在移动的情况，除此之外，这个过程中我们也会更新新旧子序列中匹配的节点，另外如果所有新的子序列节点都已经更新，而对旧子序列遍历还未结束，说明剩余的节点就是多余的，删除即可

至此，我们完成了新旧子序列节点的更新、多余旧节点的删除，并且建立了一个 newIndexToOldIndexMap 存储新子序列节点的索引和旧子序列节点的索引之间的映射关系，并确定是否有移动

#### 移动和挂载新节点

接下来，就到了处理未知子序列的最后一个流程，移动和挂载新节点，我们前面已经判断了是否移动，如果 moved 为 true 就通过 getSequence(newIndexToOldIndexMap) 计算最长递增子序列

接着我们采用倒序的方式遍历新子序列，因为倒序遍历可以方便我们使用最后更新的节点作为锚点。在倒序的过程中，锚点指向上一个更新的节点，然后判断 `newIndexToOldIndexMap[i]` 是否为 0，如果是则表示这是新节点，就需要挂载它；接着判断是否存在节点移动的情况，如果存在的话则看节点的索引是不是在最长递增子序列中，如果在则倒序最长递增子序列，否则把它移动到锚点的前面

新子序列倒序完成，即完成了新节点的插入和旧节点的移动操作，也就完成了整个核心 diff 算法对节点的更新

至此，我们就在已知旧子节点 DOM 结构和 vnode、新子节点 vnode 的情况下，求解出生成新子节点的 DOM 的更新、移动、删除、新增等系列操作，并且以一种较小成本的方式完成 DOM 更新,我们知道了子节点更新调用的是 patch 方法， Vue.js 正是通过这种递归的方式完成了整个组件树的更新。核心 diff 算法中最复杂就是求解最长递增子序列，下面我们再来详细学习一下这个算法

#### 最长递增子序列

求解最长递增子序列是一道经典的算法题，多数解法是使用动态规划的思想，算法的时间复杂度是 O(n2)，而 Vue.js 内部使用的是维基百科提供的一套“贪心 + 二分查找”的算法，贪心算法的时间复杂度是 O(n)，二分查找的时间复杂度是 O(logn)，所以它的总时间复杂度是 O(nlogn)

这个算法的主要思路：对数组遍历，依次求解长度为 i 时的最长递增子序列，当 i 元素大于 i - 1 的元素时，添加 i 元素并更新最长子序列；否则往前查找直到找到一个比 i 小的元素，然后插在该元素后面并更新对应的最长递增子序列,这种做法的主要目的是让递增序列的差尽可能的小，从而可以获得更长的递增子序列，这便是一种贪心算法的思想

Vue.js 3 在 diff 算法上和 Vue.js 2.x 已经不一样了，Vue.js 2.x 的 diff 算法是双端比较法 ,Vue 3 diff 算法的主要优势是设计了 Block 的概念，在编译阶段对静态模板分析，生成 Block tree，收集动态更新的节点，然后在 patch 阶段就可以只比对 Block tree 中的节点，达到提升 diff 性能的目的,而核心 diff 算法，也就是去头尾的最长递增子序列算法和双端比较算法就性能而言差别并不大。

## 逻辑复用:Composition API

Vue.js 3.0 设计了一个很强大的 API —— Composition API，它主要用来优化代码逻辑的组织和复用。

从语法上看，它提供了一个 setup 启动函数作为逻辑组织的入口，暴露了响应式 API 为用户所用，也提供了生命周期函数以及依赖注入的接口，这让我们不依托于 Options API 也可以完成一个组件的开发，并且更有利于代码逻辑的组织和复用,但是我们要明确一点，Composition API 属于 API 的增强，它并不是 Vue.js 3.0 组件开发的范式，如果你的组件足够简单，你还是可以使用 Options API

了解了 Composition API 的应用场景和使用方式后，我们需要进一步思考，这样一套 API 是如何设计出来的？它是怎么和组件配合的？在组件整个渲染过程中它又做了哪些事情？

## Setup：组件渲染前的初始化过程是怎样的？

Vue.js 3.0 允许我们在编写组件的时候添加一个 setup 启动函数，它是 Composition API 逻辑组织的入口

我们先来回想一下 Vue.js 2.x 编写组件的时候，会在 props、data、methods、computed 等 options 中定义一些变量。在组件初始化阶段，Vue.js 内部会处理这些 options，即把定义的变量添加到了组件实例上。等模板编译成 render 函数的时候，内部通过 with(this){} 的语法去访问在组件实例中的变量

那么到了 Vue.js 3.0，既支持组件定义 setup 函数，而且在模板 render 的时候，又可以访问到 setup 函数返回的值，这是如何实现的？我们来一探究竟

### 创建和设置组件实例

我们来回顾一下组件的渲染流程：创建 vnode 、渲染 vnode 和生成 DOM,其中渲染 vnode 的过程主要就是在挂载组件,挂载组件的代码主要做了三件事情：创建组件实例、设置组件实例和设置并运行带副作用的渲染函数,前两个流程就跟我们这里提到的问题息息相关

先看创建组件实例的流程，我们要关注 createComponentInstance 方法的实现，组件实例 instance 上定义了很多属性，你千万不要被这茫茫多的属性吓到，因为其中一些属性是为了实现某个场景或者某个功能所定义的，Vue.js 2.x 使用 new Vue 来初始化一个组件的实例，到了 Vue.js 3.0，我们直接通过创建对象去创建组件的实例。这两种方式并无本质的区别，都是引用一个对象，在整个组件的生命周期中去维护组件的状态数据和上下文环境，创建好 instance 实例后，接下来就是设置它的一些属性。目前已完成了组件的上下文、根组件指针以及派发事件方法的设置。我们在后面会继续分析更多 instance 实例属性的设置逻辑

接着是组件实例的设置流程，对 setup 函数的处理就在这里完成，我们来看一下 setupComponent 方法的实现，我们从组件 vnode 中获取了 props、children、shapeFlag 等属性，然后分别对 props 和插槽进行初始化，这两部分逻辑在后续的章节再详细分析。根据 shapeFlag 的值，我们可以判断这是不是一个有状态组件，如果是则要进一步去设置有状态组件的实例，接下来我们要关注到 setupStatefulComponent 函数，它主要做了三件事：创建渲染上下文代理、判断处理 setup 函数和完成组件实例设置

### 创建渲染上下文代理

首先是创建渲染上下文代理的流程，它主要对 instance.ctx 做了代理。在分析实现前，我们需要思考一个问题，这里为什么需要代理呢？其实在 Vue.js 2.x 中，也有类似的数据代理逻辑，比如 props 求值后的数据，实际上存储在 this.\_props 上，而 data 中定义的数据存储在 this.\_data 上，在初始化组件的时候，data 中定义的 msg 在组件内部是存储在 this.\_data 上的，而模板渲染的时候访问 this.msg，实际上访问的是 this.\_data.msg，这是因为 Vue.js 2.x 在初始化 data 的时候，做了一层 proxy 代理，到了 Vue.js 3.0，为了方便维护，我们把组件中不同状态的数据存储到不同的属性中，比如存储到 setupState、ctx、data、props 中。我们在执行组件渲染函数的时候，为了方便用户使用，会直接访问渲染上下文 instance.ctx 中的属性，所以我们也要做一层 proxy，对渲染上下文 instance.ctx 属性的访问和修改，代理到对 setupState、ctx、data、props 中的数据的访问和修改

明确了代理的需求后，我们接下来就要分析 proxy 的几个方法： get、set 和 has 当我们访问 instance.ctx 渲染上下文中的属性时，就会进入 get 函数。

函数首先判断 key 不以 $ 开头的情况，这部分数据可能是 setupState、data、props、ctx 中的一种，其中 data、props 我们已经很熟悉了；setupState 就是 setup 函数返回的数据，如果 key 不以 $ 开头，那么就依次判断 setupState、data、props、ctx 中是否包含这个 key，如果包含就返回对应值。注意这个判断顺序很重要，在 key 相同时它会决定数据获取的优先级，我们可以看到这里定义了 accessCache 作为渲染代理的属性访问缓存，它具体是干什么的呢？组件在渲染时会经常访问数据进而触发 get 函数，这其中最昂贵的部分就是多次调用 hasOwn 去判断 key 在不在某个类型的数据中，但是在普通对象上执行简单的属性访问相对要快得多。所以在第一次获取 key 对应的数据后，我们利用 `accessCache[key] `去缓存数据，下一次再次根据 key 查找数据，我们就可以直接通过 `accessCache[key] `获取对应的值，就不需要依次调用 hasOwn 去判断了。这也是一个性能优化的小技巧,如果 key 以 $ 开头，那么接下来又会有一系列的判断，首先判断是不是 Vue.js 内部公开的 $xxx 属性或方法（比如 $parent）；然后判断是不是 vue-loader 编译注入的 css 模块内部的 key；接着判断是不是用户自定义以 $ 开头的 key；最后判断是不是全局属性。如果都不满足，就剩两种情况了，即在非生产环境下就会报两种类型的警告，第一种是在 data 中定义的数据以 $ 开头的警告，因为 $ 是保留字符，不会做代理；第二种是在模板中使用的变量没有定义的警告

接下来是 set 代理过程，当我们修改 instance.ctx 渲染上下文中的属性的时候，就会进入 set 函数。我们来看一下 set 函数的实现,函数主要做的事情就是对渲染上下文 instance.ctx 中的属性赋值，它实际上是代理到对应的数据类型中去完成赋值操作的。这里仍然要注意顺序问题，和 get 一样，优先判断 setupState，然后是 data，接着是 props

最后是 has 代理过程，当我们判断属性是否存在于 instance.ctx 渲染上下文中时，就会进入 has 函数，这个在平时项目中用的比较少，同样来举个例子，当执行 created 钩子函数中的 'msg' in this 时，就会触发 has 函数,这个函数的实现很简单，依次判断 key 是否存在于 accessCache、data、setupState、props 、用户数据、公开属性以及全局属性中，然后返回结果。

至此，我们就搞清楚了创建上下文代理的过程，让我们回到 setupStatefulComponent 函数中，接下来分析第二个流程——判断处理 setup 函数

### 判断处理 setup 函数

如果我们在组件中定义了 setup 函数，接下来就是处理 setup 函数的流程，主要是三个步骤：创建 setup 函数上下文、执行 setup 函数并获取结果和处理 setup 函数的执行结果。接下来我们就逐个来分析

首先判断 setup 函数的参数长度，如果大于 1，则创建 setupContext 上下文,setupContext 对应的就是 setup 函数第二个参数

我们接下来看一下 setup 函数具体是如何执行的,它其实就是对 fn 做的一层包装，内部还是执行了 fn，并在有参数的时候传入参数，所以 setup 的第一个参数是 instance.props，第二个参数是 setupContext。函数执行过程中如果有 JavaScript 执行错误就会捕获错误，并执行 handleError 函数来处理,执行 setup 函数并拿到了返回的结果，那么接下来就要用 handleSetupResult 函数来处理结果,我们详细看一下 handleSetupResult 函数的实现

可以看到，当 setupResult 是一个对象的时候，我们把它变成了响应式并赋值给 instance.setupState，这样在模板渲染的时候，依据前面的代理规则，instance.ctx 就可以从 instance.setupState 上获取到对应的数据，这就在 setup 函数与模板渲染间建立了联系

另外 setup 不仅仅支持返回一个对象，也可以返回一个函数作为组件的渲染函数

在 handleSetupResult 的最后，会执行 finishComponentSetup 函数完成组件实例的设置，其实这个函数和 setup 函数的执行结果已经没什么关系了，提取到外面放在 handleSetupResult 函数后面执行更合理一些。另外当组件没有定义的 setup 的时候，也会执行 finishComponentSetup 函数去完成组件实例的设置

### 完成组件实例设置

接下来我们来看一下 finishComponentSetup 函数的实现,函数主要做了两件事情：标准化模板或者渲染函数和兼容 Options API。接下来我们详细分析这两个流程

#### 标准化模板或者渲染函数

因此 Vue.js 在 Web 端有两个版本：runtime-only 和 runtime-compiled。我们更推荐用 runtime-only 版本的 Vue.js，因为相对而言它体积更小，而且在运行时不用编译，不仅耗时更少而且性能更优秀。遇到一些不得已的情况比如上述提到的古老项目，我们也可以选择 runtime-compiled 版本,runtime-only 和 runtime-compiled 的主要区别在于是否注册了这个 compile 方法,在 Vue.js 3.0 中，compile 方法是通过外部注册的

回到标准化模板或者渲染函数逻辑，我们先看 instance.render 是否存在，如果不存在则开始标准化流程，这里主要需要处理以下三种情况。

- compile 和组件 template 属性存在，render 方法不存在的情况。此时， runtime-compiled 版本会在 JavaScript 运行时进行模板编译，生成 render 函数。

- compile 和 render 方法不存在，组件 template 属性存在的情况。此时由于没有 compile，这里用的是 runtime-only 的版本，因此要报一个警告来告诉用户，想要运行时编译得使用 runtime-compiled 版本的 Vue.js。

- 组件既没有写 render 函数，也没有写 template 模板，此时要报一个警告，告诉用户组件缺少了 render 函数或者 template 模板。

处理完以上情况后，就要把组件的 render 函数赋值给 instance.render。到了组件渲染的时候，就可以运行 instance.render 函数生成组件的子树 vnode 了

另外对于使用 with 块运行时编译的渲染函数，渲染上下文的代理是 RuntimeCompiledPublicInstanceProxyHandlers，它是在之前渲染上下文代理 PublicInstanceProxyHandlers 的基础上进行的扩展，主要对 has 函数的实现做了优化

这里如果 key 以 \_ 开头，或者 key 在全局变量的白名单内，则 has 为 false，此时则直接命中警告，不用再进行之前那一系列的判断了

#### Options API：兼容 Vue.js 2.x

我们知道 Vue.js 2.x 是通过组件对象的方式去描述一个组件，之前我们也说过，Vue.js 3.0 仍然支持 Vue.js 2.x Options API 的写法，这主要就是通过 applyOptions 方法实现的

## 响应式：响应式内部的实现原理是怎样的：收集依赖

除了组件化，Vue.js 另一个核心设计思想就是响应式。它的本质是当数据变化后会自动执行某个函数，映射到组件的实现就是，当数据变化后，会自动触发组件的重新渲染。响应式是 Vue.js 组件化更新渲染的一个核心机制

在介绍 Vue.js 3.0 响应式实现之前，我们先来回顾一下 Vue.js 2.x 响应式实现的部分： 它在内部通过 Object.defineProperty API 劫持数据的变化，在数据被访问的时候收集依赖，然后在数据被修改的时候通知依赖更新，在 Vue.js 2.x 中，Watcher 就是依赖，有专门针对组件渲染的 render watcher

Object.defineProperty API 的一些缺点：不能监听对象属性新增和删除；初始化阶段递归执行 Object.defineProperty 带来的性能负担，Vue.js 3.0 为了解决 Object.defineProperty 的这些缺陷，使用 Proxy API 重写了响应式部分，并独立维护和发布整个 reactivity 库

### 响应式对象的实现差异

在 Vue.js 2.x 中构建组件时，只要我们在 data、props、computed 中定义数据，那么它就是响应式的，在 data 中定义数据最终也是挂载到组件实例 this 上，这和我直接在 created 钩子函数通过 this.xxx 定义的数据唯一区别就是，在 data 中定义的数据是响应式的，我们在 created 中定义的 this.msg 并不是响应式对象，所以 Vue.js 内部不会对它做额外的处理。而 data 中定义的数据，Vue.js 内部在组件初始化的过程中会把它变成响应式，这是一个相对黑盒的过程，用户通常不会感知到

在一些场景下，如果我们仅仅想在组件上下文中共享某个变量，而不必去监测它的变化，这时就特别适合在 created 钩子函数中去定义这个变量，因为创建响应式的过程是有性能代价的，这相当于一种 Vue.js 应用的性能优化小技巧，你掌握了这一点就可以在合适的场景中应用了，到了 Vue.js 3.0 构建组件时，你可以不依赖于 Options API，而使用 Composition API 去编写，Composition API 更推荐用户主动定义响应式对象，而非内部的黑盒处理。这样用户可以更加明确哪些数据是响应式的，如果你不想让数据变成响应式，就定义成它的原始数据类型即可

也就是在 Vue.js 3.0 中，我们用 reactive 这个有魔力的函数，把数据变成了响应式，那么它内部到底是怎么实现的呢？我们接下来一探究竟

### Reactive API

reactive 内部通过 createReactiveObject 函数把 target 变成了一个响应式对象，在这个过程中，createReactiveObject 函数主要做了以下几件事情：1.函数首先判断 target 是不是数组或者对象类型，如果不是则直接返回。所以原始数据 target 必须是对象或者数组，2.如果对一个已经是响应式的对象再次执行 reactive，还应该返回这个响应式对象，3.如果对同一个原始数据多次执行 reactive ，那么会返回相同的响应式对象，4.使用 canObserve 函数对 target 对象做一进步限制

2.可以看到 observed 已经是响应式结果了，如果对它再去执行 reactive，返回的值 observed2 和 observed 还是同一个对象引，因为这里 reactive 函数会通过 target.**v_raw 属性来判断 target 是否已经是一个响应式对象（因为响应式对象的 **v_raw 属性会指向它自身，后面会提到），如果是的话则直接返回响应式对象

3.可以看到，原始数据 original 被反复执行 reactive，但是响应式结果 observed 和 observed2 是同一个对象，所以这里 reactive 函数会通过 target.**v_reactive 判断 target 是否已经有对应的响应式对象（因为创建完响应式对象后，会给原始对象打上 **v_reactive 标识，后面会提到），如果有则返回这个响应式对象

4.比如，带有 \_\_v_skip 属性的对象、被冻结的对象，以及不在白名单内的对象如 Date 类型的对象实例是不能变成响应式的

5.通过 Proxy API 劫持 target 对象，把它变成响应式。我们把 Proxy 函数返回的结果称作响应式对象，这里 Proxy 对应的处理器对象会根据数据类型的不同而不同，我们稍后会重点分析基本数据类型的 Proxy 处理器对象，reactive 函数传入的 baseHandlers 值是 mutableHandler

6.给原始数据打个标识，这就是前面“对同一个原始数据多次执行 reactive ，那么会返回相同的响应式对象”逻辑的判断依据

仔细想想看，响应式的实现方式无非就是劫持数据，Vue.js 3.0 的 reactive API 就是通过 Proxy 劫持数据，而且由于 Proxy 劫持的是整个对象，所以我们可以检测到任何对对象的修改，弥补了 Object.defineProperty API 的不足

接下来，我们继续看 Proxy 处理器对象 mutableHandlers 的实现，它其实就是劫持了我们对 observed 对象的一些操作，比如

- 访问对象属性会触发 get 函数；
- 设置对象属性会触发 set 函数；
- 删除对象属性会触发 deleteProperty 函数；
- in 操作符会触发 has 函数；
- 通过 Object.getOwnPropertyNames 访问对象属性名会触发 ownKeys 函数。

因为无论命中哪个处理器函数，它都会做依赖收集和派发通知这两件事其中的一个，所以这里我只要分析常用的 get 和 set 函数就可以了

### 依赖收集：get 函数

依赖收集发生在数据访问的阶段，由于我们用 Proxy API 劫持了数据对象，所以当这个响应式对象属性被访问的时候就会执行 get 函数，我们来看一下 get 函数的实现，其实它是执行 createGetter 函数的返回值，为了分析主要流程，省略 get 函数中的一些分支逻辑，isReadonly 也默认为 false

get 函数主要做了四件事情，**首先对特殊的 key 做了代理**，这就是为什么我们在 createReactiveObject 函数中判断响应式对象是否存在 \_\_v_raw 属性，如果存在就返回这个响应式对象本身，**接着通过 Reflect.get 方法求值**，如果 target 是数组且 key 命中了 arrayInstrumentations，则执行对应的函数，我们可以大概看一下 arrayInstrumentations 的实现，也就是说，当 target 是一个数组的时候，我们去访问 target.includes、target.indexOf 或者 target.lastIndexOf 就会执行 arrayInstrumentations 代理的函数，除了调用数组本身的方法求值外，还对数组每个元素做了依赖收集。因为一旦数组的元素被修改，数组的这几个 API 的返回结果都可能发生变化，所以我们需要跟踪数组每个元素的变化，回到 get 函数，**第三步就是通过 Reflect.get 求值**，然后会执行 track 函数收集依赖，我们稍后重点分析这个过程

函数最后会对计算的值 res 进行判断，如果它也是数组或对象，则递归执行 reactive 把 res 变成响应式对象。这么做是因为 Proxy 劫持的是对象本身，并不能劫持子对象的变化，这点和 Object.defineProperty API 一致。但是 Object.defineProperty 是在初始化阶段，即定义劫持对象的时候就已经递归执行了，而 Proxy 是在对象属性被访问的时候才递归执行下一步 reactive，这其实是一种延时定义子对象响应式的实现，在性能上会有较大的提升

整个 get 函数最核心的部分其实是执行 track 函数收集依赖，下面我们重点分析这个过程，分析这个函数的实现前，我们先想一下要收集的依赖是什么，我们的目的是实现响应式，就是当数据变化的时候可以自动做一些事情，比如执行某些函数，所以我们收集的依赖就是数据变化后执行的副作用函数

再来看实现，我们把 target 作为原始的数据，key 作为访问的属性。我们创建了全局的 targetMap 作为原始数据对象的 Map，它的键是 target，值是 depsMap，作为依赖的 Map；这个 depsMap 的键是 target 的 key，值是 dep 集合，dep 集合中存储的是依赖的副作用函数

所以每次 track ，就是把当前激活的副作用函数 activeEffect 作为依赖，然后收集到 target 相关的 depsMap 对应 key 下的依赖集合 dep 中

## 响应式：响应式内部的实现原理是怎样的：派发更新

### reactive API

#### 派发通知：set 函数

派发通知发生在数据更新的阶段 ，由于我们用 Proxy API 劫持了数据对象，所以当这个响应式对象属性更新的时候就会执行 set 函数。我们来看一下 set 函数的实现，它是执行 createSetter **函数的返回值**,set 函数的实现逻辑很简单，主要就做两件事情， 首先通过 Reflect.set 求值 ， 然后通过 trigger 函数派发通知 ，并依据 key 是否存在于 target 上来确定通知类型，即新增还是修改,整个 set 函数最核心的部分就是 执行 trigger 函数派发通知 ，下面我们将重点分析这个过程。

我们先来看一下 trigger 函数的实现，为了分析主要流程，省略 trigger 函数中的一些分支逻辑,trigger 函数的实现也很简单，主要做了四件事情

- 通过 targetMap 拿到 target 对应的依赖集合 depsMap；
- 创建运行的 effects 集合；
- 根据 key 从 depsMap 中找到对应的 effects 添加到 effects 集合；
- 遍历 effects 执行相关的副作用函数。

所以每次 trigger 函数就是根据 target 和 key ，从 targetMap 中找到相关的所有副作用函数遍历执行一遍

在描述依赖收集和派发通知的过程中，我们都提到了一个词：副作用函数，依赖收集过程中我们把 activeEffect（当前激活副作用函数）作为依赖收集，它又是什么？接下来我们来看一下副作用函数的庐山真面目

#### 副作用函数

```js
import { reactive } from "vue";
const counter = reactive({
  num: 0,
});
function logCount() {
  console.log(counter.num);
}
function count() {
  counter.num++;
}
logCount();
count();
```

可以看到，这里我们定义了响应式对象 counter，然后我们在 logCount 中访问了 counter.num，我们希望通过执行 count 函数修改 counter.num 值的时候，能自动执行 logCount 函数。

按我们之前对依赖收集过程的分析，如果这个 logCount 就是 activeEffect 的话，那么就可以实现需求，但显然是做不到的，因为代码在执行到 console.log(counter.num)这一行 的时候，它对自己在 logCount 函数中的运行是一无所知的

其实只要我们运行 logCount 函数前，把 logCount 赋值给 activeEffect 就好了，如下：

```js
activeEffect = logCount;
logCount();
```

顺着这个思路，我们可以利用高阶函数的思想，对 logCount 做一层封装

```js
function wrapper(fn) {
  const wrapped = function (...args) {
    activeEffect = fn;
    fn(...args);
  };
  return wrapped;
}
const wrappedLog = wrapper(logCount);
wrappedLog();
```

这里，wrapper 本身也是一个函数，它接受 fn 作为参数，返回一个新的函数 wrapped，然后维护一个全局的 activeEffect，当 wrapped 执行的时候，把 activeEffect 设置为 fn，然后执行 fn 即可。这样当我们执行 wrappedLog 后，再去修改 counter.num，就会自动执行 logCount 函数了,实际上 Vue.js 3.0 就是采用类似的做法，在它内部就有一个 effect 副作用函数，我们来看一下它的实现

effect 内部通过执行 createReactiveEffect 函数去创建一个新的 effect 函数，为了和外部的 effect 函数区分，我们把它称作 reactiveEffect 函数，并且还给它添加了一些额外属性（我在注释中都有标明）。另外，effect 函数还支持传入一个配置参数以支持更多的 feature

这个 reactiveEffect 函数就是响应式的副作用函数，当执行 trigger 过程派发通知的时候，执行的 effect 就是它,按我们之前的分析，这个 reactiveEffect 函数只需要做两件事情： 把全局的 activeEffect 指向它 ， 然后执行被包装的原始函数 fn 即可,但实际上它的实现要更复杂一些，首先它会判断 effect 的状态是否是 active，这其实是一种控制手段，允许在非 active 状态且非调度执行情况，则直接执行原始函数 fn 并返回，在后续学习完侦听器后你会对它的理解更加深刻

接着判断 effectStack 中是否包含 effect，如果没有就把 effect 压入栈内。之前我们提到，只要设置 activeEffect = effect 即可，那么这里为什么要设计一个栈的结构呢,其实是考虑到嵌套 effect 的场景

针对嵌套 effect 的场景，我们不能简单地赋值 activeEffect，应该考虑到函数的执行本身就是一种入栈出栈操作，因此我们也可以设计一个 effectStack，这样每次进入 reactiveEffect 函数就先把它入栈，然后 activeEffect 指向这个 reactiveEffect 函数，接着在 fn 执行完毕后出栈，再把 activeEffect 指向 effectStack 最后一个元素，也就是外层 effect 函数对应的 reactiveEffect

这里我们还注意到一个细节，在入栈前会执行 cleanup 函数清空 reactiveEffect 函数对应的依赖 。在执行 track 函数的时候，除了收集当前激活的 effect 作为依赖，还通过 activeEffect.deps.push(dep) 把 dep 作为 activeEffect 的依赖，这样在 cleanup 的时候我们就可以找到 effect 对应的 dep 了，然后把 effect 从这些 dep 中删除

为什么需要 cleanup 呢？`vue3-learn\vue3-cli\vite-vue3\src\components\Clean.vue`,结合代码可以知道，这个组件的视图会根据 showMsg 变量的控制显示 msg 或者一个随机数，当我们点击 Switch View 的按钮时，就会修改这个变量值,假设没有 cleanup，在第一次渲染模板的时候，activeEffect 是组件的副作用渲染函数，因为模板 render 的时候访问了 state.msg，所以会执行依赖收集，把副作用渲染函数作为 state.msg 的依赖，我们把它称作 render effect。然后我们点击 Switch View 按钮，视图切换为显示随机数，此时我们再点击 Toggle Msg 按钮，由于修改了 state.msg 就会派发通知，找到了 render effect 并执行，就又触发了组件的重新渲染,但这个行为实际上并不符合预期，因为当我们点击 Switch View 按钮，视图切换为显示随机数的时候，也会触发组件的重新渲染，但这个时候视图并没有渲染 state.msg，所以对它的改动并不应该影响组件的重新渲染,因此在组件的 render effect 执行之前，如果通过 cleanup 清理依赖，我们就可以删除之前 state.msg 收集的 render effect 依赖。这样当我们修改 state.msg 时，由于已经没有依赖了就不会触发组件的重新渲染，符合预期

至此，我们从 reactive API 入手了解了整个响应式对象的实现原理。除了 reactive API，Vue.js 3.0 还提供了其他好用的响应式 API，接下来我们一起分析一些常用的

### readonly API

如果用 const 声明一个对象变量，虽然不能直接对这个变量赋值，但我们可以修改它的属。如果我们希望创建只读对象，不能修改它的属性，也不能给这个对象添加和删除属性，让它变成一个真正意义上的只读对象,显然，想实现上述需求就需要劫持对象，于是 Vue.js 3.0 在 reactive API 的基础上，设计并实现了 readonly API

其实 readonly 和 reactive 函数的主要区别，就是执行 createReactiveObject 函数时的参数 isReadonly 不同,首先 isReadonly 变量为 true，所以在创建过程中会给原始对象 target 打上一个 \_\_v_readonly 的标识。另外还有一个特殊情况，如果 target 已经是一个 reactive 对象，就会把它继续变成一个 readonly 响应式对象,其次就是 baseHandlers 的 collectionHandlers 的区别，我们这里仍然只关心基本数据类型的 Proxy 处理器对象，readonly 函数传入的 baseHandlers 值是 readonlyHandlers,readonlyHandlers 和 mutableHandlers 的区别主要在 get、set 和 deleteProperty 三个函数上。很显然，作为一个只读的响应式对象，是不允许修改属性以及删除属性的，所以在非生产环境下 set 和 deleteProperty 函数的实现都会报警告，提示用户 target 是 readonly 的

接下来我们来看一下其中 readonlyGet 的实现，它其实就是 createGetter(true) 的返回值,它和 reactive API 最大的区别就是不做依赖收集了，这一点也非常好理解，因为它的属性不会被修改，所以就不用跟踪它的变化了。

到这里，readonly API 就介绍完了，接下来我们分析一下另一个常用的响应式 API：ref

### ref API

通过前面的分析，我们知道 reactive API 对传入的 target 类型有限制，必须是对象或者数组类型，而对于一些基础类型（比如 String、Number、Boolean）是不支持的。但是有时候从需求上来说，可能我只希望把一个字符串变成响应式，却不得不封装成一个对象，这样使用上多少有一些不方便，于是 Vue.js 3.0 设计并实现了 ref API

ref 的实现:函数首先处理了嵌套 ref 的情况，如果传入的 rawValue 也是 ref，那么直接返回,接着对 rawValue 做了一层转换，如果 rawValue 是对象或者数组类型，那么把它转换成一个 reactive 对象,最后定义一个对 value 属性做 getter 和 setter 劫持的对象并返回，get 部分就是执行 track 函数做依赖收集然后返回它的值；set 部分就是设置新值并且执行 trigger 函数派发通知

其实 Vue.js 3.0 在响应式的实现思路和 Vue.js 2.x 差别并不大，主要就是 劫持数据的方式改成用 **Proxy 实现** ， 以及收集的依赖由 watcher 实例变成了组件**副作用渲染函数**

## 计算属性：计算属性比普通函数好在哪里

### 计算属性 API： computed

使用看代码

我们现在已经知道了 computed API 的两种使用方式了，接下来就看看它是怎样实现的，computed 函数的流程主要做了三件事情：标准化参数，创建副作用函数和创建 computed 对象。我们来详细分析一下这几个步骤

首先是标准化参数。computed 函数接受两种类型的参数，一个是 getter 函数，一个是拥有 getter 和 setter 函数的对象，通过判断参数的类型，我们初始化了函数内部定义的 getter 和 setter 函数

接着是创建副作用函数 runner。computed 内部通过 effect 创建了一个副作用函数，它是对 getter 函数做的一层封装，另外我们这里要注意第二个参数，也就是 effect 函数的配置对象。其中 lazy 为 true 表示 effect 函数返回的 runner 并不会立即执行；computed 为 true 用于表示这是一个 computed effect，用于 trigger 阶段的优先级排序，我们稍后会分析；scheduler 表示它的调度运行的方式，我们也稍后分析

最后是创建 computed 对象并返回，这个对象也拥有 getter 和 setter 函数。当 computed 对象被访问的时候会触发 getter，然后会判断是否 dirty，如果是就执行 runner，然后做依赖收集；当我们直接设置 computed 对象时会触发 setter，即执行 computed 函数内部定义的 setter 函数

### 计算属性的运行机制

computed 函数的逻辑会有一点绕，不过不要紧，我们可以结合一个应用 computed 计算属性的例子，来理解整个计算属性的运行机制。分析之前我们需要记住 computed 内部两个重要的变量，第一个 dirty 表示一个计算属性的值是否是“脏的”，用来判断需不需要重新计算，第二个 value 表示计算属性每次计算后的结果

computed API 内部创建副作用函数时，已经配置了 scheduler 函数

```js
scheduler: () => {
  if (!dirty) {
    dirty = true;
    // 派发通知，通知运行访问该计算属性的 activeEffect
    trigger(computed, "set" /* SET */, "value");
  }
};
```

它并没有对计算属性求新值，而仅仅是把 dirty 设置为 true，再执行 trigger(computed, "set" , 'value'),触发组件的重新渲染

通过以上分析，我们可以看出 computed 计算属性有两个特点：

- 延时计算，只有当我们访问计算属性的时候，它才会真正运行 computed getter 函数计算；

- 缓存，它的内部会缓存上次的计算结果 value，而且只有 dirty 为 true 时才会重新计算。如果访问计算属性时 dirty 为 false，那么直接返回这个 value。

和单纯使用普通函数相比，计算属性的优势是：只要依赖不变化，就可以使用缓存的 value 而不用每次在渲染组件的时候都执行函数去计算，这是典型的空间换时间的优化思想

### 嵌套计算属性

计算属性也支持嵌套,得益于 computed 这种巧妙的设计，无论嵌套多少层计算属性都可以正常工作。

### 计算属性的执行顺序

我们曾提到计算属性内部创建副作用函数的时候会配置 computed 为 true，标识这是一个 computed effect，用于在 trigger 阶段的优先级排序。我们来回顾一下 trigger 函数执行 effects 的过程,分析 trigger 函数的时候，为了方便你理解主干逻辑，我省略了 computedRunners 的分支逻辑。实际上，在添加待运行的 effects 的时候，我们会判断每一个 effect 是不是一个 computed effect，如果是的话会添加到 computedRunners 中，在后面运行的时候会优先执行 computedRunners，然后再执行普通的 effects

**computed runner 和 effect**

## 侦听器：侦听器的实现原理和使用场景

在平时的开发工作中，我们经常使用侦听器帮助我们去观察某个数据的变化然后去执行一段逻辑,在 Vue.js 2.x 中，你可以通过 watch 选项去初始化一个侦听器，称作 watcher,当然你也可以通过 $watch API 去创建一个侦听器,与 watch 选项不同，通过 $watch API 创建的侦听器 watcher 会返回一个 unwatch 函数，你可以随时执行它来停止这个 watcher 对数据的侦听，而对于 watch 选项创建的侦听器，它会随着组件的销毁而停止对数据的侦听

在 Vue.js 3.0 中，虽然你仍可以使用 watch 选项，但针对 Composition API，Vue.js 3.0 提供了 watch API 来实现侦听器的效果

### watch API 的用法

1.watch API 可以侦听一个 getter 函数，但是它必须返回一个响应式对象，当该响应式对象更新后，会执行对应的回调函数

2.watch API 也可以直接侦听一个响应式对象，当响应式对象更新后，会执行对应的回调函数。

3.watch API 还可以直接侦听多个响应式对象，任意一个响应式对象更新后，就会执行对应的回调函数。

### watch API 实现原理

侦听器的言下之意就是，当侦听的对象或者函数发生了变化则自动执行某个回调函数，这和我们前面说过的副作用函数 effect 很像， 那它的内部实现是不是依赖了 effect 呢？带着这个疑问，我们来探究 watch API 的具体实现,watch 函数内部调用了 doWatch 函数，调用前会在非生产环境下判断第二个参数 cb 是不是一个函数，如果不是则会报警告以告诉用户应该使用 watchEffect(fn, options) API，watchEffect API 也是侦听器相关的 API，稍后我们会详细介绍

doWatch 函数:

- 标准化 source
- 构造 applyCb 回调函数
- 创建 scheduler 时序执行函数
- 创建 effect 副作用函数
- 返回侦听器销毁函数

### 标准化 source

我们先来看 watch 函数的第一个参数 source,通过前文知道 source 可以是 getter 函数，也可以是响应式对象甚至是响应式对象数组，所以我们需要标准化 source，这是标准化 source 的流程,其实，source 标准化主要是根据 source 的类型，将其变成 标准成 getter 函数。具体来说：

- 如果 source 是 ref 对象，则创建一个访问 source.value 的 getter 函数;
- 如果 source 是 reactive 对象，则创建一个访问 source 的 getter 函数，并设置 deep 为 true（deep 的作用我稍后会说）;
- 如果 source 是一个函数，则会进一步判断第二个参数 cb 是否存在，对于 watch API 来说，cb 是一定存在且是一个回调函数，这种情况下，getter 就是一个简单的对 source 函数封装的函数。

如果 source 不满足上述条件，则在非生产环境下报警告，提示 source 类型不合法,最终标准化生成的 getter 函数，它会返回一个响应式对象，在后续创建 effect runner 副作用函数需要用到，每次执行 runner 就会把 getter 函数返回的响应式对象作为 watcher 求值的结果，effect runner 的创建流程我们后续会详细分析，这里不需要深入了解

最后我们来关注一下 deep 为 true 的情况。此时，我们会发现生成的 getter 函数会被 traverse 函数包装一层。traverse 函数的实现很简单，即通过递归的方式访问 value 的每一个子属性。那么，为什么要递归访问每一个子属性呢？其实 deep 属于 watcher 的一个配置选项，Vue.js 2.x 也支持，表面含义是深度侦听，实际上是通过遍历对象的每一个子属性来实现

当我们侦听一个通过 reactive API 创建的响应式对象时，内部会执行 traverse 函数，如果这个对象非常复杂，比如嵌套层级很深，那么递归 traverse 就会有一定的性能耗时。因此如果我们需要侦听这个复杂响应式对象内部的某个具体属性，就可以想办法减少 traverse 带来的性能损耗,**具体优化见代码**

### 构造回调函数

处理完 watch API 第一个参数 source 后，接下来处理第二个参数 cb，cb 是一个回调函数，它有三个参数：第一个 newValue 代表新值；第二个 oldValue 代表旧值。第三个参数 onInvalidate，后面介绍，其实这样的 API 设计非常好理解，即侦听一个值的变化，如果值变了就执行回调函数，回调函数里可以访问到新值和旧值，接下来我们来看一下构造回调函数的处理逻辑

onInvalidate 函数用来注册无效回调函数 ，我们暂时不需要关注它，我们需要重点来看 applyCb。 这个函数实际上就是对 cb 做一层封装，当侦听的值发生变化时就会执行 applyCb 方法，我们来分析一下它的实现。

首先，watch API 和组件实例相关，因为通常我们会在组件的 setup 函数中使用它，当组件销毁后，回调函数 cb 不应该被执行而是直接返回，接着，执行 runner 求得新值，这里实际上就是执行前面创建的 getter 函数求新值。最后进行判断，如果是 deep 的情况或者新旧值发生了变化，则执行回调函数 cb，传入参数 newValue 和 oldValue。注意，第一次执行的时候旧值的初始值是空数组或者 undefined。执行完回调函数 cb 后，把旧值 oldValue 再更新为 newValue，这是为了下一次的比对

### 创建 scheduler

接下来我们要分析创建 scheduler 过程，scheduler 的作用是根据某种调度的方式去执行某种函数，在 watch API 中，主要影响到的是回调函数的执行方式。我们来看一下它的实现逻辑，Watch API 的参数除了 source 和 cb，还支持第三个参数 options，不同的配置决定了 watcher 的不同行为。前面我们也分析了 deep 为 true 的情况，除了 source 为 reactive 对象时会默认把 deep 设置为 true，你也可以主动传入第三个参数，把 deep 设置为 true。

这里，scheduler 的创建逻辑受到了第三个参数 Options 中的 flush 属性值的影响，不同的 flush 决定了 watcher 的执行时机

- 当 flush 为 sync 的时候，表示它是一个同步 watcher，**即当数据变化时同步执行回调函数**。
- 当 flush 为 pre 的时候，回调函数通过 queueJob 的方式在组件更新之前执行，**如果组件还没挂载，则同步执行确保回调函数在组件挂载之前执行**。
- 如果没设置 flush，那么回调函数通过 queuePostRenderEffect 的方式在**组件更新之后执行**。

queueJob 和 queuePostRenderEffect 在这里不是重点，所以我们放到后面介绍。总之，你现在要记住，watcher 的回调函数是通过一定的调度方式执行的

### 创建 effect

前面的分析我们提到了 runner，它其实就是 watcher 内部创建的 effect 函数，接下来，我们来分析它逻辑，这块代码逻辑是整个 watcher 实现的核心部分，即通过 effect API 创建一个副作用函数 runner，我们需要关注以下几点

- runner 是一个 computed effect。因为 computed effect 可以优先于普通的 effect（比如组件渲染的 effect）先运行，这样就可以实现当配置 flush 为 pre 的时候，watcher 的执行可以优先于组件更新。

- runner 执行的方式。runner 是 lazy 的，它不会在创建后立刻执行。第一次手动执行 runner 会执行前面的 getter 函数，访问响应式数据并做依赖收集。注意，此时 activeEffect 就是 runner，这样在后面更新响应式数据时，就可以触发 runner 执行 scheduler 函数，以一种调度方式来执行回调函数。

- runner 的返回结果。手动执行 runner 就相当于执行了前面标准化的 getter 函数，getter 函数的返回值就是 watcher 计算出的值，所以我们第一次执行 runner 求得的值可以作为 oldValue。

- 配置了 immediate 的情况。当我们配置了 immediate ，创建完 watcher 会立刻执行 applyCb 函数，此时 oldValue 还是初始值，在 applyCb 执行时也会执行 runner 进而执行前面的 getter 函数做依赖收集，求得新值。

### 返回销毁函数

最后，会返回侦听器销毁函数，也就是 watch API 执行后返回的函数。我们可以通过调用它来停止 watcher 对数据的侦听，销毁函数内部会执行 stop 方法让 runner 失活，并清理 runner 的相关依赖，这样就可以停止对数据的侦听。并且，如果是在组件中注册的 watcher，也会移除组件 effects 对这个 runner 的引用，好了，到这里我们对 watch API 的分析就可以告一段落了。侦听器的内部设计很巧妙，我们可以侦听响应式数据的变化，内部创建 effect runner，首次执行 runner 做依赖收集，然后在数据发生变化后，以某种调度方式去执行回调函数。

## 侦听器：侦听器的实现原理和使用场景 2

在前面，我们多次提到回调函数是以一种调度的方式执行的，**特别是当 flush 不是 sync 时**，它会把回调函数执行的任务推到一个异步队列中执行。接下来，我们就来分析异步执行队列的设计。分析之前，我们先来思考一下，为什么会需要异步队列

```js
import { reactive, watch } from "vue";
const state = reactive({ count: 0 });
watch(
  () => state.count,
  (count, prevCount) => {
    console.log(count);
  }
);
state.count++;
state.count++;
state.count++;
```

这里，我们修改了三次 state.count，那么 watcher 的回调函数会执行三次吗？答案是不会，实际上只输出了一次 count 的值，也就是最终计算的值 3。这在大多数场景下都是符合预期的，因为在一个 Tick（宏任务执行的生命周期）内，即使多次修改侦听的值，它的回调函数也只执行一次

**组件的更新过程是异步的，我们知道修改模板中引用的响应式对象的值时，会触发组件的重新渲染，但是在一个 Tick 内，即使你多次修改多个响应式对象的值，组件的重新渲染也只执行一次。这是因为如果每次更新数据都触发组件重新渲染，那么重新渲染的次数和代价都太高了**

### 异步任务队列的创建

通过前面的分析我们知道，在创建一个 watcher 时，如果配置 flush 为 pre 或不配置 flush ，那么 watcher 的回调函数就会异步执行。此时分别是通过 queueJob 和 queuePostRenderEffect 把回调函数推入异步队列中的,在不涉及 suspense 的情况下，queuePostRenderEffect 相当于 queuePostFlushCb，我们来看它们的实现,Vue.js 内部维护了一个 queue 数组和一个 postFlushCbs 数组，其中 queue 数组用作异步任务队列， postFlushCbs 数组用作异步任务队列执行完毕后的回调函数队列,执行 queueJob 时会把这个任务 job 添加到 queue 的队尾，而执行 queuePostFlushCb 时，会把这个 cb 回调函数添加到 postFlushCbs 的队尾。它们在添加完毕后都执行了 queueFlush 函数，我们接着看它的实现

Vue.js 内部还维护了 isFlushing 和 isFlushPending 变量，用来控制异步任务的刷新逻辑，在 queueFlush 首次执行时，isFlushing 和 isFlushPending 都是 false，此时会把 isFlushPending 设置为 true，并且调用 nextTick(flushJobs) 去执行队列里的任务，因为 isFlushPending 的控制，这使得即使多次执行 queueFlush，也不会多次去执行 flushJobs。另外 nextTick 在 Vue.js 3.0 中的实现也是非常简单，通过 Promise.resolve().then 去异步执行 flushJobs，因为 JavaScript 是单线程执行的，这样的异步设计使你在一个 Tick 内，可以多次执行 queueJob 或者 queuePostFlushCb 去添加任务，也可以保证在宏任务执行完毕后的微任务阶段执行一次 flushJobs

### 异步任务队列的执行

创建完任务队列后，接下来要异步执行这个队列，我们来看一下 flushJobs 的实现，flushJobs 函数开始执行的时候，会把 isFlushPending 重置为 false，把 isFlushing 设置为 true 来表示正在执行异步任务队列，对于异步任务队列 queue，在遍历执行它们前会先对它们做一次从小到大的排序，这是因为两个主要原因

- 我们创建组件的过程是由父到子，所以创建组件副作用渲染函数也是先父后子，父组件的副作用渲染函数的 effect id 是小于子组件的，每次更新组件也是通过 queueJob 把 effect 推入异步任务队列 queue 中的。所以为了保证先更新父组再更新子组件，要对 queue 做从小到大的排序
- 如果一个组件在父组件更新过程中被卸载，它自身的更新应该被跳过。所以也应该要保证先更新父组件再更新子组件，要对 queue 做从小到大的排序

接下来，就是遍历这个 queue，依次执行队列中的任务了，在遍历过程中，注意有一个 checkRecursiveUpdates 的逻辑，它是用来在非生产环境下检测是否有循环更新的，它的作用我们稍后会提，遍历完 queue 后，又会进一步执行 flushPostFlushCbs 方法去遍历执行所有推入到 postFlushCbs 的回调函数，注意这里遍历前会通过 const cbs = [...new Set(postFlushCbs)] 拷贝一个 postFlushCbs 的副本，这是因为在遍历的过程中，可能某些回调函数的执行会再次修改 postFlushCbs，所以拷贝一个副本循环遍历则不会受到 postFlushCbs 修改的影响，遍历完 postFlushCbs 后，会重置 isFlushing 为 false，因为一些 postFlushCb 执行过程中可能会再次添加异步任务，所以需要继续判断如果 queue 或者 postFlushCbs 队列中还存在任务，则递归执行 flushJobs 把它们都执行完毕

### 检测循环更新

前面我们提到了，在遍历执行异步任务和回调函数的过程中，都会在非生产环境下执行 checkRecursiveUpdates 检测是否有循环更新，它是用来解决什么问题的呢？

```js
import { reactive, watch } from "vue";
const state = reactive({ count: 0 });
watch(
  () => state.count,
  (count, prevCount) => {
    state.count++;
    console.log(count);
  }
);
state.count++;
```

如果你去跑这个示例，你会在控制台看到输出了 101 次值，然后报了错误： Maximum recursive updates exceeded 。这是因为我们在 watcher 的回调函数里更新了数据，这样会再一次进入回调函数，如果我们不加任何控制，那么回调函数会一直执行，直到把内存耗尽造成浏览器假死。
为了避免这种情况，Vue.js 实现了 checkRecursiveUpdates 方法

通过前面的代码，我们知道 flushJobs 一开始便创建了 seen，它是一个 Map 对象，然后在 checkRecursiveUpdates 的时候会把任务添加到 seen 中，记录引用计数 count，初始值为 1，如果 postFlushCbs 再次添加了相同的任务，则引用计数 count 加 1，如果 count 大于我们定义的限制 100 ，则说明一直在添加这个相同的任务并超过了 100 次。那么，Vue.js 会抛出这个错误，因为在正常的使用中，不应该出现这种情况，而我们上述的错误示例就会触发这种报错逻辑

### 优化：只用一个变量

到这里，异步队列的设计就介绍完毕了，你可能会对 isFlushPending 和 isFlushing 有些疑问，为什么需要两个变量来控制呢,从语义上来看，isFlushPending 用于判断是否在等待 nextTick 执行 flushJobs，而 isFlushing 是判断是否正在执行任务队列

从功能上来看，它们的作用是为了确保以下两点：

- 在一个 Tick 内可以多次添加任务到队列中，但是任务队列会在 nextTick 后执行；
- 在执行任务队列的过程中，也可以添加新的任务到队列中，并且在当前 Tick 去执行剩余的任务队列。

......

我们只需要一个 isFlushing 来控制就可以实现相同的功能了。在执行 queueFlush 的时候，判断 isFlushing 为 false，则把它设置为 true，然后 nextTick 会执行 flushJobs。在 flushJobs 函数执行完成的最后，也就是所有的任务（包括后添加的）都执行完毕，再设置 isFlushing 为 false

### watchEffect API

了解完 watch API 和异步任务队列的设计后，我们再来学习侦听器提供的另一个 API—— watchEffect API,watchEffect API 的作用是注册一个副作用函数，副作用函数内部可以访问到响应式对象，当内部响应式对象变化后再立即执行这个函数

```js
import { ref, watchEffect } from "vue";
const count = ref(0);
watchEffect(() => console.log(count.value));
count.value++;
```

它的结果是依次输出 0 和 1。

watchEffect 和前面的 watch API 有哪些不同呢？主要有三点：

- 侦听的源不同 。watch API 可以侦听一个或多个响应式对象，也可以侦听一个 getter 函数，而 watchEffect API 侦听的是一个普通函数，只要内部访问了响应式对象即可，这个函数并不需要返回响应式对象。

- 没有回调函数 。watchEffect API 没有回调函数，副作用函数的内部响应式对象发生变化后，会再次执行这个副作用函数。

- 立即执行 。watchEffect API 在创建好 watcher 后，会立刻执行它的副作用函数，而 watch API 需要配置 immediate 为 true，才会立即执行回调函数。

实现：getter 函数就是对 source 函数的简单封装，它会先判断组件实例是否已经销毁，然后每次执行 source 函数前执行 cleanup 清理函数，watchEffect 内部创建的 runner 对应的 scheduler 对象就是 scheduler 函数本身，这样它再次执行时，就会执行这个 scheduler 函数，并且传入 runner 函数作为参数，其实就是按照一定的调度方式去执行基于 source 封装的 getter 函数，创建完 runner 后就立刻执行了 runner，其实就是内部同步执行了基于 source 封装的 getter 函数，在执行 source 函数的时候，会传入一个 onInvalidate 函数作为参数，接下来我们就来分析它的作用

### 注册无效回调函数

有些时候，watchEffect 会注册一个副作用函数，在函数内部可以做一些异步操作，但是当这个 watcher 停止后，如果我们想去对这个异步操作做一些额外事情（比如取消这个异步操作），我们可以通过 onInvalidate 参数注册一个无效函数

```js
import { ref, watchEffect } from "vue";
const id = ref(0);
watchEffect((onInvalidate) => {
  // 执行异步操作
  const token = performAsyncOperation(id.value);
  onInvalidate(() => {
    // 如果 id 发生变化或者 watcher 停止了，则执行逻辑取消前面的异步操作
    token.cancel();
  });
});
```

我们利用 watchEffect 注册了一个副作用函数，它有一个 onInvalidate 参数。在这个函数内部通过 performAsyncOperation 执行某些异步操作，并且访问了 id 这个响应式对象，然后通过 onInvalidate 注册了一个回调函数

实际上，当你执行 onInvalidate 的时候，就是注册了一个 cleanup 和 runner 的 onStop 方法，这个方法内部会执行 fn，也就是你注册的无效回调函数,也就是说当响应式数据发生变化，会执行 cleanup 方法，当 watcher 被停止，会执行 onStop 方法，这两者都会执行注册的无效回调函数 fn,通过这种方式，Vue.js 就很好地实现了 watcher 注册无效回调函数的需求。

**相比于计算属性，侦听器更适合用于在数据变化后执行某段逻辑的场景，而计算属性则用于一个数据依赖另外一些数据计算而来的场景**

## 