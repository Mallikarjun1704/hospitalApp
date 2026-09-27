/**
 * pdfGenerator.js
 * 
 * Shared utility for generating crisp, vector-based PDFs using jsPDF's native
 * text and line drawing APIs. All text is real PDF text (not rasterized images),
 * so it remains sharp at any zoom level and prints clearly on B&W printers.
 */
import { jsPDF } from 'jspdf';

// ─── Constants ──────────────────────────────────────────────────────────
const A4_WIDTH = 210;  // mm
const A4_HEIGHT = 297; // mm
const MARGIN_LEFT = 10;
const MARGIN_RIGHT = 10;
const MARGIN_TOP = 8;
const MARGIN_BOTTOM = 12;
const CONTENT_WIDTH = A4_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

const COLORS = {
  primary: [4, 151, 70],        // #049746 green
  headerBg: [4, 151, 70],
  tableBg: [14, 116, 144],      // sky-700
  black: [0, 0, 0],
  darkGray: [40, 40, 40],
  gray: [100, 100, 100],
  lightGray: [200, 200, 200],
  borderGray: [180, 180, 180],
  white: [255, 255, 255],
};

// ─── Helper: load image as base64 ──────────────────────────────────────
const loadImageAsBase64 = (src) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
};

// ─── Helper: check if we need a new page ────────────────────────────────
const checkPageBreak = (pdf, y, neededHeight = 20) => {
  if (y + neededHeight > A4_HEIGHT - MARGIN_BOTTOM) {
    pdf.addPage();
    return MARGIN_TOP;
  }
  return y;
};

// ─── Draw Hospital Header ───────────────────────────────────────────────
const drawHeader = async (pdf, y, logoBase64, isCompact = false, copyLabel = null) => {
  const startY = y;
  const logoSize = isCompact ? 13 : 16;

  // Render copy label badge in top right corner if provided
  if (copyLabel) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(isCompact ? 8 : 8.5);
    pdf.setTextColor(...COLORS.gray);
    pdf.text(`[ ${copyLabel} ]`, A4_WIDTH - MARGIN_RIGHT, y + 3.5, { align: 'right' });
  }

  // Logo
  if (logoBase64) {
    try {
      pdf.addImage(logoBase64, 'JPEG', MARGIN_LEFT, y, logoSize, logoSize);
    } catch (e) {
      // skip logo if it fails
    }
  }

  // Hospital name
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(isCompact ? 13 : 15);
  pdf.setTextColor(...COLORS.primary);
  pdf.text('PRASHANTH GENERAL HOSPITAL', A4_WIDTH / 2, y + 4.5, { align: 'center' });

  // Address
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(isCompact ? 7.2 : 7.5);
  pdf.setTextColor(...COLORS.darkGray);
  pdf.text('SRS complex, Bhagyanagar circle, Kinnal road Koppal', A4_WIDTH / 2, y + 9.5, { align: 'center' });

  // Contact
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(isCompact ? 7.2 : 7.5);
  pdf.setTextColor(...COLORS.primary);
  pdf.text('Contact: 8861464789', A4_WIDTH / 2, y + 13.5, { align: 'center' });

  // Separator line
  const lineY = startY + (isCompact ? 15.5 : 18.5);
  pdf.setDrawColor(...COLORS.primary);
  pdf.setLineWidth(isCompact ? 0.35 : 0.5);
  pdf.line(MARGIN_LEFT, lineY, A4_WIDTH - MARGIN_RIGHT, lineY);

  return lineY + (isCompact ? 2.5 : 3.0);
};

// ─── Draw Title ─────────────────────────────────────────────────────────
const drawTitle = (pdf, title, y, isCompact = false) => {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(isCompact ? 9.5 : 11);
  pdf.setTextColor(...COLORS.primary);
  pdf.text(title, A4_WIDTH / 2, y + 3.5, { align: 'center' });
  return y + (isCompact ? 5.5 : 7.0);
};

// ─── Draw Patient Info Grid (For Bills) ──────────────────────────────────
const drawPatientInfo = (pdf, fields, y, isCompact = false) => {
  const fontSize = isCompact ? 7.5 : 8.5;
  const rowStep = isCompact ? 5.2 : 6.0;
  pdf.setFontSize(fontSize);
  const colWidth = CONTENT_WIDTH / 3;
  let col = 0;
  let row = 0;

  fields.forEach((field) => {
    if (!field.label) return;
    const x = MARGIN_LEFT + (col * colWidth);
    const rowY = y + (row * rowStep) + 3.2;

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.black);
    const labelText = `${field.label}: `;
    pdf.text(labelText, x, rowY);

    const labelWidth = pdf.getTextWidth(labelText);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...COLORS.darkGray);
    const valueMaxWidth = colWidth - labelWidth - 2;
    const valueText = String(field.value || '');
    if (pdf.getTextWidth(valueText) > valueMaxWidth && valueMaxWidth > 0) {
      const truncated = pdf.splitTextToSize(valueText, valueMaxWidth);
      pdf.text(truncated[0] || '', x + labelWidth, rowY);
    } else {
      pdf.text(valueText, x + labelWidth, rowY);
    }

    col++;
    if (col >= 3) {
      col = 0;
      row++;
    }
  });

  const totalRows = col > 0 ? row + 1 : row;
  return y + (totalRows * rowStep) + 1.5;
};

// ─── Draw Services Table ────────────────────────────────────────────────
const drawTable = (pdf, columns, rows, y, isCompact = false) => {
  const rowHeight = isCompact ? 5.0 : 6.2;
  const headerHeight = isCompact ? 5.8 : 7.0;
  const fontSize = isCompact ? 7.5 : 8;
  const headerFontSize = isCompact ? 7.5 : 8;

  const totalSpecifiedWidth = columns.reduce((sum, col) => sum + (col.width || 0), 0);
  const unspecifiedCount = columns.filter(col => !col.width).length;
  const remainingWidth = CONTENT_WIDTH - totalSpecifiedWidth;
  const autoWidth = unspecifiedCount > 0 ? remainingWidth / unspecifiedCount : 0;

  const colWidths = columns.map(col => col.width || autoWidth);

  y = checkPageBreak(pdf, y, headerHeight + rowHeight);
  pdf.setFillColor(...COLORS.tableBg);
  pdf.rect(MARGIN_LEFT, y, CONTENT_WIDTH, headerHeight, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(headerFontSize);
  pdf.setTextColor(...COLORS.white);

  let x = MARGIN_LEFT;
  columns.forEach((col, i) => {
    pdf.text(col.header, x + 2, y + headerHeight - 1.8);
    if (i > 0) {
      pdf.setDrawColor(...COLORS.white);
      pdf.setLineWidth(0.2);
      pdf.line(x, y, x, y + headerHeight);
    }
    x += colWidths[i];
  });

  pdf.setDrawColor(...COLORS.lightGray);
  pdf.setLineWidth(0.3);
  pdf.rect(MARGIN_LEFT, y, CONTENT_WIDTH, headerHeight);

  y += headerHeight;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(fontSize);
  pdf.setTextColor(...COLORS.black);

  rows.forEach((row) => {
    y = checkPageBreak(pdf, y, rowHeight + 1.5);
    if (y === MARGIN_TOP) {
      pdf.setFillColor(...COLORS.tableBg);
      pdf.rect(MARGIN_LEFT, y, CONTENT_WIDTH, headerHeight, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(headerFontSize);
      pdf.setTextColor(...COLORS.white);
      let hx = MARGIN_LEFT;
      columns.forEach((col, i) => {
        pdf.text(col.header, hx + 2, y + headerHeight - 1.8);
        if (i > 0) {
          pdf.setDrawColor(...COLORS.white);
          pdf.setLineWidth(0.2);
          pdf.line(hx, y, hx, y + headerHeight);
        }
        hx += colWidths[i];
      });
      pdf.setDrawColor(...COLORS.lightGray);
      pdf.setLineWidth(0.3);
      pdf.rect(MARGIN_LEFT, y, CONTENT_WIDTH, headerHeight);
      y += headerHeight;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(fontSize);
      pdf.setTextColor(...COLORS.black);
    }

    x = MARGIN_LEFT;
    columns.forEach((col, i) => {
      const cellValue = String(row[col.key] ?? '');
      const maxCellWidth = colWidths[i] - 4;
      let displayText = cellValue;
      if (pdf.getTextWidth(displayText) > maxCellWidth && maxCellWidth > 0) {
        const lines = pdf.splitTextToSize(displayText, maxCellWidth);
        displayText = lines[0] || '';
      }
      pdf.text(displayText, x + 2, y + rowHeight - 1.5);

      pdf.setDrawColor(...COLORS.lightGray);
      pdf.setLineWidth(0.2);
      pdf.rect(x, y, colWidths[i], rowHeight);

      x += colWidths[i];
    });

    y += rowHeight;
  });

  return y + 2.5;
};

// ─── Draw Totals Section (Clean Right-Aligned Box - No Overlap) ─────────
const drawTotals = (pdf, totals, y, isCompact = false) => {
  const fontSize = isCompact ? 7.5 : 8.5;
  const lineStep = isCompact ? 4.2 : 5.2;
  const boxWidth = isCompact ? 72 : 80;
  const boxX = A4_WIDTH - MARGIN_RIGHT - boxWidth;
  const labelX = boxX + 2;
  const valueX = A4_WIDTH - MARGIN_RIGHT - 2;

  totals.forEach((item) => {
    y = checkPageBreak(pdf, y, lineStep);
    const textY = y + 3.0;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(fontSize);
    pdf.setTextColor(...COLORS.black);
    pdf.text(item.label, labelX, textY);

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.darkGray);
    pdf.text(String(item.value ?? ''), valueX, textY, { align: 'right' });
    y += lineStep;
  });

  return y + 2.0;
};

// ─── Draw Signature Section ─────────────────────────────────────────────
const drawSignature = (pdf, y, isCompact = false) => {
  const neededHeight = isCompact ? 13 : 16;
  y = checkPageBreak(pdf, y, neededHeight);
  const lineY = y + (isCompact ? 6 : 9);
  const textY = lineY + 3.5;

  pdf.setDrawColor(...COLORS.black);
  pdf.setLineWidth(0.3);
  pdf.line(A4_WIDTH - MARGIN_RIGHT - 50, lineY, A4_WIDTH - MARGIN_RIGHT - 5, lineY);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(isCompact ? 7.5 : 8.5);
  pdf.setTextColor(...COLORS.black);
  pdf.text('Authorized Signature', A4_WIDTH - MARGIN_RIGHT - 45, textY);

  return textY + 2.5;
};

// ─── Draw Dashed Cut Line (For Combined Page Layout) ────────────────────
const drawCutLine = (pdf, y) => {
  const lineY = y + 1.5;
  pdf.setDrawColor(160, 160, 160);
  pdf.setLineWidth(0.25);
  pdf.setLineDashPattern([2, 2], 0);
  pdf.line(MARGIN_LEFT, lineY, A4_WIDTH - MARGIN_RIGHT, lineY);
  pdf.setLineDashPattern([], 0);

  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(6.5);
  pdf.setTextColor(120, 120, 120);
  pdf.text('✂ - - - - - - - - - - - - - - - - - - - - - Cut Here - - - - - - - - - - - - - - - - - - - - - ✂', A4_WIDTH / 2, lineY - 0.7, { align: 'center' });
  return lineY + 3.5;
};

// ─── Estimate Height of a Single Copy ───────────────────────────────────
const estimateCopyHeight = (rowCount, totalsCount, isCompact = true) => {
  const headerHeight = isCompact ? 18 : 21.5;
  const titleHeight = isCompact ? 5.5 : 7.0;
  const patientInfoHeight = isCompact ? 12.0 : 14.0;
  const separatorHeight = 2.5;
  const tableHeaderHeight = isCompact ? 5.8 : 7.0;
  const tableRowsHeight = rowCount * (isCompact ? 5.0 : 6.2);
  const totalsHeight = totalsCount * (isCompact ? 4.2 : 5.2);
  const signatureHeight = isCompact ? 12.0 : 15.0;
  const padding = 4;

  return headerHeight + titleHeight + patientInfoHeight + separatorHeight + tableHeaderHeight + tableRowsHeight + totalsHeight + signatureHeight + padding;
};

// ─── Draw Single Copy Block ─────────────────────────────────────────────
const drawBillCopy = async (pdf, startY, {
  copyLabel,
  title,
  logoBase64,
  patientFields,
  columns,
  rows,
  totals,
  isCompact = false,
}) => {
  let y = startY;

  // Brand header with integrated copy label badge
  y = await drawHeader(pdf, y, logoBase64, isCompact, copyLabel);

  // Bill title
  y = drawTitle(pdf, title, y, isCompact);

  // Patient details grid
  y = drawPatientInfo(pdf, patientFields, y, isCompact);

  // Separator
  y = drawSeparator(pdf, y);

  // Services table
  if (columns.length > 0 && rows.length > 0) {
    y = drawTable(pdf, columns, rows, y, isCompact);
  }

  // Totals
  if (totals.length > 0) {
    y = drawTotals(pdf, totals, y, isCompact);
  }

  // Signature
  y = drawSignature(pdf, y, isCompact);

  return y;
};

// ─── Draw Single-Line Underlined Field (No Boxes) ────────────────────────
/**
 * Renders Label: [Value] with a clean underline.
 * If value is empty, the underline remains completely blank for writing.
 */
const drawUnderlineField = (pdf, x, y, width, label, value, options = {}) => {
  const { labelFontSize = 8.5, valueFontSize = 9, labelWidth: customLabelWidth = null } = options;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(labelFontSize);
  pdf.setTextColor(...COLORS.black);

  const labelText = label ? `${label} ` : '';
  pdf.text(labelText, x, y);

  const labelWidth = customLabelWidth || pdf.getTextWidth(labelText);
  const lineStartX = x + labelWidth + 1;
  const lineEndX = x + width;

  // Underline
  pdf.setDrawColor(190, 190, 190);
  pdf.setLineWidth(0.3);
  pdf.line(lineStartX, y + 1.2, lineEndX, y + 1.2);

  // Render value if present and non-empty
  const valStr = (value !== undefined && value !== null && String(value).trim() !== '' && String(value).trim() !== '0') 
    ? String(value).trim() 
    : '';

  if (valStr) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(valueFontSize);
    pdf.setTextColor(...COLORS.darkGray);
    const maxValWidth = lineEndX - lineStartX - 2;
    const truncated = pdf.splitTextToSize(valStr, maxValWidth);
    pdf.text(truncated[0] || '', lineStartX + 1.5, y);
  }

  return y + 1.2;
};

// ─── Draw Multi-Line Section Area (No Boxes, Full Height) ────────────────
/**
 * Renders a bold section title and generously spaced content area with
 * subtle separator line at the bottom.
 * If empty, leaves clean blank space for manual writing.
 */
const drawMultilineSection = (pdf, x, y, width, height, label, value, options = {}) => {
  const { labelFontSize = 9, valueFontSize = 8.5 } = options;

  // Bold section label
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(labelFontSize);
  pdf.setTextColor(...COLORS.black);
  pdf.text(label, x, y);

  const contentStartY = y + 4.5;

  const valStr = (value !== undefined && value !== null && String(value).trim() !== '') 
    ? String(value).trim() 
    : '';

  if (valStr) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(valueFontSize);
    pdf.setTextColor(...COLORS.darkGray);
    const lines = pdf.splitTextToSize(valStr, width - 2);
    let lineY = contentStartY + 1;
    lines.forEach((line) => {
      pdf.text(line, x + 1, lineY);
      lineY += 4.2;
    });
  }

  // Subtle bottom line to clearly demarcate the section
  pdf.setDrawColor(215, 215, 215);
  pdf.setLineWidth(0.25);
  pdf.line(x, y + height - 1.5, x + width, y + height - 1.5);

  return y + height;
};

// ─── Draw separator line ────────────────────────────────────────────────
const drawSeparator = (pdf, y) => {
  pdf.setDrawColor(...COLORS.lightGray);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN_LEFT, y, A4_WIDTH - MARGIN_RIGHT, y);
  return y + 3;
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN EXPORTED FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Generate a bill PDF (Cash Bill, Medical Bill, Lab Bill, Pharmacy Bill)
 * with Single-Page Priority Layout:
 * 1. Both Patient Copy and Hospital Copy render sequentially on a single page by default.
 * 2. If the combined length of items/data exceeds the height of a single page,
 *    it dynamically splits across 2 separate pages (or more if table itself overflows).
 */
export const generateBillPDF = async ({
  title = 'Hospital Cash Bill',
  fileName = 'bill',
  patientFields = [],
  columns = [],
  rows = [],
  totals = [],
  copies = ['PATIENT COPY', 'HOSPITAL COPY'],
}) => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let logoBase64 = null;

  try {
    logoBase64 = await loadImageAsBase64('images/medicallogo.jpg');
  } catch (e) {
    // skip logo if not found
  }

  const availablePageHeight = A4_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM; // 281mm
  const cutLineHeight = 5; // mm

  // Calculate estimated height for a single copy in compact mode
  const singleCopyHeightCompact = estimateCopyHeight(rows.length, totals.length, true);
  const totalCombinedHeightCompact = (singleCopyHeightCompact * copies.length) + (cutLineHeight * (copies.length - 1));

  // Determine if all copies can fit on a single page
  const fitOnSinglePage = copies.length > 1 && totalCombinedHeightCompact <= availablePageHeight;

  let currentY = MARGIN_TOP;

  for (let c = 0; c < copies.length; c++) {
    if (c > 0) {
      if (fitOnSinglePage) {
        // Render next copy on same page with neat dashed cut line
        currentY = drawCutLine(pdf, currentY);
      } else {
        // Natural dynamic overflow: Check if there's enough space left on this page for the next copy
        const stdHeight = estimateCopyHeight(rows.length, totals.length, false);
        if (currentY + stdHeight <= availablePageHeight) {
          currentY = drawCutLine(pdf, currentY);
        } else {
          pdf.addPage();
          currentY = MARGIN_TOP;
        }
      }
    }

    currentY = await drawBillCopy(pdf, currentY, {
      copyLabel: copies[c],
      title,
      logoBase64,
      patientFields,
      columns,
      rows,
      totals,
      isCompact: fitOnSinglePage,
    });
  }

  pdf.save(`${fileName}-${Date.now()}.pdf`);
};

/**
 * Generate a Discharge Summary PDF.
 * Spreads clinical sections across the page with clean open writing space.
 */
export const generateDischargePDF = async ({ formData = {}, fileName = 'discharge-summary' }) => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let logoBase64 = null;

  try {
    logoBase64 = await loadImageAsBase64('images/medicallogo.jpg');
  } catch (e) {
    // skip
  }

  let y = MARGIN_TOP;
  y = await drawHeader(pdf, y, logoBase64);
  y = drawTitle(pdf, 'DISCHARGE SUMMARY', y);

  // Patient details grid
  y = drawPatientInfo(pdf, [
    { label: 'Name of Patient', value: formData.patientName },
    { label: 'Tel No', value: formData.contactNumber },
    { label: 'IPD No', value: formData.ipdNumber },
    { label: 'Admission No', value: formData.admissionNumber },
    { label: 'Treating Consultant', value: formData.consultantName },
    { label: 'MLC No', value: formData.mlcNumber },
    { label: 'Admission Date', value: formData.admissionDate },
    { label: 'Admission Time', value: formData.admissionTime },
    { label: 'ICD Code', value: formData.icdCode },
    { label: 'Discharge Date', value: formData.dischargeDate },
    { label: 'Discharge Time', value: formData.dischargeTime },
  ], y);

  y = drawSeparator(pdf, y);

  // All 11 Clinical Sections (Clean multiline layout without heavy boxes)
  const sections = [
    { label: 'Presenting Complaints :', value: formData.presentingComplaints, height: 18 },
    { label: 'Summary of Illness :', value: formData.illnessSummary, height: 22 },
    { label: 'Key Findings (Vitals/Physical) :', value: formData.keyFindings, height: 18 },
    { label: 'Substance History :', value: formData.substanceHistory, height: 14 },
    { label: 'Past History :', value: formData.pastHistory, height: 14 },
    { label: 'Family History :', value: formData.familyHistory, height: 14 },
    { label: 'Provisional Diagnosis :', value: formData.provisionalDiagnosis, height: 18 },
    { label: 'Final Diagnosis :', value: formData.finalDiagnosis, height: 18 },
    { label: 'Investigations :', value: formData.investigations, height: 18 },
    { label: 'Course in the Hospital / Treatment Given :', value: formData.hospitalCourse, height: 22 },
    { label: 'Discharge Advice / Medications :', value: formData.dischargeAdvice, height: 22 },
  ];

  sections.forEach((section) => {
    y = checkPageBreak(pdf, y, section.height + 4);
    y = drawMultilineSection(pdf, MARGIN_LEFT, y, CONTENT_WIDTH, section.height, section.label, section.value) + 2;
  });

  // Signature
  y = checkPageBreak(pdf, y, 25);
  y += 14;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(...COLORS.black);
  pdf.text('Treating Doctor Signature', A4_WIDTH - MARGIN_RIGHT - 45, y);
  pdf.setDrawColor(...COLORS.black);
  pdf.setLineWidth(0.3);
  pdf.line(A4_WIDTH - MARGIN_RIGHT - 55, y - 4, A4_WIDTH - MARGIN_RIGHT - 5, y - 4);

  pdf.save(`${fileName}-${Date.now()}.pdf`);
};

/**
 * Generate a Patient Admission PDF (IPD / OPD).
 * - Full-page distribution from top to bottom (no half-page blank gaps).
 * - Clean underlined fields and open multiline sections (no tight individual boxes).
 * - Blank lines/space for empty fields.
 * - Signatures pinned neatly at the bottom.
 */
export const generatePatientPDF = async ({ formData = {}, fileName = 'patient' }) => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let logoBase64 = null;

  try {
    logoBase64 = await loadImageAsBase64('images/medicallogo.jpg');
  } catch (e) {
    // skip
  }

  const formType = formData.formType || 'IPD';

  // ═══════════════════════════════════════════════════════════════
  // PAGE 1: Basic Info, Clinical History & Vitals (Full Page)
  // ═══════════════════════════════════════════════════════════════
  let y = MARGIN_TOP;
  y = await drawHeader(pdf, y, logoBase64);

  const page1Title = formType === 'OPD' ? 'OPD FILE' : 'ADMISSION FILE (IPD) - PAGE 1';
  drawTitle(pdf, page1Title, y);

  const leftColX = MARGIN_LEFT; // 10mm
  const leftColW = 118;         // 118mm (approx 63%)
  const colGap = 5;             // 5mm gap
  const rightColX = leftColX + leftColW + colGap; // 133mm
  const rightColW = CONTENT_WIDTH - leftColW - colGap; // 67mm (approx 37%)

  // --- Left Column: Generously spaced across full height (y: 38mm to 260mm) ---
  drawUnderlineField(pdf, leftColX, 40, leftColW, 'Name :', formData.name);
  drawMultilineSection(pdf, leftColX, 48, leftColW, 28, 'Address :', formData.address);
  drawMultilineSection(pdf, leftColX, 79, leftColW, 32, 'Chief Complaints :', formData.chiefComplaints);
  drawMultilineSection(
    pdf, 
    leftColX, 
    114, 
    leftColW, 
    36, 
    formType === 'OPD' ? 'Positive Findings :' : 'History of Presenting Illness :', 
    formData.historyPresenting
  );
  drawMultilineSection(
    pdf, 
    leftColX, 
    153, 
    leftColW, 
    32, 
    formType === 'OPD' ? 'Provisional Diagnosis :' : 'Previous History :', 
    formData.previousHistory
  );
  drawMultilineSection(
    pdf, 
    leftColX, 
    188, 
    leftColW, 
    32, 
    formType === 'OPD' ? 'Investigation :' : 'Personal History :', 
    formData.personalHistory
  );
  drawMultilineSection(
    pdf, 
    leftColX, 
    223, 
    leftColW, 
    36, 
    formType === 'OPD' ? 'Advice :' : 'Allergic History :', 
    formData.allergicHistory
  );

  // --- Right Column: Top Metadata ---
  const numLabel = formType === 'OPD' ? 'OPD Number :' : 'IPD Number :';
  drawUnderlineField(pdf, rightColX, 40, rightColW, numLabel, formData.ipdNumber);

  const halfW = (rightColW - 3) / 2;
  drawUnderlineField(pdf, rightColX, 52, halfW, 'Age :', formData.age);
  drawUnderlineField(pdf, rightColX + halfW + 3, 52, halfW, 'Gender :', formData.gender);

  drawUnderlineField(pdf, rightColX, 64, rightColW, 'Contact :', formData.contact);

  const amtStr = (formData.amount != null && formData.amount !== 0 && formData.amount !== '0') ? String(formData.amount) : '';
  drawUnderlineField(pdf, rightColX, 76, halfW, 'Amount :', amtStr);
  drawUnderlineField(pdf, rightColX + halfW + 3, 76, halfW, 'Mode :', formData.modeOfPayment || 'CASH');

  drawUnderlineField(pdf, rightColX, 88, halfW, 'Date :', formData.date);
  drawUnderlineField(pdf, rightColX + halfW + 3, 88, halfW, 'Time :', formData.time);

  drawUnderlineField(pdf, rightColX, 100, rightColW, 'Doctor :', formData.consultDoctor);

  // --- Right Column: Vital Signs Card (y: 114mm to 198mm) ---
  const vitalCardY = 114;
  const vitalCardH = 84;
  
  // Outer frame
  pdf.setDrawColor(...COLORS.primary);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(rightColX, vitalCardY, rightColW, vitalCardH, 2, 2, 'S');

  // Header banner
  pdf.setFillColor(...COLORS.primary);
  pdf.roundedRect(rightColX, vitalCardY, rightColW, 8, 2, 2, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text('VITAL SIGNS', rightColX + (rightColW / 2), vitalCardY + 5.5, { align: 'center' });

  // Vitals Grid
  const vColW = (rightColW - 8) / 2;
  drawUnderlineField(pdf, rightColX + 3, 134, vColW, 'GCS :', formData.gcs);
  drawUnderlineField(pdf, rightColX + vColW + 5, 134, vColW, 'Temp :', formData.temp);

  drawUnderlineField(pdf, rightColX + 3, 156, vColW, 'Pulse :', formData.pulse);
  drawUnderlineField(pdf, rightColX + vColW + 5, 156, vColW, 'BP :', formData.bp);

  drawUnderlineField(pdf, rightColX + 3, 178, vColW, 'Spo2 :', formData.spo2);
  drawUnderlineField(pdf, rightColX + vColW + 5, 178, vColW, 'RBS :', formData.rbs);

  // --- Page 1 Signatures (Pinned at bottom) ---
  const page1SigY = 282;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(...COLORS.black);
  pdf.setDrawColor(...COLORS.black);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN_LEFT, page1SigY - 4, MARGIN_LEFT + 55, page1SigY - 4);
  pdf.text('Patient / Attender Signature', MARGIN_LEFT, page1SigY);

  pdf.line(A4_WIDTH - MARGIN_RIGHT - 55, page1SigY - 4, A4_WIDTH - MARGIN_RIGHT, page1SigY - 4);
  pdf.text('Doctor Signature', A4_WIDTH - MARGIN_RIGHT - 35, page1SigY);

  // ═══════════════════════════════════════════════════════════════
  // PAGE 2: IPD Continued (Physical Examinations - Full Page)
  // ═══════════════════════════════════════════════════════════════
  if (formType === 'IPD') {
    pdf.addPage();
    let p2Y = MARGIN_TOP;
    p2Y = await drawHeader(pdf, p2Y, logoBase64);
    drawTitle(pdf, 'ADMISSION FILE (IPD) - CONTINUED', p2Y);

    // --- Left Column: Physical Examination (Left) ---
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(...COLORS.primary);
    pdf.text('PHYSICAL EXAMINATION (LEFT)', leftColX, 40);

    drawMultilineSection(pdf, leftColX, 46, leftColW, 34, 'General Physical Examination :', formData.generalPhysicalExam);
    drawMultilineSection(pdf, leftColX, 83, leftColW, 30, 'CVS :', formData.cvs);
    drawMultilineSection(pdf, leftColX, 116, leftColW, 30, 'RS :', formData.rs);
    drawMultilineSection(pdf, leftColX, 149, leftColW, 30, 'PA :', formData.pa);
    drawMultilineSection(pdf, leftColX, 182, leftColW, 30, 'CNS :', formData.cns);
    drawMultilineSection(pdf, leftColX, 215, leftColW, 44, 'Provisional Diagnosis :', formData.provisionalDiagnosis);

    // --- Right Column: Physical Examination (Right) ---
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(...COLORS.primary);
    pdf.text('PHYSICAL EXAMINATION (RIGHT)', rightColX + (rightColW / 2), 40, { align: 'center' });

    // Container Card
    const p2CardY = 46;
    const p2CardH = 152;
    pdf.setDrawColor(...COLORS.primary);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(rightColX, p2CardY, rightColW, p2CardH, 2, 2, 'S');

    // Header banner
    pdf.setFillColor(...COLORS.primary);
    pdf.roundedRect(rightColX, p2CardY, rightColW, 8, 2, 2, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text('GENERAL EXAMINATION', rightColX + (rightColW / 2), p2CardY + 5.5, { align: 'center' });

    drawUnderlineField(pdf, rightColX + 5, 68, rightColW - 10, 'Pallor :', formData.pallor);
    drawUnderlineField(pdf, rightColX + 5, 94, rightColW - 10, 'Icterus :', formData.icterus);
    drawUnderlineField(pdf, rightColX + 5, 120, rightColW - 10, 'Clubbing :', formData.clubbing);
    drawUnderlineField(pdf, rightColX + 5, 146, rightColW - 10, 'Cyanosis :', formData.cyanosis);
    drawUnderlineField(pdf, rightColX + 5, 172, rightColW - 10, 'Edema :', formData.edema);

    // --- Page 2 Signatures (Pinned at bottom) ---
    const page2SigY = 282;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(...COLORS.black);
    pdf.setDrawColor(...COLORS.black);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN_LEFT, page2SigY - 4, MARGIN_LEFT + 55, page2SigY - 4);
    pdf.text('Patient / Attender Signature', MARGIN_LEFT, page2SigY);

    pdf.line(A4_WIDTH - MARGIN_RIGHT - 55, page2SigY - 4, A4_WIDTH - MARGIN_RIGHT, page2SigY - 4);
    pdf.text('Doctor Signature', A4_WIDTH - MARGIN_RIGHT - 35, page2SigY);
  }

  pdf.save(`${fileName}-${Date.now()}.pdf`);
};

const pdfGenerator = {
  generateBillPDF,
  generateDischargePDF,
  generatePatientPDF,
};

export default pdfGenerator;
