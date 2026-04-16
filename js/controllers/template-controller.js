/**
 * template-controller.js - Template-Controller
 *
 * Verwaltet die Template-Verwaltung-Seite.
 */

class TemplateController {
  static init() {
    this.bindEvents();
    this.loadTemplates();
  }

  static bindEvents() {
    // Neues Template erstellen
    document.getElementById('create-template-btn')?.addEventListener('click', () => {
      this.showCreateForm();
    });

    // Template speichern
    document.getElementById('save-template-btn')?.addEventListener('click', () => {
      this.saveTemplate();
    });

    // Abbrechen
    document.getElementById('cancel-template-btn')?.addEventListener('click', () => {
      this.hideForm();
    });

    // Template bearbeiten
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('edit-template-btn')) {
        const templateId = e.target.dataset.id;
        this.editTemplate(templateId);
      }
    });

    // Template löschen
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-template-btn')) {
        const templateId = e.target.dataset.id;
        this.deleteTemplate(templateId);
      }
    });
  }

  static loadTemplates() {
    const templates = TemplateService.getAll();
    const container = document.getElementById('templates-list');

    if (!container) return;

    container.innerHTML = templates.map(template => `
      <div class="template-item">
        <h3>${template.name}</h3>
        <p>Typ: ${template.type === 'contract' ? 'Vertrag' : 'Rechnung'}</p>
        <div class="template-actions">
          <button class="btn btn-secondary edit-template-btn" data-id="${template.id}">Bearbeiten</button>
          <button class="btn btn-danger delete-template-btn" data-id="${template.id}">Löschen</button>
        </div>
      </div>
    `).join('');
  }

  static showCreateForm() {
    document.getElementById('template-form').style.display = 'block';
    document.getElementById('template-id').value = '';
    document.getElementById('template-name').value = '';
    document.getElementById('template-type').value = 'contract';
    document.getElementById('template-header').value = '';
    document.getElementById('template-body').value = '';
    document.getElementById('template-footer').value = '';
  }

  static editTemplate(templateId) {
    const template = TemplateService.getById(templateId);
    if (!template) return;

    document.getElementById('template-form').style.display = 'block';
    document.getElementById('template-id').value = template.id;
    document.getElementById('template-name').value = template.name;
    document.getElementById('template-type').value = template.type;
    document.getElementById('template-header').value = template.header;
    document.getElementById('template-body').value = template.body;
    document.getElementById('template-footer').value = template.footer;
  }

  static saveTemplate() {
    const id = document.getElementById('template-id').value;
    const data = {
      name: document.getElementById('template-name').value,
      type: document.getElementById('template-type').value,
      header: document.getElementById('template-header').value,
      body: document.getElementById('template-body').value,
      footer: document.getElementById('template-footer').value,
      placeholders: this.extractPlaceholders(
        document.getElementById('template-header').value +
        document.getElementById('template-body').value +
        document.getElementById('template-footer').value
      )
    };

    const validation = TemplateService.validate(data);
    if (!validation.valid) {
      alert('Fehler: ' + validation.errors.join(', '));
      return;
    }

    let template;
    if (id) {
      template = TemplateService.getById(id);
      Object.assign(template, data);
    } else {
      template = TemplateService.create(data);
    }

    TemplateService.save(template);
    this.hideForm();
    this.loadTemplates();
  }

  static deleteTemplate(templateId) {
    if (confirm('Template wirklich löschen?')) {
      TemplateService.delete(templateId);
      this.loadTemplates();
    }
  }

  static hideForm() {
    document.getElementById('template-form').style.display = 'none';
  }

  static extractPlaceholders(text) {
    const matches = text.match(/\{\{([^}]+)\}\}/g);
    return matches ? [...new Set(matches)] : [];
  }
}

// Initialisierung beim Laden der Seite
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('templates-list')) {
    TemplateController.init();
  }
});