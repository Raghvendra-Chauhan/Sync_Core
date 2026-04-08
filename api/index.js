const express = require("express");
const axios = require("axios");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static("dashboard"));

const NODES = [
    { id: 1, url: "http://localhost:3001" },
    { id: 2, url: "http://localhost:3002" },
    { id: 3, url: "http://localhost:3003" },
];

// Find current leader
async function findLeader() {
    for (const node of NODES) {
        try {
            const res = await axios.get(`${node.url}/status`, { timeout: 1000 });
            if (res.data.leader) return node.url;
        } catch (e) { }
    }
    return null;
}

// Cluster status
app.get("/cluster-status", async (req, res) => {
    const statuses = await Promise.allSettled(
        NODES.map((n) => axios.get(`${n.url}/status`, { timeout: 1000 }).then((r) => r.data))
    );
    res.json(statuses.map((s, i) => ({
        node: i + 1,
        url: NODES[i].url,
        status: s.status === "fulfilled" ? s.value : "unreachable",
    })));
});

// Propose state change
app.post("/propose", async (req, res) => {
    const { key, value } = req.body;
    if (!key || !value) return res.status(400).json({ error: "key and value required" });
    const leader = await findLeader();
    if (!leader) return res.status(503).json({ error: "No leader elected yet" });
    try {
        const result = await axios.post(`${leader}/commit`, { key, value });
        res.json({ success: true, leader, result: result.data });
    } catch (e) {
        res.status(500).json({ error: "Commit failed" });
    }
});

// Stop a specific node
app.post("/control/stop/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const node = NODES.find((n) => n.id === id);
    if (!node) return res.status(404).json({ error: "Node not found" });
    try {
        await axios.post(`${node.url}/shutdown`, {}, { timeout: 1000 });
        res.json({ success: true, message: `Node ${id} stop signal sent` });
    } catch (e) {
        res.json({ success: true, message: `Node ${id} is already down or stop signal sent` });
    }
});

// Restart a specific node
app.post("/control/restart/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const projectRoot = path.join(__dirname);
    const command = `start "Node ${id}" cmd /k "cd /d ${projectRoot} && node node${id}/index.js"`;
    exec(command, { shell: 'cmd.exe', cwd: projectRoot }, (err) => {
        if (err) {
            console.error("Restart error:", err);
            return res.status(500).json({ error: "Failed to restart node" });
        }
        res.json({ success: true, message: `Node ${id} restarting...` });
    });
});

// Get committed states from MongoDB
app.get("/states", async (req, res) => {
    try {
        const node = NODES.find(async (n) => {
            try { await axios.get(`${n.url}/status`, { timeout: 1000 }); return true; }
            catch (e) { return false; }
        });
        const result = await axios.get(`${NODES[0].url}/states`);
        res.json(result.data);
    } catch (e) {
        res.status(500).json({ error: "Could not fetch states" });
    }
});

// Get network log
app.get("/network-log", (req, res) => {
    const logPath = path.join(__dirname, "scripts", "network.log");
    if (!fs.existsSync(logPath)) return res.json({ logs: [] });
    const content = fs.readFileSync(logPath, "utf8");
    const lines = content.trim().split("\n").filter(Boolean).reverse().slice(0, 100);
    res.json({ logs: lines });
});

// Download network log
app.get("/network-log/download", (req, res) => {
    const logPath = path.join(__dirname, "scripts", "network.log");
    if (!fs.existsSync(logPath)) return res.status(404).json({ error: "Log not found" });
    res.download(logPath, "network.log");
});

// Get Git history
app.get("/git-history", (req, res) => {
    exec("git log --oneline -20", { cwd: path.join(__dirname) }, (err, stdout) => {
        if (err) return res.status(500).json({ error: "Git error" });
        const commits = stdout.trim().split("\n").map((line) => {
            const [hash, ...rest] = line.split(" ");
            return { hash, message: rest.join(" ") };
        });
        res.json({ commits });
    });
});

// Add node to replica config
app.post("/replica/add", (req, res) => {
    const { id, port } = req.body;
    exec(`node scripts/manage-node.js add ${id} ${port}`, { cwd: path.join(__dirname) }, (err, stdout) => {
        if (err) return res.status(500).json({ error: "Failed to add node" });
        res.json({ success: true, output: stdout });
    });
});

// Remove node from replica config
app.post("/replica/remove", (req, res) => {
    const { id } = req.body;
    exec(`node scripts/manage-node.js remove ${id}`, { cwd: path.join(__dirname) }, (err, stdout) => {
        if (err) return res.status(500).json({ error: "Failed to remove node" });
        res.json({ success: true, output: stdout });
    });
});

// Get replica config
app.get("/replica/config", (req, res) => {
    const configPath = path.join(__dirname, "replica-config.json");
    if (!fs.existsSync(configPath)) return res.status(404).json({ error: "Config not found" });
    res.json(JSON.parse(fs.readFileSync(configPath, "utf8")));
});

app.listen(3000, () => console.log("API + Dashboard running on http://localhost:3000"));