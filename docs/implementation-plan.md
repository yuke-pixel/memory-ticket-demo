# 记忆票根实现方案

## 产品取舍

第一版建议做 H5 demo 或微信小程序轻量版，不先做完整商城。核心目标不是把所有交易链路做完，而是验证三个问题：

- 用户是否愿意上传照片和语音。
- AI 访谈后生成的票根是否有“想保存/想送人”的冲动。
- 单张 QR 票根和 6 张套组是否有人愿意付款。

建议先做 QR 票根，不先做 NFC。QR 交付成本低、生产风险小、适合快速测试。NFC 可以作为 99 元以上或套组产品的升级项。

## MVP 页面

1. 开场页
   - 只问“你想留下什么回忆？”
   - 三个首批场景：一次旅行、一个毕业季、一个重要的人。
   - 不强制登录。

2. 采集页
   - 上传照片、视频、旧票或选择一张已有图。
   - 填日期、地点、人物。
   - 文字和语音都作为同一段记忆的素材保存，AI 一次只问一个短问题。
   - 默认鼓励语音回答，允许文字补充。

3. 票根预览页
   - 展示正面、背面和故事页入口。
   - 可切换火车票、登机牌、校园证、演唱会票模板。
   - 明确区分“印在实体上”和“只放在私密故事页”。

4. 扫码故事页
   - 展示票根视觉、原声音频、完整故事、照片合集。
   - 默认私密链接。
   - 保留“我也做一张”的传播入口。

5. 档案页
   - 已完成、草稿、待补充问题。
   - 引导单张变套组，套组变迷你册。

## 前端架构

H5 首版：

- 原生 H5 或 Vue/Taro 均可。
- 如果目标是最快验证，用 H5 + Vant/自定义样式。
- 如果目标是直接小程序上线，用 Taro/uni-app，减少重复开发。

推荐页面结构：

```text
pages/
  home/
  archive/
  capture/
  preview/
  story/
  order/
components/
  MemoryTicket/
  AudioRecorder/
  StoryRenderer/
  TemplateSwitcher/
  PrivacyConfirm/
services/
  memory-api.ts
  upload-api.ts
  ai-api.ts
```

关键状态：

- `memory.status`: `draft`、`collecting`、`preview`、`published`、`ordered`
- `memory.privacy`: `private`、`link_visible`、`public`
- `asset.asset_type`: `photo`、`video`、`voice`、`text_note`、`old_ticket`、`cover`、`print_pdf`
- `order.status`: `pending_payment`、`paid`、`content_confirmed`、`printing`、`shipped`、`completed`

## 后端架构

建议先做一个模块化单体：

```text
api/
  auth
  memories
  assets
  interviews
  ai-generation
  stories
  products
  orders
  production
```

推荐技术：

- Node.js + NestJS/Fastify，或 Python + FastAPI。
- PostgreSQL 存业务数据。
- S3/腾讯云 COS/阿里云 OSS 存照片、语音、印刷 PDF。
- Redis 用于 AI 生成任务、音频转写任务和短信/微信通知限流。

不要把图片、视频和音频直接塞数据库。数据库只存 `storage_key`、`mime_type`、`byte_size`、时长、宽高和权限。文字回答可以存在 `interview_answers.answer_text`，用户额外补充的短文字碎片可以作为 `text_note` 素材保存。

## 核心接口

### 创建记忆

`POST /api/memories`

请求：

```json
{
  "scene": "trip",
  "occurredAt": "2025-06-18",
  "locationName": "厦门 · 海边",
  "templateKey": "train",
  "privacy": "private"
}
```

### 上传素材

`POST /api/assets/upload-token`

返回直传 URL。上传完成后调用：

`POST /api/memories/{memoryId}/assets`

### 追加访谈回答

`POST /api/memories/{memoryId}/interview-answer`

请求：

```json
{
  "questionText": "这张照片拍完之后，发生了什么？",
  "answerText": "我们沿着海边走了很久...",
  "audioAssetId": "uuid"
}
```

### AI 生成内容

`POST /api/memories/{memoryId}/generate`

返回：

```json
{
  "ticketTitle": "去海边的那天",
  "ticketSubtitle": "风很大，我们把黄昏留在一张票上。",
  "backCopy": "80-150 字短文",
  "storyBody": "500-1200 字完整故事",
  "audioSummary": "20-40 字音频导语"
}
```

### 发布故事页

`POST /api/memories/{memoryId}/publish`

服务端生成：

- `story_slug`
- `qr_token`
- 私密链接
- 印刷用二维码图片或 PDF

### 下单

`POST /api/orders`

请求：

```json
{
  "memoryId": "uuid",
  "productSku": "single_qr_ticket",
  "quantity": 1,
  "shippingAddress": {}
}
```

## AI 流程

1. 轻访谈问题生成
   - 根据场景、照片描述、地点、日期生成 3-5 个短问题。
   - 每次只展示一个。

2. 语音转写
   - 保留原音频。
   - 转写文字只作为整理素材。
   - 不用 AI 完全覆盖用户语气。

3. 内容生成
   - 生成五层内容：标题、短句、背面短文、完整故事、音频导语。
   - 每层都有长度约束。
   - 生成后允许用户编辑。

4. 审核和确认
   - 印刷前必须用户确认。
   - 高客单服务进入真人编辑队列。

## 商业闭环

首批 SKU：

- `single_qr_ticket`: 单张 QR 记忆票根，建议 39-69 元测试。
- `six_ticket_set`: 6 张套组，建议 199-299 元测试。
- `nfc_ticket`: NFC 升级票根，建议 99-129 元测试。

制作进度：

- 内容确认
- QR 绑定
- NFC 写入
- 印刷
- 包装
- 寄送

## 优先级

P0：

- H5 5 屏 demo。
- 图片/文字/语音采集模拟。
- AI 生成结果模拟。
- 故事页分享模拟。

P1：

- 微信登录。
- 云存储上传。
- 语音录制和转写。
- AI 内容生成。
- QR 私密故事页。

P2：

- 支付和订单。
- 印刷 PDF 生成。
- 生产进度后台。
- 6 张套组。

P3：

- NFC 写入。
- 多人共同补充。
- 真人编辑服务。
- 迷你 zine 和正式成书。

## 风险点

- 用户不愿录音：保留文字入口，但把语音包装为“原声会被保存”。
- AI 文案太假：必须保留原声，故事页突出用户自己的表达。
- 实体质感不足：上线前需要拍真实样品，不能只靠屏幕效果。
- 隐私顾虑：默认私密，分享链接可关闭，印刷内容和私密内容分区。
- 生产成本不稳：先 QR，后 NFC；先单张，后套组。
