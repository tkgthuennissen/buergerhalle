/**
 * app.js - Globale App-Initialisierung und Navigation
 * 
 * - Lädt Services beim Start
 * - Verwaltet Navigation
 * - Globale Utility-Funktionen
 */

class App {
  static init() {
    console.log('Bürgerhalle-Verwaltung initialisiert');
    
    // Storage wird bereits beim Laden von storage.js initialisiert
    // Services sind globale Klassen
    
    // Navigation initialisieren
    this.setupNavigation();
    
    // Globale Event Listener
    this.setupGlobalEvents();
  }

  /**
   * Seitennavigation Setup
   * Dynamische Anpassung der aktiven Seite in der Sidebar
   */
  static setupNavigation() {
    // Diese Funktion wird auf jeder Seite aufgerufen
    // um die aktive Navigation zu aktualisieren
    const currentPage = this.getCurrentPage();
    
    const navItems = document.querySelectorAll('[data-nav-link]');
    navItems.forEach(item => {
      const page = item.getAttribute('data-nav-link');
      if (page === currentPage) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  /**
   * Gibt den aktuellen Dateinamen zurück
   * @return {string} z.B. "index", "addresses", "bookings"
   */
  static getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    return filename.replace('.html', '');
  }

  /**
   * Globale Event-Listener (z.B. Fehlerbehandlung)
   */
  static setupGlobalEvents() {
    window.addEventListener('error', (e) => {
      console.error('Globaler Fehler:', e.error);
    });

    // Fallback für ältere Browser
    if (!window.localStorage) {
      alert('Warnung: localStorage nicht verfügbar!');
    }
  }

  /**
   * Zeigt einen Toast/Notification
   * @param {string} message
   * @param {string} type - "success" | "error" | "info" (default: info)
   * @param {number} duration - ms (default: 3000)
   */
  static showNotification(message, type = 'info', duration = 3000) {
    const container = document.getElementById('notifications') || this.createNotificationContainer();
    
    const toast = document.createElement('div');
    toast.className = `notification notification-${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /**
   * Erstellt einen Notification-Container falls nicht vorhanden
   */
  static createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notifications';
    container.className = 'notifications-container';
    document.body.appendChild(container);
    return container;
  }

  /**
   * Formatiert ein Datum schön
   * @param {string} dateString - ISO-Date oder DateTime
   * @param {boolean} withTime - incl. Uhrzeit? (default: false)
   * @return {string}
   */
  static formatDate(dateString, withTime = false) {
    try {
      const date = new Date(dateString);
      const options = withTime 
        ? { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }
        : { year: 'numeric', month: '2-digit', day: '2-digit' };
      return date.toLocaleDateString('de-DE', options);
    } catch {
      return dateString;
    }
  }

  /**
   * Formatiert einen Betrag als Währung
   * @param {number} amount
   * @return {string} z.B. "500,00 EUR"
   */
  static formatCurrency(amount) {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  /**
   * Validiert Email
   * @param {string} email
   * @return {boolean}
   */
  static validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * Sperrt Form-Buttons während Verarbeitung
   * @param {HTMLElement} button
   */
  static lockButton(button) {
    button.disabled = true;
    button.classList.add('loading');
  }

  /**
   * Entsperrt Form-Buttons
   * @param {HTMLElement} button
   */
  static unlockButton(button) {
    button.disabled = false;
    button.classList.remove('loading');
  }

  /**
   * Öffnet einen Modal-Dialog
   * @param {string} title
   * @param {string} content - HTML-String
   * @param {Array} buttons - [{label, class, callback}]
   */
  static openModal(title, content, buttons = []) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    const box = document.createElement('div');
    box.className = 'modal-box';
    box.innerHTML = `
      <div class="modal-header">
        <h2>${title}</h2>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        ${content}
      </div>
      <div class="modal-footer">
        ${buttons.map(btn => 
          `<button class="btn ${btn.class || 'btn-default'}" data-action="${btn.action || ''}">${btn.label}</button>`
        ).join('')}
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close Button
    box.querySelector('.modal-close').addEventListener('click', () => {
      modal.remove();
    });

    // Action Buttons
    box.querySelectorAll('[data-action]').forEach(btn => {
      const action = btn.getAttribute('data-action');
      const buttonConfig = buttons.find(b => b.action === action);
      if (buttonConfig?.callback) {
        btn.addEventListener('click', () => {
          buttonConfig.callback();
          modal.remove();
        });
      }
    });

    // Close on Overlay Click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    modal.appendChild(box);
  }

  /**
   * Exportiert Daten als JSON-Datei (Download)
   */
  static exportData() {
    const json = storage.exportAsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buergerhalle_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Importiert Daten aus JSON-Datei
   */
  static importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          storage.importFromJSON(event.target.result);
          this.showNotification('Daten erfolgreich importiert', 'success');
          window.location.reload();
        } catch (error) {
          this.showNotification('Fehler beim Import: ' + error.message, 'error');
        }
      };
      reader.readAsText(file);
    });
    input.click();
  }
}

// Initialisiere App beim Laden
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
