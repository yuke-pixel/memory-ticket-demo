# 记忆票根小程序原型

一句话：给值得留下的一刻，留一张能听见的票。

产品底层不是只存一张票根，而是围绕同一段记忆保存照片/视频、文字、语音和后续实体文件。票根是第一版入口，扫码故事页是这段多模态记忆的展示页。

这个目录包含四部分：

- `index.html`：可直接打开的 5 屏高保真 H5 原型。
- `miniprogram/`：原生微信小程序原型，可导入微信开发者工具继续开发。
- `backend/server.mjs`：无依赖 mock API，用于验证前后端主链路。
- `docs/schema.sql` 和 `docs/implementation-plan.md`：正式开发的数据模型和迭代方案。

## 直接预览

打开：

```text
/home/yuke/桌面/memory-ticket-demo/index.html
```

页面包含：

- 开场页：选择一次旅行、一个毕业季、一个重要的人。
- 档案页：已完成票根、草稿、继续补充。
- 采集页：照片/视频、日期地点、文字回答、AI 轻访谈、语音状态。
- 预览页：正面票根、背面短文、模板切换、隐私确认。
- 故事页：扫码后的照片、原声播放器、完整故事、继续补充入口。

## 运行 mock API

```bash
cd /home/yuke/桌面/memory-ticket-demo
npm run api
```

默认地址：

```text
http://localhost:8787
```

可用接口：

- `GET /api/health`
- `GET /api/memories`
- `POST /api/memories`
- `POST /api/memories/:id/interview-answer`
- `POST /api/memories/:id/generate`
- `GET /api/stories/:slug`
- `POST /api/orders`

## 后续迁移建议

H5 原型只用于快速看流程和视觉，不作为上线代码。上线方向以 `miniprogram/` 为准：它已经按微信小程序页面拆成开场、档案、采集、预览、故事五页，并使用 `wx.chooseMedia`、`wx.getRecorderManager`、`wx.createInnerAudioContext` 这些小程序原生能力。后续继续接入云存储、微信登录、支付、AI 服务和印刷生产。

当前小程序交互已经改成 `memory id` 驱动：首页会创建新的记忆草稿，档案页每张票根都有独立 id，采集、预览、故事页都按 id 读取和保存，不再全部跳到同一条全局假数据。

## 小程序导入

用微信开发者工具导入：

```text
/home/yuke/桌面/memory-ticket-demo
```

项目配置：

```text
project.config.json
miniprogramRoot: miniprogram/
appid: touristappid
```
