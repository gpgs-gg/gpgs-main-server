const { GoogleSpreadsheet } = require("google-spreadsheet");

const fetchPropertySheetData = async (req, res) => {
  const value =
    req.query.sheetId ; // Default
     console.log("value", value)
  // Expecting "spreadsheetId,MonthYear"
  const [spreadsheetId, currentMonth] = value.split(",");

  if (!spreadsheetId || !currentMonth) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid input. Pass spreadsheetId,MonthYear" });
  }

  try {
    const doc = new GoogleSpreadsheet(spreadsheetId);

    // Authenticate using service account
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });

    // Load the document information
    await doc.loadInfo();

    // ✅ Use month from query, not system date
    const sheetTitle = currentMonth; // e.g. "Aug2025"
    const sheet = doc.sheetsByTitle[sheetTitle];

    if (!sheet) {
      return res
        .status(404)
        .json({ success: false, message: `Sheet "${sheetTitle}" not found` });
    }

    const rows = await sheet.getRows();

    const result = [];

    for (const row of rows) {
      const CurDueAmt = row["CurDueAmt"] || "";
      const DADue = row["DADue"]?.toString().trim() || "";
      const FullName = row["FullName"]?.toString().trim() || "";
      const PreDueAmt = row["PreDueAmt"]?.toString().trim() || "";

      if (FullName || CurDueAmt || DADue || PreDueAmt) {
        result.push({
          CurDueAmt,
          DADue,
          FullName,
          PreDueAmt,
        });
      }
    }

    return res.json({ success: true, total: result.length, data: result });
  } catch (err) {
    console.error("Error:", err.message);
    return res.status(500).json({ success: false, message: "Fetch failed" });
  }
};

module.exports = {
  fetchPropertySheetData,
};