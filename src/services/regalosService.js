import { supabase } from '../supabaseClient.js';

/**
 * Normaliza nombres de invitados (elimina espacios extras y valida contenido).
 * @param {string} nombre 
 * @returns {string}
 */
const normalizarNombre = (nombre) => {
  if (typeof nombre !== 'string') return '';
  return nombre.trim().replace(/\s+/g, ' ');
};

/**
 * 1. Obtiene la lista de regalos disponibles (cupo_disponible > 0).
 * Diseñado para alimentar directamente la ruleta de regalos en el Frontend.
 * 
 * @returns {Promise<{
 *   success: boolean,
 *   data: Array<{ id: number|string, nombre: string, cupo_disponible: number, [key: string]: any }>,
 *   total: number,
 *   error: string | null
 * }>}
 */
export async function obtenerRegalosDisponibles() {
  try {
    // Consultar regalos e invitados en paralelo para garantizar stock reactivo en tiempo real
    const [{ data: regalos, error: errRegalos }, { data: invitados, error: errInvitados }] = await Promise.all([
      supabase.from('regalos').select('*').order('id', { ascending: true }),
      supabase.from('invitados').select('regalo_id')
    ]);

    if (errRegalos) {
      console.error('[regalosService.obtenerRegalosDisponibles] Error Supabase:', errRegalos);
      return {
        success: false,
        data: [],
        total: 0,
        error: errRegalos.message || 'Error al consultar los regalos disponibles en Supabase.',
      };
    }

    if (errInvitados) {
      console.warn('[regalosService.obtenerRegalosDisponibles] Advertencia al consultar invitados:', errInvitados);
    }

    // Contabilizar asignaciones confirmadas por cada regalo_id
    const reclamadosPorRegalo = {};
    if (Array.isArray(invitados)) {
      invitados.forEach((inv) => {
        if (inv?.regalo_id !== undefined && inv?.regalo_id !== null) {
          reclamadosPorRegalo[inv.regalo_id] = (reclamadosPorRegalo[inv.regalo_id] || 0) + 1;
        }
      });
    }

    // Sincronizar cupo_disponible real descontando las asignaciones confirmadas
    const listaNormalizada = (regalos || []).map((r) => {
      const reclamados = reclamadosPorRegalo[r.id] || 0;
      const cupoTotal = r.cupo_total !== undefined && r.cupo_total !== null
        ? Number(r.cupo_total)
        : (Number(r.cupo_disponible) || 1);
      const cupoBase = r.cupo_disponible !== undefined && r.cupo_disponible !== null
        ? Number(r.cupo_disponible)
        : cupoTotal;
      const cupoCalculado = Math.max(0, cupoTotal - reclamados);
      const cupoDisponible = Math.min(cupoBase, cupoCalculado);

      return {
        ...r,
        nombre: (r.nombre || '').trim(),
        cupo_total: cupoTotal,
        cupo_disponible: cupoDisponible,
      };
    });

    return {
      success: true,
      data: listaNormalizada,
      total: listaNormalizada.length,
      error: null,
    };
  } catch (err) {
    console.error('[regalosService.obtenerRegalosDisponibles] Excepción inesperada:', err);
    return {
      success: false,
      data: [],
      total: 0,
      error: err.message || 'Error de red o conexión al consultar regalos.',
    };
  }
}

/**
 * 2. Comprueba si un invitado ya se encuentra registrado en la tabla `invitados`
 * para impedir que gire la ruleta más de una vez.
 * 
 * @param {string} nombreInvitado - Nombre del invitado a validar.
 * @returns {Promise<{
 *   success: boolean,
 *   yaExiste: boolean,
 *   invitado: object | null,
 *   error: string | null
 * }>}
 */
export async function validarInvitadoPrevio(nombreInvitado) {
  const nombreLimpio = normalizarNombre(nombreInvitado);

  if (!nombreLimpio) {
    return {
      success: false,
      yaExiste: false,
      invitado: null,
      error: 'Por favor ingresa un nombre válido para continuar.',
    };
  }

  try {
    // Búsqueda insensible a mayúsculas/minúsculas para evitar evasiones como "Juan" vs "juan"
    const { data, error } = await supabase
      .from('invitados')
      .select('*')
      .ilike('nombre', nombreLimpio)
      .limit(1);

    if (error) {
      console.error('[regalosService.validarInvitadoPrevio] Error Supabase:', error);
      return {
        success: false,
        yaExiste: false,
        invitado: null,
        error: error.message || 'Error al verificar el registro del invitado en la base de datos.',
      };
    }

    const existe = Boolean(data && data.length > 0);
    const invitado = existe ? data[0] : null;

    return {
      success: true,
      yaExiste: existe,
      invitado,
      error: null,
    };
  } catch (err) {
    console.error('[regalosService.validarInvitadoPrevio] Excepción inesperada:', err);
    return {
      success: false,
      yaExiste: false,
      invitado: null,
      error: err.message || 'Error de red al comprobar registro previo del invitado.',
    };
  }
}

/**
 * 3. Asigna de forma atómica un regalo a un invitado ejecutando la RPC `reclamar_regalo(p_nombre, p_regalo_id)`.
 * Garantiza que no se sobrepasen los cupos en entornos con múltiples usuarios concurrentes.
 * 
 * @param {string} nombreInvitado - Nombre del invitado.
 * @param {number|string} regaloId - ID del regalo asignado por la ruleta.
 * @returns {Promise<{
 *   success: boolean,
 *   cupoAgotado?: boolean,
 *   data: any,
 *   mensaje: string,
 *   error: string | null
 * }>}
 */
export async function asignarRegalo(nombreInvitado, regaloId) {
  const nombreLimpio = normalizarNombre(nombreInvitado);

  if (!nombreLimpio) {
    return {
      success: false,
      cupoAgotado: false,
      data: null,
      mensaje: '',
      error: 'El nombre del invitado es obligatorio.',
    };
  }

  if (regaloId === undefined || regaloId === null || regaloId === '') {
    return {
      success: false,
      cupoAgotado: false,
      data: null,
      mensaje: '',
      error: 'El identificador del regalo es obligatorio.',
    };
  }

  try {
    // Ejecución de la función RPC atómica configurada en Supabase
    const { data, error } = await supabase.rpc('reclamar_regalo', {
      p_nombre: nombreLimpio,
      p_regalo_id: regaloId,
    });

    if (error) {
      console.error('[regalosService.asignarRegalo] Error RPC:', error);
      const errMsg = (error.message || '').toLowerCase();

      // Detección de error de cupo agotado disparado por RAISE EXCEPTION en Postgres
      if (
        errMsg.includes('cupo') ||
        errMsg.includes('agotado') ||
        errMsg.includes('stock') ||
        errMsg.includes('disponible')
      ) {
        return {
          success: false,
          cupoAgotado: true,
          data: null,
          mensaje: 'El cupo de este regalo se ha agotado. Por favor, vuelve a girar la ruleta.',
          error: 'Cupo agotado',
        };
      }

      // Detección de duplicado si el invitado ya reclamó un regalo
      if (
        errMsg.includes('ya reclamó') ||
        errMsg.includes('ya existe') ||
        errMsg.includes('duplicado') ||
        errMsg.includes('unique constraint') ||
        errMsg.includes('invitados_nombre_key')
      ) {
        return {
          success: false,
          cupoAgotado: false,
          data: null,
          mensaje: 'Este invitado ya ha reclamado un regalo anteriormente.',
          error: 'Invitado duplicado',
        };
      }

      return {
        success: false,
        cupoAgotado: false,
        data: null,
        mensaje: '',
        error: error.message || 'Error al ejecutar la asignación del regalo.',
      };
    }

    // Si la función RPC retorna un objeto JSON estructurado con status de éxito o fracaso
    if (data && typeof data === 'object') {
      if (data.success === false || data.status === 'error') {
        const esAgotado = Boolean(
          data.cupoAgotado ||
          (data.mensaje && /cupo|agotado/i.test(data.mensaje)) ||
          (data.error && /cupo|agotado/i.test(data.error))
        );

        return {
          success: false,
          cupoAgotado: esAgotado,
          data,
          mensaje: data.mensaje || (esAgotado ? 'Cupo agotado para este regalo.' : 'No fue posible asignar el regalo.'),
          error: data.error || (esAgotado ? 'Cupo agotado' : 'Asignación no completada'),
        };
      }
    }

    // Si la función RPC retorna un booleano false
    if (data === false) {
      return {
        success: false,
        cupoAgotado: true,
        data: false,
        mensaje: 'El cupo para este regalo ya no se encuentra disponible.',
        error: 'Cupo agotado',
      };
    }

    // Asignación exitosa
    return {
      success: true,
      cupoAgotado: false,
      data,
      mensaje: '¡Regalo asignado con éxito!',
      error: null,
    };
  } catch (err) {
    console.error('[regalosService.asignarRegalo] Excepción inesperada:', err);
    return {
      success: false,
      cupoAgotado: false,
      data: null,
      mensaje: '',
      error: err.message || 'Error de conexión o fallo imprevisto al asignar el regalo.',
    };
  }
}

/**
 * Consulta todos los regalos registrados en la base de datos (con o sin cupo disponible).
 * Útil para paneles de control, catálogo general y auditorías de QA.
 * 
 * @returns {Promise<{
 *   success: boolean,
 *   data: Array<any>,
 *   total: number,
 *   error: string | null
 * }>}
 */
export async function obtenerTodosLosRegalos() {
  return await obtenerRegalosDisponibles();
}

/**
 * Consulta la lista de invitados que ya han reclamado su regalo.
 * Útil para vistas administrativas o validaciones en QA.
 * 
 * @returns {Promise<{
 *   success: boolean,
 *   data: Array<any>,
 *   total: number,
 *   error: string | null
 * }>}
 */
export async function obtenerListaInvitados() {
  try {
    const { data, error } = await supabase
      .from('invitados')
      .select('*, regalos(nombre)')
      .order('id', { ascending: false });

    if (error) {
      console.error('[regalosService.obtenerListaInvitados] Error Supabase:', error);
      return {
        success: false,
        data: [],
        total: 0,
        error: error.message || 'Error al consultar la lista de invitados.',
      };
    }

    return {
      success: true,
      data: data || [],
      total: (data || []).length,
      error: null,
    };
  } catch (err) {
    console.error('[regalosService.obtenerListaInvitados] Excepción:', err);
    return {
      success: false,
      data: [],
      total: 0,
      error: err.message || 'Error de conexión al obtener invitados.',
    };
  }
}

/**
 * 4. Consulta el historial de asignaciones de regalos para mostrar en una tabla del Frontend.
 * Realiza un SELECT a la tabla `invitados` con JOIN a `regalos`:
 * - Campos solicitados: `nombre`, `fecha` (de la tabla invitados) y `regalos(nombre)`.
 * - Ordenado por `fecha` de forma descendente (los más recientes primero).
 * 
 * Retorna un arreglo limpio directamente mapeable en el frontend:
 * [
 *   {
 *     nombre: "María López",
 *     regalo: "Coche Baby Boss Ultra",
 *     fecha: "2026-09-19T20:45:00Z",
 *     fechaFormateada: "19/09/2026, 20:45",
 *     regalos: { nombre: "Coche Baby Boss Ultra" }
 *   },
 *   ...
 * ]
 * 
 * @returns {Promise<Array<{
 *   nombre: string,
 *   regalo: string,
 *   fecha: string | null,
 *   fechaFormateada: string,
 *   regalos: { nombre: string } | null
 * }>>}
 */
export async function obtenerHistorialInvitados() {
  try {
    let { data, error } = await supabase
      .from('invitados')
      .select('nombre, fecha, regalos(nombre)')
      .order('fecha', { ascending: false });

    // Respaldo defensivo si la columna fue nombrada fecha_registro
    if (error && (error.message?.includes('fecha') || error.code === '42703')) {
      const fallback = await supabase
        .from('invitados')
        .select('nombre, fecha_registro, regalos(nombre)')
        .order('fecha_registro', { ascending: false });

      if (!fallback.error) {
        data = fallback.data;
        error = null;
      }
    }

    if (error) {
      console.error('[regalosService.obtenerHistorialInvitados] Error Supabase:', error);
      const resError = [];
      resError.success = false;
      resError.data = [];
      resError.error = error.message || 'Error al consultar el historial de invitados.';
      return resError;
    }

    // Arreglo limpio y normalizado listo para mapear directamente en tablas frontend
    const historialLimpio = (data || []).map((item) => {
      const nombreRegalo = Array.isArray(item.regalos)
        ? (item.regalos[0]?.nombre || 'Sin regalo asignado')
        : (item.regalos?.nombre || 'Sin regalo asignado');

      const fechaRaw = item.fecha || item.fecha_registro || null;
      let fechaFormateada = '';

      if (fechaRaw) {
        try {
          const dateObj = new Date(fechaRaw);
          if (!isNaN(dateObj.getTime())) {
            fechaFormateada = dateObj.toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
          }
        } catch {
          fechaFormateada = String(fechaRaw);
        }
      }

      return {
        nombre: item.nombre || 'Invitado anónimo',
        regalo: nombreRegalo,
        fecha: fechaRaw,
        fechaFormateada,
        regalos: item.regalos || { nombre: nombreRegalo },
      };
    });

    // Compatibilidad dual: usable como arreglo directo `array.map()` o como `{ data, success }`
    historialLimpio.success = true;
    historialLimpio.data = historialLimpio;
    historialLimpio.error = null;

    return historialLimpio;
  } catch (err) {
    console.error('[regalosService.obtenerHistorialInvitados] Excepción:', err);
    const resCatch = [];
    resCatch.success = false;
    resCatch.data = [];
    resCatch.error = err.message || 'Error de conexión al obtener el historial de invitados.';
    return resCatch;
  }
}

/**
 * Verifica la conectividad básica con la instancia de Supabase.
 * Permite al Frontend y a QA diagnosticar si las credenciales y la red están operativas.
 * 
 * @returns {Promise<{ conectividad: boolean, mensaje: string }>}
 */
export async function verificarConexion() {
  try {
    const { error } = await supabase.from('regalos').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      return {
        conectividad: false,
        mensaje: `Error al conectar con Supabase: ${error.message}`,
      };
    }
    return {
      conectividad: true,
      mensaje: 'Conexión exitosa con el servicio de Supabase.',
    };
  } catch (err) {
    return {
      conectividad: false,
      mensaje: `Fallo de conexión: ${err.message}`,
    };
  }
}

export default {
  obtenerRegalosDisponibles,
  asignarRegalo,
  validarInvitadoPrevio,
  obtenerHistorialInvitados,
  obtenerTodosLosRegalos,
  obtenerListaInvitados,
  verificarConexion,
};

