-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Migración: tabla de empleados con capacitaciones por NP/centro
-- Fecha: 2026-05-10
-- Autor: H2 Stamping MES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS empleados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_empleado INTEGER UNIQUE NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  rol VARCHAR(80) NOT NULL,
  -- Roles esperados (validar en UI, no en BD para flexibilidad):
  -- operador_prensa, operador_ensamble, supervisor_turno, ing_proceso,
  -- gerente_produccion, jefe_mantenimiento, calidad, planeacion, direccion, otro
  turno_principal INTEGER, -- 1, 2, 3 o NULL si es admin/sin turno fijo
  activo BOOLEAN NOT NULL DEFAULT true,
  fecha_ingreso DATE,
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación: en qué centros puede operar cada empleado
-- y con qué nivel de capacitación por NP
CREATE TABLE IF NOT EXISTS empleado_capacitaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empleado_id UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  prensa_id TEXT REFERENCES prensas(id) ON DELETE CASCADE, -- NULL si es transversal (ej. supervisor)
  numero_parte VARCHAR(50), -- NP específico, NULL si es genérico para todos los NPs
  nivel INTEGER NOT NULL CHECK (nivel BETWEEN 0 AND 4),
  -- 0 = no capacitado, 1 = con ayuda nivel 3, 2 = supervisión constante,
  -- 3 = supervisión mínima, 4 = entrena a otros
  fecha_actualizacion DATE DEFAULT CURRENT_DATE,
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(empleado_id, prensa_id, numero_parte)
);

-- Índices para queries comunes
CREATE INDEX IF NOT EXISTS idx_empleados_activo ON empleados(activo);
CREATE INDEX IF NOT EXISTS idx_empleados_rol ON empleados(rol);
CREATE INDEX IF NOT EXISTS idx_empleados_turno ON empleados(turno_principal);
CREATE INDEX IF NOT EXISTS idx_capacitaciones_empleado ON empleado_capacitaciones(empleado_id);
CREATE INDEX IF NOT EXISTS idx_capacitaciones_prensa ON empleado_capacitaciones(prensa_id);

-- Trigger para mantener updated_at
CREATE OR REPLACE FUNCTION update_empleados_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER empleados_update_timestamp
BEFORE UPDATE ON empleados
FOR EACH ROW EXECUTE FUNCTION update_empleados_timestamp();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Seed inicial con los empleados conocidos del Drive de planta
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO empleados (numero_empleado, nombre, rol, turno_principal, activo) VALUES
  -- Operadores de Prensas (S0009, S0014, S0024)
  (18, 'Luis Manuel Diaz Lucas',     'operador_prensa',   1, true),
  (42, 'Ernesto Daniel Cruz Luna',   'operador_prensa',   2, true),
  (32, 'Roberto Arvizu Nieves',      'operador_prensa',   1, true),
  (66, 'L. Fernando Montero',        'operador_prensa',   2, true),
  -- Operadores Línea de Ensamble ZKW
  (23, 'Maria Salinas Godoy',        'operador_ensamble', 3, true),
  (29, 'Jesus Salinas Galicia',      'operador_ensamble', 1, true),
  (38, 'Ubando Martinez Gonzalez',   'operador_ensamble', 2, true),
  (43, 'Jose Luna Sanchez',          'operador_ensamble', 1, true),
  (45, 'Abraham Sanchez',            'operador_ensamble', 2, true),
  (56, 'Yazmin Cruz Noria',          'operador_ensamble', 3, true),
  (58, 'Karen Ivonne Gonzalez',      'operador_ensamble', 1, true)
ON CONFLICT (numero_empleado) DO NOTHING;
