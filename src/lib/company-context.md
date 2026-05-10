# H2 Stamping — Contexto Empresarial Completo

## 1. Descripción de la Empresa

H2 Stamping es una empresa de manufactura industrial especializada en el estampado en frío y caliente de piezas metálicas. Atiende principalmente al sector automotriz (Tier 2) y de electrodomésticos. La planta opera bajo estándares de calidad IATF 16949 y ISO 9001. Está ubicada en Querétaro, México.

**Misión:** Producir piezas metálicas estampadas con la más alta calidad y eficiencia, cumpliendo los tiempos de entrega comprometidos con nuestros clientes.

**Visión:** Ser el socio de manufactura preferido por nuestros clientes automotrices y de electrodomésticos en la región, reconocidos por nuestra confiabilidad y mejora continua.

---

## 2. Planta y Equipos

### Centros de Trabajo Activos en Planta México

| Código | Tonelaje | Velocidad Estándar       | Meta OEE | UUID en BD                           |
|--------|----------|--------------------------|----------|--------------------------------------|
| S0009  | 200 ton  | 75 pzs/min (4,500/hr)   | 75%      | fdaea031-6bb3-447c-b394-840bd316cba9 |
| S0014  | 150 ton  | 125 pzs/min (7,500/hr)  | 75%      | 99462bbc-5289-4336-96a5-e4402449ff94 |
| S0024  | 300 ton  | 75 pzs/min (4,500/hr)   | 75%      | ad314754-4ca4-41e5-b439-a44987e3970a |

**Nota:** El campo `meta_oee` en la BD se almacena como decimal (0.7500 = 75%).
La velocidad estándar viene del Plan de Producción Semanal oficial (Presentación OEE 17.04.2026, Diego Yañez Hurtado).

- Cada centro de trabajo tiene su propio dado (troquel) por número de parte.
- El cambio de dado (SMED) toma en promedio 45–90 minutos dependiendo del tamaño.
- El mantenimiento preventivo (PM) se programa los lunes en turno nocturno (Turno 3).

### Capacidad Nominal
- **Turnos por día:** 3 (Turno 1: 6:00–14:00 | Turno 2: 14:00–22:00 | Turno 3: 22:00–6:00)
- **Días de operación:** Lunes a Sábado. Domingos solo bajo programa especial.
- **Tiempo total por turno:** 540 min
- **Paros planeados:** 30 min arranque + 60 min comida + 15 min final = 105 min
- **Tiempo planeado real por turno:** 435 min (ya viene calculado en la BD, campo `tiempo_planeado_min`)

---

## 3. Indicadores Clave de Desempeño (KPIs)

### OEE — Overall Equipment Effectiveness
Fórmula oficial H2 Stamping (Presentación 17.04.2026, Diego Yañez Hurtado):

**OEE = Disponibilidad × Rendimiento × Calidad**

- **Disponibilidad** = (Tiempo Planeado − Tiempo Muerto) / Tiempo Planeado
- **Rendimiento** = Piezas Producidas / Piezas Planeadas (según plan semanal)
- **Calidad** = Piezas OK first-pass / Piezas Producidas Totales — las piezas reprocesadas NO cuentan como OK
- **Scrap Rate** = Piezas NOK / (Piezas OK + NOK) × 100%

### Metas 2026
| KPI                  | Meta         | Crítico si...  |
|----------------------|--------------|----------------|
| OEE Global           | ≥ 75%        | < 65%          |
| Disponibilidad       | ≥ 90%        | < 75%          |
| Rendimiento          | ≥ 90%        | —              |
| Calidad (first-pass) | ≥ 95%        | —              |
| Scrap Rate           | < 5%         | > 10%          |
| Tiempo muerto/turno  | < 48 min     | > 96 min       |

### Clasificación OEE Oficial H2 Stamping 2026
| Clasificación   | Rango      | Acción                                         |
|-----------------|------------|------------------------------------------------|
| Inaceptable     | < 65%      | Escalamiento inmediato. Mantenimiento + Gerente |
| Regular         | 66–75%     | Alerta. Plan de acción en 30 min               |
| Aceptable       | 76–85%     | Revisar causa de pérdida. Acción correctiva     |
| Bueno           | 86–95%     | Mantener. Identificar oportunidades            |
| Excelente       | > 95%      | Benchmark interno. Documentar buenas prácticas |

---

## 4. Causas de Paro y Tiempos Muertos

Las causas de paro se clasifican en las siguientes categorías:

### Mecánico / Equipo
- **Falla hidráulica** — Fuga de aceite, válvulas, cilindros. Tiempo típico: 30–120 min.
- **Falla eléctrica** — Sensores, tablero eléctrico, servomotor. Tiempo típico: 20–90 min.
- **Rotura de troquel** — Daño al dado/troquel. Tiempo típico: 2–8 horas (incluye reparación).
- **Falla mecánica general** — Problemas en estructura, guías, freno. Tiempo típico: 30–180 min.

### Proceso / Calidad
- **Cambio de dado (setup / changeover)** — Cambio de número de parte. Tiempo típico: 45–90 min.
- **Configuración/ajuste** — Calibración de parámetros tras cambio. Tiempo típico: 15–30 min.
- **Paro por calidad** — Defecto detectado en línea. Tiempo típico: 20–60 min.
- **Calidad de material** — Lámina fuera de especificación. Tiempo típico: variable.

### Material / Logística
- **Falta de material** — Sin lámina o sin blanks. Tiempo típico: 30–240 min.
- **Espera de montacargas** — Sin logística interna disponible. Tiempo típico: 10–30 min.

### Administrativo / Planeado
- **Mantenimiento preventivo (PM)** — Programado. No penaliza OEE si está en tiempo planeado.
- **Reunión de inicio de turno** — 15 min al inicio de cada turno (incluida en paros planeados).
- **Comida / descanso** — Restado del tiempo planeado (60 min).

---

## 5. Números de Parte y Familias de Productos

Los productos se identifican por número de parte (NP). Cada NP tiene:
- Centro de trabajo asignado (S0009, S0014 o S0024)
- Velocidad nominal (pzs/min) que puede diferir de la velocidad estándar del centro
- Material especificado (calibre de lámina, acero/aluminio)
- Cliente asignado (confidencial — no mencionar al exterior)

Familias típicas producidas (sin revelar clientes):
- Soportes estructurales para carrocería automotriz
- Refuerzos de puerta y pilar
- Brackets y herrajes para electrodomésticos (lavadora, refrigerador)
- Placas base y tapas metálicas

---

## 6. Roles y Responsabilidades del Equipo

| Rol                      | Responsabilidades clave                                            |
|--------------------------|--------------------------------------------------------------------|
| **Operador**             | Registra producción, reporta paros, mide piezas en línea           |
| **Supervisor de Turno**  | Monitorea OEE en tiempo real, autoriza paros, asigna prioridades   |
| **Ingeniero de Proceso** | Analiza causas raíz, mejora tiempos de ciclo, valida velocidades    |
| **Gerente de Producción**| Analiza tendencias, toma decisiones de programación semanal        |
| **Jefe de Mantenimiento**| Atiende alertas, programa PM, actualiza histórico de fallas        |
| **Calidad**              | Analiza scrap, libera material, gestiona no conformidades (NCR)    |
| **Planeación**           | Genera programa semanal, gestiona cambios de dado, define piezas planeadas |

La supervisora registrada en el sistema es **Patricia Díaz**.

---

## 7. Proceso de Escalamiento y Alertas

El sistema MES genera alertas automáticas cuando:
1. El OEE cae por debajo del umbral de alerta (configurable, por defecto 70%)
2. El scrap rate supera el umbral (configurable, por defecto 8%)
3. El tiempo muerto acumulado supera un límite por turno

### Protocolo de respuesta
- **Regular (OEE 66–75%):** Supervisor notificado en dashboard. Plan de acción en 30 min.
- **Inaceptable (OEE < 65%):** Escalamiento inmediato. Convocatoria a Mantenimiento + Gerente.

---

## 8. Sistema MES — Módulos Disponibles

| Módulo        | Función                                                        |
|---------------|----------------------------------------------------------------|
| **Dashboard** | Vista general: OEE del día, gráfica histórica, alertas activas |
| **Prensas**   | Estado en tiempo real de cada centro, paros activos, OEE/turno |
| **Chat IA**   | H2 Insight — consultas en lenguaje natural sobre producción    |
| **Alertas**   | Historial de alertas generadas, estado (activa/resuelta)       |
| **Reportes**  | Tabla comparativa por centro y semana, exportación a Excel     |
| **Admin**     | Configuración de centros, umbrales, usuarios del sistema       |

---

## 9. Contexto de Mejora Continua

H2 Stamping aplica metodologías de manufactura esbelta:
- **Kaizen:** Eventos de mejora continua mensuales por área
- **5S:** Estándar en toda la planta; auditorías semanales
- **SMED:** Proyecto activo para reducir tiempo de changeover a < 30 min
- **Análisis de Pareto:** Se usa para priorizar causas de paro más frecuentes
- **A3/PDCA:** Para resolver problemas recurrentes de calidad o disponibilidad

---

## 10. Políticas de Confidencialidad

- ❌ No revelar nombres de clientes finales ni números de pedido externos
- ❌ No divulgar precios de venta, costos, márgenes o datos financieros
- ❌ No mencionar información sobre proveedores de material específicos
- ❌ No compartir datos de producción fuera del sistema con personas no autorizadas
- ✅ Los datos de OEE, scrap, paros y tendencias son de uso interno libre para el equipo de planta
- ✅ Pueden compartirse reportes de desempeño internamente entre Supervisores, Gerentes y Mantenimiento

---

## 11. Glosario Técnico

| Término           | Definición                                                                      |
|-------------------|---------------------------------------------------------------------------------|
| OEE               | Overall Equipment Effectiveness — eficiencia general del equipo                  |
| Disponibilidad    | % del tiempo planeado en que el centro está operativo                            |
| Rendimiento       | % de piezas producidas vs piezas planeadas según programa semanal               |
| Calidad           | % de piezas conformes a la primera (first-pass yield, sin reproceso)            |
| Scrap / NOK       | Pieza defectuosa que no cumple especificaciones de calidad                       |
| Tiempo muerto     | Minutos en que el centro está parado de forma no planeada                       |
| Troquel / Dado    | Herramienta de corte y formado específica para cada número de parte              |
| Blank / Lámina    | Material de entrada (hoja metálica cortada) que se alimenta al centro            |
| Setup / Changeover| Tiempo de cambio de dado entre dos números de parte diferentes                   |
| Turno             | Jornada de 8 horas; hay 3 turnos por día operativo (540 min totales, 435 útiles)|
| NP                | Número de parte — identificador único de cada producto                           |
| PM                | Mantenimiento Preventivo — servicio programado al equipo                         |
| MC                | Mantenimiento Correctivo — servicio no planeado por falla                        |
| NCR               | Non-Conformance Report — reporte de no conformidad de calidad                    |
| IATF 16949        | Estándar de gestión de calidad para la industria automotriz                      |
| SPM               | Strokes Per Minute — golpes por minuto de la prensa                             |
| Velocidad estándar| Velocidad nominal del centro según Plan de Producción Semanal (pzs/min)         |
| Velocidad real    | Velocidad efectiva promedio registrada en producción (pzs/min)                  |
