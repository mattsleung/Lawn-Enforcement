export const HELD_WEAPON_VISUALS = Object.freeze({
  "weedwacker-9000": { kind: "trimmer", primary: "#dcc45f", secondary: "#6e8d4d" },
  "vampire-fang": { kind: "fang", primary: "#f0e1d4", secondary: "#c94b73" },
  "garden-shears": { kind: "shears", primary: "#c8d5d0", secondary: "#56765e" },
  "hedge-clippers": { kind: "clippers", primary: "#b9c8a5", secondary: "#496b43" },
  wheelbarrow: { kind: "wheelbarrow", primary: "#b7a36d", secondary: "#42637d" },
  "garden-shovel": { kind: "shovel", primary: "#9ca8ad", secondary: "#76513a" },
  "golden-rake": { kind: "rake", primary: "#f0c84d", secondary: "#8b6328" },
  "turbo-mower": { kind: "mower", primary: "#df5b42", secondary: "#343a36" },
  "tennis-racket": { kind: "racket", primary: "#d8e85f", secondary: "#6a4b2f" },
  "gravity-freezer": { kind: "tech-gun", primary: "#9e8cff", secondary: "#62d9e8" },
  firecracker: { kind: "firecracker", primary: "#f06c42", secondary: "#ffd75a" },
  "beach-ball": { kind: "striped-ball", primary: "#f2a84b", secondary: "#f4eee0" },
  shurikens: { kind: "shuriken", primary: "#d9e5ed", secondary: "#64727d" },
  apples: { kind: "apple", primary: "#b83b32", secondary: "#5f8d3e" },
  "rainbow-apples": { kind: "apple", primary: "#ff5f74", secondary: "#7ff06c", rainbow: true },
  "party-hat": { kind: "party-hat", primary: "#ff5f74", secondary: "#65d9ff", rainbow: true },
  "rainbow-horseshoe": { kind: "horseshoe", primary: "#ff5f74", secondary: "#65d9ff", rainbow: true },
  pinata: { kind: "pinata", primary: "#ee5f76", secondary: "#63d6e8" },
  "pebble-shooter": { kind: "small-gun", primary: "#b6a98d", secondary: "#5d5141" },
  "sprinkler-mine": { kind: "sprinkler", primary: "#62c7d2", secondary: "#456b72" },
  "bug-zapper": { kind: "zapper", primary: "#f4df63", secondary: "#6259a7" },
  "trash-can-lid": { kind: "lid", primary: "#9ca6a7", secondary: "#5a6264" },
  "garden-gnome": { kind: "gnome", primary: "#d46a49", secondary: "#e8ddd0" },
  "fertilizer-bag": { kind: "bag", primary: "#9f783d", secondary: "#d2b86d" },
  "leaf-tornado": { kind: "leaf-fan", primary: "#b6c957", secondary: "#587744" },
  "polarity-gun": { kind: "magnet-gun", primary: "#c18cff", secondary: "#6ce3e4" },
  horseshoe: { kind: "horseshoe", primary: "#c9cbd0", secondary: "#686d73" },
  "jumper-cables": { kind: "cables", primary: "#e94e4e", secondary: "#242629" },
  "lightning-rod": { kind: "rod", primary: "#e9edff", secondary: "#68cce8" },
  "garden-mirror": { kind: "mirror", primary: "#9fdff2", secondary: "#526b73" },
  doorbell: { kind: "bell", primary: "#e3bb65", secondary: "#76532b" },
  "orbital-sprinkler": { kind: "orbital", primary: "#71d9ff", secondary: "#48658b" },
  "garden-sprayer": { kind: "sprayer", primary: "#63cbe8", secondary: "#637b51" },
  "tennis-balls": { kind: "tennis-ball", primary: "#d8e85f", secondary: "#f5f1bd" },
  "acorn-slingshot": { kind: "slingshot", primary: "#7b4b2b", secondary: "#c89c62" },
  "nail-gun": { kind: "nail-gun", primary: "#c5c9c8", secondary: "#58646a" },
  "rock-salt-blaster": { kind: "shotgun", primary: "#e7d7a5", secondary: "#74523a" },
  "garden-hose": { kind: "hose", primary: "#63cbe8", secondary: "#4f8b4d" },
  "bowling-ball": { kind: "bowling-ball", primary: "#3e3156", secondary: "#b8a9ce" },
  "diet-cola-launcher": { kind: "bottle-launcher", primary: "#b63b32", secondary: "#ded8cd" },
  slushie: { kind: "cup", primary: "#81d9ef", secondary: "#ecf6f4" },
  "leaf-blower": { kind: "blower", primary: "#d6d0aa", secondary: "#68705d" },
  "storm-sprinkler": { kind: "minigun", primary: "#78e4ff", secondary: "#547b87" },
  "backyard-flamethrower": { kind: "flamethrower", primary: "#f27a32", secondary: "#7b4540" },
  "plastic-ghost": { kind: "ghost", primary: "#b9f4ed", secondary: "#5c9f9b" },
  "ordinance-undefined": { kind: "glitch-gun", primary: "#e05cff", secondary: "#51f0de" },
});

function circle(context, x, y, radius, color) {
  context.fillStyle = color;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
}

export function renderHeldWeaponVisual(context, weapon) {
  const visual = HELD_WEAPON_VISUALS[weapon?.id];
  if (!visual) return false;
  const { kind } = visual;
  const rainbowHue = typeof performance === "undefined" ? 0 : performance.now() / 12 % 360;
  const primary = visual.rainbow ? `hsl(${rainbowHue} 90% 62%)` : visual.primary;
  const secondary = visual.rainbow ? `hsl(${(rainbowHue + 115) % 360} 85% 58%)` : visual.secondary;
  context.save();
  context.lineWidth = 2;
  context.strokeStyle = "#292721";
  context.fillStyle = primary;
  switch (kind) {
    case "trimmer":
      context.fillStyle = secondary; context.fillRect(0, -2, 30, 4); context.fillStyle = primary; context.fillRect(27, -5, 9, 10); context.fillRect(34, -1, 10, 2); break;
    case "fang":
      context.beginPath(); context.moveTo(0, -6); context.lineTo(24, 0); context.lineTo(5, 8); context.lineTo(9, 1); context.closePath(); context.fill(); context.stroke(); break;
    case "shears": case "clippers": {
      const length = kind === "clippers" ? 34 : 24; context.fillStyle = secondary; circle(context, 2, -4, 4, secondary); circle(context, 2, 4, 4, secondary);
      context.fillStyle = primary; context.beginPath(); context.moveTo(5, -2); context.lineTo(length, -7); context.lineTo(9, 1); context.lineTo(length, 7); context.lineTo(5, 2); context.closePath(); context.fill(); break;
    }
    case "wheelbarrow":
      context.fillStyle = primary; context.fillRect(1, -9, 27, 15); context.fillStyle = secondary; circle(context, 27, 9, 6, secondary); context.fillRect(-3, -1, 9, 3); break;
    case "shovel":
      context.fillStyle = secondary; context.fillRect(0, -2, 27, 4); context.fillStyle = primary; context.beginPath(); context.moveTo(26, -7); context.lineTo(39, -5); context.lineTo(38, 5); context.lineTo(26, 7); context.closePath(); context.fill(); break;
    case "rake":
      context.fillStyle = secondary; context.fillRect(0, -2, 31, 4); context.fillStyle = primary; context.fillRect(29, -8, 4, 16); for (let y = -8; y <= 8; y += 4) context.fillRect(32, y, 9, 2); break;
    case "mower":
      context.fillStyle = secondary; context.fillRect(0, -3, 10, 3); context.fillStyle = primary; context.fillRect(8, -9, 25, 15); circle(context, 14, 8, 5, secondary); circle(context, 29, 8, 5, secondary); break;
    case "racket":
      context.fillStyle = secondary; context.fillRect(0, -2, 15, 4); context.strokeStyle = primary; context.lineWidth = 4; context.beginPath(); context.ellipse(24, 0, 10, 14, 0, 0, Math.PI * 2); context.stroke(); context.lineWidth = 1; context.beginPath(); context.moveTo(17, -7); context.lineTo(31, 7); context.moveTo(17, 7); context.lineTo(31, -7); context.stroke(); break;
    case "tech-gun": case "magnet-gun": case "glitch-gun":
      context.fillStyle = primary; context.fillRect(0, -7, 25, 14); context.fillStyle = secondary; context.fillRect(18, -10, 10, 20); context.fillRect(5, 7, 7, 8); circle(context, 15, 0, 3, "#f5f4d7"); break;
    case "small-gun": case "nail-gun": case "shotgun": {
      const length = kind === "shotgun" ? 34 : 24; context.fillStyle = primary; context.fillRect(0, -5, length, 10); context.fillStyle = secondary; context.fillRect(5, 5, 8, 9); if (kind === "shotgun") context.fillRect(22, 4, 12, 3); break;
    }
    case "firecracker":
      context.fillStyle = primary; context.fillRect(0, -5, 19, 10); context.fillStyle = secondary; context.fillRect(17, -2, 5, 4); context.beginPath(); context.moveTo(21, 0); context.lineTo(26, -5); context.strokeStyle = secondary; context.stroke(); break;
    case "party-hat":
      context.fillStyle = primary; context.beginPath(); context.moveTo(0, 8); context.lineTo(25, 0); context.lineTo(0, -8); context.closePath(); context.fill();
      context.fillStyle = secondary; context.fillRect(5, -5, 4, 4); context.fillRect(12, 1, 4, 4); context.fillRect(18, -3, 4, 4); break;
    case "striped-ball": case "apple": case "tennis-ball": case "bowling-ball":
      circle(context, 8, 0, kind === "striped-ball" ? 10 : 7, primary);
      if (kind === "striped-ball") { context.fillStyle = secondary; context.fillRect(5, -9, 5, 18); }
      if (kind === "apple") { context.fillStyle = secondary; context.fillRect(8, -10, 3, 5); }
      if (kind === "tennis-ball") { context.strokeStyle = secondary; context.beginPath(); context.arc(8, 0, 5, -1.3, 1.3); context.stroke(); }
      if (kind === "bowling-ball") { circle(context, 6, -2, 1.3, secondary); circle(context, 10, -3, 1.3, secondary); } break;
    case "shuriken":
      context.fillStyle = primary; context.beginPath(); for (let index = 0; index < 8; index += 1) { const angle = index * Math.PI / 4; const radius = index % 2 ? 3 : 10; const x = 9 + Math.cos(angle) * radius; const y = Math.sin(angle) * radius; if (index === 0) context.moveTo(x, y); else context.lineTo(x, y); } context.closePath(); context.fill(); circle(context, 9, 0, 2, secondary); break;
    case "sprinkler": case "orbital":
      context.fillStyle = secondary; context.fillRect(0, -4, 18, 8); circle(context, 17, 0, 8, primary); context.fillStyle = "#e8fbff"; context.fillRect(15, -11, 3, 6); context.fillRect(15, 5, 3, 6); break;
    case "zapper": case "rod":
      context.fillStyle = secondary; context.fillRect(0, -4, 8, 8); context.fillStyle = primary; context.fillRect(7, -3, 25, 6); context.fillStyle = "#ffffff"; context.fillRect(15, -5, 3, 10); break;
    case "lid":
      circle(context, 10, 0, 11, primary); context.strokeStyle = secondary; context.beginPath(); context.arc(10, 0, 7, 0, Math.PI * 2); context.stroke(); break;
    case "gnome":
      context.fillStyle = secondary; context.fillRect(2, -1, 12, 12); context.fillStyle = primary; context.beginPath(); context.moveTo(1, -1); context.lineTo(8, -17); context.lineTo(15, -1); context.closePath(); context.fill(); circle(context, 8, -2, 5, "#e8b995"); break;
    case "pinata":
      context.fillStyle = "#ffcf4b"; context.fillRect(1, -9, 18, 18);
      context.fillStyle = "#ee5f76"; context.fillRect(1, -9, 18, 4);
      context.fillStyle = "#62d4e8"; context.fillRect(1, -1, 18, 4);
      context.fillStyle = "#8fd65a"; context.fillRect(1, 7, 18, 3);
      context.fillStyle = "#7c58b8"; context.fillRect(4, 10, 4, 6); context.fillRect(13, 10, 4, 6);
      context.fillStyle = "#f2a04a"; context.fillRect(18, -5, 5, 5); break;
    case "bag":
      context.fillStyle = primary; context.fillRect(0, -8, 19, 17); context.fillStyle = secondary; context.fillRect(4, -11, 11, 4); context.fillRect(5, -2, 9, 4); break;
    case "leaf-fan":
      context.strokeStyle = secondary; for (let index = 0; index < 3; index += 1) { context.beginPath(); context.arc(10 + index * 4, 0, 7 + index * 3, -1.1, 1.1); context.stroke(); } circle(context, 26, -6, 3, primary); circle(context, 30, 5, 3, primary); break;
    case "horseshoe":
      context.strokeStyle = primary; context.lineWidth = 5; context.beginPath(); context.arc(10, 0, 8, -1.25, 1.25); context.stroke(); break;
    case "cables":
      context.strokeStyle = primary; context.lineWidth = 3; context.beginPath(); context.moveTo(0, -3); context.bezierCurveTo(8, -12, 14, 8, 25, -4); context.stroke(); context.strokeStyle = secondary; context.beginPath(); context.moveTo(0, 3); context.bezierCurveTo(8, 12, 14, -8, 25, 4); context.stroke(); break;
    case "mirror":
      context.fillStyle = secondary; context.fillRect(0, -12, 22, 24); context.fillStyle = primary; context.fillRect(3, -9, 16, 18); context.fillStyle = "#ffffff"; context.fillRect(5, -7, 4, 11); break;
    case "bell":
      context.fillStyle = primary; context.beginPath(); context.moveTo(1, 7); context.lineTo(5, -8); context.lineTo(15, -8); context.lineTo(19, 7); context.closePath(); context.fill(); circle(context, 10, 9, 3, secondary); break;
    case "sprayer":
      context.fillStyle = secondary; context.fillRect(0, -5, 16, 11); context.fillStyle = primary; context.fillRect(14, -7, 10, 8); context.fillRect(21, -4, 10, 3); context.fillRect(4, 6, 7, 7); break;
    case "slingshot":
      context.strokeStyle = primary; context.lineWidth = 4; context.beginPath(); context.moveTo(0, 8); context.lineTo(10, -1); context.lineTo(16, -11); context.moveTo(10, -1); context.lineTo(18, 8); context.stroke(); context.strokeStyle = secondary; context.lineWidth = 2; context.beginPath(); context.moveTo(16, -11); context.lineTo(18, 8); context.stroke(); break;
    case "hose": case "blower": case "minigun": case "flamethrower": case "bottle-launcher":
      context.fillStyle = primary; context.fillRect(0, -7, 24, 14); context.fillStyle = secondary; context.fillRect(5, 7, 8, 8); context.fillRect(21, -4, kind === "blower" ? 14 : 10, 8);
      if (kind === "minigun") { for (let y = -5; y <= 5; y += 5) context.fillRect(20, y, 16, 2); }
      if (kind === "flamethrower") circle(context, 5, 8, 5, secondary);
      if (kind === "bottle-launcher") { context.fillStyle = "#ede8dd"; context.fillRect(12, -5, 8, 10); } break;
    case "cup":
      context.fillStyle = primary; context.fillRect(1, -8, 15, 17); context.fillStyle = secondary; context.fillRect(0, -11, 17, 4); context.fillRect(10, -17, 3, 8); break;
    case "ghost":
      context.fillStyle = primary; context.beginPath(); context.arc(10, -3, 9, Math.PI, 0); context.lineTo(19, 11); context.lineTo(14, 7); context.lineTo(10, 11); context.lineTo(6, 7); context.lineTo(1, 11); context.closePath(); context.fill(); circle(context, 7, -4, 2, secondary); circle(context, 13, -4, 2, secondary); break;
    default:
      context.fillStyle = primary; context.fillRect(0, -5, 22, 10); context.fillStyle = secondary; context.fillRect(18, -3, 8, 6);
  }
  context.restore();
  return true;
}
