const { GoogleSpreadsheet } = require("google-spreadsheet");

const fetchPropertiesSheetData = async (req, res) => {
  const spreadsheetId = "10xeJnTEOuOQWSu1OefIU-VSLSRYuy484vii9kwt_Nl0";
  const sheetTitle = "Properties_Details";

  if (!spreadsheetId || !sheetTitle) {
    return res.status(400).json({ success: false, message: "Missing sheet ID or title" });
  }

  try {
    const doc = new GoogleSpreadsheet(spreadsheetId);

    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });

    await doc.loadInfo();

    const sheet = doc.sheetsByTitle[sheetTitle];
    if (!sheet) {
      return res.status(404).json({ success: false, message: "Sheet not found" });
    }

    const rows = await sheet.getRows();
    const headers = sheet.headerValues.map(h => h.replace(/\n/g, ' ').trim());

    const data = rows.map(row => {
      const rowData = {};
      headers.forEach((header, i) => {
        rowData[header] = row._rawData[i] || "";
      });
      return rowData;
    });

    return res.json({ success: true, total: data.length, data });
  } catch (error) {
    console.error("Error fetching sheet:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch sheet data" });
  }
};

module.exports = {
  fetchPropertiesSheetData,
};
