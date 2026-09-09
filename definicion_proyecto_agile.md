# GastronomIA: Trabajo Práctico - Desarrollo de Sistemas
**Definición del Proyecto y Metodología Ágil (Grupo de 5 integrantes)**

## 1. Dominio del Sistema y Funcionalidad de IA

**Dominio del Sistema:**
GastronomIA es una plataforma y asistente gastronómico inteligente enfocado en la Ciudad Autónoma de Buenos Aires (CABA) y el Gran Buenos Aires (GBA). Su objetivo principal es facilitar la búsqueda, el descubrimiento y la recomendación de establecimientos gastronómicos (restaurantes, bares, cafeterías, etc.) mediante un sistema robusto de filtros (por barrio, tipo de cocina, opciones sin TACC, veganas, vegetarianas) y geolocalización en mapas. El sistema administrará una extensa base de datos de locales para proveer información actualizada y precisa a los usuarios.

**Funcionalidad de IA Integrada:**
La funcionalidad *core* de Inteligencia Artificial consistirá en un **Agente Conversacional Especializado (LLM Agent)** conectado en tiempo real a la base de datos del sistema (aplicando el patrón RAG - Retrieval-Augmented Generation). 
No será un agregado decorativo o un simple bot de respuestas prearmadas, sino el motor principal de interacción natural del sistema. El agente será capaz de interpretar intenciones complejas del usuario en lenguaje natural, transformarlas en consultas a la base de datos y formular respuestas útiles.

*Ejemplo de uso real:* Un usuario envía el mensaje *"Buscame un restaurante con opciones sin TACC por Palermo para ir a cenar, que tenga mesas afuera"*. La IA interpretará la solicitud, ejecutará filtros estructurados contra la base de datos (`barrio="Palermo"`, `sin_tacc=True`, `categoria="Restaurante"`, etc.) y responderá de forma conversacional ofreciendo las mejores opciones reales, indicando por qué coinciden con su búsqueda.

---

## 2. Elección e Implementación de la Metodología Ágil

Basado en la lectura de "Metodologías Ágiles y DevOps" y las características de este producto, la metodología elegida para encarar el desarrollo de GastronomIA es **Scrum**.

### Justificación de la elección de Scrum
- **Estructura y puntos de control:** Construir una API (Backend), un Frontend interactivo y sincronizar un modelo de IA con una base de datos geográfica es un esfuerzo multidisciplinario con un alcance razonablemente previsible pero técnicamente complejo. Scrum brinda un marco con ceremonias fijas (como la Sprint Review) que son ideales para mostrar avances tangibles (incrementos) y validar si el modelo de IA está respondiendo correctamente.
- **Equipos multidisciplinarios y tamaño ideal:** El proyecto requiere perfiles variados (datos, backend, frontend e inteligencia artificial). Scrum es ideal para nuestro grupo de 5 personas (estudiantes de la materia Desarrollo de Sistemas), ya que permite distribuir roles claros y coordinar el trabajo del TP con foco y compromiso en cada ciclo.

### Implementación en el equipo GastronomIA (5 integrantes)

**1. Roles del Equipo (Distribución de los 5 integrantes):**
* **Product Owner (PO) [1 integrante]:** Representará la voz de los usuarios y validará que el TP cumpla con los requisitos de la materia. Se encargará de priorizar el *Product Backlog*, decidiendo, por ejemplo, si en la primera iteración es más valioso tener el mapa funcionando o el chatbot de IA respondiendo preguntas básicas.
* **Scrum Master [1 integrante]:** Facilitará las reuniones del grupo, removerá obstáculos técnicos (como problemas de entorno o acceso a APIs) y asegurará que el equipo aplique correctamente la metodología ágil durante el desarrollo del trabajo.
* **Equipo de Desarrollo [3 integrantes]:** Serán los encargados de construir el producto de software. Se dividirán las tareas de estructurar la base de datos (CABA/GBA), programar el Backend/Frontend y configurar el especialista en IA.

**2. Flujo de Trabajo (Eventos/Ceremonias):**
* **Sprints (Ciclos de trabajo):** Trabajaremos con *Sprints* de 2 semanas. Esto nos da un plazo suficiente para completar funcionalidades complejas (como integrar un nuevo filtro de búsqueda) y es lo bastante corto para corregir el rumbo si la IA está dando recomendaciones incorrectas.
* **Sprint Planning:** Al iniciar el Sprint, estimaremos el esfuerzo usando *Planning Poker* (midiendo en *Story Points*). Tomaremos ítems del Product Backlog priorizados por el PO.
* **Daily Scrum:** Reunión diaria de 15 minutos. Crucial para que el desarrollador del Frontend, por ejemplo, le avise al del Backend si necesita un cambio en el endpoint `/api/search` o `/api/chat`.
* **Tablero Visual (Sprint Backlog):** Usaremos un tablero tipo Kanban (Por hacer, En proceso, Hecho) durante el sprint para dar visibilidad de qué está haciendo cada integrante en el día a día.
* **Sprint Review:** Al cierre de la quincena, le mostraremos al PO (o a clientes reales) el producto funcionando (el *Incremento*). Por ejemplo: probar en vivo cómo la IA recomienda bares veganos en San Telmo.
* **Retrospectiva:** Analizaremos internamente cómo mejorar. Ej: *"La integración con los datos del GBA nos llevó más tiempo del esperado, ¿cómo podemos mejorar la limpieza de datos en el próximo sprint?"*

**3. Artefactos y Prácticas Clave:**
* **Historias de Usuario:** El backlog se escribirá enfocándose en el valor. Ejemplo: *"Como persona vegetariana, quiero poder filtrar el mapa por locales con opciones exclusivas, para encontrar lugares seguros y rápidos para comer"*.
* **Definition of Done (Definición de Terminado):** Para que una historia se considere "Hecha", estableceremos que el código debe estar testeado, subido al repositorio principal sin romper la Integración Continua (práctica de DevOps que podríamos sumar) y, si involucra a la IA, que las respuestas hayan pasado un set de pruebas de precisión (que no recomiende locales que no existen).

---

## 3. Product Backlog Inicial

A continuación se presenta el Product Backlog inicial priorizado por el Product Owner, dividido en *Epics* (grandes agrupaciones de tareas) e Historias de Usuario (redactadas con formato ágil y criterios de aceptación).

### Epic 1: Infraestructura y Base de Datos (Prioridad Alta)
* **Historia 1.1:** *Como desarrollador, quiero tener la base de datos de locales de CABA y GBA importada y estructurada, para poder consumirla desde la API.*
  * **Criterios de Aceptación:** Base de datos poblada (SQLite/PostgreSQL), endpoints de consulta básicos funcionando (`/api/restaurant`), pruebas unitarias en verde.
* **Historia 1.2:** *Como usuario, quiero acceder a la plataforma web de GastronomIA, para poder interactuar con el sistema.*
  * **Criterios de Aceptación:** Repositorio Frontend/Backend unificado, estructura base levantada, servicio de backend accesible desde el frontend.

### Epic 2: Búsqueda y Filtros Básicos (Prioridad Media-Alta)
* **Historia 2.1:** *Como comensal, quiero poder filtrar restaurantes por barrio o municipio, para encontrar opciones en mi zona de interés.*
  * **Criterios de Aceptación:** El endpoint `/api/search` acepta el parámetro `barrio`, el frontend muestra un selector desplegable funcional para este fin.
* **Historia 2.2:** *Como persona con restricciones alimentarias, quiero filtrar locales que tengan opciones Sin TACC, Veganas o Vegetarianas, para asegurar que haya comida apta para mí.*
  * **Criterios de Aceptación:** Filtros booleanos implementados en UI y Backend. Los resultados excluyen estrictamente los locales que no cumplen con los *flags* seleccionados.
* **Historia 2.3:** *Como usuario, quiero ver los resultados en un mapa interactivo, para entender fácilmente su ubicación geográfica espacial.*
  * **Criterios de Aceptación:** Mapa renderizado en la vista principal, pines ubicados correctamente en las coordenadas (`lat`, `lon`) devueltas por la API.

### Epic 3: Agente Conversacional IA (Prioridad Media)
* **Historia 3.1:** *Como usuario, quiero tener una ventana de chat interactiva, para ingresar mis consultas y solicitudes en lenguaje natural.*
  * **Criterios de Aceptación:** Componente de chat integrado en el frontend, endpoint `/api/chat` procesando peticiones POST y devolviendo respuestas.
* **Historia 3.2:** *Como usuario, quiero que la IA me recomiende lugares reales cruzando mi texto con la base de datos, para no tener que usar los filtros de forma manual.*
  * **Criterios de Aceptación:** El LLM interpreta la intención del texto, interactúa con los filtros reales del backend (RAG/Tool calling), y responde con 2 o 3 opciones verdaderas. Se valida rigurosamente que la IA no invente nombres de locales ("alucinaciones").

### Epic 4: Análisis y Estadísticas (Prioridad Baja)
* **Historia 4.1:** *Como analista o administrador del sistema, quiero ver estadísticas generales de los locales, para entender la distribución gastronómica de CABA y GBA.*
  * **Criterios de Aceptación:** Endpoint `/api/stats` retorna métricas de conteo global, el frontend despliega la información mediante gráficos o tarjetas de resumen.
