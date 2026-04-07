@echo off
echo Starting SyncCore Cluster...

node scripts/manage-node.js list

start "Node 1" cmd /k "node node1/index.js"
timeout /t 1 /nobreak > nul
start "Node 2" cmd /k "node node2/index.js"
timeout /t 1 /nobreak > nul
start "Node 3" cmd /k "node node3/index.js"
timeout /t 1 /nobreak > nul
start "API" cmd /k "node api/index.js"
timeout /t 1 /nobreak > nul
start "Monitor" cmd /k "node scripts/monitor.js"

echo.
echo SyncCore cluster started successfully!
echo API running at http://localhost:3000
echo Monitor running in background