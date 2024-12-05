export class TextButton extends Phaser.GameObjects.Text {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    style: Phaser.Types.GameObjects.Text.TextStyle,
    callback: () => void
  ) {
    super(scene, x, y, text, style);

    this.setInteractive({ useHandCursor: true })
      .on("pointerover", () => this.enterButtonHoverState())
      .on("pointerout", () => this.enterButtonRestState())
      .on("pointerdown", () => this.enterButtonActiveState())
      .on("pointerup", () => {
        this.enterButtonHoverState();
        callback();
      });
  }

  enterButtonHoverState() {
    this.setScale(1.1);
    this.setStyle({ fill: "#ffffff" });
  }

  enterButtonRestState() {
    this.setScale(1);
    this.setStyle({ fill: "#ffffff" });
  }

  enterButtonActiveState() {
    this.setStyle({ fill: "#0f0" });
  }
}

