// ==================== МОДАЛЬНІ ВІКНА ====================

// Stock Modal
function openStockModal(editId = null) {
  if (editId) {
    const item = stockList.find((i) => i.id === editId);
    if (item) {
      document.getElementById("stock-modal-title").innerText =
        "✏️ Редагувати товар";
      document.getElementById("stock-id").value = item.id;
      document.getElementById("stock-name").value = item.name;
      document.getElementById("stock-qty").value = item.qty;
      document.getElementById("stock-price").value = item.price;
    }
  } else {
    document.getElementById("stock-modal-title").innerText = "➕ Додати товар";
    document.getElementById("stock-id").value = "";
    document.getElementById("stock-name").value = "";
    document.getElementById("stock-qty").value = "0";
    document.getElementById("stock-price").value = "0";
  }
  document.getElementById("stock-modal").classList.add("active");
}

function closeStockModal() {
  document.getElementById("stock-modal").classList.remove("active");
}

async function handleSaveStockItem() {
  const id = document.getElementById("stock-id").value;
  const item = {
    name: document.getElementById("stock-name").value,
    qty: parseInt(document.getElementById("stock-qty").value) || 0,
    price: parseFloat(document.getElementById("stock-price").value) || 0,
  };
  if (!item.name) {
    alert("Введіть назву товару");
    return;
  }
  await saveStockItem(item, id || null);
  closeStockModal();
  renderStock();
  updateStats();
}

window.editStockItem = function (id) {
  openStockModal(id);
};

window.deleteStockItem = async function (id) {
  if (!confirm("Видалити товар?")) return;
  await deleteStockItemFromDB(id);
  renderStock();
  updateStats();
};

// Customer Modal
function openCustomerModal(editId = null) {
  if (editId) {
    const c = customerList.find((c) => c.id === editId);
    if (c) {
      document.getElementById("customer-modal-title").innerText =
        "✏️ Редагувати покупця";
      document.getElementById("customer-id").value = c.id;
      document.getElementById("customer-type").value = c.type || "";
      document.getElementById("customer-name").value = c.name || "";
      document.getElementById("customer-index").value = c.index || "";
      document.getElementById("customer-city").value = c.city || "";
      document.getElementById("customer-street").value = c.street || "";
      document.getElementById("customer-house").value = c.house || "";
      document.getElementById("customer-region").value = c.region || "";
      document.getElementById("customer-country").value = c.country || "";
      document.getElementById("customer-edrpou").value = c.edrpou || "";
      document.getElementById("customer-iban").value = c.iban || "";
      document.getElementById("customer-bank").value = c.bank || "";
      document.getElementById("customer-mfo").value = c.mfo || "";
      document.getElementById("customer-phone").value = c.phone || "";
    }
  } else {
    document.getElementById("customer-modal-title").innerText =
      "➕ Додати покупця";
    document.getElementById("customer-id").value = "";
    document.getElementById("customer-type").value = "";
    document.getElementById("customer-name").value = "";
    document.getElementById("customer-index").value = "";
    document.getElementById("customer-city").value = "";
    document.getElementById("customer-street").value = "";
    document.getElementById("customer-house").value = "";
    document.getElementById("customer-region").value = "";
    document.getElementById("customer-country").value = "Україна";
    document.getElementById("customer-edrpou").value = "";
    document.getElementById("customer-iban").value = "";
    document.getElementById("customer-bank").value = "";
    document.getElementById("customer-mfo").value = "";
    document.getElementById("customer-phone").value = "";
  }
  document.getElementById("customer-modal").classList.add("active");
}

function closeCustomerModal() {
  document.getElementById("customer-modal").classList.remove("active");
}

async function saveCustomer() {
  const id = document.getElementById("customer-id").value;
  const customer = {
    type: document.getElementById("customer-type").value,
    name: document.getElementById("customer-name").value,
    index: document.getElementById("customer-index").value,
    city: document.getElementById("customer-city").value,
    street: document.getElementById("customer-street").value,
    house: document.getElementById("customer-house").value,
    region: document.getElementById("customer-region").value,
    country: document.getElementById("customer-country").value,
    edrpou: document.getElementById("customer-edrpou").value,
    iban: document.getElementById("customer-iban").value,
    bank: document.getElementById("customer-bank").value,
    mfo: document.getElementById("customer-mfo").value,
    phone: document.getElementById("customer-phone").value,
  };
  if (!customer.name) {
    alert("Введіть назву або ПІБ покупця");
    return;
  }
  await saveCustomerToDB(customer, id || null);
  closeCustomerModal();
  renderCustomers();
  updateStats();
}

window.editCustomer = function (id) {
  openCustomerModal(id);
};

window.deleteCustomer = async function (id) {
  if (
    !confirm(
      "Видалити покупця? Всі його рахунки залишаться, але без прив'язки до профілю.",
    )
  )
    return;
  await deleteCustomerFromDB(id);
  renderCustomers();
  updateStats();
};

// Profile Save
async function saveProfileForm() {
  const profile = {
    type: document.getElementById("profile-type").value,
    name: document.getElementById("profile-name").value,
    index: document.getElementById("profile-index").value,
    city: document.getElementById("profile-city").value,
    street: document.getElementById("profile-street").value,
    house: document.getElementById("profile-house").value,
    region: document.getElementById("profile-region").value,
    country: document.getElementById("profile-country").value,
    edrpou: document.getElementById("profile-edrpou").value,
    iban: document.getElementById("profile-iban").value,
    bank: document.getElementById("profile-bank").value,
    mfo: document.getElementById("profile-mfo").value,
    phone: document.getElementById("profile-phone").value,
  };
  await saveProfile(profile);
  alert("Профіль збережено!");
}
