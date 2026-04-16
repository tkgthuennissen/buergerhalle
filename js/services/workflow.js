/**
 * workflow.js - Workflow-Service
 *
 * Verwaltet State-Maschinen für Dokumente.
 */

class WorkflowService {
  // Definition der Workflow-Zustände
  static WORKFLOW_DEFINITIONS = {
    contract: {
      draft: { next: ['confirmed'], editable: true },
      confirmed: { next: ['signed'], editable: false },
      signed: { next: ['paid'], editable: false },
      paid: { next: ['completed'], editable: false },
      completed: { next: [], editable: false }
    },
    invoice: {
      created: { next: ['paid'], editable: true },
      paid: { next: ['completed'], editable: false },
      completed: { next: [], editable: false }
    }
  };

  /**
   * Erstellt einen neuen Workflow für ein Dokument
   * @param {string} documentId - Dokument-ID
   * @param {string} documentType - 'contract' oder 'invoice'
   * @return {Object} Workflow-Objekt
   */
  static create(documentId, documentType) {
    const workflow = {
      id: 'wf_' + documentId,
      documentId: documentId,
      currentState: documentType === 'contract' ? 'draft' : 'created',
      states: this.WORKFLOW_DEFINITIONS[documentType],
      transitions: [{
        from: null,
        to: documentType === 'contract' ? 'draft' : 'created',
        timestamp: new Date().toISOString(),
        user: 'system'
      }]
    };
    return workflow;
  }

  /**
   * Lädt einen Workflow
   * @param {string} id - Workflow-ID
   * @return {Object|null} Workflow oder null
   */
  static getById(id) {
    return storage.getWorkflowById(id);
  }

  /**
   * Lädt Workflow für ein Dokument
   * @param {string} documentId - Dokument-ID
   * @return {Object|null} Workflow oder null
   */
  static getByDocumentId(documentId) {
    return storage.getWorkflows().find(w => w.documentId === documentId) || null;
  }

  /**
   * Prüft, ob ein Statusübergang möglich ist
   * @param {string} documentId - Dokument-ID
   * @param {string} newStatus - Neuer Status
   * @return {boolean} True wenn Übergang möglich
   */
  static canTransition(documentId, newStatus) {
    const workflow = this.getByDocumentId(documentId);
    if (!workflow) return false;

    const currentState = workflow.currentState;
    const allowedNext = workflow.states[currentState]?.next || [];
    return allowedNext.includes(newStatus);
  }

  /**
   * Führt einen Statusübergang durch
   * @param {string} documentId - Dokument-ID
   * @param {string} newStatus - Neuer Status
   * @param {string} user - Benutzer (optional)
   * @return {boolean} True bei Erfolg
   */
  static changeStatus(documentId, newStatus, user = 'admin') {
    if (!this.canTransition(documentId, newStatus)) {
      throw new Error(`Ungültiger Statusübergang zu ${newStatus}`);
    }

    const workflow = this.getByDocumentId(documentId);
    if (!workflow) {
      throw new Error('Workflow nicht gefunden');
    }

    // Übergang hinzufügen
    workflow.transitions.push({
      from: workflow.currentState,
      to: newStatus,
      timestamp: new Date().toISOString(),
      user: user
    });

    workflow.currentState = newStatus;
    storage.saveWorkflow(workflow);

    // Dokument aktualisieren
    const document = storage.getDocumentById(documentId);
    if (document) {
      document.status = newStatus;
      document.workflowHistory.push({
        status: newStatus,
        timestamp: new Date().toISOString(),
        user: user
      });

      // Bei bestimmten Übergängen zusätzliche Aktionen
      if (newStatus === 'paid') {
        this.handlePayment(document);
      }
      if (newStatus === 'completed') {
        this.handleCompletion(document);
      }

      storage.saveDocument(document);
    }

    return true;
  }

  /**
   * Behandelt Zahlungseingang (erzeugt Kassenbucheintrag)
   * @param {Object} document - Dokument
   */
  static handlePayment(document) {
    if (document.paymentMethod === 'cash') {
      const cashEntry = {
        id: 'cash_' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        type: 'income',
        amount: document.total,
        description: `Zahlung ${document.documentNumber}`,
        documentId: document.id,
        createdAt: new Date().toISOString()
      };
      storage.saveCashbookEntry(cashEntry);
    }
  }

  /**
   * Behandelt Abschluss (setzt PDF-Hash für Revisionssicherheit)
   * @param {Object} document - Dokument
   */
  static handleCompletion(document) {
    // Hier würde der PDF-Hash berechnet werden
    // Für Demo-Zwecke ein Platzhalter
    document.pdfHash = 'sha256_' + Date.now();
  }

  /**
   * Gibt den Workflow-Verlauf zurück
   * @param {string} documentId - Dokument-ID
   * @return {Array} Verlauf
   */
  static getHistory(documentId) {
    const workflow = this.getByDocumentId(documentId);
    return workflow ? workflow.transitions : [];
  }

  /**
   * Prüft, ob ein Dokument editierbar ist
   * @param {string} documentId - Dokument-ID
   * @return {boolean} True wenn editierbar
   */
  static isEditable(documentId) {
    const workflow = this.getByDocumentId(documentId);
    if (!workflow) return true; // Fallback für alte Dokumente

    return workflow.states[workflow.currentState]?.editable || false;
  }

  /**
   * Speichert einen Workflow
   * @param {Object} workflow - Workflow-Objekt
   */
  static save(workflow) {
    storage.saveWorkflow(workflow);
  }

  /**
   * Löscht einen Workflow
   * @param {string} id - Workflow-ID
   */
  static delete(id) {
    storage.deleteWorkflow(id);
  }
}