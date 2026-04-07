// scripts/manage-node.js
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const CONFIG_FILE = path.join(__dirname, "../replica-config.json");

function loadConfig() {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
}

function saveConfig(config) {
    config.lastUpdated = new Date().toISOString();
    config.version += 1;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function gitCommit(message) {
    try {
        execSync("git add replica-config.json", { cwd: path.join(__dirname, "..") });
        execSync(`git commit -m "${message}"`, { cwd: path.join(__dirname, "..") });
        console.log(`[GIT] Committed: ${message}`);
    } catch (err) {
        console.log("[GIT] Nothing to commit or git error");
    }
}

function addNode(id, port) {
    const config = loadConfig();
    const exists = config.nodes.find((n) => n.id === parseInt(id));

    if (exists) {
        exists.status = "active";
        console.log(`[MANAGER] Node ${id} reactivated`);
    } else {
        config.nodes.push({ id: parseInt(id), port: parseInt(port), status: "active" });
        console.log(`[MANAGER] Node ${id} added on port ${port}`);
    }

    saveConfig(config);
    gitCommit(`Add Node ${id} to cluster (port ${port}) - v${config.version}`);
}

function removeNode(id) {
    const config = loadConfig();
    const node = config.nodes.find((n) => n.id === parseInt(id));

    if (!node) {
        console.log(`[MANAGER] Node ${id} not found`);
        return;
    }

    node.status = "removed";
    saveConfig(config);
    gitCommit(`Remove Node ${id} from cluster - v${config.version}`);
    console.log(`[MANAGER] Node ${id} marked as removed`);
}

function listNodes() {
    const config = loadConfig();
    console.log(`\n📋 Cluster: ${config.cluster} | Version: ${config.version}`);
    console.log(`Last Updated: ${config.lastUpdated}\n`);
    config.nodes.forEach((n) => {
        const icon = n.status === "active" ? "[ACTIVE]" : "[REMOVED]";
        console.log(`  ${icon} Node ${n.id} → Port ${n.port}`);
    });
    console.log("");
}

// CLI interface
const action = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

if (action === "add") addNode(arg1, arg2);
else if (action === "remove") removeNode(arg1);
else if (action === "list") listNodes();
else console.log("Usage: node manage-node.js [add <id> <port>] [remove <id>] [list]");