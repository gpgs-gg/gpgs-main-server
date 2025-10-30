// server.js or routes/ticket.js
const express = require('express');
const router = express.Router();
const upload = require('../upload'); // multer setup

router.post('/api/upload', upload.array('attachments', 4), (req, res) => {
  const fileInfos = req.files.map(file => ({
    name: file.originalname,
    url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
    type: file.mimetype
  }));

  res.json({ files: fileInfos });
});

module.exports = router;
