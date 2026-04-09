# 🏛️ Bürgerhalle-Verwaltung

Eine **modulare, statische Webanwendung** zur Verwaltung der Vermietung einer Veranstaltungshalle. Vollständig in **Vanilla JavaScript, HTML und CSS** ohne externe Dependencies – optimiert für **GitHub Pages** Deployment.

---

## 🎯 Features

✅ **Adressverwaltung** - Kunden, Vereine, Unternehmen mit Kontaktdaten  
✅ **Artikelverwaltung** - Pakete mit zeitlicher Logik + Einzelartikel  
✅ **Buchungen** - Mit automatischer Überschneidungsprüfung  
✅ **Buchungskalender** - Monatsübersicht mit Klick-Navigation  
✅ **Dokumente** - Verträge und Rechnungen aus Buchungen  
✅ **Manuelle Rechnungen** - Ohne Buchungsbezug  
✅ **Kassenbuch** - Einnahmen/Ausgaben mit Saldoermittlung  
✅ **Nummernkreise** - Konsekutive, fehlerfreie Nummerierung pro Jahr  
✅ **Daten-Backup/Restore** - JSON-Import/Export  
✅ **Responsive Design** - Desktop, Tablet, Mobile  

---

## 📋 Voraussetzungen

- Moderner Webbrowser (Chrome, Firefox, Safari, Edge)
- Git (für Deployment auf GitHub Pages)
- Kein Server, kein Backend erforderlich

---

## 🚀 Installation

### Option 1: Lokal testen

```bash
# Repository klonen oder in VS Code öffnen
cd buergerhalle

# Einfachen HTTP-Server starten
python3 -m http.server 8000

# Im Browser aufrufen
# http://localhost:8000
```

### Option 2: Auf GitHub Pages deployen

```bash
# Repository initialisieren
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/IHR_USERNAME/buergerhalle.git
git push -u origin main

# In GitHub Settings → Pages
# - Branch: main
# - Folder: / (root)
# → App erreichbar unter: https://ihr_username.github.io/buergerhalle/
```

Siehe [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) für Detail.

---

## 📂 Projektstruktur

```
buergerhalle/
├── index.html                    # Startseite (Dashboard)
├── pages/                        # HTML-Seiten
│   ├── addresses.html            # Adressverwaltung
│   ├── articles.html             # Artikel / Pakete
│   ├── calendar.html             # Buchungskalender
│   ├── bookings.html             # Buchungsübersicht
│   ├── booking-form.html         # Buchungsmaske
│   ├── documents.html            # Verträge & Rechnungen
│   ├── invoices.html             # Manuelle Rechnungen
│   └── cashbook.html             # Kassenbuch
├── js/
│   ├── app.js                    # App-Initialisierung & Utils
│   ├── storage.js                # Datenpersistierung (localStorage)
│   ├── services/                 # Business Logic
│   │   ├── address.js
│   │   ├── article.js
│   │   ├── booking.js
│   │   ├── document.js
│   │   ├── cashbook.js
│   │   └── numbering.js
│   └── controllers/              # UI Logic (pro Seite)
│       ├── address-controller.js
│       ├── article-controller.js
│       ├── calendar-controller.js
│       ├── booking-form-controller.js
│       ├── booking-list-controller.js
│       ├── document-controller.js
│       ├── invoice-controller.js
│       └── cashbook-controller.js
├── css/                          # Styling
│   ├── style.css                 # Globale Styles
│   ├── layout.css                # Layout & Navigation
│   └── components.css            # Komponenten
└── docs/
    ├── ARCHITECTURE.md           # Architektur-Übersicht
    ├── DATA-MODEL.md             # JSON-Schema
    ├── API.md                    # Service-API Dokumentation
    └── DEPLOYMENT.md             # GitHub Pages Setup
```

---

## 🏗️ Architektur

Die Anwendung folgt einer **strikten 3-Layer-Architektur**:

```
┌─────────────────────────────────────┐
│     UI-Layer (HTML/DOM Events)      │
│  - Formulare, Modal, Tabellen      │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│    Controller-Layer (Business Logic) │
│  - Event Handler, Formular-Logik   │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│      Service-Layer (Validierung)    │
│  - CRUD, Geschäftslogik            │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│    Storage-Layer (Persistierung)    │
│  - localStorage + JSON-Struktur    │
└─────────────────────────────────────┘
```

**Vorteile:**
- Testbarkeit: Services sind rein funktional
- Wartbarkeit: Klare Separation of Concerns
- Erweiterbarkeit: Neue Module folgen dem gleichen Pattern

---

## 💾 Datenspeicherung

Alles wird im Browser-`localStorage` als **ein JSON-Objekt** gespeichert:

```json
{
  "addresses": [ {...}, {...} ],
  "articles": [ {...}, {...} ],
  "bookings": [ {...}, {...} ],
  "documents": [ {...}, {...} ],
  "cashbook": [ {...}, {...} ],
  "numbering": { "invoices": { "2026": 1024 }, "contracts": { "2026": 43 } }
}
```

**Wichtig:**
- ✅ Daten sind **persistent** (überleben Browser-Neustart)
- ❌ Nicht synchronisiert zwischen Browsern/Geräten
- ❌ Verloren bei Löschen von Browser-Daten

→ **Regelmäßiges Backup empfohlen!** (Export-Button im Header)

---

## 🎯 Schnelleinstieg

### 1. Erste Adresse erstellen

1. Klick auf **Stammdaten → Adressen**
2. Klick auf **➕ Neue Adresse**
3. Formular ausfüllen
4. **Speichern**

### 2. Artikel/Pakete überprüfen

1. Gehen Sie zu **Stammdaten → Artikel**
2. Standard-Pakete ansehen (3-Tag, 5-Tag)
3. ggf. eigene Pakete/Artikel erstellen

### 3. Erste Buchung erstellen

**Option A: Aus dem Formular**
1. **Buchungen → Neue Buchung**
2. Adresse wählen
3. Veranstaltungsdatum eingeben
4. Paket wählen (→ Zeiten werden auto-berechnet)
5. Optional: Zusatzartikel hinzufügen
6. **Speichern**

**Option B: Aus dem Kalender**
1. **Buchungen → Buchungskalender**
2. Auf einen Tag klicken
3. → weiterleitung zu Buchungsmaske mit Datum vorausgefüllt

### 4. Dokumente erstellen

1. **Dokumente → Verträge & Rechnungen**
2. Verträge und Rechnungen aus den Buchungen generiert
3. Rechnungen mit "Bar"-Zahlart erzeugen automatisch Kassenbuch-Einträge

### 5. Finanzübersicht

1. **Finanzierung → Kassenbuch**
2. Alle Ein- und Ausgaben übersichtlich
3. Saldo automatisch berechnet

---

## 🔑 Wichtigste Konzepte

### Paket-Zeitlogik

**Problem:** Wie lange ist die Halle wirklich gemietet?

**Lösung:** Datengetriebene Zeitlogik pro Paket:

```javascript
// 3-Tage-Paket
{
  "name": "3-Tage-Paket",
  "timeLogic": {
    "beginOffsetDays": -1,      // 1 Tag VORHER
    "beginOffsetHours": 18,      // ab 18:00
    "endOffsetDays": 1,          // 1 Tag NACHHER
    "endOffsetHours": 11         // bis 11:00
  }
}
```

Wenn Veranstaltung am **Freitag 15. Juni**:
- Anfang: **Donnerstag 14. Juni 18:00**
- Ende: **Samstag 16. Juni 11:00**

→ Automatisch berechnet! Keine Hardcodierung!

### Überschneidungsprüfung

Zwei Buchungen **können sich nicht zeitlich überschneiden**. Das wird im `BookingService` auto-validiert:

```javascript
const booking = BookingService.create({...});
try {
  BookingService.save(booking); // Prüft Überschneidung!
} catch (error) {
  // "Diese Buchung überschneidet sich mit einer existierenden Buchung!"
}
```

### Nummernkreise

Rechnungen und Verträge bekommen **eindeutige Nummern pro Jahr**:

```
R-2026-0001 (erste Rechnung 2026)
R-2026-0002
R-2026-0003
...
V-2026-0001 (erster Vertrag 2026)
V-2026-0002
```

→ Keine Lücken, keine Dupllikate!

### Bar-Zahlungen → Kassenbuch

Wenn Sie eine Rechnung mit Zahlart **Bar** erstellen:

```javascript
DocumentService.save(invoice); // mit paymentMethod: 'cash'
// → automatisch Kassenbuch-Eintrag erstellt!
```

Überweisung-Rechnungen werden **nicht** automatisch ins Kassenbuch gebucht (müssen manuell ergänzt werden).

---

## 📚 Dokumentation

Detaillierte Dokumentation zu:

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Architektur & Design-Pattern
- **[docs/DATA-MODEL.md](docs/DATA-MODEL.md)** - JSON-Schema aller Datentypen
- **[docs/API.md](docs/API.md)** - Vollständige Service-API mit Beispielen
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - GitHub Pages Setup

---

## 💡 Beispiele

### Beispiel: Kompletter Workflow

```javascript
// 1. Adresse erstellen
const addr = AddressService.create({
  name: 'Event-Team GmbH',
  type: 'company',
  street: 'Musterstr. 42',
  zipCode: '10115',
  city: 'Berlin'
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
BookingService.save(booking); // Prüft Überschneidung!

// 3. Vertrag generieren
const contract = DocumentService.createContractFromBooking(booking.id);
DocumentService.save(contract);
// → Vertrag V-2026-0001 erstellt

// 4. Rechnung (mit Bar-Zahlung)
const invoice = DocumentService.createInvoiceFromBooking(booking.id, 'cash');
DocumentService.save(invoice);
// → Rechnung R-2026-0001 erstellt
// → Kassenbuch-Eintrag automatisch erstellt!

// 5. Finanzübersicht
const balance = CashbookService.calculateBalance();
console.log(`Saldo: ${App.formatCurrency(balance)}`);
// → "Saldo: 500,00 EUR"
```

---

## 🛠️ Erweitern & Anpassen

### Neue Seite hinzufügen

1. HTML-Datei in `pages/` erstellen (Kopie einer bestehenden)
2. Navigation in Sidebar vergessen nicht!
3. Controller in `js/controllers/` erstellen
4. Services nutzen für Datenoperationen

Beispiel-Template erhalten Sie bei bestehenden Seiten - folgen Sie dem Muster!

### Neue Artikel-Typen

```javascript
// Eigenes Paket-Modell
ArticleService.createPackage({
  name: 'Weekend-Paket (Freitag-Sonntag)',
  unitPrice: 600,
  timeLogic: {
    beginOffsetDays: 0,    // Freitag
    beginOffsetHours: 16,
    endOffsetDays: 2,      // Montag
    endOffsetHours: 10
  }
});
```

### Export-Funktion erweitern

In `docs/DEPLOYMENT.md` → PDF-Export mit `html2pdf.js` hinzufügen

---

## ⚙️ Konfiguration

### Standard-Artikel ändern

Editieren Sie `storage.js` → `initializeDefaultArticles()`:

```javascript
static initializeDefaultArticles() {
  return [
    // 3-Tag Paket (anpassbar)
    {
      id: 'pkg_3day',
      name: 'Mein 3-Tage-Paket',
      unitPrice: 600, // Preis ändern
      // ...
    },
    // ...
  ];
}
```

### Währung/Formatierung

In `app.js` → `formatCurrency()`:

```javascript
static formatCurrency(amount) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'  // oder 'CHF', 'USD', etc.
  }).format(amount);
}
```

### Nummernkreis-Format

In `numbering.js` → Schema bearbeiten:

```javascript
static generateInvoiceNumber(year) {
  // Aktuell: R-2026-0001
  // Ändern Sie diesen String für anderes Format
  return `R-${year}-${String(number).padStart(4, '0')}`;
}
```

---

## 🐛 Häufige Probleme

### "Daten sind weg!"

Wahrscheinlich wurde der Browser-Cache geleert. Wiederherstellen aus Backup:
1. Header → **📂 Import**
2. JSON-Datei auswählen

### "Fehler beim Laden der Daten"

localStorage ist beschädigt. In der Browser-Konsole ausführen:

```javascript
storage.reset();
```

### "Ich möchte die App offline nutzen"

Die App arbeitet **vollständig offline**! Einfach die HTML-Dateien lokal speichern und öffnen. Alle Daten bleiben im Browser.

### "Kann ich Daten zwischen zwei Computern synchronisieren?"

Nein, localStorage ist browser-local. Nutzen Sie den Export/Import für Daten zwischen Geräten:
1. Auf Computer A: **💾 Export**
2. Auf Computer B: **📂 Import**

---

## 📞 Support & Feedback

Für Bug-Reports oder Feature-Requests:
1. Öffnen Sie ein Issue auf GitHub
2. Beschreiben Sie das Problem detailliert
3. Wie zu reproduzieren?
4. Welche Browser/OS?

---

## 📄 Lizenz

Dieses Projekt steht unter der **MIT-Lizenz**.

---

## 🎉 Roadmap (Optionale Erweiterungen)

- [ ] PDF-Export für Rechnungen/Verträge (html2pdf.js)
- [ ] E-Mail-Integration (Rechnungen versenden)
- [ ] Multi-Language Support
- [ ] Dark Mode
- [ ] Mobile App (React Native / Flutter)
- [ ] Cloud-Sync Optional (Firebase/Supabase)
- [ ] Wiederholende Buchungen
- [ ] Rabatt-System
- [ ] Statistik-Dashboard

---

## 🏢 Made with ❤️ für Bürgerhallen und Veranstaltungsstätten

Viel Erfolg mit Ihrer Bürgerhalle-Verwaltung! 🏛️

---

**Version:** 1.0  
**Datum:** April 2026  
**Browser-Kompatibilität:** Chrome, Firefox, Safari, Edge (alle modernen Versionen)