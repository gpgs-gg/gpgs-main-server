require('dotenv').config();
const { google } = require('googleapis');
const { AllSheetNames } = require('../Config');


const ClientCreation = async (req, res) => {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = "1AWJQlzuoxkhuR75GMq1EFpqexqDuI1WsxI14BON1olU";
    const sheetTitle = AllSheetNames.CLIENT_MASTER_TABLE;

    if (!sheetTitle) {
      return res.status(400).json({ error: '❌ Missing sheet title.' });
    }

    const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = sheetMeta.data.sheets.find(s => s.properties.title === sheetTitle);
    if (!sheet) {
      return res.status(404).json({ error: `❌ Sheet titled "${sheetTitle}" not found.` });
    }
    const sheetId = sheet.properties.sheetId;

    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!1:1`,
    });

    const headers = headerResponse.data.values?.[0] || [];

    if (headers.length === 0) {
      return res.status(400).json({ error: '❌ Header row is empty or missing.' });
    }

    const currentDate = new Date().toLocaleString('en-GB', {
      timeZone: 'Asia/Kolkata',
    });

    // Fetch all existing data
    const existingRowsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!A2:Z1000`, // Adjust range based on expected row size
    });

    const existingRows = existingRowsResponse.data.values || [];

    // Find index of ClientID column
    const clientIdIndex = headers.indexOf('ClientID');
    if (clientIdIndex === -1) {
      return res.status(400).json({ error: '❌ "ClientID" column not found in headers.' });
    }

    // Find row index (0-based relative to A2) if ClientID matches
    const clientId = req.body.ClientID;
    let matchedRowIndex = -1;
    if (clientId) {
      matchedRowIndex = existingRows.findIndex(row => row[clientIdIndex] === clientId);
    }

    // Construct new row data
    const rowData = headers.map(header => {
      const value = req.body[header];

      if (header === 'DateCreated') {
        return currentDate;
      }

      if (['Attachment', 'Images', 'Files'].includes(header)) {
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
              return parsed.join(', ');
            }
            return value;
          } catch {
            return value;
          }
        }

        if (Array.isArray(value)) {
          return value.join(', ');
        }

        return value ?? '';
      }

      return typeof value === 'object' ? JSON.stringify(value) : (value ?? '');
    });

    // If match found, update existing row
    if (matchedRowIndex !== -1) {
      const targetRowNumber = matchedRowIndex + 2; // +2 because header is row 1
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetTitle}!A${targetRowNumber}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [rowData],
        },
      });

      return res.status(200).json({
        message: `✅ ClientID matched. Row updated at position ${targetRowNumber}.`,
        updated: rowData,
      });
    }

    // No match, insert new row at row 2
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          insertDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: 1,
              endIndex: 2,
            },
            inheritFromBefore: false,
          },
        }],
      },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetTitle}!A2`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [rowData],
      },
    });

    res.status(200).json({
      message: `✅ New row created successfully.`,
      inserted: rowData,
    });

 

  } catch (error) {
    console.error("❌ Error creating/updating row:", error);
    res.status(500).json({ error: 'Failed to insert or update row' });
  }
};

module.exports = { ClientCreation };
