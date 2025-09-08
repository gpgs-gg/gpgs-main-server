const { google } = require('googleapis');
const { AllSheetNames } = require('../Config');

const CreateTicket = async (req, res) => {

  console.log("Received CreateTicket request body:", req.body);

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = "1kHjPWalsEaPO6IS756N43IFk7z1xRcrDeO6VG2AurwI";
    const sheetTitle = req.query.sheet || AllSheetNames.TICKET_MASTER_TABLE;
    
    // 🔹 Get sheet metadata
    const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = sheetMeta.data.sheets.find(s => s.properties.title === sheetTitle);
    if (!sheet) {
      return res.status(404).json({ error: `❌ Sheet titled "${sheetTitle}" not found.` });
    }
    const sheetId = sheet.properties.sheetId;

    // 🔹 Get header row
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!1:1`,
    });
    const headers = headerResponse.data.values?.[0] || [];
    if (headers.length === 0) {
      return res.status(400).json({ error: '❌ Header row is empty or missing.' });
    }

    // 🔹 Get current data to determine latest TicketID
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!A2:A`,
    });
    const TicketIDs = dataResponse.data.values?.flat() || [];

    // Generate new TicketID (format: TKT-YYYY-XXXX)
    const currentYear = new Date().getFullYear();
    const lastID = TicketIDs[0] || `TKT-${currentYear}-0000`;
    const lastNumber = parseInt(lastID.split("-")[2]) || 0;
    const nextID = `TKT-${currentYear}-${(lastNumber + 1).toString().padStart(4, '0')}`;

    // Generate current date
    const currentDate = new Date().toLocaleString('en-GB', {
      timeZone: 'Asia/Kolkata',
    });

    // 🔹 Prepare data row
    const rowData = headers.map(header => {
      switch (header) {
        case 'TicketID':
          return nextID;
        case 'DateCreated':
          return currentDate;
        default:
          const value = req.body[header];
          console.log("Value for header", header, ":", value);
          if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value); // convert to string
          }
          return value ?? "";
      }
    });
    // 🔹 Insert new row at top (after header)
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

    // 🔹 Update new row with data
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetTitle}!A2`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [rowData],
      },
    });

    res.status(200).json({
      message: `✅ New ticket created successfully.`,
      TicketID: nextID,
      inserted: rowData,
    });

  } catch (error) {
    console.error("❌ Error creating ticket:", error);
    res.status(500).json({ error: 'Failed to insert ticket row' });
  }
};





const updateTicketSheetData = async (req, res) => {
  try {
    if (!req.body || !req.body.TicketID) {
      return res.status(400).json({ error: '❌ Missing "TicketID" in request body.' });
    }

    const sheetTitle = AllSheetNames.TICKET_MASTER_TABLE;

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = "1kHjPWalsEaPO6IS756N43IFk7z1xRcrDeO6VG2AurwI";

    // Get sheet metadata
    const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = sheetMeta.data.sheets.find(s => s.properties.title === sheetTitle);
    if (!sheet) {
      return res.status(404).json({ error: `❌ Sheet titled "${sheetTitle}" not found.` });
    }

    // Get header row
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!1:1`,
    });

    const headers = headerResponse.data.values?.[0] || [];
    if (headers.length === 0) {
      return res.status(400).json({ error: '❌ Header row is empty or missing.' });
    }

    const ticketIdIndex = headers.indexOf("TicketID");
    if (ticketIdIndex === -1) {
      return res.status(400).json({ error: '❌ "TicketID" column not found in header.' });
    }

    // Fetch data rows
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!A2:Z`,
    });

    const rows = dataResponse.data.values || [];

    // Case-insensitive TicketID match
    const matchRowIndex = rows.findIndex(
      row => (row[ticketIdIndex] || "").trim().toLowerCase() === req.body.TicketID.trim().toLowerCase()
    );

    if (matchRowIndex === -1) {
      return res.status(404).json({
        error: `❌ TicketID "${req.body.TicketID}" not found in sheet "${sheetTitle}". No row was updated.`,
      });
    }

    const existingRow = rows[matchRowIndex] || [];
   const updatedRow = headers.map((header, colIndex) => {
  const existingValue = existingRow[colIndex] || "";
  const newValue = req.body.hasOwnProperty(header) ? req.body[header] : undefined;

  if (newValue !== undefined && newValue !== null) {
    if (typeof newValue === 'string' && newValue.trim().startsWith('=')) {
      return newValue.trim();
    }
    // Only allow string, number, or boolean
    if (['string', 'number', 'boolean'].includes(typeof newValue)) {
      return newValue;
    }
  }

  return existingValue;
});


    const sheetRowNumber = matchRowIndex + 2; // +2 because data starts at row 2 in sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetTitle}!A${sheetRowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [updatedRow],
      },
    });

    return res.status(200).json({
      message: `✅ Updated row for TicketID "${req.body.TicketID}" in sheet "${sheetTitle}".`,
      updated: updatedRow,
    });
  } catch (error) {
    console.error("❌ Error inserting/updating row:", error);
    res.status(500).json({
      error: '❌ Failed to insert or update row in sheet.',
      details: error.message,
    });
  }
};


module.exports = {
  updateTicketSheetData,
  CreateTicket
};
