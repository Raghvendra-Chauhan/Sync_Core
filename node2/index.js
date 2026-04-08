const express = require("express");
const mongoose = require("mongoose");
const RaftNode = require("../raftNode");

const NODE_ID = 2;
const PORT = 3002;
const PEERS = ["http://localhost:3001", "http://localhost:3003"];

const app = express();
app.use(express.json());

const node = new RaftNode(NODE_ID, PORT, PEERS);

mongoose.connect("mongodb://samarthkeshari8_db_user:s5sghJu9hvfXXZn2@ac-5ntpqe4-shard-00-00.jayytfd.mongodb.net:27017,ac-5ntpqe4-shard-00-01.jayytfd.mongodb.net:27017,ac-5ntpqe4-shard-00-02.jayytfd.mongodb.net:27017/?ssl=true&replicaSet=atlas-glt3kv-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0");
const StateModel = mongoose.model("State", new mongoose.Schema({
    key: String, value: String, term: Number, committedBy: Number
}));
app.post("/vote", (req, res) => {
    const { term, candidateId } = req.body;
    const result = node.handleVoteRequest(term, candidateId);
    res.json(result);
});

app.post("/heartbeat", (req, res) => {
    const { term, leaderId } = req.body;
    node.handleHeartbeat(term, leaderId);
    res.json({ success: true });
});

app.post("/commit", async (req, res) => {
    if (node.state !== "leader") {
        return res.status(403).json({ error: "Not the leader", leader: false });
    }
    const { key, value } = req.body;
    await StateModel.create({ key, value, term: node.currentTerm, committedBy: NODE_ID });
    console.log(`[Node ${NODE_ID}] Committed state: ${key} = ${value}`);
    res.json({ success: true, committed: { key, value } });
});

// Get all committed states
app.get("/states", async (req, res) => {
    try {
        const states = await StateModel.find().sort({ _id: -1 }).limit(20);
        res.json(states);
    } catch (e) {
        res.status(500).json({ error: "Could not fetch states" });
    }
});

// Graceful shutdown endpoint
app.post("/shutdown", (req, res) => {
    res.json({ success: true, message: "Shutting down..." });
    setTimeout(() => process.exit(0), 300);
});

app.get("/status", (req, res) => res.json(node.getStatus()));

app.listen(PORT, () => console.log(`Node ${NODE_ID} running on port ${PORT}`));