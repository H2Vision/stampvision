-- StampVision — Migración inicial
-- Aplicar en Supabase SQL Editor si la conexión directa no está disponible

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EstadoPrensa" AS ENUM ('activa', 'mantenimiento', 'inactiva');

-- CreateEnum
CREATE TYPE "TipoAlerta" AS ENUM ('oee_bajo', 'scrap_alto', 'paro_largo', 'meta_no_alcanzada');

-- CreateEnum
CREATE TYPE "SeveridadAlerta" AS ENUM ('info', 'warning', 'critical');

-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('operador', 'supervisor', 'gerencia', 'admin');

-- CreateTable
CREATE TABLE "prensas" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "tonelaje" INTEGER NOT NULL,
    "estado" "EstadoPrensa" NOT NULL DEFAULT 'activa',
    "velocidad_estandar" DECIMAL(8,2) NOT NULL,
    "meta_oee" DECIMAL(5,4) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prensas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion" (
    "id" TEXT NOT NULL,
    "prensa_id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "turno" INTEGER NOT NULL,
    "piezas_ok" INTEGER NOT NULL,
    "piezas_nok" INTEGER NOT NULL,
    "tiempo_planeado_min" INTEGER NOT NULL,
    "tiempo_muerto_min" INTEGER NOT NULL,
    "velocidad_real" DECIMAL(8,2) NOT NULL,
    "causa_paro" TEXT,
    "numero_parte" VARCHAR(50) NOT NULL,
    "operador" VARCHAR(100) NOT NULL,
    "subido_por" TEXT,
    "archivo_origen" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertas" (
    "id" TEXT NOT NULL,
    "tipo" "TipoAlerta" NOT NULL,
    "severidad" "SeveridadAlerta" NOT NULL,
    "mensaje" TEXT NOT NULL,
    "prensa_id" TEXT NOT NULL,
    "valor_actual" DECIMAL(10,4) NOT NULL,
    "umbral" DECIMAL(10,4) NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alertas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'operador',
    "prensa_asignada" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "accion" VARCHAR(50) NOT NULL,
    "detalle" JSONB,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion" (
    "id" TEXT NOT NULL,
    "clave" VARCHAR(50) NOT NULL,
    "valor" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "configuracion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "prensas_nombre_key" ON "prensas"("nombre");

-- CreateIndex
CREATE INDEX "produccion_prensa_id_idx" ON "produccion"("prensa_id");

-- CreateIndex
CREATE INDEX "produccion_fecha_idx" ON "produccion"("fecha");

-- CreateIndex
CREATE INDEX "produccion_fecha_prensa_id_idx" ON "produccion"("fecha", "prensa_id");

-- CreateIndex
CREATE INDEX "alertas_prensa_id_idx" ON "alertas"("prensa_id");

-- CreateIndex
CREATE INDEX "alertas_leida_created_at_idx" ON "alertas"("leida", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "audit_log_usuario_id_idx" ON "audit_log"("usuario_id");

-- CreateIndex
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "configuracion_clave_key" ON "configuracion"("clave");

-- AddForeignKey
ALTER TABLE "produccion" ADD CONSTRAINT "produccion_prensa_id_fkey" FOREIGN KEY ("prensa_id") REFERENCES "prensas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_prensa_id_fkey" FOREIGN KEY ("prensa_id") REFERENCES "prensas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_prensa_asignada_fkey" FOREIGN KEY ("prensa_asignada") REFERENCES "prensas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
