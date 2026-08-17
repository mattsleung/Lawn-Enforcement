const SUPABASE_URL = "https://iuhdowdkolpazspitnmf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_N5v-25TPjipoqs8qT1ZwtQ_9BXI1HMY";
const CLOUD_SESSION_KEY = "lawn-enforcement-cloud-session";

export class CloudSaveClient {
  constructor(game) {
    this.game = game;
    this.session = null;
    this.saveTimer = null;
    this.modal = document.querySelector("#account-modal");
    this.status = document.querySelector("#account-status");
    this.email = document.querySelector("#account-email");
    this.username = document.querySelector("#account-username");
    this.password = document.querySelector("#account-password");
    this.confirmPassword = document.querySelector("#account-password-confirm");
  }

  async start() {
    this.bindUi();
    this.restoreConfirmationSession();
    this.session = this.readSession();
    if (this.session && !(await this.ensureSession())) this.clearSession();
    if (this.session?.access_token && !this.session.user) await this.hydrateUser();
    else if (this.session?.user && !this.game.developerBuild) await this.syncAfterLogin();
    this.updateStatus();
    window.addEventListener("lawn-save", (event) => this.queueSave(event.detail));
  }

  bindUi() {
    document.querySelector("#account-button")?.addEventListener("click", () => {
      this.modal?.showModal(); this.updateStatus();
    });
    document.querySelector("#account-close")?.addEventListener("click", () => { this.clearSensitiveInputs(); this.modal?.close(); });
    document.querySelector("#account-signup")?.addEventListener("click", () => this.signUp());
    document.querySelector("#account-signin")?.addEventListener("click", () => this.signIn());
    document.querySelector("#account-signout")?.addEventListener("click", () => this.signOut());
  }

  async request(path, { method = "GET", body, token = null, prefer = null } = {}) {
    const headers = { apikey: SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (prefer) headers.Prefer = prefer;
    const response = await fetch(`${SUPABASE_URL}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const payload = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.msg || payload?.message || payload?.error_description || "Account request failed");
    return payload;
  }

  async signUp() {
    const email = this.email.value.trim(); const username = this.username.value.trim();
    const password = this.password.value; const confirmation = this.confirmPassword.value;
    if (!/^\S+@\S+\.\S+$/.test(email)) return this.setStatus("Enter a valid email address.", true);
    if (!/^[A-Za-z0-9_-]{3,20}$/.test(username)) return this.setStatus("Username must be 3–20 letters, numbers, _ or -.", true);
    if (password.length < 10) return this.setStatus("Password must be at least 10 characters.", true);
    if (password !== confirmation) return this.setStatus("Password confirmation does not match.", true);
    try {
      const redirect = encodeURIComponent(window.location.href.split("#")[0]);
      await this.request(`/auth/v1/signup?redirect_to=${redirect}`, {
        method: "POST",
        body: { email, password, data: { username } },
      });
      this.clearSensitiveInputs();
      this.setStatus("Confirmation sent. Check your email, then return here to sign in.");
    } catch (error) { this.setStatus(error.message, true); }
  }

  async signIn() {
    if (this.game.developerBuild) return this.setStatus("Cloud sync is disabled on localhost so developer unlocks cannot reach public accounts.", true);
    const email = this.email.value.trim(); const password = this.password.value;
    try {
      const session = await this.request("/auth/v1/token?grant_type=password", { method: "POST", body: { email, password } });
      this.clearSensitiveInputs(); this.setSession(session); await this.syncAfterLogin(); this.updateStatus();
    } catch (error) { this.setStatus(error.message, true); }
  }

  async signOut() {
    if (this.session?.access_token) {
      await this.request("/auth/v1/logout", { method: "POST", token: this.session.access_token }).catch(() => {});
    }
    this.clearSession(); this.updateStatus();
  }

  async ensureSession() {
    if (!this.session?.refresh_token) return false;
    if ((this.session.expires_at ?? 0) * 1000 > Date.now() + 60_000) return true;
    try {
      const refreshed = await this.request("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: this.session.refresh_token } });
      this.setSession(refreshed); return true;
    } catch { return false; }
  }

  async hydrateUser() {
    try {
      const user = await this.request("/auth/v1/user", { token: this.session.access_token });
      this.session.user = user; localStorage.setItem(CLOUD_SESSION_KEY, JSON.stringify(this.session));
      await this.syncAfterLogin();
    } catch { this.clearSession(); }
  }

  async syncAfterLogin() {
    if (!await this.ensureSession()) return;
    const userId = this.session.user.id;
    const rows = await this.request(`/rest/v1/game_saves?user_id=eq.${encodeURIComponent(userId)}&select=save_data`, { token: this.session.access_token });
    if (rows?.[0]?.save_data) {
      this.game.applyCloudProgress(rows[0].save_data);
      this.setStatus(`Signed in as ${this.session.user.user_metadata?.username || this.session.user.email}. Cloud save loaded.`);
    } else {
      await this.saveNow(this.game.progress);
      this.setStatus(`Signed in as ${this.session.user.user_metadata?.username || this.session.user.email}. Local save uploaded.`);
    }
  }

  queueSave(progress) {
    if (!this.session || this.game.developerBuild) return;
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.saveNow(progress).catch((error) => this.setStatus(`Cloud save failed: ${error.message}`, true)), 700);
  }

  async saveNow(progress) {
    if (!this.session || this.game.developerBuild || !await this.ensureSession()) return;
    await this.request("/rest/v1/game_saves?on_conflict=user_id", {
      method: "POST", token: this.session.access_token, prefer: "resolution=merge-duplicates,return=minimal",
      body: { user_id: this.session.user.id, save_data: progress, updated_at: new Date().toISOString() },
    });
  }

  restoreConfirmationSession() {
    const values = new URLSearchParams(window.location.hash.slice(1));
    if (!values.get("access_token")) return;
    this.setSession({
      access_token: values.get("access_token"), refresh_token: values.get("refresh_token"),
      expires_at: Math.floor(Date.now() / 1000) + Number(values.get("expires_in") || 3600),
      user: null,
    });
    history.replaceState(null, "", `${location.pathname}${location.search}`);
  }

  setSession(session) {
    if (!session?.access_token) return;
    if (!session.expires_at) session.expires_at = Math.floor(Date.now() / 1000) + Number(session.expires_in || 3600);
    this.session = session; localStorage.setItem(CLOUD_SESSION_KEY, JSON.stringify(session));
  }
  readSession() { try { return JSON.parse(localStorage.getItem(CLOUD_SESSION_KEY)); } catch { return null; } }
  clearSession() { this.session = null; localStorage.removeItem(CLOUD_SESSION_KEY); }
  clearSensitiveInputs() { this.password.value = ""; this.confirmPassword.value = ""; }
  setStatus(message, error = false) {
    if (!this.status) return;
    this.status.textContent = message;
    this.status.classList.toggle("is-error", error);
    this.status.classList.remove("is-confirming");
    void this.status.offsetWidth;
    this.status.classList.add("is-confirming");
  }
  updateStatus() {
    const signedIn = Boolean(this.session?.user);
    document.querySelector("#account-signout")?.toggleAttribute("hidden", !signedIn);
    document.querySelector("#account-signin")?.toggleAttribute("hidden", signedIn);
    document.querySelector("#account-signup")?.toggleAttribute("hidden", signedIn);
    this.setStatus(signedIn ? `Signed in as ${this.session.user.user_metadata?.username || this.session.user.email}` : "Not signed in. Local saves remain on this device.");
  }
}
