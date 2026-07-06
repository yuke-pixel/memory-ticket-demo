const memoryStore = require("../../services/memory-store");

Page({
  data: {
    id: "",
    memory: {},
    playing: false
  },

  onLoad(options) {
    const id = options.id || memoryStore.getActiveMemoryId();
    this.setData({ id });
  },

  onShow() {
    const memory = memoryStore.getMemory(this.data.id || memoryStore.getActiveMemoryId());
    this.setData({ memory });
    if (this.audio) {
      this.audio.destroy();
      this.audio = null;
    }
    if (memory.audioPath) {
      this.audio = wx.createInnerAudioContext();
      this.audio.src = memory.audioPath;
      this.audio.onEnded(() => this.setData({ playing: false }));
    }
  },

  toggleAudio() {
    if (!this.audio) {
      wx.showToast({ title: "还没有录音", icon: "none" });
      return;
    }

    if (this.data.playing) {
      this.audio.pause();
      this.setData({ playing: false });
    } else {
      this.audio.play();
      this.setData({ playing: true });
    }
  },

  backCapture() {
    wx.navigateTo({ url: `/pages/capture/capture?id=${this.data.memory.id}` });
  },

  makeMine() {
    const memory = memoryStore.createMemory("旅行");
    wx.navigateTo({ url: `/pages/capture/capture?id=${memory.id}` });
  },

  onUnload() {
    if (this.audio) this.audio.destroy();
  }
});
