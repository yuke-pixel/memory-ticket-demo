const memoryStore = require("../../services/memory-store");

Page({
  data: {
    id: "",
    memory: {},
    shortText: "",
    sceneProfile: {},
    templates: [],
    selectedTemplate: ""
  },

  onLoad(options) {
    const id = options.id || memoryStore.getActiveMemoryId();
    this.setData({ id });
  },

  onShow() {
    const memory = memoryStore.getMemory(this.data.id || memoryStore.getActiveMemoryId());
    const sceneProfile = memoryStore.getSceneProfile(memory.scene);
    const fallbackCopy = `${memory.location}，${sceneProfile.question}`;
    this.setData({
      memory,
      sceneProfile,
      templates: memoryStore.listTemplates(),
      selectedTemplate: memory.template,
      shortText: memory.text
        ? (memory.text.length > 58 ? `${memory.text.slice(0, 58)}…` : memory.text)
        : fallbackCopy
    });
  },

  selectTemplate(event) {
    const key = event.currentTarget.dataset.key;
    const template = memoryStore.getTemplate(key);
    const memory = memoryStore.saveMemory({
      ...this.data.memory,
      template: template.key,
      templateName: template.name,
      backgroundPath: template.backgroundPath,
      customBackgroundPath: "",
      progress: "已完成 80%",
      progressPercent: 80
    });
    this.setData({
      memory,
      selectedTemplate: template.key
    });
  },

  chooseCustomBackground() {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const file = res.tempFiles[0];
        const customBackgroundPath = file.tempFilePath;
        const memory = memoryStore.saveMemory({
          ...this.data.memory,
          template: "custom",
          templateName: "自定义",
          backgroundPath: customBackgroundPath,
          customBackgroundPath,
          progress: "已完成 85%",
          progressPercent: 85
        });
        this.setData({
          memory,
          selectedTemplate: "custom"
        });
      }
    });
  },

  goStory() {
    wx.navigateTo({ url: `/pages/story/story?id=${this.data.memory.id}` });
  }
});
