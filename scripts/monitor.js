// scripts/monitor.js
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const NODES = [
    { id: 1, url: "http://localhost:3001" },
    { id: 2, url: "http://localhost:3002" },
    { id: 3, url: "http://localhost:3003" },
];

// Track previous state of each node
const nodeState = { 1: "unknown", 2: "unknown", 3: "unknown" };

const LOG_FILE = path.join(__dirname, "network.log");

function getTimestamp() {
    return new Date().toISOString();
}

function writeLog(message) {
    const line = `[${getTimestamp()}] ${message}\n`;
    fs.appendFileSync(LOG_FILE, line);
    console.log(line.trim());
}

async function checkNode(node) {
    try {
        const res = await axios.get(`${node.url}/status`, { timeout: 1000 });
        const { state, term } = res.data;

        // Node just came back UP
        if (nodeState[node.id] === "down" || nodeState[node.id] === "unknown") {
            writeLog(`Node ${node.id} is UP | Role: ${state.toUpperCase()} | Term: ${term}`);
        }

        nodeState[node.id] = "up";
    } catch (err) {
        // Node just went DOWN
        if (nodeState[node.id] !== "down") {
            writeLog(`Node ${node.id} is DOWN | Last known state: ${nodeState[node.id]}`);
        }
        nodeState[node.id] = "down";
    }
}

async function monitorCluster() {
    writeLog("🚀 Network Monitor Started — watching 3 nodes...");

    setInterval(async () => {
        for (const node of NODES) {
            await checkNode(node);
        }
    }, 2000);
}

monitorCluster();