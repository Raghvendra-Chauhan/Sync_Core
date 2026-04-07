// raftNode.js - Enhanced with Split-Brain Prevention
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
        this.leaderId = null;

        // Split-brain prevention
        this.lastHeartbeat = Date.now();
        this.electionInProgress = false;

        this.electionTimeout = null;
        this.heartbeatInterval = null;

        this.resetElectionTimer();
    }

    getRandomTimeout() {
        return Math.floor(Math.random() * 1500) + 1500;
    }

    resetElectionTimer() {
        clearTimeout(this.electionTimeout);
        this.electionTimeout = setTimeout(() => this.startElection(), this.getRandomTimeout());
    }

    async startElection() {
        // SPLIT-BRAIN PREVENTION 1:
        // Don't start election if one is already in progress
        if (this.electionInProgress) {
            console.log(`[Node ${this.id}] Election already in progress, skipping`);
            this.resetElectionTimer();
            return;
        }

        // SPLIT-BRAIN PREVENTION 2:
        // Don't start election if we recently heard from a leader
        const timeSinceHeartbeat = Date.now() - this.lastHeartbeat;
        if (timeSinceHeartbeat < 1000 && this.state === STATES.FOLLOWER) {
            console.log(`[Node ${this.id}] Recently heard from leader, skipping election`);
            this.resetElectionTimer();
            return;
        }

        this.electionInProgress = true;
        this.state = STATES.CANDIDATE;
        this.currentTerm += 1;
        this.votedFor = this.id;
        this.votes = 1;
        this.leaderId = null;

        console.log(`[Node ${this.id}] became CANDIDATE for term ${this.currentTerm}`);

        const votePromises = this.peers.map(async (peer) => {
            try {
                const res = await axios.post(
                    `${peer}/vote`,
                    { term: this.currentTerm, candidateId: this.id },
                    { timeout: 1000 }
                );
                return res.data.voteGranted ? 1 : 0;
            } catch (err) {
                return 0;
            }
        });

        const results = await Promise.all(votePromises);
        const totalVotes = results.reduce((sum, v) => sum + v, 0) + 1;

        console.log(`[Node ${this.id}] received ${totalVotes} total votes in term ${this.currentTerm}`);

        // SPLIT-BRAIN PREVENTION 3:
        // Only become leader if still candidate (another leader might have emerged)
        if (this.state !== STATES.CANDIDATE) {
            console.log(`[Node ${this.id}] State changed during election, aborting`);
            this.electionInProgress = false;
            return;
        }

        const majority = Math.floor((this.peers.length + 1) / 2) + 1;
        if (totalVotes >= majority) {
            this.becomeLeader();
        } else {
            console.log(`[Node ${this.id}] lost election with ${totalVotes} votes, reverting to follower`);
            this.state = STATES.FOLLOWER;
            this.resetElectionTimer();
        }

        this.electionInProgress = false;
    }

    becomeLeader() {
        this.state = STATES.LEADER;
        this.leaderId = this.id;
        console.log(`[Node ${this.id}] *** BECAME LEADER for term ${this.currentTerm} ***`);
        clearTimeout(this.electionTimeout);
        this.heartbeatInterval = setInterval(() => this.sendHeartbeats(), 500);
    }

    async sendHeartbeats() {
        for (const peer of this.peers) {
            try {
                await axios.post(
                    `${peer}/heartbeat`,
                    { term: this.currentTerm, leaderId: this.id },
                    { timeout: 500 }
                );
            } catch (err) {
                // peer down
            }
        }
    }

    handleVoteRequest(term, candidateId) {
        // SPLIT-BRAIN PREVENTION 4:
        // Reject vote if we already have a leader in this term
        if (term < this.currentTerm) {
            return { voteGranted: false, term: this.currentTerm, reason: "outdated term" };
        }

        if (term > this.currentTerm) {
            this.currentTerm = term;
            this.votedFor = null;
            this.state = STATES.FOLLOWER;
            clearInterval(this.heartbeatInterval);
        }

        // SPLIT-BRAIN PREVENTION 5:
        // Only vote once per term
        const voteGranted =
            this.votedFor === null || this.votedFor === candidateId;

        if (voteGranted) {
            this.votedFor = candidateId;
            this.resetElectionTimer();
            console.log(`[Node ${this.id}] granted vote to Node ${candidateId} for term ${term}`);
        } else {
            console.log(`[Node ${this.id}] denied vote to Node ${candidateId} (already voted for ${this.votedFor})`);
        }

        return { voteGranted, term: this.currentTerm };
    }

    handleHeartbeat(term, leaderId) {
        if (term >= this.currentTerm) {
            this.currentTerm = term;
            this.state = STATES.FOLLOWER;
            this.leaderId = leaderId;
            this.votedFor = null;
            this.lastHeartbeat = Date.now(); // Track last heartbeat time
            clearInterval(this.heartbeatInterval);
            this.resetElectionTimer();
        } else {
            // SPLIT-BRAIN PREVENTION 6:
            // Reject heartbeats from outdated leaders
            console.log(`[Node ${this.id}] Rejected heartbeat from outdated leader ${leaderId} (term ${term} < ${this.currentTerm})`);
        }
    }

    getStatus() {
        return {
            id: this.id,
            state: this.state,
            term: this.currentTerm,
            leader: this.state === STATES.LEADER,
            leaderId: this.leaderId,
            votedFor: this.votedFor,
            lastHeartbeat: this.lastHeartbeat,
        };
    }
}

module.exports = RaftNode;