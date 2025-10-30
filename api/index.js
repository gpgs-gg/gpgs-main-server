
// require('dotenv').config();
// const express = require('express');
// const serverless = require('serverless-http');
// const cors = require('cors');
// const path = require("path")
// const cloudinary = require('cloudinary').v2;
// const bodyParser = require('body-parser');
// const sheetRoutes = require('../routes/sheetRoutes');
// const propertiesSheetRoutes = require('../routes/propertiesSheetRoutes');
// const propertySheetRoutes = require('../routes/propertySheetRoutes');
// const clientRoutes = require('../routes/clientsRoutes');
// const employeesRoutes = require('../routes/employeesRoutes');
// const googleSheetRoutes = require('../routes/bedsAvilableRoutes');
// const dueAmountsRoutes = require('../routes/dueAmountsRoutes');
// const rnrSheetRoutes = require('../routes/rnrSheetRoutes');
// const createTicketRoutes = require('../routes/createTicketRoutes');
// const fetchTicketTableRoutes = require('../routes/fetchTicketTableRoutes');
// const updateTicketTableRoutes = require('../routes/createTicketRoutes');
// const changePasswordRoutes = require('../routes/changePasswordRoutes');
// const mainPropertySheetDataForClient = require('../routes/mainSheetDataForClientRoutes');
// const ClientDocumentUpload = require('../routes/ClientDocumentUploadRoutes');
// const DynamicValues = require('../routes/dynamicRoutes');
// const otpRoutes = require('../routes/otpRoutes');
// const CreateClient = require('../routes/CreateClientRoutes');

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(bodyParser.json());
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// // Use same route structure as serverless
// app.use(express.json({ limit: '100mb' }));
// app.use(express.urlencoded({ limit: '100mb', extended: true }));

// app.use(bodyParser.json());
// cloudinary.config({
//   cloud_name: process.env.CLOUD_NAME,
//   api_key: process.env.API_KEY,
//   api_secret: process.env.API_SECRET,
// });

// app.get('/api/cloudinary-sign', (req, res) => {
//   try {
//     const timestamp = Math.floor(Date.now() / 1000);
//     const public_id = req.query.public_id;
//     const folder = req.query.folder || 'tickets';

//     if (!public_id) {
//       return res.status(400).json({ error: 'Missing public_id in query params' });
//     }

//     const paramsToSign = {
//       timestamp,
//       folder,
//       public_id,
//     };

//     const signature = cloudinary.utils.api_sign_request(
//       paramsToSign,
//       cloudinary.config().api_secret
//     );

//     res.json({
//       signature,
//       timestamp,
//       api_key: cloudinary.config().api_key,
//       folder,
//       public_id,
//     });
//   } catch (error) {
//     console.error('Error generating signature:', error);
//     res.status(500).json({ error: 'Failed to generate signature' });
//   }
// });
  
// app.use('/api', otpRoutes);
// app.use('/api', sheetRoutes);
// app.use('/api', propertiesSheetRoutes);
// app.use('/api', propertySheetRoutes);
// app.use('/api', employeesRoutes);
// app.use('/api', googleSheetRoutes);
// app.use('/api', dueAmountsRoutes);
// app.use('/api', rnrSheetRoutes);
// app.use('/api', createTicketRoutes);
// app.use('/api', fetchTicketTableRoutes);
// app.use('/api', updateTicketTableRoutes);
// app.use('/api', changePasswordRoutes);
// app.use('/api', clientRoutes);
// app.use('/api', mainPropertySheetDataForClient);
// app.use('/api', ClientDocumentUpload);
// app.use('/api', DynamicValues);
// app.use('/api', CreateClient);



// module.exports = app;
// module.exports.handler = serverless(app);










// local server 

// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const path = require("path")

// const cloudinary = require('cloudinary').v2;

// const bodyParser = require('body-parser');
// const sheetRoutes = require('./routes/sheetRoutes');
// const propertiesSheetRoutes = require('./routes/propertiesSheetRoutes');
// const propertySheetRoutes = require('./routes/propertySheetRoutes');  
// const employeesRoutes = require('./routes/employeesRoutes');
// const clientRoutes = require('./routes/clientsRoutes');
// const googleSheetRoutes = require('./routes/bedsAvilableRoutes');
// const dueAmountsRoutes = require('./routes/dueAmountsRoutes');
// const rnrSheetRoutes = require('./routes/rnrSheetRoutes');
// const createTicketRoutes = require('./routes/createTicketRoutes');
// const fetchTicketTableRoutes = require('./routes/fetchTicketTableRoutes');
// const updateTicketTableRoutes = require('./routes/createTicketRoutes');
// const changePasswordRoutes = require('./routes/changePasswordRoutes');
// const mainPropertySheetDataForClient = require('./routes/mainSheetDataForClientRoutes');
// const ClientDocumentUpload = require('./routes/ClientDocumentUploadRoutes');
// const DynamicValues = require('./routes/dynamicRoutes');
// const otpRoutes = require('./routes/otpRoutes');
// const CreateClient = require('./routes/CreateClientRoutes');

// const app = express();

// app.use(cors());
// app.use(express.json());

// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Use same route structure as serverless
// app.use(express.json({ limit: '100mb' }));
// app.use(express.urlencoded({ limit: '100mb', extended: true }));

// app.use(bodyParser.json());
// cloudinary.config({
//   cloud_name: process.env.CLOUD_NAME,
//   api_key: process.env.API_KEY,
//   api_secret: process.env.API_SECRET,
// });

// app.get('/api/cloudinary-sign', (req, res) => {
//   try {
//     const timestamp = Math.floor(Date.now() / 1000);
//     const public_id = req.query.public_id;
//     const folder = req.query.folder || 'tickets';

//     if (!public_id) {
//       return res.status(400).json({ error: 'Missing public_id in query params' });
//     }

//     const paramsToSign = {
//       timestamp,
//       folder,
//       public_id,
//     };

//     const signature = cloudinary.utils.api_sign_request(
//       paramsToSign,
//       cloudinary.config().api_secret
//     );

//     res.json({
//       signature,
//       timestamp,
//       api_key: cloudinary.config().api_key,
//       folder,
//       public_id,
//     });
//   } catch (error) {
//     console.error('Error generating signature:', error);
//     res.status(500).json({ error: 'Failed to generate signature' });
//   }
// });





// // Use OTP routes
// app.use('/api', otpRoutes);
// app.use('/api', sheetRoutes);
// app.use('/api', propertiesSheetRoutes);
// app.use('/api', propertySheetRoutes);
// app.use('/api', employeesRoutes);
// app.use('/api', googleSheetRoutes);
// app.use('/api', dueAmountsRoutes);
// app.use('/api', rnrSheetRoutes);
// app.use('/api', createTicketRoutes);
// app.use('/api', fetchTicketTableRoutes);
// app.use('/api', updateTicketTableRoutes);
// app.use('/api', changePasswordRoutes);
// app.use('/api', clientRoutes);
// app.use('/api', mainPropertySheetDataForClient);
// app.use('/api', ClientDocumentUpload);
// app.use('/api', DynamicValues);
// app.use('/api', CreateClient);

// const PORT = 3000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running at http://localhost:${PORT}`);
// });



///////////////////////////////////////////////////////////////////





require('dotenv').config();
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const path = require("path")
const bodyParser = require('body-parser');
const sheetRoutes = require('../routes/sheetRoutes');
const propertiesSheetRoutes = require('../routes/propertiesSheetRoutes');
const propertySheetRoutes = require('../routes/propertySheetRoutes');
const clientRoutes = require('../routes/clientsRoutes');
const employeesRoutes = require('../routes/employeesRoutes');
const googleSheetRoutes = require('../routes/bedsAvilableRoutes');
const dueAmountsRoutes = require('../routes/dueAmountsRoutes');
const rnrSheetRoutes = require('../routes/rnrSheetRoutes');
const createTicketRoutes = require('../routes/createTicketRoutes');
const fetchTicketTableRoutes = require('../routes/fetchTicketTableRoutes');
const updateTicketTableRoutes = require('../routes/createTicketRoutes');
const changePasswordRoutes = require('../routes/changePasswordRoutes');
const mainPropertySheetDataForClient = require('../routes/mainSheetDataForClientRoutes');
const ClientDocumentUpload = require('../routes/ClientDocumentUploadRoutes');
const DynamicValues = require('../routes/dynamicRoutes');
const otpRoutes = require('../routes/otpRoutes');
const CreateClient = require('../routes/CreateClientRoutes');

const axios = require('axios');
const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Use same route structure as serverless
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(bodyParser.json());
require('dotenv').config();
// const express = require('express');
const multer = require('multer');
// const app = express();
app.use(express.json());
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});
// Proxy endpoint to serve images from Google Drive
app.get('/google-drive-file/:id/:filename', async (req, res) => {
  try {
    const { id, filename } = req.params;

    const url = `https://drive.google.com/uc?export=download&id=${id}`;

    // Fetch headers first to get file size
    const headResp = await axios.head(url);
    const fileSize = parseInt(headResp.headers['content-length'], 10);
    const contentType = headResp.headers['content-type'] || 'application/octet-stream';

    const range = req.headers.range;
    if (range) {
      // Parse Range: "bytes=start-end"
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;

      const response = await axios.get(url, {
        responseType: 'stream',
        headers: { Range: `bytes=${start}-${end}` }
      });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
      });

      response.data.pipe(res);

    } else {
      // Full download
      const response = await axios.get(url, { responseType: 'stream' });
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      response.data.pipe(res);
    }

  } catch (err) {
    console.error('Failed to fetch Google Drive file:', err.message);
    res.status(500).send('Failed to fetch file');
  }
});


  
app.use('/api', otpRoutes);
app.use('/api', sheetRoutes);
app.use('/api', propertiesSheetRoutes);
app.use('/api', propertySheetRoutes);
app.use('/api', employeesRoutes);
app.use('/api', googleSheetRoutes);
app.use('/api', dueAmountsRoutes);
app.use('/api', rnrSheetRoutes);
app.use('/api', createTicketRoutes);  
app.use('/api', fetchTicketTableRoutes);
app.use('/api', updateTicketTableRoutes);
app.use('/api', changePasswordRoutes);
app.use('/api', clientRoutes);
app.use('/api', mainPropertySheetDataForClient);
app.use('/api', ClientDocumentUpload);
app.use('/api', DynamicValues);
app.use('/api', CreateClient);



module.exports = app;
module.exports.handler = serverless(app);










// // local server 




// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const path = require("path")


// const bodyParser = require('body-parser');
// const sheetRoutes = require('./routes/sheetRoutes');
// const propertiesSheetRoutes = require('./routes/propertiesSheetRoutes');
// const propertySheetRoutes = require('./routes/propertySheetRoutes');  
// const employeesRoutes = require('./routes/employeesRoutes');
// const clientRoutes = require('./routes/clientsRoutes');
// const googleSheetRoutes = require('./routes/bedsAvilableRoutes');
// const dueAmountsRoutes = require('./routes/dueAmountsRoutes');
// const rnrSheetRoutes = require('./routes/rnrSheetRoutes');
// const createTicketRoutes = require('./routes/createTicketRoutes');
// const fetchTicketTableRoutes = require('./routes/fetchTicketTableRoutes');
// const updateTicketTableRoutes = require('./routes/createTicketRoutes');
// const changePasswordRoutes = require('./routes/changePasswordRoutes');
// const mainPropertySheetDataForClient = require('./routes/mainSheetDataForClientRoutes');
// const ClientDocumentUpload = require('./routes/ClientDocumentUploadRoutes');
// const DynamicValues = require('./routes/dynamicRoutes');
// const otpRoutes = require('./routes/otpRoutes');
// const CreateClient = require('./routes/CreateClientRoutes');




// const axios = require('axios');
// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// // Use same route structure as serverless
// app.use(express.json({ limit: '100mb' }));
// app.use(express.urlencoded({ limit: '100mb', extended: true }));
// app.use(bodyParser.json());
// require('dotenv').config();
// // const express = require('express');
// const multer = require('multer');
// // const app = express();
// app.use(express.json());
// const storage = multer.memoryStorage();
// const upload = multer({
//   storage,
//   limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
// });
// // Proxy endpoint to serve images from Google Drive
// app.get('/google-drive-file/:id/:filename', async (req, res) => {
//   try {
//     const { id, filename } = req.params;

//     const url = `https://drive.google.com/uc?export=download&id=${id}`;

//     // Fetch headers first to get file size
//     const headResp = await axios.head(url);
//     const fileSize = parseInt(headResp.headers['content-length'], 10);
//     const contentType = headResp.headers['content-type'] || 'application/octet-stream';

//     const range = req.headers.range;
//     if (range) {
//       // Parse Range: "bytes=start-end"
//       const parts = range.replace(/bytes=/, "").split("-");
//       const start = parseInt(parts[0], 10);
//       const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
//       const chunkSize = (end - start) + 1;

//       const response = await axios.get(url, {
//         responseType: 'stream',
//         headers: { Range: `bytes=${start}-${end}` }
//       });

//       res.writeHead(206, {
//         'Content-Range': `bytes ${start}-${end}/${fileSize}`,
//         'Accept-Ranges': 'bytes',
//         'Content-Length': chunkSize,
//         'Content-Type': contentType,
//         'Content-Disposition': `inline; filename="${filename}"`,
//       });

//       response.data.pipe(res);

//     } else {
//       // Full download
//       const response = await axios.get(url, { responseType: 'stream' });
//       res.setHeader('Content-Type', contentType);
//       res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
//       response.data.pipe(res);
//     }

//   } catch (err) {
//     console.error('Failed to fetch Google Drive file:', err.message);
//     res.status(500).send('Failed to fetch file');
//   }
// });












// // Use OTP routes
// app.use('/api', otpRoutes);
// app.use('/api', sheetRoutes);
// app.use('/api', propertiesSheetRoutes);
// app.use('/api', propertySheetRoutes);
// app.use('/api', employeesRoutes);
// app.use('/api', googleSheetRoutes);
// app.use('/api', dueAmountsRoutes);
// app.use('/api', rnrSheetRoutes);
// app.use('/api', createTicketRoutes);
// app.use('/api', fetchTicketTableRoutes);
// app.use('/api', updateTicketTableRoutes);
// app.use('/api', changePasswordRoutes);
// app.use('/api', clientRoutes);
// app.use('/api', mainPropertySheetDataForClient);
// app.use('/api', ClientDocumentUpload);
// app.use('/api', DynamicValues);
// app.use('/api', CreateClient);

// const PORT = 3000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running at http://localhost:${PORT}`);
// });
