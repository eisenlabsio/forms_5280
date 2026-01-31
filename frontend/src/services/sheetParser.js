/**
 * Parses a sheet with 'path' and 'value' columns into a nested object.
 * This version handles multiple values for the same key by collecting them into an array.
 *
 * @param {Array<Object>} sheetData - An array of objects, where each object has 'path' and 'value' properties.
 * @returns {Object} A nested object representing the data from the sheet.
 */
export function parsePathValueSheet(sheetData) {
  const result = {};

  if (!sheetData) {
    return result;
  }

  sheetData.forEach(row => {
    const { path, value } = row;
    if (path) {
      const pathParts = path.split('.');
      let current = result;
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!current[part] || typeof current[part] !== 'object' || Array.isArray(current[part])) {
          current[part] = {};
        }
        current = current[part];
      }
      const lastPart = pathParts[pathParts.length - 1];

      if (current[lastPart] !== undefined) {
        if (Array.isArray(current[lastPart])) {
          current[lastPart].push(value);
        } else {
          current[lastPart] = [current[lastPart], value];
        }
      } else {
        current[lastPart] = value;
      }
    }
  });

  return result;
}
