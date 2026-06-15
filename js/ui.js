// ==================== ВІДОБРАЖЕННЯ UI ====================

// Змінні для пагінації
let currentPage = 1;
let itemsPerPage = 20;
let filteredInvoices = [];

function renderStock() {
  const searchTerm = (
    document.getElementById("stock-search")?.value || ""
  ).toLowerCase();
  let filtered = stockList;
  if (searchTerm) {
    filtered = stockList.filter((item) =>
      item.name.toLowerCase().includes(searchTerm),
    );
  }
  const container = document.getElementById("stock-list");
  if (!container) return;
  if (filtered.length === 0) {
    container.innerHTML = '<div class="list-item">Немає товарів</div>';
    return;
  }
  container.innerHTML = filtered
    .map(
      (item) => `
            <div class="list-item">
                <div class="item-info">
                    <div class="item-title">${escapeHtml(item.name)}</div>
                    <div class="item-sub">Кількість: ${item.qty} шт | Ціна: ${item.price} грн</div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-sm btn-outline" onclick="window.editStockItem(${item.id})">✏️</button>
                    <button class="btn btn-sm btn-danger" onclick="window.deleteStockItem(${item.id})">🗑️</button>
                </div>
            </div>
        `,
    )
    .join("");
}

function renderCustomers() {
  const searchTerm = (
    document.getElementById("customer-search")?.value || ""
  ).toLowerCase();
  let filtered = customerList;
  if (searchTerm) {
    filtered = customerList.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm) ||
        (c.phone || "").includes(searchTerm),
    );
  }
  const container = document.getElementById("customers-list");
  if (!container) return;
  if (filtered.length === 0) {
    container.innerHTML = '<div class="list-item">Немає покупців</div>';
    return;
  }
  container.innerHTML = filtered
    .map(
      (c) => `
            <div class="list-item">
                <div class="item-info">
                    <div class="item-title">${escapeHtml(c.name)}</div>
                    <div class="item-sub">${c.type || "ФОП"} | ${c.phone || "без тел."}${c.npBranch ? ` | НП: ${c.npBranch}` : ""}</div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-sm btn-outline" onclick="window.editCustomer(${c.id})">✏️</button>
                    <button class="btn btn-sm btn-danger" onclick="window.deleteCustomer(${c.id})">🗑️</button>
                </div>
            </div>
        `,
    )
    .join("");
}

function renderRecentInvoices() {
  const container = document.getElementById("recent-invoices");
  if (!container) return;
  const recent = allInvoices.slice(0, 10);
  if (recent.length === 0) {
    container.innerHTML = '<div class="list-item">Немає рахунків</div>';
    return;
  }
  container.innerHTML = recent
    .map((inv) => {
      const pdfButton =
        inv.hasInvoice !== false
          ? `<button class="btn btn-sm btn-outline" onclick="window.viewInvoicePdf(${inv.id})">📄 PDF</button>`
          : "";
      return `
            <div class="list-item">
                <div class="item-info">
                    <div class="item-title">Рахунок № ${inv.number} від ${inv.date}</div>
                    <div class="item-sub">${inv.customer?.name || "Невідомий покупець"} | ${inv.totalWithDiscount} грн</div>
                    <div class="item-sub" style="font-size: 10px;">${inv.hasInvoice !== false ? "📄 З квитанцією" : "📦 Без квитанції"}</div>
                </div>
                <div class="item-actions">
                    ${pdfButton}
                    <button class="btn btn-sm btn-outline" onclick="window.editInvoice(${inv.id})">✏️</button>
                    <button class="btn btn-sm btn-danger" onclick="window.deleteInvoice(${inv.id})">🗑️</button>
                </div>
            </div>
        `;
    })
    .join("");
}

// Оновлена функція з пагінацією
function renderAllInvoices() {
  const container = document.getElementById("all-invoices-list");
  const paginationContainer = document.getElementById("pagination-controls");
  if (!container) return;

  const searchTerm = (
    document.getElementById("all-invoices-search")?.value || ""
  ).toLowerCase();

  // Фільтруємо рахунки
  if (searchTerm) {
    filteredInvoices = allInvoices.filter(
      (inv) =>
        inv.number.includes(searchTerm) ||
        inv.customer?.name.toLowerCase().includes(searchTerm),
    );
  } else {
    filteredInvoices = [...allInvoices];
  }

  // Розрахунок пагінації
  const totalItems = filteredInvoices.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Перевірка коректності поточної сторінки
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  // Отримуємо рахунки для поточної сторінки
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageInvoices = filteredInvoices.slice(startIndex, endIndex);

  // Відображення рахунків
  if (pageInvoices.length === 0) {
    container.innerHTML = '<div class="list-item">Немає рахунків</div>';
    if (paginationContainer) paginationContainer.innerHTML = "";
    return;
  }

  container.innerHTML = pageInvoices
    .map((inv) => {
      const pdfButton =
        inv.hasInvoice !== false
          ? `<button class="btn btn-sm btn-outline" onclick="window.viewInvoicePdf(${inv.id})">📄 PDF</button>`
          : "";
      return `
            <div class="list-item">
                <div class="item-info">
                    <div class="item-title">Рахунок № ${inv.number} від ${inv.date}</div>
                    <div class="item-sub">${inv.customer?.name || "Невідомий покупець"} | ${inv.totalWithDiscount} грн</div>
                    <div class="item-sub" style="font-size: 10px;">${inv.hasInvoice !== false ? "📄 З квитанцією" : "📦 Без квитанції"}</div>
                </div>
                <div class="item-actions">
                    ${pdfButton}
                    <button class="btn btn-sm btn-outline" onclick="window.editInvoice(${inv.id})">✏️</button>
                    <button class="btn btn-sm btn-danger" onclick="window.deleteInvoice(${inv.id})">🗑️</button>
                </div>
            </div>
        `;
    })
    .join("");

  // Відображення кнопок пагінації
  if (paginationContainer && totalPages > 1) {
    paginationContainer.innerHTML = `
            <div style="display: flex; justify-content: center; gap: 15px; margin-top: 20px; padding: 10px;">
                <button class="btn btn-sm btn-outline" id="prev-page-btn" ${currentPage === 1 ? 'disabled style="opacity: 0.5;"' : ""}>
                    ← Попередня
                </button>
                <span style="display: flex; align-items: center; font-size: 14px;">
                    Сторінка ${currentPage} з ${totalPages}
                </span>
                <button class="btn btn-sm btn-outline" id="next-page-btn" ${currentPage === totalPages ? 'disabled style="opacity: 0.5;"' : ""}>
                    Наступна →
                </button>
            </div>
        `;

    // Додаємо обробники подій
    const prevBtn = document.getElementById("prev-page-btn");
    const nextBtn = document.getElementById("next-page-btn");

    if (prevBtn && !prevBtn.disabled) {
      prevBtn.onclick = () => {
        if (currentPage > 1) {
          currentPage--;
          renderAllInvoices();
        }
      };
    }

    if (nextBtn && !nextBtn.disabled) {
      nextBtn.onclick = () => {
        if (currentPage < totalPages) {
          currentPage++;
          renderAllInvoices();
        }
      };
    }
  } else if (paginationContainer) {
    paginationContainer.innerHTML = "";
  }
}

// Функція для скидання пагінації при пошуку
function resetPaginationAndSearch() {
  currentPage = 1;
  renderAllInvoices();
}

async function updateStats() {
  const stockTotalQty = stockList.reduce((s, i) => s + (i.qty || 0), 0);
  const stockTypes = stockList.length;
  const customersCount = customerList.length;
  const invoicesCount = allInvoices.length;

  const el1 = document.getElementById("stat-stock-qty");
  const el2 = document.getElementById("stat-stock-types");
  const el3 = document.getElementById("stat-customers");
  const el4 = document.getElementById("stat-invoices");

  if (el1) el1.innerText = stockTotalQty;
  if (el2) el2.innerText = stockTypes;
  if (el3) el3.innerText = customersCount;
  if (el4) el4.innerText = invoicesCount;
}

function loadProfileToForm() {
  loadProfile().then((profile) => {
    if (profile) {
      document.getElementById("profile-type").value = profile.type || "";
      document.getElementById("profile-name").value = profile.name || "";
      document.getElementById("profile-index").value = profile.index || "";
      document.getElementById("profile-city").value = profile.city || "";
      document.getElementById("profile-street").value = profile.street || "";
      document.getElementById("profile-house").value = profile.house || "";
      document.getElementById("profile-region").value = profile.region || "";
      document.getElementById("profile-country").value = profile.country || "";
      document.getElementById("profile-edrpou").value = profile.edrpou || "";
      document.getElementById("profile-iban").value = profile.iban || "";
      document.getElementById("profile-bank").value = profile.bank || "";
      document.getElementById("profile-mfo").value = profile.mfo || "";
      document.getElementById("profile-phone").value = profile.phone || "";
    }
  });
}
