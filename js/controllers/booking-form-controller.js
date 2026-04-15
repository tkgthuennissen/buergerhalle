/**
 * controllers/booking-form-controller.js
 * 
 * Steuert das Buchungsformular
 */

class BookingFormController {
  static editingBookingId = null;
  static additionalItems = [];

  static init() {
    console.log('BookingFormController initialisiert');
    
    // Prüfe ob Bearbeitung oder Neu
    const params = new URLSearchParams(window.location.search);
    this.editingBookingId = params.get('id');
    const eventDate = params.get('eventDate');

    this.populateAddresses();
    this.populatePackages();
    this.populateItems();

    // Datum aus URL oder heute
    if (eventDate) {
      document.getElementById('booking-event-date').value = eventDate;
    } else {
      document.getElementById('booking-event-date').value = new Date().toISOString().split('T')[0];
    }

    if (this.editingBookingId) {
      this.loadBooking();
    }

    this.setupEventListeners();
  }

  static setupEventListeners() {
    document.getElementById('booking-event-date').addEventListener('change', () => this.updatePackage());
    document.getElementById('booking-package').addEventListener('change', () => this.updatePackage());
  }

  /**
   * Lädt Dropdown-Optionen für Adressen
   */
  static populateAddresses() {
    const select = document.getElementById('booking-address');
    const addresses = AddressService.getAll();

    addresses.forEach(addr => {
      const option = document.createElement('option');
      option.value = addr.id;
      option.textContent = addr.name;
      select.appendChild(option);
    });
  }

  /**
   * Lädt Dropdown-Optionen für Pakete
   */
  static populatePackages() {
    const select = document.getElementById('booking-package');
    const packages = ArticleService.getPackages();

    packages.forEach(pkg => {
      const option = document.createElement('option');
      option.value = pkg.id;
      option.textContent = `${pkg.name} – ${App.formatCurrency(pkg.unitPrice)}`;
      select.appendChild(option);
    });
  }

  /**
   * Lädt Dropdown-Optionen für Zusatzartikel (nur Dienstleistungen)
   */
  static populateItems() {
    const select = document.getElementById('item-select');
    const items = ArticleService.getServices();

    items.forEach(item => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = `${item.name} – ${App.formatCurrency(item.unitPrice)}`;
      select.appendChild(option);
    });
  }

  /**
   * Aktualisiert Paket-Zeiten basierend auf Veranstaltungsdatum
   */
  static updatePackage() {
    const packageId = document.getElementById('booking-package').value;
    const eventDate = document.getElementById('booking-event-date').value;

    if (!packageId || !eventDate) {
      document.getElementById('booking-begin').value = '';
      document.getElementById('booking-end').value = '';
      return;
    }

    const pkg = ArticleService.getById(packageId);
    const dates = ArticleService.calculatePackageDates(pkg, eventDate);

    // Konvertiere zu datetime-local Format
    const beginDate = new Date(dates.beginDateTime);
    const endDate = new Date(dates.endDateTime);

    document.getElementById('booking-begin').value = this.toDatetimeLocal(beginDate);
    document.getElementById('booking-end').value = this.toDatetimeLocal(endDate);

    this.updateSummary();
  }

  /**
   * Konvertiert Date zu datetime-local Format
   */
  static toDatetimeLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${mins}`;
  }

  /**
   * Fügt Zusatzartikel zur Liste hinzu
   */
  static addItem() {
    const itemId = document.getElementById('item-select').value;
    const qty = parseInt(document.getElementById('item-qty').value) || 1;

    if (!itemId) {
      App.showNotification('Bitte wählen Sie einen Artikel', 'error');
      return;
    }

    // Prüfe ob bereits vorhanden und aktualisiere Menge
    const existing = this.additionalItems.find(i => i.itemId === itemId);
    if (existing) {
      existing.quantity = qty;
    } else {
      this.additionalItems.push({ itemId, quantity: qty });
    }

    document.getElementById('item-select').value = '';
    document.getElementById('item-qty').value = '1';

    this.renderItems();
    this.updateSummary();
  }

  /**
   * Rendert die Zusatzartikel-Tabelle
   */
  static renderItems() {
    const tbody = document.getElementById('items-tbody');
    tbody.innerHTML = '';

    this.additionalItems.forEach((item, idx) => {
      const article = ArticleService.getById(item.itemId);
      if (!article) return;

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${article.name}</td>
        <td>
          <input type="number" min="1" value="${item.quantity}" 
                 onchange="BookingFormController.updateItemQty(${idx}, this.value)">
        </td>
        <td class="text-right">${App.formatCurrency(article.unitPrice * item.quantity)}</td>
        <td><button type="button" class="icon-btn danger" onclick="BookingFormController.removeItem(${idx})">🗑️</button></td>
      `;
      tbody.appendChild(row);
    });
  }

  /**
   * Ändert Menge eines Artikels
   */
  static updateItemQty(idx, qty) {
    this.additionalItems[idx].quantity = Math.max(1, parseInt(qty) || 1);
    this.renderItems();
    this.updateSummary();
  }

  /**
   * Entfernt Artikel aus Liste
   */
  static removeItem(idx) {
    this.additionalItems.splice(idx, 1);
    this.renderItems();
    this.updateSummary();
  }

  /**
   * Aktualisiert die Zusammenfassung
   */
  static updateSummary() {
    const packageId = document.getElementById('booking-package').value;
    const pkg = ArticleService.getById(packageId);

    let totalPackage = pkg ? pkg.unitPrice : 0;
    let totalItems = 0;

    this.additionalItems.forEach(item => {
      const article = ArticleService.getById(item.itemId);
      totalItems += (article?.unitPrice || 0) * item.quantity;
    });

    const total = totalPackage + totalItems;

    document.getElementById('sum-package').textContent = pkg 
      ? `${pkg.name}: ${App.formatCurrency(totalPackage)}`
      : '—';
    document.getElementById('sum-items').textContent = totalItems > 0
      ? App.formatCurrency(totalItems)
      : '—';
    document.getElementById('sum-total').textContent = App.formatCurrency(total);
  }

  /**
   * Lädt Buchung zur Bearbeitung
   */
  static loadBooking() {
    const booking = BookingService.getById(this.editingBookingId);
    if (!booking) return;

    document.getElementById('page-title').textContent = '✏️ Buchung bearbeiten';
    document.getElementById('submit-text').textContent = '💾 Speichern';

    document.getElementById('booking-address').value = booking.addressId;
    document.getElementById('booking-event-date').value = booking.eventDate;
    document.getElementById('booking-package').value = booking.packageId;
    document.getElementById('booking-status').value = booking.status;
    document.getElementById('booking-notes').value = booking.notes;

    // Zusatzartikel laden
    this.additionalItems = JSON.parse(JSON.stringify(booking.additionalItems));
    this.renderItems();

    this.updatePackage();
  }

  /**
   * Speichert die Buchung
   */
  static submitForm(event) {
    event.preventDefault();

    const bookingData = {
      addressId: document.getElementById('booking-address').value,
      packageId: document.getElementById('booking-package').value,
      eventDate: document.getElementById('booking-event-date').value,
      additionalItems: this.additionalItems,
      notes: document.getElementById('booking-notes').value,
      status: document.getElementById('booking-status').value
    };

    if (!bookingData.addressId || !bookingData.packageId || !bookingData.eventDate) {
      App.showNotification('Bitte füllen Sie alle Pflichtfelder', 'error');
      return;
    }

    try {
      let booking;
      if (this.editingBookingId) {
        booking = BookingService.getById(this.editingBookingId);
        Object.assign(booking, bookingData);
      } else {
        booking = BookingService.create(bookingData);
      }

      BookingService.save(booking);
      App.showNotification(
        this.editingBookingId ? 'Buchung aktualisiert' : 'Buchung erstellt',
        'success'
      );

      setTimeout(() => {
        window.location.href = '/buergerhalle/pages/bookings.html';
      }, 1500);
    } catch (error) {
      App.showNotification('Fehler: ' + error.message, 'error');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  BookingFormController.init();
});
