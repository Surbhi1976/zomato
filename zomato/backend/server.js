// start server
require('dotenv').config();
const app = require('./src/app.js');
const connectDB = require('./src/db/db.js');

const PORT = process.env.PORT || 3000;

connectDB();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
