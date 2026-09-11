// Cinematic Movie Mode Orchestrator
import { soundEngine } from '../audio/soundEngine.js';

const MOVIE_PRELUDES = [
  { tagline: "IN A WORLD...", subtitle: "where keyboards cannot be trusted...", hero: "ONE STUDENT" },
  { tagline: "THE SUMMER BLOCKBUSTER NOBODY ASKED FOR...", subtitle: "when backspace is no longer an option...", hero: "ONE DESPERATE TYPIST" },
  { tagline: "FROM THE PRODUCERS OF 'BLUE SCREEN OF DEATH'...", subtitle: "comes a thriller of catastrophic typos...", hero: "A LONE SURVIVOR" },
  { tagline: "WHEN THE WIFI DROPPED...", subtitle: "and the deadline was 11:59 PM...", hero: "THE CHOSEN MASHER" }
];

export class MovieModeUI {
  static async playIntroSequence(targetSentence) {
    soundEngine.playDramaticBoom();

    const prelude = MOVIE_PRELUDES[Math.floor(Math.random() * MOVIE_PRELUDES.length)];

    const overlay = document.createElement('div');
    overlay.className = 'cursed-overlay-modal movie-intro-overlay';
    overlay.innerHTML = `
      <div class="movie-letterbox-top"></div>
      <div class="movie-cinematic-card">
        <div class="movie-pretitle">${prelude.tagline}</div>
        <div class="movie-subtitle">${prelude.subtitle}</div>
        <div class="movie-hero">${prelude.hero}</div>
        <div class="movie-task-label">MUST TYPE:</div>
        <div class="movie-quote">"${targetSentence}"</div>
        <div class="movie-countdown" id="movie-cd">3</div>
      </div>
      <div class="movie-letterbox-bottom"></div>
    `;

    document.body.appendChild(overlay);

    const cdEl = overlay.querySelector('#movie-cd');

    const countdown = async () => {
      for (let i = 3; i > 0; i--) {
        if (cdEl) cdEl.textContent = i;
        soundEngine.playCountdown(300 + (4 - i) * 120);
        await new Promise(r => setTimeout(r, 800));
      }
      if (cdEl) cdEl.textContent = "TYPE!";
      soundEngine.playDramaticBoom();
      await new Promise(r => setTimeout(r, 600));
      overlay.classList.add('fade-out');
      setTimeout(() => overlay.remove(), 400);
    };

    await countdown();
  }

  static showOutroBanner() {
    soundEngine.playDramaticBoom();
    const banner = document.createElement('div');
    banner.className = 'cursed-overlay-modal movie-outro-overlay';
    banner.innerHTML = `
      <div class="movie-outro-box">
        <div class="movie-outro-credits">AN UNSOLICITED PRODUCTION</div>
        <h1 class="movie-outro-title">COMING SOON TO A COMPUTER NEAR YOU</h1>
        <p class="movie-outro-sub">RATED PG-13 FOR LANGUAGE INDUCED BY BROKEN HARDWARE</p>
      </div>
    `;
    document.body.appendChild(banner);

    setTimeout(() => {
      banner.classList.add('fade-out');
      setTimeout(() => banner.remove(), 600);
    }, 2800);
  }
}
