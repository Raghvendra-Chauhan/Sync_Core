<div align="center">

# 🚀 SyncCore

### Distributed Consensus Engine using Raft Algorithm

**Consistency through Consensus.**

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge\&logo=nodedotjs\&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge\&logo=express\&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge\&logo=mongodb\&logoColor=white)

*Mini Project – Distributed Systems | Fault Tolerance | Consensus*

</div>

---

## 📌 Overview

**SyncCore** is a distributed system designed to ensure that multiple nodes always agree on a **consistent state**, even in the presence of failures such as node crashes or network partitions.

It implements a simplified version of the **Raft Consensus Algorithm** using:

* Leader Election
* Majority Voting
* Log Replication

---

## 🎯 Problem Statement

Distributed systems face major challenges:

* ❌ Data inconsistency across nodes
* ❌ Multiple leaders (Split-Brain Problem)
* ❌ Node failures causing system instability

👉 Goal: Ensure all nodes agree on a single correct state.

---

## 💡 Our Solution

SyncCore solves this using:

* ✔️ Leader-based coordination
* ✔️ Majority (Quorum) agreement
* ✔️ Replicated logs
* ✔️ Automatic leader election

```text
Decision Rule:
Majority = (N/2) + 1
```

---

## 🏗 System Architecture

```text
Client
   ↓
Express API (Proposal Layer)
   ↓
Leader Node (Consensus Engine)
   ↓
Follower Nodes (Replication)
   ↓
MongoDB (Persistent Storage)
```

---

## ⚙️ Key Features

* 🔒 Single Leader System
* 🗳 Majority Voting Mechanism
* 🚫 Split-Brain Prevention
* ⚡ Fault Tolerance ((N/2)+1 nodes alive)
* 🔁 Log Replication
* 🔄 Automatic Recovery

---

## 🧠 How It Works

```text
1. Client sends request
2. Request goes to Leader
3. Leader sends update to Followers
4. Followers respond (ACK)
5. If majority agrees → commit
6. If leader fails → election starts
```

---

## 🪜 Implementation Plan

### Phase 1: Setup

```bash
npm init -y
npm install express mongoose axios
```

### Phase 2: Basic Server

```js
const express = require('express');
const app = express();

app.get('/status', (req, res) => {
  res.send("Node is running");
});

app.listen(5001);
```

### Phase 3: Leader Check

```js
let isLeader = true;

app.post('/updateData', (req, res) => {
  if (!isLeader) return res.send("Not Leader");
  res.send("Leader accepted request");
});
```

### Phase 4: Majority Logic

```js
let votes = 2;
let totalNodes = 3;

if (votes >= Math.floor(totalNodes/2) + 1) {
  console.log("Majority reached");
}
```

### Phase 5: MongoDB Integration

```js
const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/synccore');

const Data = mongoose.model('Data', { value: String });

async function saveData(val) {
  await Data.create({ value: val });
}
```

---

## 👥 Team Contributions

| Member         | Role                        |
| -------------- | --------------------------- |
| **Raghvendra** | API + MongoDB + Integration |
| **Priyanshu**  | Node Setup                  |
| **Pushkar**    | Node Communication          |
| **Rachna**     | Leader Election Logic       |
| **Samarth**    | Demo + Failure Handling     |

---

## 🧪 Demo Flow

```text
1. Start 3–5 nodes
2. One node becomes Leader
3. Send update request
4. Kill Leader node
5. New leader elected
6. System continues working
```

---

## 🔮 Future Scope

* Multi-algorithm support (Paxos, Multi-Paxos)
* Dynamic cluster scaling
* Security enhancements (TLS, Auth)
* Monitoring dashboard
* Cloud deployment (Docker, Kubernetes)

---

## 🎯 Conclusion

SyncCore demonstrates a simplified distributed consensus system ensuring:

* ✔️ Consistency
* ✔️ Fault Tolerance
* ✔️ Reliable Coordination

---

## ⭐ Tagline

> *“Consistency through Consensus.”*

---
