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

function pdfColor(color) {
  return color.map((value) => value.toFixed(3)).join(" ");
}

function pdfTextAt(value, x, y, size, font, color) {
  return `${pdfColor(color)} rg BT /${font} ${size} Tf ${x} ${y} Td (${pdfText(value)}) Tj ET`;
}

function pdfFillRect(x, y, width, height, color) {
  return `${pdfColor(color)} rg ${x} ${y} ${width} ${height} re f`;
}

function pdfLine(x1, y1, x2, y2, color, width) {
  return `${pdfColor(color)} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S`;
}

function createPdf(calculation) {
  const month = monthInput.value;
  const period = month
    ? new Intl.DateTimeFormat("es-PE", { month: "long", year: "numeric" })
      .format(new Date(`${month}-01T12:00:00`))
    : "Mes no indicado";
  const generated = new Date().toLocaleDateString("es-PE");
  const rowsPerPage = 23;
  const pages = [];

  for (let start = 0; start < calculation.results.length; start += rowsPerPage) {
    pages.push({
      results: calculation.results.slice(start, start + rowsPerPage),
      isLast: start + rowsPerPage >= calculation.results.length
    });
  }

  const colors = {
    navy: [0.102, 0.114, 0.169],
    orange: [0.894, 0.345, 0.184],
    ink: [0.153, 0.161, 0.204],
    muted: [0.435, 0.447, 0.486],
    light: [0.957, 0.961, 0.973],
    line: [0.867, 0.878, 0.898],
    white: [1, 1, 1]
  };
  const pageCommands = pages.map((page, pageIndex) => {
    const commands = [];
    const totalApartments = calculation.results.length;
    const extraLabel = `EXTRA POR DEPTO. (${formatMoney(calculation.departmentFee)} x ${totalApartments})`;

    commands.push(
      pdfFillRect(0, 748, 595, 94, colors.navy),
      pdfFillRect(0, 744, 595, 4, colors.orange),
      pdfFillRect(40, 771, 48, 48, colors.orange),
      pdfTextAt("LN", 51, 786, 20, "F2", colors.white),
      pdfTextAt("LECTORA NOVA", 102, 805, 16, "F2", colors.white),
      pdfTextAt("CONTROL DE MEDIDORES", 103, 786, 8, "F1", [0.824, 0.839, 0.878]),
      pdfTextAt(pageIndex === 0 ? "REPORTE MENSUAL" : "REPORTE MENSUAL - CONTINUACION", 397, 805, 9, "F2", colors.white),
      pdfTextAt("LECTURAS Y COBROS", 397, 787, 8, "F1", [0.824, 0.839, 0.878]),
      pdfTextAt(`PERIODO  /  ${period.toLocaleUpperCase("es-PE")}`, 40, 719, 9, "F2", colors.ink)
    );

    const cardY = 625;
    const cardWidth = 164;
    const cardHeight = 75;
    const cardXs = [40, 216, 392];
    const cardValues = [
      { label: "MONTO DEL RECIBO", value: formatMoney(calculation.billTotal), highlight: false },
      { label: extraLabel, value: formatMoney(calculation.totalDepartmentFees), highlight: false },
      { label: "TOTAL A RECAUDAR", value: formatMoney(calculation.totalCharge), highlight: true }
    ];

    cardValues.forEach((card, index) => {
      const x = cardXs[index];
      const fill = card.highlight ? colors.navy : colors.light;
      const mainColor = card.highlight ? colors.white : colors.ink;
      const secondaryColor = card.highlight ? [0.91, 0.78, 0.72] : colors.muted;
      commands.push(
        pdfFillRect(x, cardY, cardWidth, cardHeight, fill),
        `${pdfColor(card.highlight ? colors.orange : colors.line)} RG 0.7 w ${x} ${cardY} ${cardWidth} ${cardHeight} re S`,
        pdfTextAt(card.label, x + 12, cardY + 53, 7, "F2", secondaryColor),
        pdfTextAt(card.value, x + 12, cardY + 25, 16, "F2", mainColor)
      );
      if (card.highlight) {
        commands.push(pdfFillRect(x, cardY, 4, cardHeight, colors.orange));
      }
    });

    const details = [
      { x: 42, label: "MEDIDOR GENERAL", value: `${formatNumber(calculation.generalKwh)} kWh` },
      { x: 222, label: "TARIFA PARA REPARTIR", value: `${formatRate(calculation.unitPrice)}/kWh` },
      { x: 402, label: "REFERENCIA GENERAL", value: `${formatMoney(calculation.referencePrice)}/kWh` }
    ];
    details.forEach((detail) => {
      commands.push(
        pdfTextAt(detail.label, detail.x, 604, 7, "F2", colors.muted),
        pdfTextAt(detail.value, detail.x, 587, 9, "F2", colors.ink)
      );
    });

    const tableX = 40;
    const tableWidth = 515;
    const tableHeaderY = 552;
    const rowHeight = 18;
    commands.push(
      pdfFillRect(tableX, tableHeaderY, tableWidth, 28, colors.navy),
      pdfTextAt("DEPARTAMENTO", 50, tableHeaderY + 10, 7, "F2", colors.white),
      pdfTextAt("ANTERIOR", 223, tableHeaderY + 10, 7, "F2", colors.white),
      pdfTextAt("ACTUAL", 307, tableHeaderY + 10, 7, "F2", colors.white),
      pdfTextAt("CONSUMO", 389, tableHeaderY + 10, 7, "F2", colors.white),
      pdfTextAt("COBRO", 486, tableHeaderY + 10, 7, "F2", colors.white)
    );

    page.results.forEach((result, rowIndex) => {
      const rowBottom = tableHeaderY - (rowIndex + 1) * rowHeight;
      const textY = rowBottom + 6;
      if (rowIndex % 2 === 0) {
        commands.push(pdfFillRect(tableX, rowBottom, tableWidth, rowHeight, colors.light));
      }
      commands.push(
        pdfLine(tableX, rowBottom, tableX + tableWidth, rowBottom, colors.line, 0.45),
        pdfTextAt(result.name.slice(0, 28), 50, textY, 8, "F2", colors.ink),
        pdfTextAt(formatNumber(result.previous), 223, textY, 8, "F1", colors.ink),
        pdfTextAt(formatNumber(result.current), 307, textY, 8, "F1", colors.ink),
        pdfTextAt(`${formatNumber(result.usage)} kWh`, 389, textY, 8, "F1", colors.muted),
        pdfTextAt(formatMoney(result.charge), 486, textY, 8, "F2", colors.orange)
      );
    });

    if (page.isLast) {
      commands.push(
        pdfFillRect(40, 77, 515, 36, colors.navy),
        pdfFillRect(40, 77, 4, 36, colors.orange),
        pdfTextAt("CONSUMO DE SUBMEDIDORES", 55, 96, 7, "F2", [0.824, 0.839, 0.878]),
        pdfTextAt(`${formatNumber(calculation.totalKwh)} kWh`, 55, 83, 10, "F2", colors.white),
        pdfTextAt("TOTAL A RECAUDAR", 390, 96, 7, "F2", [0.824, 0.839, 0.878]),
        pdfTextAt(formatMoney(calculation.totalCharge), 390, 82, 12, "F2", colors.white)
      );
    }

    commands.push(
      pdfLine(40, 57, 555, 57, colors.line, 0.6),
      pdfTextAt(`LECTORA NOVA  /  GENERADO ${generated}`, 40, 39, 7, "F1", colors.muted),
      pdfTextAt(`PAGINA ${pageIndex + 1} DE ${pages.length}`, 474, 39, 7, "F2", colors.muted)
    );
    return commands.join("\n");
  });

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"
  ];
  const pageObjectIds = [];

  pageCommands.forEach((commands) => {
    const pageObjectId = objects.length + 1;
    const contentObjectId = pageObjectId + 1;
    pageObjectIds.push(pageObjectId);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
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
document.getElementById("logoutButton").addEventListener("click", () => {
  try {
    sessionStorage.removeItem("lectoraNovaAuthenticated");
    window.location.replace("../index.html");
  } catch (error) {
    console.error("No se pudo cerrar la sesión de Lectora Nova.", error);
    formMessage.textContent = "No se pudo cerrar la sesión. Cierra la pestaña para salir.";
  }
});
updateCalculations();
