/**
 * [SKELETON] controllers/invoice-controller.js
 * 
 * Erweitern Sie diese Datei zur Verwaltung manueller Rechnungen
 * Nutzen Sie DocumentService.createManualInvoice() als Basis
 */

class InvoiceController {
  static invoiceItems = [];

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
    const title = 'Neue manuelle Rechnung';
    const content = `
      <form id="manual-invoice-form">
        <div class="form-group">
          <label for="invoice-address">Kunde *</label>
          <select id="invoice-address" required>
            <option value="">-- Kunde auswählen --</option>
          </select>
        </div>

        <div class="form-group">
          <label for="invoice-date">Rechnungsdatum *</label>
          <input type="date" id="invoice-date" value="${new Date().toISOString().split('T')[0]}" required>
        </div>

        <div class="form-group">
          <label for="invoice-payment-method">Zahlungsmethode *</label>
          <select id="invoice-payment-method" required>
            <option value="bank_transfer">Überweisung</option>
            <option value="cash">Bar</option>
          </select>
        </div>

        <hr style="margin: var(--spacing-lg) 0;">
        <h4>Artikel hinzufügen</h4>

        <div class="form-row">
          <div class="form-group">
            <label for="item-description">Beschreibung *</label>
            <input type="text" id="item-description" placeholder="Artikelbeschreibung" required>
          </div>
          <div class="form-group">
            <label for="item-quantity">Menge *</label>
            <input type="number" id="item-quantity" value="1" min="1" required>
          </div>
          <div class="form-group">
            <label for="item-price">Preis (EUR) *</label>
            <input type="number" id="item-price" step="0.01" min="0.01" required>
          </div>
          <div class="form-group" style="align-self: flex-end;">
            <button type="button" class="btn btn-secondary" onclick="InvoiceController.addItemToInvoice()">➕ Hinzufügen</button>
          </div>
        </div>

        <div id="invoice-items-list" style="margin-top: var(--spacing-md);">
          <p class="text-muted">Noch keine Artikel hinzugefügt.</p>
        </div>

        <div class="form-group">
          <label for="invoice-notes">Notizen</label>
          <textarea id="invoice-notes" placeholder="Optionale Notizen zur Rechnung"></textarea>
        </div>
      </form>
    `;

    this.invoiceItems = [];
    const self = this;
    App.openModal(title, content, [
      { label: 'Abbrechen', class: 'btn-secondary', callback: () => App.closeModal() },
      { label: 'Rechnung erstellen', class: 'btn-primary', callback: () => self.saveManualInvoice() }
    ]);
    this.populateInvoiceAddresses();
  }

  static populateInvoiceAddresses() {
    const select = document.getElementById('invoice-address');
    const addresses = AddressService.getAll();

    addresses.forEach(addr => {
      const option = document.createElement('option');
      option.value = addr.id;
      option.textContent = addr.name;
      select.appendChild(option);
    });
  }

  static addItemToInvoice() {
    const description = document.getElementById('item-description').value.trim();
    const quantity = parseInt(document.getElementById('item-quantity').value) || 1;
    const unitPrice = parseFloat(document.getElementById('item-price').value) || 0;

    if (!description || unitPrice <= 0) {
      App.showNotification('Beschreibung und Preis sind erforderlich', 'error');
      return;
    }

    this.invoiceItems.push({
      description,
      quantity,
      unitPrice,
      total: quantity * unitPrice
    });

    this.renderInvoiceItems();
    this.clearItemForm();
  }

  static renderInvoiceItems() {
    const container = document.getElementById('invoice-items-list');
    if (!container) return;

    if (this.invoiceItems.length === 0) {
      container.innerHTML = '<p class="text-muted">Noch keine Artikel hinzugefügt.</p>';
      return;
    }

    const total = this.invoiceItems.reduce((sum, item) => sum + item.total, 0);

    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Beschreibung</th>
            <th>Menge</th>
            <th>Preis</th>
            <th>Gesamt</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${this.invoiceItems.map((item, index) => `
            <tr>
              <td>${this.escapeHtml(item.description)}</td>
              <td>${item.quantity}</td>
              <td>${App.formatCurrency(item.unitPrice)}</td>
              <td>${App.formatCurrency(item.total)}</td>
              <td>
                <button class="icon-btn danger" onclick="InvoiceController.removeInvoiceItem(${index})">🗑️</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="text-align: right; font-weight: bold;">Gesamt:</td>
            <td style="font-weight: bold;">${App.formatCurrency(total)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    `;
  }

  static removeInvoiceItem(index) {
    this.invoiceItems.splice(index, 1);
    this.renderInvoiceItems();
  }

  static clearItemForm() {
    document.getElementById('item-description').value = '';
    document.getElementById('item-quantity').value = '1';
    document.getElementById('item-price').value = '';
  }

  static saveManualInvoice() {
    console.log('saveManualInvoice aufgerufen, invoiceItems:', this.invoiceItems);
    
    const addressId = document.getElementById('invoice-address')?.value;
    const documentDate = document.getElementById('invoice-date')?.value;
    const paymentMethod = document.getElementById('invoice-payment-method')?.value;
    const notes = document.getElementById('invoice-notes')?.value?.trim() || '';

    console.log('Formular-Daten:', { addressId, documentDate, paymentMethod, itemsCount: this.invoiceItems.length });

    if (!addressId || !documentDate || !paymentMethod || this.invoiceItems.length === 0) {
      App.showNotification('Alle erforderlichen Felder ausfüllen und mindestens einen Artikel hinzufügen', 'error');
      return;
    }

    try {
      const invoice = DocumentService.createManualInvoice(addressId, this.invoiceItems, paymentMethod);
      invoice.notes = notes;
      DocumentService.save(invoice);

      App.closeModal();
      this.invoiceItems = [];
      this.render();
      App.showNotification('Rechnung erstellt', 'success');
    } catch (error) {
      console.error('Fehler bei Rechnungserstellung:', error);
      App.showNotification('Fehler: ' + error.message, 'error');
    }
  }

  static editInvoice(invoiceId) {
    alert('TODO: Implementieren Sie die Bearbeitung');
  }

  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

document.addEventListener('DOMContentLoaded', () => InvoiceController.init());
