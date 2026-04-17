/**
 * controllers/booking-list-controller.js
 * 
 * Steuert die Buchungsübersicht (Seite)
 */

class BookingListController {
  static init() {
    console.log('BookingListController initialisiert');
    this.render();
  }

  static render() {
    const list = document.getElementById('bookings-list');
    if (!list) return;

    const bookings = BookingService.getActive();
    
    document.getElementById('booking-count').textContent = `${bookings.length} Einträge`;

    if (bookings.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <h3>Keine Buchungen</h3>
          <p>Erstellen Sie eine neue Buchung oder nutzen Sie den Buchungskalender.</p>
          <a href="/buergerhalle/pages/booking-form.html" class="btn btn-primary">➕ Erste Buchung erstellen</a>
        </div>
      `;
      return;
    }

    // Gruppiere Buchungen nach Ereignisdatum
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const current = [];
    const completed = [];

    bookings.forEach(booking => {
      const eventDate = new Date(booking.eventDate);
      
      if (eventDate >= today) {
        current.push(booking);
      } else {
        completed.push(booking);
      }
    });

    // Sortiere nach Ereignisdatum
    const sortByDate = (a, b) => new Date(b.eventDate) - new Date(a.eventDate);
    current.sort(sortByDate);
    completed.sort(sortByDate);

    // Render accordion sections
    list.innerHTML = `
      <div class="accordion-container">
        ${this.renderBookingSection('current-bookings', 'Aktuell', current, true)}
        ${this.renderBookingSection('completed-bookings', 'Abgeschlossen', completed, false)}
      </div>
    `;

    // Add event listeners for accordion
    this.setupAccordion();
  }

  static renderBookingSection(id, title, bookings, expanded = true) {
    if (bookings.length === 0) {
      return '';
    }

    const expandedClass = expanded ? 'expanded' : '';
    const displayStyle = expanded ? 'block' : 'none';

    const sortedBookings = [...bookings].sort((a, b) => 
      new Date(a.beginDateTime) - new Date(b.beginDateTime)
    );

    return `
      <div class="accordion-section">
        <div class="accordion-header ${expandedClass}" onclick="BookingListController.toggleAccordion(this)">
          <span class="accordion-toggle">▶</span>
          <h3>${title} (${bookings.length})</h3>
        </div>
        <div class="accordion-content" style="display: ${displayStyle}">
          <table class="data-table">
            <thead>
              <tr>
                <th>Veranstalter</th>
                <th>Ereignisdatum</th>
                <th>Paket</th>
                <th>Von – Bis</th>
                <th>Summe</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${sortedBookings.map(booking => {
                const address = AddressService.getById(booking.addressId);
                const pkg = ArticleService.getById(booking.packageId);
                const total = BookingService.calculateTotal(booking);
                
                return `
                  <tr>
                    <td>${this.escapeHtml(address?.name || '—')}</td>
                    <td>${App.formatDate(booking.eventDate)}</td>
                    <td><small>${this.escapeHtml(pkg?.name || '—')}</small></td>
                    <td>
                      <small class="text-muted">
                        ${App.formatDate(booking.beginDateTime, true)}<br>
                        ${App.formatDate(booking.endDateTime, true)}
                      </small>
                    </td>
                    <td class="text-right"><strong>${App.formatCurrency(total)}</strong></td>
                    <td>
                      <span class="badge badge-${booking.status === 'confirmed' ? 'success' : booking.status === 'planned' ? 'warning' : 'danger'}">
                        ${booking.status === 'confirmed' ? 'Bestätigt' : booking.status === 'planned' ? 'Geplant' : 'Storniert'}
                      </span>
                    </td>
                    <td>
                      <div class="table-row-actions">
                        <button class="icon-btn" onclick="BookingListController.createContract('${booking.id}')" title="Vertrag erstellen">📄</button>
                        <button class="icon-btn" onclick="BookingListController.createInvoice('${booking.id}')" title="Rechnung erstellen">💰</button>
                        <button class="icon-btn" onclick="window.location.href='/buergerhalle/pages/booking-form.html?id=${booking.id}'" title="Bearbeiten">✏️</button>
                        <button class="icon-btn danger" onclick="BookingListController.deleteBooking('${booking.id}')" title="Löschen">🗑️</button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  static toggleAccordion(headerElement) {
    const content = headerElement.nextElementSibling;
    const isExpanded = headerElement.classList.contains('expanded');
    
    if (isExpanded) {
      headerElement.classList.remove('expanded');
      content.style.display = 'none';
    } else {
      headerElement.classList.add('expanded');
      content.style.display = 'block';
    }
  }

  static setupAccordion() {
    // Event listeners are set up via onclick attributes
    // No additional setup needed
  }

  static deleteBooking(bookingId) {
    const booking = BookingService.getById(bookingId);
    const address = AddressService.getById(booking.addressId);

    if (!confirm(`Soll die Buchung für "${address?.name}" gelöscht werden?`)) {
      return;
    }

    try {
      BookingService.delete(bookingId);
      App.showNotification('Buchung gelöscht', 'success');
      this.render();
    } catch (error) {
      App.showNotification('Fehler: ' + error.message, 'error');
    }
  }

  static createContract(bookingId) {
    const booking = BookingService.getById(bookingId);
    const address = AddressService.getById(booking.addressId);
    const total = BookingService.calculateTotal(booking);

    // Öffne Dialog zur Bestätigung
    const title = `Vertrag erstellen für "${address?.name}"`;
    const content = `
      <div>
        <p>Es wird ein Vertrag für folgende Buchung erstellt:</p>
        <div class="form-group" style="background: var(--light-gray); padding: var(--spacing-md); border-radius: 4px;">
          <div><strong>Veranstalter:</strong> ${address?.name}</div>
          <div><strong>Ereignisdatum:</strong> ${App.formatDate(booking.eventDate)}</div>
          <div><strong>Gesamtsumme:</strong> ${App.formatCurrency(total)}</div>
        </div>
      </div>
    `;

    const buttons = [
      {
        label: 'Vertrag erstellen',
        callback: () => {
          try {
            const contract = DocumentService.createContractFromBooking(bookingId);
            DocumentService.save(contract);
            App.showNotification('Vertrag erstellt', 'success');
            App.closeModal();
          } catch (error) {
            App.showNotification('Fehler: ' + error.message, 'error');
          }
        }
      },
      {
        label: 'Abbrechen',
        action: 'close'
      }
    ];

    App.openModal(title, content, buttons);
  }

  static createInvoice(bookingId) {
    const booking = BookingService.getById(bookingId);
    const address = AddressService.getById(booking.addressId);

    // Öffne Dialog zur Auswahl der Zahlungsmethode
    const title = `Rechnung erstellen für "${address?.name}"`;
    const content = `
      <div class="form-group">
        <label>Zahlungsmethode</label>
        <select id="payment-method-select" class="form-control">
          <option value="bank_transfer">🏦 Banküberweisung</option>
          <option value="cash">💵 Barzahlung</option>
        </select>
        <small class="text-muted">Wählen Sie die Zahlungsmethode für die Rechnung aus.</small>
      </div>
    `;

    const buttons = [
      {
        label: 'Rechnung erstellen',
        callback: () => {
          const paymentMethod = document.getElementById('payment-method-select').value;
          try {
            const invoice = DocumentService.createInvoiceFromBooking(bookingId, paymentMethod);
            DocumentService.save(invoice);
            App.showNotification('Rechnung erstellt', 'success');
            App.closeModal();
          } catch (error) {
            App.showNotification('Fehler: ' + error.message, 'error');
          }
        }
      },
      {
        label: 'Abbrechen',
        action: 'close'
      }
    ];

    App.openModal(title, content, buttons);
  }

  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  BookingListController.init();
});
