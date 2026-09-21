import { supabaseUrl, supabaseAnonKey, supabase } from './src/supabaseClient.js';
import {
  obtenerRegalosDisponibles,
  validarInvitadoPrevio,
  asignarRegalo,
  obtenerHistorialInvitados,
  obtenerTodosLosRegalos,
  obtenerListaInvitados,
  verificarConexion,
} from './src/services/regalosService.js';

async function runTests() {
  console.log('--- TEST 1: Verificar Cliente Supabase ---');
  console.log('Supabase URL:', supabaseUrl);
  console.log('Cliente instanciado correctamente:', typeof supabase?.from === 'function');
  if (supabaseUrl !== 'https://nbdttpplnlxmnsgatslk.supabase.co') {
    throw new Error('URL de Supabase no coincide');
  }

  console.log('\n--- TEST 2: Validar función validarInvitadoPrevio con entradas inválidas ---');
  const resNombreVacio = await validarInvitadoPrevio('');
  console.log('Resultado nombre vacío:', resNombreVacio);
  if (resNombreVacio.success !== false || !resNombreVacio.error) {
    throw new Error('Fallo en validación de nombre vacío');
  }

  const resNombreEspacios = await validarInvitadoPrevio('    ');
  console.log('Resultado solo espacios:', resNombreEspacios);
  if (resNombreEspacios.success !== false) {
    throw new Error('Fallo en validación de nombre solo espacios');
  }

  console.log('\n--- TEST 3: Validar función asignarRegalo con parámetros faltantes ---');
  const resAsignarSinNombre = await asignarRegalo('', 1);
  console.log('Resultado sin nombre:', resAsignarSinNombre);
  if (resAsignarSinNombre.success !== false || resAsignarSinNombre.cupoAgotado !== false) {
    throw new Error('Fallo en validación de asignarRegalo sin nombre');
  }

  const resAsignarSinId = await asignarRegalo('Carlos Pérez', null);
  console.log('Resultado sin regaloId:', resAsignarSinId);
  if (resAsignarSinId.success !== false) {
    throw new Error('Fallo en validación de asignarRegalo sin ID');
  }

  console.log('\n--- TEST 4: Exportaciones y contratos de funciones ---');
  const funciones = [
    obtenerRegalosDisponibles,
    validarInvitadoPrevio,
    asignarRegalo,
    obtenerHistorialInvitados,
    obtenerTodosLosRegalos,
    obtenerListaInvitados,
    verificarConexion,
  ];

  funciones.forEach((fn) => {
    if (typeof fn !== 'function') {
      throw new Error(`La exportación ${fn.name} no es una función.`);
    }
    console.log(`Función ${fn.name}: OK`);
  });

  console.log('\n✅ Todos los tests unitarios pasaron exitosamente.');
}

runTests().catch((err) => {
  console.error('❌ Error en los tests:', err);
  process.exit(1);
});
