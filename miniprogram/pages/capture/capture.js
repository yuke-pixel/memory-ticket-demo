const memoryStore = require("../../services/memory-store");
const recorder = wx.getRecorderManager();

function toPickerDate(value) {
  const match = String(value || "").match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  if (match) {
    return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
  }
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function formatDate(value) {
  return String(value || "").replace(/-/g, " / ");
}

const defaultChecklist = [
  { key: "people", label: "这一刻和谁在一起", done: false },
  { key: "place", label: "当时所在的地点", done: false },
  { key: "sound", label: "还记得的一句话或声音", done: false }
];

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
    activeMode: "media",
    aiInterview: true,
    checklist: defaultChecklist,
    datePickerValue: "",
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
      datePickerValue: toPickerDate(memory.date),
      location: memory.location,
      text: memory.text,
      mediaType: memory.mediaType,
      mediaPath: memory.mediaPath,
      scene: memory.scene,
      sceneProfile,
      aiInterview: memory.aiInterview !== false,
      checklist: Array.isArray(memory.checklist) ? memory.checklist : defaultChecklist
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

  saveCurrent(extra = {}) {
    const previous = memoryStore.getMemory(this.data.id);
    const next = {
      ...previous,
      date: this.data.date,
      location: this.data.location,
      text: this.data.text,
      mediaType: this.data.mediaType,
      mediaPath: this.data.mediaPath,
      aiInterview: this.data.aiInterview,
      checklist: this.data.checklist,
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

  goBack() {
    this.saveCurrent();
    wx.navigateBack();
  },

  selectMode(event) {
    this.setData({ activeMode: event.currentTarget.dataset.mode });
  },

  onDateChange(event) {
    const datePickerValue = event.detail.value;
    this.setData({ datePickerValue, date: formatDate(datePickerValue) });
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

  toggleAiInterview(event) {
    this.setData({ aiInterview: event.detail.value });
    this.saveCurrent();
  },

  toggleCheckItem(event) {
    const index = Number(event.currentTarget.dataset.index);
    const checklist = this.data.checklist.map((item, itemIndex) => (
      itemIndex === index ? { ...item, done: !item.done } : item
    ));
    this.setData({ checklist });
    this.saveCurrent();
  },

  startRecord() {
    if (this.data.recording) return;
    this.recordStopRequested = false;
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

  stopRecord() {
    if (!this.data.recording || this.recordStopRequested) return;
    this.recordStopRequested = true;
    recorder.stop();
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
    if (this.data.recording) recorder.stop();
    this.clearTimer();
    if (this.onRecorderStop && recorder.offStop) recorder.offStop(this.onRecorderStop);
    if (this.onRecorderError && recorder.offError) recorder.offError(this.onRecorderError);
  }
});
