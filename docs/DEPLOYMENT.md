# Deployment auf GitHub Pages

Diese Anwendung ist vollständig statisch und kann direkt auf GitHub Pages deployed werden.

## 📋 Voraussetzungen

- GitHub-Account
- Git installiert
- Das Repository `buergerhalle` auf GitHub erstellt

## 🚀 Deployment-Schritte

### 1. Repository vorbereiten

```bash
cd /workspaces/buergerhalle

# Falls noch nicht initialisiert
git init
git add .
git commit -m "Initial commit: Bürgerhalle-Verwaltung"

# Remote hinzufügen (ersetzen Sie USERNAME)
git remote add origin https://github.com/USERNAME/buergerhalle.git

# Push zur main-Branch
git branch -M main
git push -u origin main
```

### 2. GitHub Pages aktivieren

1. Gehen Sie zu Ihrem Repository auf GitHub
2. **Settings** → **Pages**
3. Unter "Source" wählen Sie:
   - Branch: `main`
   - Folder: `/` (root)
4. Klicken Sie **Save**

→ Nach einigen Sekunden ist die App unter `https://username.github.io/buergerhalle/` erreichbar

### 3. Verwenden Sie einen benutzerdefinierten Domain-Namen (optional)

1. Kaufen oder verwalten Sie einen Domain-Namen
2. Konfigurieren Sie die DNS-Records zu GitHub Pages
3. In **Settings** → **Pages** geben Sie den benutzerdefinierten Domain-Namen ein

## 💾 Lokales Testen vor dem Deployment

```bash
# Einfacher HTTP-Server starten:
python3 -m http.server 8000

# Dann im Browser aufrufen:
# http://localhost:8000
```

## 🔐 Sicherheit & Datenschutz

### Wichtige Hinweise

1. **Lokale Datenspeicherung**: Alle Daten werden im Browser-`localStorage` gespeichert. Sie verlassen niemals Ihren Computer/Browser.

2. **Backup empfohlen**: Regelmäßig Daten exportieren:
   - Klick auf "💾 Export" im Header
   - JSON-Datei speichern

3. **Keine Synchronisation**: Die App synchronisiert nicht automatisch zwischen Browsern/Geräten. Jeder Browser hat seinen eigenen isolierten Datenspeicher.

4. **Private Repository**: Wenn Sie sensitive Daten verarbeiten, können Sie auch ein privates Repository nutzen (kostenlos mit GitHub Account).

## 🔄 Updates durchführen

```bash
# Änderungen lokal machen
# ...

# Commit und Push
git add .
git commit -m "Beschreibung der Änderung"
git push origin main

# GitHub Pages wird automatisch neu deployed (1-2 Minuten)
```

## 🐛 Debugging & Probleme

### Weiße Seite / Nichts funktioniert

1. Öffnen Sie die Browser-Konsole: `F12` → **Console**
2. Suchen Sie nach Fehlermeldungen
3. Überprüfen Sie die Netzwerk-Anfragen: **Network-Tab**

### CORS-Fehler

Ignorieren Sie diese, wenn die App lokal lädt. GitHub Pages serviert alles mit den korrekten Headers.

### localStorage gesperrt

Einige Browser blockieren localStorage im privaten Modus. Nutzen Sie den normalen Modus.

## 📱 Responsive &Mobile

Die App ist vollständig mobilfähig. Testen Sie auf verschiedenen Geräten:
- Desktop (1920px+)
- Tablet (768px+)
- Mobile (< 480px)

## 🆘 Hilfe & Support

Häufige Probleme:

**Q: "Fehler beim Laden der Daten"**  
A: Wahrscheinlich ist localStorage beschädigt. Öffnen Sie die Konsole und führen aus:
```javascript
storage.reset();
```

**Q: "Daten sind weg!"**  
A: Sie wurden wahrscheinlich gelöscht. Stellen Sie aus einem Backup wieder her:
- Klick auf "📂 Import"
- Wählen Sie Ihre JSON-Backup-Datei

**Q: "App ist langsam"**  
A: Bei sehr großem Datenaufkommen (1000+ Einträge) kann es zu Verzögerungen kommen. Teilen Sie die Daten in mehrere Jahre/Dateien auf.

## 🎯 Best Practices

1. **Regelmäßige Backups**: Mindestens wöchentlich exportieren
2. **Browser aktuell halten**: Für beste Performance
3. **Cache leeren**: Bei Problemen `Strg+Shift+Del`
4. **Mehrere Browser testen**: Unterschiedlich Browser können unterschiedliche Ergebnisse haben
5. **Versionskontrolle**: Nutzen Sie Git für Änderungen am Code

---

Viel Erfolg mit Ihrer Bürgerhalle-Verwaltung! 🎉
