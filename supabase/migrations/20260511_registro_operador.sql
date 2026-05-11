-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Migración: campos manuales para formulario de operador
-- Fecha: 2026-05-11
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Agregar columnas manuales a la tabla produccion existente
ALTER TABLE produccion
  ADD COLUMN IF NOT EXISTS po               VARCHAR(50),
  ADD COLUMN IF NOT EXISTS tipo_material    VARCHAR(20),   -- Rollo | Bobina | Caja | Contenedor
  ADD COLUMN IF NOT EXISTS cantidad_material INTEGER,
  ADD COLUMN IF NOT EXISTS kilos_scrap      NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS comentarios_gpm  TEXT,
  ADD COLUMN IF NOT EXISTS comentarios      TEXT,
  ADD COLUMN IF NOT EXISTS fuente           VARCHAR(10) DEFAULT 'manual'; -- 'manual' | 'erp'

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Tabla de eventos de tiempo muerto (múltiples por turno)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS downtime_eventos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Referencia al turno de producción (opcional — puede registrarse sin produccion_id)
  produccion_id  UUID REFERENCES produccion(id) ON DELETE SET NULL,
  -- Identificación del turno (para cuando no hay produccion_id)
  prensa_id      TEXT REFERENCES prensas(id) ON DELETE CASCADE,
  operador       VARCHAR(150),
  turno          INTEGER,
  fecha          DATE NOT NULL DEFAULT CURRENT_DATE,
  numero_parte   VARCHAR(50),
  po             VARCHAR(50),
  -- El evento
  motivo         VARCHAR(150) NOT NULL,
  hora_inicio    TIME NOT NULL,
  hora_fin       TIME NOT NULL,
  minutos        INTEGER,
  comentarios    TEXT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_downtime_prensa  ON downtime_eventos(prensa_id);
CREATE INDEX IF NOT EXISTS idx_downtime_fecha   ON downtime_eventos(fecha);
CREATE INDEX IF NOT EXISTS idx_downtime_motivo  ON downtime_eventos(motivo);
CREATE INDEX IF NOT EXISTS idx_downtime_turno   ON downtime_eventos(turno);
