# H2 Stamping — Contexto Empresarial Completo

## 1. Descripción de la Empresa

H2 Stamping es una empresa de manufactura industrial especializada en el estampado en frío y caliente de piezas metálicas. Atiende principalmente al sector automotriz (Tier 2) y de electrodomésticos. La planta opera bajo estándares de calidad IATF 16949 y ISO 9001. Está ubicada en México.

**Misión:** Producir piezas metálicas estampadas con la más alta calidad y eficiencia, cumpliendo los tiempos de entrega comprometidos con nuestros clientes.

**Visión:** Ser el socio de manufactura preferido por nuestros clientes automotrices y de electrodomésticos en la región, reconocidos por nuestra confiabilidad y mejora continua.

---

## 2. Planta y Equipos

### Prensas Activas

| Prensa     | Tipo         | Tonelaje | Estado habitual        | Uso principal                  |
|------------|--------------|----------|------------------------|-------------------------------|
| Prensa 1   | Hidráulica   | 200 ton  | Producción continua    | Piezas estructurales medianas  |
| Prensa 2   | Mecánica     | 150 ton  | Producción continua    | Piezas de chapa delgada        |
| Prensa 3   | Hidráulica   | 300 ton  | Alta demanda / flexible| Piezas grandes y complejas     |

- Cada prensa tiene su propio dado (troquel) por número de parte.
- El cambio de dado (SMED) toma en promedio 45–90 minutos dependiendo del tamaño.
- El mantenimiento preventivo (PM) se programa los lunes en turno nocturno (Turno 3).

### Capacidad Nominal
- **Turnos por día:** 3 (Turno 1: 6:00–14:00 | Turno 2: 14:00–22:00 | Turno 3: 22:00–6:00)
- **Días de operación:** Lunes a Sábado. Domingos solo bajo programa especial.
- **Minutos planeados por turno por prensa:** 480 min (8 horas)
- **Capacidad máxima teórica mensual:** ~3 prensas × 480 min × 3 turnos × 26 días = ~112,320 min

---

## 3. Indicadores Clave de Desempeño (KPIs)

### OEE — Overall Equipment Effectiveness
La métrica más importante del MES. Se calcula como:

**OEE = Disponibilidad × Calidad**

*(Nota: Para este sistema se simplifica omitiendo Rendimiento ya que la velocidad nominal es constante por número de parte.)*

- **Disponibilidad** = (Tiempo Planeado − Tiempo Muerto) / Tiempo Planeado
- **Calidad** = Piezas OK / (Piezas OK + Piezas NOK)
- **Scrap Rate** = Piezas NOK / (Piezas OK + NOK) × 100%

### Metas Globales de Planta
| KPI              | Meta          | Crítico si...   |
|------------------|---------------|-----------------|
| OEE Global       | ≥ 82%         | < 60%           |
| Disponibilidad   | ≥ 90%         | < 75%           |
| Scrap Rate       | < 5%          | > 10%           |
| Tiempo muerto/turno | < 48 min   | > 96 min        |

### Semáforo OEE
| Color    | Rango     | Acción                                      |
|----------|-----------|---------------------------------------------|
| 🟢 Verde  | ≥ 85%     | Excelente. Mantener.                        |
| 🟡 Amarillo| 70–84%   | Aceptable. Revisar causa de pérdida.        |
| 🟠 Naranja | 50–69%   | Alerta. Acción correctiva inmediata.        |
| 🔴 Rojo   | < 50%     | Crítico. Escalar a gerencia y mantenimiento.|

---

## 4. Causas de Paro y Tiempos Muertos

Las causas de paro se clasifican en las siguientes categorías:

### Mecánico / Equipo
- **Falla hidráulica** — Fuga de aceite, válvulas, cilindros. Tiempo típico: 30–120 min.
- **Falla eléctrica** — Sensores, tablero eléctrico, servomotor. Tiempo típico: 20–90 min.
- **Rotura de troquel** — Daño al dado/troquel. Tiempo típico: 2–8 horas (incluye reparación).
- **Falla mecánica general** — Problemas en estructura, guías, freno. Tiempo típico: 30–180 min.

### Proceso / Calidad
- **Cambio de dado (setup)** — Cambio de número de parte. Tiempo típico: 45–90 min.
- **Configuración/ajuste** — Calibración de parámetros tras cambio. Tiempo típico: 15–30 min.
- **Paro por calidad** — Defecto detectado en línea. Tiempo típico: 20–60 min.
- **Calidad de material** — Lámina fuera de especificación. Tiempo típico: variable.

### Material / Logística
- **Falta de material** — Sin lámina o sin blanks. Tiempo típico: 30–240 min.
- **Espera de montacargas** — Sin logística interna disponible. Tiempo típico: 10–30 min.

### Administativo / Planeado
- **Mantenimiento preventivo (PM)** — Programado. No cuenta como tiempo perdido si está planeado.
- **Reunión de inicio de turno** — 15 min al inicio de cada turno.
- **Comida / descanso** — Normalmente restado del tiempo planeado.

---

## 5. Números de Parte y Familias de Productos

Los productos se identifican por número de parte (NP). Cada NP tiene:
- Troquel asignado (específico por prensa o intercambiable)
- Tiempo ciclo nominal (segundos por pieza)
- Material especificado (calibre de lámina, acero/aluminio)
- Cliente asignado (confidencial — no mencionar al exterior)

Familias típicas producidas (sin revelar clientes):
- Soportes estructurales para carrocería automotriz
- Refuerzos de puerta y pilar
- Brackets y herrajes para electrodomésticos (lavadora, refrigerador)
- Placas base y tapas metálicas

---

## 6. Roles y Responsabilidades del Equipo

| Rol                     | Responsabilidades clave                                           |
|-------------------------|-------------------------------------------------------------------|
| **Operador**            | Registra producción, reporta paros, mide piezas en línea          |
| **Supervisor de Turno** | Monitorea OEE en tiempo real, autoriza paros, asigna prioridades  |
| **Gerente de Producción**| Analiza tendencias, toma decisiones de programación semanal       |
| **Jefe de Mantenimiento**| Atiende alertas, programa PM, actualiza histórico de fallas       |
| **Calidad**             | Analiza scrap, libera material, gestiona no conformidades (NCR)   |
| **Planeación**          | Genera programa semanal de producción, gestiona cambios de dado    |

La supervisora actual en el sistema es **Patricia Díaz**.

---

## 7. Proceso de Escalamiento y Alertas

El sistema MES genera alertas automáticas cuando:
1. El OEE cae por debajo del umbral de alerta (configurable, por defecto 70%)
2. El scrap rate supera el umbral (configurable, por defecto 8%)
3. El tiempo muerto acumulado supera un límite por turno

### Protocolo de respuesta
- **Alerta amarilla (OEE 70–82%):** Supervisor notificado en dashboard. Registra causa.
- **Alerta naranja (OEE 50–69%):** Supervisor notifica a Gerente de Producción. Plan de acción en 30 min.
- **Alerta roja (OEE < 50%):** Escalamiento inmediato. Convocatoria a Mantenimiento + Gerente.

---

## 8. Sistema MES — Módulos Disponibles

El sistema H2 Stamping MES tiene los siguientes módulos:

| Módulo        | Función                                                        |
|---------------|----------------------------------------------------------------|
| **Dashboard** | Vista general: OEE del día, gráfica histórica, alertas activas |
| **Prensas**   | Estado en tiempo real de cada prensa, paros activos, OEE/turno |
| **Chat IA**   | Este asistente — consultas en lenguaje natural sobre producción |
| **Alertas**   | Historial de alertas generadas, estado (activa/resuelta)       |
| **Reportes**  | Tabla comparativa por prensa y semana, exportación a Excel      |
| **Admin**     | Configuración de prensas, umbrales, usuarios del sistema       |

---

## 9. Contexto de Mejora Continua

H2 Stamping aplica metodologías de manufactura esbelta:
- **Kaizen:** Eventos de mejora continua mensuales por área
- **5S:** Estándar en toda la planta; auditorías semanales
- **SMED:** Proyecto activo para reducir tiempo de cambio de dado a < 30 min
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

| Término          | Definición                                                                    |
|------------------|-------------------------------------------------------------------------------|
| OEE              | Overall Equipment Effectiveness — eficiencia general del equipo               |
| Disponibilidad   | Porcentaje del tiempo planeado en que la prensa está operativa                |
| Scrap / NOK      | Pieza defectuosa que no cumple especificaciones de calidad                    |
| Tiempo muerto    | Minutos en que la prensa está parada de forma no planeada                    |
| Troquel / Dado   | Herramienta de corte y formado específica para cada número de parte           |
| Blank / Lámina   | Material de entrada (hoja metálica cortada) que se alimenta a la prensa       |
| Setup / SMED     | Tiempo de cambio de dado entre dos números de parte diferentes                |
| Turno            | Jornada de 8 horas; hay 3 turnos por día operativo                           |
| NP               | Número de parte — identificador único de cada producto                        |
| PM               | Mantenimiento Preventivo — servicio programado al equipo                      |
| NCR              | Non-Conformance Report — reporte de no conformidad de calidad                 |
| IATF 16949       | Estándar de gestión de calidad para la industria automotriz                   |
