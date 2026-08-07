@echo off
cd /d "%~dp0demo"
call mvn -q resources:resources
mvn spring-boot:run
