import { EventBus } from "../EventBus";

interface ButtonConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  spacing?: number;
}

export class GameButtons extends Phaser.GameObjects.Container {
  private buttons: Map<string, Phaser.GameObjects.Image> = new Map();
  private buttonStates: Map<string, "default" | "hover" | "selected"> =
    new Map();
  private spacing: number;

  constructor(config: ButtonConfig) {
    super(config.scene, config.x, config.y);
    this.scene = config.scene;
    this.spacing = config.spacing || 60;

    // Add container to scene
    this.scene.add.existing(this);

    this.createButtons();
    this.setupEventListeners();
  }

  private createButtons(): void {
    const buttonKeys = ["levels", "shop", "boxes", "skins"];

    buttonKeys.forEach((key, index) => {
      const button = this.scene.add
        .image(
          0, // x relative to container
          index * this.spacing, // y relative to container
          key
        )
        .setDisplaySize(100, 100)
        .setInteractive({ useHandCursor: true })
        .on("pointerover", () => this.onButtonHover(key))
        .on("pointerout", () => this.onButtonOut(key))
        .on("pointerdown", () => this.onButtonClick(key));

      this.add(button); // Add to container
      this.buttons.set(key, button);
      this.buttonStates.set(key, "default");
    });
  }

  private setupEventListeners(): void {
    EventBus.on("journal-closed", this.resetButtonStates, this);
  }

  private onButtonHover(key: string): void {
    const button = this.buttons.get(key);
    if (!button || this.buttonStates.get(key) === "selected") return;

    button.setTexture(`${key}-selected`);
    this.buttonStates.set(key, "hover");

    // Emit event to hide weapon
    EventBus.emit("hide-weapon", true);

    // Play hover sound
    // this.scene.sound.play("hover");
  }

  private onButtonOut(key: string): void {
    const button = this.buttons.get(key);
    if (!button || this.buttonStates.get(key) === "selected") return;

    button.setTexture(key);
    this.buttonStates.set(key, "default");

    // Check if pointer is outside container bounds
    if (!this.isPointerOver()) {
      EventBus.emit("hide-weapon", false);
    }
  }

  private onButtonClick(key: string): void {
    const button = this.buttons.get(key);
    if (!button) return;

    // Handle mute button separately
    if (key === "mute") {
      this.toggleMute();
      return;
    }

    // Reset all buttons except clicked one
    this.buttons.forEach((btn, btnKey) => {
      if (btnKey !== key) {
        btn.setTexture(btnKey);
        this.buttonStates.set(btnKey, "default");
      }
    });

    // Set clicked button to selected state
    button.setTexture(`${key}-selected`);
    this.buttonStates.set(key, "selected");

    // Emit event for journal opening
    EventBus.emit("open-journal", key);

    // Play click sound
    this.scene.sound.play("click");
  }

  private toggleMute(): void {
    const muteButton = this.buttons.get("mute")!;
    const isMuted = this.buttonStates.get("mute") === "selected";

    muteButton.setTexture(isMuted ? "mute" : "mute-selected");
    this.buttonStates.set("mute", isMuted ? "default" : "selected");

    // Emit mute event
    EventBus.emit("toggle-mute", !isMuted);

    // Play click sound (if not muted)
    if (!isMuted) {
      this.scene.sound.play("click");
    }
  }

  private isPointerOver(): boolean {
    const bounds = this.getBounds();
    return bounds.contains(
      this.scene.input.activePointer.x,
      this.scene.input.activePointer.y
    );
  }

  private resetButtonStates(): void {
    this.buttons.forEach((button, key) => {
      if (key !== "mute") {
        // Preserve mute state
        button.setTexture(key);
        this.buttonStates.set(key, "default");
      }
    });
  }

  public destroy(): void {
    // Clean up event listeners
    EventBus.off("journal-closed", this.resetButtonStates, this);

    // Container's destroy method will handle destroying all child objects
    super.destroy();
  }
}
