// Fake System Diagnostics Panel
export class DiagnosticsPanel {
  constructor(containerEl) {
    this.container = containerEl;
    this.keysPressed = 0;
    this.keysUnderstood = 0;
    this.keysRespected = 0;
    this.keyboardTrust = 3; // Starts optimistically at 3%
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="diag-card">
        <div class="diag-header">
          <span class="diag-icon">⚡</span>
          <span class="diag-title">KEYBOARD DIAGNOSTICS</span>
          <span class="diag-live-dot"></span>
        </div>
        <div class="diag-body">
          <div class="diag-status-row" id="diag-status-row">
            <span class="status-pill status-detected active">🟢 Detected</span>
            <span class="status-pill status-questionable">🟡 Questionable</span>
            <span class="status-pill status-unstable">🔴 Emotionally Unstable</span>
          </div>
          <div class="diag-metrics">
            <div class="diag-metric">
              <span class="metric-label">Keys pressed:</span>
              <span class="metric-val" id="diag-pressed">0</span>
            </div>
            <div class="diag-metric">
              <span class="metric-label">Keys understood:</span>
              <span class="metric-val" id="diag-understood">0</span>
            </div>
            <div class="diag-metric">
              <span class="metric-label">Keys respected:</span>
              <span class="metric-val zero-val" id="diag-respected">0</span>
            </div>
            <div class="diag-metric">
              <span class="metric-label">Keyboard trust:</span>
              <span class="metric-val trust-val" id="diag-trust">3%</span>
            </div>
            <div class="diag-metric">
              <span class="metric-label">Keyboard Mood:</span>
              <span class="metric-val" id="diag-mood">😐 Questionable</span>
            </div>
            <div class="diag-metric">
              <span class="metric-label">Player Skill:</span>
              <span class="metric-val" id="diag-skill">🗿 Under Investigation</span>
            </div>
            <div class="diag-metric">
              <span class="metric-label">Computer Confidence:</span>
              <span class="metric-val" id="diag-conf" style="color: #ff7b72;">-37%</span>
            </div>
            <div class="diag-metric">
              <span class="metric-label">IT Department:</span>
              <span class="metric-val" id="diag-it" style="font-size: 0.75rem; color: var(--accent-color);">"We're watching."</span>
            </div>
          </div>
          <div class="diag-footer">
            <span class="diag-subtext">Telemetry streaming to dev/null</span>
          </div>
        </div>
      </div>
    `;

    this.pressedEl = this.container.querySelector('#diag-pressed');
    this.understoodEl = this.container.querySelector('#diag-understood');
    this.respectedEl = this.container.querySelector('#diag-respected');
    this.trustEl = this.container.querySelector('#diag-trust');
    this.moodEl = this.container.querySelector('#diag-mood');
    this.skillEl = this.container.querySelector('#diag-skill');
    this.confEl = this.container.querySelector('#diag-conf');
    this.itEl = this.container.querySelector('#diag-it');
    this.statusRow = this.container.querySelector('#diag-status-row');
  }

  updateMoodLabels(labels) {
    if (!labels) return;
    if (this.moodEl) this.moodEl.textContent = labels.mood;
    if (this.skillEl) this.skillEl.textContent = labels.skill;
    if (this.confEl) this.confEl.textContent = labels.confidence;
    if (this.itEl) this.itEl.textContent = labels.it;
  }

  recordKey(wasCorrect) {
    this.keysPressed++;
    if (wasCorrect) {
      this.keysUnderstood++;
      this.keyboardTrust = Math.min(25, this.keyboardTrust + 1);
    } else {
      this.keyboardTrust -= Math.floor(Math.random() * 4 + 2); // Drops into negatives
    }

    // Keys respected is strictly 0 (or occasionally drops to -1)
    if (this.keysPressed % 40 === 0) {
      this.keysRespected = -1;
    } else {
      this.keysRespected = 0;
    }

    this.updateUI();
  }

  updateUI() {
    if (this.pressedEl) this.pressedEl.textContent = this.keysPressed;
    if (this.understoodEl) this.understoodEl.textContent = this.keysUnderstood;
    if (this.respectedEl) this.respectedEl.textContent = this.keysRespected;
    if (this.trustEl) {
      this.trustEl.textContent = `${this.keyboardTrust}%`;
      if (this.keyboardTrust < 0) {
        this.trustEl.classList.add('negative-trust');
      } else {
        this.trustEl.classList.remove('negative-trust');
      }
    }

    // Adjust status pills
    if (this.statusRow) {
      const detected = this.statusRow.querySelector('.status-detected');
      const questionable = this.statusRow.querySelector('.status-questionable');
      const unstable = this.statusRow.querySelector('.status-unstable');

      detected?.classList.remove('active');
      questionable?.classList.remove('active');
      unstable?.classList.remove('active');

      if (this.keyboardTrust <= -20) {
        unstable?.classList.add('active');
      } else if (this.keyboardTrust <= 0) {
        questionable?.classList.add('active');
      } else {
        detected?.classList.add('active');
      }
    }
  }

  reset() {
    this.keysPressed = 0;
    this.keysUnderstood = 0;
    this.keysRespected = 0;
    this.keyboardTrust = 3;
    this.updateUI();
  }
}
