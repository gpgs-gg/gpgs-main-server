const { google } = require('googleapis');

const addRowToSheet = async (req, res) => {
  try {
    const { rnrSheetData, selectedMonth } = req.body;

    if (!rnrSheetData?.PropertyCode || !selectedMonth) {
      return res.status(400).json({ error: '❌ Missing "PropertyCode" or "selectedMonth" in request body.' });
    }

    const sheetTitle = `RNR_${selectedMonth}`;
    console.log(`📝 Target sheet: ${sheetTitle}`);
    console.log(`🔍 Looking for PropertyCode: ${rnrSheetData.PropertyCode}`);

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = "1yLQjZTxmXqE9PEexMd9yCvMkyBmNJbHbws6mTFj9-TE";

    // Get metadata to find the correct sheetId
    const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = sheetMeta.data.sheets.find(s => s.properties.title === sheetTitle);
    if (!sheet) {
      return res.status(404).json({ error: `❌ Sheet titled "${sheetTitle}" not found.` });
    }

    const sheetId = sheet.properties.sheetId;

    // Fetch header row
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

    // Fetch all data rows
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

      // If it's a formula string that should go into Sheets (e.g. starts with `=`)
      if (typeof value === 'string' && value.trim().startsWith('=')) {
        return value.trim(); // Keep as-is so it becomes a real formula in Sheets
      }

      return value ?? "";
    });


    if (matchRowIndex !== -1) {
      // ✅ Update existing row
      const sheetRowNumber = matchRowIndex + 2;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetTitle}!A${sheetRowNumber}`,
        valueInputOption: 'USER_ENTERED', // ✅ Ensures formulas are parsed
        requestBody: {
          values: [rowData],
        },
      });

      return res.status(200).json({
        message: `✅ Updated existing row for PropertyCode "${rnrSheetData.PropertyCode}" in sheet "${sheetTitle}".`,
        updated: rowData,
      });
    } else {
      // ➕ Insert new row below header (at row 2)
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              insertDimension: {
                range: {
                  sheetId,
                  dimension: 'ROWS',
                  startIndex: 1,
                  endIndex: 2,
                },
                inheritFromBefore: false,
              },
            },
          ],
        },
      });

      // Now insert data into the new row (A2)
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetTitle}!A2`,
        valueInputOption: 'USER_ENTERED', // ✅ Ensures formulas are parsed
        requestBody: {
          values: [rowData],
        },
      });

      return res.status(200).json({
        message: `✅ Inserted new row for PropertyCode "${rnrSheetData.PropertyCode}" at top of sheet "${sheetTitle}".`,
        inserted: rowData,
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
