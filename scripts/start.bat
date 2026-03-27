@echo off
echo Starting Consensus Cluster...

start "Node 1" cmd /k "node node1/index.js"
timeout /t 1 /nobreak > nul
start "Node 2" cmd /k "node node2/index.js"
timeout /t 1 /nobreak > nul
start "Node 3" cmd /k "node node3/index.js"
timeout /t 1 /nobreak > nul
start "API" cmd /k "node api/index.js"

echo All nodes started!