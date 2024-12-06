import Phaser from "phaser";

export default class Preloader extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Rectangle;

  constructor() {
    super("Preloader");
  }

  init() {
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

    // Add weapons data to registry
    const weapons = [
      {
        id: "weapon1",
        name: "deagle",
        texture: "deagle-button",
        tier: 1,
        price: 0,
        unlocked: true,
        hitbox: new Phaser.Geom.Rectangle(-25, -75, 250, 150),
      },
      {
        id: "weapon2",
        name: "grenade",
        texture: "grenade-button",
        tier: 1,
        price: 0,
        unlocked: true,
        hitbox: new Phaser.Geom.Rectangle(-100, 100, 200, 250),
      },
      {
        id: "weapon3",
        name: "knife",
        texture: "knife-button",
        tier: 1,
        price: 0,
        unlocked: true,
        hitbox: new Phaser.Geom.Rectangle(75, 75, 150, 300),
      },
      {
        id: "weapon4",
        name: "tommy",
        texture: "tommy-button",
        tier: 2,
        price: 1000,
        unlocked: false,
        hitbox: new Phaser.Geom.Rectangle(-25, -100, 300, 150),
      },
      {
        id: "weapon5",
        name: "chainsaw",
        texture: "chainsaw-button",
        tier: 2,
        price: 1500,
        unlocked: false,
        hitbox: new Phaser.Geom.Rectangle(-25, 40, 300, 150),
      },
      {
        id: "weapon6",
        name: "sticky-bomb",
        texture: "sticky-bomb-button",
        tier: 2,
        price: 3500,
        unlocked: false,
        hitbox: new Phaser.Geom.Rectangle(-25, 200, 300, 150),
      },
      {
        id: "weapon7",
        name: "mg",
        texture: "mg-button",
        tier: 3,
        price: 2000,
        unlocked: false,
        hitbox: new Phaser.Geom.Rectangle(0, -100, 350, 100),
      },
      {
        id: "weapon8",
        name: "rpg",
        texture: "rpg-button",
        tier: 3,
        price: 3500,
        unlocked: false,
        hitbox: new Phaser.Geom.Rectangle(0, 40, 350, 100),
      },
      {
        id: "weapon9",
        name: "fire-bomb",
        texture: "firebomb-button",
        tier: 3,
        price: 1500,
        unlocked: false,
        hitbox: new Phaser.Geom.Rectangle(-20, 175, 150, 150),
      },
      {
        id: "weapon10",
        name: "railgun",
        texture: "railgun-button",
        tier: 4,
        price: 8000,
        unlocked: false,
        hitbox: new Phaser.Geom.Rectangle(20, -75, 350, 150),
      },
      {
        id: "weapon11",
        name: "lightsaber",
        texture: "lightsaber-button",
        tier: 4,
        price: 12000,
        unlocked: false,
        hitbox: new Phaser.Geom.Rectangle(0, 45, 300, 75),
      },
      {
        id: "weapon12",
        name: "raygun",
        texture: "raygun-button",
        tier: 4,
        price: 25000,
        unlocked: false,
        hitbox: new Phaser.Geom.Rectangle(20, 175, 200, 200),
      },
    ];

    this.registry.set("weapons", weapons);

    const items = [
      {
        id: "dynamite",
        name: "dynamite",
        texture: "dynamite-item",
        tier: 1,
        price: 0,
        unlocked: true,
        hitbox: new Phaser.Geom.Rectangle(-25, -100, 350, 200),
      },
      {
        id: "gasnade",
        name: "gasnade",
        texture: "gasnade-item",
        tier: 1,
        price: 0,
        unlocked: false,
        hitbox: new Phaser.Geom.Rectangle(-25, 125, 350, 200),
      },
      {
        id: "katana",
        name: "katana",
        texture: "katana-item",
        tier: 2,
        price: 0,
        unlocked: true,
        hitbox: new Phaser.Geom.Rectangle(-125, 25, 150, 450),
      },
      {
        id: "battle-axe",
        name: "battle-axe",
        texture: "battleaxe-item",
        tier: 2,
        price: 1000,
        unlocked: false,
        hitbox: new Phaser.Geom.Rectangle(75, 25, 150, 450),
      },
      {
        id: "kar98",
        name: "kar98",
        texture: "kar98-item",
        tier: 3,
        price: 1500,
        unlocked: true,
        hitbox: new Phaser.Geom.Rectangle(-100, -25, 200, 350),
      },
      {
        id: "flamethrower",
        name: "flamethrower",
        texture: "flamethrower-item",
        tier: 3,
        price: 2000,
        unlocked: true,
        hitbox: new Phaser.Geom.Rectangle(50, 150, 200, 250),
      },
    ];

    this.registry.set("items", items);
  }

  preload() {
    this.load.pack("button-pack", "assets/buttons/button-pack.json");
    this.load.pack("effect-pack", "assets/effects/effect-pack.json");
    this.load.pack("weapon-pack", "assets/weapons/weapon-pack.json");
    this.load.pack("character-pack", "assets/character/character-pack.json");
    this.load.pack("sound-pack", "assets/sounds/sound-pack.json");
    this.load.pack("background-pack", "assets/backgrounds/bg-pack.json");
    this.load.json("characterShapes", "assets/character/character.xml.json");
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
    this.scene.start("MainGame");
  }
}

