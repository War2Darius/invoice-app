// ==================== ГЕНЕРАЦІЯ PDF ====================

async function generateInvoicePdf(invoice) {
  const seller = await loadProfile();

  if (!seller || !seller.name) {
    alert('Заповніть профіль продавця на сторінці "Профіль"');
    return;
  }

  const customer = invoice.customer;

  // DEBUG: покажемо структуру customer для швидкої діагностики
  console.log("generateInvoicePdf — invoice.customer:", customer);

  // Формування повної адреси постачальника (ОДНИМ РЯДКОМ)
  const sellerAddressFull = [
    seller.index,
    seller.city,
    seller.street,
    seller.house,
    seller.region,
    seller.country,
  ].filter((p) => p && p.trim());
  const sellerAddress = sellerAddressFull.join(", ");

  // Формування повної адреси покупця (ОДНИМ РЯДКОМ) з невеликими fallback-ключами
  const customerAddressFull = [
    customer.index || customer.postalCode || customer.zip || "",
    customer.city || customer.town || "",
    customer.street || "",
    customer.house || customer.building || "",
    customer.region || "",
    customer.country || "",
  ].filter((p) => p && String(p).trim());
  const customerAddress = customerAddressFull.join(", ");

  const totalWords = numberToWords(invoice.totalWithDiscount);
  const currentDate = new Date().toLocaleDateString("uk-UA");

  // Завантажуємо підпис з бази (якщо є)
  let signatureHtml = "";
  try {
    const signatureBase64 = await loadSignature();
    if (signatureBase64) {
      signatureHtml = `<img src="${signatureBase64}" style="height: 150px; width: auto; margin: 0 10px;" alt="підпис">`;
    }
  } catch (e) {
    console.warn("Помилка завантаження підпису:", e);
  }

  // Визначаємо максимальну ширину лівого стовпчика
  const leftColumnWidth = 110;

  const pdfHtml = `
        <div style="font-family: 'DejaVu Sans', 'Arial', sans-serif; width: 680px; margin: 0 auto; padding: 20px; background: white;">

            <!-- Рядок: Постачальник -->
            <div style="display: flex; margin-bottom: 20px;">
                <div style="width: ${leftColumnWidth}px; font-weight: bold; text-align: right; padding-right: 15px;">Постачальник</div>
                <div style="flex: 1;">
                    <div style="font-weight: bold;">${seller.type ? seller.type + " " : ""}${seller.name || ""}</div>
                    <div>${sellerAddress}</div>
                    <div>РНОКПП/ЄДРПОУ ${seller.edrpou || ""}</div>
                    <div>IBAN ${seller.iban || ""}</div>
                    <div>Банк ${seller.bank || ""}, МФО ${seller.mfo || ""}</div>
                </div>
            </div>

            <!-- Рядок: Одержувач -->
            <div style="display: flex; margin-bottom: 25px;">
                <div style="width: ${leftColumnWidth}px; font-weight: bold; text-align: right; padding-right: 15px;">Одержувач</div>
                <div style="flex: 1;">
                    <div style="font-weight: bold;">${customer.type ? escapeHtml(customer.type) + " " : ""}${escapeHtml(customer.name || "")}</div>
                    ${customerAddress ? `<div>${escapeHtml(customerAddress)}</div>` : ""}
                    ${customer.edrpou ? `<div>РНОКПП/ЄДРПОУ ${escapeHtml(customer.edrpou)}</div>` : ""}
                    ${customer.iban || customer.account ? `<div>IBAN ${escapeHtml(customer.iban || customer.account)}</div>` : ""}
                    ${customer.bank || customer.mfo ? `<div>${customer.bank ? "Банк " + escapeHtml(customer.bank) : ""}${customer.bank && customer.mfo ? ", " : ""}${customer.mfo ? "МФО " + escapeHtml(customer.mfo) : ""}</div>` : ""}
                    ${customer.phone ? `<div>тел. ${escapeHtml(customer.phone)}</div>` : ""}
                </div>
            </div>

            <!-- Заголовок рахунку -->
            <div style="text-align: center; margin: 25px 0 20px 0;">
                <div style="font-size: 16px; font-weight: bold;">Рахунок - фактура № ${invoice.number}</div>
                <div style="font-size: 13px; margin-top: 5px;">від ${invoice.date}р.</div>
            </div>

            <!-- Таблиця -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">
                <thead>
                    <tr style="background: #e0e0e0;">
                        <th style="border: 1px solid #ccc; padding: 6px; text-align: center; width: 8%;">№</th>
                        <th style="border: 1px solid #ccc; padding: 6px; text-align: left;">Товар/послуга</th>
                        <th style="border: 1px solid #ccc; padding: 6px; text-align: center; width: 10%;">Од. вим.</th>
                        <th style="border: 1px solid #ccc; padding: 6px; text-align: center; width: 8%;">К-сть</th>
                        <th style="border: 1px solid #ccc; padding: 6px; text-align: right; width: 12%;">Ціна</th>
                        <th style="border: 1px solid #ccc; padding: 6px; text-align: right; width: 12%;">Сума</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoice.items
                      .map(
                        (item, idx) => `
                        <tr>
                            <td style="border: 1px solid #ccc; padding: 6px; text-align: center;">${idx + 1}</td>
                            <td style="border: 1px solid #ccc; padding: 6px;">${escapeHtml(item.name)}</td>
                            <td style="border: 1px solid #ccc; padding: 6px; text-align: center;">шт.</td>
                            <td style="border: 1px solid #ccc; padding: 6px; text-align: center;">${item.qty}</td>
                            <td style="border: 1px solid #ccc; padding: 6px; text-align: right;">${item.price.toFixed(2)}</td>
                            <td style="border: 1px solid #ccc; padding: 6px; text-align: right;">${(item.qty * item.price).toFixed(2)}</td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>

            <!-- Підсумки -->
            <div style="text-align: right; margin-top: 5px; font-size: 12px;">
                <div>Разом ${invoice.totalOriginal.toFixed(2)} грн</div>
                <div>Знижка ${invoice.discount.toFixed(2)} грн</div>
                <div><strong>Всього ${invoice.totalWithDiscount.toFixed(2)} грн</strong></div>
            </div>

            <!-- Сума прописом -->
            <div style="margin-top: 20px; font-size: 12px;">
                <div>Всього на суму: ${totalWords} гривень 00 копійок</div>
                <div>Всього: ${invoice.totalWithDiscount.toFixed(2)} грн.</div>
            </div>

            <!-- Контакти -->
            <div style="margin-top: 20px; font-size: 12px;">
                Контакти: ${seller.phone || ""}
            </div>

            <!-- Підпис -->
            <div style="display: flex; justify-content: center; align-items: center; margin-top: 40px;">
                <div style="width: auto; text-align: right; margin-right: 140px;">Виписала</div>
                <div style="text-align: center;">
                    ${signatureHtml}
                </div>
                <div style="width: auto; text-align: left; margin-left: 140px; font-weight: bold;">${seller.name || ""}</div>
            </div>

            <!-- Нижній колонтитул -->
            <div style="border-top: 1px solid #ccc; margin-top: 30px; padding-top: 8px; text-align: center; font-size: 9px; color: #999;">
                <!--Документ створено автоматично | ${currentDate}-->
            </div>
        </div>
    `;

  const container = document.getElementById("pdf-template");
  container.innerHTML = pdfHtml;

  showLoading("Створюємо PDF...");

  try {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: false,
    });

    const { jsPDF } = window.jspdf;
    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 190;
    const pageHeight = 277;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF("p", "mm", "a4");
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`Рахунок_№${invoice.number}_від_${invoice.date}.pdf`);
  } catch (e) {
    console.error("Помилка створення PDF:", e);
    alert("Помилка створення PDF: " + e.message);
  } finally {
    hideLoading();
    container.innerHTML = "";
  }
}

// Експорт функцій
window.generateInvoicePdf = generateInvoicePdf;

window.viewInvoicePdf = async function (invoiceId) {
  const invoice = allInvoices.find((i) => i.id == invoiceId);
  if (invoice) await generateInvoicePdf(invoice);
};
