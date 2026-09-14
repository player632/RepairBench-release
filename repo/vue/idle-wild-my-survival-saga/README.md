# 我的荒野放置求生记
![游戏截图](https://i.miji.bid/2025/04/04/0917160f7f1173616432b3dfab50fc85.png)

## 项目简介
基于Vue3 + Pinia构建的生存模拟游戏，玩家需要在荒野中收集资源、建造设施、研究科技并应对天气变化。游戏包含完整的资源管理系统、技能成长系统和动态天气系统。

## 功能特性
- 🏡 建筑系统：建造/升级庇护所、仓库、工作坊等设施
- 🌟 技能成长：采集/制作/战斗/生存/研究五大技能体系
- ⚙️ 科技树：解锁科技，开启高级制作配方
- 🌦️ 动态天气：昼夜交替、季节变化影响游戏机制
- 📊 状态管理：使用Pinia管理复杂游戏状态
- 💾 游戏存档：支持本地存储和加密存档

## 技术栈
- 前端框架：Vue 3 + Composition API
- UI组件库：Element Plus
- 状态管理：Pinia
- 核心语言：JavaScript
- 构建工具：Vite
- 数据加密：CryptoJS

## 特别感谢
- Vue.js 团队提供了优秀的前端框架
- Element Plus 团队提供了高质量的UI组件
- Vite 团队提供了高效的构建工具
- Pinia 团队提供了简洁的状态管理方案

## 项目部署
### 安装项目
```bash
npm install
```

### 运行项目
```bash
npm run dev
```

### 编译项目
```bash
npm run build
```

## Docker 部署

### 构建镜像
```bash
docker build -t ghcr.io/setube/idle-wild-my-survival-saga:latest .
```
### 拉取镜像
```bash
docker pull ghcr.io/setube/idle-wild-my-survival-saga:latest
```
### 运行容器
```bash
docker run -d -p 2543:80 --name idle-wild-my-survival-saga ghcr.io/setube/idle-wild-my-survival-saga:latest
```


## 版权声明
知识共享署名-非商业性使用 4.0 国际许可协议

本作品采用知识共享署名-非商业性使用 4.0 国际许可协议进行许可。
要查看此许可协议的副本，请访问 http://creativecommons.org/licenses/by-nc/4.0/。

您自由地：
共享 — 在任何媒介以任何形式复制、发行本作品
改编 — 修改、转换或以本作品为基础进行创作

惟须遵守以下条件：
署名 — 您必须给出适当的署名，提供指向本许可协议的链接，同时标明是否（对原始作品）作了修改。您可以用任何合理的方式来署名，但不得以任何方式暗示许可人为您或您的使用背书。

非商业性使用 — 您不得将本作品用于商业目的。

没有附加限制 — 您不得适用法律术语或者技术措施从而限制其他人做许可协议允许的事情。

声明：
本作品是作者（谦君）的原创作品，项目源码地址：https://github.com/setube/idle-wild-my-survival-saga
本授权条款不得被视为或解释为对任何版权的放弃或其他限制。

当您分享本作品的改编版本时，您必须：
- 在显著位置标注原作者的署名
- 保留本许可协议文档
- 明确说明修改内容及修改日期
- 使用相同的 CC BY-NC 4.0 协议进行分发

© 2025 谦君 - 保留所有权利（根据本许可协议授予的权限除外）
