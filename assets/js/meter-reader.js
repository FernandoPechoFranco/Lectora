const apartments = [
  { number: "101", name: "Dep. 101", previous: 1100, current: 1280 },
  { number: "102", name: "Dep. 102", previous: 850, current: 970 },
  { number: "201", name: "Dep. 201", previous: 2050, current: 2250 },
  { number: "202", name: "Dep. 202", previous: 500, current: 560 },
  { number: "301", name: "Dep. 301", previous: 1400, current: 1510 },
  { number: "302", name: "Dep. 302", previous: 920, current: 980 }
];

const meterForm = document.getElementById("meterForm");
const apartmentRows = document.getElementById("apartmentRows");
const billTotalInput = document.getElementById("billTotal");
const generalKwhInput = document.getElementById("generalKwh");
const departmentFeeInput = document.getElementById("departmentFee");
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

function escapeHtml(value) {
  const escapedCharacters = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  };
  return String(value).replace(/[&<>"']/g, (character) => escapedCharacters[character]);
}

function apartmentNameInput(apartment) {
  return `<input class="apartment-name-input" id="name-${apartment.number}" name="apartmentName-${apartment.number}" type="text" value="${escapeHtml(apartment.name)}" maxlength="40" required aria-label="Nombre del departamento ${apartment.number}">`;
}

function readingInput(apartment, reading, value, label) {
  return `<input class="reading-input ${reading}-reading" id="${reading}-${apartment}" name="${reading}-${apartment}" type="number" min="0" step="0.01" value="${value}" required aria-label="${label} del departamento ${apartment}">`;
}

function renderApartments() {
  if (document.body.dataset.layout === "desktop") {
    apartmentRows.innerHTML = apartments.map((apartment) => `
      <tr class="reading-entry" data-apartment="${apartment.number}">
        <th class="apartment-name" scope="row">${apartmentNameInput(apartment)}</th>
        <td>${readingInput(apartment.number, "previous", apartment.previous, "Lectura anterior")}</td>
        <td>${readingInput(apartment.number, "current", apartment.current, "Lectura actual")}</td>
        <td data-usage>—</td>
        <td class="calculation-cell" data-calculation>—</td>
        <td class="charge-cell" data-charge>—</td>
        <td class="action-cell">
          <button class="remove-button" type="button" data-remove-apartment="${apartment.number}" aria-label="Eliminar departamento ${apartment.number}" ${apartments.length === 1 ? "disabled" : ""}>Eliminar</button>
        </td>
      </tr>
    `).join("");
  } else {
    apartmentRows.innerHTML = apartments.map((apartment) => `
      <article class="apartment-card reading-entry" data-apartment="${apartment.number}">
        <div class="apartment-card-head">
          <h3>${apartmentNameInput(apartment)}</h3>
          <div class="apartment-card-actions">
            <output class="apartment-charge" data-charge>—</output>
            <button class="remove-button" type="button" data-remove-apartment="${apartment.number}" aria-label="Eliminar departamento ${apartment.number}" ${apartments.length === 1 ? "disabled" : ""}>Quitar</button>
          </div>
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
    ? `${apartments.length} departamento${apartments.length === 1 ? "" : "s"}`
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
    apartment.name = row.querySelector(".apartment-name-input").value.trim();
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
  const remainingCents = targetCents - allocations.reduce((sum, item) => sum + item.chargeCents, 0);
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
  const departmentFee = Number(departmentFeeInput.value);
  const hasValidBill = billTotalInput.validity.valid;
  const hasValidGeneralKwh = generalKwhInput.validity.valid;
  const hasValidDepartmentFee = departmentFeeInput.validity.valid;
  const hasValidInputs = hasValidBill && hasValidGeneralKwh && hasValidDepartmentFee;
  const referencePrice = hasValidBill && hasValidGeneralKwh
    ? billTotal / generalKwh
    : null;
  const results = [];

  document.getElementById("basePrice").textContent = referencePrice === null
    ? "—"
    : formatMoney(referencePrice);

  document.querySelectorAll(".reading-entry").forEach((row) => {
    const apartment = row.dataset.apartment;
    const nameInput = row.querySelector(".apartment-name-input");
    const previousInput = row.querySelector(".previous-reading");
    const currentInput = row.querySelector(".current-reading");
    const name = nameInput.value.trim();
    const previous = Number(previousInput.value);
    const current = Number(currentInput.value);

    nameInput.setCustomValidity(name ? "" : "Ingresa el nombre del departamento.");
    currentInput.min = previousInput.value || "0";
    currentInput.setCustomValidity(
      previousInput.value !== ""
      && currentInput.value !== ""
      && current < previous
        ? "La lectura actual debe ser igual o mayor a la lectura anterior."
        : ""
    );

    const valid = nameInput.validity.valid
      && previousInput.validity.valid
      && currentInput.validity.valid;
    nameInput.classList.toggle("is-invalid", !nameInput.validity.valid);
    nameInput.setAttribute("aria-invalid", String(!nameInput.validity.valid));
    previousInput.classList.toggle("is-invalid", !previousInput.validity.valid);
    currentInput.classList.toggle("is-invalid", !currentInput.validity.valid);
    previousInput.setAttribute("aria-invalid", String(!previousInput.validity.valid));
    currentInput.setAttribute("aria-invalid", String(!currentInput.validity.valid));

    const usage = valid ? current - previous : null;
    row.querySelector("[data-usage]").textContent = usage === null
      ? "Revisar lectura"
      : `${formatNumber(usage)} kWh`;

    if (valid) {
      results.push({ apartment, name, previous, current, usage });
    }
  });

  const totalKwh = results.reduce((sum, result) => sum + result.usage, 0);
  const invalidReadings = apartments.length - results.length;
  const billCents = Math.round(billTotal * 100);
  const departmentFeeCents = Math.round(departmentFee * 100);
  const surchargeCents = departmentFeeCents * apartments.length;
  const targetCents = billCents + surchargeCents;
  const canAllocate = hasValidInputs && invalidReadings === 0 && totalKwh > 0;
  const unitPrice = canAllocate ? billCents / 100 / totalKwh : null;
  const allocatedResults = canAllocate
    ? distributeCents(results, billCents, totalKwh).map((result) => {
      const chargeCents = result.chargeCents + departmentFeeCents;
      return {
        ...result,
        baseCharge: result.charge,
        chargeCents,
        charge: chargeCents / 100
      };
    })
    : results.map((result) => ({ ...result, charge: null }));
  const chargesByApartment = new Map(
    allocatedResults.map((result) => [result.apartment, result])
  );

  document.querySelectorAll(".reading-entry").forEach((row) => {
    const result = chargesByApartment.get(row.dataset.apartment);
    row.querySelector("[data-calculation]").textContent = result && unitPrice !== null
      ? `${formatNumber(result.usage)} × ${formatRate(unitPrice)} + ${formatMoney(departmentFee)}`
      : "—";
    row.querySelector("[data-charge]").textContent = result && result.charge !== null
      ? formatMoney(result.charge)
      : "—";
  });

  const totalCharge = canAllocate ? targetCents / 100 : null;
  const totalDepartmentFees = canAllocate ? surchargeCents / 100 : null;
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
  allocationNote.classList.toggle("warning", invalidReadings > 0 || !hasValidInputs || totalKwh === 0);
  if (invalidReadings > 0) {
    allocationNote.textContent = `Completa o corrige los datos de ${invalidReadings} departamento${invalidReadings === 1 ? "" : "s"} para calcular el total.`;
  } else if (!hasValidInputs) {
    allocationNote.textContent = "Ingresa un monto, un consumo general y un extra por departamento válidos.";
  } else if (totalKwh === 0) {
    allocationNote.textContent = "Debe haber consumo en al menos un departamento para repartir el cobro.";
  } else {
    const apartmentLabel = apartments.length === 1 ? "departamento" : "departamentos";
    allocationNote.textContent = `${formatMoney(billTotal)} del recibo + ${formatMoney(departmentFee)} × ${apartments.length} ${apartmentLabel} = ${formatMoney(totalCharge)}. Extra total: ${formatMoney(totalDepartmentFees)}.`;
  }

  return {
    billTotal,
    generalKwh,
    departmentFee,
    totalDepartmentFees,
    referencePrice,
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
      `Monto del recibo: ${formatMoney(calculation.billTotal)}`,
      `Extra por departamento: ${formatMoney(calculation.departmentFee)} x ${calculation.results.length} = ${formatMoney(calculation.totalDepartmentFees)}`,
      `Medidor general: ${formatNumber(calculation.generalKwh)} kWh`,
      `Tarifa para repartir el recibo: ${formatRate(calculation.unitPrice)}/kWh`,
      `Referencia del medidor general: ${formatMoney(calculation.referencePrice)}/kWh`,
      "",
      "DEPTO       ANTERIOR    ACTUAL      CONSUMO     COBRO",
      "----------------------------------------------------------",
      ...pageResults.map((result) => (
        result.name.slice(0, 18).padEnd(20)
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
  apartments.push({
    number: String(nextNumber),
    name: `Dep. ${nextNumber}`,
    previous: "",
    current: ""
  });
  renderApartments();
  formMessage.textContent = "";
  updateCalculations();
  document.getElementById(`previous-${nextNumber}`).focus();
}

function removeApartment(event) {
  const button = event.target.closest("[data-remove-apartment]");
  if (!button) return;
  if (apartments.length <= 1) {
    formMessage.textContent = "Debe quedar al menos un departamento.";
    return;
  }

  saveCurrentReadings();
  const apartmentNumber = button.dataset.removeApartment;
  const removedIndex = apartments.findIndex((apartment) => apartment.number === apartmentNumber);
  if (removedIndex === -1) return;

  apartments.splice(removedIndex, 1);
  renderApartments();
  formMessage.textContent = `Departamento ${apartmentNumber} eliminado.`;
  updateCalculations();
  const focusIndex = Math.min(removedIndex, apartments.length - 1);
  document.getElementById(`previous-${apartments[focusIndex].number}`).focus();
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
apartmentRows.addEventListener("click", removeApartment);
document.getElementById("downloadPdf").addEventListener("click", downloadReport);
updateCalculations();
