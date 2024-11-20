// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { EventBus } from "../EventBus";
/* END-USER-IMPORTS */

export default class MainMenu extends Phaser.Scene {
  private background!: Phaser.GameObjects.Sprite;

  constructor() {
    super("MainMenu");
  }

  editorCreate(): void {
    // background
    this.add.image(512, 384, "background");

    // logo
    const logo = this.add.image(512, 384, "logo");

    // text
    const text = this.add.text(512, 460, "", {});
    text.setOrigin(0.5, 0.5);
    text.text = "Main Menu";
    text.setStyle({
      align: "center",
      color: "#ffffff",
      fontFamily: "Arial Black",
      fontSize: "38px",
      stroke: "#000000",
      strokeThickness: 8,
    });

    this.logo = logo;

    this.events.emit("scene-awake");
  }

  private logo!: Phaser.GameObjects.Image;

  /* START-USER-CODE */
  logoTween: Phaser.Tweens.Tween | null;

  // Write your code here
  create() {
    // this.editorCreate();
    EventBus.emit("current-scene-ready", this);
    // Create and play the background animation
    this.background = this.add
      .sprite(1280 / 2, 720 / 2, "buddyload_00000")
      .setDisplaySize(1280, 720)
      .setDepth(-2)
      .play("buddyload");

    const bgMusic = this.sound.add("bgMusic");
    // Start background music
    bgMusic.play({
      loop: true,
      volume: 1,
    });

    // Add play button
    const playButton = this.add
      .text(512, 384, "Play Game", {
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

  moveLogo(vueCallback: ({ x, y }: { x: number; y: number }) => void) {
    if (this.logoTween) {
      if (this.logoTween.isPlaying()) {
        this.logoTween.pause();
      } else {
        this.logoTween.play();
      }
    } else {
      this.logoTween = this.tweens.add({
        targets: this.logo,
        x: { value: 750, duration: 3000, ease: "Back.easeInOut" },
        y: { value: 80, duration: 1500, ease: "Sine.easeOut" },
        yoyo: true,
        repeat: -1,
        onUpdate: () => {
          if (vueCallback) {
            vueCallback({
              x: Math.floor(this.logo.x),
              y: Math.floor(this.logo.y),
            });
          }
        },
      });
    }
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
export { MainMenu };

