

require('dotenv').config();
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');

const sheetRoutes = require('./routes/sheetRoutes');
const propertiesSheetRoutes = require('./routes/propertiesSheetRoutes');
const propertySheetRoutes = require('./routes/propertySheetRoutes');
const employeesRoutes = require('./routes/employeesRoutes');
const googleSheetRoutes = require('./routes/bedsAvilableRoutes');
const dueAmountsRoutes = require('./routes/dueAmountsRoutes');
const rnrSheetRoutes = require('./routes/rnrSheetRoutes');
const createTicketRoutes = require('./routes/createTicketRoutes');
const fetchTicketTableRoutes = require('./routes/fetchTicketTableRoutes');
const updateTicketTableRoutes = require('./routes/createTicketRoutes');
const changePasswordRoutes = require('./routes/changePasswordRoutes');



const app = express();

app.use(cors());
app.use(express.json());

// Use prefixed paths (important for serverless)
// Use same route structure as serverless
app.use('/api', sheetRoutes);
app.use('/api', propertiesSheetRoutes);
app.use('/api', propertySheetRoutes);
app.use('/api', employeesRoutes);
app.use('/api', googleSheetRoutes);
app.use('/api', dueAmountsRoutes);
app.use('/api', rnrSheetRoutes);
app.use('/api', createTicketRoutes);
app.use('/api', fetchTicketTableRoutes);
// app.use('/', express.static('../uploads')); // Serve uploaded files statically
app.use('/api', updateTicketTableRoutes);
app.use('/api', changePasswordRoutes);


module.exports = app;
module.exports.handler = serverless(app);





//local server 

// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const path = require("path")
// const sheetRoutes = require('../routes/sheetRoutes');
// const propertiesSheetRoutes = require('../routes/propertiesSheetRoutes');
// const propertySheetRoutes = require('../routes/propertySheetRoutes');
// const employeesRoutes = require('../routes/employeesRoutes');
// const googleSheetRoutes = require('../routes/bedsAvilableRoutes');
// const dueAmountsRoutes = require('../routes/dueAmountsRoutes');
// const rnrSheetRoutes = require('../routes/rnrSheetRoutes');
// const createTicketRoutes = require('../routes/createTicketRoutes');
// const fetchTicketTableRoutes = require('../routes/fetchTicketTableRoutes');
// const updateTicketTableRoutes = require('../routes/createTicketRoutes');
// const changePasswordRoutes = require('../routes/changePasswordRoutes');

// const app = express();

// app.use(cors());
// app.use(express.json());

// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Use same route structure as serverless
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

// const PORT = 3000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running at http://localhost:${PORT}`);
// });
