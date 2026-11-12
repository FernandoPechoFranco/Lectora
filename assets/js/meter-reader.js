const apartments = [
  { number: "101", previous: 1100, current: 1280 },
  { number: "102", previous: 850, current: 970 },
  { number: "201", previous: 2050, current: 2250 },
  { number: "202", previous: 500, current: 560 },
  { number: "301", previous: 1400, current: 1510 },
  { number: "302", previous: 920, current: 980 }
];

const meterForm = document.getElementById("meterForm");
const apartmentRows = document.getElementById("apartmentRows");
const billTotalInput = document.getElementById("billTotal");
const generalKwhInput = document.getElementById("generalKwh");
const collectionMarginInput = document.getElementById("collectionMargin");
const monthInput = document.getElementById("billingMonth");
const formMessage = document.getElementById("formMessage");
const numberFormatter = new Intl.NumberFormat("es-PE", {
  maximumFractionDigits: 2
});

function formatNumber(value) {
  return numberFormatter.format(value);
}

function formatMoney(value) {
  return `S/. ${value.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function formatRate(value) {
  return `S/. ${value.toLocaleString("es-PE", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  })}`;
}

function readingInput(apartment, reading, value, label) {
  return `<input class="reading-input ${reading}-reading" id="${reading}-${apartment}" name="${reading}-${apartment}" type="number" min="0" step="0.01" value="${value}" required aria-label="${label} del departamento ${apartment}">`;
}

function renderApartments() {
  if (document.body.dataset.layout === "desktop") {
    apartmentRows.innerHTML = apartments.map((apartment) => `
      <tr class="reading-entry" data-apartment="${apartment.number}">
        <th class="apartment-name" scope="row">Dep. ${apartment.number}</th>
        <td>${readingInput(apartment.number, "previous", apartment.previous, "Lectura anterior")}</td>
        <td>${readingInput(apartment.number, "current", apartment.current, "Lectura actual")}</td>
        <td data-usage>—</td>
        <td class="calculation-cell" data-calculation>—</td>
        <td class="charge-cell" data-charge>—</td>
      </tr>
    `).join("");
  } else {
    apartmentRows.innerHTML = apartments.map((apartment) => `
      <article class="apartment-card reading-entry" data-apartment="${apartment.number}">
        <div class="apartment-card-head">
          <h3>Departamento ${apartment.number}</h3>
          <output class="apartment-charge" data-charge>—</output>
        </div>
        <div class="reading-fields">
          <label class="reading-field">Lectura anterior
            ${readingInput(apartment.number, "previous", apartment.previous, "Lectura anterior")}
          </label>
          <label class="reading-field">Lectura actual
            ${readingInput(apartment.number, "current", apartment.current, "Lectura actual")}
          </label>
        </div>
        <div class="apartment-result">
          Consumo del mes: <output class="apartment-usage" data-usage>—</output>
        </div>
        <span class="sr-only" data-calculation></span>
      </article>
    `).join("");
  }

  document.getElementById("departmentCount").textContent = document.body.dataset.layout === "desktop"
    ? `${apartments.length} departamentos`
    : `${apartments.length} en total`;
}

function localMonthValue(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

function saveCurrentReadings() {
  document.querySelectorAll(".reading-entry").forEach((row) => {
    const apartment = apartments.find((item) => item.number === row.dataset.apartment);
    if (!apartment) return;
    apartment.previous = row.querySelector(".previous-reading").value;
    apartment.current = row.querySelector(".current-reading").value;
  });
}

function distributeCents(results, targetCents, totalKwh) {
  const allocations = results.map((result) => {
    const exactCents = targetCents * result.usage / totalKwh;
    const cents = Math.floor(exactCents);
    return {
      ...result,
      chargeCents: cents,
      remainder: exactCents - cents
    };
  });
  let remainingCents = targetCents - allocations.reduce((sum, item) => sum + item.chargeCents, 0);
  const rankedAllocations = [...allocations].sort((a, b) => b.remainder - a.remainder);

  for (let index = 0; index < remainingCents; index += 1) {
    rankedAllocations[index % rankedAllocations.length].chargeCents += 1;
  }

  return allocations.map((result) => ({
    ...result,
    charge: result.chargeCents / 100
  }));
}

function updateCalculations() {
  const billTotal = Number(billTotalInput.value);
  const generalKwh = Number(generalKwhInput.value);
  const collectionMargin = Number(collectionMarginInput.value);
  const hasValidBill = billTotalInput.validity.valid;
  const hasValidGeneralKwh = generalKwhInput.validity.valid;
  const hasValidMargin = collectionMarginInput.validity.valid;
  const hasValidRate = hasValidBill && hasValidGeneralKwh && hasValidMargin;
  const basePrice = hasValidBill && hasValidGeneralKwh
    ? billTotal / generalKwh
    : null;
  const results = [];

  document.getElementById("basePrice").textContent = basePrice === null
    ? "—"
    : formatMoney(basePrice);

  document.querySelectorAll(".reading-entry").forEach((row) => {
    const apartment = row.dataset.apartment;
    const previousInput = row.querySelector(".previous-reading");
    const currentInput = row.querySelector(".current-reading");
    const previous = Number(previousInput.value);
    const current = Number(currentInput.value);

    currentInput.min = previousInput.value || "0";
    currentInput.setCustomValidity(
      previousInput.value !== ""
      && currentInput.value !== ""
      && current < previous
        ? "La lectura actual debe ser igual o mayor a la lectura anterior."
        : ""
    );

    const valid = previousInput.validity.valid && currentInput.validity.valid;
    previousInput.classList.toggle("is-invalid", !previousInput.validity.valid);
    currentInput.classList.toggle("is-invalid", !currentInput.validity.valid);
    previousInput.setAttribute("aria-invalid", String(!previousInput.validity.valid));
    currentInput.setAttribute("aria-invalid", String(!currentInput.validity.valid));

    const usage = valid ? current - previous : null;
    row.querySelector("[data-usage]").textContent = usage === null
      ? "Revisar lectura"
      : `${formatNumber(usage)} kWh`;
    row.querySelector("[data-calculation]").textContent = usage === null
      ? "—"
      : `${formatNumber(usage)} × tarifa ajustada`;

    if (valid) {
      results.push({ apartment, previous, current, usage });
    }
  });

  const totalKwh = results.reduce((sum, result) => sum + result.usage, 0);
  const invalidReadings = apartments.length - results.length;
  const targetCents = Math.round((billTotal + collectionMargin) * 100);
  const canAllocate = hasValidRate && invalidReadings === 0 && totalKwh > 0;
  const unitPrice = canAllocate ? targetCents / 100 / totalKwh : null;
  const allocatedResults = canAllocate
    ? distributeCents(results, targetCents, totalKwh)
    : results.map((result) => ({ ...result, charge: null }));
  const chargesByApartment = new Map(
    allocatedResults.map((result) => [result.apartment, result])
  );

  document.querySelectorAll(".reading-entry").forEach((row) => {
    const result = chargesByApartment.get(row.dataset.apartment);
    row.querySelector("[data-calculation]").textContent = result && unitPrice !== null
      ? `${formatNumber(result.usage)} × ${formatRate(unitPrice)}`
      : "—";
    row.querySelector("[data-charge]").textContent = result && result.charge !== null
      ? formatMoney(result.charge)
      : "—";
  });

  const totalCharge = canAllocate ? targetCents / 100 : null;
  const totalKwhText = `${formatNumber(totalKwh)} kWh`;
  const totalChargeText = totalCharge === null ? "—" : formatMoney(totalCharge);
  document.getElementById("unitPrice").textContent = unitPrice === null
    ? "—"
    : formatRate(unitPrice);
  document.getElementById("totalConsumption").textContent = totalKwhText;
  document.getElementById("totalCharges").textContent = totalChargeText;

  const tableTotalKwh = document.getElementById("tableTotalKwh");
  const tableTotalCharge = document.getElementById("tableTotalCharge");
  if (tableTotalKwh) tableTotalKwh.textContent = totalKwhText;
  if (tableTotalCharge) tableTotalCharge.textContent = totalChargeText;

  const allocationNote = document.getElementById("allocationNote");
  allocationNote.classList.toggle("warning", invalidReadings > 0 || !hasValidRate || totalKwh === 0);
  if (invalidReadings > 0) {
    allocationNote.textContent = `Completa o corrige ${invalidReadings} lectura${invalidReadings === 1 ? "" : "s"} para calcular el total.`;
  } else if (!hasValidRate) {
    allocationNote.textContent = "Ingresa un monto, un consumo general y un excedente válidos.";
  } else if (totalKwh === 0) {
    allocationNote.textContent = "Debe haber consumo en al menos un departamento para repartir el cobro.";
  } else {
    const difference = generalKwh - totalKwh;
    const comparison = Math.abs(difference) < 0.005
      ? "Los submedidores coinciden con el medidor general."
      : difference > 0
        ? `${formatNumber(difference)} kWh del medidor general no están asignados a submedidores.`
        : `Los submedidores superan el medidor general por ${formatNumber(Math.abs(difference))} kWh.`;
    allocationNote.textContent = `Tarifa base ${formatMoney(basePrice)}/kWh; tarifa de cobro ${formatRate(unitPrice)}/kWh. Total distribuido: ${formatMoney(totalCharge)} (${comparison})`;
  }

  return {
    billTotal,
    generalKwh,
    collectionMargin,
    basePrice,
    unitPrice,
    totalKwh,
    totalCharge,
    results: allocatedResults
  };
}

function pdfText(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function createPdf(calculation) {
  const month = monthInput.value;
  const period = month
    ? new Intl.DateTimeFormat("es-PE", { month: "long", year: "numeric" })
      .format(new Date(`${month}-01T12:00:00`))
    : "Mes no indicado";
  const rowsPerPage = 27;
  const pages = [];

  for (let start = 0; start < calculation.results.length; start += rowsPerPage) {
    const pageResults = calculation.results.slice(start, start + rowsPerPage);
    const isFirstPage = start === 0;
    const isLastPage = start + rowsPerPage >= calculation.results.length;
    const lines = [
      isFirstPage ? "LECTORA NOVA - REPORTE DE LECTURAS" : "LECTORA NOVA - REPORTE DE LECTURAS (CONT.)",
      `Periodo: ${period}`,
      `Monto del recibo: ${formatMoney(calculation.billTotal)}  Excedente: ${formatMoney(calculation.collectionMargin)}`,
      `Medidor general: ${formatNumber(calculation.generalKwh)} kWh`,
      `Tarifa base: ${formatMoney(calculation.basePrice)}/kWh  Tarifa de cobro: ${formatRate(calculation.unitPrice)}/kWh`,
      "",
      "DEPTO       ANTERIOR    ACTUAL      CONSUMO     COBRO",
      "----------------------------------------------------------",
      ...pageResults.map((result) => (
        `Dep. ${result.apartment}`.padEnd(12)
        + formatNumber(result.previous).padStart(9)
        + formatNumber(result.current).padStart(11)
        + `${formatNumber(result.usage)} kWh`.padStart(12)
        + formatMoney(result.charge).padStart(15)
      ))
    ];

    if (isLastPage) {
      lines.push(
        "----------------------------------------------------------",
        `TOTAL DE SUBMEDIDORES: ${formatNumber(calculation.totalKwh)} kWh`,
        `TOTAL A RECAUDAR: ${formatMoney(calculation.totalCharge)}`
      );
    }
    pages.push(lines);
  }

  pages.forEach((lines, pageIndex) => {
    lines.push(`Pagina ${pageIndex + 1} de ${pages.length}`);
  });

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>"
  ];
  const pageObjectIds = [];

  pages.forEach((lines) => {
    const pageObjectId = objects.length + 1;
    const contentObjectId = pageObjectId + 1;
    const commands = lines.map((line, index) => {
      const fontSize = index === 0 ? 14 : 9;
      const y = 800 - index * 19;
      return `BT /F1 ${fontSize} Tf 42 ${y} Td (${pdfText(line)}) Tj ET`;
    }).join("\n");
    pageObjectIds.push(pageObjectId);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
      `<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`
    );
  });
  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

function downloadReport() {
  const calculation = updateCalculations();
  if (!meterForm.reportValidity()) {
    formMessage.textContent = "Corrige los campos marcados antes de descargar el reporte.";
    return;
  }
  if (calculation.totalCharge === null) {
    formMessage.textContent = "Ingresa un consumo válido en al menos un departamento para calcular el cobro.";
    return;
  }

  const blobUrl = URL.createObjectURL(createPdf(calculation));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = `lectora-nova-${monthInput.value || "reporte"}.pdf`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  formMessage.textContent = "El reporte PDF se descargó correctamente.";
}

function addApartment() {
  saveCurrentReadings();
  const nextNumber = apartments.reduce(
    (largest, apartment) => Math.max(largest, Number(apartment.number) || 0),
    0
  ) + 1;
  apartments.push({ number: String(nextNumber), previous: "", current: "" });
  renderApartments();
  formMessage.textContent = "";
  updateCalculations();
  document.getElementById(`previous-${nextNumber}`).focus();
}

renderApartments();
monthInput.value = localMonthValue(new Date());
meterForm.addEventListener("input", () => {
  formMessage.textContent = "";
  updateCalculations();
});
meterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  downloadReport();
});
document.getElementById("addApartment").addEventListener("click", addApartment);
document.getElementById("downloadPdf").addEventListener("click", downloadReport);
updateCalculations();
