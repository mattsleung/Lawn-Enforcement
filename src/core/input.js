const MOVEMENT_KEYS = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"]);

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pointer = { x: 0, y: 0, inside: false, down: false };
    this.debugToggleRequested = false;
    this.bossSpawnRequested = false;
    this.weaponSlotRequested = null;
    this.attackRequested = false;
    this.clickRequested = null;
    this.restartRequested = false;
    this.pauseRequested = false;
    this.confirmRequested = false;
    this.upgradeChoiceRequested = null;
    this.menuActionRequested = null;
    this.keybinds = { melee: "Digit1", ranged: "Digit2" };
    this.rebindingAction = null;
    this.completedRebind = null;
    this.scrollRequested = 0;

    window.addEventListener("keydown", (event) => this.handleKeyDown(event));
    window.addEventListener("keyup", (event) => this.keys.delete(event.code));
    window.addEventListener("blur", () => this.keys.clear());
    canvas.addEventListener("pointermove", (event) => this.updatePointer(event));
    canvas.addEventListener("pointerenter", (event) => {
      this.pointer.inside = true;
      this.updatePointer(event);
    });
    canvas.addEventListener("pointerleave", () => {
      this.pointer.inside = false;
    });
    canvas.addEventListener("pointerdown", (event) => {
      if (event.button === 0) {
        this.updatePointer(event);
        this.pointer.down = true;
        this.attackRequested = true;
        this.clickRequested = { x: this.pointer.x, y: this.pointer.y };
      }
    });
    window.addEventListener("pointerup", (event) => {
      if (event.button === 0) {
        this.pointer.down = false;
      }
    });
    canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      this.scrollRequested += Math.sign(event.deltaY);
    }, { passive: false });
  }

  handleKeyDown(event) {
    if (this.rebindingAction && !event.repeat) {
      event.preventDefault();
      this.keybinds[this.rebindingAction] = event.code;
      this.completedRebind = { action: this.rebindingAction, code: event.code };
      this.rebindingAction = null;
      return;
    }
    if (MOVEMENT_KEYS.has(event.code)) {
      event.preventDefault();
    }

    if (event.code === "F3" && !event.repeat) {
      event.preventDefault();
      this.debugToggleRequested = true;
    }
    if (event.code === "KeyX" && !event.repeat) {
      event.preventDefault();
      this.bossSpawnRequested = true;
    }

    if ((event.code === "Digit1" || event.code === "Numpad1") && !event.repeat) {
      this.upgradeChoiceRequested = 1;
    }
    if ((event.code === "Digit2" || event.code === "Numpad2") && !event.repeat) {
      this.upgradeChoiceRequested = 2;
    }
    if (event.code === this.keybinds.melee && !event.repeat) this.weaponSlotRequested = 1;
    if (event.code === this.keybinds.ranged && !event.repeat) this.weaponSlotRequested = 2;
    if ((event.code === "Digit3" || event.code === "Numpad3") && !event.repeat) {
      this.upgradeChoiceRequested = 3;
    }
    for (let digit = 4; digit <= 9; digit += 1) {
      if ((event.code === `Digit${digit}` || event.code === `Numpad${digit}`) && !event.repeat) {
        this.upgradeChoiceRequested = digit;
      }
    }
    if (event.code === "KeyS" && !event.repeat) this.menuActionRequested = "shop";
    if (event.code === "KeyU" && !event.repeat) this.menuActionRequested = "upgrades";
    if (event.code === "KeyO" && !event.repeat) this.menuActionRequested = "settings";
    if (event.code === "KeyR" && !event.repeat) {
      this.restartRequested = true;
    }
    if (event.code === "Escape" && !event.repeat) {
      this.pauseRequested = true;
    }
    if (event.code === "Enter" && !event.repeat) {
      this.confirmRequested = true;
    }

    this.keys.add(event.code);
  }

  updatePointer(event) {
    const bounds = this.canvas.getBoundingClientRect();
    this.pointer.x = event.clientX - bounds.left;
    this.pointer.y = event.clientY - bounds.top;
  }

  movementVector() {
    const horizontal = Number(this.keys.has("KeyD") || this.keys.has("ArrowRight"))
      - Number(this.keys.has("KeyA") || this.keys.has("ArrowLeft"));
    const vertical = Number(this.keys.has("KeyS") || this.keys.has("ArrowDown"))
      - Number(this.keys.has("KeyW") || this.keys.has("ArrowUp"));
    const length = Math.hypot(horizontal, vertical);

    return length > 0
      ? { x: horizontal / length, y: vertical / length }
      : { x: 0, y: 0 };
  }

  consumeDebugToggle() {
    const requested = this.debugToggleRequested;
    this.debugToggleRequested = false;
    return requested;
  }

  consumeBossSpawnRequest() {
    const requested = this.bossSpawnRequested;
    this.bossSpawnRequested = false;
    return requested;
  }

  consumeWeaponSlot() {
    const slot = this.weaponSlotRequested;
    this.weaponSlotRequested = null;
    return slot;
  }

  consumeAttackRequest() {
    const requested = this.attackRequested;
    this.attackRequested = false;
    return requested;
  }

  consumeClickRequest() {
    const requested = this.clickRequested;
    this.clickRequested = null;
    return requested;
  }

  consumeRestartRequest() {
    const requested = this.restartRequested;
    this.restartRequested = false;
    return requested;
  }

  consumePauseRequest() {
    const requested = this.pauseRequested;
    this.pauseRequested = false;
    return requested;
  }

  consumeConfirmRequest() {
    const requested = this.confirmRequested;
    this.confirmRequested = false;
    return requested;
  }

  consumeUpgradeChoice() {
    const choice = this.upgradeChoiceRequested;
    this.upgradeChoiceRequested = null;
    return choice;
  }

  consumeMenuAction() {
    const action = this.menuActionRequested;
    this.menuActionRequested = null;
    return action;
  }

  setKeybinds(keybinds) {
    this.keybinds = { ...this.keybinds, ...keybinds };
  }

  beginRebind(action) {
    this.rebindingAction = action;
  }

  consumeCompletedRebind() {
    const completed = this.completedRebind;
    this.completedRebind = null;
    return completed;
  }

  consumeScrollRequest() {
    const direction = Math.sign(this.scrollRequested);
    this.scrollRequested = 0;
    return direction;
  }
}
