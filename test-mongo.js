const mongoose = require('mongoose');

const uri = "mongodb://samarthkeshari8_db_user:s5sghJu9hvfXXZn2@ac-5ntpqe4-shard-00-00.jayytfd.mongodb.net:27017,ac-5ntpqe4-shard-00-01.jayytfd.mongodb.net:27017,ac-5ntpqe4-shard-00-02.jayytfd.mongodb.net:27017/?ssl=true&replicaSet=atlas-glt3kv-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

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
