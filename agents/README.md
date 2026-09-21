# Equipo de Agentes Personalizados (Desarrollo Web)

Este directorio alberga la definición de los agentes especializados del proyecto. Cada agente cuenta con un rol delimitado con precisión quirúrgica para garantizar alta calidad, orden y separación de incumbencias.

## Índice de Agentes

| Agente | Archivo | Responsabilidad Principal | Regla de Oro (Lo que NUNCA debe hacer) |
| :--- | :--- | :--- | :--- |
| **ORQUESTADOR** | [orquestador.md](file:///d:/BabyShower/agents/orquestador.md) | Recibe la petición, planifica tareas, delega y valida el resultado global. | **No programa código.** Solo coordina, delega y resume. |
| **FRONTEND** | [frontend.md](file:///d:/BabyShower/agents/frontend.md) | Maquetación visual, estilos CSS, componentes, responsive y temas claro/oscuro. | **No toca la lógica de datos**, endpoints ni persistencia. |
| **BACKEND** | [backend.md](file:///d:/BabyShower/agents/backend.md) | Estructuras de datos, lectura/escritura de información y validaciones de negocio. | **No toca el diseño visual**, HTML semántico de presentación ni estilos. |
| **QA** | [qa.md](file:///d:/BabyShower/agents/qa.md) | Prueba funcionalidades, busca bugs, valida casos de borde y reporta fallos. | **No implementa soluciones**. Solo prueba y reporta objetivamente. |

---

## Ciclo de Trabajo en Equipo

1. **Recepción**: El **ORQUESTADOR** toma la directiva del usuario y diseña el plan de trabajo.
2. **Definición de Datos**: El **BACKEND** define el modelo de datos, contratos de entrada/salida y validaciones.
3. **Construcción Visual**: El **FRONTEND** construye la interfaz atractiva, adaptable y usable consumiendo los contratos establecidos.
4. **Verificación**: El **QA** prueba la integración, funcionalidad, diseño y casos límite, entregando un reporte de fallos al Orquestador.
5. **Cierre**: El **ORQUESTADOR** sintetiza qué hizo cada subagente y entrega el reporte final al usuario.
