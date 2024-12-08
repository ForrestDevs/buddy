import { Scene } from "phaser";

export default class Boot extends Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    this.load.pack("pack", "assets/boot-asset-pack.json");
  }

  private createMarketcap(): void {
    this.registry.set("marketcap", "0");
  }

  create() {
    this.createMarketcap();
    this.scene.start("MainMenu");
  }
}

