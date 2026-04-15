/**
 * controllers/article-controller.js
 * 
 * Steuert Artikel und Paket-Verwaltung
 */

class ArticleController {
  static init() {
    console.log('ArticleController initialisiert');
    this.setupEventListeners();
    this.render();
  }

  static setupEventListeners() {
    const btnNewPackage = document.getElementById('btn-new-package');
    const btnNewItem = document.getElementById('btn-new-item');
    
    if (btnNewPackage) {
      btnNewPackage.addEventListener('click', () => this.openArticleForm('package'));
    }
    if (btnNewItem) {
      btnNewItem.addEventListener('click', () => this.openArticleForm('item'));
    }
  }

  static render() {
    this.renderPackages();
    this.renderItems();
  }

  /**
   * Rendert Pakete
   */
  static renderPackages() {
    const list = document.getElementById('packages-list');
    if (!list) return;

    const packages = ArticleService.getPackages();

    if (packages.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <p>Keine Pakete definiert.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Beschreibung</th>
            <th>Preis</th>
            <th>Zeitlogik</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          ${packages.map(pkg => `
            <tr>
              <td><strong>${this.escapeHtml(pkg.name)}</strong></td>
              <td>${this.escapeHtml(pkg.description)}</td>
              <td>${App.formatCurrency(pkg.unitPrice)}</td>
              <td>
                <small class="text-muted">
                  Beginn: ${pkg.timeLogic.beginOffsetDays > 0 ? '+' : ''}${pkg.timeLogic.beginOffsetDays}T ${pkg.timeLogic.beginOffsetHours}:00<br>
                  Ende: ${pkg.timeLogic.endOffsetDays > 0 ? '+' : ''}${pkg.timeLogic.endOffsetDays}T ${pkg.timeLogic.endOffsetHours}:00
                </small>
              </td>
              <td>
                <div class="table-row-actions">
                  <button class="icon-btn" onclick="ArticleController.openArticleForm('package', '${pkg.id}')" title="Bearbeiten">✏️</button>
                  <button class="icon-btn danger" onclick="ArticleController.deleteArticle('${pkg.id}')" title="Löschen">🗑️</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  /**
   * Rendert Einzelartikel
   */
  static renderItems() {
    const list = document.getElementById('items-list');
    if (!list) return;

    const items = ArticleService.getItems();

    if (items.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <p>Keine Einzelartikel definiert.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Kategorie</th>
            <th>Beschreibung</th>
            <th>Preis</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td><strong>${this.escapeHtml(item.name)}</strong></td>
              <td><small class="text-muted">${this.escapeHtml(item.category)}</small></td>
              <td>${this.escapeHtml(item.description)}</td>
              <td>${App.formatCurrency(item.unitPrice)}</td>
              <td>
                <div class="table-row-actions">
                  <button class="icon-btn" onclick="ArticleController.openArticleForm('item', '${item.id}')" title="Bearbeiten">✏️</button>
                  <button class="icon-btn danger" onclick="ArticleController.deleteArticle('${item.id}')" title="Löschen">🗑️</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  /**
   * Öffnet Formular für Paket oder Einzelartikel
   * @param {string} type - "package" | "item"
   * @param {string} articleId - Optional: ID einer existierenden
   */
  static openArticleForm(type, articleId = null) {
    const isEdit = !!articleId;
    const article = isEdit ? ArticleService.getById(articleId) : null;
    const title = isEdit 
      ? (type === 'package' ? 'Paket bearbeiten' : 'Artikel bearbeiten')
      : (type === 'package' ? 'Neues Paket' : 'Neuer Artikel');

    let content = `
      <form id="article-form">
        <input type="hidden" id="article-type" value="${type}">
        
        <div class="form-group">
          <label for="art-name">Name *</label>
          <input type="text" id="art-name" value="${article?.name || ''}" required>
        </div>

        <div class="form-group">
          <label for="art-desc">Beschreibung</label>
          <textarea id="art-desc">${article?.description || ''}</textarea>
        </div>

        <div class="form-group">
          <label for="art-price">Preis (EUR) *</label>
          <input type="number" id="art-price" step="0.01" value="${article?.unitPrice || ''}" required>
        </div>
    `;

    // Kategorie für Einzelartikel
    if (type === 'item') {
      content += `
        <div class="form-group">
          <label for="art-category">Kategorie *</label>
          <select id="art-category" required>
            <option value="Dienstleistungen" ${article?.category === 'Dienstleistungen' ? 'selected' : ''}>Dienstleistungen</option>
            <option value="Verleihmaterial" ${article?.category === 'Verleihmaterial' ? 'selected' : ''}>Verleihmaterial</option>
          </select>
        </div>
      `;
    }

    // Zusätzliche Felder für Pakete
    if (type === 'package') {
      content += `
        <hr style="margin: var(--spacing-lg) 0;">
        <h4>⏱️ Zeitliche Logik</h4>
        
        <div class="form-row">
          <div class="form-group">
            <label for="pkg-begin-days">Beginn Offset (Tage)</label>
            <input type="number" id="pkg-begin-days" value="${article?.timeLogic?.beginOffsetDays || '-1'}">
          </div>
          <div class="form-group">
            <label for="pkg-begin-hours">Beginn Uhrzeit</label>
            <input type="number" id="pkg-begin-hours" min="0" max="23" value="${article?.timeLogic?.beginOffsetHours || '18'}">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="pkg-end-days">Ende Offset (Tage)</label>
            <input type="number" id="pkg-end-days" value="${article?.timeLogic?.endOffsetDays || '1'}">
          </div>
          <div class="form-group">
            <label for="pkg-end-hours">Ende Uhrzeit</label>
            <input type="number" id="pkg-end-hours" min="0" max="23" value="${article?.timeLogic?.endOffsetHours || '11'}">
          </div>
        </div>

        <div class="form-group" style="background: var(--light-gray); padding: var(--spacing-md); border-radius: 4px;">
          <small class="text-muted">
            <strong>Beispiel:</strong> Bei Veranstaltung am Freitag:<br>
            Beginn -1 Tag, 18:00 → Donnerstag 18:00<br>
            Ende +1 Tag, 11:00 → Samstag 11:00
          </small>
        </div>
      `;
    }

    content += '</form>';

    const buttons = [
      {
        label: 'Abbrechen',
        action: 'cancel',
        class: 'btn-outline'
      },
      {
        label: isEdit ? '💾 Speichern' : '➕ Erstellen',
        action: 'save',
        class: 'btn-primary',
        callback: () => this.saveArticle(type, articleId)
      }
    ];

    App.openModal(title, content, buttons);
  }

  /**
   * Speichert Artikel/Paket
   */
  static saveArticle(type, articleId) {
    const form = document.getElementById('article-form');
    if (!form) return;

    const data = {
      name: document.getElementById('art-name').value.trim(),
      description: document.getElementById('art-desc').value.trim(),
      unitPrice: parseFloat(document.getElementById('art-price').value) || 0
    };

    if (type === 'item') {
      data.category = document.getElementById('art-category').value;
    }

    if (type === 'package') {
      data.timeLogic = {
        beginOffsetDays: parseInt(document.getElementById('pkg-begin-days').value) || 0,
        beginOffsetHours: parseInt(document.getElementById('pkg-begin-hours').value) || 0,
        endOffsetDays: parseInt(document.getElementById('pkg-end-days').value) || 0,
        endOffsetHours: parseInt(document.getElementById('pkg-end-hours').value) || 0
      };
    }

    if (!data.name) {
      App.showNotification('Name ist erforderlich', 'error');
      return;
    }

    try {
      let article;
      if (articleId) {
        article = ArticleService.getById(articleId);
        Object.assign(article, data);
      } else {
        article = type === 'package' 
          ? ArticleService.createPackage(data)
          : ArticleService.createItem(data);
      }

      ArticleService.save(article);
      App.showNotification(
        articleId ? 'Artikel aktualisiert' : 'Artikel erstellt',
        'success'
      );
      this.render();
    } catch (error) {
      App.showNotification('Fehler: ' + error.message, 'error');
    }
  }

  /**
   * Löscht einen Artikel
   */
  static deleteArticle(articleId) {
    const article = ArticleService.getById(articleId);
    if (!article) return;

    if (!confirm(`Soll "${article.name}" wirklich gelöscht werden?`)) {
      return;
    }

    try {
      ArticleService.delete(articleId);
      App.showNotification('Artikel gelöscht', 'success');
      this.render();
    } catch (error) {
      App.showNotification('Fehler: ' + error.message, 'error');
    }
  }

  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialisiere
document.addEventListener('DOMContentLoaded', () => {
  ArticleController.init();
});
