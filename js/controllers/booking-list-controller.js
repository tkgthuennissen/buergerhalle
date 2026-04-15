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

    // Sortieren nach Anfangsdatum
    const sortedBookings = [...bookings].sort((a, b) => 
      new Date(a.beginDateTime) - new Date(b.beginDateTime)
    );

    list.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Veranstalter</th>
            <th>Veranstaltung</th>
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
                    ${booking.status === 'confirmed' ? `<button class="icon-btn" onclick="BookingListController.createInvoice('${booking.id}')" title="Rechnung erstellen">💰</button>` : ''}
                    <button class="icon-btn" onclick="window.location.href='/buergerhalle/pages/booking-form.html?id=${booking.id}'" title="Bearbeiten">✏️</button>
                    <button class="icon-btn danger" onclick="BookingListController.deleteBooking('${booking.id}')" title="Löschen">🗑️</button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
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

  static createInvoice(bookingId) {
    const booking = BookingService.getById(bookingId);
    const address = AddressService.getById(booking.addressId);

    if (!confirm(`Soll eine Rechnung für die Buchung von "${address?.name}" erstellt werden?`)) {
      return;
    }

    try {
      // Erstelle Rechnung mit Standard-Zahlungsmethode "bank_transfer"
      const invoice = DocumentService.createInvoiceFromBooking(bookingId, 'bank_transfer');
      DocumentService.save(invoice);
      App.showNotification('Rechnung erstellt', 'success');
      // Optional: Zur Dokumenten-Seite weiterleiten oder anzeigen
    } catch (error) {
      App.showNotification('Fehler: ' + error.message, 'error');
    }
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
