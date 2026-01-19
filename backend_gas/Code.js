function appendRowToSheet(sheetId, dataToAppend) {
  const spreadsheet = SpreadsheetApp.openById(sheetId);
  const sheet = spreadsheet.getSheets()[0]; // Assuming the first sheet is the target
  if (!sheet) {
    throw new Error(`Target sheet not found in spreadsheet with ID: ${sheetId}`);
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
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
  sheet.appendRow(rowData);
}

function validateInput(data) {
  // Basic validation: ensure essential fields exist
  if (!data || !data.quizSheetId || !data.userAnswers || !data.metadata || !data.responseSheetId) {
    throw new Error('Missing essential data: quizSheetId, userAnswers, metadata, or responseSheetId.');
  }
  if (typeof data.userAnswers !== 'object' || data.userAnswers === null || Object.keys(data.userAnswers).length === 0) {
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
  let response = { success: false, message: 'An unknown error occurred.' };
  let output = ContentService.createTextOutput();

  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('Invalid request: No POST data found.');
    }

    let requestBody = JSON.parse(e.postData.contents);
    
    // Validate and sanitize input
    validateInput(requestBody);
    requestBody = sanitizeInput(requestBody);

    const quizSheetId = requestBody.quizSheetId;
    const responseSheetId = requestBody.responseSheetId;
    const userAnswers = requestBody.userAnswers; // This is now a map/object
    const metadata = requestBody.metadata;

    // Extract client IP address
    const clientIpAddress = e.remoteAddress || 'Unknown';
    metadata.clientIpAddress = clientIpAddress;
    metadata.timestamp = new Date().toISOString();

    // Combine all data into a single object for dynamic mapping
    const dataToAppend = {
      quizSheetId: quizSheetId,
      responseSheetId: responseSheetId, // Potentially useful for logging/debugging in sheet
      // Spread userAnswers directly into dataToAppend
      ...userAnswers,
      // Spread metadata directly into dataToAppend
      ...metadata,
      metadata,
      userAnswers
    };
    
    // Ensure `userAnswers` and `metadata` themselves are not passed if their keys are spread
    // We already spread their content, so these top-level objects are redundant here
    // delete dataToAppend.userAnswers;
    // delete dataToAppend.metadata;


    // Append data to the response sheet using dynamic column mapping
    appendRowToSheet(responseSheetId, dataToAppend);

    response = { success: true, message: 'Quiz response recorded successfully.' };

  } catch (error) {
    response = { success: false, message: `Error in doPost: ${error.message}` };
    Logger.log(`Error in doPost: ${error.message}`);
  }

  output.setContent(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
  return output;
}
