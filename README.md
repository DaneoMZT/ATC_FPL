# ✈️ Bienvenido a ATCFPL

**ATCFPL (Air Traffic Control Flight Plan System)** es un proyecto académico enfocado en el desarrollo de una plataforma web para la gestión, consulta y seguimiento de planes de vuelo.

El proyecto se desarrolla mediante la metodología **Scrum**, organizando las actividades en Sprints que permiten incorporar funcionalidades, evaluar los avances y realizar mejoras continuas.

## 📂 Contenido del repositorio

- `sprint-1` — Documentación y planificación inicial del proyecto.
- `sprint-2` — Desarrollo y retrospectiva del segundo Sprint.
- `sprint-3` — Administración de usuarios, roles y consultas aeronáuticas.
- `sprint-4` — Integración de MongoDB Atlas y avances del formulario FPL.
- `sprint-5` — Mejoras del formulario FPL, validaciones y vista previa de mensajes.
- `sprint-6` — Desarrollo del módulo de mensajería ATS y simulador TCP/IP para pruebas locales.
- `sprint-7` — Avances del Dashboard, seguimiento de llegadas, captura manual del EET, simulación de vuelos e integración de mapas Leaflet.
- `sprint-review-unidad-3` — Reporte de resultados, revisión de los incrementos, conclusiones, acuerdos y propuestas de actualización del Product Backlog.
- `atcfpl_code` — Código fuente del proyecto.

## 📋 Sprint Review – Unidad 3

Durante la Unidad 3 realizamos una revisión de los avances documentados en los **Sprints 3 al 7**, con el propósito de identificar los resultados obtenidos, reconocer las dificultades presentadas y establecer las actividades que debemos atender para continuar mejorando ATCFPL.

Esta revisión nos permitió analizar el desarrollo del proyecto de manera general, considerando tanto las funcionalidades implementadas como aquellas que todavía requieren pruebas y ajustes.

### 🚀 Resultados del desarrollo

Entre los principales resultados identificados se encuentran:

- **Administración de usuarios:** implementación de cuentas y roles ROOT, ADMIN y USER.
- **Consultas aeronáuticas:** integración de rutas, puntos característicos y procedimientos SID/STAR.
- **Planes de vuelo:** desarrollo del formulario FPL, incorporación de catálogos aeronáuticos y vista previa de mensajes.
- **Mensajería ATS:** desarrollo de un simulador TCP/IP para realizar pruebas de comunicación en un entorno controlado.
- **Dashboard:** clasificación de planes de vuelo mediante los estados UNCOORDINATED, PREACTIVE, DEPARTURE y ARRIVE.
- **Seguimiento de llegadas:** clasificación de vuelos según el tiempo restante para su ETA y detección de llegadas retrasadas.
- **Captura del EET:** ingreso manual del tiempo estimado de vuelo en formato HHMM.
- **Mapas interactivos:** representación ilustrativa de vuelos mediante Leaflet.
- **MongoDB:** avances en el almacenamiento, consulta y recuperación de información de planes de vuelo.

Los resultados muestran una evolución importante del prototipo, aunque algunas funcionalidades continúan en desarrollo y requieren validaciones adicionales.

### 🤝 Resultados y acuerdos de la revisión

Como equipo, identificamos que ATCFPL ha avanzado de manera significativa en la integración de sus diferentes módulos. Sin embargo, también reconocimos la necesidad de dedicar más tiempo a las pruebas para asegurar que la información se almacene correctamente y que las funcionalidades respondan de manera consistente.

Entre las decisiones documentadas se encuentra mantener la **captura manual del EET en formato HHMM**, en lugar de realizar su cálculo automático.

Asimismo, se plantearon las siguientes actividades para su revisión y confirmación:

- Comprobar la persistencia y recuperación de los planes de vuelo.
- Validar las restricciones de acceso de los usuarios por aeropuerto.
- Realizar pruebas de las transiciones de estados y tiempos UTC.
- Revisar el comportamiento de los mensajes ATS simulados.
- Registrar incidencias y actualizar las prioridades del Product Backlog.

Estas actividades permitirán concentrar los siguientes esfuerzos en mejorar la estabilidad y confiabilidad del sistema antes de incorporar nuevas funcionalidades.

### 📝 Conclusiones del Sprint Review

La revisión de la Unidad 3 nos permitió reconocer los avances logrados y comprender mejor los retos que implica desarrollar una aplicación web con diferentes tecnologías.

Durante los Sprints aprendimos que no basta con tener una interfaz funcional; también es necesario comprobar la comunicación entre el frontend, el backend y la base de datos.

Consideramos que la metodología Scrum nos ha ayudado a organizar el trabajo, revisar nuestros resultados y adaptar las actividades conforme aparecen nuevas necesidades.

Aunque ATCFPL todavía se encuentra en desarrollo, los avances obtenidos representan una base importante para continuar fortaleciendo el prototipo.

## 🛠️ Tecnologías

**Vue.js · Vite · Node.js · Express · MongoDB · MongoDB Atlas · Render · TCP/IP · Leaflet · JavaScript**

## 🌐 Plataforma web

- **Frontend:** https://atcfpl-frontend.onrender.com
- **Backend:** https://atc-fpl.onrender.com

## 🔗 Repositorio GitHub

https://github.com/DaneoMZT/ATC_FPL

> **Nota:** ATCFPL es un prototipo académico en desarrollo. Las funcionalidades de mensajería ATS, seguimiento y simulación de vuelos se realizan en un entorno controlado. No existe conexión operacional con sistemas reales de control de tránsito aéreo.
