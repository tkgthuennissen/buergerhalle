/**
 * [SKELETON] controllers/invoice-controller.js
 * 
 * Erweitern Sie diese Datei zur Verwaltung manueller Rechnungen
 * Nutzen Sie DocumentService.createManualInvoice() als Basis
 */

class InvoiceController {
  static init() {
    const btn = document.getElementById('btn-new-invoice');
    if (btn) btn.addEventListener('click', () => this.openNewInvoiceForm());
    this.render();
  }

  static render() {
    const container = document.getElementById('invoices-list');
    if (!container) return;

    // Nur manuelle Rechnungen (ohne bookingId)
    const manualInvoices = DocumentService.getInvoices()
      .filter(doc => !doc.bookingId);

    if (manualInvoices.length === 0) {
      container.innerHTML = '<p class="text-muted">Noch keine manuellen Rechnungen.</p>';
      return;
    }

    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Nummer</th>
            <th>Kunde</th>
            <th>Summe</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${manualInvoices.map(inv => {
            const addr = AddressService.getById(inv.addressId);
            return `<tr>
              <td>${inv.documentNumber}</td>
              <td>${addr?.name || '—'}</td>
              <td>${App.formatCurrency(inv.total)}</td>
              <td><span class="badge badge-${inv.status}">${inv.status}</span></td>
              <td>
                <button class="icon-btn" onclick="InvoiceController.editInvoice('${inv.id}')">✏️</button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  static openNewInvoiceForm() {
    alert('TODO: Implementieren Sie das Formular für manuelle Rechnungen');
  }

  static editInvoice(invoiceId) {
    alert('TODO: Implementieren Sie die Bearbeitung');
  }
}

document.addEventListener('DOMContentLoaded', () => InvoiceController.init());
