import { weaponById } from "../config/weapons.js";
import { estimateWeaponValue, formatMoney } from "./weapon-value.js";

export class TradingPostClient {
  constructor(cloud) {
    this.cloud = cloud;
    this.modal = document.querySelector("#trading-modal");
    this.content = document.querySelector("#trading-content");
    this.status = document.querySelector("#trading-status");
    document.querySelector("#trading-button")?.addEventListener("click", () => this.open());
    document.querySelector("#trading-close")?.addEventListener("click", () => this.modal?.close());
  }

  async open() {
    this.modal?.showModal();
    if (!this.cloud.session?.user) return this.setStatus("Sign in to use the Trading Post.", true);
    this.setStatus("Loading market…");
    try { await this.renderMarket(); } catch (error) { this.setStatus(error.message, true); }
  }

  async renderMarket() {
    const token = this.cloud.session.access_token;
    const [profiles, inventory, history, offers] = await Promise.all([
      this.cloud.request("/rest/v1/player_profiles?select=user_id,username,money,is_admin,last_seen", { token }),
      this.cloud.request("/rest/v1/player_inventory?select=owner_id,weapon_id,level,acquired_at", { token }),
      this.cloud.request("/rest/v1/weapon_trade_history?select=weapon_id,implied_value,traded_at", { token }),
      this.cloud.request("/rest/v1/trade_offers?select=id,proposer_id,recipient_id,offered_money,requested_money,status,created_at&status=eq.pending", { token }),
    ]);
    const market = buildMarketMetrics(inventory, history);
    const ranked = profiles.map((profile) => {
      const weapons = inventory.filter((item) => item.owner_id === profile.user_id);
      return { ...profile, weapons, worth: weapons.reduce((sum, item) => sum + estimateWeaponValue(item.weapon_id, market[item.weapon_id]), 0) };
    }).sort((a, b) => b.worth - a.worth);
    const me = ranked.find((profile) => profile.user_id === this.cloud.session.user.id);
    this.content.innerHTML = `
      <section><h3>TOP 10 BY WEAPON WORTH</h3>${ranked.slice(0, 10).map((p, i) => profileRow(p, i + 1, market)).join("") || "<p>No public profiles yet.</p>"}</section>
      <section><h3>ONLINE PLAYERS</h3>${ranked.filter((p) => Date.now() - Date.parse(p.last_seen) < 300000).map((p) => profileRow(p, null, market)).join("") || "<p>No other players online.</p>"}</section>
      <section><h3>PENDING OFFERS</h3>${offers.map((o) => `<div class="market-card">#${o.id} · ${formatMoney(o.offered_money)} offered / ${formatMoney(o.requested_money)} requested ${o.recipient_id === me?.user_id ? `<button data-accept="${o.id}">ACCEPT</button>` : ""}</div>`).join("") || "<p>No pending offers.</p>"}</section>
      <section><h3>CREATE TRADE REQUEST</h3><p>Use weapon IDs shown on player cards. Separate multiple weapons with commas.</p>
        <input id="trade-recipient" placeholder="Player UUID"><input id="trade-offered" placeholder="Your weapon IDs"><input id="trade-requested" placeholder="Their weapon IDs">
        <input id="trade-offered-money" type="number" min="0" placeholder="Money offered"><input id="trade-requested-money" type="number" min="0" placeholder="Money requested"><button id="trade-create">SEND OFFER</button></section>
      ${me?.is_admin ? `<section><h3>ADMIN GIVEAWAY</h3><input id="giveaway-recipient" placeholder="Player UUID"><input id="giveaway-weapon" placeholder="Weapon ID (optional)"><input id="giveaway-money" type="number" min="0" placeholder="Money"><button id="giveaway-send">GIVE</button></section>` : ""}`;
    this.content.querySelectorAll("[data-accept]").forEach((button) => button.addEventListener("click", () => this.acceptOffer(Number(button.dataset.accept))));
    this.content.querySelector("#trade-create")?.addEventListener("click", () => this.createOffer());
    this.content.querySelector("#giveaway-send")?.addEventListener("click", () => this.giveaway());
    this.setStatus(`Money ${formatMoney(me?.money)} · Weapon worth ${formatMoney(me?.worth)}`);
  }

  async rpc(name, body) { return this.cloud.request(`/rest/v1/rpc/${name}`, { method: "POST", body, token: this.cloud.session.access_token }); }
  async acceptOffer(id) { try { await this.rpc("accept_trade_offer", { p_offer_id: id }); await this.renderMarket(); } catch (e) { this.setStatus(e.message, true); } }
  async createOffer() {
    const split = (id) => document.querySelector(id).value.split(",").map((v) => v.trim()).filter(Boolean);
    try {
      await this.rpc("create_trade_offer", { p_recipient: document.querySelector("#trade-recipient").value.trim(), p_offered: split("#trade-offered"), p_requested: split("#trade-requested"), p_offered_money: Number(document.querySelector("#trade-offered-money").value) || 0, p_requested_money: Number(document.querySelector("#trade-requested-money").value) || 0 });
      await this.renderMarket();
    } catch (e) { this.setStatus(e.message, true); }
  }
  async giveaway() { try { await this.rpc("admin_giveaway", { p_recipient: document.querySelector("#giveaway-recipient").value.trim(), p_weapon_id: document.querySelector("#giveaway-weapon").value.trim() || null, p_money: Number(document.querySelector("#giveaway-money").value) || 0 }); await this.renderMarket(); } catch (e) { this.setStatus(e.message, true); } }
  setStatus(text, error = false) { this.status.textContent = text; this.status.classList.toggle("is-error", error); }
}

export function buildMarketMetrics(inventory, history) {
  const result = {};
  for (const item of inventory) (result[item.weapon_id] ??= { circulation: 0, tradeCount: 0, tradeTotal: 0 }).circulation += 1;
  for (const trade of history) { const metric = result[trade.weapon_id] ??= { circulation: 0, tradeCount: 0, tradeTotal: 0 }; metric.tradeCount += 1; metric.tradeTotal += Number(trade.implied_value) || 0; }
  for (const metric of Object.values(result)) metric.averageTradePrice = metric.tradeCount ? metric.tradeTotal / metric.tradeCount : 0;
  return result;
}

function profileRow(profile, rank, market) {
  const items = profile.weapons.map((item) => { const weapon = weaponById(item.weapon_id); return `<li>${weapon?.name ?? item.weapon_id} <code>${item.weapon_id}</code> · LV ${item.level} · ${formatMoney(estimateWeaponValue(item.weapon_id, market[item.weapon_id]))}</li>`; }).join("");
  return `<details class="market-card"><summary>${rank ? `#${rank} ` : ""}${escapeHtml(profile.username)} · ${formatMoney(profile.worth)}</summary><small>${profile.user_id}</small><ul>${items || "<li>No tradable weapons</li>"}</ul></details>`;
}
function escapeHtml(value) { const node = document.createElement("span"); node.textContent = value; return node.innerHTML; }
