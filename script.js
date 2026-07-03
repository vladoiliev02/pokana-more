// ====== EmailJS конфигурация ======
const EMAILJS_PUBLIC_KEY = "odTbFAwMDih_6SlqS";
const EMAILJS_SERVICE_ID = "service_og4k18q";
const EMAILJS_TEMPLATE_ID = "template_n6djirb";
// шаблон за известие „Симона отвори поканата“ (изпраща се до Влади)
const EMAILJS_OPENED_TEMPLATE_ID = "template_tbbdzk7";

const YT_VIDEO_ID = "azJBP0KT30o";

// ====== елементи ======
const screenEnvelope = document.getElementById("screen-envelope");
const screenInvite = document.getElementById("screen-invite");
const screenAccepted = document.getElementById("screen-accepted");
const openBtn = document.getElementById("open-btn");
const acceptBtn = document.getElementById("accept-btn");
const rejectBtn = document.getElementById("reject-btn");
const muteBtn = document.getElementById("mute-btn");
const emailStatus = document.getElementById("email-status");

function showScreen(screen) {
  [screenEnvelope, screenInvite, screenAccepted].forEach((s) =>
    s.classList.remove("active")
  );
  screen.classList.add("active");
}

// ====== плаващи декорации ======
const FLOATER_EMOJIS = ["🌊", "☀️", "🐚", "❤️", "🏖️", "🍹", "⛱️", "🐬"];
const floatersWrap = document.querySelector(".floaters");
for (let i = 0; i < 14; i++) {
  const f = document.createElement("span");
  f.className = "floater";
  f.textContent = FLOATER_EMOJIS[i % FLOATER_EMOJIS.length];
  f.style.left = Math.random() * 100 + "vw";
  f.style.animationDuration = 9 + Math.random() * 10 + "s";
  f.style.animationDelay = Math.random() * 12 + "s";
  f.style.fontSize = 1 + Math.random() * 1.2 + "rem";
  floatersWrap.appendChild(f);
}

// ====== музика (YouTube IFrame API) ======
let ytPlayer = null;
let ytReady = false;
let musicRequested = false;
let muted = false;

const ytScript = document.createElement("script");
ytScript.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(ytScript);

window.onYouTubeIframeAPIReady = function () {
  ytPlayer = new YT.Player("yt-player", {
    width: "1",
    height: "1",
    videoId: YT_VIDEO_ID,
    playerVars: {
      autoplay: 0,
      loop: 1,
      playlist: YT_VIDEO_ID,
      controls: 0,
      disablekb: 1,
      playsinline: 1,
    },
    events: {
      onReady: function () {
        ytReady = true;
        if (musicRequested) startMusic();
      },
      onStateChange: function (e) {
        // резервен цикъл, ако loop не сработи
        if (e.data === YT.PlayerState.ENDED) {
          ytPlayer.seekTo(0);
          ytPlayer.playVideo();
        }
      },
    },
  });
};

// iOS Safari разрешава звук само по време на самото докосване и обикновено
// изисква стартиране в режим „mute“, след което може да се пусне звукът.
// Затова пускаме заглушено веднага в жеста, после отглушаваме, и повтаряме
// опитите докато плеърът стане готов.
let startAttempts = 0;
function startMusic() {
  muteBtn.classList.remove("hidden");
  if (!ytReady || !ytPlayer || typeof ytPlayer.playVideo !== "function") {
    if (startAttempts++ < 40) setTimeout(startMusic, 150);
    return;
  }
  ytPlayer.setVolume(70);
  // старт заглушено (позволено на iOS), после отглушаване
  ytPlayer.mute();
  ytPlayer.playVideo();
  if (!muted) {
    setTimeout(function () {
      ytPlayer.unMute();
      ytPlayer.setVolume(70);
    }, 350);
  }
}

function updateMuteBtn() {
  muteBtn.textContent = muted ? "🔇" : "🔊";
}

muteBtn.addEventListener("click", function () {
  if (!ytPlayer) return;
  muted = !muted;
  if (muted) {
    ytPlayer.mute();
  } else {
    ytPlayer.unMute();
    ytPlayer.setVolume(70);
    ytPlayer.playVideo();
  }
  updateMuteBtn();
});

// ====== известие „Симона отвори поканата“ ======
function notifyOpened() {
  if (
    typeof emailjs === "undefined" ||
    EMAILJS_OPENED_TEMPLATE_ID === "YOUR_OPENED_TEMPLATE_ID"
  ) {
    return;
  }
  emailjs
    .send(EMAILJS_SERVICE_ID, EMAILJS_OPENED_TEMPLATE_ID, {
      time: new Date().toLocaleString("bg-BG"),
    })
    .catch(function (err) {
      console.error("EmailJS opened-notify error:", err);
    });
}

// ====== отваряне на поканата ======
openBtn.addEventListener("click", function () {
  musicRequested = true;
  startMusic();
  notifyOpened();
  showScreen(screenInvite);
});

// ====== бягащ бутон „Отказвам“ ======
const TAUNTS = ["Отказвам ❌", "Пробвай пак 😏", "Няма как 🙃", "Сериозно? 😅", "Приеми де 🥺", "По-бърза съм 💨"];
let tauntIdx = 0;
const DODGE_RADIUS = 110;
const EDGE_PAD = 12;

function makeFixed() {
  if (rejectBtn.dataset.fixed) return;
  const rect = rejectBtn.getBoundingClientRect();
  rejectBtn.style.position = "fixed";
  rejectBtn.style.left = rect.left + "px";
  rejectBtn.style.top = rect.top + "px";
  rejectBtn.style.zIndex = "40";
  rejectBtn.style.margin = "0";
  rejectBtn.dataset.fixed = "1";
}

function overlaps(a, b, gap) {
  return !(
    a.right + gap < b.left ||
    a.left - gap > b.right ||
    a.bottom + gap < b.top ||
    a.top - gap > b.bottom
  );
}

function dodge(fromX, fromY) {
  makeFixed();
  const bw = rejectBtn.offsetWidth;
  const bh = rejectBtn.offsetHeight;
  const maxX = window.innerWidth - bw - EDGE_PAD;
  const maxY = window.innerHeight - bh - EDGE_PAD;
  const acceptRect = acceptBtn.getBoundingClientRect();

  let best = null;
  for (let i = 0; i < 30; i++) {
    const x = EDGE_PAD + Math.random() * Math.max(1, maxX - EDGE_PAD);
    const y = EDGE_PAD + Math.random() * Math.max(1, maxY - EDGE_PAD);
    const cx = x + bw / 2;
    const cy = y + bh / 2;
    const dist = Math.hypot(cx - fromX, cy - fromY);
    const candidate = { left: x, top: y, right: x + bw, bottom: y + bh };
    if (overlaps(candidate, acceptRect, 20)) continue;
    if (!best || dist > best.dist) best = { x, y, dist };
    if (dist > 220) break;
  }
  if (best) {
    rejectBtn.style.left = best.x + "px";
    rejectBtn.style.top = best.y + "px";
  }
}

function taunt() {
  tauntIdx = (tauntIdx + 1) % TAUNTS.length;
  rejectBtn.textContent = TAUNTS[tauntIdx];
}

// десктоп: бяга при приближаване на мишката
document.addEventListener("mousemove", function (e) {
  if (!screenInvite.classList.contains("active")) return;
  const rect = rejectBtn.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  if (Math.hypot(e.clientX - cx, e.clientY - cy) < DODGE_RADIUS) {
    dodge(e.clientX, e.clientY);
  }
});

// телефон: бяга още при докосване, преди click
["touchstart", "pointerdown"].forEach(function (evt) {
  rejectBtn.addEventListener(
    evt,
    function (e) {
      e.preventDefault();
      const p = e.touches ? e.touches[0] : e;
      dodge(p.clientX, p.clientY);
      taunt();
    },
    { passive: false }
  );
});

// последна защита: дори да се стигне до click, не прави нищо лошо
rejectBtn.addEventListener("click", function (e) {
  e.preventDefault();
  dodge(window.innerWidth / 2, window.innerHeight / 2);
  taunt();
});

// ====== приемане ======
let emailSent = false;

function sendEmail() {
  if (EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY") {
    console.warn("EmailJS не е конфигуриран още.");
    emailStatus.textContent = "";
    return;
  }
  if (emailSent) return;
  emailStatus.textContent = "Изпращане на официалните условия... 📨";
  emailjs
    .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID)
    .then(function () {
      emailSent = true;
      emailStatus.textContent = "Имейлът е изпратен успешно! ✅";
    })
    .catch(function (err) {
      console.error("EmailJS error:", err);
      emailStatus.innerHTML =
        'Имейлът се забави в трафика по Черноморието... <span class="retry-link" id="retry-email">Опитай пак</span>';
      document
        .getElementById("retry-email")
        .addEventListener("click", sendEmail);
    });
}

function confettiBurst() {
  const emojis = ["🎉", "❤️", "🌊", "☀️", "🥂", "💙", "✨"];
  for (let i = 0; i < 40; i++) {
    const c = document.createElement("span");
    c.className = "confetti";
    c.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    c.style.left = Math.random() * 100 + "vw";
    c.style.animationDuration = 2.5 + Math.random() * 3 + "s";
    c.style.animationDelay = Math.random() * 1.5 + "s";
    document.body.appendChild(c);
    setTimeout(function () {
      c.remove();
    }, 7000);
  }
}

acceptBtn.addEventListener("click", function () {
  showScreen(screenAccepted);
  confettiBurst();
  sendEmail();
});

if (typeof emailjs !== "undefined" && EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY") {
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}
