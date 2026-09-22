import { audioFx } from './AudioEffects.js';

/**
 * RouletteCanvas.js
 * Ruleta interactiva renderizada en HTML5 Canvas con aceleración/desaceleración suave,
 * paleta "Un Jefe en Pañales" combinada con tonos tiernos y festivos de Baby Shower,
 * avatar central con la imagen oficial de /jefe-bebe.png,
 * feedback de audio (ticks mecánicos) y vibración háptica.
 */
export class RouletteCanvas {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Object} options
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.items = [];
    this.currentAngle = 0; // en radianes
    this.isSpinning = false;
    this.onTick = options.onTick || null;

    // Carga de la imagen del Bebé Jefe para el centro de la ruleta
    this.bossImage = new Image();
    this.bossImage.src = '/jefe-bebe.png';
    this.bossImageLoaded = false;
    this.bossImage.onload = () => {
      this.bossImageLoaded = true;
      this.draw();
    };

    // Paleta corporativa y festiva "Un Jefe en Pañales - Baby Shower"
    this.sliceColors = [
      { bg: '#0c2340', text: '#ffffff', badge: '#ffd700', isDark: true },  // Azul Ejecutivo Jefe
      { bg: '#d4af37', text: '#0c2340', badge: '#ffffff', isDark: false }, // Oro Presidencial
      { bg: '#2563eb', text: '#ffffff', badge: '#ffd700', isDark: true },  // Azul Corporativo Festivo
      { bg: '#e0f2fe', text: '#0c2340', badge: '#1d4ed8', isDark: false }, // Celeste Bebé Nube
      { bg: '#0f172a', text: '#fde047', badge: '#ffffff', isDark: true },  // Azul Medianoche Ejecutivo
      { bg: '#fef08a', text: '#0c2340', badge: '#854d0e', isDark: false }, // Oro Pastel Suave
      { bg: '#1d4ed8', text: '#ffffff', badge: '#ffd700', isDark: true },  // Azul Real Baby Boss
      { bg: '#b48c22', text: '#ffffff', badge: '#ffffff', isDark: true },  // Oro Mostaza Elegante
    ];

    this.initCanvasSize();
    this.setupResizeListener();
  }

  setupResizeListener() {
    window.addEventListener('resize', () => {
      this.initCanvasSize();
      this.draw();
    });
  }

  initCanvasSize() {
    const parent = this.canvas.parentElement;
    const size = Math.min(parent ? parent.clientWidth : 360, 420);
    const dpr = window.devicePixelRatio || 1;

    this.displaySize = size;
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;

    this.ctx.scale(dpr, dpr);
    this.centerX = size / 2;
    this.centerY = size / 2;
    this.radius = (size / 2) - 15;
  }

  setItems(items) {
    this.items = items || [];
    this.draw();
  }

  /**
   * Dibuja la ruleta con sombras, gradientes, bordes dorados, pines y el avatar del Jefe en Pañales.
   */
  draw() {
    const ctx = this.ctx;
    const cx = this.centerX;
    const cy = this.centerY;
    const r = this.radius;

    ctx.clearRect(0, 0, this.displaySize, this.displaySize);

    if (!this.items || this.items.length === 0) {
      this.drawEmptyState();
      return;
    }

    const totalItems = this.items.length;
    const sliceAngle = (2 * Math.PI) / totalItems;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.currentAngle);

    // 1. Sombra exterior del bisel (suave y festiva)
    ctx.shadowColor = 'rgba(12, 35, 64, 0.28)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6;

    // 2. Bisel Exterior Dorado Brillante
    const goldGrad = ctx.createLinearGradient(-r, -r, r, r);
    goldGrad.addColorStop(0, '#fef08a');
    goldGrad.addColorStop(0.35, '#d4af37');
    goldGrad.addColorStop(0.7, '#8f6e16');
    goldGrad.addColorStop(1, '#fde047');

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, 2 * Math.PI);
    ctx.fillStyle = goldGrad;
    ctx.fill();

    // Reset shadow para las cuñas
    ctx.shadowColor = 'transparent';

    // Bisel interior fino en azul marino ejecutivo
    ctx.beginPath();
    ctx.arc(0, 0, r - 6.5, 0, 2 * Math.PI);
    ctx.fillStyle = '#08172b';
    ctx.fill();

    const innerRadius = r - 9.5;

    // 3. Dibujar Cuñas
    for (let i = 0; i < totalItems; i++) {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const palette = this.sliceColors[i % this.sliceColors.length];
      const item = this.items[i];

      const isAgotado = (item.cupo_disponible !== undefined && Number(item.cupo_disponible) <= 0);

      // Cuña
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, innerRadius, startAngle, endAngle);
      ctx.closePath();

      // Gradiente radial para dar profundidad (tonos oscuros apagados si está agotado)
      const wedgeGrad = ctx.createRadialGradient(0, 0, innerRadius * 0.25, 0, 0, innerRadius);
      if (isAgotado) {
        wedgeGrad.addColorStop(0, '#334155');
        wedgeGrad.addColorStop(1, '#1e293b');
      } else {
        wedgeGrad.addColorStop(0, palette.bg);
        wedgeGrad.addColorStop(1, this.adjustBrightness(palette.bg, palette.isDark ? -18 : -10));
      }
      ctx.fillStyle = wedgeGrad;
      ctx.fill();

      // Línea divisoria en oro suave (o atenuada si está agotado)
      ctx.strokeStyle = isAgotado ? 'rgba(148, 163, 184, 0.25)' : 'rgba(212, 175, 55, 0.55)';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // 4. Texto y detalles del regalo dentro de la cuña
      ctx.save();
      ctx.rotate(startAngle + sliceAngle / 2);

      if (isAgotado) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('✖ AGOTADO ✖', innerRadius * 0.88, 3);
        ctx.fillStyle = '#94a3b8';
      } else if (esVip) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('★ VIP ★', innerRadius * 0.88, 3);
        ctx.fillStyle = palette.text;
      } else {
        ctx.fillStyle = palette.text;
      }

      ctx.font = `700 ${totalItems > 8 ? 10 : 11.5}px "Plus Jakarta Sans", -apple-system, sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      // Truncar nombre si es muy largo para móvil
      let nombre = item.nombre || 'Obsequio';
      if (nombre.length > 19) {
        nombre = nombre.substring(0, 17) + '...';
      }

      const textDist = (isAgotado || esVip) ? innerRadius * 0.75 : innerRadius * 0.81;
      ctx.fillText(nombre, textDist, 0);

      // Emojis tiernos y representativos de Baby Shower (🍼, 👶, 🧴, 🧸, 🛏️)
      const emoji = isAgotado ? '🔒' : this.getItemEmoji(item);
      ctx.font = '14px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
      ctx.fillText(emoji, innerRadius * 0.36, 0);

      ctx.restore();
    }

    // 5. Pines Metálicos Dorados en el borde exterior
    const numPins = totalItems * 2;
    for (let p = 0; p < numPins; p++) {
      const pinAngle = (p * 2 * Math.PI) / numPins;
      const pinX = Math.cos(pinAngle) * (r - 4.5);
      const pinY = Math.sin(pinAngle) * (r - 4.5);

      ctx.beginPath();
      ctx.arc(pinX, pinY, 2.8, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pinX, pinY, 2.0, 0, 2 * Math.PI);
      ctx.fillStyle = '#d4af37';
      ctx.fill();
    }

    // 6. Hub Central con la Imagen Oficial del "Bebé Jefe" (/jefe-bebe.png)
    const hubRadius = innerRadius * 0.28;

    // Sombra del sello central
    ctx.shadowColor = 'rgba(12, 35, 64, 0.45)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 2;

    // Anillo Exterior Dorado del Hub
    ctx.beginPath();
    ctx.arc(0, 0, hubRadius, 0, 2 * Math.PI);
    ctx.fillStyle = goldGrad;
    ctx.fill();
    ctx.shadowColor = 'transparent';

    // Borde azul marino ejecutivo
    ctx.beginPath();
    ctx.arc(0, 0, hubRadius - 2.5, 0, 2 * Math.PI);
    ctx.fillStyle = '#0c2340';
    ctx.fill();

    // Fondo blanco suave para que destaque la silueta del Bebé Jefe
    ctx.beginPath();
    ctx.arc(0, 0, hubRadius - 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Renderizar imagen del Bebé Jefe recortada en círculo
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, hubRadius - 4, 0, 2 * Math.PI);
    ctx.clip();

    if (this.bossImageLoaded && this.bossImage.naturalWidth > 0) {
      const imgSize = (hubRadius - 4) * 2;
      ctx.drawImage(
        this.bossImage,
        -imgSize / 2,
        -imgSize / 2,
        imgSize,
        imgSize
      );
    } else {
      // Fallback elegante mientras carga
      ctx.fillStyle = '#0c2340';
      ctx.fillRect(-hubRadius, -hubRadius, hubRadius * 2, hubRadius * 2);
      ctx.font = '22px "Segoe UI Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👶', 0, 0);
    }
    ctx.restore();

    // Anillo dorado fino de remate
    ctx.beginPath();
    ctx.arc(0, 0, hubRadius - 4, 0, 2 * Math.PI);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();

    // 7. Puntero Superior en forma de corbata ejecutiva dorada con estrella
    this.drawPointer();
  }

  /**
   * Puntero superior estilo corbata ejecutiva de bebé con gema dorada.
   */
  drawPointer() {
    const ctx = this.ctx;
    const cx = this.centerX;
    const topY = 2;

    ctx.save();
    ctx.translate(cx, topY);

    ctx.shadowColor = 'rgba(12, 35, 64, 0.35)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    // Forma de corbatín/flecha ejecutiva
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(12, 0);
    ctx.lineTo(9, 16);
    ctx.lineTo(0, 27); // Punta hacia la ruleta
    ctx.lineTo(-9, 16);
    ctx.closePath();

    const ptrGrad = ctx.createLinearGradient(-10, 0, 10, 27);
    ptrGrad.addColorStop(0, '#fff4b8');
    ptrGrad.addColorStop(0.5, '#d4af37');
    ptrGrad.addColorStop(1, '#8f6e16');
    ctx.fillStyle = ptrGrad;
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Gema de estrella o nudo central
    ctx.fillStyle = '#0c2340';
    ctx.beginPath();
    ctx.arc(0, 7, 4, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#ffd700';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', 0, 7);

    ctx.restore();
  }

  drawEmptyState() {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#0c2340';
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#d4af37';
    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Esperando regalos de la base de datos...', this.centerX, this.centerY);
    ctx.restore();
  }

  getItemEmoji(item) {
    const nombre = item.nombre || '';
    if (item.icono === 'bed' || /cuna|corral|protector/i.test(nombre)) return '🛏️';
    if (item.icono === 'stroller' || /coche/i.test(nombre)) return '👶';
    if (item.icono === 'award' || /canguro|portabeb|fular|cargador/i.test(nombre)) return '🥇';
    if (item.icono === 'package' || /pañal|pañito/i.test(nombre)) return '📦';
    if (/bodie|pijama/i.test(nombre)) return '👕';
    if (/conjunto|salida|ropita/i.test(nombre)) return '👗';
    if (/baño|higiene.*shampoo|jabón|bañera/i.test(nombre)) return '🛁';
    if (/crema/i.test(nombre)) return '🧴';
    if (item.icono === 'coffee' || /alimentaci|biber|cepillo|babero|extractor|leche|fórmula/i.test(nombre)) return '🍼';
    if (/salud|termómetro|cortaúña|aspirador/i.test(nombre)) return '🩺';
    if (/sueño|manta|sábana/i.test(nombre)) return '🌙';
    if (/accesorio|organizad|cojín/i.test(nombre)) return '🧸';
    return '🎁';
  }

  adjustBrightness(hex, percent) {
    let num = parseInt(hex.replace('#', ''), 16);
    let r = (num >> 16) + percent;
    let g = ((num >> 8) & 0x00FF) + percent;
    let b = (num & 0x0000FF) + percent;
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  spinTo(targetIndex, onComplete) {
    if (this.isSpinning || !this.items.length) return;
    this.isSpinning = true;

    const totalItems = this.items.length;
    const sliceAngle = (2 * Math.PI) / totalItems;

    const pointerAngle = (3 * Math.PI) / 2;
    const targetSliceCenter = (targetIndex * sliceAngle) + (sliceAngle / 2);
    
    const jitter = (Math.random() - 0.5) * (sliceAngle * 0.65);
    const desiredEndAngle = pointerAngle - (targetSliceCenter + jitter);

    const currentNorm = this.currentAngle % (2 * Math.PI);
    let delta = (desiredEndAngle - currentNorm) % (2 * Math.PI);
    if (delta < 0) delta += 2 * Math.PI;

    const extraSpins = (6 + Math.floor(Math.random() * 2)) * (2 * Math.PI);
    const startAngle = this.currentAngle;
    const totalDistance = delta + extraSpins;
    const duration = 4400; // ms
    const startTime = performance.now();

    const easeOutQuint = (t) => 1 - Math.pow(1 - t, 4.2);

    let lastTickAngle = this.currentAngle;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuint(progress);

      this.currentAngle = startAngle + totalDistance * easedProgress;

      const angleMoved = Math.abs(this.currentAngle - lastTickAngle);
      const pinStep = sliceAngle / 2;
      if (angleMoved >= pinStep) {
        lastTickAngle = this.currentAngle;
        audioFx.playTick(1.0 + (1 - progress) * 0.3);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(8);
        }
        if (this.onTick) this.onTick();
      }

      this.draw();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isSpinning = false;
        this.currentAngle = startAngle + totalDistance;
        this.draw();

        audioFx.playVictory();

        if (typeof onComplete === 'function') {
          onComplete(this.items[targetIndex]);
        }
      }
    };

    requestAnimationFrame(animate);
  }
}
