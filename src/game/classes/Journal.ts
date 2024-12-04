import { EventBus } from "../EventBus";

interface JournalManagerConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
}

export class JournalManager extends Phaser.GameObjects.Container {
  private currentJournal: string | null = null;
  private basePaper: Phaser.GameObjects.Image;
  private closeButton: Phaser.GameObjects.Image;
  private journalContents: Map<string, Phaser.GameObjects.Container> =
    new Map();
  private isAnimating: boolean = false;

  // Position constants
  private readonly HIDDEN_X = 1480;
  private readonly VISIBLE_X = 1000;

  constructor(config: JournalManagerConfig) {
    super(config.scene, config.x, config.y);
    this.scene.add.existing(this);

    this.createBase();
    this.createJournalContents();
    this.setupEventListeners();

    // Start hidden
    this.setX(this.HIDDEN_X);
    this.setVisible(false);
  }

  private createBase(): void {
    // Create the base journal paper that will be shared
    this.basePaper = this.scene.add
      .image(0, 0, "journal-base")
      .setOrigin(0.5)
      .setDisplaySize(400, 600);

    // Create close button
    this.closeButton = this.scene.add
      .image(-180, -270, "close-button")
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => this.closeButton.setTint(0xff9999))
      .on("pointerout", () => this.closeButton.clearTint())
      .on("pointerdown", () => this.close());

    this.add([this.basePaper, this.closeButton]);
  }

  private createJournalContents(): void {
    // Create containers for each journal type
    ["levels", "shop", "boxes", "skins"].forEach((type) => {
      const content = new Phaser.GameObjects.Container(this.scene, 0, 0);
      this.createContentForType(type, content);
      content.setVisible(false);
      this.journalContents.set(type, content);
      this.add(content);
    });
  }

  private createContentForType(
    type: string,
    container: Phaser.GameObjects.Container
  ): void {
    switch (type) {
      case "levels":
        this.createLevelsContent(container);
        break;
      case "shop":
        this.createShopContent(container);
        break;
      case "boxes":
        this.createBoxesContent(container);
        break;
      case "skins":
        this.createSkinsContent(container);
        break;
    }
  }

  private createLevelsContent(container: Phaser.GameObjects.Container): void {
    const title = this.scene.add
      .text(0, -250, "LEVELS", {
        fontSize: "32px",
        color: "#000",
      })
      .setOrigin(0.5);
    container.add(title);
    // Add more levels content...
  }

  private createShopContent(container: Phaser.GameObjects.Container): void {
    const title = this.scene.add
      .text(0, -250, "SHOP", {
        fontSize: "32px",
        color: "#000",
      })
      .setOrigin(0.5);
    container.add(title);
    // Add more shop content...
  }

  private createBoxesContent(container: Phaser.GameObjects.Container): void {
    const title = this.scene.add
      .text(0, -250, "BOXES", {
        fontSize: "32px",
        color: "#000",
      })
      .setOrigin(0.5);
    container.add(title);
    // Add more boxes content...
  }

  private createSkinsContent(container: Phaser.GameObjects.Container): void {
    const title = this.scene.add
      .text(0, -250, "SKINS", {
        fontSize: "32px",
        color: "#000",
      })
      .setOrigin(0.5);
    container.add(title);
    // Add more skins content...
  }

  private setupEventListeners(): void {
    EventBus.on("open-journal", this.handleJournalOpen, this);
  }

  private handleJournalOpen = (journalType: string): void => {
    if (this.isAnimating) return;

    if (this.currentJournal === journalType) {
      this.close();
      return;
    }

    if (this.currentJournal) {
      // Switch content if a journal is already open
      this.switchContent(journalType);
    } else {
      // Open new journal if none is open
      this.open(journalType);
    }
  };

  private switchContent(newType: string): void {
    // Hide current content
    if (this.currentJournal) {
      this.journalContents.get(this.currentJournal)?.setVisible(false);
    }

    // Show new content
    this.journalContents.get(newType)?.setVisible(true);
    this.currentJournal = newType;

    // Play switch sound
    // this.scene.sound.play("journal-switch");
  }

  private open(journalType: string): void {
    this.isAnimating = true;
    this.setVisible(true);

    // Show the correct content
    this.journalContents.forEach((content, type) => {
      content.setVisible(type === journalType);
    });

    this.currentJournal = journalType;

    // Slide in animation
    this.scene.tweens.add({
      targets: this,
      x: this.VISIBLE_X,
      duration: 500,
      ease: "Power2",
      onComplete: () => {
        this.isAnimating = false;
        // this.scene.sound.play("journal-open");
      },
    });
  }

  private close(): void {
    if (this.isAnimating) return;

    this.isAnimating = true;

    // Slide out animation
    this.scene.tweens.add({
      targets: this,
      x: this.HIDDEN_X,
      duration: 500,
      ease: "Power2",
      onComplete: () => {
        this.isAnimating = false;
        this.setVisible(false);
        this.currentJournal = null;
        EventBus.emit("journal-closed");
        // this.scene.sound.play("journal-close");
      },
    });
  }

  public destroy(): void {
    EventBus.off("open-journal", this.handleJournalOpen, this);
    super.destroy();
  }
}

