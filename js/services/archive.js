/**
 * archive.js - Archivierungs-Service
 *
 * Verwaltet Lösch- und Archivierungsprozesse nach DSGVO und GoBD.
 */

class ArchiveService {
  /**
   * Archiviert eine Entität (Soft Delete)
   * @param {string} entityType - 'address', 'document', 'cashbook'
   * @param {string} entityId - Entitäts-ID
   * @param {string} reason - Grund für Archivierung
   * @param {string} user - Benutzer
   */
  static archive(entityType, entityId, reason, user = 'admin') {
    const archiveEntry = {
      id: 'arch_' + Date.now(),
      entityType: entityType,
      entityId: entityId,
      action: 'soft_delete',
      reason: reason,
      timestamp: new Date().toISOString(),
      user: user
    };

    // Entität als archiviert markieren
    this.markAsArchived(entityType, entityId);

    // Archiv-Eintrag speichern
    storage.saveArchiveEntry(archiveEntry);
  }

  /**
   * Markiert Entität als archiviert
   * @param {string} entityType - Entitätstyp
   * @param {string} entityId - Entitäts-ID
   */
  static markAsArchived(entityType, entityId) {
    const now = new Date().toISOString();

    switch (entityType) {
      case 'address':
        const address = storage.getAddressById(entityId);
        if (address) {
          address.archiveStatus = 'archived';
          address.archiveDate = now;
          storage.saveAddress(address);
        }
        break;
      case 'document':
        const document = storage.getDocumentById(entityId);
        if (document) {
          document.archiveStatus = 'archived';
          document.archiveDate = now;
          storage.saveDocument(document);
        }
        break;
      case 'cashbook':
        // Kassenbuch-Einträge werden nicht archiviert, nur gelöscht
        break;
    }
  }

  /**
   * Löscht eine Entität endgültig (Hard Delete)
   * @param {string} entityType - Entitätstyp
   * @param {string} entityId - Entitäts-ID
   * @param {string} reason - Grund für Löschung
   * @param {string} user - Benutzer
   */
  static delete(entityType, entityId, reason, user = 'admin') {
    const archiveEntry = {
      id: 'arch_' + Date.now(),
      entityType: entityType,
      entityId: entityId,
      action: 'hard_delete',
      reason: reason,
      timestamp: new Date().toISOString(),
      user: user
    };

    // Entität löschen
    this.performHardDelete(entityType, entityId);

    // Archiv-Eintrag speichern
    storage.saveArchiveEntry(archiveEntry);
  }

  /**
   * Führt Hard Delete durch
   * @param {string} entityType - Entitätstyp
   * @param {string} entityId - Entitäts-ID
   */
  static performHardDelete(entityType, entityId) {
    switch (entityType) {
      case 'address':
        storage.deleteAddress(entityId);
        break;
      case 'document':
        storage.deleteDocument(entityId);
        // Workflow löschen
        const workflow = WorkflowService.getByDocumentId(entityId);
        if (workflow) {
          WorkflowService.delete(workflow.id);
        }
        break;
      case 'cashbook':
        storage.deleteCashbookEntry(entityId);
        break;
    }
  }

  /**
   * Anonymisiert personenbezogene Daten
   * @param {string} addressId - Adress-ID
   * @param {string} reason - Grund
   * @param {string} user - Benutzer
   */
  static anonymize(addressId, reason, user = 'admin') {
    const address = storage.getAddressById(addressId);
    if (!address) return;

    const archiveEntry = {
      id: 'arch_' + Date.now(),
      entityType: 'address',
      entityId: addressId,
      action: 'anonymize',
      reason: reason,
      timestamp: new Date().toISOString(),
      user: user
    };

    // Daten anonymisieren
    address.name = 'Anonymisiert';
    address.street = '';
    address.phone = '';
    address.email = '';
    address.anonymized = true;
    address.archiveStatus = 'archived';
    address.archiveDate = new Date().toISOString();

    storage.saveAddress(address);
    storage.saveArchiveEntry(archiveEntry);
  }

  /**
   * Prüft Aufbewahrungsfristen und führt automatische Löschungen durch
   */
  static checkRetention() {
    const settings = storage.getSettings();
    const now = new Date();

    // Adressen prüfen
    const addresses = storage.getAddresses().filter(a => !a.archiveStatus);
    addresses.forEach(address => {
      const created = new Date(address.createdAt);
      const yearsSinceCreation = (now - created) / (1000 * 60 * 60 * 24 * 365);

      if (yearsSinceCreation > settings.retentionPeriods.addresses) {
        this.archive('address', address.id, 'Aufbewahrungsfrist abgelaufen');
      }

      // DSGVO-Automatische Anonymisierung
      if (settings.gdprSettings.autoAnonymize &&
          yearsSinceCreation > settings.gdprSettings.anonymizeAfterYears &&
          !address.anonymized) {
        this.anonymize(address.id, 'Automatische DSGVO-Anonymisierung');
      }
    });

    // Dokumente prüfen
    const documents = storage.getDocuments().filter(d => !d.archiveStatus);
    documents.forEach(document => {
      const created = new Date(document.createdAt);
      const yearsSinceCreation = (now - created) / (1000 * 60 * 60 * 24 * 365);
      const retentionPeriod = document.type === 'invoice' ?
        settings.retentionPeriods.invoices : settings.retentionPeriods.contracts;

      if (yearsSinceCreation > retentionPeriod) {
        this.archive('document', document.id, 'Aufbewahrungsfrist abgelaufen');
      }
    });

    // Archivierte Entitäten auf Hard Delete prüfen (nach zusätzlichen 2 Jahren)
    const archiveEntries = storage.getArchive();
    archiveEntries.forEach(entry => {
      const archived = new Date(entry.timestamp);
      const yearsSinceArchive = (now - archived) / (1000 * 60 * 60 * 24 * 365);

      if (yearsSinceArchive > 2) {
        this.delete(entry.entityType, entry.entityId, 'Archivfrist abgelaufen');
      }
    });
  }

  /**
   * Gibt alle Archiv-Einträge zurück
   * @return {Array} Archiv-Einträge
   */
  static getAll() {
    return storage.getArchive();
  }

  /**
   * Gibt Archiv-Einträge für eine Entität zurück
   * @param {string} entityType - Entitätstyp
   * @param {string} entityId - Entitäts-ID
   * @return {Array} Archiv-Einträge
   */
  static getForEntity(entityType, entityId) {
    return storage.getArchive().filter(
      entry => entry.entityType === entityType && entry.entityId === entityId
    );
  }

  /**
   * Stellt eine archivierte Entität wieder her
   * @param {string} entityType - Entitätstyp
   * @param {string} entityId - Entitäts-ID
   */
  static restore(entityType, entityId) {
    switch (entityType) {
      case 'address':
        const address = storage.getAddressById(entityId);
        if (address) {
          address.archiveStatus = null;
          address.archiveDate = null;
          storage.saveAddress(address);
        }
        break;
      case 'document':
        const document = storage.getDocumentById(entityId);
        if (document) {
          document.archiveStatus = null;
          document.archiveDate = null;
          storage.saveDocument(document);
        }
        break;
    }
  }
}