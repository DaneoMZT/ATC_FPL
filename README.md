# ATCFPL — Desarrollo del Proyecto y Retrospectivas (Sprints 1, 2 y 3)

Este repositorio contiene el desarrollo y la documentación de los avances del proyecto **ATCFPL (Air Traffic Control Flight Plan)**, realizado como parte de la materia **Proyecto VII** de la Universidad de Guadalajara.

ATCFPL tiene como propósito desarrollar una plataforma web que permita centralizar la información aeronáutica y facilitar la consulta, organización y futura gestión de planes de vuelo dentro de un entorno de control de tránsito aéreo.

El proyecto se desarrolla utilizando la metodología **Scrum**, mediante Sprints que permiten implementar, evaluar y mejorar progresivamente las funcionalidades del sistema.

## Tecnologías utilizadas

- **Frontend:** Vue.js y Vite.
- **Backend:** Node.js y Express.
- **Base de datos:** MongoDB.
- **Control de versiones:** Git y GitHub.
- **Hosting:** Render.
- **Base de datos en la nube:** MongoDB Atlas.
- **Arquitectura:** Aplicación web con API REST.

---

## Sprint 1 — Planeación y análisis inicial

Durante el primer Sprint se establecieron las bases del proyecto, identificando las necesidades del sistema y definiendo los principales objetivos de desarrollo.

### Actividades realizadas

- Identificación de las necesidades del proyecto.
- Definición del objetivo general de ATCFPL.
- Análisis de los requerimientos iniciales.
- Selección de las tecnologías de desarrollo.
- Organización de actividades mediante Scrum.
- Planeación de los primeros módulos del sistema.

### Resultados

Se estableció una propuesta de desarrollo para ATCFPL, definiendo su alcance inicial, las herramientas tecnológicas y las actividades necesarias para comenzar la implementación.

---

## Sprint 2 — Base de datos y estructura inicial

### Objetivo

Diseñar e implementar la estructura inicial de la base de datos y desarrollar los primeros componentes de la interfaz web de ATCFPL.

### Actividades realizadas

- Creación y organización inicial de la base de datos `atc_database` en MongoDB.
- Importación de información aeronáutica.
- Desarrollo de la estructura inicial con Vue.js y Vite.
- Creación de componentes para la navegación.
- Implementación inicial del backend con Node.js y Express.
- Desarrollo de las primeras rutas de consulta mediante API REST.
- Pruebas de integración entre frontend, backend y MongoDB.

### Resultados

Al finalizar el Sprint 2 se obtuvo una primera estructura funcional de ATCFPL, integrada por una base de datos, un servidor backend y una interfaz web.

El Sprint 2 fue planeado con **13 Story Points**, relacionados principalmente con la implementación inicial de la base de datos y el diseño de la interfaz.

### Retrospectiva

Durante este Sprint se comprobó la comunicación entre Vue.js, Node.js/Express y MongoDB.

También se presentaron dificultades relacionadas con la organización de componentes, la configuración del servidor y la ejecución del entorno de desarrollo.

Estas experiencias permitieron reconocer la importancia de realizar pruebas progresivas, documentar las configuraciones y mantener una estructura organizada del código.

---

## Sprint 3 — Integración, despliegue y prototipo funcional

### Objetivo

Continuar con el desarrollo de ATCFPL mediante la integración de sus componentes principales y la publicación de un prototipo web accesible a través de Internet.

Durante este Sprint se buscó avanzar de un entorno de desarrollo local hacia una plataforma alojada en servicios en la nube, que permita comprobar el funcionamiento general del sistema y facilitar las pruebas posteriores.

### Actividades realizadas

**1. Integración de la aplicación**

- Continuación del desarrollo de la interfaz utilizando Vue.js.
- Organización de las vistas y componentes de navegación.
- Integración de consultas de información aeronáutica.
- Comunicación entre el frontend y el backend mediante API REST.
- Pruebas de funcionamiento de los módulos desarrollados.

**2. Implementación de servicios en la nube**

- Configuración del backend para su publicación en Render.
- Publicación del frontend mediante un servicio de hosting gratuito.
- Configuración de MongoDB Atlas para alojar la base de datos.
- Ajustes de conexión entre los servicios desplegados.
- Pruebas de acceso a la aplicación desde Internet.

**3. Pruebas y validaciones**

- Verificación de las conexiones entre frontend, backend y base de datos.
- Comprobación de las respuestas de la API.
- Revisión del funcionamiento de las vistas principales.
- Identificación y corrección de problemas de configuración.
- Validación inicial del prototipo publicado.

### Resultados del Sprint 3

Al finalizar el tercer Sprint, ATCFPL presentó un avance importante respecto a las etapas anteriores.

El sistema pasó de funcionar principalmente en un entorno local a contar con un **prototipo web publicado en Internet**, lo que permite acceder a la aplicación y realizar pruebas de sus funcionalidades implementadas.

Entre los resultados más importantes destacan:

- Publicación de la aplicación web en Render.
- Alojamiento de la base de datos en MongoDB Atlas.
- Integración de los servicios principales.
- Disponibilidad de vistas para consultar información aeronáutica.
- Mejor organización de la estructura del proyecto.
- Identificación de mejoras necesarias para las siguientes etapas.

### Enlaces del proyecto

**Repositorio de GitHub:**

https://github.com/DaneoMZT/ATC_FPL

**Aplicación web ATCFPL:**

https://atcfpl-frontend.onrender.com

**Backend / API:**

https://atc-fpl.onrender.com

Estos enlaces permiten consultar el desarrollo del proyecto y acceder al prototipo publicado.

### Dificultades encontradas

Uno de los principales retos del Sprint 3 fue realizar la transición del entorno local hacia los servicios en la nube.

Durante este proceso fue necesario revisar las configuraciones de conexión, las variables de entorno y la comunicación entre los diferentes componentes de la aplicación.

También se presentaron dificultades relacionadas con la publicación del frontend, la configuración del backend y el acceso a la base de datos alojada en MongoDB Atlas.

Estas situaciones requirieron realizar pruebas adicionales y revisar cuidadosamente los mensajes de error para identificar sus causas.

A pesar de estas dificultades, el equipo logró avanzar en la integración y publicación del prototipo.

### Retrospectiva del Sprint 3

La retrospectiva permitió evaluar tanto los avances técnicos como la manera en que se organizaron las actividades del equipo.

**¿Qué se hizo bien?**

Se consiguió integrar las tecnologías principales y publicar un prototipo funcional en Internet. Esto representó un avance importante porque permitió comprobar el comportamiento de ATCFPL fuera del entorno de desarrollo local.

También se mejoró la comprensión de la arquitectura del sistema y de la comunicación entre sus componentes.

**¿Qué dificultades se presentaron?**

La configuración de los servicios en la nube tomó más tiempo del previsto, principalmente por los ajustes necesarios para establecer correctamente las conexiones.

Asimismo, algunos errores requirieron revisar diferentes archivos y configuraciones antes de encontrar una solución.

**¿Qué podemos mejorar?**

Como equipo identificamos la necesidad de fortalecer la documentación técnica, mantener un mayor control de los cambios realizados y establecer pruebas más organizadas antes de publicar nuevas versiones.

También consideramos importante distribuir las actividades de manera que cada integrante pueda dar seguimiento a sus responsabilidades y comunicar oportunamente las dificultades encontradas.

**Acuerdos para el siguiente Sprint**

Continuar con el desarrollo de las funcionalidades pendientes, priorizar la estabilidad del prototipo y realizar pruebas que permitan identificar posibles problemas antes de incorporar nuevos módulos.

---

## Sprint 4 — Actividades propuestas

Para el siguiente Sprint se propone continuar con las siguientes actividades:

- Ampliar las funcionalidades de captura y gestión de planes de vuelo.
- Fortalecer las validaciones de información.
- Continuar el desarrollo de consultas aeronáuticas.
- Mejorar la administración de usuarios y permisos.
- Optimizar la interacción entre la interfaz y la base de datos.
- Realizar pruebas funcionales y corregir errores identificados.
- Mejorar la experiencia de usuario y la presentación de la información.

Estas actividades podrán ajustarse de acuerdo con los resultados de las pruebas y las prioridades definidas por el equipo.

---

## Conclusiones generales

A lo largo de los tres primeros Sprints, ATCFPL ha evolucionado desde una propuesta inicial hasta convertirse en un prototipo web con una arquitectura integrada y servicios alojados en la nube.

Durante el Sprint 1 se establecieron las bases del proyecto; en el Sprint 2 se desarrollaron los primeros componentes técnicos; y en el Sprint 3 se avanzó en la integración y publicación de la plataforma.

Uno de los aprendizajes más importantes ha sido comprender que el desarrollo de software no consiste únicamente en programar funcionalidades, sino también en resolver problemas de integración, realizar pruebas, documentar decisiones y adaptar la planeación a las dificultades que surgen.

Como equipo consideramos que los resultados obtenidos representan una base importante para continuar desarrollando ATCFPL.

Aunque todavía existen funcionalidades pendientes, los avances realizados permiten visualizar con mayor claridad el funcionamiento esperado del sistema y los retos técnicos de las siguientes etapas.

---

## Estado actual del proyecto

**Sprint completado:** 3

**Etapa:** Prototipo funcional en desarrollo.

**Metodología:** Scrum.

**Próxima etapa:** Sprint 4.

**Institución:** Universidad de Guadalajara.

**Materia:** Proyecto VII.

**Proyecto:** ATCFPL — Air Traffic Control Flight Plan.
