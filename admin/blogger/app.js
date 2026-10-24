import { resolvePublicUrl } from "./urls.js";

const $ = (selector) => document.querySelector(selector);
const state = { token: localStorage.getItem("agama-blogger-token") || "", posts: [], activeSlug: null, dirty: false, config: null };
const fields = ["title", "slug", "description", "date", "category", "author", "image"];

boot();

async function boot() {
  try { state.config = await fetch("/api/blogger/config").then(expectJson); }
  catch { return showLogin("El Blogger no está disponible en este momento."); }
  if (!state.token) return showLogin();
  try { await loadPosts(); showApp(); } catch { logout(); }
}

$("#loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  $("#loginError").textContent = "Comprobando acceso…";
  try {
    const response = await fetch(`${state.config.supabaseUrl.replace(/\/$/, "")}/auth/v1/token?grant_type=password`, {
      method: "POST", headers: { apikey: state.config.supabaseAnonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email: $("#loginEmail").value, password: $("#loginPassword").value }),
    }).then(expectJson);
    state.token = response.access_token;
    localStorage.setItem("agama-blogger-token", state.token);
    await loadPosts(); showApp();
  } catch (error) { $("#loginError").textContent = error.message || "No se pudo iniciar sesión."; }
});

$("#logout").addEventListener("click", logout);
$("#newPost").addEventListener("click", () => { if (discard()) newPost(); });
$("#save").addEventListener("click", () => action("Guardando borrador…", () => save("draft")));
$("#publish").addEventListener("click", () => action("Publicando…", publish));
$("#search").addEventListener("input", renderList);
$("#body").addEventListener("input", markDirty);
for (const id of fields) $("#" + id).addEventListener("input", markDirty);
for (const button of document.querySelectorAll("[data-command]")) button.addEventListener("click", () => { document.execCommand(button.dataset.command); $("#body").focus(); markDirty(); });
for (const button of document.querySelectorAll("[data-tag]")) button.addEventListener("click", () => { document.execCommand("formatBlock", false, button.dataset.tag); $("#body").focus(); markDirty(); });
$("#imageUpload").addEventListener("change", uploadImage);
window.addEventListener("beforeunload", (event) => { if (state.dirty) { event.preventDefault(); event.returnValue = ""; } });

async function loadPosts() {
  state.posts = (await api("/api/blogger/posts")).posts;
  renderList();
  if (state.posts[0]) await openPost(state.posts[0].slug); else newPost();
}

function renderList() {
  const query = $("#search").value.trim().toLowerCase();
  $("#postList").innerHTML = "";
  state.posts.filter((post) => `${post.title} ${post.slug}`.toLowerCase().includes(query)).forEach((post) => {
    const button = document.createElement("button");
    button.className = `post-card${post.slug === state.activeSlug ? " active" : ""}`;
    button.innerHTML = `<strong>${escapeHtml(post.title)}</strong><span>${post.status === "published" ? "Publicado" : "Borrador"} · ${post.words} palabras</span>`;
    button.addEventListener("click", () => { if (discard()) openPost(post.slug); });
    $("#postList").append(button);
  });
}

async function openPost(slug) {
  const post = await api(`/api/blogger/posts/${slug}`);
  state.activeSlug = post.slug;
  for (const id of fields) $("#" + id).value = post.meta[id] || "";
  $("#body").innerHTML = post.body || "";
  $("#heading").textContent = post.meta.title || "Editor";
  $("#view").href = resolvePublicUrl(post.url); $("#view").hidden = post.meta.status !== "published";
  $("#status").textContent = post.meta.status === "published" ? "Publicado" : "Borrador";
  state.dirty = false; renderList();
}

function newPost() {
  state.activeSlug = null;
  for (const id of fields) $("#" + id).value = "";
  $("#date").value = new Date().toISOString().slice(0, 10); $("#category").value = "Blog"; $("#author").value = "AGAMA";
  $("#body").innerHTML = "<h2>Nuevo artículo</h2><p>Escribe aquí…</p>";
  $("#heading").textContent = "Nuevo post"; $("#view").hidden = true; $("#status").textContent = "Nuevo borrador"; state.dirty = false; renderList();
}

async function save(status) {
  const payload = Object.fromEntries(fields.map((id) => [id, $("#" + id).value]));
  payload.body = $("#body").innerHTML; payload.status = status; payload.format = "html";
  const endpoint = state.activeSlug ? `/api/blogger/posts/${state.activeSlug}` : "/api/blogger/posts";
  const post = await api(endpoint, { method: state.activeSlug ? "PUT" : "POST", body: payload });
  state.activeSlug = post.slug; state.dirty = false;
  state.posts = (await api("/api/blogger/posts")).posts; await openPost(post.slug); return post;
}

async function publish() { const post = await save("draft"); await api(`/api/blogger/posts/${post.slug}/publish`, { method: "POST", body: {} }); await loadPosts(); await openPost(post.slug); $("#status").textContent = "Publicado correctamente"; }

async function uploadImage(event) {
  if (!state.activeSlug) { $("#status").textContent = "Guarda el post antes de subir una imagen."; return; }
  const file = event.target.files[0]; if (!file) return;
  const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
  const image = await api(`/api/blogger/posts/${state.activeSlug}/images`, { method: "POST", body: { fileName: file.name, data } });
  document.execCommand("insertHTML", false, `<figure><img src="${escapeHtml(resolvePublicUrl(image.url))}" alt=""><figcaption></figcaption></figure>`); markDirty(); event.target.value = "";
}

async function api(url, options = {}) {
  const headers = { Authorization: `Bearer ${state.token}`, ...(options.body ? { "Content-Type": "application/json" } : {}) };
  const response = await fetch(url, { ...options, headers, body: options.body ? JSON.stringify(options.body) : undefined });
  if (response.status === 401) logout();
  return expectJson(response);
}

async function expectJson(response) { const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || data.msg || "La operación ha fallado."); return data; }
async function action(message, callback) { $("#status").textContent = message; try { await callback(); } catch (error) { $("#status").textContent = error.message; } }
function markDirty() { state.dirty = true; $("#status").textContent = "Cambios sin guardar"; $("#heading").textContent = $("#title").value || "Nuevo post"; if (!state.activeSlug && !$("#slug").value) $("#slug").value = slugify($("#title").value); }
function discard() { return !state.dirty || confirm("Hay cambios sin guardar. ¿Quieres descartarlos?"); }
function showLogin(message = "") { $("#app").hidden = true; $("#login").hidden = false; $("#loginError").textContent = message; }
function showApp() { $("#login").hidden = true; $("#app").hidden = false; }
function logout() { state.token = ""; localStorage.removeItem("agama-blogger-token"); showLogin(); }
function slugify(value) { return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
function escapeHtml(value) { return String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]); }

