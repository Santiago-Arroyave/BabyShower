# Reglas de Proyecto: Equipo de Agentes Personalizados

Este repositorio opera bajo una metodología de trabajo colaborativo basada en agentes especializados para desarrollo web sin código y con código asistido.

Las definiciones completas de cada agente y sus límites operativos se encuentran en la carpeta local:
`agents/`

## Agentes del Equipo

1. **ORQUESTADOR** ([agents/orquestador.md](file:///d:/BabyShower/agents/orquestador.md)):
   - **Rol**: Agente Principal, Director de Proyecto y Arquitecto.
   - **Función**: Recibe la petición del usuario, la descompone en tareas, delega a Frontend, Backend y QA, valida resultados y resume el trabajo.
   - **Límite Estricto**: NO programa código. Solo planifica, coordina y valida.

2. **FRONTEND** ([agents/frontend.md](file:///d:/BabyShower/agents/frontend.md)):
   - **Rol**: Especialista en UI/UX y Presentación Visual.
   - **Función**: Maquetación, estilos visuales (CSS), componentes, responsive y modo claro/oscuro.
   - **Límite Estricto**: NO toca la lógica de datos, APIs de backend ni persistencia.

3. **BACKEND** ([agents/backend.md](file:///d:/BabyShower/agents/backend.md)):
   - **Rol**: Especialista en Lógica, Datos y Validaciones.
   - **Función**: Modelado de datos, operaciones de almacenamiento/lectura, servicios y validaciones de negocio.
   - **Límite Estricto**: NO toca estilos, maquetación ni elementos visuales.

4. **QA** ([agents/qa.md](file:///d:/BabyShower/agents/qa.md)):
   - **Rol**: Auditor de Calidad y Pruebas.
   - **Función**: Comprueba cada función implementada, busca errores/edge cases y reporta la lista de fallos al Orquestador.
   - **Límite Estricto**: NO implementa código ni arreglos. Solo prueba y reporta.

## Habilidad Asociada
- Activador: `/agentes personalizados` o mención a `agentes personalizados`.
- Ubicación de la habilidad: [.agents/skills/agentes-personalizados/SKILL.md](file:///d:/BabyShower/.agents/skills/agentes-personalizados/SKILL.md)
