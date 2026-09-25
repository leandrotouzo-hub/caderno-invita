// Caderno Interativo de Estudo - Invita
// Login (Firebase Auth) + registro de acessos e tempo conectado (Firestore).
//
// PREENCHER: cole aqui o objeto de configuração do seu projeto Firebase
// (Console Firebase > Configurações do projeto > Seus apps > Config).
const firebaseConfig = {
  apiKey: "__FIREBASE_API_KEY__",
  authDomain: "__FIREBASE_AUTH_DOMAIN__",
  projectId: "__FIREBASE_PROJECT_ID__",
  storageBucket: "__FIREBASE_STORAGE_BUCKET__",
  messagingSenderId: "__FIREBASE_SENDER_ID__",
  appId: "__FIREBASE_APP_ID__",
};

const HEARTBEAT_MS = 60000; // atualiza o tempo conectado a cada 60s

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, collection, addDoc, updateDoc,
  serverTimestamp, getDocs
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginOverlay = document.getElementById("loginOverlay");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const appRoot = document.getElementById("app");
const adminOverlay = document.getElementById("adminOverlay");
const adminBody = document.getElementById("adminBody");
const btnAdminPanel = document.getElementById("btnAdminPanel");
const btnCloseAdmin = document.getElementById("btnCloseAdmin");
const btnLogout = document.getElementById("btnLogout");

appRoot.style.display = "none";

let currentSessionRef = null;
let sessionStartMs = null;
let heartbeatTimer = null;
let isAdminUser = false;

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const submitBtn = loginForm.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    loginError.textContent = "E-mail ou senha inválidos.";
  } finally {
    submitBtn.disabled = false;
  }
});

btnLogout?.addEventListener("click", async () => {
  await endSession();
  await signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginOverlay.style.display = "none";
    appRoot.style.display = "";
    await startSession(user);
    await checkAdmin(user);
  } else {
    stopHeartbeat();
    loginOverlay.style.display = "flex";
    appRoot.style.display = "none";
  }
});

async function startSession(user) {
  sessionStartMs = Date.now();
  try {
    currentSessionRef = await addDoc(collection(db, "sessions"), {
      uid: user.uid,
      email: user.email,
      startedAt: serverTimestamp(),
      lastPing: serverTimestamp(),
      durationSec: 0,
    });
  } catch (e) {
    console.error("Não foi possível registrar a sessão:", e);
    return;
  }
  heartbeatTimer = setInterval(pingSession, HEARTBEAT_MS);
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("beforeunload", () => { endSession(); });
}

function pingSession() {
  if (!currentSessionRef || document.hidden) return;
  const durationSec = Math.round((Date.now() - sessionStartMs) / 1000);
  updateDoc(currentSessionRef, { lastPing: serverTimestamp(), durationSec }).catch(() => {});
}

function onVisibilityChange() {
  if (!document.hidden) pingSession();
}

function stopHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = null;
}

async function endSession() {
  if (!currentSessionRef) return;
  const durationSec = Math.round((Date.now() - sessionStartMs) / 1000);
  try {
    await updateDoc(currentSessionRef, { durationSec, endedAt: serverTimestamp() });
  } catch (e) { /* ignore */ }
  stopHeartbeat();
  currentSessionRef = null;
}

async function checkAdmin(user) {
  isAdminUser = false;
  try {
    const snap = await getDoc(doc(db, "roles", user.uid));
    isAdminUser = snap.exists() && snap.data().role === "admin";
  } catch (e) { /* ignore */ }
  btnAdminPanel.style.display = isAdminUser ? "flex" : "none";
}

btnAdminPanel?.addEventListener("click", openAdminPanel);
btnCloseAdmin?.addEventListener("click", () => { adminOverlay.style.display = "none"; });

async function openAdminPanel() {
  adminOverlay.style.display = "flex";
  adminBody.innerHTML = "<p>Carregando...</p>";
  let snap;
  try {
    snap = await getDocs(collection(db, "sessions"));
  } catch (e) {
    adminBody.innerHTML = "<p>Não foi possível carregar os acessos.</p>";
    return;
  }
  const byUser = {};
  snap.forEach((d) => {
    const s = d.data();
    const key = s.email || s.uid;
    if (!byUser[key]) byUser[key] = { count: 0, totalSec: 0, last: null };
    byUser[key].count++;
    byUser[key].totalSec += s.durationSec || 0;
    const started = s.startedAt ? s.startedAt.toDate() : null;
    if (started && (!byUser[key].last || started > byUser[key].last)) byUser[key].last = started;
  });
  const rows = Object.entries(byUser).sort((a, b) => b[1].count - a[1].count);

  if (rows.length === 0) {
    adminBody.innerHTML = "<p>Ainda não há acessos registrados.</p>";
    return;
  }

  let html = '<table class="admin-table"><thead><tr>' +
    "<th>Vendedor</th><th>Acessos</th><th>Tempo médio</th><th>Tempo total</th><th>Último acesso</th>" +
    "</tr></thead><tbody>";
  rows.forEach(([email, s]) => {
    const avg = s.count ? Math.round(s.totalSec / s.count) : 0;
    html += `<tr><td>${escapeHtml(email)}</td><td>${s.count}</td><td>${fmtDuration(avg)}</td><td>${fmtDuration(s.totalSec)}</td><td>${s.last ? s.last.toLocaleString("pt-BR") : "—"}</td></tr>`;
  });
  html += "</tbody></table>";
  html += '<button id="btnExportCsv" class="btn-gold" style="margin-top:18px; width:auto; display:inline-flex;">Exportar CSV</button>';
  adminBody.innerHTML = html;
  document.getElementById("btnExportCsv").addEventListener("click", () => exportCsv(rows));
}

function fmtDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m} min ${s}s`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function exportCsv(rows) {
  let csv = "Vendedor,Acessos,Tempo medio (s),Tempo total (s),Ultimo acesso\n";
  rows.forEach(([email, s]) => {
    const avg = s.count ? Math.round(s.totalSec / s.count) : 0;
    csv += `${email},${s.count},${avg},${s.totalSec},${s.last ? s.last.toISOString() : ""}\n`;
  });
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "acessos_caderno_invita.csv";
  a.click();
  URL.revokeObjectURL(url);
}
