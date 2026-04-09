# Service-API Dokumentation

Diese Datei dokumentiert die öffentliche API aller Services. Alle Services sind statische Klassen und verwenden `storage` als zentrale Datenverwaltung.

## 📍 AddressService

Verwaltung von Adressen (Personen, Vereine, Unternehmen).

```javascript
// Adresse erstellen
const addr = AddressService.create({
  type: 'person', // | 'association' | 'company'
  name: 'Max Mustermann',
  street: 'Musterstr. 42',
  zipCode: '12345',
  city: 'Musterstadt',
  phone: '+49 123 456789',
  email: 'max@example.com',
  notes: 'VIP-Kunde'
});

// Speichern
AddressService.save(addr);

// Laden
const id = addr.id;
AddressService.getById(id);
AddressService.getAll(); // Alle Adressen

// Suchen
AddressService.search('Muster');

// Format
AddressService.format(id); // Mehrzeilige Adresse

// Löschen
AddressService.delete(id);

// Validierung
const { valid, errors } = AddressService.validate(addr);
```

---

## 📦 ArticleService

Verwaltung von Paketen und Einzelartikeln.

```javascript
// PAKETE

// Paket erstellen
const pkg = ArticleService.createPackage({
  name: '3-Tage-Paket',
  description: 'Anmietung für 3 Tage',
  unitPrice: 500,
  timeLogic: {
    beginOffsetDays: -1,
    beginOffsetHours: 18,
    endOffsetDays: 1,
    endOffsetHours: 11
  }
});

// Speichern & Laden
ArticleService.save(pkg);
const pkg2 = ArticleService.getById(pkg.id);
ArticleService.getPackages(); // Alle Pakete

// EINZELARTIKEL

// Artikel erstellen
const item = ArticleService.createItem({
  name: 'Reinigung',
  description: 'Grundreinigung',
  unitPrice: 150
});

ArticleService.save(item);
ArticleService.getItems(); // Alle Einzelartikel

// ZEITBERECHNUNG (nur für Pakete)

// Bei Veranstaltung am Freitag 15.6. mit 3-Tage-Paket:
// → Beginn: Donnerstag 14.6. 18:00
// → Ende: Samstag 16.6. 11:00

const dates = ArticleService.calculatePackageDates(pkg, '2026-06-15');
// {
//   beginDateTime: '2026-06-14T18:00:00.000Z',
//   endDateTime: '2026-06-16T11:00:00.000Z'
// }

// Löschen
ArticleService.delete(pkg.id);
```

---

## 🎫 BookingService

Verwaltung von Buchungen mit automatischer Überschneidungsprüfung.

```javascript
// Buchung erstellen
const booking = BookingService.create({
  addressId: 'addr_123',
  packageId: 'pkg_3day',
  eventDate: '2026-06-15',
  additionalItems: [
    { itemId: 'art_cleaning', quantity: 1 },
    { itemId: 'art_sound', quantity: 2 }
  ],
  notes: 'Business-Event'
});

// Speichern (mit Validierung & Überschneidungsprüfung)
try {
  BookingService.save(booking);
} catch (error) {
  console.error(error.message); // z.B. "Diese Buchung überschneidet sich..."
}

// Laden
BookingService.getById(id);
BookingService.getAll();
BookingService.getActive(); // Nur nicht stornierte

// Nach Zeitraum filtern
BookingService.getByMonth(6, 2026); // Juni 2026
BookingService.getByDate('2026-06-15');

// Berechnung
const total = BookingService.calculateTotal(booking);

// Löschen
BookingService.delete(id);

// Validierung
const { valid, errors } = BookingService.validate(booking);
```

---

## 🔤 NumberingService

Zentrale Verwaltung aller Dokumentennummern (nicht-manipulierbar, keine Lücken).

```javascript
// RECHNUNGEN

// Neue Nummer generieren
const invoiceNo1 = NumberingService.generateInvoiceNumber(); // R-2026-0001
const invoiceNo2 = NumberingService.generateInvoiceNumber(); // R-2026-0002

// Für anderes Jahr
const oldYear = NumberingService.generateInvoiceNumber(2025); // R-2025-0001

// Vorschau (ohne zu inkrementieren)
const nextNo = NumberingService.peekNextInvoiceNumber(); // R-2026-0003

// VERTRÄGE

const contractNo = NumberingService.generateContractNumber(); // V-2026-0001
const nextNo = NumberingService.peekNextContractNumber(); // V-2026-0002
```

---

## 📄 DocumentService

Verwaltung von Verträgen und Rechnungen.

```javascript
// VERTRÄGE AUS BUCHUNGEN

const contract = DocumentService.createContractFromBooking('booking_123');
DocumentService.save(contract);

// RECHNUNGEN AUS BUCHUNGEN

const invoice = DocumentService.createInvoiceFromBooking('booking_123', 'bank_transfer');
// paymentMethod: "bank_transfer" | "cash"
//   → "cash" erzeugt automatischen Kassenbuch-Eintrag!

DocumentService.save(invoice);

// MANUELLE RECHNUNGEN (ohne Buchungsbezug)

const manualInvoice = DocumentService.createManualInvoice(
  'addr_456', // addressId
  [
    { description: 'Miete + Ausstattung', quantity: 1, unitPrice: 800 },
    { description: 'Getränke', quantity: 1, unitPrice: 250 }
  ],
  'cash' // paymentMethod
);

DocumentService.save(manualInvoice);

// LADEN & LÖSCHEN

DocumentService.getById(id);
DocumentService.getAll();
DocumentService.getContracts();
DocumentService.getInvoices();

DocumentService.delete(id); // Entfernt auch Kassenbuch-Einträge!

// STATUSÜBERGÄNGE

// created → sent || cancelled
// sent → paid || cancelled
DocumentService.changeStatus(docId, 'sent');
DocumentService.changeStatus(docId, 'paid');
```

---

## 💳 CashbookService

Verwaltung von Einnahmen und Ausgaben (automatisch bei Bar-Rechnungen).

```javascript
// MANUELLE EINNTRÄNGE

CashbookService.addIncome('2026-04-09', 500, 'Buchung Nr. 123', 'doc_uuid');
CashbookService.addExpense('2026-04-10', 100, 'Nebenkosten');

// Automatisch erstellt bei DocumentService.save() mit paymentMethod: 'cash'

// LADEN & ABFRAGEN

CashbookService.getAll(); // Sortiert nach Datum
CashbookService.getById(id);
CashbookService.getByDateRange('2026-04-01', '2026-04-30');

// BERECHNUNGEN

CashbookService.calculateBalance(); // Gesamtsaldo
CashbookService.calculateBalanceUpTo('2026-04-15'); // Saldo bis zu Datum
CashbookService.getTotalIncome();
CashbookService.getTotalExpense();

// VERWALTUNG

CashbookService.delete(id);
CashbookService.deleteByDocumentId(docId); // Bei Rechnung-Löschung
```

---

## 💾 Storage

Zentrale Datenverwaltung (automatisch beim App-Start)

```javascript
// Storage ist globale Instanz: window.storage

// LADEN/SPEICHERN

storage.load(); // Beim Start automatisch
storage.save(); // Nach Änderungen automatisch

// GETTER (für alle Datentypen)

storage.getAddresses();
storage.getAddressById(id);
storage.getArticles();
storage.getPackages();
storage.getItems();
storage.getArticleById(id);
storage.getBookings();
storage.getBookingById(id);
storage.getDocuments();
storage.getDocumentById(id);
storage.getCashbook();
storage.getNumbering();

// SETTER (speichern automatisch)

storage.saveAddress(address);
storage.saveArticle(article);
storage.saveBooking(booking);
storage.saveDocument(document);
storage.saveCashbookEntry(entry);
storage.saveNumbering(numObj);

// LÖSCHEN

storage.deleteAddress(id);
storage.deleteArticle(id);
storage.deleteBooking(id);
storage.deleteDocument(id);

// BACKUP/RESTORE

const json = storage.exportAsJSON();
storage.importFromJSON(json);
storage.reset(); // Löscht ALLES (mit Bestätigung)
```

---

## 🎯 App (Globale Utility-Funktionen)

```javascript
// NOTIFICATIONS

App.showNotification('Text', 'success'); // | 'error' | 'info'
App.showNotification('Text', 'error', 5000); // Custom duration

// FORMATIERUNG

App.formatDate('2026-06-15'); // '15.06.2026'
App.formatDate('2026-06-15T18:00:00Z', true); // '15.06.2026, 18:00'
App.formatCurrency(500); // '500,00 EUR'

// VALIDIERUNG

App.validateEmail('max@example.com'); // true/false

// MODAL DIALOGE

App.openModal('Titel', '<p>HTML-Inhalt</p>', [
  { label: 'Abbrechen', action: 'cancel', class: 'btn-outline' },
  { label: 'OK', action: 'ok', class: 'btn-primary', callback: () => { /* ... */ } }
]);

// BUTTON STATES

App.lockButton(btnElement); // Disabled + loading-Klasse
App.unlockButton(btnElement);

// DATEN-IMPORT/EXPORT

App.exportData(); // Download JSON
App.importData(); // Upload JSON

// INITIALISIERUNG

App.init(); // Beim Start automatisch
App.setupNavigation(); // Sidebar highlight
App.getCurrentPage(); // z.B. 'addresses'
```

---

## 🔄 Workflow-Beispiel

```javascript
// 1. Adresse erstellen
const addr = AddressService.create({
  name: 'Musterfirma GmbH',
  type: 'company',
  street: 'Musterstr. 1',
  zipCode: '10115',
  city: 'Berlin',
  email: 'kontakt@musterfirma.de'
});
AddressService.save(addr);

// 2. Buchung erstellen
const booking = BookingService.create({
  addressId: addr.id,
  packageId: 'pkg_3day',
  eventDate: '2026-06-15',
  additionalItems: [
    { itemId: 'art_cleaning', quantity: 1 }
  ]
});
BookingService.save(booking);

// 3. Vertrag generieren
const contract = DocumentService.createContractFromBooking(booking.id);
DocumentService.save(contract);

// 4. Rechnung generieren (mit Bar-Zahlung)
const invoice = DocumentService.createInvoiceFromBooking(booking.id, 'cash');
DocumentService.save(invoice);
// → Kassenbuch-Eintrag wird automatisch erstellt!

// 5. Kassenbuch abfragen
const balance = CashbookService.calculateBalance();
console.log('Saldo:', App.formatCurrency(balance));
```
