const { AllSheetNames } = require("../Config");
const { google } = require('googleapis');

const changePassword = async (req, res) => {
  console.log("Received updateTicketSheetData request body:", req.body);

  try {
    const { LoginID } = req.body;

    if (!LoginID) {
      return res.status(400).json({ error: '❌ Missing "LoginID" in request body.' });
    }

    const sheetTitle = AllSheetNames.EMPLOYEE_MASTER_TABLE;

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = "1qU4HIzA6gidPPVItkUOCczLxPsLowasSFG4V2y7TuYU";

    // Get headers
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!1:1`,
    });

    const headers = headerRes.data.values?.[0] || [];
    if (headers.length === 0) {
      return res.status(400).json({ error: '❌ Header row is empty or missing.' });
    }

    const loginIdIndex = headers.indexOf("LoginID");
    if (loginIdIndex === -1) {
      return res.status(400).json({ error: '❌ "Login ID" column not found in header.' });
    }

    // Get all rows
    const dataRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!A2:Z`, // assuming up to Z
    });

    const rows = dataRes.data.values || [];

    // Match row index by Login ID (case-insensitive)
    const matchRowIndex = rows.findIndex(
      row => (row[loginIdIndex] || "").trim().toLowerCase() === LoginID.trim().toLowerCase()
    );

    if (matchRowIndex === -1) {
      return res.status(404).json({
        error: `❌ LoginID "${LoginID}" not found in sheet "${sheetTitle}".`,
      });
    }

    const existingRow = rows[matchRowIndex] || [];

    // Only update fields present in the request body
    const updatedRow = headers.map((header, colIndex) => {
      const newValue = req.body.hasOwnProperty(header) ? req.body[header] : undefined;
      const existingValue = existingRow[colIndex] || "";

      if (newValue !== undefined && newValue !== null) {
        if (typeof newValue === "string" && newValue.trim().startsWith("=")) {
          return newValue.trim();
        }
        if (["string", "number", "boolean"].includes(typeof newValue)) {
          return newValue;
        }
      }

      return existingValue;
    });

    const sheetRowNumber = matchRowIndex + 2; // account for header row
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetTitle}!A${sheetRowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [updatedRow],
      },
    });

    return res.status(200).json({
      message: `✅ Row for LoginID "${LoginID}" updated successfully.`,
      updated: updatedRow,
    });

  } catch (error) {
    console.error("❌ Error updating row:", error);
    return res.status(500).json({
      error: '❌ Failed to update row.',
      details: error.message,
    });
  }
};


module.exports = {
  changePassword,  
}