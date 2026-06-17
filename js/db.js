// ==================== РОБОТА З INDEXEDDB ====================

let db = null;
let stockList = [];
let customerList = [];
let allInvoices = [];

const DB_NAME = "InvoicesDB";
const DB_VERSION = 6;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("profile")) {
        db.createObjectStore("profile", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("stock")) {
        db.createObjectStore("stock", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("customers")) {
        db.createObjectStore("customers", {
          keyPath: "id",
          autoIncrement: true,
        });
      }
      if (!db.objectStoreNames.contains("invoices")) {
        db.createObjectStore("invoices", {
          keyPath: "id",
          autoIncrement: true,
        });
      }
      if (!db.objectStoreNames.contains("signature")) {
        db.createObjectStore("signature", { keyPath: "id" });
      }
    };
  });
}

async function initDefaultProfile() {
  const tx = db.transaction("profile", "readonly");
  const store = tx.objectStore("profile");
  const profile = await new Promise((resolve) => {
    const req = store.get("seller");
    req.onsuccess = () => resolve(req.result);
  });
  if (!profile) {
    const emptyProfile = {
      id: "seller",
      type: "",
      name: "",
      index: "",
      city: "",
      street: "",
      house: "",
      region: "",
      country: "Україна",
      edrpou: "",
      iban: "",
      bank: "",
      mfo: "",
      phone: "",
    };
    const writeTx = db.transaction("profile", "readwrite");
    writeTx.objectStore("profile").put(emptyProfile);
  }
}

async function loadProfile() {
  const tx = db.transaction("profile", "readonly");
  const profile = await new Promise((resolve) => {
    const req = tx.objectStore("profile").get("seller");
    req.onsuccess = () => resolve(req.result);
  });
  return profile;
}

async function saveProfile(profile) {
  profile.id = "seller";
  const tx = db.transaction("profile", "readwrite");
  await tx.objectStore("profile").put(profile);
}

async function loadStockFromDB() {
  const tx = db.transaction("stock", "readonly");
  const items = await new Promise((resolve) => {
    const req = tx.objectStore("stock").getAll();
    req.onsuccess = () => resolve(req.result || []);
  });
  stockList = items;
  return items;
}

async function saveStockItem(item, id = null) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("stock", "readwrite");
    const store = tx.objectStore("stock");
    let request;

    try {
      if (id) {
        // Редагування існуючого товару
        item.id = parseInt(id);
        request = store.put(item);
      } else {
        // Додавання нового товару - ОБОВ'ЯЗКОВО видаляємо id
        const newItem = { ...item };
        delete newItem.id;
        request = store.add(newItem);
      }

      request.onsuccess = async () => {
        try {
          await loadStockFromDB();
          resolve();
        } catch (err) {
          reject(err);
        }
      };

      request.onerror = () => {
        reject(new Error(`IndexedDB помилка: ${request.error}`));
      };
    } catch (err) {
      reject(err);
    }
  });
}

async function deleteStockItemFromDB(id) {
  const tx = db.transaction("stock", "readwrite");
  await tx.objectStore("stock").delete(id);
  await loadStockFromDB();
}

async function loadCustomersFromDB() {
  const tx = db.transaction("customers", "readonly");
  const items = await new Promise((resolve) => {
    const req = tx.objectStore("customers").getAll();
    req.onsuccess = () => resolve(req.result || []);
  });
  customerList = items;
  return items;
}

async function saveCustomerToDB(customer, id = null) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("customers", "readwrite");
    const store = tx.objectStore("customers");
    let request;

    try {
      if (id) {
        customer.id = parseInt(id);
        request = store.put(customer);
      } else {
        const newCustomer = { ...customer };
        delete newCustomer.id;
        request = store.add(newCustomer);
      }

      request.onsuccess = async () => {
        try {
          await loadCustomersFromDB();
          resolve();
        } catch (err) {
          reject(err);
        }
      };

      request.onerror = () => {
        reject(new Error(`IndexedDB помилка: ${request.error}`));
      };
    } catch (err) {
      reject(err);
    }
  });
}

async function deleteCustomerFromDB(id) {
  const tx = db.transaction("customers", "readwrite");
  await tx.objectStore("customers").delete(id);
  await loadCustomersFromDB();
}

async function loadInvoicesFromDB() {
  const tx = db.transaction("invoices", "readonly");
  const invoices = await new Promise((resolve) => {
    const req = tx.objectStore("invoices").getAll();
    req.onsuccess = () => resolve(req.result || []);
  });
  allInvoices = invoices.sort((a, b) => b.id - a.id);
  return allInvoices;
}

async function saveInvoiceToDB(invoice, isEdit = false, editId = null) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("invoices", "readwrite");
    const store = tx.objectStore("invoices");
    let request;

    try {
      if (isEdit && editId) {
        invoice.id = editId;
        request = store.put(invoice);
      } else {
        const newInvoice = { ...invoice };
        delete newInvoice.id;
        request = store.add(newInvoice);
      }

      request.onsuccess = async () => {
        try {
          await loadInvoicesFromDB();
          resolve();
        } catch (err) {
          reject(err);
        }
      };

      request.onerror = () => {
        reject(new Error(`IndexedDB помилка: ${request.error}`));
      };
    } catch (err) {
      reject(err);
    }
  });
}

async function deleteInvoiceFromDB(id) {
  const tx = db.transaction("invoices", "readwrite");
  await tx.objectStore("invoices").delete(id);
  await loadInvoicesFromDB();
}

async function updateStockAfterInvoice(items, isReturn = false) {
  for (const item of items) {
    const stockItem = stockList.find((s) => s.id == item.id);
    if (stockItem) {
      if (isReturn) {
        stockItem.qty += item.qty;
      } else {
        stockItem.qty -= item.qty;
      }
      const tx = db.transaction("stock", "readwrite");
      await tx.objectStore("stock").put(stockItem);
    }
  }
  await loadStockFromDB();
}

// ==================== ПІДПИС ====================

async function saveSignatureFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      const tx = db.transaction("signature", "readwrite");
      const store = tx.objectStore("signature");
      const request = store.put({
        id: "signature",
        data: base64,
        updatedAt: new Date().toISOString(),
      });
      request.onsuccess = () => resolve(base64);
      request.onerror = () => reject(request.error);
    };
    reader.onerror = () => reject("Помилка читання файлу");
    reader.readAsDataURL(file);
  });
}

async function loadSignature() {
  const tx = db.transaction("signature", "readonly");
  const store = tx.objectStore("signature");
  const result = await new Promise((resolve) => {
    const req = store.get("signature");
    req.onsuccess = () => resolve(req.result);
  });
  return result ? result.data : null;
}

async function deleteSignature() {
  const tx = db.transaction("signature", "readwrite");
  const store = tx.objectStore("signature");
  await store.delete("signature");
}
