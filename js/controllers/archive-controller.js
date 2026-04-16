/**
 * archive-controller.js - Archiv-Controller
 *
 * Verwaltet die Archivierungs-Seite.
 */

class ArchiveController {
  static init() {
    this.bindEvents();
    this.loadArchive();
  }

  static bindEvents() {
    // Archiv-Einträge filtern
    document.getElementById('filter-archived')?.addEventListener('change', () => {
      this.loadArchive();
    });

    // Entität archivieren
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('archive-btn')) {
        const entityType = e.target.dataset.type;
        const entityId = e.target.dataset.id;
        this.archiveEntity(entityType, entityId);
      }
    });

    // Entität wiederherstellen
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('restore-btn')) {
        const entityType = e.target.dataset.type;
        const entityId = e.target.dataset.id;
        this.restoreEntity(entityType, entityId);
      }
    });

    // Entität löschen
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-btn')) {
        const entityType = e.target.dataset.type;
        const entityId = e.target.dataset.id;
        this.deleteEntity(entityType, entityId);
      }
    });

    // Aufbewahrungsfristen prüfen
    document.getElementById('check-retention-btn')?.addEventListener('click', () => {
      ArchiveService.checkRetention();
      this.loadArchive();
      alert('Aufbewahrungsfristen geprüft');
    });
  }

  static loadArchive() {
    const showArchived = document.getElementById('filter-archived')?.checked;
    const archiveEntries = ArchiveService.getAll();
    const container = document.getElementById('archive-list');

    if (!container) return;

    let items = [];

    // Aktive Entitäten (für Archivierung)
    if (!showArchived) {
      const addresses = storage.getAddresses().filter(a => !a.archiveStatus);
      const documents = storage.getDocuments().filter(d => !d.archiveStatus);

      items = [
        ...addresses.map(addr => ({
          type: 'address',
          id: addr.id,
          name: `${addr.name} (${addr.type})`,
          createdAt: addr.createdAt,
          action: 'archive'
        })),
        ...documents.map(doc => ({
          type: 'document',
          id: doc.id,
          name: `${doc.documentNumber} (${doc.type})`,
          createdAt: doc.createdAt,
          action: 'archive'
        }))
      ];
    } else {
      // Archivierte Entitäten
      items = archiveEntries.map(entry => {
        let name = '';
        switch (entry.entityType) {
          case 'address':
            const addr = storage.getAddressById(entry.entityId);
            name = addr ? `${addr.name} (${addr.type})` : 'Gelöscht';
            break;
          case 'document':
            const doc = storage.getDocumentById(entry.entityId);
            name = doc ? `${doc.documentNumber} (${doc.type})` : 'Gelöscht';
            break;
        }

        return {
          type: entry.entityType,
          id: entry.entityId,
          name,
          action: entry.action,
          timestamp: entry.timestamp,
          reason: entry.reason,
          archived: true
        };
      });
    }

    container.innerHTML = items.map(item => `
      <div class="archive-item">
        <h4>${item.name}</h4>
        <p>Typ: ${item.type}</p>
        ${item.archived ? `
          <p>Aktion: ${this.translateAction(item.action)}</p>
          <p>Grund: ${item.reason}</p>
          <p>Datum: ${new Date(item.timestamp).toLocaleString('de-DE')}</p>
          <div class="archive-actions">
            <button class="btn btn-secondary restore-btn" data-type="${item.type}" data-id="${item.id}">Wiederherstellen</button>
            <button class="btn btn-danger delete-btn" data-type="${item.type}" data-id="${item.id}">Endgültig löschen</button>
          </div>
        ` : `
          <p>Erstellt: ${new Date(item.createdAt).toLocaleString('de-DE')}</p>
          <div class="archive-actions">
            <button class="btn btn-warning archive-btn" data-type="${item.type}" data-id="${item.id}">Archivieren</button>
          </div>
        `}
      </div>
    `).join('');
  }

  static archiveEntity(entityType, entityId) {
    const reason = prompt('Grund für Archivierung:');
    if (!reason) return;

    ArchiveService.archive(entityType, entityId, reason);
    this.loadArchive();
  }

  static restoreEntity(entityType, entityId) {
    ArchiveService.restore(entityType, entityId);
    this.loadArchive();
  }

  static deleteEntity(entityType, entityId) {
    const reason = prompt('Grund für endgültige Löschung:');
    if (!reason) return;

    if (confirm('Diese Aktion kann nicht rückgängig gemacht werden. Fortfahren?')) {
      ArchiveService.delete(entityType, entityId, reason);
      this.loadArchive();
    }
  }

  static translateAction(action) {
    const translations = {
      soft_delete: 'Archiviert',
      hard_delete: 'Gelöscht',
      anonymize: 'Anonymisiert'
    };
    return translations[action] || action;
  }
}

// Initialisierung beim Laden der Seite
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('archive-list')) {
    ArchiveController.init();
  }
});