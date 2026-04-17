/**
 * template.js - Template-Service
 *
 * Verwaltet Dokumenten-Templates mit Platzhaltern.
 */

class TemplateService {
  /**
   * Erstellt ein neues Template
   * @param {Object} data - Template-Daten
   * @return {Object} Template-Objekt
   */
  static create(data) {
    const template = {
      id: 'tmpl_' + Date.now(),
      type: data.type,
      name: data.name,
      header: data.header || '',
      body: data.body || '',
      footer: data.footer || '',
      placeholders: data.placeholders || [],
      createdAt: new Date().toISOString()
    };
    return template;
  }

  /**
   * Speichert ein Template
   * @param {Object} template - Template-Objekt
   */
  static save(template) {
    storage.saveTemplate(template);
  }

  /**
   * Lädt alle Templates
   * @return {Array} Templates
   */
  static getAll() {
    return storage.getTemplates();
  }

  /**
   * Lädt Templates nach Typ
   * @param {string} type - 'contract' oder 'invoice'
   * @return {Array} Templates
   */
  static getByType(type) {
    return storage.getTemplates().filter(t => t.type === type);
  }

  /**
   * Lädt ein Template nach ID
   * @param {string} id - Template-ID
   * @return {Object|null} Template oder null
   */
  static getById(id) {
    return storage.getTemplateById(id);
  }

  /**
   * Rendert ein Template mit Daten
   * @param {string} templateId - Template-ID
   * @param {Object} data - Daten für Platzhalter
   * @return {Object} Gerendertes Template
   */
  static render(templateId, data) {
    const template = this.getById(templateId);
    if (!template) return null;

    let header = template.header;
    let body = template.body;
    let footer = template.footer;

    // Platzhalter ersetzen
    const replacePlaceholders = (text) => {
      return text.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        return this.getValueByPath(data, path) || match;
      });
    };

    return {
      header: replacePlaceholders(header),
      body: replacePlaceholders(body),
      footer: replacePlaceholders(footer)
    };
  }

  /**
   * Hilfsfunktion: Wert aus Objekt-Pfad extrahieren
   * @param {Object} obj - Datenobjekt
   * @param {string} path - Pfad wie 'Adresse.Name'
   * @return {string} Wert oder leerer String
   */
  static getValueByPath(obj, path) {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return '';
      }
    }

    // Formatierung für bestimmte Felder
    if (path === 'Dokument.Total' || path === 'Dokument.Subtotal') {
      return current.toFixed(2) + ' €';
    }
    if (path === 'Buchung.Zeitraum') {
      return this.formatDateRange(current);
    }
    if (path.includes('Datum')) {
      return this.formatDate(current);
    }

    return String(current);
  }

  /**
   * Formatiert Datumsbereich
   * @param {Object} booking - Buchungsdaten
   * @return {string} Formatierter Bereich
   */
  static formatDateRange(booking) {
    if (!booking.beginDateTime || !booking.endDateTime) return '';
    const begin = new Date(booking.beginDateTime).toLocaleDateString('de-DE');
    const end = new Date(booking.endDateTime).toLocaleDateString('de-DE');
    return `${begin} - ${end}`;
  }

  /**
   * Formatiert Datum
   * @param {string} dateString - ISO-Datumsstring
   * @return {string} Formatiertes Datum
   */
  static formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('de-DE');
  }

  /**
   * Validiert ein Template
   * @param {Object} template - Template-Objekt
   * @return {Object} {valid: boolean, errors: Array}
   */
  static validate(template) {
    const errors = [];

    if (!template.name || template.name.trim().length === 0) {
      errors.push('Name ist erforderlich');
    }
    if (!template.type || !['contract', 'invoice'].includes(template.type)) {
      errors.push('Typ muss "contract" oder "invoice" sein');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Löscht ein Template
   * @param {string} id - Template-ID
   */
  static delete(id) {
    storage.deleteTemplate(id);
  }

  /**
   * Gibt die neueste Template-ID eines Typs zurück.
   * @param {string} type - 'contract' oder 'invoice'
   * @return {string|null}
   */
  static getLatestTemplateId(type) {
    const templates = this.getByType(type);
    if (!templates || templates.length === 0) return null;

    let latest = templates[0];
    for (let i = 1; i < templates.length; i++) {
      if (new Date(templates[i].createdAt) > new Date(latest.createdAt)) {
        latest = templates[i];
      }
    }
    return latest.id;
  }

  /**
   * Gibt eine gültige Template-ID zurück oder eine Standard-ID, wenn keine Vorlage vorhanden ist.
   * @param {string} type
   * @return {string}
   */
  static getDefaultTemplateId(type) {
    try {
      const latestTemplateId = this.getLatestTemplateId(type);
      if (latestTemplateId) return latestTemplateId;
    } catch (e) {
      console.warn('Fehler beim Laden der neuesten Template-ID:', e);
    }
    return type === 'contract' ? 'tmpl_contract_1' : 'tmpl_invoice_1';
  }
}