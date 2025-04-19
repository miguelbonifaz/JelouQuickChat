// Background script for JelouQuickChat

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("JelouQuickChat extension installed");

  // Initialize empty messages array in storage if it doesn't exist
  chrome.storage.sync.get("messages", (data) => {
    if (!data.messages) {
      chrome.storage.sync.set({ messages: [] });
    }
  });
});

// Context menu for quick access
chrome.contextMenus.create({
  id: "jelou-quick-chat",
  title: "Abrir JelouQuickChat",
  contexts: ["all"],
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "jelou-quick-chat") {
    chrome.action.openPopup();
  }
});
