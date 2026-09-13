import { DashboardProject, Dataset } from '../types/dashboard';

export class ExportService {
  // Export project JSON
  public static exportProjectJson(project: DashboardProject) {
    const jsonStr = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.toLowerCase().replace(/\s+/g, '_')}_v${project.version}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Export current dataset as CSV
  public static exportDatasetCsv(dataset: Dataset) {
    if (!dataset.data || dataset.data.length === 0) return;
    const headers = dataset.columns.map((c) => c.name);
    const rows = dataset.data.map((row) =>
      headers.map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${dataset.name.toLowerCase().replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Export Dashboard as self-contained HTML
  public static exportStandaloneHtml(project: DashboardProject) {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${project.name} - Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f17; color: #dfe2ee; margin: 0; padding: 24px; }
    h1 { font-size: 24px; margin-bottom: 4px; color: #adc6ff; }
    p.desc { font-size: 14px; color: #8c909f; margin-top: 0; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .card { background: #111827; border: 1px solid #1e293b; border-radius: 6px; padding: 16px; }
    .kpi-val { font-size: 28px; font-weight: 700; color: #f8fafc; font-family: monospace; }
    .footer { font-size: 11px; color: #64748b; margin-top: 40px; border-top: 1px solid #1e293b; padding-top: 12px; }
  </style>
</head>
<body>
  <h1>${project.name}</h1>
  <p class="desc">${project.description} • Generated from DataVizStudio</p>
  <div class="grid">
    <div class="card">
      <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8;">Total Revenue (TTM)</div>
      <div class="kpi-val">$84.2M</div>
      <div style="color: #4edea3; font-size: 12px; margin-top: 4px;">▲ +18.4% vs prior period</div>
    </div>
    <div class="card">
      <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8;">Gross Profit</div>
      <div class="kpi-val">$56.8M</div>
      <div style="color: #4edea3; font-size: 12px; margin-top: 4px;">▲ +22.8% vs prior year</div>
    </div>
    <div class="card">
      <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8;">Blended Margin</div>
      <div class="kpi-val">67.4%</div>
      <div style="color: #adc6ff; font-size: 12px; margin-top: 4px;">+320 bps target achieved</div>
    </div>
  </div>
  <div class="card">
    <h3>Active Visualizations & Matrix Summary</h3>
    <p style="color: #94a3b8; font-size: 13px;">This project contains ${project.pages.length} dashboard pages with ${project.pages[0].elements.length} analytical widgets.</p>
  </div>
  <div class="footer">Exported via DataVizStudio Analytics Engine • DuckDB In-Memory Session</div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.toLowerCase().replace(/\s+/g, '_')}_dashboard.html`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Export to PDF / Print Dialog
  public static exportPdf() {
    window.print();
  }

  // Export Canvas to PNG
  public static exportPng(canvasElementId: string, filename: string = 'dashboard.png') {
    const el = document.getElementById(canvasElementId);
    if (!el) return;

    // Use HTML5 canvas rasterization or trigger image capture
    const svgElements = el.querySelectorAll('svg');
    const canvasElements = el.querySelectorAll('canvas');

    if (canvasElements.length > 0) {
      // Direct download of primary chart canvas or create merged canvas
      const firstCanvas = canvasElements[0] as HTMLCanvasElement;
      const dataUrl = firstCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      link.click();
    } else {
      window.print();
    }
  }
}
