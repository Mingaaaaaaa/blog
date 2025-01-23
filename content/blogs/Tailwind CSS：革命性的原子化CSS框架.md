<h2 id="vXPgv">是什么？</h2>
**<font style="color:rgb(31, 35, 40);">A utility-first CSS framework for rapid UI development.</font>**

tailwind 是一个流行的**原子化 css 框架**。

传统 css 写法是定义 class，然后在 class 内部写样式，而原子化 css 是预定义一些细粒度 class，通过组合 class 的方式完成样式编写

<font style="color:rgb(44, 62, 80);">核心特点：功能类优先（utility-first）</font>

官网首页提到的点：

1. 内置的设计系统
2. treeshaking
3. 配置文件-> 扩展、自定义
4. 媒体查询、伪元素伪类书写方式、暗色模式

<h2 id="vlffW">怎么用？</h2>
它的写法很像bootstrap！ 也和amis里面的样式有点像（

具体的语法不在此赘述，官网自查

[https://tailwindcss.com/docs/utility-first](https://tailwindcss.com/docs/utility-first)

官方解释：

![](https://cdn.statically.io/gh/Mingaaaaaaa/PictureBed@master/image-(1).webp)

~~这tm不是和内联css一样丑陋~~~~💩~~~~？~~

<h2 id="GpJmz">原理是？</h2>
<font style="color:rgb(51, 65, 85);">Tailwind 是一个 PostCSS 插件，</font>预定义了很多 工具类。

![](https://cdn.statically.io/gh/Mingaaaaaaa/PictureBed@master/image-(2).webp)

<font style="color:rgb(44, 62, 80);">扫描所有HTML文件、JavaScript组件和任何其他模板的类名，生成相应的样式，然后将它们写入静态CSS文件。</font>

 PostCSS又是啥？[https://www.postcss.com.cn/](https://www.postcss.com.cn/)

 是一个用 JavaScript 工具和插件转换 CSS 代码的工具

<font style="color:rgb(51, 65, 85);"> Autoprefixer、stylelint、css moudle 等都是postcss的插件</font>

<h2 id="Bwrsk">PostCss的核心原理/工作流</h2>
PostCSS 包括 CSS 解析器（**praser**），CSS 节点树 API，一个源映射生成器和一个节点树 **stringifier**。

PostCSS 主要的原理核心工作流：
![](https://cdn.statically.io/gh/Mingaaaaaaa/PictureBed@master/image-(3).webp)


tailwindcss原理。和上面类似，只不过读取的是我们在配置文件设置的匹配的文件，读他们的class，生成对应工具类的css

<h2 id="n4J0q">优缺点？</h2>
<h3 id="p2vST">优点</h3>
1. 不需要起类名
2. 减少部分代码量
3. 社区氛围？
4. 编写迅速
5. tree shaking，官方说能减少到10k以下
6. 防止css污染？
7. 自带设计系统（支持自定义）
8. 响应式布局更方便。自带媒体查询

<h3 id="AQbkp">缺点</h3>
1. html丑陋 （解决方案：Daisy UI [https://daisyui.com/](https://daisyui.com/) 组件化+定制化）
2. 难维护，难调试。
3. 多下载一个安装包（5MB）
4. 需要一定学习成本，需要频繁查官网（

<h2 id="Eg9T4">用不用？</h2>

![](https://cdn.statically.io/gh/Mingaaaaaaa/PictureBed@master/image-(4).webp)


<h2 id="BfhFz">技术选型</h2>
1. 个人项目 / 小业务：一眼看上去喜欢 >> 开发体验 > 维护性 > 性能 > 生态 > 团队技术栈 > 学习成本
2. 长期项目：生态 = 维护性 > 开发体验 > 学习成本 > 性能 > 团队技术栈
3. 时间紧急的项目：生态 > 学习成本 > 团队技术栈 > 开发体验 > 维护性 > 性能
4. 首页项目，重性能的项目：不用CSS-IN-JS > 性能 > 生态 > 团队技术栈 > 维护性 > 学习成本 > 开发体验

<h2 id="VIrFX">总结</h2>
CSS方案只要不是太逆天，其实都可以接受。选择一个CSS框架的本心是为了更好的适配现代前端框架和团队的开发理念。保守的技术选型可以降低开发风险，优秀的生态可以持续增强开发体验。在这些基础之上，才应该再去考虑是否添一些新东西来增强某一方面的开发体验或效果。

<h2 id="bzGQb">八卦</h2>

为啥这个 css 框架叫 tailwind 呢？ 因为作者 Adam Wathan喜欢叫做 kiteboarding 风筝冲浪的运动。 就是这样的，一个风筝，一个冲浪板：

![](https://cdn.statically.io/gh/Mingaaaaaaa/PictureBed@master/image-(5).webp)


这种运动在顺风 tailwind 和逆风 headwind 下有不同的技巧。而 tailwind 的时候明显更加省力。 所以就给这个 css 框架起名叫 tailwind 了，借用其省力的意思。

