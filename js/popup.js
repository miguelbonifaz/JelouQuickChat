document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  const messageForm = document.getElementById("message-form");
  const messageList = document.getElementById("message-list");
  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");

  // Tab switching
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");

      // Update active tab button
      tabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Show selected tab content
      tabContents.forEach((tab) => {
        if (tab.id === `${tabId}-tab`) {
          tab.style.display = "block";

          // If list tab is selected, refresh the message list
          if (tabId === "list") {
            loadMessages();
          }
        } else {
          tab.style.display = "none";
        }
      });
    });
  });

  // Save message
  messageForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("message-title").value;
    const content = document.getElementById("message-content").value;
    const category = document.getElementById("message-category").value;

    saveMessage({
      title,
      content,
      category,
      createdAt: new Date().toISOString(),
    });
    messageForm.reset();
  });

  // Search and filter
  searchInput.addEventListener("input", loadMessages);
  categoryFilter.addEventListener("change", loadMessages);

  // Initial load
  loadCategories();

  // Functions
  function saveMessage(message) {
    chrome.storage.sync.get({ messages: [] }, (data) => {
      const messages = data.messages;
      message.id = Date.now().toString();
      messages.push(message);

      chrome.storage.sync.set({ messages }, () => {
        alert("Mensaje guardado correctamente");
      });
    });
  }

  function loadMessages() {
    const searchTerm = searchInput.value.toLowerCase();
    const categoryValue = categoryFilter.value;

    chrome.storage.sync.get({ messages: [] }, (data) => {
      let messages = data.messages;

      // Apply filters
      if (searchTerm) {
        messages = messages.filter(
          (msg) =>
            msg.title.toLowerCase().includes(searchTerm) ||
            msg.content.toLowerCase().includes(searchTerm)
        );
      }

      if (categoryValue) {
        messages = messages.filter((msg) => msg.category === categoryValue);
      }

      // Sort by date (newest first)
      messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Render messages
      renderMessageList(messages);
    });
  }

  function renderMessageList(messages) {
    messageList.innerHTML = "";

    if (messages.length === 0) {
      messageList.innerHTML = "<p>No hay mensajes guardados</p>";
      return;
    }

    messages.forEach((message) => {
      const messageEl = document.createElement("div");
      messageEl.className = "message-item";
      messageEl.innerHTML = `
        <h3>${message.title}</h3>
        <div class="message-category">Categoría: ${
          message.category || "Sin categoría"
        }</div>
        <div class="message-content">${message.content.substring(0, 100)}${
        message.content.length > 100 ? "..." : ""
      }</div>
        <div class="message-actions">
          <button class="btn-paste" data-id="${message.id}">Pegar</button>
          <button class="btn-edit" data-id="${message.id}">Editar</button>
          <button class="btn-delete" data-id="${message.id}">Eliminar</button>
        </div>
      `;

      messageList.appendChild(messageEl);
    });

    // Add event listeners to buttons
    document.querySelectorAll(".btn-paste").forEach((btn) => {
      btn.addEventListener("click", () =>
        pasteMessage(btn.getAttribute("data-id"))
      );
    });

    document.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", () =>
        editMessage(btn.getAttribute("data-id"))
      );
    });

    document.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", () =>
        deleteMessage(btn.getAttribute("data-id"))
      );
    });
  }

  function loadCategories() {
    chrome.storage.sync.get({ messages: [] }, (data) => {
      const categories = [
        ...new Set(data.messages.map((msg) => msg.category).filter(Boolean)),
      ];

      categoryFilter.innerHTML =
        '<option value="">Todas las categorías</option>';

      categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
      });
    });
  }

  function pasteMessage(id) {
    chrome.storage.sync.get({ messages: [] }, (data) => {
      const message = data.messages.find((msg) => msg.id === id);

      if (message) {
        // Send message content to content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: "pasteMessage",
            content: message.content,
          });
        });
      }
    });
  }

  function editMessage(id) {
    chrome.storage.sync.get({ messages: [] }, (data) => {
      const message = data.messages.find((msg) => msg.id === id);

      if (message) {
        // Switch to create tab
        document.querySelector('[data-tab="create"]').click();

        // Fill form with message data
        document.getElementById("message-title").value = message.title;
        document.getElementById("message-content").value = message.content;
        document.getElementById("message-category").value =
          message.category || "";

        // Remove old message
        deleteMessage(id, false);
      }
    });
  }

  function deleteMessage(id, showConfirmation = true) {
    if (
      showConfirmation &&
      !confirm("¿Estás seguro de eliminar este mensaje?")
    ) {
      return;
    }

    chrome.storage.sync.get({ messages: [] }, (data) => {
      const updatedMessages = data.messages.filter((msg) => msg.id !== id);

      chrome.storage.sync.set({ messages: updatedMessages }, () => {
        if (showConfirmation) {
          loadMessages();
          loadCategories();
        }
      });
    });
  }
});
