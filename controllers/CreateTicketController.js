// const { google } = require('googleapis');
// const { AllSheetNames } = require('../Config');
// const CreateTicket = async (req, res) => {

//   try {
//     const auth = new google.auth.GoogleAuth({
//       credentials: {
//         client_email: process.env.GOOGLE_CLIENT_EMAIL,
//         private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
//       },
//       scopes: ['https://www.googleapis.com/auth/spreadsheets'],
//     });

//     const sheets = google.sheets({ version: 'v4', auth });
//     const spreadsheetId = "1kHjPWalsEaPO6IS756N43IFk7z1xRcrDeO6VG2AurwI";
//     const sheetTitle = req.query.sheet || AllSheetNames.TICKET_MASTER_TABLE;

//     // 🔹 Get sheet metadata
//     const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
//     const sheet = sheetMeta.data.sheets.find(s => s.properties.title === sheetTitle);
//     if (!sheet) {
//       return res.status(404).json({ error: `❌ Sheet titled "${sheetTitle}" not found.` });
//     }
//     const sheetId = sheet.properties.sheetId;

//     // 🔹 Get header row
//     const headerResponse = await sheets.spreadsheets.values.get({
//       spreadsheetId,
//       range: `${sheetTitle}!1:1`,
//     });
//     const headers = headerResponse.data.values?.[0] || [];
//     if (headers.length === 0) {
//       return res.status(400).json({ error: '❌ Header row is empty or missing.' });
//     }

//     // 🔹 Get current data to determine latest TicketID
//     const dataResponse = await sheets.spreadsheets.values.get({
//       spreadsheetId,
//       range: `${sheetTitle}!A2:A`,
//     });
//     const TicketIDs = dataResponse.data.values?.flat() || [];

//     // Generate new TicketID
//     const currentYear = new Date().getFullYear();
//     const lastID = TicketIDs[0] || `TKT-${currentYear}-0000`;
//     const lastNumber = parseInt(lastID.split("-")[2]) || 0;
//     const nextID = `TKT-${currentYear}-${(lastNumber + 1).toString().padStart(4, '0')}`;

//     // Generate current date
//     const currentDate = new Date().toLocaleString('en-GB', {
//       timeZone: 'Asia/Kolkata',
//     });

//     // ✅ Handle uploaded files
//     const uploadedFileURLs = req.files?.map(file => {
//       return `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
//     }) || [];

//     // 🔹 Prepare data row
//     const rowData = headers.map(header => {
//       switch (header) {
//         case 'TicketID':
//           return nextID;
//         case 'DateCreated':
//           return currentDate;
//         case 'Attachment': // Assuming this is the column to store file URLs
//         case 'Images':
//         case 'Files':
//           return uploadedFileURLs.join(', ');
//         default:
//           const value = req.body[header];
//           if (typeof value === 'object' && value !== null) {
//             return JSON.stringify(value); // convert to string
//           }
//           return value ?? "";
//       }
//     });

//     // 🔹 Insert row
//     await sheets.spreadsheets.batchUpdate({
//       spreadsheetId,
//       requestBody: {
//         requests: [
//           {
//             insertDimension: {
//               range: {
//                 sheetId,
//                 dimension: 'ROWS',
//                 startIndex: 1,
//                 endIndex: 2,
//               },
//               inheritFromBefore: false,
//             },
//           },
//         ],
//       },
//     });

//     // 🔹 Update values
//     await sheets.spreadsheets.values.update({
//       spreadsheetId,
//       range: `${sheetTitle}!A2`,
//       valueInputOption: 'RAW',
//       requestBody: {
//         values: [rowData],
//       },
//     });

//     res.status(200).json({
//       message: `✅ New ticket created successfully.`,
//       TicketID: nextID,
//       inserted: rowData,
//       files: uploadedFileURLs,
//     });

//   } catch (error) {
//     console.error("❌ Error creating ticket:", error);
//     res.status(500).json({ error: 'Failed to insert ticket row' });
//   }
// };



// controllers/CreateTicketController.js

const { google } = require('googleapis');
// const cloudinary = require('cloudinary').v2;
// const streamifier = require('streamifier');
const { AllSheetNames } = require('../Config');
require('dotenv').config();

// const { google } = require('googleapis');
const { Readable } = require('stream');
const path = require('path');

// const { google } = require('googleapis');
// const { Readable } = require('stream');
const mime = require('mime-types'); // npm install mime-types

const uploadToGoogleDrive = async (fileBuffer, filename, folderId = 'root') => {
  console.log("Uploading file:", filename, "to folder:", folderId);

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_DRIVE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const drive = google.drive({ version: 'v3', auth });

  // ✅ Detect MIME type from filename
  const mimeType = mime.lookup(filename) || 'application/octet-stream';

  const fileMetadata = {
    name: filename,
    parents: [folderId],
  };

  const bufferStream = new Readable();
  bufferStream.push(fileBuffer);
  bufferStream.push(null);

  const media = { mimeType, body: bufferStream };

  // ✅ Upload file to Google Drive
  const file = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: 'id, name, mimeType, size, webViewLink, webContentLink',
    supportsAllDrives: true,
  });

  // ✅ Make file public
  await drive.permissions.create({
    fileId: file.data.id,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
    supportsAllDrives: true,
  });

  // ✅ Return both local + Drive preview URLs
  return {
    id: file.data.id,
    name: file.data.name,
    mimeType: file.data.mimeType,
    size: file.data.size,
    drivePreview: file.data.webViewLink, // native Drive preview (view in Drive)
    directDownload: file.data.webContentLink, // direct download link from Drive
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/google-drive-file/${file.data.id}/${encodeURIComponent(file.data.name)}`, // your Node route (streaming)
  };
};

// === Utility ===
// const AllSheetNames = {
//   TICKET_MASTER_TABLE: 'TicketMaster', // 👈 Change this if your sheet name is different
// };

// === Create Ticket ===
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

    // Sheet Metadata
    const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = sheetMeta.data.sheets.find(s => s.properties.title === sheetTitle);
    if (!sheet) {
      return res.status(404).json({ error: `❌ Sheet titled "${sheetTitle}" not found.` });
    }
    const sheetId = sheet.properties.sheetId;

    // Headers
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!1:1`,
    });
    const headers = headerResponse.data.values?.[0] || [];

    if (headers.length === 0) {
      return res.status(400).json({ error: '❌ Header row is empty or missing.' });
    }

    // Get Ticket IDs
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!A2:A`,
    });
    const TicketIDs = dataResponse.data.values?.flat() || [];

    // Generate Ticket ID
    const currentYear = new Date().getFullYear();
    const lastID = TicketIDs[0] || `TKT-${currentYear}-0000`;
    const lastNumber = parseInt(lastID.split("-")[2]) || 0;
    const nextID = `TKT-${currentYear}-${(lastNumber + 1).toString().padStart(4, '0')}`;

    // Current Date
    const currentDate = new Date().toLocaleString('en-GB', {
      timeZone: 'Asia/Kolkata',
    });


   // Handle file uploads to Google Drive
const uploadedFileURLs = [];
if (req.files?.length > 0) {
  for (const file of req.files) {                                      // folder id added here  .......
    const url = await uploadToGoogleDrive(file.buffer, file.originalname, process.env.TICKETS);
    uploadedFileURLs.push(url);
  }
}

    // Prepare row data
    const rowData = headers.map(header => {
      switch (header) {
        case 'TicketID':
          return nextID;
        case 'DateCreated':
          return currentDate;
        case 'Attachment':
        case 'Images':
        case 'Files':
          return uploadedFileURLs.map(f => f.url).join(',');
        default:
          const value = req.body[header];
          return typeof value === 'object' ? JSON.stringify(value) : value ?? "";
      }
    });

    // Insert new row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          insertDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: 1,
              endIndex: 2,
            },
            inheritFromBefore: false,
          },
        }],
      },
    });

    // Write values to inserted row
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
    // console.error("❌ Error creating ticket:", error);
    res.status(500).json({ error: 'Failed to insert ticket row' });
  }
};









// const CreateTicket = async (req, res) => {
//   try {
//     // Authenticate with Google Sheets API
//     const auth = new google.auth.GoogleAuth({
//       credentials: {
//         client_email: process.env.GOOGLE_CLIENT_EMAIL,
//         private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
//       },
//       scopes: ['https://www.googleapis.com/auth/spreadsheets'],
//     });

//     const sheets = google.sheets({ version: 'v4', auth });
//     const spreadsheetId = "1kHjPWalsEaPO6IS756N43IFk7z1xRcrDeO6VG2AurwI";

//     // Use sheet from query param or default
//     const sheetTitle = req.query.sheet || "Tickets";

//     // Get metadata and verify sheet exists
//     const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
//     const sheet = sheetMeta.data.sheets.find(s => s.properties.title === sheetTitle);
//     if (!sheet) {
//       return res.status(404).json({ error: `❌ Sheet titled "${sheetTitle}" not found.` });
//     }
//     const sheetId = sheet.properties.sheetId;

//     // Get column headers
//     const headerResponse = await sheets.spreadsheets.values.get({
//       spreadsheetId,
//       range: `${sheetTitle}!1:1`,
//     });
//     const headers = headerResponse.data.values?.[0] || [];

//     if (headers.length === 0) {
//       return res.status(400).json({ error: '❌ Header row is empty or missing.' });
//     }

//     // Get all TicketIDs
//     const dataResponse = await sheets.spreadsheets.values.get({
//       spreadsheetId,
//       range: `${sheetTitle}!A2:A`,
//     });
//     const TicketIDs = dataResponse.data.values?.flat() || [];

//     // Generate new TicketID
//     const currentYear = new Date().getFullYear();
//     const lastID = TicketIDs[0] || `TKT-${currentYear}-0000`;
//     const lastNumber = parseInt(lastID.split("-")[2]) || 0;
//     const nextID = `TKT-${currentYear}-${(lastNumber + 1).toString().padStart(4, '0')}`;

//     // Get current timestamp
//     const currentDate = new Date().toLocaleString('en-GB', {
//       timeZone: 'Asia/Kolkata',
//     });

//     // Construct row data based on headers
//     const rowData = headers.map(header => {
//       switch (header) {
//         case 'TicketID':
//           return nextID;
//         case 'DateCreated':
//           return currentDate;
//         case 'Attachment':
//         case 'Images':
//         case 'Files': {
//           const value = req.body[header];

//           if (typeof value === 'string') {
//             try {
//               const parsed = JSON.parse(value);
//               if (Array.isArray(parsed)) {
//                 return parsed.join(', ');
//               }
//               return value;
//             } catch {
//               return value; // not JSON, just return as is
//             }
//           }

//           if (Array.isArray(value)) {
//             return value.join(', ');
//           }

//           return value ?? '';
//         }
//         default:
//           const value = req.body[header];
//           return typeof value === 'object' ? JSON.stringify(value) : value ?? "";
//       }
//     });

//     // Insert row at position 2 (A2)
//     await sheets.spreadsheets.batchUpdate({
//       spreadsheetId,
//       requestBody: {
//         requests: [{
//           insertDimension: {
//             range: {
//               sheetId,
//               dimension: 'ROWS',
//               startIndex: 1,
//               endIndex: 2,
//             },
//             inheritFromBefore: false,
//           },
//         }],
//       },
//     });

//     // Write values to the newly inserted row
//     await sheets.spreadsheets.values.update({
//       spreadsheetId,
//       range: `${sheetTitle}!A2`,
//       valueInputOption: 'RAW',
//       requestBody: {
//         values: [rowData],
//       },
//     });

//     // Success response
//     res.status(200).json({
//       message: `✅ New ticket created successfully.`,
//       TicketID: nextID,
//       inserted: rowData,
//     });

//   } catch (error) {
//     console.error("❌ Error creating ticket:", error);
//     res.status(500).json({ error: 'Failed to insert ticket row' });
//   }
// };



// === Update Ticket ===




// const updateTicketSheetData = async (req, res) => {
//   try {
//     if (!req.body || !req.body.TicketID) {
//       return res.status(400).json({ error: '❌ Missing "TicketID" in request body.' });
//     }

//     const sheetTitle = AllSheetNames.TICKET_MASTER_TABLE;

//     const auth = new google.auth.GoogleAuth({
//       credentials: {
//         client_email: process.env.GOOGLE_CLIENT_EMAIL,
//         private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
//       },
//       scopes: ['https://www.googleapis.com/auth/spreadsheets'],
//     });

//     const sheets = google.sheets({ version: 'v4', auth });
//     const spreadsheetId = "1kHjPWalsEaPO6IS756N43IFk7z1xRcrDeO6VG2AurwI";

//     // Get headers
//     const headerResponse = await sheets.spreadsheets.values.get({
//       spreadsheetId,
//       range: `${sheetTitle}!1:1`,
//     });
//     const headers = headerResponse.data.values?.[0] || [];

//     if (headers.length === 0) {
//       return res.status(400).json({ error: '❌ Header row is empty or missing.' });
//     }

//     const ticketIdIndex = headers.indexOf("TicketID");
//     if (ticketIdIndex === -1) {
//       return res.status(400).json({ error: '❌ "TicketID" column not found in header.' });
//     }

//     // Get all rows
//     const dataResponse = await sheets.spreadsheets.values.get({
//       spreadsheetId,
//       range: `${sheetTitle}!A2:Z`,
//     });
//     const rows = dataResponse.data.values || [];

//     const matchRowIndex = rows.findIndex(
//       row => (row[ticketIdIndex] || "").trim().toLowerCase() === req.body.TicketID.trim().toLowerCase()
//     );

//     if (matchRowIndex === -1) {
//       return res.status(404).json({
//         error: `❌ TicketID "${req.body.TicketID}" not found in sheet "${sheetTitle}".`,
//       });
//     }

//     // === Build updated values ===
//     const updates = [];

//     for (const header of headers) {
//       if (header === "TicketID") continue;

//       if (header === "Attachment" || header === "Files" || header === "Images") {
//         const rawValue = req.body[header];

//         let cleaned = "";

//         if (typeof rawValue === "string") {
//           try {
//             const parsed = JSON.parse(rawValue);
//             if (Array.isArray(parsed)) {
//               cleaned = parsed.join(", ");
//             } else {
//               cleaned = rawValue;
//             }
//           } catch {
//             // Not a JSON string — assume it's plain string
//             cleaned = rawValue;
//           }
//         } else if (Array.isArray(rawValue)) {
//           cleaned = rawValue.join(", ");
//         }

//         if (cleaned) {
//           const colIndex = headers.indexOf(header);
//           updates.push({ colIndex, value: cleaned });
//         }
//       } 

//       else if (Object.prototype.hasOwnProperty.call(req.body, header)) {
//         let value = req.body[header];
//         if (typeof value === 'object') {
//           value = JSON.stringify(value);
//         }
//         const colIndex = headers.indexOf(header);
//         updates.push({ colIndex, value });
//       }
//     }

//     if (updates.length === 0) {
//       return res.status(200).json({ message: '⚠️ No changes to update.', updated: false });
//     }

//     // Sort updates by column
//     updates.sort((a, b) => a.colIndex - b.colIndex);

//     const sheetRowNumber = matchRowIndex + 2;
//     const startCol = String.fromCharCode(65 + updates[0].colIndex);
//     const endCol = String.fromCharCode(65 + updates[updates.length - 1].colIndex);
//     const range = `${sheetTitle}!${startCol}${sheetRowNumber}:${endCol}${sheetRowNumber}`;

//     const rowValues = [];
//     for (let i = updates[0].colIndex; i <= updates[updates.length - 1].colIndex; i++) {
//       const update = updates.find(u => u.colIndex === i);
//       rowValues.push(update ? update.value : "");
//     }

//     await sheets.spreadsheets.values.update({
//       spreadsheetId,
//       range,
//       valueInputOption: 'USER_ENTERED',
//       requestBody: { values: [rowValues] },
//     });

//     return res.status(200).json({
//       message: `✅ Ticket "${req.body.TicketID}" updated successfully.`,
//       updatedColumns: updates.map(u => headers[u.colIndex]),
//     });

//   } catch (error) {
//     console.error("❌ Error updating sheet:", error);
//     return res.status(500).json({
//       error: '❌ Failed to update ticket.',
//       details: error.message,
//     });
//   }
// };



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
    // const uploadedFileURLs = (req.files || []).map(file =>
    //   `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
    // );

let uploadedFileURLs = [];

// If new files are uploaded, upload to Google Drive
if (req.files?.length > 0) {
  uploadedFileURLs = await Promise.all(
    req.files.map(file => uploadToGoogleDrive(file.buffer, file.originalname, "0ADzSPK9dbjmuUk9PVA"))
  );
}

// --- Build partial update by matching header names ---
const updates = [];

for (const header of headers) {
  if (header === "TicketID") continue; // Don't update TicketID column

  if (header === "Attachment") {
    // Pattern to match valid existing attachments
    const validUrlPattern = /(https?:\/\/localhost:\d+\/[^",]+|https?:\/\/gpgs-main-server\.vercel\.app\/[^",]+)/g;

    // Extract existing attachments from req.body.Attachment
    const existingAttachments = [...(req.body.Attachment || "").matchAll(validUrlPattern)]
      .map(match => match[0].trim())
      .filter(url => !url.startsWith("blob:")); // Ignore blobs

    // Combine existing + newly uploaded
    const combinedAttachments = [...existingAttachments, ...uploadedFileURLs.map(ele=>ele.url)].join(",");

    if (combinedAttachments.length > 0) {
      const colIndex = headers.indexOf(header);
      updates.push({ colIndex, value: combinedAttachments });
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



// module.exports = {
//   updateTicketSheetData,
//   CreateTicket
// };





module.exports = {
  CreateTicket,
  updateTicketSheetData,
};
