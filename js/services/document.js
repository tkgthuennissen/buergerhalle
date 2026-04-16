/**
 * services/document.js - Dokument-Service
 * 
 * Verwaltung von:
 * - Verträgen (aus Buchungen)
 * - Rechnungen (aus Buchungen oder manuell)
 */

class DocumentService {
  /**
   * Erstellt einen neuen Vertrag aus einer Buchung
   * @param {string} bookingId
   * @return {Object} Neues Vertrags-Objekt
   */
  static createContractFromBooking(bookingId) {
    const booking = storage.getBookingById(bookingId);
    if (!booking) throw new Error('Buchung nicht gefunden');

    const documentNumber = NumberingService.generateContractNumber();
    const items = this.buildItemsFromBooking(booking);

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);

    return {
      id: 'doc_' + AddressService.generateUUID(),
      type: 'contract',
      documentNumber,
      bookingId,
      addressId: booking.addressId,
      eventDate: booking.eventDate,
      documentDate: new Date().toISOString().split('T')[0],
      items,
      subtotal,
      tax: 0,
      total: subtotal,
      paymentMethod: null,
      status: 'created', // "created" | "sent" | "paid" | "cancelled"
      templateId: 'tmpl_contract_1',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Erstellt eine neue Rechnung aus einer Buchung
   * @param {string} bookingId
   * @param {string} paymentMethod - "bank_transfer" | "cash"
   * @return {Object} Neues Rechnungs-Objekt
   */
  static createInvoiceFromBooking(bookingId, paymentMethod) {
    const booking = storage.getBookingById(bookingId);
    if (!booking) throw new Error('Buchung nicht gefunden');

    const documentNumber = NumberingService.generateInvoiceNumber();
    const items = this.buildItemsFromBooking(booking);

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);

    const document = {
      id: 'doc_' + AddressService.generateUUID(),
      type: 'invoice',
      documentNumber,
      bookingId,
      addressId: booking.addressId,
      eventDate: booking.eventDate,
      documentDate: new Date().toISOString().split('T')[0],
      items,
      subtotal,
      tax: 0,
      total: subtotal,
      paymentMethod, // "bank_transfer" | "cash"
      status: 'created',
      templateId: 'tmpl_invoice_1',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return document;
  }

  /**
   * Erstellt eine manuelle Rechnung (ohne Buchungsbezug)
   * @param {string} addressId
   * @param {Array} items - [{description, quantity, unitPrice}]
   * @param {string} paymentMethod - "bank_transfer" | "cash"
   * @return {Object} Neues Rechnungs-Objekt
   */
  static createManualInvoice(addressId, items, paymentMethod) {
    if (!addressId) throw new Error('Adresse erforderlich');

    const documentNumber = NumberingService.generateInvoiceNumber();
    const formattedItems = items.map(item => ({
      description: item.description,
      quantity: item.quantity || 1,
      unitPrice: parseFloat(item.unitPrice) || 0,
      total: (item.quantity || 1) * (parseFloat(item.unitPrice) || 0)
    }));

    const subtotal = formattedItems.reduce((sum, item) => sum + item.total, 0);

    return {
      id: 'doc_' + AddressService.generateUUID(),
      type: 'invoice',
      documentNumber,
      bookingId: null,
      addressId,
      eventDate: null,
      documentDate: new Date().toISOString().split('T')[0],
      items: formattedItems,
      subtotal,
      tax: 0,
      total: subtotal,
      paymentMethod,
      status: 'created',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Speichert ein Dokument
   * Kassenbuch-Einträge werden nur erstellt, wenn die Rechnung als bezahlt markiert wird
   * 
   * @param {Object} document
   */
  static save(document) {
    document.updatedAt = new Date().toISOString();
    storage.saveDocument(document);
  }

  /**
   * Löscht ein Dokument
   * Entfernt auch zugehörige Kassenbuch-Einträge
   * 
   * @param {string} id
   */
  static delete(id) {
    const document = storage.getDocumentById(id);
    if (document) {
      // Kassenbuch-Einträge entfernen
      CashbookService.deleteByDocumentId(document.id);
    }
    storage.deleteDocument(id);
  }

  /**
   * Gibt ein Dokument per ID zurück
   * @param {string} id
   * @return {Object|null}
   */
  static getById(id) {
    return storage.getDocumentById(id);
  }

  /**
   * Gibt alle Dokumente zurück
   * @return {Array}
   */
  static getAll() {
    return storage.getDocuments();
  }

  /**
   * Gibt alle Verträge zurück
   * @return {Array}
   */
  static getContracts() {
    return this.getAll().filter(d => d.type === 'contract');
  }

  /**
   * Gibt alle Rechnungen zurück
   * @return {Array}
   */
  static getInvoices() {
    return this.getAll().filter(d => d.type === 'invoice');
  }

  /**
   * Konvertiert Buchungs-Daten in Rechnungs-Positionen
   * @param {Object} booking
   * @return {Array} Positionen mit {description, quantity, unitPrice, total}
   */
  static buildItemsFromBooking(booking) {
    const items = [];
    const additionalItems = Array.isArray(booking.additionalItems) ? booking.additionalItems : [];

    // Paket als erste Position
    const packageArticle = storage.getArticleById(booking.packageId);
    if (packageArticle) {
      items.push({
        description: packageArticle.name,
        quantity: 1,
        unitPrice: packageArticle.unitPrice,
        total: packageArticle.unitPrice
      });
    }

    // Zusatzartikel
    for (const addItem of additionalItems) {
      const article = storage.getArticleById(addItem.itemId);
      if (article) {
        items.push({
          description: article.name,
          quantity: addItem.quantity || 1,
          unitPrice: article.unitPrice,
          total: (addItem.quantity || 1) * article.unitPrice
        });
      }
    }

    return items;
  }

  /**
   * Ändert den Status eines Dokuments
   * Erlaubte Übergänge:
   * - created → sent | cancelled
   * - sent → paid | cancelled
   * - paid: kein Übergang
   * - cancelled: kein Übergang
   * 
   * @param {string} documentId
   * @param {string} newStatus
   */
  static changeStatus(documentId, newStatus) {
    const document = this.getById(documentId);
    if (!document) throw new Error('Dokument nicht gefunden');

    const validTransitions = {
      'created': ['sent', 'cancelled'],
      'sent': ['paid', 'cancelled'],
      'paid': [],
      'cancelled': []
    };

    if (!validTransitions[document.status]?.includes(newStatus)) {
      throw new Error(
        `Ungültiger Statusübergang: ${document.status} → ${newStatus}`
      );
    }

    document.status = newStatus;
    this.save(document);
  }
}
