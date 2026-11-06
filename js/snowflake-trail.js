/**
 * Snowflake Cursor Trail (Festive Winter Edition)
 * Leaves a graceful, delicate trail of realistic tiny snowflakes behind the mouse cursor.
 * Desktop only, non-intrusive (pointer-events: none), highly optimized 60/120fps canvas.
 */
(function initSnowflakeTrail() {
  if (typeof window === 'undefined') return;

  // Only run on devices with precision pointer (mouse / touchpad)
  if (window.matchMedia && !window.matchMedia('(pointer: fine)').matches) return;
  // Respect user preference for reduced motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function setup() {
    let canvas = document.getElementById('snowflake-trail-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'snowflake-trail-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:999999;';
      document.body.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;
    function resize() {
      dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Pre-render 4 distinct realistic snowflake shapes onto offscreen canvases
    const SPRITE_SIZE = 64; // High-res master size
    const spriteCanvases = [];

    function createSprite(drawFn) {
      const oc = document.createElement('canvas');
      oc.width = SPRITE_SIZE * 2;
      oc.height = SPRITE_SIZE * 2;
      const octx = oc.getContext('2d');
      octx.scale(2, 2);
      octx.translate(SPRITE_SIZE / 2, SPRITE_SIZE / 2);

      // Soft contrast shadow so white snowflake is clearly visible on white and sand backgrounds
      octx.shadowColor = 'rgba(18, 19, 24, 0.45)';
      octx.shadowBlur = 3;
      octx.shadowOffsetX = 0;
      octx.shadowOffsetY = 1;

      drawFn(octx, SPRITE_SIZE / 2 - 4);
      return oc;
    }

    // 1. Classical 6-branch dendritic snowflake (Резная шестиконечная)
    spriteCanvases.push(createSprite((c, r) => {
      c.strokeStyle = '#ffffff';
      c.lineWidth = 1.8;
      c.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        c.save();
        c.rotate((i * Math.PI) / 3);
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(0, -r);
        c.stroke();
        // Outer chevrons
        c.beginPath();
        c.moveTo(-r * 0.38, -r * 0.58);
        c.lineTo(0, -r * 0.78);
        c.lineTo(r * 0.38, -r * 0.58);
        c.stroke();
        // Inner chevrons
        c.beginPath();
        c.moveTo(-r * 0.28, -r * 0.28);
        c.lineTo(0, -r * 0.48);
        c.lineTo(r * 0.28, -r * 0.28);
        c.stroke();
        c.restore();
      }
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(0, 0, 2.5, 0, Math.PI * 2);
      c.fill();
    }));

    // 2. Crystal star snowflake with diamond facets (Хрустальная с ромбиками)
    spriteCanvases.push(createSprite((c, r) => {
      c.strokeStyle = '#ffffff';
      c.fillStyle = '#ffffff';
      c.lineWidth = 1.6;
      c.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        c.save();
        c.rotate((i * Math.PI) / 3);
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(0, -r);
        c.stroke();
        // Diamond tip
        c.beginPath();
        c.moveTo(0, -r);
        c.lineTo(-r * 0.2, -r * 0.78);
        c.lineTo(0, -r * 0.58);
        c.lineTo(r * 0.2, -r * 0.78);
        c.closePath();
        c.fill();
        c.restore();
      }
      c.beginPath();
      c.arc(0, 0, 3.2, 0, Math.PI * 2);
      c.stroke();
    }));

    // 3. Feathered ice dendrite (Перистая игольчатая)
    spriteCanvases.push(createSprite((c, r) => {
      c.strokeStyle = '#ffffff';
      c.lineWidth = 1.6;
      c.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        c.save();
        c.rotate((i * Math.PI) / 3);
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(0, -r);
        c.moveTo(-r * 0.24, -r * 0.36);
        c.lineTo(0, -r * 0.48);
        c.lineTo(r * 0.24, -r * 0.36);
        c.moveTo(-r * 0.34, -r * 0.68);
        c.lineTo(0, -r * 0.8);
        c.lineTo(r * 0.34, -r * 0.68);
        c.stroke();
        c.restore();
      }
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(0, 0, 2.2, 0, Math.PI * 2);
      c.fill();
    }));

    // 4. Sparkling ice crystal star (Искрящаяся звёздочка-кристалл)
    spriteCanvases.push(createSprite((c, r) => {
      c.fillStyle = '#ffffff';
      c.strokeStyle = '#ffffff';
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(0, -r);
      c.quadraticCurveTo(r * 0.12, -r * 0.22, r, 0);
      c.quadraticCurveTo(r * 0.12, r * 0.22, 0, r);
      c.quadraticCurveTo(-r * 0.12, r * 0.22, -r, 0);
      c.quadraticCurveTo(-r * 0.12, -r * 0.22, 0, -r);
      c.closePath();
      c.fill();
      for (let i = 0; i < 4; i++) {
        c.save();
        c.rotate((i * Math.PI) / 2 + Math.PI / 4);
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(0, -r * 0.65);
        c.stroke();
        c.restore();
      }
    }));

    // Particle pool: maximum 10 small snowflakes in the trail
    const MAX_PARTICLES = 10;
    const particles = [];

    let lastX = null;
    let lastY = null;
    let isAnimating = false;

    class SnowflakeParticle {
      constructor(x, y) {
        // Spawn slightly offset from pointer tip so the arrow is never blocked
        this.x = x + (Math.random() - 0.5) * 8;
        this.y = y + (Math.random() - 0.5) * 8 + 4;
        // Natural gentle drift and fall
        this.vx = (Math.random() - 0.5) * 0.7;
        this.vy = 0.5 + Math.random() * 0.8;
        // Varied small sizes (13px to 21px in CSS pixels)
        this.size = 13 + Math.random() * 8;
        this.rotation = Math.random() * Math.PI * 2;
        this.vRot = (Math.random() - 0.5) * 0.04;
        this.life = 0;
        this.maxLife = 45 + Math.random() * 25; // ~0.75s to 1.15s
        this.spriteIndex = Math.floor(Math.random() * spriteCanvases.length);
        this.alpha = 0.95;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.vRot;
        this.life++;

        // Smooth graceful fade-out
        const progress = this.life / this.maxLife;
        if (progress > 0.3) {
          this.alpha = Math.max(0, 0.95 * (1 - (progress - 0.3) / 0.7));
        }
        return this.life < this.maxLife && this.alpha > 0.01;
      }

      draw(context) {
        if (this.alpha <= 0) return;
        context.save();
        context.globalAlpha = this.alpha;
        context.translate(this.x, this.y);
        context.rotate(this.rotation);
        context.drawImage(spriteCanvases[this.spriteIndex], -this.size / 2, -this.size / 2, this.size, this.size);
        context.restore();
      }
    }

    function addParticle(x, y) {
      if (particles.length >= MAX_PARTICLES) {
        particles.shift();
      }
      particles.push(new SnowflakeParticle(x, y));
      if (!isAnimating) {
        isAnimating = true;
        requestAnimationFrame(renderLoop);
      }
    }

    function renderLoop() {
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (p.update()) {
          p.draw(ctx);
        } else {
          particles.splice(i, 1);
        }
      }

      if (particles.length > 0) {
        requestAnimationFrame(renderLoop);
      } else {
        isAnimating = false;
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      }
    }

    // Distance threshold: spawn a snowflake roughly every 18px of mouse travel
    const SPAWN_DIST = 18;

    window.addEventListener('mousemove', (e) => {
      const cx = e.clientX;
      const cy = e.clientY;

      if (lastX === null) {
        lastX = cx;
        lastY = cy;
        addParticle(cx, cy);
        return;
      }

      const dist = Math.hypot(cx - lastX, cy - lastY);
      if (dist >= SPAWN_DIST) {
        addParticle(cx, cy);
        lastX = cx;
        lastY = cy;
      }
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
