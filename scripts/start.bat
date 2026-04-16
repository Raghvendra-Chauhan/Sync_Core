@echo off
echo Starting SyncCore Cluster...

echo.
echo Checking available nodes...
node scripts/manage-node.js list
echo.

echo Starting Node 1..
start "Node 1" cmd /k "node node1/index.js"
timeout /t 1 /nobreak > nul

echo Starting Node 2..
start "Node 2" cmd /k "node node2/index.js"
timeout /t 1 /nobreak > nul

echo Starting Node 3..
start "Node 3" cmd /k "node node3/index.js"
timeout /t 1 /nobreak > nul

echo Starting API..
start "API" cmd /k "node api/index.js"
timeout /t 1 /nobreak > nul

echo Starting Monitor..
start "Monitor" cmd /k "node scripts/monitor.js"

echo.
echo ===================================
echo SyncCore cluster started successfully!
echo ===================================
echo API running at http://localhost:3000
echo Monitor running in background
echo.
pause