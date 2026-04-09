/**
 * controllers/address-controller.js
 * 
 * Steuert die Adressverwaltungsseite
 */

class AddressController {
  static init() {
    console.log('AddressController initialisiert');
    this.setupEventListeners();
    this.render();
  }

  /**
   * Event-Listener für Seite
   */
  static setupEventListeners() {
    const btnNew = document.getElementById('btn-new-address');
    if (btnNew) {
      btnNew.addEventListener('click', () => this.openAddressForm());
    }
  }

  /**
   * Rendert die Adressliste
   */
  static render() {
    const listContainer = document.getElementById('address-list');
    if (!listContainer) return;

    const addresses = AddressService.getAll();

    if (addresses.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <h3>Keine Adressen vorhanden</h3>
          <p>Erstellen Sie eine neue Adresse, um zu beginnen.</p>
          <button class="btn btn-primary" onclick="AddressController.openAddressForm()">
            ➕ Erste Adresse erstellen
          </button>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Straße</th>
            <th>Ort</th>
            <th>Kontakt</th>
            <th>Typ</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          ${addresses.map(addr => `
            <tr>
              <td><strong>${this.escapeHtml(addr.name)}</strong></td>
              <td>${this.escapeHtml(addr.street)}</td>
              <td>${this.escapeHtml(addr.zipCode)} ${this.escapeHtml(addr.city)}</td>
              <td>
                ${addr.email ? `<a href="mailto:${addr.email}">${addr.email}</a>` : '—'}
              </td>
              <td>
                <span class="badge badge-secondary">
                  ${addr.type === 'person' ? 'Person' : addr.type === 'association' ? 'Verein' : 'Unternehmen'}
                </span>
              </td>
              <td>
                <div class="table-row-actions">
                  <button class="icon-btn" onclick="AddressController.openAddressForm('${addr.id}')" title="Bearbeiten">✏️</button>
                  <button class="icon-btn danger" onclick="AddressController.deleteAddress('${addr.id}')" title="Löschen">🗑️</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  /**
   * Öffnet Formular zum Erstellen/Bearbeiten einer Adresse
   * @param {string} addressId - Optional: ID einer existierenden Adresse
   */
  static openAddressForm(addressId = null) {
    const isEdit = !!addressId;
    const address = isEdit ? AddressService.getById(addressId) : null;

    const title = isEdit ? 'Adresse bearbeiten' : 'Neue Adresse';

    const content = `
      <form id="address-form">
        <div class="form-row">
          <div class="form-group">
            <label for="addr-type">Typ *</label>
            <select id="addr-type" required>
              <option value="person" ${address?.type === 'person' ? 'selected' : ''}>Person</option>
              <option value="association" ${address?.type === 'association' ? 'selected' : ''}>Verein</option>
              <option value="company" ${address?.type === 'company' ? 'selected' : ''}>Unternehmen</option>
            </select>
          </div>

          <div class="form-group">
            <label for="addr-name">Name / Ansprechpartner *</label>
            <input type="text" id="addr-name" value="${address?.name || ''}" required>
          </div>
        </div>

        <div class="form-group">
          <label for="addr-street">Straße *</label>
          <input type="text" id="addr-street" value="${address?.street || ''}" required>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="addr-zip">Postleitzahl *</label>
            <input type="text" id="addr-zip" value="${address?.zipCode || ''}" required>
          </div>

          <div class="form-group">
            <label for="addr-city">Stadt *</label>
            <input type="text" id="addr-city" value="${address?.city || ''}" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="addr-phone">Telefon</label>
            <input type="tel" id="addr-phone" value="${address?.phone || ''}">
          </div>

          <div class="form-group">
            <label for="addr-email">E-Mail</label>
            <input type="email" id="addr-email" value="${address?.email || ''}">
          </div>
        </div>

        <div class="form-group">
          <label for="addr-notes">Notizen</label>
          <textarea id="addr-notes">${address?.notes || ''}</textarea>
        </div>
      </form>
    `;

    const buttons = [
      {
        label: 'Abbrechen',
        action: 'cancel',
        class: 'btn-outline'
      },
      {
        label: isEdit ? '💾 Speichern' : '➕ Erstellen',
        action: 'save',
        class: 'btn-primary',
        callback: () => this.saveAddress(addressId)
      }
    ];

    App.openModal(title, content, buttons);

    // Form-Validierung
    document.getElementById('address-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveAddress(addressId);
    });
  }

  /**
   * Speichert eine Adresse
   * @param {string} addressId - Optional: ID beim Edit
   */
  static saveAddress(addressId) {
    const form = document.getElementById('address-form');
    if (!form) return;

    const formData = {
      type: document.getElementById('addr-type').value,
      name: document.getElementById('addr-name').value.trim(),
      street: document.getElementById('addr-street').value.trim(),
      zipCode: document.getElementById('addr-zip').value.trim(),
      city: document.getElementById('addr-city').value.trim(),
      phone: document.getElementById('addr-phone').value.trim(),
      email: document.getElementById('addr-email').value.trim(),
      notes: document.getElementById('addr-notes').value.trim()
    };

    // Validierung
    let address;
    if (addressId) {
      address = AddressService.getById(addressId);
      Object.assign(address, formData);
    } else {
      address = AddressService.create(formData);
    }

    const validation = AddressService.validate(address);
    if (!validation.valid) {
      App.showNotification(validation.errors.join('; '), 'error');
      return;
    }

    // Speichern
    try {
      AddressService.save(address);
      App.showNotification(
        addressId ? 'Adresse aktualisiert' : 'Adresse erstellt',
        'success'
      );
      this.render();
    } catch (error) {
      App.showNotification('Fehler: ' + error.message, 'error');
    }
  }

  /**
   * Löscht eine Adresse
   * @param {string} addressId
   */
  static deleteAddress(addressId) {
    const address = AddressService.getById(addressId);
    if (!address) return;

    if (!confirm(`Soll die Adresse "${address.name}" wirklich gelöscht werden?`)) {
      return;
    }

    try {
      AddressService.delete(addressId);
      App.showNotification('Adresse gelöscht', 'success');
      this.render();
    } catch (error) {
      App.showNotification('Fehler: ' + error.message, 'error');
    }
  }

  /**
   * Einfache HTML-Escaping
   */
  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialisiere beim DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  AddressController.init();
});
