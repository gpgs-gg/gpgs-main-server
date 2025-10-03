// const { GoogleSpreadsheet } = require("google-spreadsheet");

// const fetchPropertySheetDataForClient = async (req, res) => {
//     const value =
//         req.query.sheetId; // Default
//     // Expecting "spreadsheetId,MonthYear"
//     const [spreadsheetId, currentMonth, BedCount] = value.split(",");
//     if (!spreadsheetId || !currentMonth) {
//         return res
//             .status(400)
//             .json({ success: false, message: "Invalid input. Pass spreadsheetId,MonthYear" });
//     }

//     try {
//         const doc = new GoogleSpreadsheet(spreadsheetId);

//         // Authenticate using service account
//         await doc.useServiceAccountAuth({
//             client_email: process.env.GOOGLE_CLIENT_EMAIL,
//             private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
//         });

//         // Load the document information
//         await doc.loadInfo();

//         // ✅ Use month from query, not system date
//         const sheetTitle = currentMonth; // e.g. "Aug2025"
//         const sheet = doc.sheetsByTitle[sheetTitle];

//         if (!sheet) {
//             return res
//                 .status(404)
//                 .json({ success: false, message: `Sheet "${sheetTitle}" not found` });
//         }
//         const rows = await sheet.getRows();
//         const result = [];

//         let i = 0;
//         for (const row of rows) {
//             i++;
//             // Only include rows up to BedCount
//             if (i > BedCount) break;
//             const rowData = {};

//             for (const key in row) {
//                 if (Object.prototype.hasOwnProperty.call(row, key)) {
//                     rowData[key] = row[key]?.toString().trim?.() || "";
//                 }
//             }

//             result.push(rowData);
//         }

//         return res.json({ success: true, total: result.length, data: result });

//     } catch (err) {
//         return res.status(500).json({ success: false, message: "Fetch failed" });
//     }
// };

// module.exports = {
//     fetchPropertySheetDataForClient,
// };

const { GoogleSpreadsheet } = require("google-spreadsheet");

const fetchPropertySheetDataForClient = async (req, res) => {
    const value = req.query.sheetId;

    if (!value) {
        return res.status(400).json({ success: false, message: "Missing 'sheetId' query param" });
    }

    const parts = value.split(",");

    if (parts.length % 3 !== 0) {
        return res.status(400).json({ success: false, message: "Invalid input format" });
    }
    const result = [];

    try {
        for (let i = 0; i < parts.length; i += 3) {
            const spreadsheetId = parts[i].trim();
            const currentMonth = parts[i + 1].trim();
            const bedCount = parseInt(parts[i + 2].trim(), 10);

            const doc = new GoogleSpreadsheet(spreadsheetId);

            await doc.useServiceAccountAuth({
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
            });

            await doc.loadInfo();

            const sheet = doc.sheetsByTitle[currentMonth];

            if (!sheet) {
                console.warn(`Sheet "${currentMonth}" not found in ${spreadsheetId}`);
                continue;
            }

            const rows = await sheet.getRows();

            // Get only the first `bedCount` rows
            const selectedRows = rows.slice(0, bedCount);

            for (const row of selectedRows) {
                const rowData = {
                    __spreadsheetId: spreadsheetId,
                    __month: currentMonth,
                };

                // Only include actual column data
                sheet.headerValues.forEach((header) => {
                    rowData[header] = row[header]?.toString().trim() || "";
                });

                result.push(rowData);
            }
        }

        return res.json({ success: true, total: result.length, data: result });

    } catch (err) {
        console.error("Error fetching data:", err);
        return res.status(500).json({ success: false, message: "Fetch failed" });
    }
};

module.exports = {
    fetchPropertySheetDataForClient,
};
