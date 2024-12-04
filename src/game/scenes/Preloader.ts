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

    // Create dummy shop items
    const shopItems = [
      {
        id: "weapon1",
        name: "Basic Pistol",
        texture: "pistol",
        price: 100,
        type: "weapon",
        unlocked: true,
        description: "A reliable starter weapon",
        hitbox: new Phaser.Geom.Rectangle(0, 0, 100, 100),
      },
      {
        id: "weapon2",
        name: "Shotgun",
        texture: "shotgun",
        price: 500,
        type: "weapon",
        unlocked: false,
        description: "Powerful short-range weapon",
        hitbox: new Phaser.Geom.Rectangle(0, 0, 100, 100),
      },
      {
        id: "weapon3",
        name: "Assault Rifle",
        texture: "rifle",
        price: 1000,
        type: "weapon",
        unlocked: false,
        description: "High rate of fire",
        hitbox: new Phaser.Geom.Rectangle(0, 0, 100, 100),
      },
      {
        id: "weapon4",
        name: "Sniper Rifle",
        texture: "sniper",
        price: 2000,
        type: "weapon",
        unlocked: false,
        description: "Long range precision",
        hitbox: new Phaser.Geom.Rectangle(0, 0, 100, 100),
      },
      {
        id: "weapon5",
        name: "Rocket Launcher",
        texture: "rocket",
        price: 5000,
        type: "weapon",
        unlocked: false,
        description: "Explosive area damage",
        hitbox: new Phaser.Geom.Rectangle(0, 0, 100, 100),
      },
      {
        id: "weapon6",
        name: "Ray Gun",
        texture: "raygun",
        price: 10000,
        type: "weapon",
        unlocked: false,
        description: "Advanced energy weapon",
        hitbox: new Phaser.Geom.Rectangle(0, 0, 100, 100),
      },
    ];

    // Add shop items to registry
    this.registry.set("shopItems", shopItems);

    // Add weapons data to registry
    const weapons = [
      {
        id: "weapon1",
        name: "deagle",
        texture: "deagle-button",
        tier: 1,
        price: 0,
        unlocked: true,
        hitbox: new Phaser.Geom.Rectangle(0, -100, 300, 100),
      },
      {
        id: "weapon2",
        name: "grenade",
        texture: "grenade-button",
        tier: 1,
        price: 0,
        unlocked: true,
        hitbox: new Phaser.Geom.Rectangle(-100, 100, 200, 100),
      },
      {
        id: "weapon3",
        name: "knife",
        texture: "knife-button",
        tier: 1,
        price: 0,
        unlocked: true,
        hitbox: new Phaser.Geom.Rectangle(100, 100, 100, 300),
      },
      {
        id: "weapon4",
        name: "tommy",
        texture: "tommy-button",
        tier: 2,
        price: 1000,
        unlocked: false,
        hitbox: new Phaser.Geom.Rectangle(0, -100, 300, 100),
      },
      {
        id: "weapon5",
        name: "chainsaw",
        texture: "chainsaw-button",
        tier: 2,
        price: 1500,
        unlocked: false,
        hitbox: new Phaser.Geom.Rectangle(0, 40, 300, 100),
      },
      {
        id: "weapon6",
        name: "fire-bomb",
        texture: "firebomb-button",
        tier: 2,
        price: 1500,
        unlocked: false,
        hitbox: new Phaser.Geom.Rectangle(-20, 200, 150, 120),
      },
      {
        id: "weapon7",
        name: "mg",
        texture: "mg-button",
        tier: 3,
        price: 2000,
        unlocked: false,
        hitbox: new Phaser.Geom.Rectangle(0, -100, 400, 100),
      },
      {
        id: "weapon8",
        name: "rpg",
        texture: "rpg-button",
        tier: 3,
        price: 3500,
        unlocked: false,
        hitbox: new Phaser.Geom.Rectangle(0, 40, 400, 100),
      },
      {
        id: "weapon9",
        name: "sticky-bomb",
        texture: "sticky-bomb-button",
        tier: 3,
        price: 3500,
        unlocked: false,
        hitbox: new Phaser.Geom.Rectangle(20, 200, 150, 120),
      },
      {
        id: "weapon10",
        name: "railgun",
        texture: "railgun-button",
        tier: 4,
        price: 8000,
        unlocked: false,
        hitbox: new Phaser.Geom.Rectangle(0, -50, 350, 100),
      },
      {
        id: "weapon11",
        name: "lightsaber",
        texture: "lightsaber-button",
        tier: 4,
        price: 12000,
        unlocked: false,
        hitbox: new Phaser.Geom.Rectangle(0, 45, 300, 100),
      },
      {
        id: "weapon12",
        name: "raygun",
        texture: "raygun-button",
        tier: 4,
        price: 25000,
        unlocked: false,
        hitbox: new Phaser.Geom.Rectangle(0, 200, 200, 150),
      },
    ];

    this.registry.set("weapons", weapons);
  }

  preload() {
    // Use the 'pack' file to load in any assets you need for this scene
    this.load.pack("button-pack", "assets/buttons/button-pack.json");
    this.load.pack("effect-pack", "assets/effects/effect-pack.json");
    this.load.pack("weapon-pack", "assets/weapons/weapon-pack.json");
    this.load.pack("character-pack", "assets/character/character-pack.json");
    this.load.json("characterShapes", "assets/character/character.xml.json");
    this.load.pack("sound-pack", "assets/sounds/sound-pack.json");
    this.load.pack("background-pack", "assets/backgrounds/bg-pack.json");

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

