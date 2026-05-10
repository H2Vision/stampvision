-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Script: Limpiar tabla produccion antes de reimportar CSV
-- Uso: Supabase Studio → SQL Editor → pegar y ejecutar
--
-- DESPUÉS de correr este script:
--   1. Ir a Table Editor → tabla "produccion"
--   2. Botón "Import data from CSV"
--   3. Seleccionar el archivo produccion_demo_v4.csv
--
-- Operadores en el CSV v4 (todos existen en tabla empleados):
--   - Luis Manuel Diaz Lucas
--   - Ernesto Daniel Cruz Luna
--   - Roberto Arvizu Nieves
--   - L. Fernando Montero
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TRUNCATE TABLE produccion;

SELECT COUNT(*) AS registros_actuales FROM produccion;
-- Esperado: 0
