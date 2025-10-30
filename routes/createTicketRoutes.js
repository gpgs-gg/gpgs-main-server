// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const router = express.Router();
// const {
//   CreateTicket,
//   updateTicketSheetData,
// } = require('../controllers/CreateTicketController');

// // === Multer Configuration ===

// // Set storage destination and filename
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads'); // make sure 'uploads/' folder exists
//   },
//   filename: function (req, file, cb) {
//     const uniqueName = Date.now() + '_' + file.originalname;
//     cb(null, uniqueName);
//   }
// });

// // Optional: file filter for images only
// const fileFilter = (req, file, cb) => {
//   const allowedTypes = /jpeg|jpg|png|pdf/;
//   const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//   if (isValid) {
//     cb(null, true);
//   } else {
//     cb(new Error('Invalid file type. Only images or PDFs allowed.'));
//   }
// };

// // Init multer middleware
// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: { fileSize: 5 * 1024 * 1024 }, // optional: max 5MB
// });
// // === Routes ===



// // const storageMemory = multer.memoryStorage();
// // const upload = multer({ storage: storageMemory });

// router.post('/ticket-created', upload.array('files', 5), async (req, res) => {
//   try {
//     for (const file of req.files) {
//       console.log(file.buffer); // ✅ now available
//       // upload to Cloudinary here using file.buffer
//     }
//     res.json({ success: true });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });
// // POST /ticket-created (with file upload)
// // router.post('/ticket-created', upload.array('images', 5), CreateTicket);

// // POST /ticket-updated (optional file upload)
// router.post('/ticket-updated', upload.array('images',   5), updateTicketSheetData);

// module.exports = router;

const express = require('express');
const multer = require('multer');
const router = express.Router();
const { CreateTicket, updateTicketSheetData } = require('../controllers/CreateTicketController');

// Use memory storage to get file buffer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
});

// Make sure field name matches frontend input: 'Attachment'
router.post('/ticket-created', upload.array('images', 5), CreateTicket);
router.post('/ticket-updated', upload.array('images', 5), updateTicketSheetData);

module.exports = router;



