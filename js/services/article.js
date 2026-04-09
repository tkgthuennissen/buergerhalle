/**
 * services/article.js - Artikel-Service
 * 
 * Verwaltung von:
 * - Paketen (mit Zeitlogik)
 * - Einzelartikeln
 */

class ArticleService {
  /**
   * Erstellt ein neues Paket
   * @param {Object} packageData - {name, description, unitPrice, timeLogic}
   * @return {Object} Neues Paket-Objekt
   */
  static createPackage(packageData) {
    const id = 'pkg_' + this.generateSlug(packageData.name);
    
    return {
      id,
      name: packageData.name,
      description: packageData.description || '',
      type: 'package',
      unitPrice: parseFloat(packageData.unitPrice) || 0,
      currency: 'EUR',
      timeLogic: {
        beginOffsetDays: packageData.timeLogic?.beginOffsetDays || 0,
        beginOffsetHours: packageData.timeLogic?.beginOffsetHours || 0,
        endOffsetDays: packageData.timeLogic?.endOffsetDays || 0,
        endOffsetHours: packageData.timeLogic?.endOffsetHours || 0
      },
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Erstellt einen neuen Einzelartikel
   * @param {Object} itemData - {name, description, unitPrice}
   * @return {Object} Neuer Artikel-Objekt
   */
  static createItem(itemData) {
    const id = 'art_' + this.generateSlug(itemData.name);
    
    return {
      id,
      name: itemData.name,
      description: itemData.description || '',
      type: 'item',
      unitPrice: parseFloat(itemData.unitPrice) || 0,
      currency: 'EUR',
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Speichert ein Paket oder Artikel
   * @param {Object} article - Artikel-Objekt (mit id)
   */
  static save(article) {
    storage.saveArticle(article);
  }

  /**
   * Löscht ein Paket oder Artikel
   * @param {string} id - Artikel-ID
   */
  static delete(id) {
    storage.deleteArticle(id);
  }

  /**
   * Gibt ein Paket oder Artikel per ID zurück
   * @param {string} id
   * @return {Object|null}
   */
  static getById(id) {
    return storage.getArticleById(id);
  }

  /**
   * Gibt alle Pakete zurück
   * @return {Array}
   */
  static getPackages() {
    return storage.getPackages();
  }

  /**
   * Gibt alle Einzelartikel zurück
   * @return {Array}
   */
  static getItems() {
    return storage.getItems();
  }

  /**
   * Berechnet die Zeit-Offsets eines Pakets für ein gegebenes Veranstaltungsdatum
   * 
   * Beispiel 3-Tage-Paket am Freitag 15. Juni:
   *   eventDate: 2026-06-15
   *   timeLogic: {beginOffsetDays: -1, beginOffsetHours: 18, endOffsetDays: 1, endOffsetHours: 11}
   *   → Sonntag 14. Juni 18:00 bis Dienstag 16. Juni 11:00
   * 
   * @param {Object} packageData - Paket mit timeLogic
   * @param {string} eventDateString - ISO-Date "YYYY-MM-DD"
   * @return {Object} {beginDateTime, endDateTime} als ISO-Strings
   */
  static calculatePackageDates(packageData, eventDateString) {
    if (packageData.type !== 'package') {
      throw new Error('Nur Pakete haben Zeitlogik');
    }

    const eventDate = new Date(eventDateString + 'T00:00:00Z');
    const timeLogic = packageData.timeLogic;

    // Kopie erstellen um Original nicht zu verändern
    const beginDate = new Date(eventDate);
    beginDate.setDate(beginDate.getDate() + timeLogic.beginOffsetDays);
    beginDate.setHours(timeLogic.beginOffsetHours, 0, 0, 0);

    const endDate = new Date(eventDate);
    endDate.setDate(endDate.getDate() + timeLogic.endOffsetDays);
    endDate.setHours(timeLogic.endOffsetHours, 0, 0, 0);

    return {
      beginDateTime: beginDate.toISOString(),
      endDateTime: endDate.toISOString()
    };
  }

  /**
   * Konvertiert beliebigen String in URL-freundlichen Slug
   * @param {string} str
   * @return {string}
   */
  static generateSlug(str) {
    return str
      .toLowerCase()
      .trim()
      .replace(/[äöüß]/g, (c) => ({ä:'ae',ö:'oe',ü:'ue',ß:'ss'}[c]))
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '_')
      .replace(/-+/g, '_')
      .substring(0, 30);
  }
}
