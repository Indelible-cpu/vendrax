@echo off
echo 🔄 Watching project for changes (DEV mode)...

chokidar "src/**/*.*" "backend/**/*.*" -d 7 -c "git add . && git commit -m 'dev update' && git push origin dev"