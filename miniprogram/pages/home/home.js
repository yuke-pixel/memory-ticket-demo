const memoryStore = require("../../services/memory-store");

Page({
  chooseScene(event) {
    const scene = event.currentTarget.dataset.scene;
    const memory = memoryStore.createMemory(scene);
    wx.navigateTo({ url: `/pages/capture/capture?id=${memory.id}` });
  }
});
