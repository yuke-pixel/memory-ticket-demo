const memoryStore = require("../../services/memory-store");
const recorder = wx.getRecorderManager();

Page({
  data: {
    id: "",
    date: "",
    location: "",
    text: "",
    mediaType: "image",
    mediaPath: "",
    scene: "",
    sceneProfile: {},
    activeInput: "media",
    aiInterviewEnabled: true,
    recording: false,
    recordText: "00:00",
    recordStartedAt: 0,
    timer: null
  },

  onLoad(options) {
    const id = options.id || memoryStore.getActiveMemoryId();
    const memory = memoryStore.getMemory(id);
    const sceneProfile = memoryStore.getSceneProfile(memory.scene);
    memoryStore.setActiveMemoryId(memory.id);
    this.setData({
      id: memory.id,
      date: memory.date,
      location: memory.location,
      text: memory.text,
      mediaType: memory.mediaType,
      mediaPath: memory.mediaPath,
      scene: memory.scene,
      sceneProfile
    });

    this.onRecorderStop = (res) => {
      this.saveCurrent({ audioPath: res.tempFilePath, progress: "已完成 70%", progressPercent: 70 });
      this.clearTimer();
      this.setData({ recording: false, recordText: "已保存原声" });
    };
    this.onRecorderError = () => {
      this.clearTimer();
      this.setData({ recording: false, recordText: "录音失败" });
      wx.showToast({ title: "请检查麦克风权限", icon: "none" });
    };

    recorder.onStop(this.onRecorderStop);
    recorder.onError(this.onRecorderError);
  },

  switchInput(event) {
    this.setData({ activeInput: event.currentTarget.dataset.mode });
  },

  toggleInterview() {
    this.setData({ aiInterviewEnabled: !this.data.aiInterviewEnabled });
  },

  saveCurrent(extra = {}) {
    const previous = memoryStore.getMemory(this.data.id);
    const next = {
      ...previous,
      date: this.data.date,
      location: this.data.location,
      text: this.data.text,
      mediaType: this.data.mediaType,
      mediaPath: this.data.mediaPath,
      progress: this.data.text ? "已完成 60%" : "草稿 30%",
      progressPercent: this.data.text ? 60 : 30,
      ...extra
    };
    memoryStore.saveMemory(next);
    return next;
  },

  chooseMedia() {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image", "video"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const file = res.tempFiles[0];
        const mediaType = res.type === "video" ? "video" : "image";
        const mediaPath = file.tempFilePath;
        this.setData({ mediaType, mediaPath });
        this.saveCurrent({ mediaType, mediaPath, progress: "已完成 45%", progressPercent: 45 });
      }
    });
  },

  onDateInput(event) {
    this.setData({ date: event.detail.value });
    this.saveCurrent();
  },

  onLocationInput(event) {
    this.setData({ location: event.detail.value });
    this.saveCurrent();
  },

  onTextInput(event) {
    this.setData({ text: event.detail.value });
    this.saveCurrent();
  },

  toggleRecord() {
    if (this.data.recording) {
      recorder.stop();
      return;
    }

    this.setData({ recording: true, recordStartedAt: Date.now(), recordText: "00:00" });
    this.data.timer = setInterval(() => {
      const seconds = Math.floor((Date.now() - this.data.recordStartedAt) / 1000);
      const minute = String(Math.floor(seconds / 60)).padStart(2, "0");
      const second = String(seconds % 60).padStart(2, "0");
      this.setData({ recordText: `${minute}:${second}` });
    }, 300);

    try {
      recorder.start({
        duration: 120000,
        format: "mp3"
      });
    } catch (error) {
      this.clearTimer();
      this.setData({ recording: false, recordText: "录音失败" });
      wx.showToast({ title: "录音暂不可用", icon: "none" });
    }
  },

  clearTimer() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.data.timer = null;
    }
  },

  goPreview() {
    const memory = this.saveCurrent();
    memory.progress = "已完成 80%";
    memory.progressPercent = 80;
    memoryStore.saveMemory(memory);
    wx.navigateTo({ url: `/pages/preview/preview?id=${memory.id}` });
  },

  onUnload() {
    this.clearTimer();
    if (this.onRecorderStop && recorder.offStop) recorder.offStop(this.onRecorderStop);
    if (this.onRecorderError && recorder.offError) recorder.offError(this.onRecorderError);
  }
});
