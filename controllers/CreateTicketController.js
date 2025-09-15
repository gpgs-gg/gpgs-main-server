const { google } = require('googleapis');
const { AllSheetNames } = require('../Config');
const CreateTicket = async (req, res) => {

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

    // Generate new TicketID
    const currentYear = new Date().getFullYear();
    const lastID = TicketIDs[0] || `TKT-${currentYear}-0000`;
    const lastNumber = parseInt(lastID.split("-")[2]) || 0;
    const nextID = `TKT-${currentYear}-${(lastNumber + 1).toString().padStart(4, '0')}`;

    // Generate current date
    const currentDate = new Date().toLocaleString('en-GB', {
      timeZone: 'Asia/Kolkata',
    });

    // ✅ Handle uploaded files
    const uploadedFileURLs = req.files?.map(file => {
      return `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
    }) || [];

    // 🔹 Prepare data row
    const rowData = headers.map(header => {
      switch (header) {
        case 'TicketID':
          return nextID;
        case 'DateCreated':
          return currentDate;
        case 'Attachment': // Assuming this is the column to store file URLs
        case 'Images':
        case 'Files':
          return uploadedFileURLs.join(', ');
        default:
          const value = req.body[header];
          if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value); // convert to string
          }
          return value ?? "";
      }
    });

    // 🔹 Insert row
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

    // 🔹 Update values
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
      files: uploadedFileURLs,
    });

  } catch (error) {
    console.error("❌ Error creating ticket:", error);
    res.status(500).json({ error: 'Failed to insert ticket row' });
  }
};








const updateTicketSheetData = async (req, res) => {
  const bodyAttachmentRaw = req.body.Attachment || "";
  try {
    if (!req.body || !req.body.TicketID) {
      return res.status(400).json({ error: '❌ Missing "TicketID" in request body.' });
    }

    const sheetTitle = AllSheetNames.TICKET_MASTER_TABLE;

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY
          ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
          : '',
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = "1kHjPWalsEaPO6IS756N43IFk7z1xRcrDeO6VG2AurwI";

    // Get headers
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

    // Fetch all data rows
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!A2:Z`,
    });
    const rows = dataResponse.data.values || [];

    // Find the matching row
    const matchRowIndex = rows.findIndex(
      row => (row[ticketIdIndex] || "").trim().toLowerCase() === req.body.TicketID.trim().toLowerCase()
    );

    if (matchRowIndex === -1) {
      return res.status(404).json({
        error: `❌ TicketID "${req.body.TicketID}" not found in sheet "${sheetTitle}".`,
      });
    }

    const rawRow = rows[matchRowIndex] || [];
    const existingRow = headers.map((_, idx) => rawRow[idx] || "");

    // Prepare uploaded file URLs (from multer uploaded files)
    const uploadedFileURLs = (req.files || []).map(file =>
      `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
    );

    // --- Build partial update ---
    const updatedColumns = [];
    const updatedValues = [];

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];

      // Skip TicketID (don't update it)
      if (header === "TicketID") continue;

      // Handle Attachment column specifically
      if (header === "Attachment") {
        // Get raw Attachment string from request body, default to empty string
        const bodyAttachmentRaw = req.body.Attachment || "";

        // Split existing attachments by comma, trim and filter out any 'blob:' URLs

        // const validUrlPattern = /https?:\/\/localhost:\d+\/[^",]+/g;

        // const existingAttachments = [...bodyAttachmentRaw.matchAll(validUrlPattern)]
        //   .map(match => match[0].trim())
        //   .filter(url => !url.startsWith("blob:"));



        const validUrlPattern = /(https?:\/\/localhost:\d+\/[^",]+|https?:\/\/gpgs-main-server\.vercel\.app\/[^",]+)/g;

        const existingAttachments = [...bodyAttachmentRaw.matchAll(validUrlPattern)]
          .map(match => match[0].trim())
          .filter(url => !url.startsWith("blob:"));



        // Combine existing attachments + newly uploaded URLs
        const combined = [...existingAttachments, ...uploadedFileURLs].join(", ");

        if (combined.length > 0) {
          updatedColumns.push(i);
          updatedValues.push(combined);
        }

        continue;
      }

      // Update fields from req.body if present
      if (Object.prototype.hasOwnProperty.call(req.body, header)) {
        let value = req.body[header];

        if (typeof value === 'string' && value.trim().startsWith('=')) {
          // Keep formulas as is
          value = value.trim();
        } else if (typeof value === 'object') {
          // Convert objects to JSON string
          value = JSON.stringify(value);
        }

        updatedColumns.push(i);
        updatedValues.push(value);
      }
    }

    // Nothing to update?
    if (updatedColumns.length === 0) {
      return res.status(200).json({
        message: '⚠️ No changes to update.',
        updated: false,
      });
    }

    // Prepare range and update row in sheet
    const sheetRowNumber = matchRowIndex + 2; // Account for header row offset

    // Convert column indexes to letters (A, B, C, ...)
    const colLetters = updatedColumns.map(idx =>
      String.fromCharCode(65 + idx)
    );
    const startCol = colLetters[0];
    const endCol = colLetters[colLetters.length - 1];

    const range = `${sheetTitle}!${startCol}${sheetRowNumber}:${endCol}${sheetRowNumber}`;

    // Prepare array of values for the update (in correct order)
    const rowToUpdate = Array(updatedColumns.length).fill('');
    updatedColumns.forEach((colIdx, i) => {
      rowToUpdate[i] = updatedValues[i];
    });

    // Update the sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowToUpdate],
      },
    });

    return res.status(200).json({
      message: `✅ Ticket "${req.body.TicketID}" updated successfully.`,
      updatedColumns: updatedColumns.map(i => headers[i]),
      filesProcessed: req.files?.map(f => f.originalname) || [],
    });
  } catch (error) {
    console.error("❌ Error updating sheet:", error);
    return res.status(500).json({
      error: '❌ Failed to update ticket.',
      details: error.message,
    });
  }
};



module.exports = {
  updateTicketSheetData,
  CreateTicket
};
