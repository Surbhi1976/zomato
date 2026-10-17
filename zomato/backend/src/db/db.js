const mongoose = require('mongoose');

function connectDB() {
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => {
            console.log('Mongodb connected');
        })
        .catch((err) => {
    console.log('mongodb connection error:', err);
    process.exit(1);
});
}
module.exports = connectDB;
