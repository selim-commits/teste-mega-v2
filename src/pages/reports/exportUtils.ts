/**
 * Export utilities for the Reports page.
 * Provides CSV download and PDF print functionality.
 */

// ─── Types ──────────────────────────────────────────────

interface KpiExportData {
  label: string;
  value: string;
  change: number;
}

interface MonthlyRevenueExportData {
  month: string;
  value: number;
}

interface SpaceExportData {
  name: string;
  percentage: number;
}

interface WeeklyBookingExportData {
  label: string;
  value: number;
}

interface TopClientExportData {
  name: string;
  revenue: number;
}

interface ActivityExportData {
  type: string;
  title: string;
  description: string;
  amount?: number;
  time: string;
}

export interface ReportExportData {
  kpis: KpiExportData[];
  monthlyRevenue: MonthlyRevenueExportData[];
  spaces: SpaceExportData[];
  weeklyBookings: WeeklyBookingExportData[];
  topClients: TopClientExportData[];
  activities: ActivityExportData[];
}

// ─── Helpers ────────────────────────────────────────────

function formatDecimalFR(value: number): string {
  return value.toString().replace('.', ',');
}

function formatEurFR(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

function getPeriodLabel(period: string): string {
  switch (period) {
    case '7d':
      return '7 derniers jours';
    case '30d':
      return '30 derniers jours';
    case '90d':
      return '90 derniers jours';
    case '12m':
      return '12 derniers mois';
    default:
      return period;
  }
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getFilenameDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Escape a CSV field value (semicolon separator)
function csvField(value: string | number | undefined): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  // If the field contains semicolons, quotes, or newlines, wrap in quotes
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// ─── CSV Export ─────────────────────────────────────────

export function exportCSV(data: ReportExportData, period: string): void {
  const sep = ';';
  const lines: string[] = [];
  const dateStr = getFormattedDate();
  const periodLabel = getPeriodLabel(period);

  // Title rows
  lines.push(`Rapport Rooom OS${sep}${sep}`);
  lines.push(`Periode${sep}${csvField(periodLabel)}${sep}`);
  lines.push(`Date d'export${sep}${csvField(dateStr)}${sep}`);
  lines.push('');

  // KPIs section
  lines.push(`=== Indicateurs cles ===${sep}${sep}`);
  lines.push(`Indicateur${sep}Valeur${sep}Variation (%)`);
  for (const kpi of data.kpis) {
    lines.push(
      `${csvField(kpi.label)}${sep}${csvField(kpi.value)}${sep}${formatDecimalFR(kpi.change)}`
    );
  }
  lines.push('');

  // Monthly Revenue section
  lines.push(`=== Revenus par mois ===${sep}`);
  lines.push(`Mois${sep}Revenu (EUR)`);
  let totalRevenue = 0;
  for (const m of data.monthlyRevenue) {
    lines.push(`${csvField(m.month)}${sep}${formatDecimalFR(m.value)}`);
    totalRevenue += m.value;
  }
  lines.push(`Total${sep}${formatDecimalFR(totalRevenue)}`);
  lines.push('');

  // Space Distribution section
  lines.push(`=== Repartition par espace ===${sep}`);
  lines.push(`Espace${sep}Pourcentage (%)`);
  for (const s of data.spaces) {
    lines.push(`${csvField(s.name)}${sep}${formatDecimalFR(s.percentage)}`);
  }
  lines.push('');

  // Weekly Bookings section
  lines.push(`=== Tendance reservations ===${sep}`);
  lines.push(`Semaine${sep}Reservations`);
  let totalBookings = 0;
  for (const w of data.weeklyBookings) {
    lines.push(`${csvField(w.label)}${sep}${w.value}`);
    totalBookings += w.value;
  }
  lines.push(`Total${sep}${totalBookings}`);
  lines.push('');

  // Top Clients section
  lines.push(`=== Top clients ===${sep}`);
  lines.push(`Client${sep}Revenu (EUR)`);
  for (const c of data.topClients) {
    lines.push(`${csvField(c.name)}${sep}${formatDecimalFR(c.revenue)}`);
  }
  lines.push('');

  // Activities section
  lines.push(`=== Activite recente ===${sep}${sep}${sep}${sep}`);
  lines.push(`Type${sep}Titre${sep}Description${sep}Montant (EUR)${sep}Date`);
  for (const a of data.activities) {
    const amount = a.amount !== undefined ? formatDecimalFR(a.amount) : '';
    lines.push(
      `${csvField(a.type)}${sep}${csvField(a.title)}${sep}${csvField(a.description)}${sep}${amount}${sep}${csvField(a.time)}`
    );
  }

  // BOM for Excel UTF-8 detection + content
  const BOM = '\uFEFF';
  const csv = BOM + lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `rapport-${period}-${getFilenameDate()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── PDF Export (Print) ─────────────────────────────────

export function exportPDF(data: ReportExportData, period: string): void {
  const dateStr = getFormattedDate();
  const periodLabel = getPeriodLabel(period);

  // Build HTML content for the print view
  const html = buildPrintHTML(data, periodLabel, dateStr);

  // Inject into a hidden container, trigger print, then clean up
  const printContainerId = 'rooom-print-container';

  // Remove any existing container
  const existing = document.getElementById(printContainerId);
  if (existing) {
    existing.remove();
  }

  const container = document.createElement('div');
  container.id = printContainerId;
  container.innerHTML = html;
  document.body.appendChild(container);

  // Small delay to ensure styles are applied
  requestAnimationFrame(() => {
    window.print();
    // Clean up after print dialog closes
    setTimeout(() => {
      container.remove();
    }, 1000);
  });
}

function buildPrintHTML(
  data: ReportExportData,
  periodLabel: string,
  dateStr: string
): string {
  // KPIs table
  const kpiRows = data.kpis
    .map(
      (kpi) => `
      <tr>
        <td>${kpi.label}</td>
        <td class="print-value">${kpi.value}</td>
        <td class="print-change ${kpi.change >= 0 ? 'print-positive' : 'print-negative'}">
          ${kpi.change >= 0 ? '+' : ''}${formatDecimalFR(kpi.change)}%
        </td>
      </tr>`
    )
    .join('');

  // Monthly Revenue table
  let totalRevenue = 0;
  const revenueRows = data.monthlyRevenue
    .map((m) => {
      totalRevenue += m.value;
      return `
      <tr>
        <td>${m.month}</td>
        <td class="print-value">${formatEurFR(m.value)}</td>
      </tr>`;
    })
    .join('');

  // Spaces table
  const spaceRows = data.spaces
    .map(
      (s) => `
      <tr>
        <td>${s.name}</td>
        <td class="print-value">${s.percentage}%</td>
      </tr>`
    )
    .join('');

  // Weekly Bookings table
  let totalBookings = 0;
  const bookingRows = data.weeklyBookings
    .map((w) => {
      totalBookings += w.value;
      return `
      <tr>
        <td>${w.label}</td>
        <td class="print-value">${w.value}</td>
      </tr>`;
    })
    .join('');

  // Top Clients table
  const clientRows = data.topClients
    .map(
      (c) => `
      <tr>
        <td>${c.name}</td>
        <td class="print-value">${formatEurFR(c.revenue)}</td>
      </tr>`
    )
    .join('');

  // Activities table
  const activityRows = data.activities
    .map(
      (a) => `
      <tr>
        <td>${a.title}</td>
        <td>${a.description}</td>
        <td class="print-value">${a.amount !== undefined ? formatEurFR(a.amount) : '-'}</td>
        <td>${a.time}</td>
      </tr>`
    )
    .join('');

  return `
    <div class="print-report">
      <div class="print-header">
        <h1>Rooom OS - Rapport</h1>
        <div class="print-meta">
          <span>Periode : ${periodLabel}</span>
          <span>Date : ${dateStr}</span>
        </div>
      </div>

      <div class="print-section">
        <h2>Indicateurs cles</h2>
        <table class="print-table">
          <thead>
            <tr>
              <th>Indicateur</th>
              <th>Valeur</th>
              <th>Variation</th>
            </tr>
          </thead>
          <tbody>${kpiRows}</tbody>
        </table>
      </div>

      <div class="print-section">
        <h2>Revenus par mois</h2>
        <table class="print-table">
          <thead>
            <tr>
              <th>Mois</th>
              <th>Revenu</th>
            </tr>
          </thead>
          <tbody>
            ${revenueRows}
            <tr class="print-total-row">
              <td><strong>Total</strong></td>
              <td class="print-value"><strong>${formatEurFR(totalRevenue)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="print-section print-two-col">
        <div>
          <h2>Repartition par espace</h2>
          <table class="print-table">
            <thead>
              <tr>
                <th>Espace</th>
                <th>Part</th>
              </tr>
            </thead>
            <tbody>${spaceRows}</tbody>
          </table>
        </div>
        <div>
          <h2>Top clients</h2>
          <table class="print-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Revenu</th>
              </tr>
            </thead>
            <tbody>${clientRows}</tbody>
          </table>
        </div>
      </div>

      <div class="print-section">
        <h2>Tendance reservations</h2>
        <table class="print-table">
          <thead>
            <tr>
              <th>Semaine</th>
              <th>Reservations</th>
            </tr>
          </thead>
          <tbody>
            ${bookingRows}
            <tr class="print-total-row">
              <td><strong>Total</strong></td>
              <td class="print-value"><strong>${totalBookings}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="print-section">
        <h2>Activite recente</h2>
        <table class="print-table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Description</th>
              <th>Montant</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>${activityRows}</tbody>
        </table>
      </div>

      <div class="print-footer">
        <p>Genere par Rooom OS le ${dateStr}</p>
      </div>
    </div>
  `;
}
