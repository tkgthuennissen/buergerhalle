/**
 * pdf-export.js - PDF-Export-Service
 *
 * Exportiert Dokumente als PDF. Verwendet html2pdf.js für Offline-Fähigkeit.
 * Hinweis: html2pdf.js muss als lokale Datei eingebunden werden.
 */

class PdfExportService {
  /**
   * Initialisiert den PDF-Export (lädt html2pdf.js)
   */
  static init() {
    // html2pdf.js sollte als <script src="js/html2pdf.js"></script> eingebunden sein
    // Prüfe ob html2pdf verfügbar ist oder wird es bei der ersten Benutzung geprüft
    this.available = true; // Optimistic: assume it will be loaded
    if (typeof html2pdf === 'undefined') {
      console.warn('html2pdf.js wird noch geladen oder ist nicht verfügbar.');
    }
  }

  /**
   * Exportiert ein Dokument als PDF
   * @param {string} documentId - Dokument-ID
   * @return {Promise} Promise der bei Erfolg die PDF-Datei herunterlädt
   */
  static async exportDocument(documentId) {
    // Prüfe ob html2pdf verfügbar ist
    if (typeof html2pdf === 'undefined') {
      throw new Error('PDF-Export nicht verfügbar: html2pdf Bibliothek nicht geladen');
    }

    const document = storage.getDocumentById(documentId);
    if (!document) {
      throw new Error('Dokument nicht gefunden');
    }

    // HTML für PDF generieren
    const html = this.generateDocumentHTML(document);

    // PDF-Optionen
    const options = {
      margin: [20, 20, 20, 20], // Top, Right, Bottom, Left in mm
      filename: `${document.documentNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // PDF generieren und herunterladen
    const element = this.createTempElement(html);
    try {
      await html2pdf().set(options).from(element).save();
    } catch (error) {
      console.error('Fehler beim PDF-Export:', error);
      throw error;
    } finally {
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }
  }

  /**
   * Exportiert mehrere Dokumente als Sammel-PDF
   * @param {Array} documentIds - Array von Dokument-IDs
   * @param {string} filename - Dateiname
   */
  static async exportMultipleDocuments(documentIds, filename) {
    if (typeof html2pdf === 'undefined') {
      throw new Error('PDF-Export nicht verfügbar: html2pdf Bibliothek nicht geladen');
    }

    let combinedHTML = '<div style="page-break-after: always;">';

    for (const documentId of documentIds) {
      const document = storage.getDocumentById(documentId);
      if (document) {
        combinedHTML += this.generateDocumentHTML(document);
        combinedHTML += '</div><div style="page-break-after: always;">';
      }
    }
    combinedHTML += '</div>';

    const options = {
      margin: [20, 20, 20, 20],
      filename: filename + '.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const element = this.createTempElement(combinedHTML);
    try {
      await html2pdf().set(options).from(element).save();
    } finally {
      document.body.removeChild(element);
    }
  }

  /**
   * Generiert HTML für ein Dokument
   * @param {Object} document - Dokument-Objekt
   * @return {string} HTML-String
   */
  static generateDocumentHTML(document) {
    // Template laden und rendern
    let rendered = null;
    
    if (typeof TemplateService !== 'undefined' && TemplateService.render) {
      try {
        const templateId = document.templateId || (TemplateService.getDefaultTemplateId ? TemplateService.getDefaultTemplateId(document.type) : (document.type === 'contract' ? 'tmpl_contract_1' : 'tmpl_invoice_1'));
        rendered = TemplateService.render(templateId, this.prepareDocumentData(document));
      } catch (e) {
        console.warn('Fehler beim Rendern des Templates:', e);
      }
    }
    
    // Fallback wenn Template nicht rendert
    if (!rendered) {
      rendered = { header: '', body: '', footer: '' };
    }

    return `
      <div style="font-family: Arial, sans-serif; max-width: 210mm; min-height: 297mm; margin: 0 auto; padding: 20mm; box-sizing: border-box; background: white; color: #111;">
        <style>
          @page { size: A4; margin: 20mm; }
          body { margin: 0; }
          .pdf-header { margin-bottom: 20mm; white-space: pre-line; font-size: 12pt; line-height: 1.5; }
          .pdf-body { margin-bottom: 20mm; white-space: pre-line; font-size: 11pt; line-height: 1.6; }
          .pdf-footer { margin-top: 20mm; white-space: pre-line; font-size: 11pt; line-height: 1.6; }
          .pdf-meta { margin-bottom: 10mm; font-size: 10pt; }
          .pdf-meta div { margin-bottom: 0.4rem; }
        </style>
        <div class="pdf-header">${rendered.header}</div>
        <div class="pdf-meta">
          <div><strong>Kunde:</strong> ${templateData.Adresse.Name || '—'}</div>
          <div><strong>Datum:</strong> ${templateData.Dokument.Datum || '—'}</div>
          <div><strong>Veranstaltungsdatum:</strong> ${templateData.Buchung.Datum || '—'}</div>
        </div>
        <div class="pdf-body">${rendered.body}</div>
        <div class="pdf-footer">${rendered.footer}</div>
        <div style="margin-top: 15mm; font-size: 10pt; color: #666;">
          Status: ${document.status} | Erzeugt am: ${new Date().toLocaleString('de-DE')}
        </div>
      </div>
    `;
  }

  /**
   * Bereitet Daten für Template-Rendering vor
   * @param {Object} document - Dokument
   * @return {Object} Datenobjekt
   */
  static prepareDocumentData(document) {
    const address = storage.getAddressById(document.addressId);
    const booking = storage.getBookingById(document.bookingId);
    const article = booking ? storage.getArticleById(booking.packageId) : null;

    return {
      Dokument: {
        Nummer: document.documentNumber,
        Datum: document.documentDate,
        Total: document.total,
        Subtotal: document.subtotal,
        Steuer: document.tax,
        Positionen: this.formatItems(document.items)
      },
      Adresse: address ? {
        Name: address.name,
        Strasse: address.street,
        PLZ: address.zipCode,
        Stadt: address.city,
        Telefon: address.phone,
        Email: address.email
      } : {},
      Buchung: booking ? {
        Zeitraum: {
          beginDateTime: booking.beginDateTime,
          endDateTime: booking.endDateTime
        },
        Datum: booking.eventDate
      } : {},
      Artikel: article ? {
        Name: article.name,
        Preis: article.unitPrice
      } : {}
    };
  }

  /**
   * Formatiert Rechnungspositionen für Template
   * @param {Array} items - Positionen
   * @return {string} Formatierter Text
   */
  static formatItems(items) {
    return items.map(item =>
      `${item.description}: ${item.quantity}x ${item.unitPrice.toFixed(2)} € = ${(item.quantity * item.unitPrice).toFixed(2)} €`
    ).join('\n');
  }

  /**
   * Erstellt temporäres DOM-Element für PDF-Generierung
   * @param {string} html - HTML-String
   * @return {HTMLElement} DOM-Element
   */
  static createTempElement(html) {
    const element = document.createElement('div');
    element.innerHTML = html;
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.top = '-9999px';
    element.style.width = '210mm';
    element.style.height = 'auto';
    if (document.body) {
      document.body.appendChild(element);
    } else {
      console.warn('document.body not available, appending to documentElement');
      document.documentElement.appendChild(element);
    }
    return element;
  }

  /**
   * Exportiert Kassenbuch als PDF
   * @param {string} startDate - Startdatum
   * @param {string} endDate - Enddatum
   */
  static async exportCashbookReport(startDate, endDate) {
    const report = ReportService.generateCashbookReport(startDate, endDate);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 210mm; margin: 0 auto; padding: 20mm;">
        <h1>Kassenbuch ${startDate} - ${endDate}</h1>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f0f0f0;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Datum</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Typ</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Betrag</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Beschreibung</th>
            </tr>
          </thead>
          <tbody>
            ${report.entries.map(entry => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${entry.date}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${entry.type === 'income' ? 'Einnahme' : 'Ausgabe'}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${entry.amount.toFixed(2)} €</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${entry.description}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 20px;">
          <p><strong>Einnahmen:</strong> ${report.summary.income.toFixed(2)} €</p>
          <p><strong>Ausgaben:</strong> ${report.summary.expense.toFixed(2)} €</p>
          <p><strong>Saldo:</strong> ${report.summary.balance.toFixed(2)} €</p>
        </div>
      </div>
    `;

    const options = {
      margin: [20, 20, 20, 20],
      filename: `kassenbuch_${startDate}_to_${endDate}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const element = this.createTempElement(html);
    try {
      await html2pdf().set(options).from(element).save();
    } finally {
      document.body.removeChild(element);
    }
  }
}

// Initialisierung beim Laden
PdfExportService.init();