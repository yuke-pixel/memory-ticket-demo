const memoryStore = require("../../services/memory-store");

Page({
  data: {
    id: "",
    memory: {},
    shortText: ""
  },

  onLoad(options) {
    const id = options.id || memoryStore.getActiveMemoryId();
    this.setData({ id });
  },

  onShow() {
    const memory = memoryStore.getMemory(this.data.id || memoryStore.getActiveMemoryId());
    this.setData({
      memory,
      shortText: memory.text.length > 58 ? `${memory.text.slice(0, 58)}…` : memory.text
    });
  },

  goStory() {
    wx.navigateTo({ url: `/pages/story/story?id=${this.data.memory.id}` });
  }
});
