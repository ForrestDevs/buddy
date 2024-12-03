// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Preloader extends Phaser.Scene {
  constructor() {
    super("Preloader");
  }

  editorCreate(): void {
    // background
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const gradient = this.add.graphics();
    gradient.fillGradientStyle(0x1a1a1a, 0x1a1a1a, 0x0a0a0a, 0x0a0a0a, 1);
    gradient.fillRect(0, 0, width, height);

    // progressBar
    const progressBar = this.add.rectangle(width / 2, height / 2, 468, 32);
    progressBar.isFilled = true;
    progressBar.fillColor = 0x30cfd0; // Bright green color
    progressBar.isStroked = true;
    progressBar.strokeColor = 0xffffff; // White stroke
    progressBar.lineWidth = 2;
    progressBar.setAlpha(0.8); // Slight transparency

    this.progressBar = progressBar;

    this.events.emit("scene-awake");
  }

  private progressBar!: Phaser.GameObjects.Rectangle;

  /* START-USER-CODE */

  // Write your code here
  init() {
    this.editorCreate();

    //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
    const bar = this.add.rectangle(
      this.progressBar.x - this.progressBar.width / 2 + 4,
      this.progressBar.y,
      4,
      28,
      0xffffff
    );

    //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
    this.load.on("progress", (progress: number) => {
      //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
      bar.width = 4 + 460 * progress;
    });
  }

  preload() {
    // Use the 'pack' file to load in any assets you need for this scene
    this.load.pack("button-pack", "assets/buttons/button-pack.json");
    this.load.pack("effect-pack", "assets/effects/effect-pack.json");
    this.load.pack("weapon-pack", "assets/weapons/weapon-pack.json");
    this.load.pack("character-pack", "assets/character/character-pack.json");
    this.load.json("characterShapes", "assets/character/character.xml.json");
    this.load.pack("sound-pack", "assets/sounds/sound-pack.json");
    this.load.image("bg1", "assets/bg1.png");

    this.load.animation(
      "weapon-animations",
      "assets/weapons/weapon-animations.json"
    );
    this.load.animation(
      "effect-animations",
      "assets/effects/effect-animations.json"
    );
  }

  create() {
    //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
    //  For example, you can define global animations here, so we can use them in other scenes.
    //  Move to the MainGame. You could also swap this for a Scene Transition, such as a camera fade.
    this.scene.transition({
      target: "MainGame",
      duration: 3000,
      moveBelow: false,
    });
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here

