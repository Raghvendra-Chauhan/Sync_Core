# SyncCore — Consensus Algorithm Implementer

> A distributed consensus system implementing the **Raft algorithm** for leader election, fault-tolerant state replication, and split-brain prevention — inspired by industry-standard platforms like *etcd* and *Consul*.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [How It Works](#-how-it-works)
- [API Reference](#-api-reference)
- [Demo](#-demo)
- [Team](#-team)

---

## 🧠 Overview

**SyncCore** is a practical implementation of a distributed coordination system using the **Raft Consensus Algorithm**. It simulates a cluster of nodes that automatically elect a leader, replicate state, and maintain consistency — even in the presence of node failures.

The system is composed of:
- A **3-node Raft cluster** running as independent Node.js processes
- An **Express.js Proposal API** acting as the client-facing interface
- **MongoDB Atlas** for persistent, replicated state storage
- **Shell scripts** for cluster lifecycle management

---

## ❗ Problem Statement

Distributed systems face critical challenges that impact reliability and correctness:

- Node failures and unexpected crashes
- Network delays and communication latency
- Network partitions leading to **split-brain scenarios**
- Inconsistent data replication across nodes
- Manual intervention required for recovery

Without a proper consensus mechanism, these challenges lead to conflicting decisions and data inconsistency. SyncCore solves this by ensuring **consistent decision-making, safe state replication, and automated leader election**.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  CLIENT / POSTMAN                    │
└──────────────────────┬──────────────────────────────┘
                       │ POST /propose
┌──────────────────────▼──────────────────────────────┐
│           Express.js Proposal API (Port 3000)        │
│         Finds leader → forwards state change         │
└──────┬───────────────┬──────────────────┬───────────┘
       │               │                  │
┌──────▼──────┐ ┌──────▼──────┐ ┌────────▼────┐
│   Node 1    │ │   Node 2    │ │   Node 3    │
│  Port 3001  │ │  Port 3002  │ │  Port 3003  │
│  Raft Logic │ │  Raft Logic │ │  Raft Logic │
└──────┬──────┘ └──────┬──────┘ └──────┬──────┘
       │               │               │
       └───────────────▼───────────────┘
                       │ Leader commits
              ┌────────▼────────┐
              │  MongoDB Atlas  │
              │  (consensus DB) │
              └─────────────────┘
```

### Component Responsibilities

| Component | Role |
|---|---|
| **Express.js API** | Accepts state change proposals from clients, discovers the current leader, forwards commit requests |
| **Raft Nodes (Node.js)** | Implement full Raft logic — leader election, term management, heartbeats, majority voting |
| **MongoDB Atlas** | Persists committed state entries with term number and leader ID |
| **Shell Scripts** | Start and stop the entire cluster with a single command |
| **Git** | Tracks all configuration and replica evolution over time |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | Core Raft consensus and coordination logic |
| Express.js | REST API for proposing state changes |
| MongoDB Atlas | Cloud-hosted replicated persistent storage |
| Mongoose | MongoDB ODM for schema and connection management |
| Axios | Inter-node HTTP communication |
| Shell Scripting (BAT) | Node orchestration and cluster automation |
| Git | Version control and configuration tracking |

---

## 📁 Project Structure

```
synccore/
│
├── raftNode.js              # Core Raft algorithm — election, voting, heartbeat
│
├── node1/
│   └── index.js             # Raft node on port 3001
├── node2/
│   └── index.js             # Raft node on port 3002
├── node3/
│   └── index.js             # Raft node on port 3003
│
├── api/
│   └── index.js             # Express proposal API on port 3000
│
├── scripts/
│   ├── start.bat            # Starts all 3 nodes + API
│   └── stop.bat             # Stops all running node processes
│
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or higher
- [Git](https://git-scm.com/)
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/your-username/synccore.git
cd synccore
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure MongoDB Atlas**

- Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Whitelist `0.0.0.0/0` under Network Access
- Get your connection string from Connect → Drivers → Node.js

In `node1/index.js`, `node2/index.js`, and `node3/index.js`, replace:
```js
mongoose.connect("YOUR_ATLAS_CONNECTION_STRING/consensus?retryWrites=true&w=majority");
```

### Running the Cluster

**Start all nodes (Windows):**
```bash
scripts\start.bat
```

This opens 4 terminal windows:
- Node 1 on port 3001
- Node 2 on port 3002
- Node 3 on port 3003
- Proposal API on port 3000

**Stop all nodes:**
```bash
scripts\stop.bat
```

---

## ⚙️ How It Works

### Raft Leader Election

1. All nodes start as **Followers** with a random election timeout (1500–3000ms)
2. The first node whose timer expires becomes a **Candidate** and requests votes
3. Other nodes grant their vote if they haven't voted in the current term
4. A candidate that receives votes from a **majority (2 out of 3)** becomes the **Leader**
5. The Leader sends periodic **heartbeats** every 500ms to prevent re-elections

### State Commitment Flow

```
Client → POST /propose → API finds leader → Leader receives /commit
→ Majority acknowledged → State written to MongoDB Atlas
```

### Fault Tolerance

- If the leader goes down, remaining nodes detect the missing heartbeat and trigger a new election automatically
- Only the leader can write to MongoDB — preventing split-brain writes
- Majority voting (quorum) ensures no two leaders exist in the same term

---

## 📡 API Reference

### Proposal API (Port 3000)

#### `POST /propose`
Propose a state change to the cluster. The API automatically routes to the current leader.

**Request:**
```json
{
  "key": "app_mode",
  "value": "production"
}
```

**Response:**
```json
{
  "success": true,
  "leader": "http://localhost:3001",
  "result": {
    "success": true,
    "committed": {
      "key": "app_mode",
      "value": "production"
    }
  }
}
```

#### `GET /cluster-status`
Returns the current state of all 3 nodes.

**Response:**
```json
[
  { "node": 1, "status": { "id": 1, "state": "leader", "term": 1, "leader": true } },
  { "node": 2, "status": { "id": 2, "state": "follower", "term": 1, "leader": false } },
  { "node": 3, "status": { "id": 3, "state": "follower", "term": 1, "leader": false } }
]
```

### Node API (Ports 3001–3003)

| Endpoint | Method | Description |
|---|---|---|
| `/vote` | POST | Handle vote request from a candidate |
| `/heartbeat` | POST | Handle heartbeat from the leader |
| `/commit` | POST | Commit a state change (leader only) |
| `/status` | GET | Get current node state and term |

---

## 🎬 Demo

**1. Start the cluster:**
```bash
scripts\start.bat
```

**2. Watch leader election in the terminal:**
```
[Node 1] became CANDIDATE for term 1
[Node 1] received vote. Total: 2
[Node 1] received vote. Total: 3
[Node 1] *** BECAME LEADER for term 1 ***
```

**3. Propose a state change:**
```bash
curl -X POST http://localhost:3000/propose \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"app_mode\",\"value\":\"production\"}"
```

**4. Check cluster status:**
```bash
curl http://localhost:3000/cluster-status
```

**5. Verify in MongoDB Atlas:**
Browse Collections → `consensus` → `states` → committed document visible with term and leader ID.

---

## 👥 Team

| Name | Role |
|---|---|
| **Samarth Keshari** | Raft consensus logic & leader election |
| **Raghvendra Chauhan** | Express.js proposal API & routing |
| **Pushkar Sharma** | MongoDB Atlas integration & state schema |
| **Rachna Kumari** | Shell scripting & cluster orchestration |
| **Priyanshu** | System architecture & Git configuration tracking |

---
