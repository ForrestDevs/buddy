import Phaser from "phaser";
import {
  BoxButtons,
  ShopItemButton,
  SkinButtons,
  TierButtons,
  WeaponButton,
} from "../classes/Journal";
import { BlobAssetLoader } from "../classes/BlobAssetLoader";

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
  }

  preload() {
    // Load all packs in parallel
    this.load.pack("blob-effects-pack", "assets/packs/blob-effects-pack.json");
    this.load.pack("blob-weapons-pack", "assets/packs/blob-weapons-pack.json");
    this.load.pack(
      "blob-character-pack",
      "assets/packs/blob-character-pack.json"
    );
    this.load.pack("blob-sounds-pack", "assets/packs/blob-sounds-pack.json");
    this.load.pack("blob-buttons-pack", "assets/packs/blob-buttons-pack.json");
    this.load.pack(
      "blob-backgrounds-pack",
      "assets/packs/blob-backgrounds-pack.json"
    );

    // Load animations and other files
    this.load.json("characterShapes", "assets/character/character.xml.json");
    this.load.animation(
      "weapon-animations",
      "assets/weapons/weapon-animations.json"
    );
    this.load.animation(
      "effect-animations",
      "assets/effects/effect-animations.json"
    );

    // Start loading everything
    this.load.start();
  }

  private getPurchasedStates(key: string): Record<string, boolean> {
    console.log(key);
    const stored = localStorage.getItem(key);
    console.log(stored);
    return stored ? JSON.parse(stored) : {};
  }

  private getMarketcap(): number {
    const marketcap = this.registry.get("marketcap");
    return parseInt(marketcap);
  }

  create() {
    const weaponPurchases = this.getPurchasedStates("weapon-purchases");
    const itemPurchases = this.getPurchasedStates("item-purchases");
    const boxPurchases = this.getPurchasedStates("box-purchases");
    const skinPurchases = this.getPurchasedStates("skin-purchases");

    // Add weapons data to registry
    const weapons: WeaponButton[] = [
      {
        name: "deagle",
        tier: 1,
        price: 0,
        purchased: true,
        hitbox: new Phaser.Geom.Rectangle(-25, -75, 250, 150),
      },
      {
        name: "grenade",
        tier: 1,
        price: 0,
        purchased: true,
        hitbox: new Phaser.Geom.Rectangle(-100, 100, 200, 250),
      },
      {
        name: "knife",
        tier: 1,
        price: 0,
        purchased: true,
        hitbox: new Phaser.Geom.Rectangle(75, 75, 150, 300),
      },
      {
        name: "tommy",
        tier: 2,
        price: 1000,
        purchased: weaponPurchases["tommy"] ?? false,
        hitbox: new Phaser.Geom.Rectangle(-25, -100, 300, 150),
      },
      {
        name: "chainsaw",
        tier: 2,
        price: 1500,
        purchased: weaponPurchases["chainsaw"] ?? false,
        hitbox: new Phaser.Geom.Rectangle(-25, 40, 300, 150),
      },
      {
        name: "sticky-bomb",
        tier: 2,
        price: 3500,
        purchased: weaponPurchases["sticky-bomb"] ?? false,
        hitbox: new Phaser.Geom.Rectangle(-25, 200, 300, 150),
      },
      {
        name: "mg",
        tier: 3,
        price: 2000,
        purchased: weaponPurchases["mg"] ?? false,
        hitbox: new Phaser.Geom.Rectangle(0, -100, 350, 100),
      },
      {
        name: "rpg",
        tier: 3,
        price: 3500,
        purchased: weaponPurchases["rpg"] ?? false,
        hitbox: new Phaser.Geom.Rectangle(0, 40, 350, 100),
      },
      {
        name: "fire-bomb",
        tier: 3,
        price: 1500,
        purchased: weaponPurchases["fire-bomb"] ?? false,
        hitbox: new Phaser.Geom.Rectangle(-20, 175, 150, 150),
      },
      {
        name: "railgun",
        tier: 4,
        price: 8000,
        purchased: weaponPurchases["railgun"] ?? false,
        hitbox: new Phaser.Geom.Rectangle(20, -75, 350, 150),
      },
      {
        name: "lightsaber",
        tier: 4,
        price: 12000,
        purchased: weaponPurchases["lightsaber"] ?? false,
        hitbox: new Phaser.Geom.Rectangle(0, 45, 300, 75),
      },
      {
        name: "raygun",
        tier: 4,
        price: 25000,
        purchased: weaponPurchases["raygun"] ?? false,
        hitbox: new Phaser.Geom.Rectangle(20, 175, 200, 200),
      },
    ];
    this.registry.set("weapon-buttons", weapons);
    // Add shop items data to registry
    const items: ShopItemButton[] = [
      {
        name: "dynamite",
        tier: 1,
        price: 3500,
        purchased: itemPurchases["dynamite"] ?? false,
        unlocked: true,
        hitbox: new Phaser.Geom.Rectangle(-25, -100, 350, 200),
      },
      {
        name: "gasnade",
        tier: 1,
        price: 0,
        purchased: true,
        unlocked: false,
        hitbox: new Phaser.Geom.Rectangle(-25, 125, 350, 200),
      },
      {
        name: "katana",
        tier: 2,
        price: 8000,
        purchased: itemPurchases["katana"] ?? false,
        unlocked: true,
        hitbox: new Phaser.Geom.Rectangle(-125, 25, 150, 450),
      },
      {
        name: "battleaxe",
        tier: 2,
        price: 1000,
        purchased: true,
        unlocked: false,
        hitbox: new Phaser.Geom.Rectangle(75, 25, 150, 450),
      },
      {
        name: "kar98",
        tier: 3,
        price: 13000,
        purchased: itemPurchases["kar98"] ?? false,
        unlocked: true,
        hitbox: new Phaser.Geom.Rectangle(-100, -25, 200, 350),
      },
      {
        name: "flamethrower",
        tier: 3,
        price: 18000,
        purchased: itemPurchases["flamethrower"] ?? false,
        unlocked: true,
        hitbox: new Phaser.Geom.Rectangle(50, 150, 200, 250),
      },
    ];
    this.registry.set("shop-buttons", items);
    // Add boxes data to registry
    const boxes: BoxButtons = {
      1: {
        name: "main",
        bg: "bg-main",
        price: 0,
        purchased: true,
      },
      2: {
        name: "shoe",
        bg: "bg-shoe",
        price: 5000,
        purchased: boxPurchases["shoe"] ?? false,
      },
      3: {
        name: "present",
        bg: "bg-present",
        price: 8000,
        purchased: boxPurchases["present"] ?? false,
      },
      4: {
        name: "basket",
        bg: "bg-basket",
        price: 13000,
        purchased: boxPurchases["basket"] ?? false,
      },
      5: {
        name: "blood",
        bg: "bg-bloody",
        price: 18000,
        purchased: boxPurchases["blood"] ?? false,
      },
      6: {
        name: "coming-soon",
        bg: "",
        price: 0,
        purchased: true,
      },
    };
    this.registry.set("box-buttons", boxes);
    // Add skins data to registry
    const skins: SkinButtons = {
      1: {
        name: "paper",
        price: 0,
        purchased: true,
        unlocked: true,
      },
      2: {
        name: "buddy",
        price: 0,
        purchased: skinPurchases["buddy"] ?? false,
        unlocked: true,
      },
      3: {
        name: "musk",
        price: 5000,
        purchased: skinPurchases["musk"] ?? false,
        unlocked: this.getMarketcap() >= 1000000,
      },
      4: {
        name: "mil",
        price: 10000,
        purchased: skinPurchases["mil"] ?? false,
        unlocked: this.getMarketcap() >= 5000000,
      },
      5: {
        name: "santa",
        price: 13000,
        purchased: skinPurchases["santa"] ?? false,
        unlocked: true,
      },
      6: {
        name: "sol",
        price: 22000,
        purchased: skinPurchases["sol"] ?? false,
        unlocked: this.getMarketcap() >= 10000000,
      },
      7: {
        name: "coming-soon",
        price: 0,
        purchased: true,
        unlocked: false,
      },
    };
    this.registry.set("skin-buttons", skins);

    const tierButtons: TierButtons = {
      1: { name: "PAPER", bg: "tier1-bg", unlocked: true },
      2: {
        name: "MUSK",
        bg: "tier2-bg",
        unlocked: this.getMarketcap() >= 1000000,
      },
      3: {
        name: "MIL",
        bg: "tier3-bg",
        unlocked: this.getMarketcap() >= 5000000,
      },
      4: {
        name: "SOL",
        bg: "tier4-bg",
        unlocked: this.getMarketcap() >= 10000000,
      },
    };
    this.registry.set("tier-buttons", tierButtons);

    this.scene.start("MainGame");
  }
}

