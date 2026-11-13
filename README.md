# ✈️ Bienvenido a ATCFPL

**ATCFPL** es un proyecto académico enfocado en el desarrollo de una plataforma web para la gestión, consulta y seguimiento de planes de vuelo.

El proyecto se desarrolla de manera incremental mediante la metodología **Scrum**, organizando las actividades en Sprints que permiten incorporar progresivamente nuevas funcionalidades, mejorar la interfaz web, administrar información aeronáutica y desarrollar herramientas de simulación para el seguimiento de vuelos.

## 📂 Contenido del repositorio

- `sprint-1` — Documentación del primer Sprint.
- `sprint-2` — Documentación y retrospectiva del segundo Sprint.
- `sprint-3` — Desarrollo de módulos, administración de usuarios y consultas aeronáuticas.
- `sprint-4` — Actualización de MongoDB Atlas, mejoras de conectividad y propuestas de integración del formulario FPL.
- `sprint-5` — Desarrollo y mejoras del formulario FPL, integración de información aeronáutica, ajustes de validación y actualización de funcionalidades de la interfaz.
- `sprint-6` — Integración del módulo de mensajería ATS (FPL, CPL, ABI, CLN, CHG y otros), incorporación de plantillas, vista previa de mensajes y desarrollo de un simulador TCP para pruebas de comunicación en un entorno controlado.
- `sprint-7` — Avances en el desarrollo del Dashboard para el seguimiento de planes de vuelo, clasificación por estados operativos (UNCOORDINATED, PREACTIVE, DEPARTURE y ARRIVE), monitoreo de tiempos estimados de llegada, captura manual del EET, integración de mapas interactivos con Leaflet y mejoras en los simuladores de vuelos y consultas a MongoDB.
- `atcfpl_code` — Código fuente del proyecto.

## 🚀 Avances del Sprint 7

Durante el séptimo Sprint se continúa trabajando en las funcionalidades de seguimiento y visualización de planes de vuelo dentro de la plataforma ATCFPL.

Los principales avances en desarrollo son:

- **Dashboard:** organización y visualización de planes de vuelo mediante diferentes estados operativos.
- **Monitoreo de llegadas:** clasificación de vuelos de acuerdo con el tiempo restante para su llegada, incluyendo intervalos de 10 y 20 minutos, vuelos con mayor tiempo disponible y vuelos retrasados.
- **Captura de EET:** ingreso manual del tiempo estimado de vuelo en formato HHMM, permitiendo que el usuario proporcione directamente esta información.
- **Simulación de vuelos:** desarrollo y ajustes de herramientas para simular movimientos de salida y llegada.
- **Mapas interactivos:** integración de Leaflet para representar geográficamente vuelos y apoyar su seguimiento visual.
- **Base de datos:** mejoras en las consultas, actualización y recuperación de información de planes de vuelo almacenados en MongoDB.

Estas funcionalidades forman parte del desarrollo incremental del sistema y continúan sujetas a pruebas, ajustes y validaciones.

## 🛠️ Tecnologías

**Vue.js · Vite · Node.js · Express · MongoDB · MongoDB Atlas · Render · TCP/IP · Leaflet · JavaScript**

## 🌐 Plataforma web

- **Frontend:** https://atcfpl-frontend.onrender.com
- **Backend:** https://atc-fpl.onrender.com

> **Nota:** ATCFPL es un prototipo académico en desarrollo. Las funcionalidades de seguimiento, simulación y mensajería ATS se implementan y prueban en un entorno controlado. El sistema no mantiene conexión operativa ni transmite información hacia sistemas ATC reales.
