const memoryStore = require("../../services/memory-store");

Page({
  data: {
    memories: []
  },

  onShow() {
    this.setData({ memories: memoryStore.listMemories() });
  },

  createNew() {
    const memory = memoryStore.createMemory("旅行");
    wx.navigateTo({ url: `/pages/capture/capture?id=${memory.id}` });
  },

  openStory(event) {
    const id = event.currentTarget.dataset.id;
    memoryStore.setActiveMemoryId(id);
    wx.navigateTo({ url: `/pages/story/story?id=${id}` });
  },

  editMemory(event) {
    const id = event.currentTarget.dataset.id;
    memoryStore.setActiveMemoryId(id);
    wx.navigateTo({ url: `/pages/capture/capture?id=${id}` });
  }
});
