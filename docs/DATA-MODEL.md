# Datenmodell

## 🗄️ Zentrale JSON-Struktur

Die gesamte Anwendungsdaten werden als **ein JSON-Objekt** im `localStorage` gespeichert:

```javascript
{
  "addresses": [ /* ... */ ],
  "articles": [ /* ... */ ],
  "bookings": [ /* ... */ ],
  "documents": [ /* ... */ ],
  "cashbook": [ /* ... */ ],
  "numbering": { /* ... */ }
}
```

---

## 1️⃣ Addresses (Adressen)

Jede Buchung und jede Rechnung benötigt eine Adresse.

```javascript
{
  "id": "addr_UUID_1",                    // Eindeutige ID (generiert via UUID)
  "type": "person",                        // "person" | "association" | "company"
  "name": "Max Mustermann",
  "street": "Musterstraße 42",
  "zipCode": "12345",
  "city": "Musterstadt",
  "phone": "+49 123 456789",
  "email": "max@example.com",
  "companyName": null,                    // nur bei type="company"
  "notes": "VIP-Kunde",
  "createdAt": "2026-04-09T10:30:00Z",
  "updatedAt": "2026-04-09T10:30:00Z"
}
```

---

## 2️⃣ Articles (Artikel)

Unterscheidung zwischen **Paketen** (mit Zeitlogik) und **Einzelartikeln**.

### 2.1 Pakete (Bundles)

```javascript
{
  "id": "pkg_3day",
  "name": "3-Tage-Paket",
  "description": "Anmietung für 3 Tage",
  "type": "package",                      // wichtig!
  "unitPrice": 500.00,
  "currency": "EUR",
  // Zeitliche Logik: relativ zum Veranstaltungsdatum
  "timeLogic": {
    "beginOffsetDays": -1,                // 1 Tag VORHER
    "beginOffsetHours": 18,               // um 18:00
    "endOffsetDays": 1,                   // 1 Tag NACHHER
    "endOffsetHours": 11                  // um 11:00
  },
  "createdAt": "2026-01-01T00:00:00Z"
}
```

### 2.2 Einzelartikel

```javascript
{
  "id": "art_cleaning",
  "name": "Reinigung",
  "description": "Grundreinigung",
  "type": "item",                         // wichtig!
  "unitPrice": 150.00,
  "currency": "EUR",
  "createdAt": "2026-01-01T00:00:00Z"
}
```

---

## 3️⃣ Bookings (Buchungen)

```javascript
{
  "id": "booking_UUID_1",
  "addressId": "addr_UUID_1",             // FK zu Addresses
  "packageId": "pkg_3day",                // FK zu Articles (type="package")
  "eventDate": "2026-06-15",              // Veranstaltungsdatum (Basis für Paketlogik)
  "beginDateTime": "2026-06-14T18:00:00Z",  // Berechnetes Anfangsdatum
  "endDateTime": "2026-06-16T11:00:00Z",    // Berechnetes Enddatum
  "status": "planned",                    // "planned" | "confirmed" | "cancelled"
  "additionalItems": [                    // Zusatzartikel
    {
      "itemId": "art_cleaning",
      "quantity": 1,
      "unitPrice": 150.00
    },
    {
      "itemId": "art_sound",
      "quantity": 2,
      "unitPrice": 200.00
    }
  ],
  "notes": "Business-Event",
  "createdAt": "2026-04-09T09:00:00Z",
  "updatedAt": "2026-04-09T09:00:00Z"
}
```

**Wichtig:** 
- `beginDateTime` und `endDateTime` werden **berechnet** aus `eventDate` + `packageId` (über timeLogic)
- Überschneidungen werden im Booking-Service validiert
- Status erlaubt Statusübergänge: planned → confirmed, oder → cancelled

---

## 4️⃣ Documents (Verträge und Rechnungen)

Einheitliches Dokumentenmodell für Verträge AND Rechnungen.

```javascript
{
  "id": "doc_UUID_1",
  "type": "contract",                    // "contract" | "invoice"
  "documentNumber": "V-2026-0042",       // Format: {type_prefix}-{year}-{number}
  "bookingId": "booking_UUID_1",         // FK zu Bookings (null für manuelle Rechnungen)
  "addressId": "addr_UUID_1",            // FK zu Addresses
  "eventDate": "2026-06-15",
  "documentDate": "2026-04-09",
  "items": [                              // Rechnungspositionen
    {
      "description": "3-Tage-Paket",
      "quantity": 1,
      "unitPrice": 500.00,
      "total": 500.00
    }
  ],
  "subtotal": 500.00,
  "tax": 0.00,                           // Vereinfacht: Keine Mehrwertsteuer
  "total": 500.00,
  "paymentMethod": "bank_transfer",      // "bank_transfer" | "cash" | null (für Verträge)
  "status": "created",                   // "created" | "sent" | "paid" | "cancelled"
  "notes": "",
  "createdAt": "2026-04-09T10:30:00Z",
  "updatedAt": "2026-04-09T10:30:00Z"
}
```

---

## 5️⃣ Cashbook (Kassenbuch)

Automatische Einträge bei Rechnungserstellung mit `paymentMethod: "cash"`.

```javascript
{
  "id": "cash_UUID_1",
  "date": "2026-04-09",
  "type": "income",                       // "income" | "expense"
  "amount": 500.00,
  "description": "Rechnung R-2026-1023",
  "documentId": "doc_UUID_1",             // FK zu Documents
  "createdAt": "2026-04-09T10:30:00Z"
}
```

---

## 6️⃣ Numbering (Nummernkreise)

Zentrale Verwaltung aller Dokumentennummern.

```javascript
{
  "invoices": {
    "2026": 1023,                         // Nächste Rechnungsnummer für 2026
    "2027": 1
  },
  "contracts": {
    "2026": 42,                           // Nächste Vertragsnummer für 2026
    "2027": 1
  }
}
```

**Format der generierten Nummern:**
- Rechnungen: `R-2026-1023`, `R-2026-1024`, ...
- Verträge: `V-2026-0042`, `V-2026-0043`, ...

---

## 🔑 Wichtige Design-Entscheidungen

### 1. **Eindeutige IDs**
- Adresse: `addr_{uuid}`
- Artikel: `pkg_` oder `art_{name}`
- Buchung: `booking_{uuid}`
- Dokument: `doc_{uuid}`
- Kassenbuch: `cash_{uuid}`

### 2. **Feldtypen**
- Preise: Dezimal (z. B. `500.00`)
- Daten: ISO 8601 Format (`YYYY-MM-DD`)
- Zeitstempel: ISO 8601 mit Zeit (`YYYY-MM-DDTHH:mm:ssZ`)

### 3. **Referenzielle Integrität**
- Foreign Keys sind einfache ID-Strings
- Keine kaskadierenden Deletes
- Validierung vor dem Speichern

### 4. **Berechnete Felder**
- `beginDateTime` / `endDateTime` in Buchungen: **berechnet** aus `eventDate` + Package timeLogic
- Rechnungssummen: **berechnet** aus Items
- **Niemals** in der Datenbank gespeichert, sondern bei Bedarf berechnet

### 5. **Paket-Zeitlogik**

Als Beispiel – 3-Tage-Paket:
```
Veranstaltungsdatum: Montag, 15. Juni 2026

timeLogic: {
  "beginOffsetDays": -1,
  "beginOffsetHours": 18,
  "endOffsetDays": 1,
  "endOffsetHours": 11
}

→ beginDateTime: Sonntag, 14. Juni 2026, 18:00
→ endDateTime: Dienstag, 16. Juni 2026, 11:00
```

---

## 📊 Migrations & Versionierung

Im localStorage wird **keine Versionsnummer** gespeichert. Bei zukünftigen Schema-Änderungen:
1. Storage.js erhält eine `migrate()`-Funktion
2. Beim Laden prüft die App auf veraltete Struktur
3. Automatische Konvertierung zu neuer Struktur
