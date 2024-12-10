import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { X_LINK, TELEGRAM_LINK, DEX_LINK } from "../../lib/sets";

export default class MainMenu extends Phaser.Scene {
  private background!: Phaser.GameObjects.Video;
  private music!:
    | Phaser.Sound.WebAudioSound
    | Phaser.Sound.NoAudioSound
    | Phaser.Sound.HTML5AudioSound;

  private infoButtonState: "open" | "closed" = "closed";
  private infoButton!: Phaser.GameObjects.Image;

  constructor() {
    super("MainMenu");
  }

  preload() {
    this.load.video("loading", "assets/loadingScreen/loadingScreen.mp4");
  }

  private onInfoButtonClick(): void {
    this.infoButtonState = this.infoButtonState === "open" ? "closed" : "open";
    EventBus.emit("show-info", this.infoButtonState === "open");
    // Update info button texture based on state
    this.infoButton.setTexture(
      this.infoButtonState === "open" ? "info-button" : "info-button-active"
    );
  }

  create() {
    this.add
      .image(1280 / 2, 720 / 2, "BG")
      .setDisplaySize(1280, 720)
      .setDepth(-3);
    EventBus.emit("current-scene-ready", this);
    this.music = this.sound.add("bgMusic");
    this.music.play({
      loop: true,
      volume: 0.5,
    });
    this.background = this.add
      .video(1280 / 2, 720 / 2, "loading")
      .setScale(0.68)
      .setDepth(-2)
      .play(true);

    // Add social media buttons
    const socialY = 500;
    const spacing = 120;

    // Twitter button
    const twitterButton = this.add
      .image(400 - spacing, socialY, "twitter-button")
      .setScale(0.2)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        twitterButton.setTexture("twitter-button-active");
      })
      .on("pointerout", () => {
        twitterButton.setTexture("twitter-button");
      })
      .on("pointerdown", () => {
        window.open(X_LINK, "_blank");
      });

    this.infoButton = this.add
      .image(400, 600, "info-button-active")
      .setDisplaySize(50, 50)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.onInfoButtonClick());

    // Telegram button
    const telegramButton = this.add
      .image(400, socialY, "telegram-button")
      .setScale(0.2)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        telegramButton.setTexture("telegram-button-active");
      })
      .on("pointerout", () => {
        telegramButton.setTexture("telegram-button");
      })
      .on("pointerdown", () => {
        window.open(TELEGRAM_LINK, "_blank");
      });

    // Discord button
    const discordButton = this.add
      .image(400 + spacing, socialY, "dex-button")
      .setScale(0.2)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        discordButton.setTexture("dex-button-active");
      })
      .on("pointerout", () => {
        discordButton.setTexture("dex-button");
      })
      .on("pointerdown", () => {
        window.open(DEX_LINK, "_blank");
      });

    // Add play button
    // Add play button
    const playButton = this.add
      .text(400, 384, "Play Game", {
        fontSize: "32px",
        color: "#ffffff",
        backgroundColor: "#000000",
        padding: { x: 20, y: 10 },
        fontFamily: "Arial Black",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Add hover effects
    playButton.on("pointerover", () => {
      playButton.setScale(1.1);
    });

    playButton.on("pointerout", () => {
      playButton.setScale(1);
    });

    // Change scene on click
    playButton.on("pointerdown", () => {
      this.changeScene();
    });
  }

  changeScene() {
    this.background.destroy();
    this.scene.start("Preloader");
  }
}

export { MainMenu };

