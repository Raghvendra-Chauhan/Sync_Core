const mongoose = require('mongoose');

const uri = "  ";

async function testMongo() {
    try {
        await mongoose.connect(uri);
        console.log("Successfully connected to MongoDB Atlas!");
        await mongoose.disconnect();
    } catch (e) {
        console.error("Connection failed:", e.message);
    }
}

testMongo();
