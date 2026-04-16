/**
 * report-controller.js - Report-Controller
 *
 * Verwaltet die Berichte-Seite.
 */

class ReportController {
  static init() {
    this.bindEvents();
  }

  static bindEvents() {
    // Kassenbuch-Export
    document.getElementById('export-cashbook-btn')?.addEventListener('click', () => {
      const startDate = document.getElementById('cashbook-start').value;
      const endDate = document.getElementById('cashbook-end').value;
      if (startDate && endDate) {
        ReportService.exportCashbookAsCSV(startDate, endDate);
      } else {
        alert('Bitte Start- und Enddatum auswählen');
      }
    });

    // Kassenbuch-PDF
    document.getElementById('export-cashbook-pdf-btn')?.addEventListener('click', () => {
      const startDate = document.getElementById('cashbook-start').value;
      const endDate = document.getElementById('cashbook-end').value;
      if (startDate && endDate) {
        PdfExportService.exportCashbookReport(startDate, endDate);
      } else {
        alert('Bitte Start- und Enddatum auswählen');
      }
    });

    // Rechnungen exportieren
    document.getElementById('export-invoices-btn')?.addEventListener('click', () => {
      const startDate = document.getElementById('invoices-start').value;
      const endDate = document.getElementById('invoices-end').value;
      if (startDate && endDate) {
        ReportService.exportDocuments('invoice', startDate, endDate);
      } else {
        alert('Bitte Start- und Enddatum auswählen');
      }
    });

    // Verträge exportieren
    document.getElementById('export-contracts-btn')?.addEventListener('click', () => {
      const startDate = document.getElementById('contracts-start').value;
      const endDate = document.getElementById('contracts-end').value;
      if (startDate && endDate) {
        ReportService.exportDocuments('contract', startDate, endDate);
      } else {
        alert('Bitte Start- und Enddatum auswählen');
      }
    });

    // Jahresbericht
    document.getElementById('generate-yearly-btn')?.addEventListener('click', () => {
      const year = document.getElementById('yearly-year').value;
      if (year) {
        const report = ReportService.generateYearlyReport(parseInt(year));
        ReportService.exportAsJSON(report, `jahresbericht_${year}`);
      } else {
        alert('Bitte Jahr auswählen');
      }
    });

    // Daten sichern
    document.getElementById('backup-btn')?.addEventListener('click', () => {
      const data = storage.exportAsJSON();
      ReportService.downloadFile(data, `backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    });

    // Daten wiederherstellen
    document.getElementById('restore-btn')?.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              storage.importFromJSON(e.target.result);
              alert('Daten erfolgreich wiederhergestellt. Seite wird neu geladen.');
              location.reload();
            } catch (error) {
              alert('Fehler beim Wiederherstellen: ' + error.message);
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    });
  }
}

// Initialisierung beim Laden der Seite
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.reports-section')) {
    ReportController.init();
  }
});