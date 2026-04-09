/**
 * [SKELETON] controllers/cashbook-controller.js
 * 
 * Erweitern Sie dies zur Kassenbuch-Verwaltung
 */

class CashbookController {
  static init() {
    this.render();
  }

  static render() {
    this.renderSummary();
    this.renderTable();
  }

  static renderSummary() {
    const container = document.getElementById('cashbook-summary');
    if (!container) return;

    const income = CashbookService.getTotalIncome();
    const expense = CashbookService.getTotalExpense();
    const balance = CashbookService.calculateBalance();

    container.innerHTML = `
      <div class="page-section">
        <div class="cashbook-summary">
          <div class="summary-card income">
            <div class="summary-label">Gesamteinnahmen</div>
            <div class="summary-value">${App.formatCurrency(income)}</div>
          </div>
          <div class="summary-card expense">
            <div class="summary-label">Gesamtausgaben</div>
            <div class="summary-value">${App.formatCurrency(expense)}</div>
          </div>
          <div class="summary-card balance">
            <div class="summary-label">Saldo</div>
            <div class="summary-value">${App.formatCurrency(balance)}</div>
          </div>
        </div>
      </div>
    `;
  }

  static renderTable() {
    const container = document.getElementById('cashbook-table');
    if (!container) return;

    const entries = CashbookService.getAll();

    if (entries.length === 0) {
      container.innerHTML = '<div class="page-section"><p class="text-muted">Keine Einträge im Kassenbuch.</p></div>';
      return;
    }

    let balance = 0;
    const tableHtml = entries.map(entry => {
      if (entry.type === 'income') balance += entry.amount;
      else balance -= entry.amount;

      return `
        <tr class="${entry.type}">
          <td>${App.formatDate(entry.date)}</td>
          <td>${entry.description}</td>
          <td class="text-right">${entry.type === 'income' ? App.formatCurrency(entry.amount) : '&ndash;'}</td>
          <td class="text-right">${entry.type === 'expense' ? App.formatCurrency(entry.amount) : '&ndash;'}</td>
          <td class="text-right"><strong>${App.formatCurrency(balance)}</strong></td>
          <td>
            <button class="icon-btn danger" onclick="CashbookController.deleteEntry('${entry.id}')">🗑️</button>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="page-section">
        <table class="data-table cashbook-table">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Beschreibung</th>
              <th style="text-align: right;">Einnahmen</th>
              <th style="text-align: right;">Ausgaben</th>
              <th style="text-align: right;">Saldo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${tableHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  static deleteEntry(entryId) {
    if (!confirm('Eintrag wirklich löschen?')) return;
    CashbookService.delete(entryId);
    this.render();
    App.showNotification('Eintrag gelöscht', 'success');
  }

  static exportPDF() {
    alert('TODO: PDF-Export implementieren (z.B. mit html2pdf)');
  }
}

document.addEventListener('DOMContentLoaded', () => CashbookController.init());
