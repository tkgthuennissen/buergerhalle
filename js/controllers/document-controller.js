/**
 * controllers/document-controller.js
 * 
 * [SKELETON] - Sie können diese Seite nach dem Muster der anderen Controller erweitern
 */

class DocumentController {

  static init() {
    this.render();
  }

  static render() {
    this.renderContracts();
    this.renderInvoices();
  }

  static renderContracts() {
    const container = document.getElementById('contracts-list');
    if (!container) return;

    const contracts = DocumentService.getContracts();

    if (contracts.length === 0) {
      container.innerHTML = '<p class="text-muted">Keine Verträge vorhanden.</p>';
      return;
    }

    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Nummer</th>
            <th>Kunde</th>
            <th>Datum</th>
            <th>Summe</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${contracts.map(doc => {
            const addr = AddressService.getById(doc.addressId);
            return `
              <tr>
                <td><strong>${doc.documentNumber}</strong></td>
                <td>${addr?.name || '—'}</td>
                <td>${App.formatDate(doc.documentDate)}</td>
                <td>${App.formatCurrency(doc.total)}</td>
                <td><span class="badge badge-${doc.status}">${doc.status}</span></td>
                <td>
                  <button class="icon-btn" onclick="DocumentController.viewDocument('${doc.id}')" title="Anzeigen">👁️</button>
                  <button class="icon-btn danger" onclick="DocumentController.deleteDocument('${doc.id}')" title="Löschen">🗑️</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  static renderInvoices() {
    const container = document.getElementById('invoices-list');
    if (!container) return;

    const invoices = DocumentService.getInvoices();

    if (invoices.length === 0) {
      container.innerHTML = '<p class="text-muted">Keine Rechnungen vorhanden.</p>';
      return;
    }

    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Nummer</th>
            <th>Kunde</th>
            <th>Datum</th>
            <th>Summe</th>
            <th>Zahlung</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${invoices.map(doc => {
            const addr = AddressService.getById(doc.addressId);
            return `
              <tr>
                <td><strong>${doc.documentNumber}</strong></td>
                <td>${addr?.name || '—'}</td>
                <td>${App.formatDate(doc.documentDate)}</td>
                <td>${App.formatCurrency(doc.total)}</td>
                <td><small>${doc.paymentMethod === 'cash' ? '💵 Bar' : '🏦 Überweisung'}</small></td>
                <td><span class="badge badge-${doc.status}">${doc.status}</span></td>
                <td>
                  <button class="icon-btn" onclick="DocumentController.viewDocument('${doc.id}')" title="Anzeigen">👁️</button>
                  <button class="icon-btn danger" onclick="DocumentController.deleteDocument('${doc.id}')" title="Löschen">🗑️</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  static viewDocument(docId) {
    const doc = DocumentService.getById(docId);
    if (!doc) {
      App.showNotification('Dokument nicht gefunden', 'error');
      return;
    }

    const addr = AddressService.getById(doc.addressId);
    const isInvoice = doc.type === 'invoice';
    const title = isInvoice ? `Rechnung ${doc.documentNumber}` : `Vertrag ${doc.documentNumber}`;

    const templateData = PdfExportService.prepareDocumentData(doc);
    const templateId = doc.templateId || (doc.type === 'contract' ? 'tmpl_contract_1' : 'tmpl_invoice_1');
    const renderedTemplate = TemplateService.render(templateId, templateData) || { header: '', body: '', footer: '' };
    const templateHeaderHtml = renderedTemplate.header ? `<div class="document-template-section document-template-header">${renderedTemplate.header.replace(/\n/g, '<br>')}</div>` : '';
    const templateBodyHtml = renderedTemplate.body ? `<div class="document-template-section document-template-body">${renderedTemplate.body.replace(/\n/g, '<br>')}</div>` : '';
    const templateFooterHtml = renderedTemplate.footer ? `<div class="document-template-section document-template-footer">${renderedTemplate.footer.replace(/\n/g, '<br>')}</div>` : '';

    const itemsHtml = doc.items.map(item => `
      <tr>
        <td>${item.description}</td>
        <td class="text-center">${item.quantity}</td>
        <td class="text-right">${App.formatCurrency(item.unitPrice)}</td>
        <td class="text-right">${App.formatCurrency(item.total)}</td>
      </tr>
    `).join('');

    const paymentInfo = isInvoice ? `
      <div class="row">
        <div class="col-6">
          <strong>Zahlungsmethode:</strong><br>
          ${doc.paymentMethod === 'cash' ? '💵 Barzahlung' : '🏦 Banküberweisung'}
        </div>
        <div class="col-6">
          <strong>Status:</strong><br>
          <span class="badge badge-${doc.status}">${doc.status}</span>
        </div>
      </div>
    ` : `
      <div class="row">
        <div class="col-12">
          <strong>Status:</strong><br>
          <span class="badge badge-${doc.status}">${doc.status}</span>
        </div>
      </div>
    `;

    const eventDateInfo = doc.eventDate ? `
      <div class="row">
        <div class="col-12">
          <strong>Veranstaltungsdatum:</strong> ${App.formatDate(doc.eventDate)}
        </div>
      </div>
    ` : '';

    const notesInfo = doc.notes ? `
      <div class="row">
        <div class="col-12">
          <strong>Notizen:</strong><br>
          <p class="text-muted">${doc.notes}</p>
        </div>
      </div>
    ` : '';

    const modalContent = `
      <div class="document-view">
        <div class="document-header">
          <h2>${title}</h2>
          <div class="document-meta">
            <div class="row">
              <div class="col-6">
                <strong>Datum:</strong> ${App.formatDate(doc.documentDate)}
              </div>
              <div class="col-6">
                <strong>Kunde:</strong> ${addr?.name || '—'}
              </div>
            </div>
            ${addr?.address ? `
              <div class="row">
                <div class="col-12">
                  <strong>Adresse:</strong><br>
                  ${addr.address}<br>
                  ${addr.zip} ${addr.city}
                </div>
              </div>
            ` : ''}
            ${eventDateInfo}
          </div>
        </div>

        <div class="document-template-content">
          ${templateHeaderHtml}
          ${templateBodyHtml}
        </div>

        <div class="document-items">
          <h3>Positionen</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>Beschreibung</th>
                <th class="text-center">Menge</th>
                <th class="text-right">Einzelpreis</th>
                <th class="text-right">Gesamt</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        ${templateFooterHtml}

        <div class="document-summary">
          <div class="row">
            <div class="col-6">
              <strong>Zwischensumme:</strong>
            </div>
            <div class="col-6 text-right">
              ${App.formatCurrency(doc.subtotal)}
            </div>
          </div>
          ${doc.tax > 0 ? `
            <div class="row">
              <div class="col-6">
                <strong>MwSt.:</strong>
              </div>
              <div class="col-6 text-right">
                ${App.formatCurrency(doc.tax)}
              </div>
            </div>
          ` : ''}
          <div class="row">
            <div class="col-6">
              <strong>Gesamt:</strong>
            </div>
            <div class="col-6 text-right">
              <strong>${App.formatCurrency(doc.total)}</strong>
            </div>
          </div>
        </div>

        ${paymentInfo}
        ${notesInfo}
      </div>
    `;

    App.openModal(title, modalContent, [
      { label: 'Schließen', action: 'close' }
    ]);
  }

  static deleteDocument(docId) {
    const doc = DocumentService.getById(docId);
    if (!confirm(`Soll ${doc.documentNumber} gelöscht werden?`)) return;

    try {
      DocumentService.delete(docId);
      App.showNotification('Dokument gelöscht', 'success');
      this.render();
    } catch (error) {
      App.showNotification('Fehler: ' + error.message, 'error');
    }
  }

  static getWorkflowButtons(doc) {
    const workflow = WorkflowService.getByDocumentId(doc.id);
    if (!workflow) return '';

    const currentState = workflow.currentState;
    const nextStates = workflow.states[currentState]?.next || [];

    return nextStates.map(status => `
      <button class="icon-btn" onclick="DocumentController.changeWorkflowStatus('${doc.id}', '${status}')" title="→ ${this.translateStatus(status)}">
        ${this.getStatusIcon(status)}
      </button>
    `).join('');
  }

  static translateStatus(status) {
    const translations = {
      draft: 'Entwurf',
      confirmed: 'Bestätigt',
      signed: 'Unterschrieben',
      paid: 'Bezahlt',
      completed: 'Abgeschlossen',
      created: 'Erstellt'
    };
    return translations[status] || status;
  }

  static getStatusIcon(status) {
    const icons = {
      confirmed: '✅',
      signed: '✍️',
      paid: '💰',
      completed: '🏁'
    };
    return icons[status] || '➡️';
  }

  static changeWorkflowStatus(docId, newStatus) {
    try {
      WorkflowService.changeStatus(docId, newStatus);
      App.showNotification('Status erfolgreich geändert', 'success');
      this.render();
    } catch (error) {
      App.showNotification('Fehler: ' + error.message, 'error');
    }
  }

  static exportPDF(docId) {
    PdfExportService.exportDocument(docId).then(() => {
      App.showNotification('PDF erfolgreich exportiert', 'success');
    }).catch(error => {
      App.showNotification('PDF-Export fehlgeschlagen: ' + error.message, 'error');
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  DocumentController.init();
});
