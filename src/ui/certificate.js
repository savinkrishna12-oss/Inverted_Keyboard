// Certified Keyboard Survivor Flex Certificate Generator
export class CertificateGenerator {
  static openModal(data) {
    const modal = document.createElement('div');
    modal.className = 'cursed-overlay-modal cert-modal';
    modal.innerHTML = `
      <div class="cert-modal-card">
        <div class="cert-modal-header">
          <h2>🏆 OFFICIAL GOVERNMENT ACCREDITATION</h2>
          <button type="button" class="cert-close-btn" id="cert-close">✕</button>
        </div>
        <div class="cert-canvas-wrap">
          <canvas id="cert-canvas" width="900" height="600"></canvas>
        </div>
        <div class="cert-modal-actions">
          <button type="button" class="action-btn cert-download-btn" id="cert-download-btn">
            💾 Download Certificate (PNG)
          </button>
          <button type="button" class="action-btn cert-copy-btn" id="cert-copy-btn">
            📋 Copy Flex Text
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const canvas = modal.querySelector('#cert-canvas');
    CertificateGenerator.renderCanvas(canvas, data);

    modal.querySelector('#cert-close').addEventListener('click', () => modal.remove());
    modal.querySelector('#cert-download-btn').addEventListener('click', () => {
      const link = document.createElement('a');
      link.download = `Certified_Keyboard_Survivor_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });

    modal.querySelector('#cert-copy-btn').addEventListener('click', (e) => {
      const flexText = `📜 I survived the CURSED KEYBOARD! Score: ${data.score} | WPM: ${data.wpm} | Accuracy: ${data.accuracy}% | Sanity: ${data.sanity}% | Title: ${data.title}`;
      navigator.clipboard?.writeText(flexText);
      e.target.textContent = 'Copied to Clipboard! 🎉';
      setTimeout(() => { e.target.textContent = '📋 Copy Flex Text'; }, 2000);
    });
  }

  static renderCanvas(canvas, data) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Background parchment
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#fbf8ea');
    grad.addColorStop(0.5, '#f4ecd0');
    grad.addColorStop(1, '#ebe0be');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Guilloche / Vintage Border
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#2b2317';
    ctx.strokeRect(20, 20, w - 40, h - 40);

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#c99738';
    ctx.strokeRect(32, 32, w - 64, h - 64);

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#2b2317';
    ctx.strokeRect(38, 38, w - 76, h - 76);

    // Header corner rosettes
    const corners = [[38, 38], [w - 38, 38], [38, h - 38], [w - 38, h - 38]];
    corners.forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#c99738';
      ctx.fill();
      ctx.strokeStyle = '#2b2317';
      ctx.stroke();
    });

    // Header Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#781d1d';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('OFFICIAL CERTIFICATION OF QUESTIONABLE LIFE CHOICES', w / 2, 75);

    ctx.fillStyle = '#1c1917';
    ctx.font = 'bold 42px "Times New Roman", serif';
    ctx.fillText('CERTIFIED KEYBOARD SURVIVOR', w / 2, 130);

    ctx.fillStyle = '#57534e';
    ctx.font = 'italic 17px Georgia, serif';
    ctx.fillText('This document certifies with 0% legal authority that', w / 2, 175);

    // Player Title / Name
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 32px Georgia, serif';
    ctx.fillText(data.title || 'Certified Button Masher', w / 2, 225);

    // Underline
    ctx.beginPath();
    ctx.moveTo(w / 2 - 220, 238);
    ctx.lineTo(w / 2 + 220, 238);
    ctx.strokeStyle = '#c99738';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Body description
    ctx.fillStyle = '#44403c';
    ctx.font = '16px Georgia, serif';
    ctx.fillText('has courageously endured and survived a completely unnecessary typing challenge,', w / 2, 275);
    ctx.fillText('despite their hardware actively conspiring against their mortal existence.', w / 2, 300);

    // Stats Grid Box
    const boxY = 330;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(100, boxY, w - 200, 100);
    ctx.strokeStyle = '#a8a29e';
    ctx.lineWidth = 1;
    ctx.strokeRect(100, boxY, w - 200, 100);

    const stats = [
      { label: 'FINAL SCORE', val: data.score.toLocaleString() },
      { label: 'TYPING SPEED', val: `${data.wpm} WPM` },
      { label: 'ACCURACY', val: `${data.accuracy}%` },
      { label: 'SANITY LEFT', val: `${data.sanity}%` },
      { label: 'KEYBOARD TRUST', val: `${data.trust}%` }
    ];

    const colW = (w - 200) / stats.length;
    stats.forEach((s, idx) => {
      const cx = 100 + idx * colW + colW / 2;
      ctx.fillStyle = '#78716c';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(s.label, cx, boxY + 35);

      ctx.fillStyle = '#b91c1c';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(s.val, cx, boxY + 70);
    });

    // Date & Signatures
    ctx.textAlign = 'left';
    ctx.fillStyle = '#44403c';
    ctx.font = '14px Georgia, serif';
    const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    ctx.fillText(`Conferred on: ${dateStr}`, 120, 490);
    ctx.fillText('Certified by: Bureau of Broken Keyboards', 120, 515);

    // Wax Seal
    const sealX = w / 2;
    const sealY = 490;
    ctx.beginPath();
    ctx.arc(sealX, sealY, 44, 0, Math.PI * 2);
    ctx.fillStyle = '#991b1b';
    ctx.fill();
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('OFFICIAL', sealX, sealY - 8);
    ctx.fillText('CURSED', sealX, sealY + 8);
    ctx.font = '9px monospace';
    ctx.fillText('★ APPROVED ★', sealX, sealY + 22);

    // Kevin Signature
    ctx.textAlign = 'right';
    ctx.fillStyle = '#1c1917';
    ctx.font = 'italic 26px "Brush Script MT", cursive, Georgia';
    ctx.fillText('Kevin from IT', w - 120, 485);
    ctx.font = '13px Georgia, serif';
    ctx.fillStyle = '#78716c';
    ctx.fillText('Chief Keyboard Saboteur', w - 120, 510);
  }
}
