// const { GoogleSpreadsheet } = require("google-spreadsheet");

// const fetchPropertySheetData = async (req, res) => {
//   const value = req.query.sheetId; // format: id,count
//   const [spreadsheetId, bedCountStr] = value.split(",");
//   const bedCount = parseInt(bedCountStr, 10);
//  const sheetTitle = new Date().toLocaleString("en-US", {
//   month: "short",
//   year: "numeric",
// }).replace(" ", "");

//   if (!spreadsheetId || !sheetTitle || isNaN(bedCount)) {
//     return res.status(400).json({ success: false, message: "Invalid or missing parameters" });
//   }
//   try {
//     const doc = new GoogleSpreadsheet(spreadsheetId);
//     await doc.useServiceAccountAuth({
//       client_email: process.env.GOOGLE_CLIENT_EMAIL,
//       private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
//     });
//     await doc.loadInfo();

//     const sheet = doc.sheetsByTitle[sheetTitle];
//     if (!sheet) {
//       return res.status(404).json({ success: false, message: "Sheet not found" });
//     }

//     const rows = await sheet.getRows();
//     // const headers = sheet.headerValues.map(h => h.replace(/\n/g, ' ').trim());

//     // Define the columns you want
//     const selectedColumns = ['BedAvailable', "URHD", "URHA", "PRHD", "ACRoom ", "BedNo", "RoomNo", "DA", "MFR"];

//     // Create a map from normalized to original header keys
//     const headerMap = {};
//     sheet.headerValues.forEach((original, index) => {
//       const normalized = original.replace(/\n/g, ' ').trim();
//       headerMap[normalized] = original;
//     });

//     // Convert selected columns to actual header keys in the raw data
//     const actualKeys = selectedColumns.map(col => headerMap[col]);


//     const data = rows
//       .slice(0, bedCount)
//       .map(row => {
//         const rowData = {};
//         actualKeys.forEach((key, index) => {
//           const headerLabel = selectedColumns[index]; 
//           const headerIndex = sheet.headerValues.indexOf(key);
//           rowData[headerLabel] = row._rawData[headerIndex] || "";
//         });
//         return rowData;
//       })
//       .filter(row => row["BedAvailable"]?.toLowerCase() === "yes");

//     return res.json({ success: true, total: data.length, data: data });
//   } catch (error) {
//     console.error("Error fetching sheet:", error.message);
//     return res.status(500).json({ success: false, message: "Failed to fetch sheet data" });
//   }
// };

// module.exports = {
//   fetchPropertySheetData,
// };

const { GoogleSpreadsheet } = require("google-spreadsheet");

const fetchPropertySheetData = async (req, res) => {
  const value = req.query.sheetId; // e.g., "SPREADSHEET_ID,10"
  const [spreadsheetId, rowCountStr] = value.split(",");
  const rowCount = parseInt(rowCountStr, 10);

  const sheetTitle = new Date().toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  }).replace(" ", "");

  if (!spreadsheetId || isNaN(rowCount)) {
    return res.status(400).json({ success: false, message: "Invalid input" });
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

    // Load columns D (3), E (4), F (5), G (6)
    await sheet.loadCells({
      startRowIndex: 1,
      endRowIndex: rowCount + 1,
      startColumnIndex: 3,
      endColumnIndex: 100, // Load up to column G (45-46)
    });

    const result = [];
    let statusCell, bedNo, roomNo, bedStatus, ACRoom, DA, MFR, URHD, URHA;
    for (let i = 0; i < rowCount; i++) {
      statusCell = sheet.getCell(i + 1, 45);
      // Column- BedAvailable
      bedStatus = statusCell?.value?.toString().trim().toLowerCase();
      if (bedStatus === "yes") {
        bedNo = sheet.getCell(i + 1, 3).value?.toString().trim(); // Column D
        roomNo = sheet.getCell(i + 1, 4).value?.toString().trim();  // Column E
        ACRoom = sheet.getCell(i + 1, 40).value?.toString().trim();  // Column E
        MFR = sheet.getCell(i + 1, 20).value?.toString().trim();  // Column E
        DA = sheet.getCell(i + 1, 22).value?.toString().trim();  // Column E

        // Changing Excel date to dd-MMMM-yyyy format for URHD
        let excelSerial = sheet.getCell(i + 1, 32).value;
        let excelEpoch = new Date(Date.UTC(1899, 11, 30)); // Excel's base date
        let URHD_Date = new Date(excelEpoch.getTime() + excelSerial * 86400000); // Convert serial to JS date

        let currentDate = new Date();
        let URHD = "";

        // Only format if URHD_Date > currentDate
        if (URHD_Date > currentDate) {
          // Format to dd-MMMM-yyyy (e.g., 01-March-2025)
          let options = { day: '2-digit', month: 'short', year: 'numeric' };
          URHD = URHD_Date.toLocaleDateString('en-GB', options);
        }

        // Now URHD will either be the formatted date or an empty string


        URHA = sheet.getCell(i + 1, 33).value?.toString().trim();
        result.push({
          BedNo: bedNo || "",
          RoomNo: roomNo || "",
          ACRoom: ACRoom || "",
          DA: DA || "",
          MFR: MFR || "",
          URHD: URHD || "",
          URHA: URHA || ""
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
