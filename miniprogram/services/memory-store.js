const STORAGE_KEY = "memory_ticket_memories";
const ACTIVE_KEY = "memory_ticket_active_id";

const seedMemories = [
  {
    id: "mem_grad_2023",
    scene: "毕业",
    date: "2023 / 07 / 18",
    location: "青岛 · 海边",
    title: "毕业旅行 · 2023 夏",
    text: "那天，我们从学校出发去青岛。坐在靠窗的位置，看着海一点点出现，只觉得那一刻很轻松。我们一起拍了很多照片，也聊了很多关于未来的想法。",
    mediaType: "image",
    mediaPath: "/assets/seaside-train-ticket.png",
    audioPath: "",
    template: "train",
    progress: "已完成 80%"
  },
  {
    id: "mem_first_meet",
    scene: "一个重要的人",
    date: "2018.10.27",
    location: "老街咖啡店",
    title: "第一次见面",
    text: "那天我们都到得有点早，杯子里的冰块一直响。后来想起那一天，最清楚的不是聊了什么，而是终于见到彼此时的停顿。",
    mediaType: "image",
    mediaPath: "/assets/memory-tabletop.png",
    audioPath: "",
    template: "postcard",
    progress: "已完成 60%"
  },
  {
    id: "mem_mom_young",
    scene: "一个重要的人",
    date: "约 1990 年",
    location: "旧照片背后",
    title: "妈妈年轻时候",
    text: "照片里的她很年轻，穿着那件浅色外套。她说那时候每天很忙，但每次下班路过河边，都会停下来吹一会儿风。",
    mediaType: "image",
    mediaPath: "/assets/memory-tabletop.png",
    audioPath: "",
    template: "sepia",
    progress: "待补充 2 个问题"
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function listMemories() {
  const stored = wx.getStorageSync(STORAGE_KEY);
  if (Array.isArray(stored) && stored.length) return stored;
  wx.setStorageSync(STORAGE_KEY, seedMemories);
  return clone(seedMemories);
}

function getMemory(id) {
  const memories = listMemories();
  return memories.find((memory) => memory.id === id) || memories[0];
}

function saveMemory(memory) {
  const memories = listMemories();
  const index = memories.findIndex((item) => item.id === memory.id);
  if (index >= 0) {
    memories[index] = { ...memories[index], ...memory };
  } else {
    memories.unshift(memory);
  }
  wx.setStorageSync(STORAGE_KEY, memories);
  wx.setStorageSync(ACTIVE_KEY, memory.id);
  return memory;
}

function createMemory(scene) {
  const now = Date.now();
  const memory = {
    id: `mem_${now}`,
    scene,
    date: "",
    location: "",
    title: scene === "毕业" ? "毕业旅行 · 2023 夏" : scene === "旅行" ? "去远方的那天" : "留给 TA 的声音",
    text: "",
    mediaType: "image",
    mediaPath: "",
    audioPath: "",
    template: "train",
    progress: "草稿 20%"
  };
  return saveMemory(memory);
}

function setActiveMemoryId(id) {
  wx.setStorageSync(ACTIVE_KEY, id);
}

function getActiveMemoryId() {
  return wx.getStorageSync(ACTIVE_KEY) || listMemories()[0].id;
}

module.exports = {
  listMemories,
  getMemory,
  saveMemory,
  createMemory,
  setActiveMemoryId,
  getActiveMemoryId
};
