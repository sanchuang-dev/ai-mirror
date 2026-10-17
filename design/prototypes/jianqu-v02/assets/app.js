/* 闺蜜机 · 首轮视觉方向探索 — 交互与舞台缩放 */
(function () {
  "use strict";

  var stage = document.getElementById("stage");
  var screens = Array.prototype.slice.call(document.querySelectorAll(".screen"));
  var dirButtons = Array.prototype.slice.call(document.querySelectorAll("[data-dir-btn]"));
  var screenTabs = Array.prototype.slice.call(document.querySelectorAll("[data-screen-btn]"));
  var modeButtons = Array.prototype.slice.call(document.querySelectorAll("[data-mode-btn]"));
  var adaptBtn = document.getElementById("adaptBtn");
  var adaptPanel = document.getElementById("adaptPanel");
  var debugBall = document.getElementById("debugBall");
  var debugPanel = document.getElementById("debugPanel");

  var state = { dir: "a", screen: "home", mode: "home" };
  var cloned = false;

  var BALL_KEY = "guimi:debugBall:v1";
  var dragState = null;
  var ballDragged = false;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function setBallPos(x, y) {
    if (!debugBall) return;
    var w = debugBall.offsetWidth || 48;
    var h = debugBall.offsetHeight || 48;
    var px = clamp(x, 4, Math.max(4, window.innerWidth - w - 4));
    var py = clamp(y, 4, Math.max(4, window.innerHeight - h - 4));
    debugBall.style.left = px + "px";
    debugBall.style.top = py + "px";
    debugBall.style.right = "auto";
    debugBall.style.bottom = "auto";
  }

  function saveBallPos() {
    if (!debugBall) return;
    try {
      localStorage.setItem(BALL_KEY, JSON.stringify({
        x: parseFloat(debugBall.style.left) || 0,
        y: parseFloat(debugBall.style.top) || 0
      }));
    } catch (_) {}
  }

  function positionPanel() {
    if (!debugPanel || debugPanel.hidden) return;
    var b = debugBall.getBoundingClientRect();
    var pw = debugPanel.offsetWidth;
    var ph = debugPanel.offsetHeight;
    var pad = 10;
    var left;
    if (b.left + b.width / 2 > window.innerWidth / 2) {
      left = b.left - pw - pad;
      if (left < 8) left = clamp(b.right + pad, 8, window.innerWidth - pw - 8);
    } else {
      left = b.right + pad;
      if (left + pw > window.innerWidth - 8) left = clamp(b.left - pw - pad, 8, window.innerWidth - pw - 8);
    }
    var top = clamp(b.top, 8, Math.max(8, window.innerHeight - ph - 8));
    debugPanel.style.left = left + "px";
    debugPanel.style.top = top + "px";
    debugPanel.style.right = "auto";
  }

  if (debugBall) {
    try {
      var saved = JSON.parse(localStorage.getItem(BALL_KEY) || "null");
      if (saved && isFinite(saved.x) && isFinite(saved.y)) setBallPos(saved.x, saved.y);
    } catch (_) {}

    debugBall.addEventListener("pointerdown", function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      dragState = {
        sx: e.clientX, sy: e.clientY,
        ox: parseFloat(debugBall.style.left) || debugBall.getBoundingClientRect().left,
        oy: parseFloat(debugBall.style.top) || debugBall.getBoundingClientRect().top,
        moved: false
      };
      try { debugBall.setPointerCapture(e.pointerId); } catch (_) {}
    });
    debugBall.addEventListener("pointermove", function (e) {
      if (!dragState) return;
      var dx = e.clientX - dragState.sx;
      var dy = e.clientY - dragState.sy;
      if (!dragState.moved && Math.abs(dx) + Math.abs(dy) > 5) {
        dragState.moved = true;
        debugBall.classList.add("is-dragging");
      }
      if (dragState.moved) {
        setBallPos(dragState.ox + dx, dragState.oy + dy);
        positionPanel();
      }
    });
    debugBall.addEventListener("pointerup", function (e) {
      if (!dragState) return;
      var moved = dragState.moved;
      dragState = null;
      debugBall.classList.remove("is-dragging");
      try { debugBall.releasePointerCapture(e.pointerId); } catch (_) {}
      if (moved) {
        ballDragged = true;
        setTimeout(function () { ballDragged = false; }, 350);
        saveBallPos();
        e.preventDefault();
      }
    });
  }

  /* ---------- 舞台缩放 ---------- */
  function fit() {
    var wrap = stage.parentElement;
    var pad = 28;
    var aw = wrap.clientWidth - pad;
    var ah = wrap.clientHeight - pad;
    var s = Math.min(aw / 1920, ah / 1080);
    if (!isFinite(s) || s <= 0) s = 1;
    stage.style.transform = "scale(" + s + ")";
  }

  /* ---------- 显示逻辑 ---------- */
  function paint() {
    screens.forEach(function (el) {
      var on = el.dataset.dir === state.dir && el.dataset.screen === state.screen;
      el.classList.toggle("is-on", on);
    });
    dirButtons.forEach(function (b) {
      var on = b.dataset.dirBtn === state.dir;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    modeButtons.forEach(function (b) {
      var on = b.dataset.modeBtn === state.mode;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    screenTabs.forEach(function (b) {
      var inMode = b.dataset.mode === state.mode;
      b.hidden = !inMode;
      var on = inMode && b.dataset.screenBtn === state.screen;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    if (state.dir === "compare") buildCompare();
  }

  function defaultScreen() {
    return state.mode === "community" ? "public" : "home";
  }

  function setMode(mode) {
    state.mode = mode;
    if (state.dir !== "compare") {
      var allowed = mode === "community" ? ["public"] : ["home", "video", "ai", "course"];
      if (allowed.indexOf(state.screen) === -1) state.screen = defaultScreen();
    }
    paint();
  }

  function setDir(dir) {
    state.dir = dir;
    if (dir === "compare") {
      state.screen = "compare";
    } else if (state.screen === "compare") {
      state.screen = defaultScreen();
    }
    paint();
  }

  function setScreen(screen) {
    if (state.dir === "compare") state.dir = "a";
    state.screen = screen;
    paint();
  }

  /* 产品内跳转：data-goto="home|video|ai|course|public" */
  function goTo(screen) {
    if (screen === "public") state.mode = "community";
    else if (screen !== "compare") state.mode = "home";
    if (state.dir === "compare") state.dir = "a";
    state.screen = screen;
    paint();
  }

  /* ---------- A／B 首页对照：克隆两侧首页 ---------- */
  function buildCompare() {
    ["a", "b"].forEach(function (dir) {
      var host = document.querySelector('.cmp-scaler[data-cmp-clone="' + dir + '"]');
      if (!host || host.dataset.built === "1") return;
      var source = document.querySelector('.screen[data-dir="' + dir + '"][data-screen="home"]');
      if (!source) return;
      var clone = source.cloneNode(true);
      clone.classList.add("is-on");
      clone.removeAttribute("aria-label");
      host.appendChild(clone);
      host.dataset.built = "1";
    });
    scaleCompare();
  }

  function scaleCompare() {
    Array.prototype.slice.call(document.querySelectorAll(".cmp-scaler")).forEach(function (host) {
      var s = host.clientWidth / 1920;
      if (!isFinite(s) || s <= 0) s = 1;
      var clone = host.querySelector(".screen");
      if (clone) clone.style.transform = "scale(" + s + ")";
      host.style.height = Math.round(1080 * s) + "px";
    });
  }

  /* ---------- 通用交互 ---------- */
  function groupToggle(el, selector) {
    var group = el.parentElement.querySelectorAll(selector);
    Array.prototype.forEach.call(group, function (n) { n.classList.toggle("is-on", n === el); });
  }

  document.addEventListener("click", function (e) {
    var t = e.target;

    var modeBtn = t.closest("[data-mode-btn]");
    if (modeBtn) { setMode(modeBtn.dataset.modeBtn); return; }

    var dirBtn = t.closest("[data-dir-btn]");
    if (dirBtn) { setDir(dirBtn.dataset.dirBtn); return; }

    var tab = t.closest("[data-screen-btn]");
    if (tab) { setScreen(tab.dataset.screenBtn); return; }

    var nav = t.closest(".a-navitem, .b-dockitem");
    if (nav) {
      var sel = nav.classList.contains("a-navitem") ? ".a-navitem" : ".b-dockitem";
      groupToggle(nav, sel);
      if (nav.dataset.goto) goTo(nav.dataset.goto);
      return;
    }

    var goEl = t.closest("[data-goto]");
    if (goEl) { goTo(goEl.dataset.goto); return; }

    var style = t.closest(".a-stylechip, .b-stylechip");
    if (style) {
      var ssel = style.classList.contains("a-stylechip") ? ".a-stylechip" : ".b-stylechip";
      groupToggle(style, ssel);
      return;
    }

    var ep = t.closest(".a-ep, .b-ep");
    if (ep) {
      var esel = ep.classList.contains("a-ep") ? ".a-ep" : ".b-ep";
      groupToggle(ep, esel);
      return;
    }

    var teach = t.closest(".a-teacher, .b-teacher");
    if (teach) {
      var list = teach.parentElement.querySelectorAll(".a-teacher, .b-teacher");
      Array.prototype.forEach.call(list, function (n) { n.classList.toggle("is-on", n === teach); });
      var parts = (teach.dataset.teacher || "").split("|");
      var screen = teach.closest(".screen");
      if (screen && parts.length === 2) {
        var nameEl = screen.querySelector(".a-presenter-name, .b-presenter-name");
        var styleEl = screen.querySelector(".a-presenter-style, .b-presenter-style");
        var avaEl = screen.querySelector(".a-presenter-ava, .b-presenter-ava");
        if (nameEl) nameEl.textContent = parts[0];
        if (styleEl) styleEl.textContent = parts[1];
        if (avaEl) avaEl.textContent = parts[0].charAt(0);
      }
      return;
    }

    var q = t.closest(".a-qchip, .b-qchip");
    if (q) {
      var statusEl = q.closest(".screen").querySelector(".a-ai-status-text, .b-ai-status p");
      if (statusEl) statusEl.textContent = q.textContent.trim();
      return;
    }

    var signup = t.closest(".act-signup");
    if (signup) {
      if (signup.classList.contains("is-signed")) {
        signup.classList.remove("is-signed");
        signup.textContent = signup.dataset.orig || "报名";
      } else {
        signup.dataset.orig = signup.textContent;
        signup.classList.add("is-signed");
        signup.textContent = "已报名 ✓";
      }
      return;
    }

    var toggle = t.closest("[data-toggle]");
    if (toggle) {
      var panel = toggle.parentElement.querySelector('[data-panel="' + toggle.dataset.toggle + '"]');
      if (panel) panel.hidden = !panel.hidden;
      return;
    }

    if (t.closest("#debugBall")) {
      if (ballDragged) return;
      var dbgOpen = debugPanel.hidden;
      if (dbgOpen) {
        debugPanel.hidden = false;
        positionPanel();
      } else {
        debugPanel.hidden = true;
      }
      debugBall.setAttribute("aria-expanded", dbgOpen ? "true" : "false");
      return;
    }
    if (t.closest("#debugClose")) {
      debugPanel.hidden = true;
      debugBall.setAttribute("aria-expanded", "false");
      return;
    }

    if (t.closest("#adaptBtn")) {
      var open = adaptPanel.hidden;
      adaptPanel.hidden = !open;
      adaptBtn.setAttribute("aria-expanded", open ? "true" : "false");
      return;
    }
    if (!t.closest("#debugPanel") && !t.closest("#debugBall") && debugPanel && !debugPanel.hidden) {
      debugPanel.hidden = true;
      debugBall.setAttribute("aria-expanded", "false");
    }
    if (!t.closest("#adaptPanel") && adaptPanel && !adaptPanel.hidden && !t.closest("#adaptBtn")) {
      adaptPanel.hidden = true;
      adaptBtn.setAttribute("aria-expanded", "false");
    }
  });

  window.addEventListener("resize", function () {
    fit(); scaleCompare();
    if (debugBall && debugBall.style.left) {
      setBallPos(parseFloat(debugBall.style.left) || 0, parseFloat(debugBall.style.top) || 0);
    }
    positionPanel();
  });
  window.addEventListener("load", function () { fit(); });

  paint();
  fit();
  scaleCompare();
})();
