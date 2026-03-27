const express = require("express");
const mongoose = require("mongoose");
const RaftNode = require("../raftNode");

const NODE_ID = 2;
const PORT = 3002;
const PEERS = ["http://localhost:3001", "http://localhost:3003"];

const app = express();
app.use(express.json());

const node = new RaftNode(NODE_ID, PORT, PEERS);

// MongoDB State model (only leader writes)
// NEW
mongoose.connect("mongodb+srv://samarthkeshari8_db_user:s5sghJu9hvfXXZn2@cluster0.jayytfd.mongodb.net/?appName=Cluster0");
const StateModel = mongoose.model("State", new mongoose.Schema({
    key: String, value: String, term: Number, committedBy: Number
}));

// Vote endpoint
app.post("/vote", (req, res) => {
    const { term, candidateId } = req.body;
    const result = node.handleVoteRequest(term, candidateId);
    res.json(result);
});

// Heartbeat endpoint
app.post("/heartbeat", (req, res) => {
    const { term, leaderId } = req.body;
    node.handleHeartbeat(term, leaderId);
    res.json({ success: true });
});

// Commit state (called by Express API when this node is leader)
app.post("/commit", async (req, res) => {
    if (node.state !== "leader") {
        return res.status(403).json({ error: "Not the leader", leader: false });
    }
    const { key, value } = req.body;
    await StateModel.create({ key, value, term: node.currentTerm, committedBy: NODE_ID });
    console.log(`[Node ${NODE_ID}] Committed state: ${key} = ${value}`);
    res.json({ success: true, committed: { key, value } });
});

// Status endpoint
app.get("/status", (req, res) => res.json(node.getStatus()));

app.listen(PORT, () => console.log(`Node ${NODE_ID} running on port ${PORT}`));