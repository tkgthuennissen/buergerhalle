/**
 * services/numbering.js - Nummernkreis-Service
 * 
 * Zentrale Verwaltung aller Dokumentennummern:
 * - Rechnungen: R-2026-1023
 * - Verträge: V-2026-0042
 * 
 * Garantierte Eigenschaften:
 * - Keine Lücken
 * - Keine Duplikate
 * - Fortlaufend pro Jahr
 */

class NumberingService {
  /**
   * Generiert eine neue Rechnungsnummer
   * Format: R-{year}-{sequentialNumber}
   * 
   * @param {number} year - Optional, default: aktuelles Jahr
   * @return {string} Neue Rechnungsnummer, z.B. "R-2026-1024"
   */
  static generateInvoiceNumber(year = new Date().getFullYear()) {
    const numbering = storage.getNumbering();
    
    // Initialisiere Jahr, falls nicht vorhanden
    if (!numbering.invoices) numbering.invoices = {};
    if (!numbering.invoices[year]) numbering.invoices[year] = 1;
    
    // Aktuelle Nummer
    const number = numbering.invoices[year];
    
    // Inkrementiere für nächsten Aufruf
    numbering.invoices[year]++;
    storage.saveNumbering(numbering);
    
    // Formatierung mit führenden Nullen
    return `R-${year}-${String(number).padStart(4, '0')}`;
  }

  /**
   * Generiert eine neue Vertragsnummer
   * Format: V-{year}-{sequentialNumber}
   * 
   * @param {number} year - Optional, default: aktuelles Jahr
   * @return {string} Neue Vertragsnummer, z.B. "V-2026-0043"
   */
  static generateContractNumber(year = new Date().getFullYear()) {
    const numbering = storage.getNumbering();
    
    // Initialisiere Jahr, falls nicht vorhanden
    if (!numbering.contracts) numbering.contracts = {};
    if (!numbering.contracts[year]) numbering.contracts[year] = 1;
    
    // Aktuelle Nummer
    const number = numbering.contracts[year];
    
    // Inkrementiere für nächsten Aufruf
    numbering.contracts[year]++;
    storage.saveNumbering(numbering);
    
    // Formatierung mit führenden Nullen
    return `V-${year}-${String(number).padStart(4, '0')}`;
  }

  /**
   * Gibt die nächste Rechnungsnummer zurück (ohne zu inkrementieren)
   * Nützlich zur Vorschau
   * 
   * @param {number} year - Optional, default: aktuelles Jahr
   * @return {string} Nächste Rechnungsnummer
   */
  static peekNextInvoiceNumber(year = new Date().getFullYear()) {
    const numbering = storage.getNumbering();
    const number = numbering.invoices?.[year] ?? 1;
    return `R-${year}-${String(number).padStart(4, '0')}`;
  }

  /**
   * Gibt die nächste Vertragsnummer zurück (ohne zu inkrementieren)
   * 
   * @param {number} year - Optional, default: aktuelles Jahr
   * @return {string} Nächste Vertragsnummer
   */
  static peekNextContractNumber(year = new Date().getFullYear()) {
    const numbering = storage.getNumbering();
    const number = numbering.contracts?.[year] ?? 1;
    return `V-${year}-${String(number).padStart(4, '0')}`;
  }
}
