import { DEX_LINK, TELEGRAM_LINK, X_LINK } from "@/lib/sets";
import { EventBus } from "../EventBus";
import { InputState } from "./InputState";

interface ButtonConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  spacing?: number;
}

export class GameButtons extends Phaser.GameObjects.Container {
  private inputState: InputState;
  private buttons: Map<string, Phaser.GameObjects.Image> = new Map();
  private buttonStates: Map<string, "default" | "hover" | "selected"> =
    new Map();
  private spacing: number;
  private muteButton: Phaser.GameObjects.Image;
  private muteButtonState: "muted" | "unmuted" = "unmuted";
  private infoButton: Phaser.GameObjects.Image;
  private infoButtonState: "open" | "closed" = "closed";
  private socialsButton: Phaser.GameObjects.Image;
  private socialsButtonState: "open" | "closed" = "closed";
  private socialButtons: Map<string, Phaser.GameObjects.Image> = new Map();
  private readonly SMALL_BUTTON_SIZE = 50;
  private readonly SOCIAL_BUTTON_SPACING = 70;

  constructor(config: ButtonConfig) {
    super(config.scene, config.x, config.y);
    this.scene = config.scene;
    this.spacing = config.spacing || 60;
    this.scene.add.existing(this);
    this.inputState = InputState.getInstance();
    this.createUtilityButtons();
    this.createMainButtons();
    this.setupEventListeners();
  }

  private createUtilityButtons(): void {
    // Create mute button
    this.muteButton = this.scene.add
      .image(-25, -150, "unmuted")
      .setDisplaySize(this.SMALL_BUTTON_SIZE, this.SMALL_BUTTON_SIZE)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => this.onExtraButtonHover())
      .on("pointerout", () => this.onExtraButtonOut())
      .on("pointerdown", () => this.onMuteButtonClick());

    // Create socials toggle button
    this.socialsButton = this.scene.add
      .image(35, -150, "logo-select")
      .setDisplaySize(this.SMALL_BUTTON_SIZE, this.SMALL_BUTTON_SIZE)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => this.onExtraButtonHover())
      .on("pointerout", () => this.onExtraButtonOut())
      .on("pointerdown", () => this.onSocialsButtonClick());

    this.infoButton = this.scene.add
      .image(-25, 400, "info-button-active")
      .setDisplaySize(this.SMALL_BUTTON_SIZE, this.SMALL_BUTTON_SIZE)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.onInfoButtonClick());

    // Create social media buttons (initially hidden)
    const socialTypes = ["twitter", "telegram", "dex"];
    socialTypes.forEach((type, index) => {
      const button = this.scene.add
        .image(
          this.socialsButton.x + (index + 1) * this.SOCIAL_BUTTON_SPACING,
          -150,
          `${type}-button`
        )
        .setDisplaySize(this.SMALL_BUTTON_SIZE, this.SMALL_BUTTON_SIZE)
        .setInteractive({ useHandCursor: true })
        .on("pointerover", () => {
          // this.onExtraButtonHover();
          button.setTexture(`${type}-button-active`);
        })
        .on("pointerout", () => {
          this.onExtraButtonOut();
          button.setTexture(`${type}-button`);
        })
        .on("pointerdown", () => this.onSocialClick(type))
        .setVisible(false);

      this.socialButtons.set(type, button);
      this.add(button);
    });

    this.add([this.muteButton, this.socialsButton, this.infoButton]);
  }

  private onInfoButtonClick(): void {
    this.scene.sound.play("click");
    this.infoButtonState = this.infoButtonState === "open" ? "closed" : "open";
    EventBus.emit("show-info", this.infoButtonState === "open");
    // Update info button texture based on state
    this.infoButton.setTexture(
      this.infoButtonState === "open" ? "info-button" : "info-button-active"
    );
  }

  private createMainButtons(): void {
    const buttonKeys = ["levels", "shop", "boxes", "skins"];

    buttonKeys.forEach((key, index) => {
      const button = this.scene.add
        .image(
          0,
          index * this.spacing - 50, // Start below utility buttons
          key
        )
        .setDisplaySize(100, 100)
        .setInteractive({ useHandCursor: true })
        .on("pointerover", () => this.onButtonHover(key))
        .on("pointerout", () => this.onButtonOut(key))
        .on("pointerdown", () => this.onButtonClick(key));

      this.add(button);
      this.buttons.set(key, button);
      this.buttonStates.set(key, "default");
    });
  }

  private setupEventListeners(): void {
    EventBus.on("journal-closed", this.resetButtonStates, this);
  }

  private onExtraButtonHover(): void {
    this.inputState.lock("extra");
  }

  private onExtraButtonOut(): void {
    this.inputState.unlock("extra");
  }

  private onMuteButtonClick(): void {
    this.toggleMute();
  }

  private onSocialsButtonClick(): void {
    this.scene.sound.play("click");
    this.socialsButtonState =
      this.socialsButtonState === "open" ? "closed" : "open";

    // Show/hide social buttons based on state
    this.socialButtons.forEach((button) => {
      button.setVisible(this.socialsButtonState === "open");
    });
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
    this.scene.sound.play("click");
    const isMuted = this.muteButtonState === "muted";

    this.muteButton.setTexture(isMuted ? "unmuted" : "mute");
    this.muteButtonState = isMuted ? "unmuted" : "muted";

    if (this.muteButtonState === "muted") {
      this.scene.game.sound.stopByKey("bgMusic");
    } else if (
      !this.scene.game.sound.isPlaying("bgMusic") &&
      this.muteButtonState === "unmuted"
    ) {
      this.scene.game.sound.play("bgMusic");
    }
    // Emit mute event
    EventBus.emit("toggle-mute", !isMuted);
  }

  public isPointerOver(): boolean {
    EventBus.emit("hide-weapon", true);
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

  private onSocialClick(type: string): void {
    this.scene.sound.play("click");

    // Open appropriate link based on type
    let url = "";
    switch (type) {
      case "twitter":
        url = X_LINK;
        break;
      case "telegram":
        url = TELEGRAM_LINK;
        break;
      case "DexLogo":
        url = DEX_LINK;
        break;
    }

    if (url) {
      window.open(url, "_blank");
    }
  }

  public destroy(): void {
    // Clean up event listeners
    EventBus.off("journal-closed", this.resetButtonStates, this);

    // Clean up social buttons
    this.socialButtons.forEach((button) => button.destroy());
    this.socialButtons.clear();

    // Container's destroy method will handle destroying all child objects
    super.destroy();
  }
}

