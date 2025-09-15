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
  console.log("bodyAttachmentRaw", bodyAttachmentRaw);
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

    // Find the matching row index by TicketID
    const matchRowIndex = rows.findIndex(
      row => (row[ticketIdIndex] || "").trim().toLowerCase() === req.body.TicketID.trim().toLowerCase()
    );

    if (matchRowIndex === -1) {
      return res.status(404).json({
        error: `❌ TicketID "${req.body.TicketID}" not found in sheet "${sheetTitle}".`,
      });
    }

    // Prepare uploaded file URLs (from multer uploaded files)
    const uploadedFileURLs = (req.files || []).map(file =>
      `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
    );

    // --- Build partial update by matching header names ---
    const updates = []; // To store {colIndex, value}

    for (const header of headers) {
      if (header === "TicketID") continue; // Don't update TicketID column

      if (header === "Attachment") {
        const validUrlPattern = /(https?:\/\/localhost:\d+\/[^",]+|https?:\/\/gpgs-main-server\.vercel\.app\/[^",]+)/g;

        // Extract valid existing attachments from req.body.Attachment
        const existingAttachments = [...bodyAttachmentRaw.matchAll(validUrlPattern)]
          .map(match => match[0].trim())
          .filter(url => !url.startsWith("blob:"));

        // Combine existing + newly uploaded
        const combined = [...existingAttachments, ...uploadedFileURLs].join(", ");

        if (combined.length > 0) {
          const colIndex = headers.indexOf(header);
          updates.push({ colIndex, value: combined });
        }
      } else if (Object.prototype.hasOwnProperty.call(req.body, header)) {
        let value = req.body[header];

        if (typeof value === 'string' && value.trim().startsWith('=')) {
          value = value.trim(); // preserve formulas
        } else if (typeof value === 'object') {
          value = JSON.stringify(value);
        }

        const colIndex = headers.indexOf(header);
        updates.push({ colIndex, value });
      }
    }

    if (updates.length === 0) {
      return res.status(200).json({
        message: '⚠️ No changes to update.',
        updated: false,
      });
    }

    // Google Sheets uses A, B, C... for columns
    const sheetRowNumber = matchRowIndex + 2; // +2 because rows start at 1 and 1 is header

    // Sort updates by column index ascending (optional but tidy)
    updates.sort((a, b) => a.colIndex - b.colIndex);

    const startCol = String.fromCharCode(65 + updates[0].colIndex);
    const endCol = String.fromCharCode(65 + updates[updates.length - 1].colIndex);
    const range = `${sheetTitle}!${startCol}${sheetRowNumber}:${endCol}${sheetRowNumber}`;

    // Build row values in order for the range
    const rowValues = [];
    for (let i = updates[0].colIndex; i <= updates[updates.length - 1].colIndex; i++) {
      const update = updates.find(u => u.colIndex === i);
      rowValues.push(update ? update.value : "");
    }

    // Update the sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowValues],
      },
    });

    return res.status(200).json({
      message: `✅ Ticket "${req.body.TicketID}" updated successfully.`,
      updatedColumns: updates.map(u => headers[u.colIndex]),
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
