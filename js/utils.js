// ==================== ДОПОМІЖНІ ФУНКЦІЇ ====================

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    if (m === "\"") return "&quot;";
    if (m === "'") return "&#39;";
    return m;
  });
}

function numberToWords(num) {
  num = Math.round(num); // Округлюємо, щоб уникнути помилок з дробовими числами
  const units = [
    "",
    "одна",
    "дві",
    "три",
    "чотири",
    "п'ять",
    "шість",
    "сім",
    "вісім",
    "дев'ять",
  ];
  const tens = [
    "",
    "десять",
    "двадцять",
    "тридцять",
    "сорок",
    "п'ятдесят",
    "шістдесят",
    "сімдесят",
    "вісімдесят",
    "дев'яносто",
  ];
  const hundreds = [
    "",
    "сто",
    "двісті",
    "триста",
    "чотириста",
    "п'ятсот",
    "шістсот",
    "сімсот",
    "вісімсот",
    "дев'ятсот",
  ];

  function getPart(n) {
    if (n === 0) return "";
    if (n < 10) return units[n];
    if (n < 20) {
      const teens = [
        "десять",
        "одинадцять",
        "дванадцять",
        "тринадцять",
        "чотирнадцять",
        "п'ятнадцять",
        "шістнадцять",
        "сімнадцять",
        "вісімнадцять",
        "дев'ятнадцять",
      ];
      return teens[n - 10];
    }
    if (n < 100)
      return tens[Math.floor(n / 10)] + (n % 10 ? " " + units[n % 10] : "");
    return (
      hundreds[Math.floor(n / 100)] + (n % 100 ? " " + getPart(n % 100) : "")
    );
  }

  const thousands = Math.floor(num / 1000);
  const remainder = num % 1000;
  let result = "";
  if (thousands > 0) {
    if (thousands === 1) result += "одна тисяча";
    else if (thousands === 2) result += "дві тисячі";
    else if (thousands > 2 && thousands < 5)
      result += getPart(thousands) + " тисячі";
    else result += getPart(thousands) + " тисяч";
  }
  if (remainder > 0) {
    if (result) result += " ";
    result += getPart(remainder);
  }
  if (result === "") result = "нуль";
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function showLoading(message = "Зачекайте...") {
  let loader = document.getElementById("global-loader");
  if (!loader) {
    loader = document.createElement("div");
    loader.id = "global-loader";
    loader.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            z-index: 9999;
            font-size: 14px;
        `;
    document.body.appendChild(loader);
  }
  loader.innerText = message;
  loader.style.display = "block";
}

function hideLoading() {
  const loader = document.getElementById("global-loader");
  if (loader) loader.style.display = "none";
}
