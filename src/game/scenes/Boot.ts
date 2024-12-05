import { Scene } from "phaser";

export default class Boot extends Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    this.load.pack("pack", "assets/boot-asset-pack.json");
  }

  create() {
    this.scene.start("MainMenu");
  }
}

