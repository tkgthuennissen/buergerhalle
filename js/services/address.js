/**
 * services/address.js - Adress-Service
 * 
 * Verwaltung von Adressen (Personen, Vereine, Unternehmen)
 */

class AddressService {
  /**
   * Erstellt eine neue Adresse
   * @param {Object} addressData - {type, name, street, zipCode, city, phone, email, ...}
   * @return {Object} Neues Adress-Objekt
   */
  static create(addressData) {
    const id = 'addr_' + this.generateUUID();
    
    return {
      id,
      type: addressData.type || 'person', // "person" | "association" | "company"
      name: addressData.name || '',
      street: addressData.street || '',
      zipCode: addressData.zipCode || '',
      city: addressData.city || '',
      phone: addressData.phone || '',
      email: addressData.email || '',
      companyName: addressData.companyName || null,
      notes: addressData.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Speichert eine Adresse
   * @param {Object} address - Adress-Objekt (mit id)
   */
  static save(address) {
    address.updatedAt = new Date().toISOString();
    storage.saveAddress(address);
  }

  /**
   * Löscht eine Adresse
   * @param {string} id - Adress-ID
   */
  static delete(id) {
    storage.deleteAddress(id);
  }

  /**
   * Gibt eine Adresse per ID zurück
   * @param {string} id
   * @return {Object|null}
   */
  static getById(id) {
    return storage.getAddressById(id);
  }

  /**
   * Gibt alle Adressen zurück
   * @return {Array}
   */
  static getAll() {
    return storage.getAddresses();
  }

  /**
   * Sucht Adressen nach Name (Case-insensitive)
   * @param {string} searchTerm
   * @return {Array}
   */
  static search(searchTerm) {
    const lower = searchTerm.toLowerCase();
    return this.getAll().filter(addr => 
      addr.name.toLowerCase().includes(lower) ||
      addr.city.toLowerCase().includes(lower) ||
      addr.email.toLowerCase().includes(lower)
    );
  }

  /**
   * Gibt einen formatierten Adressstempel zurück
   * @param {string} addressId
   * @return {string} Mehrzeilige Adresse
   */
  static format(addressId) {
    const addr = this.getById(addressId);
    if (!addr) return '';

    let result = addr.name + '\n';
    result += addr.street + '\n';
    result += addr.zipCode + ' ' + addr.city;
    return result;
  }

  /**
   * Validiert eine Adresse vor dem Speichern
   * @param {Object} address
   * @return {Object} {valid: boolean, errors: []}
   */
  static validate(address) {
    const errors = [];

    if (!address.name || address.name.trim() === '') {
      errors.push('Name ist erforderlich');
    }
    if (!address.street || address.street.trim() === '') {
      errors.push('Straße ist erforderlich');
    }
    if (!address.zipCode || address.zipCode.trim() === '') {
      errors.push('Postleitzahl ist erforderlich');
    }
    if (!address.city || address.city.trim() === '') {
      errors.push('Stadt ist erforderlich');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generiert eine einfache UUID v4
   * @return {string}
   */
  static generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
