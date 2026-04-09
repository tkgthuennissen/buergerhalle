/**
 * services/booking.js - Buchungs-Service
 * 
 * Verwaltung von Buchungen mit:
 * - Überschneidungsprüfung
 * - Paket-Integration
 * - Status-Management
 */

class BookingService {
  /**
   * Erstellt eine neue Buchung
   * @param {Object} bookingData - {addressId, packageId, eventDate, additionalItems}
   * @return {Object} Neues Buchungs-Objekt
   */
  static create(bookingData) {
    const packageArticle = storage.getArticleById(bookingData.packageId);
    if (!packageArticle || packageArticle.type !== 'package') {
      throw new Error('Ungültiges Paket');
    }

    const dates = ArticleService.calculatePackageDates(
      packageArticle,
      bookingData.eventDate
    );

    const id = 'booking_' + AddressService.generateUUID();

    return {
      id,
      addressId: bookingData.addressId,
      packageId: bookingData.packageId,
      eventDate: bookingData.eventDate,
      beginDateTime: dates.beginDateTime,
      endDateTime: dates.endDateTime,
      status: 'planned', // "planned" | "confirmed" | "cancelled"
      additionalItems: bookingData.additionalItems || [],
      notes: bookingData.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Speichert eine Buchung nach Validierung
   * @param {Object} booking - Buchungs-Objekt mit vollständigen Daten
   * @throws {Error} bei Überschneidung oder Validierungsfehler
   */
  static save(booking) {
    // Validierung
    const validation = this.validate(booking);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Überschneidungsprüfung (Ausnahme: ID ist identisch = Update)
    if (!this.canBookingExist(booking)) {
      throw new Error(
        'Diese Buchung überschneidet sich mit einer existierenden Buchung!'
      );
    }

    booking.updatedAt = new Date().toISOString();
    storage.saveBooking(booking);
  }

  /**
   * Prüft, ob eine Buchung zeitlich möglich ist
   * (keine Überschneidung mit anderen Buchungen, außer bei Update der gleichen ID)
   * 
   * @param {Object} booking - Neu zu speichernde Buchung
   * @return {boolean} true wenn keine Überschneidung
   */
  static canBookingExist(booking) {
    const existingBookings = storage.getBookings();

    for (const existing of existingBookings) {
      // Gleiche Buchung (Update): OK
      if (existing.id === booking.id) continue;

      // Stornierte Buchungen ignorieren
      if (existing.status === 'cancelled') continue;

      // Zeitüberschneidung prüfen
      if (this.overlap(
        new Date(booking.beginDateTime),
        new Date(booking.endDateTime),
        new Date(existing.beginDateTime),
        new Date(existing.endDateTime)
      )) {
        return false;
      }
    }

    return true;
  }

  /**
   * Prüft zeitliche Überschneidung zweier Zeiträume
   * @param {Date} start1, @param {Date} end1 - Zeitraum 1
   * @param {Date} start2, @param {Date} end2 - Zeitraum 2
   * @return {boolean} true wenn Überschneidung
   */
  static overlap(start1, end1, start2, end2) {
    return start1 < end2 && start2 < end1;
  }

  /**
   * Löscht eine Buchung
   * @param {string} id
   */
  static delete(id) {
    storage.deleteBooking(id);
  }

  /**
   * Gibt eine Buchung per ID zurück
   * @param {string} id
   * @return {Object|null}
   */
  static getById(id) {
    return storage.getBookingById(id);
  }

  /**
   * Gibt alle aktiven (nicht stornierten) Buchungen zurück
   * @return {Array}
   */
  static getActive() {
    return storage.getBookings().filter(b => b.status !== 'cancelled');
  }

  /**
   * Gibt alle Buchungen zurück
   * @return {Array}
   */
  static getAll() {
    return storage.getBookings();
  }

  /**
   * Gibt Buchungen für einen bestimmten Monat und Jahr zurück
   * (für Kalender-Anzeige)
   * 
   * @param {number} month - 1-12
   * @param {number} year - z.B. 2026
   * @return {Array} Buchungen die in diesem Monat aktiv sind
   */
  static getByMonth(month, year) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 1);

    return this.getActive().filter(booking => {
      const begin = new Date(booking.beginDateTime);
      const end = new Date(booking.endDateTime);
      return begin < endOfMonth && end > startOfMonth;
    });
  }

  /**
   * Gibt Buchungen für einen bestimmten Tag zurück
   * @param {string} dateString - ISO-Date "YYYY-MM-DD"
   * @return {Array}
   */
  static getByDate(dateString) {
    const date = new Date(dateString + 'T00:00:00Z');
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    return this.getActive().filter(booking => {
      const begin = new Date(booking.beginDateTime);
      const end = new Date(booking.endDateTime);
      return begin < nextDate && end > date;
    });
  }

  /**
   * Berechnet die Gesamtsumme einer Buchung
   * @param {Object} booking
   * @return {number} Summe in EUR
   */
  static calculateTotal(booking) {
    const packageArticle = storage.getArticleById(booking.packageId);
    let total = packageArticle?.unitPrice || 0;

    for (const item of booking.additionalItems) {
      const article = storage.getArticleById(item.itemId);
      total += (article?.unitPrice || 0) * (item.quantity || 1);
    }

    return total;
  }

  /**
   * Validiert eine Buchung
   * @param {Object} booking
   * @return {Object} {valid: boolean, errors: []}
   */
  static validate(booking) {
    const errors = [];

    if (!booking.addressId) errors.push('Adresse erforderlich');
    if (!booking.packageId) errors.push('Paket erforderlich');
    if (!booking.eventDate) errors.push('Veranstaltungsdatum erforderlich');
    if (!booking.beginDateTime) errors.push('Anfangszeit erforderlich');
    if (!booking.endDateTime) errors.push('Endzeit erforderlich');

    // Beginn muss vor Ende liegen
    if (booking.beginDateTime && booking.endDateTime) {
      if (new Date(booking.beginDateTime) >= new Date(booking.endDateTime)) {
        errors.push('Anfangszeit muss vor Endzeit liegen');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
