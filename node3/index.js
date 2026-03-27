const express = require("express");
const mongoose = require("mongoose");
const RaftNode = require("../raftNode");

const NODE_ID = 3;
const PORT = 3003;
const PEERS = ["http://localhost:3001", "http://localhost:3002"];

const app = express();
app.use(express.json());

const node = new RaftNode(NODE_ID, PORT, PEERS);

mongoose.connect("mongodb+srv://youruser:yourpassword@cluster0.xxxxxx.mongodb.net/consensus?retryWrites=true&w=majority");
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

app.get("/status", (req, res) => res.json(node.getStatus()));

app.listen(PORT, () => console.log(`Node ${NODE_ID} running on port ${PORT}`));
