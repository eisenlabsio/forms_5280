function ensureHeaders(sheet, headerKeys) {
  const lastColumn = sheet.getLastColumn();
  const existingHeaders = lastColumn > 0
    ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0]
    : [];
  const normalizedHeaders = existingHeaders.map(header => header === null || header === undefined ? '' : String(header));
  const headerSet = new Set(normalizedHeaders.filter(header => header.trim() !== ''));
  const missingHeaders = headerKeys.filter(key => !headerSet.has(key));

  Logger.log('ensureHeaders: existing headers (row 1): ' + JSON.stringify(normalizedHeaders));
  Logger.log('ensureHeaders: requested header keys: ' + JSON.stringify(headerKeys));
  Logger.log('ensureHeaders: missing headers: ' + JSON.stringify(missingHeaders));

  if (missingHeaders.length > 0) {
    const startColumn = normalizedHeaders.length + 1;
    sheet.getRange(1, startColumn, 1, missingHeaders.length).setValues([missingHeaders]);
    Logger.log('Added missing headers: ' + JSON.stringify(missingHeaders));
    normalizedHeaders.push(...missingHeaders);
  }

  Logger.log('ensureHeaders: final headers: ' + JSON.stringify(normalizedHeaders));
  return normalizedHeaders;
}

function appendRowToSheet(sheetId, dataToAppend, answerKeys) {
  Logger.log('Attempting to open sheet with ID: ' + sheetId);
  const spreadsheet = SpreadsheetApp.openById(sheetId);
  const sheet = spreadsheet.getSheetByName('Sheet1') || spreadsheet.getSheets()[0]; // Try to get 'Sheet1', fallback to first sheet
  if (!sheet) {
    Logger.log(`Target sheet not found in spreadsheet with ID: ${sheetId}`);
    throw new Error(`Target sheet not found in spreadsheet with ID: ${sheetId}`);
  }
  Logger.log('Target sheet name: ' + sheet.getName());

  const headerKeys = Array.isArray(answerKeys) ? answerKeys : Object.keys(dataToAppend);
  const headers = ensureHeaders(sheet, headerKeys);
  Logger.log('Response Sheet Headers: ' + JSON.stringify(headers)); // Log headers
  const rowData = new Array(headers.length).fill(''); // Initialize with empty strings

  // Populate rowData based on direct header matches
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    if (dataToAppend.hasOwnProperty(header)) {
      let value = dataToAppend[header];
      if (typeof value === 'object' && value !== null) {
        rowData[i] = JSON.stringify(value);
      } else {
        rowData[i] = value;
      }
    }
  }
  Logger.log('Row data prepared for appending: ' + JSON.stringify(rowData)); // Log prepared row data
  try {
    sheet.appendRow(rowData);
    Logger.log('Row appended successfully to sheet: ' + sheet.getName());
  } catch (error) {
    Logger.log('Error appending row to sheet ' + sheet.getName() + ': ' + error.message);
    throw error; // Re-throw to be caught by doPost
  }
}

function validateInput(data) {
  // Basic validation: ensure essential fields exist
  if (!data || !data.quizSheetId || !data.userAnswers || !data.metadata || !data.responseSheetId) {
    Logger.log('Validation Error: Missing essential data. Payload: ' + JSON.stringify(data));
    throw new Error('Missing essential data: quizSheetId, userAnswers, metadata, or responseSheetId.');
  }
  if (typeof data.userAnswers !== 'object' || data.userAnswers === null || Object.keys(data.userAnswers).length === 0) {
    Logger.log('Validation Error: userAnswers must be a non-empty object. userAnswers: ' + JSON.stringify(data.userAnswers));
    throw new Error('userAnswers must be a non-empty object (map).');
  }
  // Add more specific validation for each field if necessary
  return true;
}

function sanitizeInput(data) {
  // Basic sanitization: prevent script injection by converting to string and escaping HTML
  // For production, consider a more robust sanitization library or method
  const sanitizedData = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      if (typeof data[key] === 'string') {
        sanitizedData[key] = data[key].replace(/</g, '&lt;').replace(/>/g, '&gt;');
      } else if (typeof data[key] === 'object' && data[key] !== null) {
        sanitizedData[key] = sanitizeInput(data[key]); // Recursively sanitize objects
      } else {
        sanitizedData[key] = data[key];
      }
    }
  }
  return sanitizedData;
}

function doPost(e) {
  Logger.log('doPost received event: ' + JSON.stringify(e)); // Log the entire event object
  let response = { success: false, message: 'An unknown error occurred.' };
  let output = ContentService.createTextOutput();

  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('Invalid request: No POST data found.');
    }

    let requestBody = JSON.parse(e.postData.contents);
    Logger.log('Parsed request body: ' + JSON.stringify(requestBody)); // Log parsed request body
    
    // Validate and sanitize input
    validateInput(requestBody);
    requestBody = sanitizeInput(requestBody);
    Logger.log('Validated and sanitized request body: ' + JSON.stringify(requestBody));

    const quizSheetId = requestBody.quizSheetId;
    const responseSheetId = requestBody.responseSheetId;
    const userAnswers = requestBody.userAnswers;
    const metadata = requestBody.metadata;

    Logger.log('DEBUG: Incoming metadata before dataToAppend construction: ' + JSON.stringify(metadata)); // NEW LOGGING LINE
    
    // Extract client IP address
    const clientIpAddress = e.remoteAddress || 'Unknown';
    metadata.clientIpAddress = clientIpAddress;
    // metadata.timestamp = new Date().toISOString(); // Frontend already sends timestamp in metadata, avoid overwriting

    // Combine all data into a single object for dynamic mapping
    const dataToAppend = {
      // Map the lowercase 'timestamp' from metadata to uppercase 'Timestamp' for the sheet header
      Timestamp: metadata.Timestamp, 
      quizSheetId: quizSheetId,
      responseSheetId: responseSheetId, // Potentially useful for logging/debugging in sheet
      ...userAnswers,
      // Map other metadata fields explicitly to ensure they are included
      userAgent: metadata.userAgent,
      latitude: metadata.latitude,
      longitude: metadata.longitude,
      accuracy: metadata.accuracy,
      locationStatus: metadata.locationStatus,
      clientIpAddress: metadata.clientIpAddress,
    };
    
    Logger.log('Data prepared for appending to sheet: ' + JSON.stringify(dataToAppend));

    // Append data to the response sheet using dynamic column mapping
    appendRowToSheet(responseSheetId, dataToAppend, Object.keys(userAnswers));
    Logger.log('doPost: Row append operation completed.');

    response = { success: true, message: 'Quiz response recorded successfully.' };

  } catch (error) {
    response = { success: false, message: `Error in doPost: ${error.message}` };
    Logger.log(`Error in doPost: ${error.message}`, error); // Log full error object
  }

  output.setContent(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
  return output;
}
