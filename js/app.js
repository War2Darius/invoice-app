// ==================== ГОЛОВНИЙ ФАЙЛ (ІНІЦІАЛІЗАЦІЯ) ====================

async function initApp() {
  try {
    db = await openDB();
    await initDefaultProfile();
    await loadStockFromDB();
    await loadCustomersFromDB();
    await loadInvoicesFromDB();

    renderStock();
    renderCustomers();
    renderRecentInvoices();
    loadProfileToForm();
    updateStats();

    setupEventListeners();
    setupBackupButtons();
    setupSignatureHandlers();
    registerServiceWorker();

    console.log("Додаток успішно запущено");
  } catch (e) {
    console.error("Помилка ініціалізації:", e);
    alert("Помилка запуску додатку: " + e.message);
  }
}

function setupEventListeners() {
  // Навігація
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pageId = btn.dataset.page;
      document
        .querySelectorAll(".page")
        .forEach((p) => p.classList.remove("active"));
      document.getElementById(pageId).classList.add("active");
      document
        .querySelectorAll(".nav-item")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      if (pageId === "stock") renderStock();
      if (pageId === "customers") renderCustomers();
      if (pageId === "home") {
        renderRecentInvoices();
        updateStats();
      }
    });
  });

  // Пошук на складі
  const stockSearch = document.getElementById("stock-search");
  if (stockSearch) stockSearch.addEventListener("keyup", () => renderStock());

  // Пошук покупців
  const customerSearch = document.getElementById("customer-search");
  if (customerSearch)
    customerSearch.addEventListener("keyup", () => renderCustomers());

  // Кнопки модальних вікон
  document
    .getElementById("newInvoiceBtn")
    ?.addEventListener("click", () => openInvoiceModal());
  document
    .getElementById("addStockBtn")
    ?.addEventListener("click", () => openStockModal());
  document
    .getElementById("addCustomerBtn")
    ?.addEventListener("click", () => openCustomerModal());
  document
    .getElementById("saveProfileBtn")
    ?.addEventListener("click", () => saveProfileForm());

  // Закриття модальних вікон
  document
    .getElementById("closeInvoiceModal")
    ?.addEventListener("click", () => closeInvoiceModal());
  document
    .getElementById("closeStockModal")
    ?.addEventListener("click", () => closeStockModal());
  document
    .getElementById("closeCustomerModal")
    ?.addEventListener("click", () => closeCustomerModal());

  // Збереження в модальних вікнах
  document
    .getElementById("saveStockBtn")
    ?.addEventListener("click", () => saveStockItem());
  document
    .getElementById("saveCustomerBtn")
    ?.addEventListener("click", () => saveCustomer());

  // Закриття модальних вікон при кліку на фон
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      e.target.classList.remove("active");
    }
  });
}

function setupBackupButtons() {
  const exportProfileBtn = document.getElementById("exportProfileBtn");
  const exportStockBtn = document.getElementById("exportStockBtn");
  const exportCustomersBtn = document.getElementById("exportCustomersBtn");
  const exportInvoicesBtn = document.getElementById("exportInvoicesBtn");
  const clearAllDataBtn = document.getElementById("clearAllDataBtn");

  if (exportProfileBtn)
    exportProfileBtn.addEventListener("click", () => exportDataType("profile"));
  if (exportStockBtn)
    exportStockBtn.addEventListener("click", () => exportDataType("stock"));
  if (exportCustomersBtn)
    exportCustomersBtn.addEventListener("click", () =>
      exportDataType("customers"),
    );
  if (exportInvoicesBtn)
    exportInvoicesBtn.addEventListener("click", () =>
      exportDataType("invoices"),
    );
  if (clearAllDataBtn)
    clearAllDataBtn.addEventListener("click", () => clearAllData());

  setupImportFileInput();
}

// ==================== ПІДПИС ====================

async function setupSignatureHandlers() {
  const signatureInput = document.getElementById("signature-input");
  const deleteSignatureBtn = document.getElementById("delete-signature-btn");

  if (signatureInput) {
    signatureInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.includes("png")) {
        alert("Будь ласка, оберіть PNG файл");
        signatureInput.value = "";
        return;
      }

      try {
        showLoading("Зберігаємо підпис...");
        await saveSignatureFile(file);
        await updateSignaturePreview();
        alert("✅ Підпис збережено!");
      } catch (err) {
        alert("❌ Помилка: " + err);
      } finally {
        hideLoading();
        signatureInput.value = "";
      }
    });
  }

  if (deleteSignatureBtn) {
    deleteSignatureBtn.addEventListener("click", async () => {
      if (confirm("Видалити збережений підпис?")) {
        await deleteSignature();
        await updateSignaturePreview();
        alert("✅ Підпис видалено");
      }
    });
  }

  await updateSignaturePreview();
}

async function updateSignaturePreview() {
  const signaturePreview = document.getElementById("signature-preview");
  if (!signaturePreview) return;

  try {
    const signature = await loadSignature();
    if (signature) {
      signaturePreview.innerHTML = `<img src="${signature}" style="height: 50px; width: auto; border: 1px solid #ddd; border-radius: 4px;"><br>✅ Підпис збережено`;
      signaturePreview.style.color = "#4caf50";
    } else {
      signaturePreview.innerHTML = "❌ Підпис не встановлено";
      signaturePreview.style.color = "#999";
    }
  } catch (e) {
    signaturePreview.innerHTML = "❌ Помилка завантаження підпису";
    signaturePreview.style.color = "#f44336";
  }
}

// ==================== SERVICE WORKER (PWA) ====================

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => {
        console.log("✅ Service Worker зареєстровано:", reg);
      })
      .catch((err) => {
        console.error("❌ Помилка реєстрації Service Worker:", err);
      });
  } else {
    console.log("❌ Service Worker не підтримується");
  }
}

// Запуск додатку
document.addEventListener("DOMContentLoaded", initApp);
