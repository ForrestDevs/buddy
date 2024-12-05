import Phaser from "phaser";
import { EventBus } from "../EventBus";

export default class MainMenu extends Phaser.Scene {
  private background!: Phaser.GameObjects.Video;
  private music!:
    | Phaser.Sound.WebAudioSound
    | Phaser.Sound.NoAudioSound
    | Phaser.Sound.HTML5AudioSound;

  constructor() {
    super("MainMenu");
  }

  preload() {
    this.load.video("loading", "assets/loadingScreen/loadingScreen.mp4");
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
