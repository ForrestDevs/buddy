import { EventBus } from "../EventBus";

type JournalType = "levels" | "shop" | "skins" | "boxes";
type JournalState = "closed" | "main" | "tier" | "shop";

interface JournalManagerConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
}

interface Weapon {
  id: string;
  name: string;
  texture: string;
  price: number;
  unlocked: boolean;
  tier: number;
  hitbox: Phaser.Geom.Rectangle;
}

interface BoxReward {
  type: string;
  item: string;
  rarity: string;
}

interface ShopItem {
  id: string;
  name: string;
  texture: string;
  tier: number;
  price: number;
  unlocked: boolean;
  hitbox: Phaser.Geom.Rectangle;
}

interface Skin {
  name: string;
  texture: string;
  price: number;
  unlocked: boolean;
  purchased: boolean;
}

interface TierData {
  name: string;
  texture: string;
  bg: string;
}

interface Box {
  name: string;
  texture: string;
  bg: string;
  price: number;
  unlocked: boolean;
  purchased: boolean;
}

interface SkinData {
  name: string;
  texture: string;
}

const JOURNAL_SCALE = 0.6;
const HITAREA_ALPHA = 0;

export class JournalManager extends Phaser.GameObjects.Container {
  private currentJournal: JournalType | null = null;
  private currentState: JournalState = "closed";
  private currentTier: number = 1;
  private currentBox: number = 1;
  private currentSkin: number = 1;
  private currentShop: number = 1;
  private isAnimating: boolean = false;

  // UI Elements
  private basePaper: Phaser.GameObjects.Image;
  private closeButton: Phaser.GameObjects.Image;
  private backButton: Phaser.GameObjects.Container;
  private advanceButton: Phaser.GameObjects.Container;

  // Content containers
  private journalContents: Map<JournalType, Phaser.GameObjects.Container>;
  private tierContents: Map<number, Phaser.GameObjects.Container>;
  private shopContents: Map<number, Phaser.GameObjects.Container>;

  private readonly TIER_INFO: Record<number, TierData> = {
    1: { name: "PAPER", texture: "FREETier", bg: "tier1-bg" },
    2: { name: "MUSK", texture: "Tier2", bg: "tier2-bg" },
    3: { name: "MIL", texture: "Tier3", bg: "tier3-bg" },
    4: { name: "SOL", texture: "Tier4", bg: "tier4-bg" },
  };
  private readonly BOX_INFO: Record<number, Box> = {
    1: {
      name: "CARDBOARD",
      texture: "main-box",
      bg: "bg-main",
      price: 0,
      unlocked: true,
      purchased: false,
    },
    2: {
      name: "BASKET",
      texture: "basket-box",
      bg: "bg-basket",
      price: 0,
      unlocked: true,
      purchased: false,
    },
    3: {
      name: "BLOOD",
      texture: "blood-box",
      bg: "bg-bloody",
      price: 0,
      unlocked: true,
      purchased: false,
    },
    4: {
      name: "PRESENT",
      texture: "present-box",
      bg: "bg-present",
      price: 0,
      unlocked: true,
      purchased: false,
    },
    5: {
      name: "SHOE",
      texture: "shoe-box",
      bg: "bg-shoe",
      price: 0,
      unlocked: true,
      purchased: false,
    },
  };
  private readonly SKIN_INFO: Record<number, Skin> = {
    1: {
      name: "paper",
      texture: "FreeBud",
      price: 0,
      purchased: false,
      unlocked: true,
    },
    2: {
      name: "musk",
      texture: "Stage3G",
      price: 0,
      purchased: false,
      unlocked: true,
    },
    3: {
      name: "mil",
      texture: "Stage3T",
      price: 0,
      purchased: false,
      unlocked: true,
    },
    4: {
      name: "sol",
      texture: "Stage3S",
      price: 0,
      purchased: false,
      unlocked: true,
    },
  };

  // Position constants
  private readonly HIDDEN_X = 1480;
  private readonly VISIBLE_X = 1000;
  private tierPage!: Phaser.GameObjects.Image;
  private boxPage!: Phaser.GameObjects.Image;
  private tierText!: Phaser.GameObjects.Text;
  private skinPage!: Phaser.GameObjects.Image;
  private shopPage!: Phaser.GameObjects.Image;
  private pointerOver: boolean = false;

  constructor(config: JournalManagerConfig) {
    super(config.scene, config.x, config.y);
    this.setDepth(100);
    this.scene.add.existing(this);

    this.journalContents = new Map();
    this.tierContents = new Map();
    this.shopContents = new Map();

    this.createBase();
    this.createNavigationButtons();
    this.createLevelsJournal();
    this.createShopJournal();
    this.createSkinsJournal();
    this.createBoxesJournal();
    this.setupEventListeners();

    this.setX(this.HIDDEN_X);
    this.setVisible(false);
  }

  private createBase(): void {
    this.basePaper = this.scene.add
      .image(0, 0, "Page")
      .setOrigin(0.5)
      .setScale(JOURNAL_SCALE);
    this.add(this.basePaper);
  }

  private createNavigationButtons(): void {
    // Close button (always visible)
    this.closeButton = this.scene.add
      .image(-250, -260, "close")
      .setScale(0.15, 0.15)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => this.closeButton.setTint(0xff9999))
      .on("pointerout", () => this.closeButton.clearTint())
      .on("pointerdown", () => {
        this.scene.sound.play("click");
        this.closeJournal();
      });

    // Back button (only visible in tier view)
    const backButtonUI = this.scene.add
      .image(0, 0, "backarrow3")
      .setOrigin(0.5)
      .setScale(JOURNAL_SCALE);

    // Create invisible hit area for the button
    const backHitArea = this.scene.add
      .rectangle(
        185,
        245,
        70,
        70,
        0xff0000, // Color (won't be visible)
        HITAREA_ALPHA // Alpha (completely transparent)
      )
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        backButtonUI.setTexture("backarrow1");
      })
      .on("pointerout", () => {
        backButtonUI.setTexture("backarrow3");
      })
      .on("pointerdown", () => {
        this.goBack();
      });

    this.backButton = new Phaser.GameObjects.Container(this.scene, 0, 0);
    this.backButton.setVisible(false);
    this.backButton.add([backButtonUI, backHitArea]);

    // Advance button (only visible in levels main view)
    const advanceButtonUI = this.scene.add
      .image(0, 0, "backarrow")
      .setOrigin(0.5)
      .setScale(JOURNAL_SCALE);

    // Create invisible hit area for the button
    const hitArea = this.scene.add
      .rectangle(
        185,
        245,
        70,
        70,
        0xff0000, // Color (won't be visible)
        HITAREA_ALPHA // Alpha (completely transparent)
      )
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        advanceButtonUI.setScale(JOURNAL_SCALE + 0.005);
      })
      .on("pointerout", () => {
        advanceButtonUI.setScale(JOURNAL_SCALE);
      })
      .on("pointerdown", () => {
        switch (this.currentJournal) {
          case "levels":
            this.advanceTier();
            break;
          case "boxes":
            this.advanceBox();
            break;
          case "skins":
            this.advanceSkin();
            break;
          case "shop":
            this.advanceShop();
            break;
          default:
            break;
        }
      });

    this.advanceButton = new Phaser.GameObjects.Container(this.scene, 0, 0);
    this.advanceButton.setVisible(false);
    this.advanceButton.add([advanceButtonUI, hitArea]);

    this.add([this.closeButton, this.advanceButton, this.backButton]);
  }

  private setupEventListeners(): void {
    EventBus.on("open-journal", this.handleJournalOpen, this);
  }

  private handleJournalOpen = (journalType: JournalType): void => {
    console.log("handleJournalOpen", journalType);
    if (this.isAnimating) return;

    if (
      this.currentJournal === journalType &&
      (this.currentState === "main" ||
        this.currentState === "tier" ||
        this.currentState === "shop")
    ) {
      this.closeJournal();
      return;
    }

    if (!this.currentJournal) {
      this.openJournal(journalType);
    } else {
      this.switchJournal(journalType);
    }
  };

  private purchaseWeapon(weaponData: Weapon): void {
    const currentCoins = this.scene.registry.get("coins") || 0;
    this.scene.registry.set("coins", currentCoins - weaponData.price);

    // Update weapon unlock status in your game state
    EventBus.emit("weapon-purchased", weaponData.id);
    this.scene.sound.play("purchase");
  }

  // LEVELS FUNCTIONALITY
  private createLevelsJournal(): void {
    const container = new Phaser.GameObjects.Container(this.scene, 0, 0);

    // Create the tier page that will change textures
    this.tierPage = this.scene.add
      .image(0, 0, this.TIER_INFO[1].texture)
      .setOrigin(0.5)
      .setScale(JOURNAL_SCALE);

    const tierHitArea = this.scene.add
      .rectangle(
        -25,
        0,
        350,
        400, // Adjust size to match the tier page
        0xff0000, // Color (won't be visible)
        HITAREA_ALPHA // Alpha (completely transparent)
      )
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        this.tierPage.setScale(JOURNAL_SCALE + 0.01);
      })
      .on("pointerout", () => {
        this.tierPage.setScale(JOURNAL_SCALE);
      })
      .on("pointerdown", () => {
        this.scene.sound.play("page-turn");
        this.openTier(this.currentTier);
      });

    // Add everything to the container
    container.add([this.tierPage, tierHitArea]);
    this.journalContents.set("levels", container);
    this.add(container);
    container.setVisible(false);

    // Create tier content for tier 1
    this.createTierContent();
  }

  private createTierContent(): void {
    // Create containers for each tier
    for (let tier = 1; tier <= 4; tier++) {
      const container = new Phaser.GameObjects.Container(this.scene, 0, 0);
      // Add weapon buttons for this tier
      const weapons = this.scene.registry
        .get("weapons")
        .filter((weapon: Weapon) => weapon.tier === tier);
      weapons.forEach((weapon: Weapon, index: number) => {
        const weaponButton = this.createWeaponButton(weapon, index);
        container.add(weaponButton);
      });

      this.tierContents.set(tier, container);
      this.add(container);
      container.setVisible(false);
    }
  }

  private advanceTier(): void {
    // Increment tier or loop back to 1
    this.currentTier = (this.currentTier % 4) + 1;

    // Create a fade transition
    this.scene.tweens.add({
      targets: [this.tierPage],
      alpha: 0,
      duration: 200,
      onComplete: () => {
        // Update the texture and text
        this.tierPage.setTexture(this.TIER_INFO[this.currentTier].texture);
        // this.tierText.setText(this.TIER_INFO[this.currentTier].name);

        // Fade back in
        this.scene.tweens.add({
          targets: [this.tierPage],
          alpha: 1,
          duration: 200,
        });
      },
    });

    // Play page turn sound
    this.scene.sound.play("page-turn");
  }

  private createWeaponButton(
    weaponData: Weapon,
    index: number
  ): Phaser.GameObjects.Container {
    const button = new Phaser.GameObjects.Container(this.scene, 0, 0);

    const weaponTexture = weaponData.unlocked
      ? weaponData.texture
      : weaponData.texture + "-locked";
    // Create weapon display
    const weaponSprite = this.scene.add
      .image(0, 0, weaponTexture)
      .setOrigin(0.5)
      .setScale(JOURNAL_SCALE);

    // Create hit area
    const hitArea = this.scene.add
      .rectangle(
        weaponData.hitbox.x,
        weaponData.hitbox.y,
        weaponData.hitbox.width,
        weaponData.hitbox.height,
        0xff0000,
        HITAREA_ALPHA
      )
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        weaponSprite.setScale(JOURNAL_SCALE + 0.01);
      })
      .on("pointerout", () => {
        weaponSprite.setScale(JOURNAL_SCALE);
      })
      .on("pointerdown", () => this.handleWeaponSelection(weaponData));

    button.add([hitArea, weaponSprite]);

    return button;
  }

  private handleWeaponSelection(weaponData: Weapon): void {
    console.log("Weapon Selected", weaponData.name);
    // if (!weaponData.unlocked && !this.canAfford(weaponData.price)) {
    //   this.scene.sound.play("click-deny");
    //   this.showCannotAffordMessage();
    //   return;
    // }

    // if (!weaponData.unlocked) {
    //   this.purchaseWeapon(weaponData);
    // }

    EventBus.emit("set-weapon", weaponData.name);
    this.closeJournal();
  }

  private openTier(tier: number): void {
    this.currentTier = tier;
    this.currentState = "tier";

    // Change tier page texture
    this.basePaper.setTexture(this.TIER_INFO[tier].bg);

    // Hide main content
    this.journalContents.get(this.currentJournal!)?.setVisible(false);

    // Show tier content
    this.tierContents.get(tier)?.setVisible(true);

    // Show back button, hide advance button
    this.backButton.setVisible(true);
    this.advanceButton.setVisible(false);
  }

  private goBack(): void {
    this.scene.sound.play("page-turn");
    if (this.currentState === "tier") {
      // Return to main level select
      this.basePaper.setTexture("levels-page");
      this.tierContents.get(this.currentTier)?.setVisible(false);
      this.journalContents.get("levels")?.setVisible(true);
      this.currentState = "main";

      // Update buttons
      this.backButton.setVisible(false);
      this.advanceButton.setVisible(true);
    }
  }

  // SHOP FUNCTIONALITY
  private createShopJournal(): void {
    const container = new Phaser.GameObjects.Container(this.scene, 0, 0);
    this.journalContents.set("shop", container);
    this.add(container);
    container.setVisible(false);
    this.createShopContent();
  }

  private advanceShop(): void {
    const currentContent = this.shopContents.get(this.currentShop);
    if (!currentContent) return;

    // Fade out current content
    this.scene.tweens.add({
      targets: currentContent,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        // Hide current content
        currentContent.setVisible(false);
        currentContent.setAlpha(1);

        // Update shop number (1-3)
        this.currentShop = this.currentShop === 3 ? 1 : this.currentShop + 1;

        // Get and show new content
        const newContent = this.shopContents.get(this.currentShop);
        if (!newContent) return;

        newContent.setAlpha(0);
        newContent.setVisible(true);

        // Fade in new content
        this.scene.tweens.add({
          targets: newContent,
          alpha: 1,
          duration: 200,
        });
      },
    });

    // Play page turn sound
    this.scene.sound.play("page-turn");
  }

  private createShopContent(): void {
    for (let i = 1; i < 4; i++) {
      const container = new Phaser.GameObjects.Container(this.scene, 0, 0);

      const items = this.scene.registry
        .get("items")
        .filter((item: ShopItem) => item.tier === i);
      items.forEach((item: ShopItem, index: number) => {
        const itemButton = this.createItemButton(item, index);
        container.add(itemButton);
      });

      this.shopContents.set(i, container);
      this.add(container);
      container.setVisible(false);
    }
  }

  private createItemButton(item: ShopItem, index: number) {
    const button = new Phaser.GameObjects.Container(this.scene, 0, 0);

    const itemTexture = item.unlocked ? item.texture : item.texture + "-locked";
    // Create weapon display
    const itemSprite = this.scene.add
      .image(0, 0, itemTexture)
      .setOrigin(0.5)
      .setScale(JOURNAL_SCALE);

    // Create hit area
    const hitArea = this.scene.add
      .rectangle(
        item.hitbox.x,
        item.hitbox.y,
        item.hitbox.width,
        item.hitbox.height,
        0xff0000,
        HITAREA_ALPHA
      )
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        itemSprite.setScale(JOURNAL_SCALE + 0.01);
      })
      .on("pointerout", () => {
        itemSprite.setScale(JOURNAL_SCALE);
      })
      .on("pointerdown", () => this.handleItemSelection(item));

    button.add([hitArea, itemSprite]);

    return button;
  }

  private handleItemSelection(item: ShopItem): void {
    this.scene.sound.play("click");
    console.log("Item Selected", item.name);
  }

  // SKINS FUNCTIONALITY
  private createSkinsJournal(): void {
    const container = new Phaser.GameObjects.Container(this.scene, 0, 0);

    this.skinPage = this.scene.add
      .image(0, 0, this.SKIN_INFO[1].texture)
      .setOrigin(0.5)
      .setScale(JOURNAL_SCALE);

    const skinHitArea = this.scene.add
      .rectangle(
        -25,
        25,
        350,
        400, // Adjust size to match the tier page
        0xff0000, // Color (won't be visible)
        HITAREA_ALPHA // Alpha (completely transparent)
      )
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        this.skinPage.setScale(JOURNAL_SCALE + 0.01);
      })
      .on("pointerout", () => {
        this.skinPage.setScale(JOURNAL_SCALE);
      })
      .on("pointerdown", () => {
        this.scene.sound.play("click");
        this.handleSelectSkin(this.SKIN_INFO[this.currentSkin]);
      });

    container.add([this.skinPage, skinHitArea]);
    this.journalContents.set("skins", container);
    this.add(container);
    container.setVisible(false);
  }

  private advanceSkin(): void {
    this.currentSkin = (this.currentSkin % 4) + 1;

    this.scene.tweens.add({
      targets: [this.skinPage],
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.skinPage.setTexture(this.SKIN_INFO[this.currentSkin].texture);

        this.scene.tweens.add({
          targets: [this.skinPage],
          alpha: 1,
          duration: 200,
        });
      },
    });

    this.scene.sound.play("page-turn");
  }

  private handleSelectSkin(skin: Skin): void {
    // if (!skin.purchased) {
    //   if (!this.canAfford(skin.price)) {
    //     this.scene.sound.play("click-deny");
    //     return;
    //   }
    // } else {
    //   this.scene.registry.set(`equipped-${skin.name}`, skin.name);
    //   EventBus.emit("skin-equipped", skin.name);
    // }
    this.scene.registry.set(`equipped-${skin.name}`, skin.name);
    EventBus.emit("skin-equipped", skin.name);
  }

  // BOXES FUNCTIONALITY
  private createBoxesJournal(): void {
    const container = new Phaser.GameObjects.Container(this.scene, 0, 0);

    this.boxPage = this.scene.add
      .image(0, 0, this.BOX_INFO[1].texture)
      .setOrigin(0.5)
      .setScale(JOURNAL_SCALE);

    const boxHitArea = this.scene.add
      .rectangle(
        -25,
        0,
        350,
        350, // Adjust size to match the tier page
        0xff0000, // Color (won't be visible)
        HITAREA_ALPHA // Alpha (completely transparent)
      )
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        this.boxPage.setScale(JOURNAL_SCALE + 0.01);
      })
      .on("pointerout", () => {
        this.boxPage.setScale(JOURNAL_SCALE);
      })
      .on("pointerdown", () => {
        this.scene.sound.play("click");
        this.handleSelectBox(this.BOX_INFO[this.currentBox]);
      });

    // Add everything to the container
    container.add([this.boxPage, boxHitArea]);
    this.journalContents.set("boxes", container);
    this.add(container);
    container.setVisible(false);
  }

  private advanceBox(): void {
    // Increment tier or loop back to 1
    this.currentBox = (this.currentBox % 5) + 1;

    // Create a fade transition
    this.scene.tweens.add({
      targets: [this.boxPage],
      alpha: 0,
      duration: 200,
      onComplete: () => {
        // Update the texture and text
        this.boxPage.setTexture(this.BOX_INFO[this.currentBox].texture);
        // this.tierText.setText(this.TIER_INFO[this.currentTier].name);

        // Fade back in
        this.scene.tweens.add({
          targets: [this.boxPage],
          alpha: 1,
          duration: 200,
        });
      },
    });

    // Play page turn sound
    this.scene.sound.play("page-turn");
  }

  private handleSelectBox(box: Box): void {
    EventBus.emit("bg-change", box.bg);
  }

  // JOURNAL FUNCTIONALITY
  private openJournal(type: JournalType): void {
    this.isAnimating = true;
    this.currentJournal = type;
    this.currentState = "main";
    this.setVisible(true);

    switch (type) {
      case "levels":
        this.basePaper.setTexture("levels-page");
        this.currentTier = 1;
        this.tierPage.setTexture(this.TIER_INFO[1].texture);
        break;
      case "boxes":
        this.currentBox = 1;
        this.basePaper.setTexture("boxes-page");
        this.boxPage.setTexture(this.BOX_INFO[1].texture);
        break;
      case "skins":
        this.currentSkin = 1;
        this.basePaper.setTexture("skins-page");
        this.skinPage.setTexture(this.SKIN_INFO[1].texture);
        break;
      case "shop":
        this.currentState = "shop";
        this.currentShop = 1;
        this.basePaper.setTexture("shop-page");
        this.shopContents.get(this.currentShop)?.setVisible(true);
        break;
    }

    this.advanceButton.setVisible(true);

    // Show correct content
    this.journalContents.forEach((content, journalType) => {
      content.setVisible(journalType === type);
    });

    // Slide in animation
    this.scene.tweens.add({
      targets: this,
      x: this.VISIBLE_X,
      duration: 500,
      ease: "Power2",
      onComplete: () => {
        this.isAnimating = false;
      },
    });
  }

  private switchJournal(newType: JournalType): void {
    this.scene.sound.play("page-turn");
    this.basePaper.setTexture("Page");

    if (this.currentState === "tier") {
      this.tierContents.get(this.currentTier)?.setVisible(false);
      this.backButton.setVisible(false);
    }

    if (this.currentState === "shop") {
      this.shopContents.get(this.currentShop)?.setVisible(false);
      this.backButton.setVisible(false);
    }

    switch (newType) {
      case "levels":
        this.basePaper.setTexture("levels-page");
        this.currentState = "main";
        this.currentTier = 1;
        this.tierPage.setTexture(this.TIER_INFO[this.currentTier].texture);
        break;
      case "shop":
        this.basePaper.setTexture("shop-page");
        this.currentState = "shop";
        this.currentShop = 1;
        this.shopContents.get(this.currentShop)?.setVisible(true);
        break;
      case "skins":
        this.basePaper.setTexture("skins-page");
        this.currentState = "main";
        this.currentSkin = 1;
        this.skinPage.setTexture(this.SKIN_INFO[this.currentSkin].texture);
        break;
      case "boxes":
        this.currentState = "main";
        this.currentBox = 1;
        this.basePaper.setTexture("boxes-page");
        this.boxPage.setTexture(this.BOX_INFO[this.currentBox].texture);
        break;
    }

    // Hide current content
    this.journalContents.get(this.currentJournal!)?.setVisible(false);

    // Show new content
    this.journalContents.get(newType)?.setVisible(true);

    // Update current journal
    this.currentJournal = newType;

    // Update button visibility
    this.advanceButton.setVisible(true);
  }

  private closeJournal(): void {
    if (this.currentState === "tier") {
      this.tierContents.get(this.currentTier)?.setVisible(false);
      this.backButton.setVisible(false);
    }

    if (this.currentState === "shop") {
      this.shopContents.get(this.currentShop)?.setVisible(false);
    }

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
        this.currentState = "closed";
        EventBus.emit("journal-closed");
        // this.scene.sound.play("journal-close");
      },
    });
  }

  // Utility methods
  private canAfford(price: number): boolean {
    // Get current coins from game state
    const currentCoins = this.scene.registry.get("coins") || 0;
    return currentCoins >= price;
  }

  private showCannotAffordMessage(): void {
    // Show "Not enough coins" message
    const message = this.scene.add
      .text(0, 0, "Not enough coins!", {
        fontSize: "24px",
        color: "#ff0000",
      })
      .setOrigin(0.5);

    this.scene.tweens.add({
      targets: message,
      alpha: 0,
      y: "-=50",
      duration: 1000,
      onComplete: () => message.destroy(),
    });
  }

  private getBoxPrice(type: string): string {
    const prices = {
      common: "100",
      rare: "250",
      epic: "500",
      legendary: "1000",
    };
    return prices[type as keyof typeof prices];
  }

  private generateBoxRewards(type: string): BoxReward[] {
    // This should be replaced with your actual reward generation logic
    const rewards: BoxReward[] = [];
    const rewardCount = type === "legendary" ? 3 : type === "epic" ? 2 : 1;

    for (let i = 0; i < rewardCount; i++) {
      rewards.push({
        type: "weapon", // or "skin" or other reward types
        item: "random-item-id",
        rarity: type,
      });
    }

    return rewards;
  }

  public destroy(): void {
    EventBus.off("open-journal", this.handleJournalOpen, this);
    super.destroy();
  }
}

