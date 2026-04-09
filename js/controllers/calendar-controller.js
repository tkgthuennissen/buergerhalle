/**
 * controllers/calendar-controller.js
 * 
 * Steuert den Buchungskalender
 */

class CalendarController {
  static currentMonth = new Date().getMonth() + 1;
  static currentYear = new Date().getFullYear();

  static init() {
    console.log('CalendarController initialisiert');
    this.render();
  }

  /**
   * Rendert den Kalender
   */
  static render() {
    const container = document.getElementById('calendar-container');
    if (!container) return;

    const monthName = new Date(this.currentYear, this.currentMonth - 1).toLocaleString('de-DE', {
      month: 'long',
      year: 'numeric'
    });

    // Header mit Navigation
    let html = `
      <div class="calendar-header">
        <h2>${monthName}</h2>
        <div class="calendar-nav">
          <button class="btn btn-outline btn-small" 
              onclick="CalendarController.prevMonth()">← Zurück</button>
          <button class="btn btn-outline btn-small" 
              onclick="CalendarController.today()">Heute</button>
          <button class="btn btn-outline btn-small" 
              onclick="CalendarController.nextMonth()">Weiter →</button>
        </div>
      </div>
    `;

    // Kalender-Grid
    html += this.generateCalendarGrid();

    container.innerHTML = html;
  }

  /**
   * Generiert das Kalender-Grid
   */
  static generateCalendarGrid() {
    const firstDay = new Date(this.currentYear, this.currentMonth - 1, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Buchungen für den Monat laden
    const bookings = BookingService.getByMonth(this.currentMonth, this.currentYear);

    let html = '<div class="calendar-grid">';

    // Wochentag-Header
    const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    for (const day of weekdays) {
      html += `<div class="calendar-weekday">${day}</div>`;
    }

    // Leere Zellen am Anfang
    for (let i = 0; i < startingDayOfWeek; i++) {
      html += '<div class="calendar-cell calendar-cell-empty"></div>';
    }

    // Tage des Monats
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayBookings = bookings.filter(b => {
        const eventDate = b.eventDate;
        return eventDate === dateString;
      });

      html += `
        <div class="calendar-cell" onclick="CalendarController.selectDate('${dateString}')">
          <div class="calendar-day">${day}</div>
          <div class="calendar-events">
            ${dayBookings.slice(0, 2).map(b => {
              const addr = AddressService.getById(b.addressId);
              return `<div class="calendar-event" title="${addr?.name || '??'}">${addr?.name || '??'}</div>`;
            }).join('')}
            ${dayBookings.length > 2 ? `<div class="text-muted" style="font-size: 10px;">+${dayBookings.length - 2} mehr</div>` : ''}
          </div>
        </div>
      `;
    }

    html += '</div>';
    return html;
  }

  /**
   * Wird aufgerufen wenn ein Kalendertag geklickt wird
   * @param {string} dateString - ISO-Date "YYYY-MM-DD"
   */
  static selectDate(dateString) {
    // Navigiert zur Buchungsmaske mit vorgefülltem Datum
    window.location.href = `/buergerhalle/pages/booking-form.html?eventDate=${dateString}`;
  }

  /**
   * Navigation: Vorheriger Monat
   */
  static prevMonth() {
    this.currentMonth--;
    if (this.currentMonth < 1) {
      this.currentMonth = 12;
      this.currentYear--;
    }
    this.render();
  }

  /**
   * Navigation: Nächster Monat
   */
  static nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 12) {
      this.currentMonth = 1;
      this.currentYear++;
    }
    this.render();
  }

  /**
   * Zurück zu heute
   */
  static today() {
    const now = new Date();
    this.currentMonth = now.getMonth() + 1;
    this.currentYear = now.getFullYear();
    this.render();
  }
}

// Initialisiere beim DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  CalendarController.init();
});
