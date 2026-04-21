@echo off
echo 🔄 SMART WATCHER (SAFE MODE)...

chokidar "backend/src/**/*.*" "backend/prisma/**/*.*" "frontend/src/**/*.*" -d 5 -c "git add . && git diff --cached --quiet || (git commit -m auto-update && git push origin main)"