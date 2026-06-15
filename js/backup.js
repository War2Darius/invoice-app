// ==================== БЕКАП ТА ІМПОРТ ДАНИХ ====================

// Експорт окремого типу даних
async function exportDataType(type) {
  let data = null;
  let filename = "";
  const today = new Date().toISOString().slice(0, 10);

  switch (type) {
    case "profile":
      data = await loadProfile();
      filename = `profile_${today}.json`;
      break;
    case "stock":
      data = stockList;
      filename = `stock_${today}.json`;
      break;
    case "customers":
      data = customerList;
      filename = `customers_${today}.json`;
      break;
    case "invoices":
      data = allInvoices;
      filename = `invoices_${today}.json`;
      break;
    default:
      alert("Невідомий тип даних");
      return;
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    alert(`Немає даних для експорту (${type})`);
    return;
  }

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  alert(`✅ Експортовано ${filename}`);
}

// Визначення типу даних з JSON
function detectDataType(data) {
  // Перевірка на profile (об'єкт з id === 'seller')
  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    data.id === "seller"
  ) {
    return "profile";
  }

  // Перевірка на масив
  if (!Array.isArray(data)) {
    return null;
  }

  if (data.length === 0) return null;

  const firstItem = data[0];

  // Перевірка на stock (поля name, qty, price)
  if (
    firstItem &&
    "name" in firstItem &&
    "qty" in firstItem &&
    "price" in firstItem
  ) {
    return "stock";
  }

  // Перевірка на customers (поле name)
  if (firstItem && "name" in firstItem && !("qty" in firstItem)) {
    return "customers";
  }

  // Перевірка на invoices (поля number, date, items)
  if (
    firstItem &&
    "number" in firstItem &&
    "date" in firstItem &&
    "items" in firstItem
  ) {
    return "invoices";
  }

  return null;
}

// Імпорт даних з файлу
async function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const content = e.target.result;
        const data = JSON.parse(content);
        const dataType = detectDataType(data);

        if (!dataType) {
          reject("Невірний формат файлу. Не вдалося визначити тип даних.");
          return;
        }

        // Показуємо підтвердження
        let typeName = "";
        let count = 0;

        switch (dataType) {
          case "profile":
            typeName = "Профіль продавця";
            count = 1;
            break;
          case "stock":
            typeName = "Товари на складі";
            count = data.length;
            break;
          case "customers":
            typeName = "Покупці";
            count = data.length;
            break;
          case "invoices":
            typeName = "Рахунки";
            count = data.length;
            break;
        }

        const confirmMsg =
          `⚠️ Підтвердження імпорту\n\n` +
          `Тип даних: ${typeName}\n` +
          `Кількість записів: ${count}\n\n` +
          `Поточні дані будуть ПОВНІСТЮ ЗАМІНЕНІ.\n` +
          `Продовжити?`;

        if (!confirm(confirmMsg)) {
          reject("Імпорт скасовано");
          return;
        }

        showLoading("Імпортуємо дані...");

        // Виконуємо імпорт залежно від типу
        switch (dataType) {
          case "profile":
            await saveProfile(data);
            break;
          case "stock":
            await replaceStockData(data);
            break;
          case "customers":
            await replaceCustomersData(data);
            break;
          case "invoices":
            await replaceInvoicesData(data);
            break;
        }

        // Оновлюємо UI
        await loadStockFromDB();
        await loadCustomersFromDB();
        await loadInvoicesFromDB();
        await loadProfile();

        renderStock();
        renderCustomers();
        renderRecentInvoices();
        loadProfileToForm();
        updateStats();

        hideLoading();
        resolve(`✅ Імпортовано ${count} записів (${typeName})`);
      } catch (err) {
        reject("Помилка читання файлу: " + err.message);
      }
    };

    reader.onerror = () => reject("Помилка читання файлу");
    reader.readAsText(file);
  });
}

// Заміна всіх товарів
async function replaceStockData(newStock) {
  // Очищаємо старий store
  const tx = db.transaction("stock", "readwrite");
  const store = tx.objectStore("stock");
  await store.clear();

  // Додаємо нові товари
  for (const item of newStock) {
    // Видаляємо старий id (якщо є), щоб створити новий
    const { id, ...cleanItem } = item;
    await store.add(cleanItem);
  }
}

// Заміна всіх покупців
async function replaceCustomersData(newCustomers) {
  const tx = db.transaction("customers", "readwrite");
  const store = tx.objectStore("customers");
  await store.clear();

  for (const customer of newCustomers) {
    const { id, ...cleanCustomer } = customer;
    await store.add(cleanCustomer);
  }
}

// Заміна всіх рахунків
async function replaceInvoicesData(newInvoices) {
  const tx = db.transaction("invoices", "readwrite");
  const store = tx.objectStore("invoices");
  await store.clear();

  for (const invoice of newInvoices) {
    const { id, ...cleanInvoice } = invoice;
    await store.add(cleanInvoice);
  }
}

// Очищення всіх даних (скидання бази)
async function clearAllData() {
  // Перше підтвердження
  const confirm1 = confirm(
    "⚠️ УВАГА! Ви збираєтесь очистити ВСІ дані.\n\n" +
      "Буде видалено:\n" +
      "• Профіль продавця\n" +
      "• Всі товари на складі\n" +
      "• Всіх покупців\n" +
      "• Всі рахунки\n\n" +
      "Цю дію НЕ МОЖНА скасувати!\n\n" +
      "Продовжити?",
  );

  if (!confirm1) return;

  // Друге підтвердження (для безпеки)
  const confirm2 = confirm(
    "❗ Підтвердіть ОЧИЩЕННЯ ВСІХ ДАНИХ ще раз.\n\n" +
      'Введіть слово "ОЧИСТИТИ" в поле нижче:',
  );

  if (!confirm2) return;

  const userInput = prompt('Введіть слово "ОЧИСТИТИ" для підтвердження:');
  if (userInput !== "ОЧИСТИТИ") {
    alert("Очищення скасовано. Введено неправильне слово.");
    return;
  }

  showLoading("Очищуємо базу даних...");

  try {
    // Очищаємо всі stores
    const tx = db.transaction(
      ["profile", "stock", "customers", "invoices"],
      "readwrite",
    );

    await tx.objectStore("profile").clear();
    await tx.objectStore("stock").clear();
    await tx.objectStore("customers").clear();
    await tx.objectStore("invoices").clear();

    // Створюємо дефолтний профіль (пустий)
    const defaultProfile = {
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
    await tx.objectStore("profile").add(defaultProfile);

    // Оновлюємо глобальні змінні
    await loadStockFromDB();
    await loadCustomersFromDB();
    await loadInvoicesFromDB();
    await loadProfile();

    // Оновлюємо UI
    renderStock();
    renderCustomers();
    renderRecentInvoices();
    loadProfileToForm();
    updateStats();

    hideLoading();
    alert("✅ Всі дані очищено. Базу повернуто до початкового стану.");
  } catch (err) {
    hideLoading();
    alert("❌ Помилка очищення: " + err.message);
  }
}

// Функція для імпорту через input file
function setupImportFileInput() {
  const input = document.getElementById("import-file-input");
  if (!input) return;

  input.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Перевірка розширення файлу
    if (!file.name.endsWith(".json")) {
      alert("❌ Будь ласка, оберіть JSON файл");
      input.value = "";
      return;
    }

    try {
      const result = await importData(file);
      alert(result);
    } catch (err) {
      alert("❌ " + err);
    } finally {
      input.value = "";
    }
  });
}
