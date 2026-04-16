/**
 * workflow-controller.js - Workflow-Controller
 *
 * Verwaltet die Workflow-Übersicht-Seite.
 */

class WorkflowController {
  static init() {
    this.bindEvents();
    this.loadWorkflows();
  }

  static bindEvents() {
    // Status ändern
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('change-status-btn')) {
        const documentId = e.target.dataset.documentId;
        const newStatus = e.target.dataset.newStatus;
        this.changeStatus(documentId, newStatus);
      }
    });

    // Workflow-Verlauf anzeigen
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('show-history-btn')) {
        const documentId = e.target.dataset.documentId;
        this.showHistory(documentId);
      }
    });
  }

  static loadWorkflows() {
    const documents = storage.getDocuments().filter(doc => !doc.archiveStatus);
    const workflows = storage.getWorkflows();
    const container = document.getElementById('workflows-list');

    if (!container) return;

    const workflowItems = documents.map(document => {
      const workflow = workflows.find(w => w.documentId === document.id);
      if (!workflow) return '';

      const currentState = workflow.currentState;
      const nextStates = workflow.states[currentState]?.next || [];

      return `
        <div class="workflow-item">
          <h3>${document.documentNumber} - ${document.type === 'contract' ? 'Vertrag' : 'Rechnung'}</h3>
          <p>Kunde: ${this.getAddressName(document.addressId)}</p>
          <p>Aktueller Status: <strong>${this.translateStatus(currentState)}</strong></p>
          <p>Editierbar: ${WorkflowService.isEditable(document.id) ? 'Ja' : 'Nein'}</p>
          <div class="workflow-actions">
            ${nextStates.map(status => `
              <button class="btn btn-primary change-status-btn"
                      data-document-id="${document.id}"
                      data-new-status="${status}">
                → ${this.translateStatus(status)}
              </button>
            `).join('')}
            <button class="btn btn-secondary show-history-btn" data-document-id="${document.id}">
              Verlauf anzeigen
            </button>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = workflowItems;
  }

  static changeStatus(documentId, newStatus) {
    try {
      WorkflowService.changeStatus(documentId, newStatus);
      this.loadWorkflows();
      alert('Status erfolgreich geändert');
    } catch (error) {
      alert('Fehler: ' + error.message);
    }
  }

  static showHistory(documentId) {
    const history = WorkflowService.getHistory(documentId);
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>Workflow-Verlauf</h3>
        <div class="history-list">
          ${history.map(transition => `
            <div class="history-item">
              <strong>${this.translateStatus(transition.to)}</strong>
              <br>
              <small>${new Date(transition.timestamp).toLocaleString('de-DE')} - ${transition.user}</small>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Schließen</button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  static translateStatus(status) {
    const translations = {
      draft: 'Entwurf',
      confirmed: 'Bestätigt',
      signed: 'Unterschrieben',
      paid: 'Bezahlt',
      completed: 'Abgeschlossen',
      created: 'Erstellt'
    };
    return translations[status] || status;
  }

  static getAddressName(addressId) {
    const address = storage.getAddressById(addressId);
    return address ? address.name : 'Unbekannt';
  }
}

// Initialisierung beim Laden der Seite
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('workflows-list')) {
    WorkflowController.init();
  }
});