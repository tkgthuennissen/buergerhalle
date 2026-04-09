/**
 * controllers/document-controller.js
 * 
 * [SKELETON] - Sie können diese Seite nach dem Muster der anderen Controller erweitern
 */

class DocumentController {
  static init() {
    console.log('DocumentController initialisiert');
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
    // TODO: Implementieren Sie einen Document Viewer modal
    const doc = DocumentService.getById(docId);
    alert(`Dokument: ${doc.documentNumber}\n\nViewe-Funktion nicht implementiert.`);
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
}

document.addEventListener('DOMContentLoaded', () => {
  DocumentController.init();
});
