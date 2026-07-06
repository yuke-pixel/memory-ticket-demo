const storageKey = "memory-ticket-demo-state";

const state = {
  route: "home",
  scene: "一次旅行",
  template: "train",
  questionIndex: 0,
  recording: false,
  playing: false,
  product: "single",
  mediaType: "photo",
  recorder: null,
  audioChunks: [],
  audioUrl: "",
  recordStartedAt: 0,
  recordTimer: null,
  messages: [],
  generated: {
    title: "去海边的那天",
    subtitle: "风很大，我们把黄昏留在一张票上。",
    backCopy: "那天我们沿着海边走了很久，谁都没有急着回去。风把头发吹得很乱，便利店门口那瓶汽水却很甜。后来每次听见海浪声，我都会想起这个黄昏。",
    storyOne: "我们沿着海边走了很久，谁都没有急着回去。那天风很大，很多话都被吹散了，只剩下脚印、笑声和便利店门口那瓶分着喝的汽水。",
    storyTwo: "后来我才发现，重要的不是那片海有多漂亮，而是那一天我们都还在同一个傍晚里。",
  },
};

const questions = [
  "这张照片拍完之后，发生了什么？",
  "这趟旅程里，你最舍不得哪个瞬间？",
  "如果这张票有一个目的地，它会写哪里？",
  "当时有一句你现在还记得的话吗？",
];

const templateMap = {
  train: {
    kind: "MEMORY TRAIN",
    fallbackTitle: "去海边的那天",
    fallbackSubtitle: "风很大，我们把黄昏留在一张票上。",
  },
  boarding: {
    kind: "BOARDING MEMORY",
    fallbackTitle: "飞往夏天以前",
    fallbackSubtitle: "那次出发，比目的地更值得保存。",
  },
  campus: {
    kind: "CAMPUS PASS",
    fallbackTitle: "毕业前最后一节课",
    fallbackSubtitle: "教室还亮着，我们已经开始想念。",
  },
};

function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function loadDraft() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return;

  try {
    const draft = JSON.parse(raw);
    Object.assign(state, draft.state || {});
    $("#memoryDate").value = draft.date || $("#memoryDate").value;
    $("#memoryLocation").value = draft.location || $("#memoryLocation").value;
    $("#answerInput").value = draft.answer || $("#answerInput").value;
    if (draft.photo) {
      setPhoto(draft.photo, "已恢复草稿照片");
    }
    if (draft.video && state.mediaType === "video") {
      setVideo(draft.video, "已恢复草稿视频");
    }
  } catch {
    localStorage.removeItem(storageKey);
  }
}

function saveDraft(showToast = true) {
  const draft = {
    state: {
      scene: state.scene,
      template: state.template,
      product: state.product,
      mediaType: state.mediaType,
      generated: state.generated,
      messages: state.messages,
    },
    date: $("#memoryDate").value,
    location: $("#memoryLocation").value,
    answer: $("#answerInput").value,
    photo: $(".memory-photo").src,
    video: $("#memoryVideo").src,
  };
  localStorage.setItem(storageKey, JSON.stringify(draft));
  if (showToast) {
    $("#saveDraft").textContent = "已保存";
    window.setTimeout(() => {
      $("#saveDraft").textContent = "保存草稿";
    }, 1200);
  }
}

function setRoute(route) {
  if (!document.querySelector(`#screen-${route}`)) {
    route = "home";
  }
  if (route === "preview") {
    generateMemory();
  }

  state.route = route;
  $all(".screen").forEach((screen) => {
    screen.classList.toggle("is-active", screen.id === `screen-${route}`);
  });
  $all(".tab").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.route === route);
  });
  const url = new URL(window.location.href);
  url.searchParams.set("screen", route);
  window.history.replaceState({}, "", url);
}

function setTemplate(template) {
  state.template = template;
  const ticket = $("#ticketCard");
  const data = templateMap[template];

  ticket.className = `ticket-card ${template}`;
  $("#ticketKind").textContent = data.kind;
  $all("#templateSwitcher button").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.template === template);
  });
  generateMemory(false);
}

function sceneTitle(scene, location) {
  if (scene === "一个毕业季") return "毕业前最后一节课";
  if (scene === "一个重要的人") return "留给 TA 的声音";
  if (location.includes("海")) return "去海边的那天";
  if (location.includes("山")) return "走到山顶那天";
  return "值得留下的那天";
}

function trimText(text, maxLength) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1)}…`;
}

function generateMemory(save = true) {
  const date = $("#memoryDate").value.trim() || "某一天";
  const location = $("#memoryLocation").value.trim() || "某个地方";
  const answer = $("#answerInput").value.trim();
  const template = templateMap[state.template];

  const title = sceneTitle(state.scene, location) || template.fallbackTitle;
  const subtitle = state.scene === "一个重要的人"
    ? "把 TA 的声音留在一张票里。"
    : location.includes("海")
      ? "风很大，我们把黄昏留在一张票上。"
      : template.fallbackSubtitle;

  const backCopy = answer
    ? trimText(answer, 92)
    : "有些时刻不需要很长，只要还有照片、声音和那天的日期，就能重新被打开。";

  state.generated = {
    title,
    subtitle,
    backCopy,
    storyOne: answer || "这段记忆还没有补充太多细节，但那张照片已经把当时的光、地点和心情留了下来。",
    storyTwo: `后来再想起${location}，最清楚的不是路线，而是那一刻的声音、停顿和舍不得。`,
  };

  $("#ticketTitle").textContent = title;
  $("#ticketSubtitle").textContent = subtitle;
  $("#ticketBackCopy").textContent = backCopy;
  $("#ticketDate").textContent = date;
  $("#ticketFrom").textContent = `FROM ${location.split(/[ ·，,]/)[0] || location}`;
  $("#storyMeta").textContent = `${date} · ${location}`;
  $("#storyTitle").textContent = title;
  $("#storyParagraphOne").textContent = state.generated.storyOne;
  $("#storyParagraphTwo").textContent = state.generated.storyTwo;

  if (save) saveDraft(false);
}

function setPhoto(src, label = "已选 1 张照片") {
  state.mediaType = "photo";
  $("#memoryVideo").hidden = true;
  $("#memoryVideo").removeAttribute("src");
  $("#storyVideo").removeAttribute("src");
  $("#storyVideoCard").hidden = true;
  $(".memory-photo").hidden = false;
  $all(".memory-photo, .story-hero img, .photo-strip img").forEach((image) => {
    image.src = src;
  });
  $("#photoState").textContent = label;
  $("#mediaSummary").textContent = label.includes("恢复") ? "已添加 1 张草稿照片" : "已添加 1 张照片";
}

function setVideo(src, label = "已选 1 段视频") {
  state.mediaType = "video";
  $(".memory-photo").hidden = true;
  $("#memoryVideo").hidden = false;
  $("#memoryVideo").src = src;
  $("#storyVideo").src = src;
  $("#storyVideoCard").hidden = false;
  $("#photoState").textContent = label;
  $("#mediaSummary").textContent = "已添加 1 段视频";
}

function refreshAssetSummary() {
  const textLength = $("#answerInput").value.trim().length;
  $("#textSummary").textContent = textLength ? `文字 ${textLength} 字` : "文字待补充";
  $("#voiceSummary").textContent = state.recording ? "正在录音" : "语音 28 秒";
}

function renderMessages() {
  const list = $("#messageList");
  list.innerHTML = "";
  state.messages.forEach((message) => {
    const item = document.createElement("p");
    item.textContent = message;
    list.appendChild(item);
  });
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutePart = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secondPart = String(seconds % 60).padStart(2, "0");
  return `${minutePart}:${secondPart}`;
}

function setRecordedAudio(blob) {
  if (state.audioUrl) URL.revokeObjectURL(state.audioUrl);
  state.audioUrl = URL.createObjectURL(blob);
  $("#storyAudio").src = state.audioUrl;
  $("#recordState").textContent = "已录制原声";
  $("#recordHint").textContent = "已同步到扫码故事页";
  $("#audioTime").textContent = formatDuration((Date.now() - state.recordStartedAt) / 1000);
  $("#voiceSummary").textContent = "已添加 1 段语音";
}

function startFallbackRecording() {
  state.recording = true;
  state.recordStartedAt = Date.now();
  $("#recordButton").classList.add("is-recording");
  $("#recordHint").textContent = "当前浏览器未开放录音权限，正在模拟录音";
  state.recordTimer = window.setInterval(() => {
    $("#recordState").textContent = `正在录音 ${formatDuration((Date.now() - state.recordStartedAt) / 1000)}`;
  }, 250);
  refreshAssetSummary();
}

async function toggleRecording() {
  if (state.recording) {
    state.recording = false;
    $("#recordButton").classList.remove("is-recording");
    if (state.recordTimer) window.clearInterval(state.recordTimer);
    state.recordTimer = null;
    if (state.recorder && state.recorder.state !== "inactive") {
      state.recorder.stop();
    } else {
      $("#recordState").textContent = "原声 00:28";
      $("#recordHint").textContent = "会保留在私密故事页";
    }
    refreshAssetSummary();
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    startFallbackRecording();
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.audioChunks = [];
    state.recorder = new MediaRecorder(stream);
    state.recordStartedAt = Date.now();
    state.recording = true;
    $("#recordButton").classList.add("is-recording");
    $("#recordHint").textContent = "正在采集原声，点击按钮结束";
    state.recordTimer = window.setInterval(() => {
      $("#recordState").textContent = `正在录音 ${formatDuration((Date.now() - state.recordStartedAt) / 1000)}`;
    }, 250);

    state.recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) state.audioChunks.push(event.data);
    });
    state.recorder.addEventListener("stop", () => {
      stream.getTracks().forEach((track) => track.stop());
      if (state.recordTimer) window.clearInterval(state.recordTimer);
      state.recordTimer = null;
      const blob = new Blob(state.audioChunks, { type: state.recorder.mimeType || "audio/webm" });
      if (blob.size > 0) setRecordedAudio(blob);
      refreshAssetSummary();
    });
    state.recorder.start();
    refreshAssetSummary();
  } catch {
    startFallbackRecording();
  }
}

document.addEventListener("click", (event) => {
  const routeTarget = event.target.closest("[data-route]");
  if (routeTarget) {
    setRoute(routeTarget.dataset.route);
    return;
  }

  const sceneTarget = event.target.closest("[data-scene]");
  if (sceneTarget) {
    state.scene = sceneTarget.dataset.scene;
    $all("[data-scene]").forEach((button) => {
      button.classList.toggle("is-selected", button === sceneTarget);
    });
    saveDraft(false);
    return;
  }

  const templateTarget = event.target.closest("[data-template]");
  if (templateTarget) {
    setTemplate(templateTarget.dataset.template);
    return;
  }

  const productTarget = event.target.closest(".product-option");
  if (productTarget) {
    state.product = productTarget.textContent.includes("6 张") ? "set" : "single";
    $all(".product-option").forEach((button) => {
      button.classList.toggle("is-selected", button === productTarget);
    });
    saveDraft(false);
  }
});

$("#nextQuestion").addEventListener("click", () => {
  state.questionIndex = (state.questionIndex + 1) % questions.length;
  $("#questionText").textContent = questions[state.questionIndex];
});

$("#saveDraft").addEventListener("click", () => saveDraft(true));

$("#recordButton").addEventListener("click", () => toggleRecording());

$("#playButton").addEventListener("click", () => {
  if (state.audioUrl) {
    const audio = $("#storyAudio");
    if (audio.paused) {
      audio.play().catch(() => {
        state.playing = false;
      });
      state.playing = true;
    } else {
      audio.pause();
      state.playing = false;
    }
  } else {
    state.playing = !state.playing;
  }
  $("#playButton").textContent = state.playing ? "Ⅱ" : "▶";
  $(".waveform").classList.toggle("is-playing", state.playing);
  if (!state.audioUrl) {
    $("#audioTime").textContent = state.playing ? "00:12" : "00:28";
  }
});

$("#storyAudio").addEventListener("ended", () => {
  state.playing = false;
  $("#playButton").textContent = "▶";
  $(".waveform").classList.remove("is-playing");
});

$("#storyAudio").addEventListener("timeupdate", () => {
  const audio = $("#storyAudio");
  $("#audioTime").textContent = formatDuration(audio.currentTime || 0);
});

$("#photoInput").addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    if (file.type.startsWith("video/")) {
      setVideo(reader.result, "已选本地视频");
    } else {
      setPhoto(reader.result, "已选本地照片");
    }
    saveDraft(false);
  });
  reader.readAsDataURL(file);
});

["memoryDate", "memoryLocation", "answerInput"].forEach((id) => {
  $(`#${id}`).addEventListener("input", () => {
    refreshAssetSummary();
    saveDraft(false);
  });
});

["ticketTitle", "ticketSubtitle", "ticketBackCopy"].forEach((id) => {
  $(`#${id}`).addEventListener("input", () => {
    $("#storyTitle").textContent = $("#ticketTitle").textContent;
    $("#storyParagraphOne").textContent = $("#ticketBackCopy").textContent;
    saveDraft(false);
  });
});

$("#addMessage").addEventListener("click", () => {
  const input = $("#messageInput");
  const value = input.value.trim();
  if (!value) return;

  state.messages.unshift(value);
  input.value = "";
  renderMessages();
  saveDraft(false);
});

loadDraft();
renderMessages();
refreshAssetSummary();
setTemplate(state.template || "train");
setRoute(new URLSearchParams(window.location.search).get("screen") || "home");
