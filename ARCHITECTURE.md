# Architektur der Bürgerhalle-Verwaltungs-Webapp

## 📋 Überblick

Diese Webapp verwaltet die Vermietung einer Veranstaltungshalle vollständig clientseitig als statische Web-Anwendung (HTML/CSS/Vanilla JS). Die Daten werden ausschließlich im Browser-`localStorage` gespeichert.

```
┌─────────────────────────────────────────┐
│         UI-Layer (HTML/DOM)             │
│  Navigation, Controller, Event Handler  │
├─────────────────────────────────────────┤
│       Service-Layer (Business Logic)    │
│ Booking, Article, Document, Numbering  │
├─────────────────────────────────────────┤
│    Storage-Layer (Persistence)          │
│       localStorage + JSON Schema        │
└─────────────────────────────────────────┘
```

## 🗂️ Repository-Struktur

```
buergerhalle/
├── index.html                 # Hauptseite (Startseite)
├── pages/
│   ├── addresses.html         # Adressverwaltung
│   ├── articles.html          # Artikelverwaltung
│   ├── calendar.html          # Buchungskalender
│   ├── bookings.html          # Buchungsübersicht
│   ├── booking-form.html      # Buchungsmaske
│   ├── documents.html         # Verträge & Rechnungen
│   ├── invoices.html          # Manuelle Rechnungen
│   └── cashbook.html          # Kassenbuch
├── css/
│   ├── style.css              # Globales CSS
│   ├── layout.css             # Layout & Navigation
│   └── components.css         # Komponenten-Stile
├── js/
│   ├── app.js                 # App-Initialisierung & Nav
│   ├── storage.js             # Storage-Layer
│   ├── services/
│   │   ├── numbering.js       # Nummernkreis
│   │   ├── address.js         # Adress-Service
│   │   ├── article.js         # Artikel-Service
│   │   ├── booking.js         # Buchungs-Service
│   │   ├── document.js        # Dokument-Service
│   │   └── cashbook.js        # Kassenbuch-Service
│   └── controllers/
│       ├── address-controller.js
│       ├── article-controller.js
│       ├── calendar-controller.js
│       ├── booking-form-controller.js
│       ├── booking-list-controller.js
│       ├── document-controller.js
│       ├── invoice-controller.js
│       └── cashbook-controller.js
└── docs/
    ├── DATA-MODEL.md          # Datenmodell-Dokumentation
    ├── API.md                 # Service-API-Dokumentation
    └── DEPLOYMENT.md          # GitHub Pages Deployment
```

## 🔑 Kernkonzepte

### 1. Datenfluss
- **UI-Layer** nimmt Benutzer-Input auf
- **Controller** ruft Service-Methoden auf
- **Services** validieren Daten und führen Business-Logic durch
- **Storage** persistiert die zentrale JSON-Datenstruktur
- Alle Reads gehen direkt über Storage (Single Source of Truth)

### 2. Layerung
```
┌─────────────────┐
│ UI / HTML / DOM │ (index.html, pages/*.html)
└────────┬────────┘
         │ event listener
┌────────▼──────────────┐
│  Controller Layer     │ (js/controllers/*.js)
└────────┬──────────────┘
         │ Fachlogik
┌────────▼──────────────────┐
│  Service Layer           │ (js/services/*.js)
│  (Business Logic)        │
└────────┬──────────────────┘
         │ CRUD
┌────────▼──────────────────┐
│  Storage Layer           │ (js/storage.js)
│  (localStorage + JSON)   │
└──────────────────────────┘
```

### 3. Zentrale Datenstruktur
Eine einzige JSON-Struktur in `localStorage['halle_data']`:
```json
{
  "addresses": [...],
  "articles": [...],
  "bookings": [...],
  "documents": [...],
  "cashbook": [...],
  "numbering": {
    "invoices": { "2026": 1023 },
    "contracts": { "2026": 42 }
  }
}
```

### 4. Validierung & Geschäftslogik
- **Überschneidungsprüfung**: Vor dem Speichern von Buchungen
- **Paket-Zeitberechnung**: Bei Buchungsmaske-Initialisation
- **Nummernkreis-Verwaltung**: Niemals Duplikate, immer inkrementell
- **Dokument-Status**: Validierte Zustandsübergänge

## 🎯 Design-Prinzipien

### Single Responsibility
- Jeder Service hat eine klare Aufgabe
- Jeder Controller verwaltet genau eine Seite
- Storage ist nur für Persistierung zuständig

### DRY (Don't Repeat Yourself)
- Gemeinsame Validierungslogik in Services
- Reusable Funktionen in `app.js`
- Zentrale Error-Handling

### Testbarkeit
- Services sind rein funktional
- Keine globalen Zustände außer localStorage
- Validierungslogik separiert von UI

## 📱 Deployment

Die Webapp wird über GitHub Pages bereitgestellt:
- Keine Build-Steps nötig
- Statische Dateien werden direkt served
- `index.html` als Entry-Point
- localStorage ist persistenter Datenspeicher pro Browser/Device

---
**Lesen Sie auch:**
- [DATA-MODEL.md](docs/DATA-MODEL.md) – Detailliertes Datenmodell
- [API.md](docs/API.md) – Service-API-Dokumentation
