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
    this.add.image(512, 384, "background");

    // progressBar
    const progressBar = this.add.rectangle(512, 384, 468, 32);
    progressBar.isFilled = true;
    progressBar.fillColor = 14737632;
    progressBar.isStroked = true;

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
    this.load.pack("preload", "assets/preload-asset-pack.json");
    this.load.image("bg", "assets/bg.jpeg");
    this.load.image("head", "assets/character/Head.png");
    this.load.image("body", "assets/character/Torso.png");
    this.load.image("left-arm", "assets/character/Larm.png");
    this.load.image("right-arm", "assets/character/Rarm.png");
    this.load.image("left-leg", "assets/character/Lleg.png");
    this.load.image("right-leg", "assets/character/Rleg.png");
    this.load.json("characterShapes", "assets/character/character.xml.json");

    this.load.json("weaponShapes", "assets/weapons.xml.json");
    this.load.image("tommy", "assets/TommyGun.png");
    this.load.image("deg", "assets/DesertEagle.png");
  }

  create() {
    //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
    //  For example, you can define global animations here, so we can use them in other scenes.
    //  Move to the MainGame. You could also swap this for a Scene Transition, such as a camera fade.
    this.scene.start("MainGame");
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here

