import confetti from 'canvas-confetti';
import { supabase } from './supabaseClient.js';
import {
  obtenerRegalosDisponibles,
  validarInvitadoPrevio,
  asignarRegalo,
  verificarConexion,
  obtenerHistorialInvitados,
} from './services/regalosService.js';
import { RouletteCanvas } from './components/RouletteCanvas.js';
import { modalManager } from './components/ModalManager.js';
import { audioFx } from './components/AudioEffects.js';

class BabyBossApp {
  constructor() {
    this.guestName = '';
    this.gifts = [];
    this.historial = [];
    this.esSegundoGiro = false;
    this.isSpinning = false;
    this.roulette = null;
    this.isLiveSupabase = false;

    // Elementos del DOM
    this.canvas = document.getElementById('rouletteCanvas');
    this.inputGuest = document.getElementById('input-guest-name');
    this.btnConfirmGuest = document.getElementById('btn-confirm-guest');
    this.btnSpin = document.getElementById('btn-spin');
    this.inputFeedback = document.getElementById('input-feedback');
    this.activeGuestContainer = document.getElementById('active-guest-container');
    this.activeGuestNameSpan = document.getElementById('active-guest-name');
    this.btnChangeGuest = document.getElementById('btn-change-guest');
    this.spinStatusNote = document.getElementById('spin-status-note');
    this.inventoryDrawer = document.getElementById('inventory-list');
    this.inventoryCount = document.getElementById('inventory-count');
    this.connectionDot = document.getElementById('connection-dot');
    this.connectionText = document.getElementById('connection-text');
    this.btnSoundToggle = document.getElementById('btn-sound-toggle');

    // Elementos del Directorio de Asignaciones
    this.assignmentsTbody = document.getElementById('assignments-tbody');
    this.mobileAssignmentsList = document.getElementById('mobile-assignments-list');
    this.assignmentsCountBadge = document.getElementById('assignments-count-badge');
    this.assignmentsEmptyState = document.getElementById('assignments-empty-state');
    this.tableDesktopWrap = document.querySelector('.table-responsive-desktop');
  }

  async init() {
    this.initRoulette();
    this.setupEventListeners();
    await this.checkSupabaseHealth();
    await this.loadAvailableGifts();
    await this.loadHistorialInvitados();
    this.setupRealtimeSubscription();
  }

  initRoulette() {
    if (!this.canvas) return;
    this.roulette = new RouletteCanvas(this.canvas);
  }

  setupEventListeners() {
    // Audio toggle
    this.btnSoundToggle?.addEventListener('click', () => {
      const isMuted = audioFx.toggleMute();
      this.btnSoundToggle.innerHTML = isMuted ? '🔇' : '🔊';
      this.btnSoundToggle.title = isMuted ? 'Sonido Silenciado' : 'Sonido Activado';
    });

    // Validar nombre al escribir o presionar Enter
    this.inputGuest?.addEventListener('input', () => {
      this.clearFeedback();
    });

    this.inputGuest?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleConfirmGuest();
      }
    });

    this.btnConfirmGuest?.addEventListener('click', () => {
      this.handleConfirmGuest();
    });

    this.btnChangeGuest?.addEventListener('click', () => {
      this.resetGuestSession();
    });

    // Botón de Giro
    this.btnSpin?.addEventListener('click', () => {
      this.handleExecuteSpin();
    });

    // Toggle de la lista de regalos disponibles (drawer)
    const invHeader = document.getElementById('inventory-header');
    const invList = document.getElementById('inventory-list');
    invHeader?.addEventListener('click', () => {
      if (invList) {
        invList.style.display = invList.style.display === 'none' ? 'grid' : 'none';
      }
    });
  }

  async checkSupabaseHealth() {
    try {
      const status = await verificarConexion();
      if (status.conectividad) {
        this.isLiveSupabase = true;
        if (this.connectionDot) this.connectionDot.className = 'connection-dot';
        if (this.connectionText) this.connectionText.textContent = 'Supabase Conectado';
      } else {
        this.isLiveSupabase = false;
        if (this.connectionDot) this.connectionDot.className = 'connection-dot warning';
        if (this.connectionText) this.connectionText.textContent = 'Supabase Desconectado';
      }
    } catch {
      this.isLiveSupabase = false;
      if (this.connectionDot) this.connectionDot.className = 'connection-dot warning';
      if (this.connectionText) this.connectionText.textContent = 'Sin Conexión BD';
    }
  }

  /**
   * Suscripción en tiempo real a Supabase (Postgres Changes)
   * Permite que la ruleta y el catálogo se sincronicen automáticamente
   * si otros invitados reclaman obsequios desde otros dispositivos.
   */
  setupRealtimeSubscription() {
    try {
      supabase
        .channel('db-live-sync-drawer')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'invitados' }, async () => {
          await this.loadAvailableGifts();
          await this.loadHistorialInvitados();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'regalos' }, async () => {
          await this.loadAvailableGifts();
        })
        .subscribe();
    } catch (err) {
      console.warn('[BabyBossApp] No fue posible inicializar Supabase Realtime:', err);
    }
  }

  /**
   * Carga los regalos activos consumiendo ÚNICA y EXCLUSIVAMENTE regalosService.obtenerRegalosDisponibles() desde Supabase
   */
  async loadAvailableGifts() {
    try {
      const res = await obtenerRegalosDisponibles();
      if (res.success && Array.isArray(res.data)) {
        this.gifts = res.data;
        this.isLiveSupabase = true;
        const totalDisponibles = this.gifts.reduce((sum, it) => sum + (Number(it.cupo_disponible) || 0), 0);
        if (this.connectionDot) this.connectionDot.className = 'connection-dot';
        if (this.connectionText) this.connectionText.textContent = `${totalDisponibles} Cupos Disponibles`;
      } else {
        console.error('[BabyBossApp] Error al consultar regalos disponibles de Supabase:', res.error);
        this.gifts = [];
        this.isLiveSupabase = false;
        if (this.connectionDot) this.connectionDot.className = 'connection-dot warning';
        if (this.connectionText) this.connectionText.textContent = 'Error Supabase';
        this.showFeedback('No se pudieron cargar regalos desde Supabase: ' + (res.error || 'Error de conexión'), 'error');
      }
    } catch (err) {
      console.error('[BabyBossApp] Excepción al obtener regalos disponibles:', err);
      this.gifts = [];
      this.isLiveSupabase = false;
    }

    // Normalizar datos de Supabase
    this.gifts = this.gifts.map((item) => ({
      ...item,
      permite_regiro: item.permite_regiro !== undefined ? Boolean(item.permite_regiro) : Boolean(item.es_mayor),
      icono_emoji: this.getGiftEmoji(item.nombre)
    }));

    this.roulette.setItems(this.gifts);
    this.renderInventoryDrawer();
  }

  /**
   * Renderiza el Catálogo de Activos Estratégicos con cálculo reactivo de cupos restantes
   * y badges de disponibilidad ("Quedan X disponibles" o "AGOTADO").
   */
  renderInventoryDrawer() {
    if (!this.inventoryDrawer) return;

    const totalCuposRestantes = this.gifts.reduce((acc, r) => acc + (Number(r.cupo_disponible) || 0), 0);
    const totalCuposIniciales = this.gifts.reduce((acc, r) => {
      const cupoInicial = r.cupo_total !== undefined && r.cupo_total !== null
        ? Number(r.cupo_total)
        : (Number(r.cupo_disponible) || 0);
      return acc + cupoInicial;
    }, 0);

    if (this.inventoryCount) {
      this.inventoryCount.textContent = `${totalCuposRestantes} cupos disponibles de ${totalCuposIniciales}`;
    }

    if (this.gifts.length === 0) {
      this.inventoryDrawer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 12px; color: #64748b; font-size: 0.78rem;">
          No hay regalos disponibles en la base de datos de Supabase.
        </div>
      `;
      return;
    }

    this.inventoryDrawer.innerHTML = this.gifts.map((item) => {
      const esVip = Boolean((item?.permite_regiro ?? false) || item?.cupo_total === 1 || item?.es_vip || item?.es_mayor);
      const cupoDisp = Number(item.cupo_disponible) || 0;
      const isAgotado = cupoDisp <= 0;

      const badgeHtml = isAgotado
        ? '<span class="badge-stock badge-exhausted">AGOTADO</span>'
        : `<span class="badge-stock badge-available">${cupoDisp === 1 ? 'Queda 1 disponible' : `Quedan ${cupoDisp} disponibles`}</span>`;

      return `
        <div class="inventory-item-card ${isAgotado ? 'is-exhausted' : ''} ${esVip ? 'is-vip' : ''}">
          <span class="item-icon">${item.icono_emoji}</span>
          <div class="item-card-body">
            <span class="item-name" title="${this.escapeHtml(item.nombre)}">${this.escapeHtml(item.nombre)}</span>
            <div class="item-badge-row">
              ${badgeHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Carga el historial de asignaciones ÚNICA y EXCLUSIVAMENTE desde regalosService.obtenerHistorialInvitados()
   */
  async loadHistorialInvitados() {
    try {
      const res = await obtenerHistorialInvitados();
      const lista = Array.isArray(res) ? res : (res?.data || []);
      if (Array.isArray(lista)) {
        this.historial = lista;
      } else {
        this.historial = [];
      }
    } catch (err) {
      console.warn('[BabyBossApp] Error al consultar historial de invitados:', err);
      this.historial = [];
    }
    this.renderHistorial();
  }

  /**
   * Renderiza el directorio de asignaciones tanto en formato tabla desktop como tarjetas móvil
   */
  renderHistorial() {
    const count = this.historial.length;

    // Actualizar badge contador
    if (this.assignmentsCountBadge) {
      this.assignmentsCountBadge.textContent = `${count} ${count === 1 ? 'Registrado' : 'Registrados'}`;
    }

    // Estado vacío
    if (count === 0) {
      if (this.assignmentsEmptyState) this.assignmentsEmptyState.style.display = 'flex';
      if (this.tableDesktopWrap) this.tableDesktopWrap.style.display = 'none';
      if (this.mobileAssignmentsList) this.mobileAssignmentsList.style.display = 'none';
      return;
    }

    if (this.assignmentsEmptyState) this.assignmentsEmptyState.style.display = 'none';
    if (this.tableDesktopWrap) this.tableDesktopWrap.style.display = '';
    if (this.mobileAssignmentsList) this.mobileAssignmentsList.style.display = '';

    // Renderizar Tabla Desktop
    if (this.assignmentsTbody) {
      this.assignmentsTbody.innerHTML = this.historial.map((item, index) => {
        const emoji = this.getGiftEmoji(item.regalo);
        const fechaTexto = item.fechaFormateada || this.formatDate(item.fecha);
        const isFirst = index === 0 ? 'newly-added' : '';
        return `
          <tr class="${isFirst}">
            <td><strong>👔 ${this.escapeHtml(item.nombre)}</strong></td>
            <td>
              <span class="table-gift-pill">
                <span>${emoji}</span>
                <span>${this.escapeHtml(item.regalo)}</span>
              </span>
            </td>
            <td><span class="table-time-text">⏰ ${this.escapeHtml(fechaTexto)}</span></td>
          </tr>
        `;
      }).join('');
    }

    // Renderizar Tarjetas para Móvil
    if (this.mobileAssignmentsList) {
      this.mobileAssignmentsList.innerHTML = this.historial.map((item, index) => {
        const emoji = this.getGiftEmoji(item.regalo);
        const fechaTexto = item.fechaFormateada || this.formatDate(item.fecha);
        const isFirst = index === 0 ? 'newly-added' : '';
        return `
          <div class="mobile-assignment-card ${isFirst}">
            <div class="mobile-card-top">
              <span class="mobile-guest-name">👔 ${this.escapeHtml(item.nombre)}</span>
              <span class="mobile-time-badge">⏰ ${this.escapeHtml(fechaTexto)}</span>
            </div>
            <div class="mobile-card-bottom">
              <span class="mobile-gift-badge">
                <span>${emoji}</span>
                <span>${this.escapeHtml(item.regalo)}</span>
              </span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  getGiftEmoji(nombreRegalo = '') {
    if (/cuna|corral|protector/i.test(nombreRegalo)) return '🛏️';
    if (/coche/i.test(nombreRegalo)) return '👶';
    if (/canguro|portabeb|fular|cargador/i.test(nombreRegalo)) return '🥇';
    if (/pañal|pañito/i.test(nombreRegalo)) return '📦';
    if (/bodie|pijama/i.test(nombreRegalo)) return '👕';
    if (/conjunto|salida|ropita/i.test(nombreRegalo)) return '👗';
    if (/baño|higiene.*shampoo|jabón|bañera/i.test(nombreRegalo)) return '🛁';
    if (/crema/i.test(nombreRegalo)) return '🧴';
    if (/alimentaci|biber|cepillo|babero|extractor|leche|fórmula/i.test(nombreRegalo)) return '🍼';
    if (/salud|termómetro|cortaúña|aspirador/i.test(nombreRegalo)) return '🩺';
    if (/sueño|manta|sábana/i.test(nombreRegalo)) return '🌙';
    if (/accesorio|organizad|cojín/i.test(nombreRegalo)) return '🧸';
    return '🎁';
  }

  formatDate(rawDate) {
    if (!rawDate) return 'Reciente';
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return String(rawDate);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(rawDate);
    }
  }

  /**
   * Valida el nombre o familia ingresado consultando validarInvitadoPrevio(nombre)
   */
  async handleConfirmGuest() {
    const rawName = this.inputGuest ? this.inputGuest.value : '';
    const cleanName = rawName.trim().replace(/\s+/g, ' ');

    if (!cleanName || cleanName.length < 2) {
      this.showFeedback('Por favor, ingresa tu nombre o el de tu familia para firmar la asistencia.', 'error');
      this.inputGuest?.focus();
      return;
    }

    // Deshabilitar botón durante validación
    if (this.btnConfirmGuest) this.btnConfirmGuest.disabled = true;
    this.showFeedback('Verificando asistencia en actas ejecutivas...', 'success');

    try {
      const check = await validarInvitadoPrevio(cleanName);

      if (check.yaExiste) {
        // Invitado duplicado
        this.showFeedback(`El invitado "${cleanName}" ya se encuentra registrado y ha reclamado su obsequio.`, 'error');
        modalManager.showAlertModal({
          title: 'Asistencia Ya Registrada',
          message: `Estimado/a ${cleanName}, los registros de la Junta Directiva indican que su asistencia y obsequio ya fueron formalmente adjudicados en esta sesión.`,
          icon: '📑',
          confirmText: 'Aceptar'
        });
        if (this.btnConfirmGuest) this.btnConfirmGuest.disabled = false;
        return;
      }

      // Nombre válido y sin reclamos previos
      this.guestName = cleanName;
      this.esSegundoGiro = false;
      this.clearFeedback();
      this.updateGuestSessionUI(true);
      audioFx.playClick();

    } catch (err) {
      console.error('[handleConfirmGuest] Error:', err);
      // Permitir continuar en modo offline/tolerancia
      this.guestName = cleanName;
      this.esSegundoGiro = false;
      this.updateGuestSessionUI(true);
    } finally {
      if (this.btnConfirmGuest) this.btnConfirmGuest.disabled = false;
    }
  }

  updateGuestSessionUI(isActive) {
    if (isActive) {
      if (this.activeGuestContainer) this.activeGuestContainer.style.display = 'flex';
      if (this.activeGuestNameSpan) this.activeGuestNameSpan.textContent = this.guestName;
      if (this.inputGuest) this.inputGuest.parentElement.style.display = 'none';
      if (this.btnConfirmGuest) this.btnConfirmGuest.style.display = 'none';
      if (this.btnSpin) {
        this.btnSpin.disabled = false;
        this.btnSpin.classList.add('animate-bounce-in');
      }
      this.updateSpinStatusNote();
    } else {
      if (this.activeGuestContainer) this.activeGuestContainer.style.display = 'none';
      if (this.inputGuest) {
        this.inputGuest.parentElement.style.display = 'flex';
        this.inputGuest.value = '';
      }
      if (this.btnConfirmGuest) this.btnConfirmGuest.style.display = 'inline-flex';
      if (this.btnSpin) this.btnSpin.disabled = true;
      this.guestName = '';
      this.esSegundoGiro = false;
      this.updateSpinStatusNote();
    }
  }

  resetGuestSession() {
    this.updateGuestSessionUI(false);
    this.clearFeedback();
    this.inputGuest?.focus();
  }

  updateSpinStatusNote() {
    if (!this.spinStatusNote) return;
    if (!this.guestName) {
      this.spinStatusNote.innerHTML = '🔒 Firma tu asistencia arriba para habilitar la ruleta del Jefe 🍼';
      return;
    }
    if (this.esSegundoGiro) {
      this.spinStatusNote.innerHTML = '⚡ <strong>Segundo Giro Ejecutivo</strong> habilitado para <em>' + this.escapeHtml(this.guestName) + '</em> (Resolución Definitiva) 👶';
    } else {
      this.spinStatusNote.innerHTML = '🎯 <strong>Primer Giro</strong> disponible para: <em>' + this.escapeHtml(this.guestName) + '</em> ✨';
    }
  }

  /**
   * Ejecuta el giro físico de la ruleta aplicando selección ponderada
   * para priorizar regalos de cupo único (Cuna, Coche, Canguro).
   */
  handleExecuteSpin() {
    if (this.isSpinning || !this.guestName) return;

    // Regalos activos con cupo disponible (> 0)
    const regalosActivos = (this.gifts || []).filter(r => (r.cupo_disponible || 0) > 0);

    if (regalosActivos.length === 0) {
      this.showFeedback('No hay regalos con cupo disponible en Supabase.', 'error');
      modalManager.showAlertModal({
        title: 'Sin Regalos Disponibles',
        message: 'No hay regalos con cupo disponible cargados desde la base de datos de Supabase.',
        icon: '📦',
        confirmText: 'Actualizar Regalos',
        onConfirm: async () => {
          await this.loadAvailableGifts();
        }
      });
      return;
    }

    this.isSpinning = true;
    if (this.btnSpin) this.btnSpin.disabled = true;

    // 1. Algoritmo ponderado (Weighted Random Selection):
    // Prioriza regalos con cupo_total === 1 o permite_regiro con multiplicador de peso 3.5
    // frente a regalos con cupos regulares con peso base 1.0.
    const listaPonderada = regalosActivos.map(r => ({
      ...r,
      peso: (r.cupo_total === 1 || r.permite_regiro) ? 3.5 : 1.0
    }));

    const pesoTotal = listaPonderada.reduce((acc, r) => acc + r.peso, 0);
    let randomNum = Math.random() * pesoTotal;
    let regaloGanador = listaPonderada[0];

    for (const item of listaPonderada) {
      if (randomNum < item.peso) {
        regaloGanador = item;
        break;
      }
      randomNum -= item.peso;
    }

    // 2. Localizar el índice del regalo ganador en el array renderizado por la ruleta
    let chosenIndex = this.gifts.findIndex(g => g.id === regaloGanador.id);
    if (chosenIndex === -1) {
      chosenIndex = 0;
    }

    this.roulette.spinTo(chosenIndex, (selectedGift) => {
      this.isSpinning = false;
      this.handleSpinCompleted(selectedGift);
    });
  }

  /**
   * Maneja el resultado del giro de acuerdo a las reglas de negocio
   */
  async handleSpinCompleted(selectedGift) {
    const permiteRegiro = Boolean(selectedGift.permite_regiro ?? selectedGift.es_mayor);

    // Lanzar efecto de confeti corporativo
    this.fireCorporateConfetti();

    // REGLA 1: Si permite_regiro es TRUE y es el PRIMER GIRO
    if (permiteRegiro && !this.esSegundoGiro) {
      modalManager.showPresidencialModal({
        guestName: this.guestName,
        regalo: selectedGift,
        onAceptar: async () => {
          await this.commitGiftAssignment(selectedGift, false);
        },
        onRegiro: () => {
          this.esSegundoGiro = true;
          this.updateSpinStatusNote();
          if (this.btnSpin) this.btnSpin.disabled = false;
          // Feedback visual
          this.showFeedback('⚡ Opción de regiro activada. ¡Presiona "Ejecutar Giro Corporativo" para tu resultado definitivo!', 'success');
        }
      });
      return;
    }

    // REGLA 2: Si no permite regiro O es el segundo giro
    await this.commitGiftAssignment(selectedGift, this.esSegundoGiro);
  }

  /**
   * Consolida la asignación llamando atómicamente a regalosService.asignarRegalo()
   * Requiere confirmación real de Supabase sin registrar asignaciones ficticias.
   */
  async commitGiftAssignment(regalo, esSegundoGiro) {
    try {
      const res = await asignarRegalo(this.guestName, regalo.id);

      // Manejo de cupo agotado concurrente
      if (!res.success && res.cupoAgotado) {
        modalManager.showAlertModal({
          title: 'Activo Agotado en Sala de Juntas',
          message: `El obsequio "${regalo.nombre}" acaba de alcanzar su cupo máximo con otro invitado. La Junta te autoriza a girar nuevamente de inmediato.`,
          icon: '🔄',
          confirmText: 'Volver a Girar',
          onConfirm: async () => {
            await this.loadAvailableGifts();
            if (this.btnSpin) this.btnSpin.disabled = false;
          }
        });
        return;
      }

      // Si falló por otra razón (error de conexión, invitado duplicado, permisos)
      if (!res.success) {
        modalManager.showAlertModal({
          title: 'Fallo de Registro en Supabase',
          message: res.mensaje || res.error || 'No fue posible registrar la asignación en la base de datos oficial.',
          icon: '⚠️',
          confirmText: 'Entendido'
        });
        if (this.btnSpin) this.btnSpin.disabled = false;
        return;
      }

      // Actualización reactiva instantánea (optimista) para que el catálogo y la ruleta se actualicen al milisegundo
      const regObj = this.gifts.find((g) => g.id === regalo.id);
      if (regObj && regObj.cupo_disponible > 0) {
        regObj.cupo_disponible -= 1;
        this.renderInventoryDrawer();
        this.roulette.setItems(this.gifts);
      }

      // Sincronización oficial autoritativa desde Supabase
      await this.loadAvailableGifts();
      await this.loadHistorialInvitados();

      // Abrir Memorándum Oficial
      modalManager.showMemorandumModal({
        guestName: this.guestName,
        regalo: regalo,
        esSegundoGiro: esSegundoGiro,
        onNuevoInvitado: async () => {
          this.resetGuestSession();
          await this.loadAvailableGifts();
          await this.loadHistorialInvitados();
        }
      });

    } catch (err) {
      console.error('[commitGiftAssignment] Fallo de conexión:', err);
      modalManager.showAlertModal({
        title: 'Error de Comunicación',
        message: 'No se pudo registrar el obsequio debido a un problema de conexión con Supabase. Inténtalo nuevamente.',
        icon: '⚠️',
        confirmText: 'Entendido'
      });
      if (this.btnSpin) this.btnSpin.disabled = false;
    }
  }

  fireCorporateConfetti() {
    try {
      // Confeti dorado y azul marino ejecutivo
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.55 },
        colors: ['#d4af37', '#0c2340', '#ffffff', '#3b82f6', '#ffd700']
      });

      setTimeout(() => {
        confetti({
          particleCount: 40,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#d4af37', '#0c2340', '#ffffff']
        });
        confetti({
          particleCount: 40,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#d4af37', '#0c2340', '#ffffff']
        });
      }, 200);
    } catch {
      // Fallback
    }
  }

  showFeedback(msg, type = 'error') {
    if (!this.inputFeedback) return;
    this.inputFeedback.textContent = msg;
    this.inputFeedback.className = `input-feedback ${type}`;
  }

  clearFeedback() {
    if (!this.inputFeedback) return;
    this.inputFeedback.textContent = '';
    this.inputFeedback.className = 'input-feedback';
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// Inicialización automática una vez montado el DOM
document.addEventListener('DOMContentLoaded', () => {
  const app = new BabyBossApp();
  app.init().catch(console.error);
});
