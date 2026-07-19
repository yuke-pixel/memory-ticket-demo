const STORAGE_KEY = "memory_ticket_memories";
const ACTIVE_KEY = "memory_ticket_active_id";

const templateCatalog = [
  {
    key: "train",
    name: "火车票",
    tone: "海边列车",
    backgroundPath: "/assets/seaside-train-ticket.jpg"
  },
  {
    key: "boarding",
    name: "登机牌",
    tone: "天空远行",
    backgroundPath: "/assets/boarding-pass-sky.jpg"
  },
  {
    key: "campus",
    name: "校园卡",
    tone: "毕业校园",
    backgroundPath: "/assets/campus-ticket.jpg"
  },
  {
    key: "postcard",
    name: "明信片",
    tone: "写给某人",
    backgroundPath: "/assets/postcard-letter.jpg"
  }
];

const sceneProfiles = {
  "毕业": {
    icon: "🎓",
    captureTitle: "先留下毕业那一天",
    captureSubtitle: "一张照片、一段声音，就能回到那个夏天",
    mediaHint: "留下合照、校园和告别那天",
    saveSubtitle: "保存这段毕业记忆",
    question: "毕业那天，你最舍不得哪个瞬间？",
    textPlaceholder: "比如：拍完合照之后发生了什么？你想对当时的自己说什么？",
    defaultTitle: "毕业旅行 · 2023 夏",
    defaultDate: "2023 / 07 / 18",
    defaultLocation: "青岛 · 海边",
    defaultTemplate: "train",
    backTitle: "给未来的自己"
  },
  "旅行": {
    icon: "🧳",
    captureTitle: "把这趟旅行收进累积里",
    captureSubtitle: "地点、影像、感受，都会成为未来的闪光记忆",
    mediaHint: "记录旅途中的美好瞬间",
    saveSubtitle: "保存这段旅行记忆",
    question: "这趟旅程里，你最想反复回到哪个画面？",
    textPlaceholder: "比如：到达时的天气、路上的一句话、一个没拍下来的瞬间。",
    defaultTitle: "去远方的那天",
    defaultDate: "2024 / 05 / 02",
    defaultLocation: "海边小城",
    defaultTemplate: "boarding",
    backTitle: "下一站，再见"
  },
  "一个重要的人": {
    icon: "👥",
    captureTitle: "写给一个重要的人",
    captureSubtitle: "不用写长文，先留下一句话和一段原声",
    mediaHint: "放进一张你们共同的照片",
    saveSubtitle: "保存这段关于 TA 的记忆",
    question: "如果这张票写给 TA，你最想留下哪句话？",
    textPlaceholder: "比如：第一次见面、一次拥抱、一句到现在还记得的话。",
    defaultTitle: "留给 TA 的声音",
    defaultDate: "2018.10.27",
    defaultLocation: "第一次见面的地方",
    defaultTemplate: "postcard",
    backTitle: "给未来的我们"
  },
  "其他": {
    icon: "✦",
    captureTitle: "从一个瞬间开始",
    captureSubtitle: "先不用分类，照片、文字和原声会把记忆慢慢带出来",
    mediaHint: "从一张照片或一段视频开始",
    saveSubtitle: "保存这个想留下的瞬间",
    question: "这个瞬间里，你最想先留下什么？",
    textPlaceholder: "比如：一个地点、一句话、一张旧照片，或者当时突然冒出来的心情。",
    defaultTitle: "想留下的这一刻",
    defaultDate: "今天",
    defaultLocation: "某个重要的地方",
    defaultTemplate: "postcard",
    backTitle: "写给以后的自己"
  }
};

const seedMemories = [
  {
    id: "mem_grad_2023",
    scene: "毕业",
    date: "2023 / 07 / 18",
    location: "青岛 · 海边",
    title: "毕业旅行 · 2023 夏",
    text: "那天，我们从学校出发去青岛。坐在靠窗的位置，看着海一点点出现，只觉得那一刻很轻松。我们一起拍了很多照片，也聊了很多关于未来的想法。",
    mediaType: "image",
    mediaPath: "/assets/seaside-train-ticket.jpg",
    audioPath: "",
    template: "train",
    templateName: "火车票",
    backgroundPath: "/assets/seaside-train-ticket.jpg",
    progress: "已完成 80%",
    progressPercent: 80
  },
  {
    id: "mem_first_meet",
    scene: "一个重要的人",
    date: "2018.10.27",
    location: "老街咖啡店",
    title: "第一次见面",
    text: "那天我们都到得有点早，杯子里的冰块一直响。后来想起那一天，最清楚的不是聊了什么，而是终于见到彼此时的停顿。",
    mediaType: "image",
    mediaPath: "/assets/memory-tabletop.jpg",
    audioPath: "",
    template: "postcard",
    templateName: "明信片",
    backgroundPath: "/assets/postcard-letter.jpg",
    progress: "已完成 60%",
    progressPercent: 60
  },
  {
    id: "mem_mom_young",
    scene: "一个重要的人",
    date: "约 1990 年",
    location: "旧照片背后",
    title: "妈妈年轻时候",
    text: "照片里的她很年轻，穿着那件浅色外套。她说那时候每天很忙，但每次下班路过河边，都会停下来吹一会儿风。",
    mediaType: "image",
    mediaPath: "/assets/memory-tabletop.jpg",
    audioPath: "",
    template: "postcard",
    templateName: "明信片",
    backgroundPath: "/assets/postcard-letter.jpg",
    progress: "待补充 2 个问题",
    progressPercent: 35
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getSceneProfile(scene) {
  return sceneProfiles[scene] || sceneProfiles["旅行"];
}

function getTemplate(key) {
  return templateCatalog.find((item) => item.key === key) || templateCatalog[0];
}

function listTemplates() {
  return clone(templateCatalog);
}

function normalizeAssetPath(path) {
  if (!path) return "";
  return path
    .replace("seaside-train-ticket.png", "seaside-train-ticket.jpg")
    .replace("boarding-pass-sky.png", "boarding-pass-sky.jpg")
    .replace("campus-ticket.png", "campus-ticket.jpg")
    .replace("postcard-letter.png", "postcard-letter.jpg")
    .replace("memory-tabletop.png", "memory-tabletop.jpg");
}

function normalizeMemory(memory) {
  const profile = getSceneProfile(memory.scene);
  const template = getTemplate(memory.template || profile.defaultTemplate);
  const text = memory.text || "";
  return {
    ...memory,
    date: memory.date || profile.defaultDate,
    location: memory.location || profile.defaultLocation,
    title: memory.title || profile.defaultTitle,
    text,
    mediaType: memory.mediaType || "image",
    mediaPath: normalizeAssetPath(memory.mediaPath),
    template: memory.template || profile.defaultTemplate,
    templateName: memory.templateName || template.name,
    backgroundPath: normalizeAssetPath(memory.backgroundPath) || template.backgroundPath,
    customBackgroundPath: normalizeAssetPath(memory.customBackgroundPath),
    progress: memory.progress || (text ? "已完成 60%" : "草稿 20%"),
    progressPercent: memory.progressPercent || (text ? 60 : 20)
  };
}

function listMemories() {
  const stored = wx.getStorageSync(STORAGE_KEY);
  if (Array.isArray(stored) && stored.length) {
    const normalized = stored.map(normalizeMemory);
    wx.setStorageSync(STORAGE_KEY, normalized);
    return normalized;
  }
  const seeded = seedMemories.map(normalizeMemory);
  wx.setStorageSync(STORAGE_KEY, seeded);
  return clone(seeded);
}

function getMemory(id) {
  const memories = listMemories();
  return memories.find((memory) => memory.id === id) || memories[0];
}

function saveMemory(memory) {
  const memories = listMemories();
  const normalizedMemory = normalizeMemory(memory);
  const index = memories.findIndex((item) => item.id === memory.id);
  if (index >= 0) {
    memories[index] = normalizeMemory({ ...memories[index], ...normalizedMemory });
  } else {
    memories.unshift(normalizedMemory);
  }
  wx.setStorageSync(STORAGE_KEY, memories);
  wx.setStorageSync(ACTIVE_KEY, normalizedMemory.id);
  return normalizedMemory;
}

function createMemory(scene) {
  const now = Date.now();
  const profile = getSceneProfile(scene);
  const template = getTemplate(profile.defaultTemplate);
  const memory = {
    id: `mem_${now}`,
    scene,
    date: profile.defaultDate,
    location: profile.defaultLocation,
    title: profile.defaultTitle,
    text: "",
    mediaType: "image",
    mediaPath: "",
    audioPath: "",
    template: template.key,
    templateName: template.name,
    backgroundPath: template.backgroundPath,
    customBackgroundPath: "",
    progress: "草稿 20%",
    progressPercent: 20
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
  getActiveMemoryId,
  getSceneProfile,
  listTemplates,
  getTemplate
};
