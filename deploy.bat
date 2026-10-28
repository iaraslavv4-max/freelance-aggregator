@echo off
chcp 65001 > nul
echo ========================================
echo  Автоматическая выгрузка на GitHub
echo ========================================
git add .
set /p commit_msg="Введите описание изменений (или нажмите Enter для 'update'): "
if "%commit_msg%"=="" set commit_msg=update
git commit -m "%commit_msg%"
git push
echo ========================================
echo  Готово! Код залит на GitHub.
echo ========================================
pause