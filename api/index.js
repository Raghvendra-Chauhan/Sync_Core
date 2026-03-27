const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const NODES = [
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
];

// Find which node is the current leader
async function findLeader() {
    for (const node of NODES) {
        try {
            const res = await axios.get(`${node}/status`);
            if (res.data.leader) return node;
        } catch (err) {
            // node down
        }
    }
    return null;
}

// Propose a state change — routes to leader automatically
app.post("/propose", async (req, res) => {
    const { key, value } = req.body;
    if (!key || !value) return res.status(400).json({ error: "key and value required" });

    const leader = await findLeader();
    if (!leader) return res.status(503).json({ error: "No leader elected yet" });

    try {
        const result = await axios.post(`${leader}/commit`, { key, value });
        res.json({ success: true, leader, result: result.data });
    } catch (err) {
        res.status(500).json({ error: "Commit failed", detail: err.message });
    }
});

// Check cluster status
app.get("/cluster-status", async (req, res) => {
    const statuses = await Promise.allSettled(
        NODES.map((n) => axios.get(`${n}/status`).then((r) => r.data))
    );
    res.json(statuses.map((s, i) => ({
        node: i + 1,
        status: s.status === "fulfilled" ? s.value : "unreachable",
    })));
});

app.listen(3000, () => console.log("Proposal API running on port 3000"));