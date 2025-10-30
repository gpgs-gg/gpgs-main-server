const { google } = require('googleapis');

const addRowToSheet = async (req, res) => {
  try {
    const { rnrSheetData, selectedMonth } = req.body;

    if (!rnrSheetData?.PropertyCode || !selectedMonth) {
      return res.status(400).json({ error: '❌ Missing "PropertyCode" or "selectedMonth" in request body.' });
    }

    const sheetTitle = `RNR_${selectedMonth}`;
  

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = "1yLQjZTxmXqE9PEexMd9yCvMkyBmNJbHbws6mTFj9-TE";

    // Get sheet metadata
    const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = sheetMeta.data.sheets.find(s => s.properties.title === sheetTitle);
    if (!sheet) {
      return res.status(404).json({ error: `❌ Sheet titled "${sheetTitle}" not found.` });
    }

    const sheetId = sheet.properties.sheetId;

    // Get header row
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!1:1`,
    });

    const headers = headerResponse.data.values?.[0] || [];

    if (headers.length === 0) {
      return res.status(400).json({ error: '❌ Header row is empty or missing.' });
    }

    const propertyCodeIndex = headers.indexOf("PropertyCode");
    if (propertyCodeIndex === -1) {
      return res.status(400).json({ error: '❌ "PropertyCode" column not found in header.' });
    }

    // Fetch data rows
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!A2:Z`,
    });

    const rows = dataResponse.data.values || [];

    // Case-insensitive match for PropertyCode
    const matchRowIndex = rows.findIndex(
      row => (row[propertyCodeIndex] || "").trim().toLowerCase() === rnrSheetData.PropertyCode.trim().toLowerCase()
    );

    // Build row data aligned with headers
    const rowData = headers.map(header => {
      let value = rnrSheetData[header];

      // If it's a formula string that should go into Sheets
      if (typeof value === 'string' && value.trim().startsWith('=')) {
        return value.trim();
      }

      return value ?? "";
    });

    if (matchRowIndex !== -1) {
      // ✅ Update existing row
      const sheetRowNumber = matchRowIndex + 2;
      const existingRow = rows[matchRowIndex] || [];

      // Merge existing data with new values
      const updatedRow = headers.map((header, colIndex) => {
        const newValue = rnrSheetData.hasOwnProperty(header) ? rnrSheetData[header] : undefined;

        if (newValue !== undefined) {
          if (typeof newValue === 'string' && newValue.trim().startsWith('=')) {
            return newValue.trim();
          }
          return newValue;
        }

        return existingRow[colIndex] || "";
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetTitle}!A${sheetRowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [updatedRow],
        },
      });

      return res.status(200).json({
        message: `✅ Updated row for PropertyCode "${rnrSheetData.PropertyCode}" in sheet "${sheetTitle}".`,
        updated: updatedRow,
      });
    } else {
      // ❌ Do not insert — return error
      return res.status(404).json({
        error: `❌ PropertyCode "${rnrSheetData.PropertyCode}" not found in sheet "${sheetTitle}". No row was updated.`,
      });
    }
  } catch (error) {
    console.error("❌ Error inserting/updating row:", error);
    res.status(500).json({
      error: '❌ Failed to insert or update row in sheet.',
      details: error.message,
    });
  }
};

module.exports = {
  addRowToSheet,
};
