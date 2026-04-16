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
      },
      templates: this.initializeDefaultTemplates(),
      workflows: [],
      archive: [],
      settings: this.initializeDefaultSettings()
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
   * Initialisiert Standard-Templates
   */
  initializeDefaultTemplates() {
    return [
      {
        id: 'tmpl_contract_1',
        type: 'contract',
        name: 'Standard-Vertrag',
        header: 'Bürgerhalle Musterstadt\nVertrag Nr. {{Dokument.Nummer}}',
        body: 'Hiermit wird die Anmietung der Bürgerhalle vereinbart.\n\nKunde: {{Adresse.Name}}\nAdresse: {{Adresse.Strasse}}, {{Adresse.PLZ}} {{Adresse.Stadt}}\nZeitraum: {{Buchung.Zeitraum}}\nPaket: {{Artikel.Name}}\nGesamtpreis: {{Dokument.Total}} €\n\nZahlungsbedingungen: Vorkasse\n\nMit freundlichen Grüßen,\nBürgerhalle Musterstadt',
        footer: 'Unterschrift Mieter: ____________________\nDatum: {{Dokument.Datum}}\n\nUnterschrift Vermieter: ____________________\nDatum: {{Dokument.Datum}}',
        placeholders: ['{{Dokument.Nummer}}', '{{Adresse.Name}}', '{{Adresse.Strasse}}', '{{Adresse.PLZ}}', '{{Adresse.Stadt}}', '{{Buchung.Zeitraum}}', '{{Artikel.Name}}', '{{Dokument.Total}}', '{{Dokument.Datum}}'],
        createdAt: new Date().toISOString()
      },
      {
        id: 'tmpl_invoice_1',
        type: 'invoice',
        name: 'Standard-Rechnung',
        header: 'Bürgerhalle Musterstadt\nRechnung Nr. {{Dokument.Nummer}}',
        body: 'Rechnung für die Anmietung der Bürgerhalle.\n\nKunde: {{Adresse.Name}}\nAdresse: {{Adresse.Strasse}}, {{Adresse.PLZ}} {{Adresse.Stadt}}\nZeitraum: {{Buchung.Zeitraum}}\nPaket: {{Artikel.Name}}\n\nPositionen:\n{{Dokument.Positionen}}\n\nZwischensumme: {{Dokument.Subtotal}} €\nMwSt.: {{Dokument.Steuer}} €\nGesamt: {{Dokument.Total}} €',
        footer: 'Zahlbar innerhalb von 14 Tagen.\n\nMit freundlichen Grüßen,\nBürgerhalle Musterstadt',
        placeholders: ['{{Dokument.Nummer}}', '{{Adresse.Name}}', '{{Adresse.Strasse}}', '{{Adresse.PLZ}}', '{{Adresse.Stadt}}', '{{Buchung.Zeitraum}}', '{{Artikel.Name}}', '{{Dokument.Positionen}}', '{{Dokument.Subtotal}}', '{{Dokument.Steuer}}', '{{Dokument.Total}}'],
        createdAt: new Date().toISOString()
      }
    ];
  }

  /**
   * Initialisiert Standard-Einstellungen
   */
  initializeDefaultSettings() {
    return {
      retentionPeriods: {
        invoices: 10, // Jahre
        contracts: 6, // Jahre
        addresses: 3  // Jahre
      },
      gdprSettings: {
        autoAnonymize: true,
        anonymizeAfterYears: 2
      }
    };
  }

  /**
   * Validiert die Datenstruktur (einfache Checks)
   */
  validate() {
    if (!this.data || typeof this.data !== 'object') {
      throw new Error('Ungültige Datenstruktur');
    }
    
    const required = ['addresses', 'articles', 'bookings', 'documents', 'cashbook', 'numbering', 'templates', 'workflows', 'archive', 'settings'];
    for (const field of required) {
      if (!(field in this.data)) {
        this.migrate();
        break;
      }
    }
  }

  /**
   * Migriert alte Datenstrukturen zu neuen
   */
  migrate() {
    console.log('Datenmigration gestartet...');
    
    // Neue Felder hinzufügen
    if (!this.data.templates) {
      this.data.templates = this.initializeDefaultTemplates();
    }
    if (!this.data.workflows) {
      this.data.workflows = [];
    }
    if (!this.data.archive) {
      this.data.archive = [];
    }
    if (!this.data.settings) {
      this.data.settings = this.initializeDefaultSettings();
    }

    // Bestehende Adressen erweitern
    this.data.addresses = this.data.addresses.map(addr => ({
      ...addr,
      gdprConsent: addr.gdprConsent || false,
      anonymized: addr.anonymized || false,
      archiveStatus: addr.archiveStatus || null,
      archiveDate: addr.archiveDate || null
    }));

    // Bestehende Dokumente erweitern
    this.data.documents = this.data.documents.map(doc => ({
      ...doc,
      status: doc.status || 'created',
      workflowHistory: doc.workflowHistory || [{
        status: doc.status || 'created',
        timestamp: doc.createdAt,
        user: 'system'
      }],
      templateId: doc.templateId || (doc.type === 'contract' ? 'tmpl_contract_1' : 'tmpl_invoice_1'),
      pdfHash: doc.pdfHash || null,
      archiveStatus: doc.archiveStatus || null,
      archiveDate: doc.archiveDate || null
    }));

    this.save();
    console.log('Datenmigration abgeschlossen.');
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

  /**
   * @return {Array} Alle Templates
   */
  getTemplates() {
    return this.data.templates || [];
  }

  /**
   * @param {string} id - Template-ID
   * @return {Object|null} Template oder null
   */
  getTemplateById(id) {
    return this.data.templates.find(t => t.id === id) || null;
  }

  /**
   * @return {Array} Alle Workflows
   */
  getWorkflows() {
    return this.data.workflows || [];
  }

  /**
   * @param {string} id - Workflow-ID
   * @return {Object|null} Workflow oder null
   */
  getWorkflowById(id) {
    return this.data.workflows.find(w => w.id === id) || null;
  }

  /**
   * @return {Array} Alle Archiv-Einträge
   */
  getArchive() {
    return this.data.archive || [];
  }

  /**
   * @return {Object} Einstellungen
   */
  getSettings() {
    return this.data.settings || {};
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
  /**
   * Speichert ein neues oder aktualisiertes Template
   * @param {Object} template - Template-Objekt mit id
   */
  saveTemplate(template) {
    const index = this.data.templates.findIndex(t => t.id === template.id);
    if (index >= 0) {
      this.data.templates[index] = template;
    } else {
      this.data.templates.push(template);
    }
    this.save();
  }

  /**
   * Löscht ein Template
   * @param {string} id - Template-ID
   */
  deleteTemplate(id) {
    this.data.templates = this.data.templates.filter(t => t.id !== id);
    this.save();
  }

  /**
   * Speichert einen neuen oder aktualisierten Workflow
   * @param {Object} workflow - Workflow-Objekt mit id
   */
  saveWorkflow(workflow) {
    const index = this.data.workflows.findIndex(w => w.id === workflow.id);
    if (index >= 0) {
      this.data.workflows[index] = workflow;
    } else {
      this.data.workflows.push(workflow);
    }
    this.save();
  }

  /**
   * Löscht einen Workflow
   * @param {string} id - Workflow-ID
   */
  deleteWorkflow(id) {
    this.data.workflows = this.data.workflows.filter(w => w.id !== id);
    this.save();
  }

  /**
   * Speichert einen neuen Archiv-Eintrag
   * @param {Object} archiveEntry - Archiv-Eintrag
   */
  saveArchiveEntry(archiveEntry) {
    this.data.archive.push(archiveEntry);
    this.save();
  }

  /**
   * Speichert Einstellungen
   * @param {Object} settings - Einstellungen-Objekt
   */
  saveSettings(settings) {
    this.data.settings = settings;
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
