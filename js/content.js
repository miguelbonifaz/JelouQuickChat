// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "pasteMessage") {
    pasteMessageToChat(message.content);
  }
});

// Function to paste message to active chat input
function pasteMessageToChat(content) {
  // Common chat input selectors
  const chatInputSelectors = [
    // WhatsApp Web
    '[contenteditable="true"][data-lexical-editor="true"]', // WhatsApp main input
    '.selectable-text.copyable-text[contenteditable="true"]', // Older WhatsApp versions
    // Generic web chat inputs
    'textarea[placeholder*="message"]',
    'textarea[placeholder*="mensaje"]',
    'textarea[placeholder*="chat"]',
    'textarea[placeholder*="escribe"]',
    '[contenteditable="true"][role="textbox"]',
    'div[role="textbox"]',
    ".chat-input",
    ".message-input",
  ];

  // Try to find chat input element
  let chatInput = null;

  for (const selector of chatInputSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length) {
      // Prioritize elements that are visible and in the viewport
      for (const element of elements) {
        if (isElementVisible(element)) {
          chatInput = element;
          break;
        }
      }
      if (chatInput) break;
    }
  }

  if (!chatInput) {
    alert(
      "No se pudo encontrar un campo de chat en esta página. Intenta hacer clic en el campo de chat antes de pegar el mensaje."
    );
    return;
  }

  // Handle different types of inputs
  if (chatInput.tagName.toLowerCase() === "textarea") {
    // For standard textarea elements
    chatInput.focus();
    chatInput.value = content;

    // Trigger input event to notify the app that the content has changed
    chatInput.dispatchEvent(new Event("input", { bubbles: true }));
  } else if (chatInput.getAttribute("contenteditable") === "true") {
    // For contenteditable elements (like WhatsApp)
    chatInput.focus();

    // Replace content using execCommand (works in most browsers)
    document.execCommand("insertText", false, content);

    // If execCommand didn't work, try setting innerHTML
    if (chatInput.textContent.trim() !== content) {
      chatInput.innerHTML = "";
      chatInput.textContent = content;

      // Trigger input event
      chatInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    }
  }

  // Notify user
  showToast("Mensaje pegado correctamente");
}

// Helper function to check if an element is visible
function isElementVisible(element) {
  if (!element) return false;

  const style = window.getComputedStyle(element);
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.opacity === "0"
  ) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Show a toast notification
function showToast(message) {
  // Create toast element
  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    z-index: 9999;
    font-family: sans-serif;
    font-size: 14px;
  `;

  toast.textContent = message;
  document.body.appendChild(toast);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.5s";

    // Remove from DOM after fade out
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 500);
  }, 3000);
}
