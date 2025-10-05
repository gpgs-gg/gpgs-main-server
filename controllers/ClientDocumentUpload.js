const { google } = require('googleapis');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const { AllSheetNames } = require('../Config');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const uploadToCloudinary = (fileBuffer, filename, propertyCode = 'General' , subFolderName) => {
        
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
         folder: `${propertyCode}/${subFolderName}`,
        public_id: filename.split('.')[0],
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

const ClientDocumentUpload = async (req, res) => {
  try {
    if (!req.body || !req.body.ID) {
      return res.status(400).json({ error: '❌ Missing client "ID" in request body.' });
    }

    const sheetTitle = AllSheetNames.CLIENT_MASTER_TABLE;
    const spreadsheetId = "1AWJQlzuoxkhuR75GMq1EFpqexqDuI1WsxI14BON1olU";

    // Authorize Google Sheets
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Get header row
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!1:1`,
    });
    const headers = headerResponse.data.values?.[0] || [];

    if (headers.length === 0) {
      return res.status(400).json({ error: '❌ Header row is empty or missing.' });
    }

    const IDIndex = headers.indexOf("ClientID");
    if (IDIndex === -1) {
      return res.status(400).json({ error: '❌ "ID" column not found in header.' });
    }

    // Get all data rows
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!A2:Z`,
    });
    const rows = dataResponse.data.values || [];

    // Find row index for the propertyCode
    const matchRowIndex = rows.findIndex(
      row => (row[IDIndex] || "").trim().toLowerCase() === req.body.ID.trim().toLowerCase()
    );

    if (matchRowIndex === -1) {
      return res.status(404).json({
        error: `❌ PropertyCode "${req.body.ID}" not found in sheet "${sheetTitle}".`,
      });
    }

    // Upload files to Cloudinary
    const uploadedFileURLs = [];
    if (req.files?.length > 0) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer, file.originalname, req.body.propertyCode , req.body.name);
        uploadedFileURLs.push(url);
      }
    }

    const updateField = req.body.updateField; // 'KYCDocuments' or 'PGLegalDocuments'

    // Prepare updates array
    const updates = [];

    // Update KYCDocuments or PGLegalDocuments with new URLs (comma-separated)
    if (updateField === 'KYCDocuments' || updateField === 'PGLegalDocuments') {
      const colIndex = headers.indexOf(updateField);
      if (colIndex !== -1) {
        // Get existing document URLs from sheet for this row
        const existingDocs = (rows[matchRowIndex][colIndex] || "").split(",").map(s => s.trim()).filter(Boolean);
        const combinedDocs = [...existingDocs, ...uploadedFileURLs];
        const uniqueDocs = [...new Set(combinedDocs)]; // Remove duplicates

        updates.push({
          colIndex,
          value: uniqueDocs.join(", "),
        });
      }
    } else {
      return res.status(400).json({ error: '❌ Invalid updateField. Must be KYCDocuments or PGLegalDocuments.' });
    }

    // Update DocumentUploadedStatus column with the JSON string from request
    const statusColIndex = headers.indexOf("DocumentUploadedStatus");
    if (statusColIndex !== -1) {
      // Expecting DocumentUploadedStatus in req.body as JSON string
      let docStatus = req.body.DocumentUploadedStatus;
      try {
        if (typeof docStatus === 'string') {
          docStatus = JSON.parse(docStatus);
        }
      } catch (e) {
        // If parsing fails, fallback to empty object
        docStatus = {};
      }

      updates.push({
        colIndex: statusColIndex,
        value: JSON.stringify(docStatus),
      });
    }

    if (updates.length === 0) {
      return res.status(200).json({ message: '⚠️ No changes to update.', updated: false });
    }

    // Calculate update range
    const sheetRowNumber = matchRowIndex + 2; // account for header row
    updates.sort((a, b) => a.colIndex - b.colIndex);

    const startCol = String.fromCharCode(65 + updates[0].colIndex);
    const endCol = String.fromCharCode(65 + updates[updates.length - 1].colIndex);
    const range = `${sheetTitle}!${startCol}${sheetRowNumber}:${endCol}${sheetRowNumber}`;

    // Prepare values array for update
    const rowValues = [];
    for (let i = updates[0].colIndex; i <= updates[updates.length - 1].colIndex; i++) {
      const update = updates.find(u => u.colIndex === i);
      rowValues.push(update ? update.value : "");
    }

    // Update the sheet row
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [rowValues] },
    });

    return res.status(200).json({
      message: `✅ PropertyCode "${req.body.propertyCode}" updated successfully.`,
      updatedColumns: updates.map(u => headers[u.colIndex]),
      filesProcessed: req.files?.map(f => f.originalname) || [],
    });

  } catch (error) {
    console.error("❌ Error updating sheet:", error);
    return res.status(500).json({
      error: '❌ Failed to update property documents.',
      details: error.message,
    });
  }
};

module.exports = {
  ClientDocumentUpload,
};






