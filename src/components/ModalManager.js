import { audioFx } from './AudioEffects.js';

/**
 * ModalManager.js
 * Gestiona los diálogos festivos de Baby Shower corporativo:
 * - "Asignación Presidencial" con opciones de regiro
 * - "Memorándum Oficial" con el Bebé Jefe sosteniendo su galleta y burbuja de diálogo estilo cómic:
 *   "¡Excelente elección de inversión, socio!"
 */
export class ModalManager {
  constructor() {
    this.container = null;
    this.initDOM();
  }

  initDOM() {
    let container = document.getElementById('modal-root');
    if (!container) {
      container = document.createElement('div');
      container.id = 'modal-root';
      document.body.appendChild(container);
    }
    this.container = container;
  }

  close() {
    const backdrop = this.container.querySelector('.boss-modal-backdrop');
    if (backdrop) {
      backdrop.classList.add('closing');
      setTimeout(() => {
        this.container.innerHTML = '';
      }, 240);
    } else {
      this.container.innerHTML = '';
    }
  }

  /**
   * 1. Modal: ¡Asignación Presidencial! (Regalo VIP con opción a regiro)
   */
  showPresidencialModal({ guestName, regalo, onAceptar, onRegiro }) {
    audioFx.playClick();
    this.container.innerHTML = `
      <div class="boss-modal-backdrop animate-fade-in" role="dialog" aria-modal="true">
        <div class="boss-modal-card presidential-card rounded-3xl animate-scale-up">
          <!-- Decoración festiva en las esquinas -->
          <span class="card-sticker sticker-top-left">🍼</span>
          <span class="card-sticker sticker-top-right">⭐</span>

          <!-- Cinta Presidencial -->
          <div class="presidential-badge">
            <span class="badge-icon">👑</span>
            <span class="badge-text">ALTA GERENCIA • ASIGNACIÓN PRESIDENCIAL</span>
          </div>

          <div class="modal-header">
            <div class="boss-avatar-wrapper">
              <div class="boss-hero-avatar-glow">
                <img src="/jefe-bebe.png" alt="Bebé Jefe" class="boss-modal-hero-img" />
              </div>
              <span class="boss-sparkle">✨</span>
            </div>
            <h2 class="modal-title gold-gradient-text">¡Asignación Presidencial!</h2>
            <p class="modal-subtitle">
              ¡Felicidades, <strong>${this.escapeHtml(guestName)}</strong>! El Jefe te ha seleccionado personalmente.
            </p>
          </div>

          <div class="modal-body">
            <div class="reward-box presidential-glow rounded-2xl">
              <span class="reward-tag">OBSEQUIO DE ALTA GERENCIA</span>
              <div class="reward-icon-large">${this.escapeHtml(regalo.icono_emoji || '🎁')}</div>
              <h3 class="reward-name">${this.escapeHtml(regalo.nombre)}</h3>
              <p class="reward-desc">
                Este activo cuenta con <strong>Cláusula de Reconsideración</strong>.
                ¿Deseas aceptar formalmente este regalo o prefieres un <em>segundo y definitivo giro</em> de la ruleta?
              </p>
            </div>
          </div>

          <div class="modal-actions dual-actions">
            <button id="btn-modal-regirar" class="btn-boss btn-secondary rounded-2xl">
              <span class="btn-icon">🔄</span>
              <span class="btn-text">Girar de Nuevo</span>
            </button>
            <button id="btn-modal-aceptar" class="btn-boss btn-primary-gold rounded-2xl">
              <span class="btn-icon">💼</span>
              <span class="btn-text">Aceptar Misión</span>
            </button>
          </div>

          <div class="modal-footer-note">
            🍼 Si eliges girar de nuevo, el resultado del segundo intento será definitivo e irrevocable.
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-modal-aceptar')?.addEventListener('click', () => {
      audioFx.playClick();
      this.close();
      if (typeof onAceptar === 'function') onAceptar();
    });

    document.getElementById('btn-modal-regirar')?.addEventListener('click', () => {
      audioFx.playClick();
      this.close();
      if (typeof onRegiro === 'function') onRegiro();
    });
  }

  /**
   * 2. Modal: Memorándum Oficial
   * Muestra al Jefe en Pañales con su galleta y burbuja de cómic:
   * "¡Excelente elección de inversión, socio!"
   */
  showMemorandumModal({ guestName, regalo, esSegundoGiro, onNuevoInvitado }) {
    audioFx.playClick();

    const folio = 'ACTA-' + Math.floor(1000 + Math.random() * 9000);
    const fecha = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const memoText = 
`📑 MEMORÁNDUM OFICIAL - BABY SHOWER CORPORATIVO 🍼
🏢 Junta Directiva "Operación Pañales"
------------------------------------------------
Ref: Adjudicación de Activo Estratégico (${folio})
Fecha: ${fecha}
Para: Lic./Familia ${guestName}
De: Dirección General Baby Boss

Por la presente se le notifica que ha sido formalmente adjudicado/a para custodiar y entregar:
🎁 REGALO: ${regalo.nombre.toUpperCase()}
${esSegundoGiro ? '⚡ Estado: Resolución definitiva de 2do giro.' : '✨ Estado: Asignación ejecutiva ratificada.'}

"¡Excelente elección de inversión, socio!" 🍪
------------------------------------------------
Firma: 👶 Baby Boss - CEO Honorario`;

    this.container.innerHTML = `
      <div class="boss-modal-backdrop animate-fade-in" role="dialog" aria-modal="true">
        <div class="boss-modal-card memorandum-card rounded-3xl animate-scale-up">
          
          <!-- Stickers festivos flotantes -->
          <span class="card-sticker sticker-top-left">🧷</span>
          <span class="card-sticker sticker-top-right">🍼</span>

          <!-- Sello de Aprobación Lacrado / Estampa -->
          <div class="official-seal">
            <span class="seal-inner">APROBADO<br/>POR EL JEFE</span>
          </div>

          <!-- Cabecera Institucional del Memorándum -->
          <div class="memo-header">
            <div class="memo-corp-header">
              <span class="memo-brand">BABY BOSS ENTERPRISE S.A.</span>
              <span class="memo-department">DEPARTAMENTO DE RECURSOS MATERNALES & BIENVENIDA</span>
            </div>
            <div class="memo-folio-bar rounded-xl">
              <span><strong>FOLIO:</strong> ${folio}</span>
              <span><strong>FECHA:</strong> ${fecha}</span>
            </div>
          </div>

          <!-- Protagonista: El Bebé Jefe con Galleta y Burbuja de Cómic -->
          <div class="boss-comic-callout rounded-2xl">
            <div class="boss-comic-avatar-wrap">
              <div class="boss-comic-avatar-circle">
                <img src="/jefe-bebe.png" alt="Bebé Jefe" class="boss-comic-img" />
              </div>
              <span class="boss-cookie-badge" title="Galleta ejecutiva">🍪</span>
            </div>
            <div class="boss-comic-bubble">
              <div class="boss-comic-bubble-arrow"></div>
              <p class="boss-comic-quote">
                “¡Excelente elección de inversión, socio!”
              </p>
              <span class="boss-comic-author">— Baby Boss, CEO Honorario</span>
            </div>
          </div>

          <!-- Contenido del Memorándum -->
          <div class="memo-content-zone">
            <div class="memo-destinatario">
              <strong>PARA:</strong> <span>${this.escapeHtml(guestName)}</span>
            </div>

            <div class="memo-gift-card rounded-2xl">
              <div class="memo-gift-icon">${this.escapeHtml(regalo.icono_emoji || '🎁')}</div>
              <div class="memo-gift-details">
                <span class="memo-label">ACTIVO ASIGNADO PARA EL BABY SHOWER:</span>
                <span class="memo-gift-name">${this.escapeHtml(regalo.nombre)}</span>
                <span class="memo-status-pill">
                  ${esSegundoGiro ? '⚖️ Dictamen Definitivo' : '⭐ Condecoración Ejecutiva'}
                </span>
              </div>
            </div>

            <p class="memo-felicitacion rounded-xl">
              Estimado/a <strong>${this.escapeHtml(guestName)}</strong>: La Junta Directiva agradece con ternura tu valiosa contribución a la <strong>Operación Pañales</strong>. ¡Nos vemos en la fiesta! 🎉
            </p>
          </div>

          <!-- Botones de Acción Redondeados -->
          <div class="modal-actions dual-actions">
            <button id="btn-copy-memo" class="btn-boss btn-primary-gold rounded-2xl">
              <span class="btn-icon">📋</span>
              <span class="btn-text">Copiar Memorándum</span>
            </button>
            <button id="btn-new-guest" class="btn-boss btn-secondary rounded-2xl">
              <span class="btn-icon">👶</span>
              <span class="btn-text">Siguiente Invitado</span>
            </button>
          </div>

          <div id="copy-feedback" class="copy-feedback-msg rounded-xl" style="display:none;">
            ✅ ¡Memorándum copiado exitosamente al portapapeles!
          </div>
        </div>
      </div>
    `;

    const btnCopy = document.getElementById('btn-copy-memo');
    const btnNew = document.getElementById('btn-new-guest');
    const feedback = document.getElementById('copy-feedback');

    btnCopy?.addEventListener('click', async () => {
      audioFx.playClick();
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(memoText);
        } else {
          const ta = document.createElement('textarea');
          ta.value = memoText;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }

        if (feedback) {
          feedback.style.display = 'block';
          feedback.className = 'copy-feedback-msg animate-bounce-in';
          setTimeout(() => {
            if (feedback) feedback.style.display = 'none';
          }, 3500);
        }
        btnCopy.innerHTML = '<span class="btn-icon">✅</span><span class="btn-text">¡Copiado con Éxito!</span>';
        setTimeout(() => {
          if (btnCopy) {
            btnCopy.innerHTML = '<span class="btn-icon">📋</span><span class="btn-text">Copiar de Nuevo</span>';
          }
        }, 2500);
      } catch (err) {
        console.error('Error al copiar:', err);
      }
    });

    btnNew?.addEventListener('click', () => {
      audioFx.playClick();
      this.close();
      if (typeof onNuevoInvitado === 'function') onNuevoInvitado();
    });
  }

  showAlertModal({ title, message, icon = '⚠️', confirmText = 'Entendido', onConfirm }) {
    audioFx.playClick();
    this.container.innerHTML = `
      <div class="boss-modal-backdrop animate-fade-in" role="dialog" aria-modal="true">
        <div class="boss-modal-card alert-card rounded-3xl animate-scale-up">
          <div class="modal-header">
            <div class="alert-icon-ring">${icon}</div>
            <h2 class="modal-title">${this.escapeHtml(title)}</h2>
          </div>
          <div class="modal-body">
            <p class="alert-message">${this.escapeHtml(message)}</p>
          </div>
          <div class="modal-actions single-action">
            <button id="btn-alert-confirm" class="btn-boss btn-primary-navy rounded-2xl">
              <span class="btn-text">${this.escapeHtml(confirmText)}</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-alert-confirm')?.addEventListener('click', () => {
      audioFx.playClick();
      this.close();
      if (typeof onConfirm === 'function') onConfirm();
    });
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

export const modalManager = new ModalManager();
