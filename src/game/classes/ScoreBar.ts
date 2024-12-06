import { EventBus } from "../EventBus";

interface ScoreBarConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  health: number;
}

export class ScoreBar extends Phaser.GameObjects.Container {
  private health!: number;
  private kills!: number;
  private coins!: number;
  private healthBarWidth!: number;
  // Health Bar Elements
  private healthBarBackground: Phaser.GameObjects.Rectangle;
  private healthBarFill: Phaser.GameObjects.Rectangle;
  private healthText: Phaser.GameObjects.Text;

  // Kill Count
  private killCountText: Phaser.GameObjects.Text;

  // Coins
  private coinsText: Phaser.GameObjects.Text;
  private coinImage: Phaser.GameObjects.Image;

  constructor(config: ScoreBarConfig) {
    super(config.scene, config.x, config.y);
    this.scene.add.existing(this);
    this.healthBarWidth = config.width;
    this.health = config.health;

    const kills = parseInt(localStorage.getItem("kills") || "0");
    const coins = parseInt(localStorage.getItem("coins") || "0");

    this.kills = kills;
    this.coins = coins;
    this.createHealthBar(config.health);
    this.createKillCount(kills);
    this.createCoins(coins);
    this.setupEventListeners();
  }

  private createHealthBar(initialHealth: number): void {
    // Health Bar Background
    this.healthBarBackground = this.scene.add
      .rectangle(0, 0, this.healthBarWidth, 20, 0x000000)
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.add(this.healthBarBackground);

    // Health Bar Fill
    this.healthBarFill = this.scene.add
      .rectangle(0, 0, this.healthBarWidth, 20, 0xff0000)
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.add(this.healthBarFill);

    // Health Text
    this.healthText = this.scene.add
      .text(0, 0, `${initialHealth}%`, {
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.add(this.healthText);
  }

  private createKillCount(initialKills: number): void {
    this.killCountText = this.scene.add
      .text(350, 0, `Kills: ${initialKills}`, {
        fontFamily: "Ultra",
        fontSize: "24px",
        stroke: "#000000",
        strokeThickness: 4,
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.add(this.killCountText);
  }

  private createCoins(initialCoins: number): void {
    this.coinsText = this.scene.add
      .text(525, 0, `${initialCoins}`, {
        fontFamily: "Ultra",
        fontSize: "24px",
        stroke: "#000000",
        strokeThickness: 4,
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    this.coinImage = this.scene.add
      .image(455, 0, "coin")
      .setOrigin(0.5)
      .setScale(0.07)
      .setScrollFactor(0);
    this.add([this.coinsText, this.coinImage]);
  }

  private setupEventListeners(): void {
    // Listen to health changes
    EventBus.on("health-changed", this.updateHealth, this);

    // Listen to kill count changes
    EventBus.on("kill-count-changed", this.updateKills, this);

    // Listen to coins changes
    EventBus.on("coins-changed", this.updateCoins, this);
  }

  public updateKills(): void {
    this.kills += 1;
    this.killCountText.setText(`Kills: ${this.kills}`);
    localStorage.setItem("kills", this.kills.toString());
  }

  public updateHealth(amount: number): void {
    this.health -= amount;
    this.health = Phaser.Math.Clamp(this.health, 0, 100);
    this.healthText.setText(`${this.health.toFixed(2)}%`);
    const healthPercent = Phaser.Math.Clamp(this.health / 100, 0, 1);
    this.healthBarFill.width = this.healthBarWidth * healthPercent;

    if (this.health <= 0) {
      this.updateKills();
      this.health = 100;
      this.healthText.setText(`${this.health.toFixed(2)}%`);
      this.healthBarFill.width = this.healthBarWidth;
    }
  }

  public updateCoins(amount: number = 1): void {
    this.coins += amount;
    this.coinsText.setText(`${this.coins}`);
    localStorage.setItem("coins", this.coins.toString());
  }

  public destroy(fromScene?: boolean): void {
    // Remove event listeners
    EventBus.off("health-changed", this.updateHealth, this);
    EventBus.off("kill-count-changed", this.updateKills, this);
    EventBus.off("coins-changed", this.updateCoins, this);

    super.destroy(fromScene);
  }
}

