import { EventBus } from "../EventBus";

type JournalType = "levels" | "shop" | "skins" | "boxes";
type JournalState = "closed" | "main" | "tier";

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
  price: number;
  type: string;
  unlocked: boolean;
  description?: string;
}

interface Skin {
  id: string;
  name: string;
  texture: string;
  price: number;
  unlocked: boolean;
  category: string;
  rarity: string;
  preview?: string; // Optional preview animation/image
}

interface TierData {
  name: string;
  texture: string;
  bg: string;
}

interface BoxData {
  name: string;
  texture: string;
  bg: string;
}

interface SkinData {
  name: string;
  texture: string;
  bg: string;
}

const JOURNAL_SCALE = 0.6;
const HITAREA_ALPHA = 0;

export class JournalManager extends Phaser.GameObjects.Container {
  private currentJournal: JournalType | null = null;
  private currentState: JournalState = "closed";
  private currentTier: number = 1;
  private currentBox: number = 1;
  private currentSkin: number = 1;
  private isAnimating: boolean = false;

  // UI Elements
  private basePaper: Phaser.GameObjects.Image;
  private closeButton: Phaser.GameObjects.Image;
  private backButton: Phaser.GameObjects.Container;
  private advanceButton: Phaser.GameObjects.Container;

  // Content containers
  private journalContents: Map<JournalType, Phaser.GameObjects.Container>;
  private tierContents: Map<number, Phaser.GameObjects.Container>;

  private readonly TIER_INFO: Record<number, TierData> = {
    1: { name: "PAPER", texture: "FREETier", bg: "tier1-bg" },
    2: { name: "MUSK", texture: "Tier2", bg: "tier2-bg" },
    3: { name: "MIL", texture: "Tier3", bg: "tier3-bg" },
    4: { name: "SOL", texture: "Tier4", bg: "tier4-bg" },
  };

  private readonly BOX_INFO: Record<number, BoxData> = {
    1: {
      name: "CARDBOARD",
      texture: "main-box",
      bg: "bg-main",
    },
    2: { name: "BASKET", texture: "basket-box", bg: "bg-basket" },
    3: { name: "BLOOD", texture: "blood-box", bg: "bg-bloody" },
    4: {
      name: "PRESENT",
      texture: "present-box",
      bg: "bg-present",
    },
    5: { name: "SHOE", texture: "shoe-box", bg: "bg-shoe" },
  };

  private readonly SKIN_INFO: Record<number, SkinData> = {
    1: { name: "PAPER", texture: "FREETier", bg: "tier1-bg" },
    2: { name: "MUSK", texture: "Tier2", bg: "tier2-bg" },
    3: { name: "MIL", texture: "Tier3", bg: "tier3-bg" },
    4: { name: "SOL", texture: "Tier4", bg: "tier4-bg" },
  };

  // Position constants
  private readonly HIDDEN_X = 1480;
  private readonly VISIBLE_X = 1000;
  private tierPage!: Phaser.GameObjects.Image;
  private boxPage!: Phaser.GameObjects.Image;
  private tierText!: Phaser.GameObjects.Text;

  constructor(config: JournalManagerConfig) {
    super(config.scene, config.x, config.y);
    this.scene.add.existing(this);

    this.journalContents = new Map();
    this.tierContents = new Map();

    this.createBase();
    this.createNavigationButtons();
    this.createAllJournalContents();
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

  private setupEventListeners(): void {
    EventBus.on("open-journal", this.handleJournalOpen, this);
  }

  private handleJournalOpen = (journalType: JournalType): void => {
    console.log("handleJournalOpen", journalType);
    if (this.isAnimating) return;

    if (this.currentJournal === journalType && this.currentState === "main") {
      this.closeJournal();
      return;
    }

    if (!this.currentJournal) {
      this.openJournal(journalType);
    } else {
      this.switchJournal(journalType);
    }
  };

  private createAllJournalContents(): void {
    // Create main views for each journal type
    this.createLevelsJournal();
    this.createShopJournal();
    this.createSkinsJournal();
    this.createBoxesJournal();
  }

  private createNavigationButtons(): void {
    // Close button (always visible)
    this.closeButton = this.scene.add
      .image(-190, -260, "close-button")
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => this.closeButton.setTint(0xff9999))
      .on("pointerout", () => this.closeButton.clearTint())
      .on("pointerdown", () => this.closeJournal());

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
        if (this.currentJournal === "levels") {
          this.advanceTier();
        } else if (this.currentJournal === "boxes") {
          this.advanceBox();
        }
      });

    this.advanceButton = new Phaser.GameObjects.Container(this.scene, 0, 0);
    this.advanceButton.setVisible(false);
    this.advanceButton.add([advanceButtonUI, hitArea]);

    this.add([this.closeButton, this.advanceButton, this.backButton]);
  }

  private createShopPage(items: ShopItem[]): Phaser.GameObjects.Container {
    const page = new Phaser.GameObjects.Container(this.scene, 0, 0);

    // Layout configuration
    const startY = -200; // Starting Y position
    const itemHeight = 80; // Height per item
    const itemSpacing = 20; // Space between items

    items.forEach((item, index) => {
      const yPos = startY + index * (itemHeight + itemSpacing);

      // Create item container
      const itemContainer = new Phaser.GameObjects.Container(
        this.scene,
        0,
        yPos
      );

      // Item icon
      const icon = this.scene.add
        .image(-150, 0, item.texture)
        .setDisplaySize(60, 60);

      // Item name
      const nameText = this.scene.add.text(-80, -15, item.name, {
        fontSize: "20px",
        color: "#000000",
        fontFamily: "Arial",
      });

      // Item description (if exists)
      if (item.description) {
        const descText = this.scene.add
          .text(-80, 10, item.description, {
            fontSize: "14px",
            color: "#666666",
            fontFamily: "Arial",
          })
          .setWordWrapWidth(160);
      }

      // Price display
      const priceContainer = new Phaser.GameObjects.Container(
        this.scene,
        100,
        0
      );

      const coinIcon = this.scene.add
        .image(-25, 0, "coin-icon")
        .setDisplaySize(20, 20);

      const priceText = this.scene.add.text(0, -10, item.price.toString(), {
        fontSize: "18px",
        color: "#000000",
        fontFamily: "Arial",
      });

      priceContainer.add([coinIcon, priceText]);

      // Purchase/Equip button
      const buttonTexture = item.unlocked ? "equip-button" : "buy-button";
      const button = this.scene.add
        .image(150, 0, buttonTexture)
        .setInteractive({ useHandCursor: true })
        .on("pointerover", () => button.setTint(0xcccccc))
        .on("pointerout", () => button.clearTint())
        .on("pointerdown", () => this.handleShopItemInteraction(item));

      // Add everything to the item container
      itemContainer.add([icon, nameText, priceContainer, button]);

      // Add item container to the page
      page.add(itemContainer);
    });

    return page;
  }

  private handleShopItemInteraction(item: ShopItem): void {
    if (item.unlocked) {
      // Handle equipping the item
      EventBus.emit("equip-item", {
        id: item.id,
        type: item.type,
      });
      this.scene.sound.play("equip");
      return;
    }

    // Handle purchasing the item
    if (!this.canAfford(item.price)) {
      this.showCannotAffordMessage();
      return;
    }

    // Purchase confirmation
    const confirmPurchase = () => {
      // Deduct coins
      const currentCoins = this.scene.registry.get("coins") || 0;
      this.scene.registry.set("coins", currentCoins - item.price);

      // Update item status
      EventBus.emit("item-purchased", {
        id: item.id,
        type: item.type,
      });

      // Play purchase sound
      this.scene.sound.play("purchase");

      // Update the button to show "Equip" instead of "Buy"
      this.refreshShopPages();
    };

    // Show confirmation dialog
    this.showConfirmationDialog(
      `Purchase ${item.name} for ${item.price} coins?`,
      confirmPurchase
    );
  }

  private refreshShopPages(): void {
    // Recreate shop pages with updated data
    const shopContainer = this.journalContents.get("shop");
    if (shopContainer) {
      shopContainer.removeAll(true);
      const pages: Phaser.GameObjects.Container[] = [];
      this.createShopPages(pages);
      shopContainer.add(pages);
    }
  }

  private showConfirmationDialog(message: string, onConfirm: () => void): void {
    const dialogContainer = new Phaser.GameObjects.Container(this.scene, 0, 0);

    // Add semi-transparent background
    const bg = this.scene.add
      .rectangle(0, 0, 300, 150, 0x000000, 0.7)
      .setOrigin(0.5);

    // Add message text
    const text = this.scene.add
      .text(0, -30, message, {
        fontSize: "20px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    // Add confirm and cancel buttons
    const confirmButton = this.scene.add
      .text(-60, 30, "Confirm", {
        fontSize: "18px",
        color: "#00ff00",
      })
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        onConfirm();
        dialogContainer.destroy();
      });

    const cancelButton = this.scene.add
      .text(60, 30, "Cancel", {
        fontSize: "18px",
        color: "#ff0000",
      })
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => dialogContainer.destroy());

    dialogContainer.add([bg, text, confirmButton, cancelButton]);
    this.add(dialogContainer);
  }

  private getWeaponsForTier(tier: number): Weapon[] {
    // This should be replaced with your actual weapon data
    return this.scene.registry
      .get("weapons")
      .filter((weapon: Weapon) => weapon.tier === tier);
  }

  private purchaseWeapon(weaponData: Weapon): void {
    const currentCoins = this.scene.registry.get("coins") || 0;
    this.scene.registry.set("coins", currentCoins - weaponData.price);

    // Update weapon unlock status in your game state
    EventBus.emit("weapon-purchased", weaponData.id);
    this.scene.sound.play("purchase");
  }

  // SHOP FUNCTIONALITY
  private createShopPages(pages: Phaser.GameObjects.Container[]): void {
    // Get shop items from your game data
    const shopItems = this.scene.registry.get("shopItems");
    const itemsPerPage = 6;

    // Create pages with items
    for (let i = 0; i < shopItems.length; i += itemsPerPage) {
      const pageItems = shopItems.slice(i, i + itemsPerPage);
      const page = this.createShopPage(pageItems);
      pages.push(page);
    }

    // Only show first page initially
    pages.forEach((page, index) => {
      page.setVisible(index === 0);
    });
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
        350, // Adjust size to match the tier page
        0xff0000, // Color (won't be visible)
        HITAREA_ALPHA // Alpha (completely transparent)
      )
      .setInteractive({ useHandCursor: true })
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
      const weapons = this.getWeaponsForTier(tier);
      weapons.forEach((weapon, index) => {
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
        weaponSprite.setScale(JOURNAL_SCALE + 0.005);
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
    if (!weaponData.unlocked && !this.canAfford(weaponData.price)) {
      this.scene.sound.play("click-deny");
      this.showCannotAffordMessage();
      return;
    }

    if (!weaponData.unlocked) {
      this.purchaseWeapon(weaponData);
    }

    EventBus.emit("weapon-selected", weaponData.name);
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
      this.basePaper.setTexture("Page");
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

    // Create shop pages container
    const pages: Phaser.GameObjects.Container[] = [];
    let currentPage = 0;

    // // Add navigation arrows for shop pages
    // const leftArrow = this.scene.add
    //   .image(-150, 0, "arrow-left")
    //   .setInteractive({ useHandCursor: true })
    //   .on("pointerdown", () => {
    //     if (currentPage > 0) {
    //       pages[currentPage].setVisible(false);
    //       currentPage--;
    //       pages[currentPage].setVisible(true);
    //       rightArrow.setVisible(true);
    //       leftArrow.setVisible(currentPage > 0);
    //     }
    //   });

    // const rightArrow = this.scene.add
    //   .image(150, 0, "arrow-right")
    //   .setInteractive({ useHandCursor: true })
    //   .on("pointerdown", () => {
    //     if (currentPage < pages.length - 1) {
    //       pages[currentPage].setVisible(false);
    //       currentPage++;
    //       pages[currentPage].setVisible(true);
    //       leftArrow.setVisible(true);
    //       rightArrow.setVisible(currentPage < pages.length - 1);
    //     }
    //   });

    // Create shop pages with items
    // this.createShopPages(pages);

    container.add([...pages]);
    this.journalContents.set("shop", container);
    this.add(container);
    container.setVisible(false);
  }

  // SKINS FUNCTIONALITY
  private createSkinsJournal(): void {
    const container = new Phaser.GameObjects.Container(this.scene, 0, 0);

    // Similar page system to shop
    const skinCategories = ["character", "weapons", "effects"];
    // const categoryButtons = skinCategories.map((category, index) => {
    //   return this.scene.add
    //     .image(-100 + index * 100, -250, `${category}-tab`)
    //     .setInteractive({ useHandCursor: true })
    //     .on("pointerdown", () => this.showSkinCategory(category));
    // });

    // Create containers for each skin category
    const categoryContainers = new Map<string, Phaser.GameObjects.Container>();
    skinCategories.forEach((category) => {
      //   const categoryContainer = this.createSkinCategoryContainer(category);
      //   categoryContainers.set(category, categoryContainer);
      //   container.add(categoryContainer);
    });

    // container.add(categoryButtons);
    this.journalContents.set("skins", container);
    this.add(container);
    container.setVisible(false);
  }

  private equipSkin(skin: Skin): void {
    this.scene.registry.set(`equipped-${skin.category}`, skin.id);
    EventBus.emit("skin-equipped", {
      id: skin.id,
      category: skin.category,
    });
    this.scene.sound.play("equip");

    // Refresh the skin display to update equipped indicators
    // this.refreshSkinCategory(skin.category);
  }

  private showSkinCategory(category: string): void {
    this.journalContents
      .get("skins")
      ?.getAll()
      .forEach((container) => {
        if (container instanceof Phaser.GameObjects.Container) {
          container.setVisible(container.name === category);
        }
      });
  }

  private createSkinButton(
    skin: Skin,
    index: number
  ): Phaser.GameObjects.Container {
    const buttonContainer = new Phaser.GameObjects.Container(this.scene, 0, 0);

    // Position each skin button in a grid layout
    const itemsPerRow = 3;
    const xSpacing = 120;
    const ySpacing = 140;
    const xPos = ((index % itemsPerRow) - 1) * xSpacing;
    const yPos = Math.floor(index / itemsPerRow) * ySpacing - 100;
    buttonContainer.setPosition(xPos, yPos);

    // Create background based on rarity
    const rarityColors = {
      common: 0x666666,
      rare: 0x0066ff,
      epic: 0x9933ff,
      legendary: 0xffcc00,
    };

    const bg = this.scene.add
      .rectangle(
        0,
        0,
        100,
        120,
        rarityColors[skin.rarity as keyof typeof rarityColors]
      )
      .setStrokeStyle(2, 0xffffff)
      .setAlpha(0.2);

    // Skin preview image
    const skinPreview = this.scene.add
      .image(0, -20, skin.texture)
      .setDisplaySize(80, 80);

    // Lock icon for unlocked skins
    let lockIcon: Phaser.GameObjects.Image | null = null;
    if (!skin.unlocked) {
      lockIcon = this.scene.add
        .image(30, -30, "lock-icon")
        .setDisplaySize(24, 24);
    }

    // Price display for locked skins
    let priceDisplay: Phaser.GameObjects.Container | null = null;
    if (!skin.unlocked) {
      priceDisplay = new Phaser.GameObjects.Container(this.scene, 0, 30);

      const coinIcon = this.scene.add
        .image(-20, 0, "coin-icon")
        .setDisplaySize(20, 20);

      const priceText = this.scene.add.text(0, -7, skin.price.toString(), {
        fontSize: "16px",
        color: "#ffffff",
      });

      priceDisplay.add([coinIcon, priceText]);
    }

    // Equipped indicator
    const isEquipped =
      this.scene.registry.get(`equipped-${skin.category}`) === skin.id;
    let equippedIndicator: Phaser.GameObjects.Container | null = null;

    if (isEquipped) {
      equippedIndicator = new Phaser.GameObjects.Container(this.scene, 0, 40);

      const equippedText = this.scene.add
        .text(0, 0, "EQUIPPED", {
          fontSize: "12px",
          color: "#00ff00",
        })
        .setOrigin(0.5);

      equippedIndicator.add(equippedText);
    }

    // Name label
    const nameText = this.scene.add
      .text(0, 50, skin.name, {
        fontSize: "14px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    // Add hover effects
    buttonContainer
      .setInteractive(
        new Phaser.Geom.Rectangle(-50, -60, 100, 120),
        Phaser.Geom.Rectangle.Contains
      )
      .on("pointerover", () => {
        bg.setAlpha(0.4);
        if (skin.preview) {
          this.showSkinPreview(skin);
        }
      })
      .on("pointerout", () => {
        bg.setAlpha(0.2);
        this.hideSkinPreview();
      })
      .on("pointerdown", () => this.handleSkinSelection(skin));

    // Add all elements to the container
    const elements = [bg, skinPreview, nameText];
    if (lockIcon) elements.push(lockIcon);
    //@ts-ignore
    if (priceDisplay) elements.push(priceDisplay);
    //@ts-ignore
    if (equippedIndicator) elements.push(equippedIndicator);

    buttonContainer.add(elements);

    return buttonContainer;
  }

  private showSkinPreview(skin: Skin): void {
    // Remove any existing preview
    this.hideSkinPreview();

    // Create preview container
    const previewContainer = new Phaser.GameObjects.Container(
      this.scene,
      200,
      0
    );
    previewContainer.name = "skin-preview";

    // Add preview background
    const previewBg = this.scene.add
      .rectangle(0, 0, 200, 300, 0x000000, 0.8)
      .setStrokeStyle(2, 0xffffff);

    // Add preview image/animation
    const preview = this.scene.add
      .sprite(0, 0, skin.preview || skin.texture)
      .setDisplaySize(180, 180);

    if (skin.preview) {
      preview.play(skin.preview);
    }

    // Add skin details
    const nameText = this.scene.add
      .text(0, -120, skin.name, {
        fontSize: "20px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    const rarityText = this.scene.add
      .text(0, 100, skin.rarity.toUpperCase(), {
        fontSize: "16px",
        color: "#ffcc00",
        align: "center",
      })
      .setOrigin(0.5);

    previewContainer.add([previewBg, preview, nameText, rarityText]);
    this.add(previewContainer);
  }

  private hideSkinPreview(): void {
    const preview = this.getByName("skin-preview");
    if (preview) {
      preview.destroy();
    }
  }

  private handleSkinSelection(skin: Skin): void {
    if (!skin.unlocked) {
      if (!this.canAfford(skin.price)) {
        this.showCannotAffordMessage();
        return;
      }

      // Show purchase confirmation
      this.showConfirmationDialog(
        `Purchase ${skin.name} for ${skin.price} coins?`,
        () => {
          // Deduct coins and unlock skin
          const currentCoins = this.scene.registry.get("coins") || 0;
          this.scene.registry.set("coins", currentCoins - skin.price);

          EventBus.emit("skin-purchased", {
            id: skin.id,
            category: skin.category,
          });

          // Auto-equip newly purchased skin
          this.equipSkin(skin);
        }
      );
    } else {
      // Equip the skin if it's already unlocked
      this.equipSkin(skin);
    }
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
      .on("pointerdown", () => {
        this.scene.sound.play("click");
        this.handleBoxOpen(this.currentBox);
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

  private handleBoxOpen(type: number): void {
    // Update current box selection
    this.currentBox = type;

    console.log(this.BOX_INFO[type]);

    EventBus.emit("bg-change", this.BOX_INFO[type].bg);

    // Update box page texture
    // this.boxPage.setTexture(this.BOX_INFO[type].texture);

    // Play page turn sound
    this.scene.sound.play("click");
  }

  //   private createBoxContainer(
  //     type: string,
  //     index: number
  //   ): Phaser.GameObjects.Container {
  //     const container = new Phaser.GameObjects.Container(
  //       this.scene,
  //       0,
  //       -150 + index * 100
  //     );

  //     const boxSprite = this.scene.add.image(0, 0, `${type}-box`);
  //     const priceText = this.scene.add.text(60, 0, this.getBoxPrice(type));
  //     const openButton = this.scene.add
  //       .image(120, 0, "open-button")
  //       .setInteractive({ useHandCursor: true })
  //       .on("pointerdown", () => this.handleBoxOpen(type));

  //     container.add([boxSprite, priceText, openButton]);
  //     return container;
  //   }

  //   private showBoxOpeningAnimation(type: string): void {
  //     // Create and play box opening animation
  //     const animation = this.scene.add.sprite(0, 0, `${type}-box-opening`);
  //     animation.play(`${type}-box-open`);
  //     animation.once("animationcomplete", () => {
  //       // Generate and show rewards
  //       const rewards = this.generateBoxRewards(type);
  //       //   this.showRewards(rewards);
  //     });
  //   }

  // JOURNAL FUNCTIONALITY
  private openJournal(type: JournalType): void {
    this.isAnimating = true;
    this.currentJournal = type;
    this.currentState = "main";
    this.setVisible(true);

    if (type === "levels") {
      this.currentTier = 1;
      this.tierPage.setTexture(this.TIER_INFO[1].texture);
      //   this.tierText.setText(this.TIER_INFO[1].name);
    }

    if (type === "boxes") {
      this.currentBox = 1;
      this.basePaper.setTexture("boxes-page");
      this.boxPage.setTexture(this.BOX_INFO[1].texture);
    }

    // Show correct content
    this.journalContents.forEach((content, journalType) => {
      content.setVisible(journalType === type);
    });

    // Show/hide advance button only for levels journal
    this.advanceButton.setVisible(type === "levels" || type === "boxes");

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

  private closeJournal(): void {
    if (this.currentState === "tier") {
      this.tierContents.get(this.currentTier)?.setVisible(false);
      this.backButton.setVisible(false);
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

  private switchJournal(newType: JournalType): void {
    this.scene.sound.play("page-turn");
    this.basePaper.setTexture("Page");

    if (this.currentState === "tier") {
      this.tierContents.get(this.currentTier)?.setVisible(false);
      this.backButton.setVisible(false);
    }

    if (newType === "boxes") {
      this.basePaper.setTexture("boxes-page");
    }
    // Hide current content
    this.journalContents.get(this.currentJournal!)?.setVisible(false);

    // Show new content
    this.journalContents.get(newType)?.setVisible(true);

    // Update current journal
    this.currentJournal = newType;

    // Update button visibility
    this.advanceButton.setVisible(newType === "levels" || newType === "boxes");

    // Play switch sound
    // this.scene.sound.play("journal-switch");
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

