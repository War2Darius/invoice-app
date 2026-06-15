// ==================== ЛОГІКА РАХУНКІВ ====================

let currentInvoiceItems = [];
let currentEditingInvoiceId = null;

async function getNextInvoiceNumber() {
  let maxNum = 0;
  for (const inv of allInvoices) {
    const num = parseInt(inv.number);
    if (!isNaN(num) && num > maxNum) maxNum = num;
  }
  return (maxNum + 1).toString();
}

function openInvoiceModal(editInvoice = null) {
  currentInvoiceItems = [];
  currentEditingInvoiceId = null;
  if (editInvoice) {
    currentEditingInvoiceId = editInvoice.id;
    currentInvoiceItems = editInvoice.items.map((item) => ({ ...item }));
    renderInvoiceModalForm(
      editInvoice.customer?.id || null,
      editInvoice.number,
      editInvoice.date,
      editInvoice.discount,
    );
  } else {
    renderInvoiceModalForm(null, "", new Date().toISOString().slice(0, 10), 0);
  }
  document.getElementById("invoice-modal").classList.add("active");
}

function closeInvoiceModal() {
  document.getElementById("invoice-modal").classList.remove("active");
  currentInvoiceItems = [];
  currentEditingInvoiceId = null;
}

async function renderInvoiceModalForm(
  selectedCustomerId = null,
  invoiceNumber = "",
  invoiceDate = "",
  discountValue = 0,
) {
  if (!invoiceNumber) {
    invoiceNumber = await getNextInvoiceNumber();
  }

  const customers = customerList;
  const stocks = stockList;
  const container = document.getElementById("invoice-modal-body");

  const customersOptions = customers
    .map(
      (c) =>
        `<option value="${c.id}" ${selectedCustomerId == c.id ? "selected" : ""}>${escapeHtml(c.name)} (${c.phone || "без тел"})</option>`,
    )
    .join("");

  const itemsHtml = currentInvoiceItems
    .map(
      (item, idx) => `
        <div class="item-row">
            <div><strong>${escapeHtml(item.name)}</strong></div>
            <div>Кількість: ${item.qty} шт × ${item.price} грн = ${item.qty * item.price} грн</div>
            <div class="row-buttons">
                <button class="btn btn-sm btn-danger" onclick="removeInvoiceItem(${idx})">Видалити</button>
            </div>
        </div>
    `,
    )
    .join("");

  const totalOriginal = currentInvoiceItems.reduce(
    (sum, i) => sum + i.qty * i.price,
    0,
  );
  const discount = discountValue;
  const totalWithDiscount = totalOriginal - discount;

  container.innerHTML = `
        <div class="form-group">
            <label>Номер рахунку</label>
            <input type="text" id="invoice-number" value="${invoiceNumber}">
        </div>
        <div class="form-group">
            <label>Дата</label>
            <input type="date" id="invoice-date" value="${invoiceDate}">
        </div>
        <div class="form-group">
            <label>Покупець</label>
            <select id="invoice-customer">
                <option value="">-- Оберіть покупця --</option>
                ${customersOptions}
            </select>
            <button class="btn btn-sm btn-outline" style="margin-top:5px" onclick="openCustomerModal()">+ Новий покупець</button>
        </div>
        <div class="form-group">
            <label>Додати товар</label>
            <select id="product-select">
                <option value="">-- Оберіть товар --</option>
                ${stocks.map((p) => `<option value="${p.id}" data-price="${p.price}" data-name="${escapeHtml(p.name)}" data-qty="${p.qty}">${escapeHtml(p.name)} (${p.qty} шт, ${p.price} грн)</option>`).join("")}
            </select>
            <div class="flex-row" style="margin-top:8px">
                <input type="number" id="product-qty" placeholder="Кількість" style="flex:1">
                <button class="btn btn-sm" onclick="addProductToInvoice()">+ Додати</button>
            </div>
            <div id="product-warning" class="warning"></div>
        </div>
        <div id="invoice-items-list">
            ${itemsHtml || "<div>Немає товарів</div>"}
        </div>
        <div class="total-row"><span>Оригінальна сума:</span><span>${totalOriginal.toFixed(2)} грн</span></div>
        <div class="form-group">
            <label>Знижка (грн)</label>
            <input type="number" id="invoice-discount" value="${discount}" min="0" max="${totalOriginal}" step="1" oninput="updateDiscountTotal()">
        </div>
        <div class="total-row"><span>Сума зі знижкою:</span><span id="total-with-discount">${totalWithDiscount.toFixed(2)} грн</span></div>
        <div class="flex-row" style="gap: 10px; margin-top: 20px;">
            <button class="btn" onclick="saveInvoice(false)">💾 Зберегти рахунок</button>
            <button class="btn btn-secondary" onclick="saveInvoice(true)">📄 Зберегти та PDF</button>
        </div>
    `;
}

function updateDiscountTotal() {
  const totalOriginal = currentInvoiceItems.reduce(
    (sum, i) => sum + i.qty * i.price,
    0,
  );
  const discount =
    parseFloat(document.getElementById("invoice-discount")?.value) || 0;
  const finalDiscount = Math.min(discount, totalOriginal);
  if (document.getElementById("invoice-discount")) {
    document.getElementById("invoice-discount").value = finalDiscount;
  }
  const totalWithDiscount = totalOriginal - finalDiscount;
  const span = document.getElementById("total-with-discount");
  if (span) span.innerText = totalWithDiscount.toFixed(2) + " грн";
}

function addProductToInvoice() {
  const select = document.getElementById("product-select");
  const productId = select.value;
  if (!productId) {
    alert("Оберіть товар");
    return;
  }
  const qtyInput = document.getElementById("product-qty");
  let qty = parseInt(qtyInput.value);
  if (isNaN(qty) || qty <= 0) {
    alert("Введіть кількість");
    return;
  }
  const product = stockList.find((p) => p.id == productId);
  if (!product) {
    alert("Товар не знайдено");
    return;
  }
  if (product.qty < qty) {
    document.getElementById("product-warning").innerText =
      `Недостатньо товару! Доступно: ${product.qty} шт`;
    return;
  }
  document.getElementById("product-warning").innerText = "";
  currentInvoiceItems.push({
    id: product.id,
    name: product.name,
    qty: qty,
    price: product.price,
    sum: product.price * qty,
  });
  renderInvoiceModalForm(
    document.getElementById("invoice-customer")?.value || null,
    document.getElementById("invoice-number")?.value || "",
    document.getElementById("invoice-date")?.value || "",
    parseFloat(document.getElementById("invoice-discount")?.value) || 0,
  );
  qtyInput.value = "";
  select.value = "";
}

function removeInvoiceItem(index) {
  currentInvoiceItems.splice(index, 1);
  renderInvoiceModalForm(
    document.getElementById("invoice-customer")?.value || null,
    document.getElementById("invoice-number")?.value || "",
    document.getElementById("invoice-date")?.value || "",
    parseFloat(document.getElementById("invoice-discount")?.value) || 0,
  );
}

async function saveInvoice(generatePdf = false) {
  try {
    const customerId = document.getElementById("invoice-customer")?.value;
    if (!customerId) {
      alert("Оберіть покупця");
      return;
    }
    const customer = customerList.find((c) => c.id == customerId);
    if (!customer) {
      alert("Покупця не знайдено");
      return;
    }
    const invoiceNumber = document.getElementById("invoice-number")?.value;
    if (!invoiceNumber) {
      alert("Введіть номер рахунку");
      return;
    }
    const invoiceDate = document.getElementById("invoice-date")?.value;
    if (!invoiceDate) {
      alert("Введіть дату");
      return;
    }
    if (currentInvoiceItems.length === 0) {
      alert("Додайте хоча б один товар");
      return;
    }

    const totalOriginal = currentInvoiceItems.reduce(
      (s, i) => s + i.qty * i.price,
      0,
    );
    let discount =
      parseFloat(document.getElementById("invoice-discount")?.value) || 0;
    if (discount > totalOriginal) discount = totalOriginal;
    const totalWithDiscount = totalOriginal - discount;

    // Перевірка наявності товарів
    for (const item of currentInvoiceItems) {
      const stockItem = stockList.find((s) => s.id == item.id);
      if (!stockItem || stockItem.qty < item.qty) {
        alert(
          `Недостатньо товару "${item.name}"! Доступно: ${stockItem?.qty || 0} шт`,
        );
        return;
      }
    }

    // Формуємо рахунок
    const invoice = {
      number: invoiceNumber,
      date: invoiceDate,
      customerId: customer.id,
      customer: { ...customer },
      items: currentInvoiceItems.map((i) => ({ ...i })),
      totalOriginal: totalOriginal,
      discount: discount,
      totalWithDiscount: totalWithDiscount,
    };

    // Списуємо товари
    await updateStockAfterInvoice(currentInvoiceItems, false);

    await saveInvoiceToDB(
      invoice,
      !!currentEditingInvoiceId,
      currentEditingInvoiceId,
    );
    await loadInvoicesFromDB();
    renderRecentInvoices();
    updateStats();
    closeInvoiceModal();

    if (generatePdf) {
      try {
        await generateInvoicePdf(invoice);
      } catch (pdfErr) {
        console.error("Помилка генерації PDF:", pdfErr);
        alert("Рахунок збережено, але сталася помилка при створенні PDF: " + pdfErr.message);
      }
    } else {
      alert("Рахунок збережено!");
    }
  } catch (e) {
    console.error("Помилка збереження:", e);
    alert("Помилка збереження: " + e.message);
  }
}

window.editInvoice = async function (invoiceId) {
  const invoice = allInvoices.find((i) => i.id == invoiceId);
  if (!invoice) return;

  // Відкатуємо товари на склад (для редагування)
  await updateStockAfterInvoice(invoice.items, true);
  await loadStockFromDB();

  currentInvoiceItems = invoice.items.map((i) => ({ ...i }));
  currentEditingInvoiceId = invoice.id;
  renderInvoiceModalForm(
    invoice.customerId,
    invoice.number,
    invoice.date,
    invoice.discount,
  );
  document.getElementById("invoice-modal").classList.add("active");
};

window.deleteInvoice = async function (invoiceId) {
  if (!confirm("Видалити рахунок? Товари повернуться на склад.")) return;
  const invoice = allInvoices.find((i) => i.id == invoiceId);
  if (!invoice) return;

  // Повертаємо товари
  await updateStockAfterInvoice(invoice.items, true);
  await deleteInvoiceFromDB(invoiceId);
  await loadStockFromDB();
  renderStock();
  renderRecentInvoices();
  updateStats();
  alert("Рахунок видалено");
};
