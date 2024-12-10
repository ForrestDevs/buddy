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
  private healthBarBackground: Phaser.GameObjects.Image;
  private healthBarFill: Phaser.GameObjects.Rectangle;
  private healthBarMarker: Phaser.GameObjects.Image;
  private healthText: Phaser.GameObjects.Text;

  private skin: string = "paper";
  private damageState: string = "clean";

  // Kill Count
  private killCountText: Phaser.GameObjects.Text;

  // Coins
  private coinsText: Phaser.GameObjects.Text;
  private coinImage: Phaser.GameObjects.Image;

  constructor(config: ScoreBarConfig) {
    super(config.scene, config.x, config.y);
    this.scene.add.existing(this);
    this.healthBarWidth = 420;
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
    // Health Bar Fill
    this.healthBarFill = this.scene.add
      .rectangle(0, 10, this.healthBarWidth, 20, 0x30cfd0)
      .setOrigin(0.5)
      .setDepth(1)
      .setScrollFactor(0);
    this.add(this.healthBarFill);

    // Health Bar Background
    this.healthBarBackground = this.scene.add
      .image(0, 10, "healthbar")
      .setScale(0.45)
      .setOrigin(0.5)
      .setDepth(4)
      .setScrollFactor(0);
    this.add(this.healthBarBackground);

    // Health Bar Marker
    this.healthBarMarker = this.scene.add
      .image(200, 8, "paper-clean")
      .setScale(0.2)
      .setOrigin(0.5)
      .setDepth(5)
      .setScrollFactor(0);
    this.add(this.healthBarMarker);
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
    EventBus.on("health-update", this.setHealth, this);
    // Listen to health changes
    EventBus.on("health-changed", this.updateHealth, this);
    // Listen to kill count changes
    EventBus.on("kill-count-changed", this.updateKills, this);
    // Listen to coins changes
    EventBus.on("coins-changed", this.updateCoins, this);
    // Listen to Skin changes
    EventBus.on("skin-equipped", this.updateSkin, this);
    // Listen to Damage State changes
    EventBus.on("damage-state-changed", this.updateDamageState, this);
    EventBus.on("reset-health-bar", this.resetHealthBar, this);
    EventBus.on("set-coins", this.setCoins, this);
  }

  private updateSkin(skin: string): void {
    this.skin = skin;
    this.healthBarMarker.setTexture(this.skin + "-" + this.damageState);
  }

  private updateDamageState(damageState: string): void {
    this.damageState = damageState;
    this.healthBarMarker.setTexture(this.skin + "-" + this.damageState);
  }

  public updateKills(): void {
    this.kills += 1;
    this.killCountText.setText(`Kills: ${this.kills}`);
    localStorage.setItem("kills", this.kills.toString());
  }

  private setHealth(amount: number): void {
    this.health = amount;
    const healthPercent = Phaser.Math.Clamp(this.health / 100, 0, 1);
    this.healthBarFill.width = this.healthBarWidth * healthPercent;
    this.moveHealthBarMarker(healthPercent);
  }

  private setCoins(value: number) {
    this.coins = value;
    this.coinsText.setText(`${this.coins}`);
    localStorage.setItem("coins", this.coins.toString());
  }

  private moveHealthBarMarker(healthPercent: number): void {
    // Stop marker movement at 5% health
    const minHealthPercent = 0.05;
    if (healthPercent < minHealthPercent) {
      healthPercent = minHealthPercent;
    }

    const newWidth = this.healthBarWidth * healthPercent;
    const markerX = 200 - (this.healthBarWidth - newWidth); // Start at 200 and move right based on remaining health
    this.healthBarMarker.setX(markerX);
  }

  public updateHealth(amount: number): void {
    // Don't update health if already at 0 (dead and respawning)
    if (this.health <= 0) {
      return;
    }

    // Prevent health from going negative by clamping the amount
    const newHealth = Math.max(0, this.health - amount);
    this.health = Phaser.Math.Clamp(newHealth, 0, 100);

    const healthPercent = Phaser.Math.Clamp(this.health / 100, 0, 1);
    this.healthBarFill.width = this.healthBarWidth * healthPercent;
    this.moveHealthBarMarker(healthPercent);
  }

  private resetHealthBar(): void {
    this.updateKills();
    this.health = 100;
    this.healthBarFill.width = this.healthBarWidth;
    this.moveHealthBarMarker(1);
    this.damageState = "clean";
    this.healthBarMarker.setTexture(this.skin + "-" + this.damageState);
  }

  public updateCoins(amount: number = 1): void {
    this.coins = Math.min(this.coins + amount, 99999);
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

