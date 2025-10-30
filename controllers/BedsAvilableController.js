// const { GoogleSpreadsheet } = require("google-spreadsheet");
// const { JWT } = require("google-auth-library");

// const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

// const auth = new JWT({
//   email: process.env.GOOGLE_CLIENT_EMAIL,
//   key: privateKey,
//   scopes: ["https://www.googleapis.com/auth/spreadsheets"],
// });

// async function fetchSheetData(spreadsheetId, sheetTitle) {
//   try {
//     const doc = new GoogleSpreadsheet(spreadsheetId, auth);
//     await doc.loadInfo();

//     const sheet = doc.sheetsByTitle[sheetTitle];
//     if (!sheet) {
//       console.error("Sheet not found:", sheetTitle);
//       return [];
//     }

//     const rows = await sheet.getRows();
//     const headers = sheet.headerValues.map(h => h.replace(/\n/g, ' ').trim());

//     const data = rows.map(row => {
//       const rowData = {};
//       headers.forEach((header, i) => {
//         rowData[header] = row._rawData[i] || "";
//       });
//       return rowData;
//     });

//     return data;
//   } catch (error) {
//     console.error("Error fetching sheet:", error.message);
//     return [];
//   }
// }

// exports.getGoogleSheetData = async (req, res) => {
//   try {
//     const spreadsheetId = "1EUnGZWk9LWwAE-WIcYfOTpeQwnzy7AK3ct7_FTkbtxs";
//     const sheetTitle = "Bedslist_gpgs";

//     if (!spreadsheetId) {
//       return res.status(400).json({ success: false, message: "Missing sheet ID" });
//     }

//     const data = await fetchSheetData(spreadsheetId, sheetTitle);
//     return res.status(200).json({ success: true, total: data.length, data });
//   } catch (err) {
//     console.error("Controller error:", err);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// };

const { GoogleSpreadsheet } = require("google-spreadsheet");

const BedAvailableSheetData = async (req, res) => {
  const spreadsheetId = "1EUnGZWk9LWwAE-WIcYfOTpeQwnzy7AK3ct7_FTkbtxs";
  const sheetTitle = "Bedslist_gpgs";

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
  BedAvailableSheetData,
};
