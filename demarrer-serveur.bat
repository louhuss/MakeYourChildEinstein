@echo off
title Serveur local - Make Your Child Einstein
cd /d "%~dp0"
echo.
echo   ================================================
echo    MAKE YOUR CHILD EINSTEIN - serveur local
echo   ================================================
echo.
echo   Le jeu va s ouvrir dans ton navigateur.
echo   Laisse CETTE FENETRE OUVERTE pendant que tu joues.
echo   Pour arreter : ferme la fenetre ou fais Ctrl+C.
echo.
py --version >nul 2>&1
if %errorlevel%==0 goto PY
python --version >nul 2>&1
if %errorlevel%==0 goto PYTHON
node --version >nul 2>&1
if %errorlevel%==0 goto NODE
goto NONE

:PY
start "" http://localhost:8000/index.html
py -m http.server 8000
goto END

:PYTHON
start "" http://localhost:8000/index.html
python -m http.server 8000
goto END

:NODE
start "" http://localhost:8000/index.html
npx --yes http-server -p 8000 -c-1
goto END

:NONE
echo   Aucun serveur trouve sur cet ordinateur.
echo.
echo   Installe Python depuis https://www.python.org/downloads/
echo   Pense a cocher "Add python.exe to PATH" pendant l installation,
echo   puis relance ce fichier.
echo.
pause

:END
