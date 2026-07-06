const memoryStore = require("./memory-store");

// Replace these methods with cloud function/API calls when the backend is ready.
// Pages should call this adapter instead of touching wx storage directly.
function listMemories() {
  return Promise.resolve(memoryStore.listMemories());
}

function getMemory(id) {
  return Promise.resolve(memoryStore.getMemory(id));
}

function createMemory(scene) {
  return Promise.resolve(memoryStore.createMemory(scene));
}

function saveMemory(memory) {
  return Promise.resolve(memoryStore.saveMemory(memory));
}

function setActiveMemoryId(id) {
  memoryStore.setActiveMemoryId(id);
}

function getActiveMemoryId() {
  return memoryStore.getActiveMemoryId();
}

module.exports = {
  listMemories,
  getMemory,
  createMemory,
  saveMemory,
  setActiveMemoryId,
  getActiveMemoryId
};
