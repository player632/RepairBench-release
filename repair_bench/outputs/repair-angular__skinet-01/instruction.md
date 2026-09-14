# SkiNet 店面（Angular 前端）——线上回归修复工单

你接手的是一个双栈仓库：一半是 .NET 后端（`API/`、`Core/`、`Infrastructure/`、`skinet.sln`），
一半是 Angular 18 单页应用（`client/`，standalone 组件＋signals＋Angular Material＋Tailwind）。
**本工单只关心前端那一半。** 后端的构建、迁移、数据库与容器编排都不在本次范围内，
不要尝试启动它们；本套验收在一台离线机器上进行，后端服务不在场，
因此所有判据都落在「没有后端也必须成立」的那些界面行为上。

前端工作区在 `client/` 目录里，三键如下：

```
cd client && npm install --no-audit --no-fund
cd client && npm run build          # = ng build，走 angular.json 的默认 production configuration
# 产物落在工作区配置所声明的那个输出目录（在仓库根下，不在 client/ 里面）
```

下面是用户与 QA 提交的报告。**并非所有缺陷都有报告提及**（Not every defect is described in
these reports）：报告只覆盖了一部分问题，剩下的需要你自己巡检界面才能发现。
反过来，报告里也混着若干**并非缺陷**的现象——把正常行为「修好」同样算失败。

---

## 一、有报告的问题（6 条）

**报告 1 —— 输错地址会跳到「服务器内部错误」页**
> "I typed a nonsense address into the URL bar out of curiosity, something like
> `/does-not-exist`. I expected the usual 404 page with the big **404** heading and the
> *Page not found* line and the button that takes me back to the shop. Instead I got the
> *Internal Server* page. Why does a bad address pretend the server exploded?"

**报告 2 —— 顶部那条细长的加载条再也不消失**
> "Since the last deploy there is a thin indeterminate loading strip pinned under the top bar and
> it just stays there. Forever. On every page. It used to flash for a moment while something was
> being fetched and then go away. Now the app looks like it is permanently busy."

**报告 3 —— 没登录也能看见 Admin 入口**
> "I opened the site in a private window, definitely signed out, and the top navigation shows
> Home / Shop / Errors / **Admin**. Four links. The Admin link is supposed to be for staff only and
> it is rendered right there for an anonymous visitor. Please make it disappear again for people
> who are not signed in as staff."

**报告 4 —— 首页那个大按钮把我带去了购物车**
> "On the landing page the big gradient button says **Go to shop**. Clicking it takes me to the
> empty shopping cart page instead of the shop. The label is right, the destination is wrong."

**报告 5 —— 错误自测页最左边两个按钮换位置了**
> "On the Errors page the row of five buttons used to read, left to right:
> *Test 500 Error*, *Test 404 Error*, *Test 400 Error*, *Test 401 Error*,
> *Test 400 Validation Error*. Now the first two are the other way round, which makes our
> internal runbook point at the wrong button. Put the row back in that order."

**报告 6 —— 登录页标题的颜色不对**
> "The **Login** heading used to be our purple brand colour (`#7d00fa`-ish, the same purple the
> active navigation link uses). Now it renders green. The Register heading looks wrong too.
> It is a brand colour, not a per-page choice, so please restore it in the place where the brand
> colour is actually defined."

## 二、报告里混着的「假问题」（2 条，都是正常行为，**不要动**）

**假问题 A —— Errors 页那五个按钮点了没反应**
> "None of the five buttons on the Errors page does anything. I clicked *Test 404 Error* and
> nothing happened at all: no error page, no toast, no message."

这是**预期行为**，不是缺陷：这五个按钮各自向后端发一个注定失败的请求，
用来演示前端对各种 HTTP 状态码的处理。本次验收环境里后端不在场，
请求根本得不到任何 HTTP 响应（连接层面就失败，状态码是 0），
所以既不会触发按状态码分支的跳转，也不会弹出提示条。
正确的表现就是「点了以后停在原页面、什么都不出现」。
如果你为了「让它有反应」而加一个假的错误提示、加一个本地兜底跳转、
或者删掉/改掉某个按钮，你会把本来正常的行为改坏。

**假问题 B —— 直接打开服务器错误页几乎是空白的**
> "I navigated straight to the server error page and it is basically empty: just the words
> *Internal Server* and a grey box. No stack trace, no 'what to do next' list, no error detail.
> The page looks broken."

这也是**预期行为**：那一页的错误详情、操作清单与堆栈卡片全部包在一个条件块里，
只有当导航本身携带了错误对象（由拦截器在收到真正的 500 响应时通过路由状态传入）才会渲染。
冷启动直接进入该页面时导航状态里没有错误对象，于是条件块整体不渲染，
页面上就只剩标题和它的容器。请不要为了「填满这一页」而给它加占位文案、
示例堆栈或默认错误对象。

---

## 三、修复纪律

1. **按机制修，不要按判据修。** 每处问题都有一个具体的机制性根因（路由表、模板绑定、
   指令条件、全局样式令牌、计数器运算、子节点顺序……）。请定位根因并恢复原有语义。
2. **不要新增任何测试钩子。** 禁止新增 `data-*` 选择器属性、禁止新增仅供测试读取的全局变量、
   禁止把某个组件改成对判据特判。界面结构、元素顺序与文案只应在「恢复原有语义」所必需的范围内变动。
3. **不要顺手重构。** 与本工单无关的既有写法（包括上面两条「假问题」）一律保持原样。
4. **保持离线自足。** 修完之后页面不得引用任何外部站点资源；本地静态资源照常可用。
5. **保持可构建。** 改动必须能通过上面那两条命令构建成功，且构建产物落在工作区配置声明的输出目录里。
   注意该仓库的默认构建配置带体积预算，不要让初始包体积超出预算。
6. 验收方式：在无头浏览器里逐条读取界面事实（元素普查、属性、类名、计算样式、文本、地址栏、
   一次用户级点击之后的结果），并按「失败→通过」与「一直通过」两组分别计分。
   两组全绿才算修好。
