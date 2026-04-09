/**
 * storage.js - Storage-Layer
 * 
 * Zentrale Verwaltung aller Daten im localStorage.
 * - Laden der Datenstruktur beim Start
 * - Speichern von Änderungen
 * - Initialisierung mit Standardwerten
 * 
 * WICHTIG: Alle anderen Module lesen/schreiben über diese Schnittstelle!
 */

class Storage {
  constructor() {
    this.storageKey = 'halle_data';
    this.data = null;
    this.load();
  }

  /**
   * Lädt Daten aus localStorage, initialisiert bei Bedarf
   */
  load() {
    const raw = localStorage.getItem(this.storageKey);
    
    if (!raw) {
      this.initializeEmpty();
      return;
    }

    try {
      this.data = JSON.parse(raw);
      this.validate();
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
      this.initializeEmpty();
    }
  }

  /**
   * Initialisiert Datenstruktur mit leeren/Standard-Werten
   */
  initializeEmpty() {
    this.data = {
      addresses: [],
      articles: this.initializeDefaultArticles(),
      bookings: [],
      documents: [],
      cashbook: [],
      numbering: {
        invoices: { [new Date().getFullYear()]: 1 },
        contracts: { [new Date().getFullYear()]: 1 }
      }
    };
    this.save();
  }

  /**
   * Initialisiert Standard-Artikel (können später bearbeitet werden)
   */
  initializeDefaultArticles() {
    const currentYear = new Date().getFullYear();
    return [
      {
        id: 'pkg_3day',
        name: '3-Tage-Paket',
        description: 'Anmietung für 3 Tage (Freitag 18:00 - Sonntag 11:00)',
        type: 'package',
        unitPrice: 500.00,
        currency: 'EUR',
        timeLogic: {
          beginOffsetDays: -1,
          beginOffsetHours: 18,
          endOffsetDays: 1,
          endOffsetHours: 11
        },
        createdAt: new Date().toISOString()
      },
      {
        id: 'pkg_5day',
        name: '5-Tage-Paket',
        description: 'Anmietung für 5 Tage (Mittwoch 18:00 - Sonntag 11:00)',
        type: 'package',
        unitPrice: 750.00,
        currency: 'EUR',
        timeLogic: {
          beginOffsetDays: -2,
          beginOffsetHours: 18,
          endOffsetDays: 2,
          endOffsetHours: 11
        },
        createdAt: new Date().toISOString()
      },
      {
        id: 'art_cleaning',
        name: 'Reinigung',
        description: 'Grundreinigung',
        type: 'item',
        unitPrice: 150.00,
        currency: 'EUR',
        createdAt: new Date().toISOString()
      },
      {
        id: 'art_sound',
        name: 'Tontechnik',
        description: 'Miete Schallanlage + Mikrofon',
        type: 'item',
        unitPrice: 200.00,
        currency: 'EUR',
        createdAt: new Date().toISOString()
      },
      {
        id: 'art_catering',
        name: 'Catering',
        description: 'Getränkeversorung',
        type: 'item',
        unitPrice: 300.00,
        currency: 'EUR',
        createdAt: new Date().toISOString()
      }
    ];
  }

  /**
   * Validiert die Datenstruktur (einfache Checks)
   */
  validate() {
    if (!this.data || typeof this.data !== 'object') {
      throw new Error('Ungültige Datenstruktur');
    }
    
    const required = ['addresses', 'articles', 'bookings', 'documents', 'cashbook', 'numbering'];
    for (const field of required) {
      if (!(field in this.data)) {
        throw new Error(`Fehlendes Feld: ${field}`);
      }
    }
  }

  /**
   * Speichert Daten in localStorage
   */
  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (error) {
      console.error('Fehler beim Speichern der Daten:', error);
      throw new Error('localStorage voll oder nicht verfügbar');
    }
  }

  // ============================================================================
  // GET-Operationen
  // ============================================================================

  /**
   * @return {Array} Alle Adressen
   */
  getAddresses() {
    return this.data.addresses || [];
  }

  /**
   * @param {string} id - Adress-ID
   * @return {Object|null} Adresse oder null
   */
  getAddressById(id) {
    return this.data.addresses.find(a => a.id === id) || null;
  }

  /**
   * @return {Array} Alle Artikel (Pakete + Einzelartikel)
   */
  getArticles() {
    return this.data.articles || [];
  }

  /**
   * @return {Array} Nur Pakete
   */
  getPackages() {
    return this.getArticles().filter(a => a.type === 'package');
  }

  /**
   * @return {Array} Nur Einzelartikel
   */
  getItems() {
    return this.getArticles().filter(a => a.type === 'item');
  }

  /**
   * @param {string} id - Artikel-ID
   * @return {Object|null} Artikel oder null
   */
  getArticleById(id) {
    return this.data.articles.find(a => a.id === id) || null;
  }

  /**
   * @return {Array} Alle Buchungen
   */
  getBookings() {
    return this.data.bookings || [];
  }

  /**
   * @param {string} id - Buchungs-ID
   * @return {Object|null} Buchung oder null
   */
  getBookingById(id) {
    return this.data.bookings.find(b => b.id === id) || null;
  }

  /**
   * @return {Array} Alle Dokumente
   */
  getDocuments() {
    return this.data.documents || [];
  }

  /**
   * @param {string} id - Dokument-ID
   * @return {Object|null} Dokument oder null
   */
  getDocumentById(id) {
    return this.data.documents.find(d => d.id === id) || null;
  }

  /**
   * @return {Array} Alle Kassenbuch-Einträge
   */
  getCashbook() {
    return this.data.cashbook || [];
  }

  /**
   * @return {Object} Nummernkreis-Objekt
   */
  getNumbering() {
    return this.data.numbering || {};
  }

  // ============================================================================
  // SET-Operationen (schreiben in data + save)
  // ============================================================================

  /**
   * Speichert eine neue oder aktualisierte Adresse
   * @param {Object} address - Adress-Objekt mit id
   */
  saveAddress(address) {
    const index = this.data.addresses.findIndex(a => a.id === address.id);
    if (index >= 0) {
      this.data.addresses[index] = address;
    } else {
      this.data.addresses.push(address);
    }
    this.save();
  }

  /**
   * Löscht eine Adresse
   * @param {string} id - Adress-ID
   */
  deleteAddress(id) {
    this.data.addresses = this.data.addresses.filter(a => a.id !== id);
    this.save();
  }

  /**
   * Speichert einen neuen oder aktualisierten Artikel
   * @param {Object} article - Artikel-Objekt mit id
   */
  saveArticle(article) {
    const index = this.data.articles.findIndex(a => a.id === article.id);
    if (index >= 0) {
      this.data.articles[index] = article;
    } else {
      this.data.articles.push(article);
    }
    this.save();
  }

  /**
   * Löscht einen Artikel
   * @param {string} id - Artikel-ID
   */
  deleteArticle(id) {
    this.data.articles = this.data.articles.filter(a => a.id !== id);
    this.save();
  }

  /**
   * Speichert eine neue oder aktualisierte Buchung
   * @param {Object} booking - Buchungs-Objekt mit id
   */
  saveBooking(booking) {
    const index = this.data.bookings.findIndex(b => b.id === booking.id);
    if (index >= 0) {
      this.data.bookings[index] = booking;
    } else {
      this.data.bookings.push(booking);
    }
    this.save();
  }

  /**
   * Löscht eine Buchung
   * @param {string} id - Buchungs-ID
   */
  deleteBooking(id) {
    this.data.bookings = this.data.bookings.filter(b => b.id !== id);
    this.save();
  }

  /**
   * Speichert ein neues oder aktualisiertes Dokument
   * @param {Object} document - Dokument-Objekt mit id
   */
  saveDocument(document) {
    const index = this.data.documents.findIndex(d => d.id === document.id);
    if (index >= 0) {
      this.data.documents[index] = document;
    } else {
      this.data.documents.push(document);
    }
    this.save();
  }

  /**
   * Löscht ein Dokument
   * @param {string} id - Dokument-ID
   */
  deleteDocument(id) {
    this.data.documents = this.data.documents.filter(d => d.id !== id);
    this.save();
  }

  /**
   * Speichert einen Kassenbuch-Eintrag
   * @param {Object} entry - Kassenbuch-Eintrag mit id
   */
  saveCashbookEntry(entry) {
    const index = this.data.cashbook.findIndex(e => e.id === entry.id);
    if (index >= 0) {
      this.data.cashbook[index] = entry;
    } else {
      this.data.cashbook.push(entry);
    }
    this.save();
  }

  /**
   * Speichert die Nummernkreis-Daten
   * @param {Object} numbering - Nummernkreis-Objekt
   */
  saveNumbering(numbering) {
    this.data.numbering = numbering;
    this.save();
  }

  // ============================================================================
  // Utility-Funktionen
  // ============================================================================

  /**
   * Exportiert alle Daten als JSON-String (für Backup/Debug)
   * @return {string} JSON-String
   */
  exportAsJSON() {
    return JSON.stringify(this.data, null, 2);
  }

  /**
   * Importiert Daten aus JSON-String (für Restore)
   * @param {string} jsonString - JSON-String
   */
  importFromJSON(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      this.data = imported;
      this.validate();
      this.save();
    } catch (error) {
      console.error('Import-Fehler:', error);
      throw new Error('Ungültiges JSON-Format');
    }
  }

  /**
   * Löscht ALLE Daten und setzt auf Initialzustand zurück
   */
  reset() {
    if (confirm('WARNUNG: Alle Daten werden gelöscht! Fortfahren?')) {
      localStorage.removeItem(this.storageKey);
      this.load();
    }
  }
}

// Globale Instanz
const storage = new Storage();
