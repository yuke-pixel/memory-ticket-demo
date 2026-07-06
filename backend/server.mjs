import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.PORT || 8787);

const memories = new Map();
const orders = new Map();

const seedTicket = {
  id: "mem_seed_trip",
  status: "published",
  scene: "一次旅行",
  ownerId: "user_demo",
  title: "去海边的那天",
  subtitle: "风很大，我们把黄昏留在一张票上。",
  occurredAt: "2025-06-18",
  locationName: "厦门 · 海边",
  templateKey: "train",
  privacy: "private",
  audioSummary: "便利店门口那瓶汽水，是这段原声里最亮的细节。",
  backCopy: "那天我们沿着海边走了很久，谁都没有急着回去。风把头发吹得很乱，便利店门口那瓶汽水却很甜。",
  storyBody:
    "我们沿着海边走了很久，谁都没有急着回去。那天风很大，很多话都被吹散了，只剩下脚印、笑声和便利店门口那瓶分着喝的汽水。后来我才发现，重要的不是那片海有多漂亮，而是那一天我们都还在同一个傍晚里。",
  storySlug: "sea-2025-demo",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

memories.set(seedTicket.id, seedTicket);

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  });
  response.end(JSON.stringify(payload, null, 2));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks).toString("utf8");
  return body ? JSON.parse(body) : {};
}

function generatedContent(memory, answerText = "") {
  const place = memory.locationName || "那一天";
  const title = memory.scene === "一个毕业季" ? "毕业前最后一节课" : memory.title || "去海边的那天";
  const detail = answerText || "我们沿着海边走了很久，谁都没有急着回去。";

  return {
    title,
    subtitle: memory.scene === "一个重要的人" ? "把 TA 的声音留在一张票里。" : "风很大，我们把黄昏留在一张票上。",
    backCopy: `${detail.slice(0, 72)}${detail.length > 72 ? "。" : ""}`,
    storyBody: `${detail}\n\n后来再想起${place}，最清楚的不是天气和路线，而是那一刻的声音、停顿和舍不得。`,
    audioSummary: "这段原声保留了当时最自然的语气。",
  };
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "OPTIONS") {
    return sendJson(response, 204, {});
  }

  try {
    if (request.method === "GET" && url.pathname === "/api/health") {
      return sendJson(response, 200, { ok: true, service: "memory-ticket-api" });
    }

    if (request.method === "GET" && url.pathname === "/api/memories") {
      return sendJson(response, 200, { items: Array.from(memories.values()) });
    }

    if (request.method === "POST" && url.pathname === "/api/memories") {
      const payload = await readBody(request);
      const now = new Date().toISOString();
      const memory = {
        id: randomUUID(),
        status: "draft",
        ownerId: payload.ownerId || "user_demo",
        scene: payload.scene || "一次旅行",
        title: payload.title || "",
        subtitle: "",
        occurredAt: payload.occurredAt || null,
        locationName: payload.locationName || "",
        templateKey: payload.templateKey || "train",
        privacy: payload.privacy || "private",
        interviewAnswers: [],
        storySlug: null,
        createdAt: now,
        updatedAt: now,
      };
      memories.set(memory.id, memory);
      return sendJson(response, 201, { memory });
    }

    const answerMatch = url.pathname.match(/^\/api\/memories\/([^/]+)\/interview-answer$/);
    if (request.method === "POST" && answerMatch) {
      const memory = memories.get(answerMatch[1]);
      if (!memory) return sendJson(response, 404, { error: "MEMORY_NOT_FOUND" });

      const payload = await readBody(request);
      const answer = {
        id: randomUUID(),
        question: payload.question,
        answerText: payload.answerText || "",
        audioAssetId: payload.audioAssetId || null,
        createdAt: new Date().toISOString(),
      };
      memory.interviewAnswers = [...(memory.interviewAnswers || []), answer];
      memory.updatedAt = new Date().toISOString();
      return sendJson(response, 201, { answer, memory });
    }

    const generateMatch = url.pathname.match(/^\/api\/memories\/([^/]+)\/generate$/);
    if (request.method === "POST" && generateMatch) {
      const memory = memories.get(generateMatch[1]);
      if (!memory) return sendJson(response, 404, { error: "MEMORY_NOT_FOUND" });

      const lastAnswer = memory.interviewAnswers?.at(-1)?.answerText || "";
      Object.assign(memory, generatedContent(memory, lastAnswer), {
        status: "preview",
        storySlug: memory.storySlug || `story-${memory.id.slice(0, 8)}`,
        updatedAt: new Date().toISOString(),
      });
      return sendJson(response, 200, { memory });
    }

    const storyMatch = url.pathname.match(/^\/api\/stories\/([^/]+)$/);
    if (request.method === "GET" && storyMatch) {
      const story = Array.from(memories.values()).find((memory) => memory.storySlug === storyMatch[1]);
      if (!story) return sendJson(response, 404, { error: "STORY_NOT_FOUND" });
      return sendJson(response, 200, { story });
    }

    if (request.method === "POST" && url.pathname === "/api/orders") {
      const payload = await readBody(request);
      if (!memories.has(payload.memoryId)) {
        return sendJson(response, 422, { error: "INVALID_MEMORY_ID" });
      }
      const now = new Date().toISOString();
      const order = {
        id: randomUUID(),
        memoryId: payload.memoryId,
        productSku: payload.productSku || "single_qr_ticket",
        quantity: payload.quantity || 1,
        amountCents: payload.amountCents || 6900,
        status: "pending_payment",
        createdAt: now,
        updatedAt: now,
      };
      orders.set(order.id, order);
      return sendJson(response, 201, { order });
    }

    return sendJson(response, 404, { error: "NOT_FOUND" });
  } catch (error) {
    return sendJson(response, 500, { error: "SERVER_ERROR", message: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`memory-ticket-api listening on http://localhost:${PORT}`);
});
