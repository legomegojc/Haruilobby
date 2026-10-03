import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  getDatabase,
  onValue,
  ref,
  set
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDvabzuuYSQ0HB0l7iDgCHiIKAzN8-B6y8",
  authDomain: "polpo-846d6.firebaseapp.com",
  databaseURL: "https://polpo-846d6-default-rtdb.firebaseio.com",
  projectId: "polpo-846d6",
  storageBucket: "polpo-846d6.firebasestorage.app",
  messagingSenderId: "380666503261",
  appId: "1:380666503261:web:f1386130f3d7d699b2adb4"
};

const defaults = {
  alphaName: "",
  alphaScore: 0,
  betaName: "",
  betaScore: 0,
  round: 1,
  game: 1
};

const params = new URLSearchParams(window.location.search);
const rawRoom = params.get("room") || "felice-haruiro";
const room = /^[a-zA-Z0-9_-]{1,64}$/.test(rawRoom) ? rawRoom : "felice-haruiro";

const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);
const auth = getAuth(firebaseApp);
const stateRef = ref(database, `feliceRooms/${room}/state`);

function normalizeState(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    alphaName: String(source.alphaName || "").slice(0, 24),
    alphaScore: Math.max(0, Number(source.alphaScore) || 0),
    betaName: String(source.betaName || "").slice(0, 24),
    betaScore: Math.max(0, Number(source.betaScore) || 0),
    round: Math.max(0, Number(source.round) || 0),
    game: Math.max(0, Number(source.game) || 0)
  };
}

function startOverlay() {
  const overlay = document.getElementById("overlay");

  if (params.get("preview") === "1") {
    overlay.classList.add("show-background");

    const fitPreview = () => {
      const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
      overlay.style.transformOrigin = "top left";
      overlay.style.transform = `scale(${scale})`;
    };

    fitPreview();
    window.addEventListener("resize", fitPreview);
  }

  const ids = {
    alphaName: "ovAlphaName",
    alphaScore: "ovAlphaScore",
    betaName: "ovBetaName",
    betaScore: "ovBetaScore",
    round: "ovRound",
    game: "ovGame"
  };

  const draw = (state) => {
    Object.entries(ids).forEach(([key, id]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = state[key];
    });
  };

  draw(defaults);
  onValue(stateRef, (snapshot) => draw(normalizeState(snapshot.val())), (error) => {
    console.error("Overlay sync failed:", error);
  });
}

function startController() {
  const $ = (id) => document.getElementById(id);
  let state = { ...defaults };
  let saveTimer;

  $("roomName").textContent = room;

  const overlayUrl = new URL("overlay.html", window.location.href);
  overlayUrl.searchParams.set("room", room);
  $("obsUrl").textContent = overlayUrl.href;

  const previewUrl = new URL("overlay.html", window.location.href);
  previewUrl.searchParams.set("preview", "1");
  previewUrl.searchParams.set("room", room);
  $("preview").src = previewUrl.href;

  const syncControls = () => {
    $("alphaName").value = state.alphaName;
    $("alphaScoreOut").textContent = state.alphaScore;
    $("betaName").value = state.betaName;
    $("betaScoreOut").textContent = state.betaScore;
    $("roundOut").textContent = state.round;
    $("gameOut").textContent = state.game;
  };

  const showSaveStatus = (message, isError = false) => {
    $("saveStatus").textContent = message;
    $("saveStatus").classList.toggle("error", isError);
  };

  const saveState = async () => {
    if (!auth.currentUser) {
      showSaveStatus("更新するにはログインしてください。", true);
      return;
    }

    try {
      await set(stateRef, normalizeState(state));
      showSaveStatus("OBSへ反映しました。");
    } catch (error) {
      console.error(error);
      showSaveStatus("保存できませんでした。データベースルールを確認してください。", true);
    }
  };

  const scheduleSave = () => {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(saveState, 150);
  };

  onValue(stateRef, (snapshot) => {
    state = snapshot.exists() ? normalizeState(snapshot.val()) : { ...defaults };
    syncControls();
  }, (error) => {
    console.error(error);
    showSaveStatus("データを読み込めませんでした。", true);
  });

  document.querySelectorAll("[data-step]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.step;
      state[key] = Math.max(0, Number(state[key]) + Number(button.dataset.delta));
      syncControls();
      saveState();
    });
  });

  ["alphaName", "betaName"].forEach((id) => {
    $(id).addEventListener("input", (event) => {
      state[id] = event.target.value.slice(0, 24);
      scheduleSave();
    });
  });

  $("reset").addEventListener("click", () => {
    state = { ...defaults };
    syncControls();
    saveState();
  });

  $("login").addEventListener("click", async () => {
    $("authStatus").textContent = "ログイン中…";
    try {
      await signInWithEmailAndPassword(auth, $("email").value.trim(), $("password").value);
      $("password").value = "";
    } catch (error) {
      console.error(error);
      $("authStatus").textContent = "ログインできませんでした。入力内容を確認してください。";
    }
  });

  $("password").addEventListener("keydown", (event) => {
    if (event.key === "Enter") $("login").click();
  });

  $("logout").addEventListener("click", () => signOut(auth));

  onAuthStateChanged(auth, (user) => {
    $("controls").disabled = !user;
    $("login").hidden = Boolean(user);
    $("logout").hidden = !user;
    $("email").disabled = Boolean(user);
    $("password").disabled = Boolean(user);
    $("authStatus").textContent = user ? `ログイン中：${user.email}` : "未ログイン";
    showSaveStatus(user ? "操作内容は自動でOBSへ反映されます。" : "操作するにはログインしてください。", !user);
  });

  syncControls();
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("overlay")) startOverlay();
  if (document.getElementById("preview")) startController();
});
