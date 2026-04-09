/**
 * services/cashbook.js - Kassenbuch-Service
 * 
 * Verwaltung von Einnahmen und Ausgaben
 * - Automatische Einträge bei Bar-Rechnungen
 * - Manuelle Einträge
 * - Saldo-Berechnung
 */

class CashbookService {
  /**
   * Fügt einen Einnahme-Eintrag hinzu
   * @param {string} date - ISO-Date "YYYY-MM-DD"
   * @param {number} amount - Betrag in EUR
   * @param {string} description
   * @param {string} documentId - Optional, FK zu Documents
   * @return {Object} Neuer Eintrag
   */
  static addIncome(date, amount, description, documentId = null) {
    const entry = {
      id: 'cash_' + AddressService.generateUUID(),
      date,
      type: 'income',
      amount: parseFloat(amount),
      description,
      documentId,
      createdAt: new Date().toISOString()
    };

    storage.saveCashbookEntry(entry);
    return entry;
  }

  /**
   * Fügt einen Ausgabe-Eintrag hinzu
   * @param {string} date - ISO-Date "YYYY-MM-DD"
   * @param {number} amount - Betrag in EUR
   * @param {string} description
   * @return {Object} Neuer Eintrag
   */
  static addExpense(date, amount, description) {
    const entry = {
      id: 'cash_' + AddressService.generateUUID(),
      date,
      type: 'expense',
      amount: parseFloat(amount),
      description,
      documentId: null,
      createdAt: new Date().toISOString()
    };

    storage.saveCashbookEntry(entry);
    return entry;
  }

  /**
   * Gibt alle Kassenbuch-Einträge zurück
   * @return {Array}
   */
  static getAll() {
    // Sortiert nach Datum
    const entries = storage.getCashbook();
    return entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /**
   * Gibt Einträge für einen Zeitraum zurück
   * @param {string} startDate - ISO-Date "YYYY-MM-DD"
   * @param {string} endDate - ISO-Date
   * @return {Array}
   */
  static getByDateRange(startDate, endDate) {
    return this.getAll().filter(entry => 
      entry.date >= startDate && entry.date <= endDate
    );
  }

  /**
   * Berechnet das Gesamtsaldo
   * @return {number}
   */
  static calculateBalance() {
    let balance = 0;
    for (const entry of this.getAll()) {
      if (entry.type === 'income') {
        balance += entry.amount;
      } else if (entry.type === 'expense') {
        balance -= entry.amount;
      }
    }
    return balance;
  }

  /**
   * Berechnet das Saldo bis zu einem bestimmten Datum (incl.)
   * @param {string} upToDate - ISO-Date "YYYY-MM-DD"
   * @return {number}
   */
  static calculateBalanceUpTo(upToDate) {
    let balance = 0;
    const entries = storage.getCashbook().filter(e => e.date <= upToDate);
    for (const entry of entries) {
      if (entry.type === 'income') {
        balance += entry.amount;
      } else if (entry.type === 'expense') {
        balance -= entry.amount;
      }
    }
    return balance;
  }

  /**
   * Gibt Gesamtsumme der Einnahmen zurück
   * @return {number}
   */
  static getTotalIncome() {
    return this.getAll()
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);
  }

  /**
   * Gibt Gesamtsumme der Ausgaben zurück
   * @return {number}
   */
  static getTotalExpense() {
    return this.getAll()
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);
  }

  /**
   * Löscht einen Eintrag
   * @param {string} id
   */
  static delete(id) {
    const cashbook = storage.getCashbook();
    const filtered = cashbook.filter(e => e.id !== id);
    // Neuschreiben aller Einträge (da keine delete-per-ID in Storage)
    storage.data.cashbook = filtered;
    storage.save();
  }

  /**
   * Löscht alle Einträge zu einem bestimmten Dokument
   * (z.B. wenn Rechnung gelöscht wird)
   * 
   * @param {string} documentId
   */
  static deleteByDocumentId(documentId) {
    const cashbook = storage.getCashbook();
    const filtered = cashbook.filter(e => e.documentId !== documentId);
    storage.data.cashbook = filtered;
    storage.save();
  }

  /**
   * Gibt einen Eintrag per ID zurück
   * @param {string} id
   * @return {Object|null}
   */
  static getById(id) {
    return storage.getCashbook().find(e => e.id === id) || null;
  }
}
