// raftNode.js
const axios = require("axios");

const STATES = { FOLLOWER: "follower", CANDIDATE: "candidate", LEADER: "leader" };

class RaftNode {
    constructor(id, port, peers) {
        this.id = id;
        this.port = port;
        this.peers = peers;

        this.state = STATES.FOLLOWER;
        this.currentTerm = 0;
        this.votedFor = null;
        this.votes = 0;

        this.electionTimeout = null;
        this.heartbeatInterval = null;

        this.resetElectionTimer();
    }

    // Random timeout between 1500ms–3000ms (Raft standard) 1.5 sec to 3sec
    getRandomTimeout() {
        return Math.floor(Math.random() * 1500) + 1500;
    }

    resetElectionTimer() {
        clearTimeout(this.electionTimeout);
        this.electionTimeout = setTimeout(() => this.startElection(), this.getRandomTimeout());
    }

    async startElection() {
        this.state = STATES.CANDIDATE;
        this.currentTerm += 1;
        this.votedFor = this.id;
        this.votes = 1; // vote for self
        console.log(`[Node ${this.id}] became CANDIDATE for term ${this.currentTerm}`);

        for (const peer of this.peers) {
            try {
                const res = await axios.post(`${peer}/vote`, {
                    term: this.currentTerm,
                    candidateId: this.id,
                });
                if (res.data.voteGranted) {
                    this.votes += 1;
                    console.log(`[Node ${this.id}] received vote. Total: ${this.votes}`);
                }
            } catch (err) {
                console.log(`[Node ${this.id}] peer ${peer} unreachable`);
            }
        }

        const majority = Math.floor((this.peers.length + 1) / 2) + 1;
        if (this.votes >= majority) {
            this.becomeLeader();
        } else {
            this.state = STATES.FOLLOWER;
            this.resetElectionTimer();
        }
    }

    becomeLeader() {
        this.state = STATES.LEADER;
        console.log(`[Node ${this.id}] *** BECAME LEADER for term ${this.currentTerm} ***`);
        clearTimeout(this.electionTimeout);
        this.heartbeatInterval = setInterval(() => this.sendHeartbeats(), 500);
    }

    async sendHeartbeats() {
        for (const peer of this.peers) {
            try {
                await axios.post(`${peer}/heartbeat`, {
                    term: this.currentTerm,
                    leaderId: this.id,
                });
            } catch (err) {
            }
        }
    }

    handleVoteRequest(term, candidateId) {
        if (term > this.currentTerm) {
            this.currentTerm = term;
            this.votedFor = null;
            this.state = STATES.FOLLOWER;
        }
        const voteGranted = term >= this.currentTerm && (this.votedFor === null || this.votedFor === candidateId);
        if (voteGranted) this.votedFor = candidateId;
        return { voteGranted, term: this.currentTerm };
    }

    handleHeartbeat(term, leaderId) {
        if (term >= this.currentTerm) {
            this.currentTerm = term;
            this.state = STATES.FOLLOWER;
            this.votedFor = null;
            clearInterval(this.heartbeatInterval);
            this.resetElectionTimer();
        }
    }

    getStatus() {
        return { id: this.id, state: this.state, term: this.currentTerm, leader: this.state === STATES.LEADER };
    }
}

module.exports = RaftNode;