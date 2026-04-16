/**
 * report.js - Berichts-Service
 *
 * Verwaltet Berichte und Sammel-Exporte.
 */

class ReportService {
  /**
   * Generiert Kassenbuch-Bericht für einen Zeitraum
   * @param {string} startDate - Startdatum (YYYY-MM-DD)
   * @param {string} endDate - Enddatum (YYYY-MM-DD)
   * @return {Object} Berichtsdaten
   */
  static generateCashbookReport(startDate, endDate) {
    const entries = storage.getCashbook().filter(entry => {
      return entry.date >= startDate && entry.date <= endDate;
    });

    const income = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
    const expense = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
    const balance = income - expense;

    return {
      period: { startDate, endDate },
      entries: entries,
      summary: { income, expense, balance },
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Generiert Rechnungs-Bericht für einen Zeitraum
   * @param {string} startDate - Startdatum (YYYY-MM-DD)
   * @param {string} endDate - Enddatum (YYYY-MM-DD)
   * @return {Object} Berichtsdaten
   */
  static generateInvoiceReport(startDate, endDate) {
    const documents = storage.getDocuments().filter(doc => {
      return doc.type === 'invoice' &&
             doc.documentDate >= startDate &&
             doc.documentDate <= endDate;
    });

    const totalAmount = documents.reduce((sum, doc) => sum + doc.total, 0);
    const paidAmount = documents.filter(doc => doc.status === 'paid' || doc.status === 'completed')
                               .reduce((sum, doc) => sum + doc.total, 0);

    return {
      period: { startDate, endDate },
      documents: documents,
      summary: {
        count: documents.length,
        totalAmount,
        paidAmount,
        outstandingAmount: totalAmount - paidAmount
      },
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Generiert Vertrags-Bericht für einen Zeitraum
   * @param {string} startDate - Startdatum (YYYY-MM-DD)
   * @param {string} endDate - Enddatum (YYYY-MM-DD)
   * @return {Object} Berichtsdaten
   */
  static generateContractReport(startDate, endDate) {
    const documents = storage.getDocuments().filter(doc => {
      return doc.type === 'contract' &&
             doc.documentDate >= startDate &&
             doc.documentDate <= endDate;
    });

    const byStatus = documents.reduce((acc, doc) => {
      acc[doc.status] = (acc[doc.status] || 0) + 1;
      return acc;
    }, {});

    return {
      period: { startDate, endDate },
      documents: documents,
      summary: {
        count: documents.length,
        byStatus
      },
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Generiert Jahresübersicht
   * @param {number} year - Jahr
   * @return {Object} Jahresdaten
   */
  static generateYearlyReport(year) {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    return {
      year,
      cashbook: this.generateCashbookReport(startDate, endDate),
      invoices: this.generateInvoiceReport(startDate, endDate),
      contracts: this.generateContractReport(startDate, endDate),
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Exportiert Daten als JSON
   * @param {Object} data - Zu exportierende Daten
   * @param {string} filename - Dateiname
   */
  static exportAsJSON(data, filename) {
    const jsonString = JSON.stringify(data, null, 2);
    this.downloadFile(jsonString, filename + '.json', 'application/json');
  }

  /**
   * Hilfsfunktion: Datei herunterladen
   * @param {string} content - Dateiinhalt
   * @param {string} filename - Dateiname
   * @param {string} mimeType - MIME-Typ
   */
  static downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Sammel-Export von Dokumenten
   * @param {string} type - 'invoice' oder 'contract'
   * @param {string} startDate - Startdatum
   * @param {string} endDate - Enddatum
   */
  static exportDocuments(type, startDate, endDate) {
    const documents = storage.getDocuments().filter(doc => {
      return doc.type === type &&
             doc.documentDate >= startDate &&
             doc.documentDate <= endDate;
    });

    const exportData = {
      type,
      period: { startDate, endDate },
      documents,
      exportedAt: new Date().toISOString()
    };

    const filename = `${type}s_${startDate}_to_${endDate}`;
    this.exportAsJSON(exportData, filename);
  }

  /**
   * Exportiert Kassenbuch als CSV
   * @param {string} startDate - Startdatum
   * @param {string} endDate - Enddatum
   */
  static exportCashbookAsCSV(startDate, endDate) {
    const report = this.generateCashbookReport(startDate, endDate);
    let csv = 'Datum;Typ;Betrag;Beschreibung\n';

    report.entries.forEach(entry => {
      csv += `${entry.date};${entry.type};${entry.amount.toFixed(2)};${entry.description}\n`;
    });

    csv += `\n;Summe Einnahmen;${report.summary.income.toFixed(2)}\n`;
    csv += `;Summe Ausgaben;${report.summary.expense.toFixed(2)}\n`;
    csv += `;Saldo;${report.summary.balance.toFixed(2)}\n`;

    this.downloadFile(csv, `kassenbuch_${startDate}_to_${endDate}.csv`, 'text/csv');
  }
}