import { getPurchasedStates } from "@/lib/utils";
import { EventBus } from "../EventBus";
import { InputState } from "./InputState";

type JournalType = "levels" | "shop" | "skins" | "boxes";
type JournalState = "closed" | "main" | "tier" | "shop";

interface JournalManagerConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
}

export interface WeaponButton {
  name: string;
  price: number;
  purchased: boolean;
  tier: number;
  hitbox: Phaser.Geom.Rectangle;
}

export interface ShopItemButton {
  name: string;
  tier: number;
  price: number;
  purchased: boolean;
  unlocked: boolean;
  hitbox: Phaser.Geom.Rectangle;
}

export type SkinButtons = Record<
  number,
  {
    name: string;
    price: number;
    unlocked: boolean;
    purchased: boolean;
  }
>;

export type TierButtons = Record<
  number,
  {
    name: string;
    bg: string;
    unlocked: boolean;
  }
>;

export type BoxButtons = Record<
  number,
  {
    name: string;
    bg: string;
    price: number;
    purchased: boolean;
  }
>;

const JOURNAL_SCALE = 0.6;
const HITAREA_ALPHA = 0;

// TODO: Make market cap event handler to update journal unlocked prop on items

export class JournalManager extends Phaser.GameObjects.Container {
  private inputState: InputState;
  private currentJournal: JournalType | null = null;
  private currentState: JournalState = "closed";
  private currentTier: number = 1;
  private currentBox: number = 1;
  private currentSkin: number = 1;
  private currentShop: number = 1;
  private isAnimating: boolean = false;
  private isAdvancing: boolean = false;

  // UI Elements
  private basePaper: Phaser.GameObjects.Image;
  private closeButton: Phaser.GameObjects.Image;
  private backButton: Phaser.GameObjects.Container;
  private advanceButton: Phaser.GameObjects.Container;

  // Position constants
  private readonly HIDDEN_X = 1480;
  private readonly VISIBLE_X = 1000;
  private tierPage!: Phaser.GameObjects.Image;
  private boxPage!: Phaser.GameObjects.Image;
  private tierText!: Phaser.GameObjects.Text;
  private skinPage!: Phaser.GameObjects.Image;
  private shopPage!: Phaser.GameObjects.Image;
  private pointerOver: boolean = false;

  // Content containers
  private journalContents: Map<JournalType, Phaser.GameObjects.Container>;
  private tierContents: Map<number, Phaser.GameObjects.Container>;
  private shopContents: Map<number, Phaser.GameObjects.Container>;

  private WEAPON_INFO!: WeaponButton[];
  private SHOP_INFO!: ShopItemButton[];
  private SKIN_INFO!: SkinButtons;
  private TIER_INFO!: TierButtons;
  private BOX_INFO!: BoxButtons;

  // three states: locked by mc, unlocked by mc, purchased by user
  // ex. musk-skin-locked, musk-skin-unlocked, musk-skin-purchased

  constructor(config: JournalManagerConfig) {
    super(config.scene, config.x, config.y);
    this.inputState = InputState.getInstance();
    this.setDepth(100);
    this.scene.add.existing(this);

    this.journalContents = new Map();
    this.tierContents = new Map();
    this.shopContents = new Map();

    this.TIER_INFO = this.scene.registry.get("tier-buttons");
    this.SHOP_INFO = this.scene.registry.get("shop-buttons");
    this.WEAPON_INFO = this.scene.registry.get("weapon-buttons");
    this.SKIN_INFO = this.scene.registry.get("skin-buttons");
    this.BOX_INFO = this.scene.registry.get("box-buttons");

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
    EventBus.on("marketcap-changed", this.onMarketcapChange, this);
  }

  private handleJournalOpen = (journalType: JournalType): void => {
    this.inputState.lock("journal");
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

  // LEVELS FUNCTIONALITY
  private createLevelsJournal(): void {
    const container = new Phaser.GameObjects.Container(this.scene, 0, 0);

    const texture = this.TIER_INFO[this.currentTier].unlocked
      ? `tier${this.currentTier}-button`
      : `tier${this.currentTier}-button-locked`;

    // Create the tier page that will change textures
    this.tierPage = this.scene.add
      .image(0, 0, texture)
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
        this.openTier(this.currentTier);
      });

    // Add everything to the container
    container.add([this.tierPage, tierHitArea]);
    this.journalContents.set("levels", container);
    this.add(container);
    container.setVisible(false);

    // Create containers for each tier
    for (let tier = 1; tier <= 4; tier++) {
      const container = new Phaser.GameObjects.Container(
        this.scene,
        0,
        0
      ).setName(`tier${tier}-container`);
      // Add weapon buttons for this tier
      const weapons = this.WEAPON_INFO.filter(
        (weapon: WeaponButton) => weapon.tier === tier
      );
      weapons.forEach((weapon: WeaponButton, index: number) => {
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

    const texture = this.TIER_INFO[this.currentTier].unlocked
      ? `tier${this.currentTier}-button`
      : `tier${this.currentTier}-button-locked`;

    // Create a fade transition
    this.scene.tweens.add({
      targets: [this.tierPage],
      alpha: 0,
      duration: 200,
      onComplete: () => {
        // Update the texture and text
        this.tierPage.setTexture(texture);
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
    weaponData: WeaponButton,
    index: number
  ): Phaser.GameObjects.Container {
    const button = new Phaser.GameObjects.Container(this.scene, 0, 0);

    const weaponTexture = weaponData.purchased
      ? `${weaponData.name}-button`
      : `${weaponData.name}-button-locked`;
    // Create weapon display
    const weaponButton = this.scene.add
      .image(0, 0, weaponTexture)
      .setOrigin(0.5)
      .setScale(JOURNAL_SCALE)
      .setName(`${weaponData.name}-button`);
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
        weaponButton.setScale(JOURNAL_SCALE + 0.01);
      })
      .on("pointerout", () => {
        weaponButton.setScale(JOURNAL_SCALE);
      })
      .on("pointerdown", () => this.handleWeaponSelection(weaponData));

    button.add([hitArea, weaponButton]);

    return button;
  }

  private handleWeaponSelection(weaponData: WeaponButton): void {
    this.scene.sound.play("click");

    if (!weaponData.purchased) {
      if (!this.canAfford(weaponData.price)) {
        this.scene.sound.play("click-deny");
        return;
      }
      // deduct coins, update config/ localstore, update texture
      this.scene.sound.play("coin-pickup");
      EventBus.emit("coins-changed", -weaponData.price);

      const page = this.tierContents
        .get(this.currentTier)
        ?.getByName(
          `tier${this.currentTier}-container`
        ) as Phaser.GameObjects.Container;

      const texture = page.getByName(
        `${weaponData.name}-button`
      ) as Phaser.GameObjects.Image;

      texture.setTexture(`${weaponData.name}-button`);
      // set purchased state in local storage
      this.updatePurchaseState("weapon", weaponData.name);
    }
    this.scene.registry.set("equiped-item", weaponData.name);
    EventBus.emit("set-weapon", weaponData.name);
    this.closeJournal();
    return;
  }

  private openTier(tier: number): void {
    if (!this.TIER_INFO[tier].unlocked) {
      this.scene.sound.play("click-deny");
      return;
    }

    this.scene.sound.play("page-turn");
    this.currentTier = tier;
    this.currentState = "tier";
    // Change tier page texture
    this.basePaper.setTexture(this.TIER_INFO[this.currentTier].bg);
    // Hide main content
    this.journalContents.get(this.currentJournal!)?.setVisible(false);
    // Show tier content
    this.tierContents.get(this.currentTier)?.setVisible(true);
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

    for (let i = 1; i < 4; i++) {
      const container = new Phaser.GameObjects.Container(this.scene, 0, 0);

      const items = this.SHOP_INFO.filter(
        (item: ShopItemButton) => item.tier === i
      );
      items.forEach((item: ShopItemButton, index: number) => {
        const itemButton = this.createItemButton(item, index);
        container.add(itemButton);
      });

      this.shopContents.set(i, container);
      this.add(container);
      container.setVisible(false);
    }
  }

  private advanceShop(): void {
    // Prevent multiple advances while animation is playing
    if (this.isAdvancing) return;
    this.isAdvancing = true;

    const currentContent = this.shopContents.get(this.currentShop);
    if (!currentContent) {
      this.isAdvancing = false;
      return;
    }

    // Ensure current content is visible and at full alpha before starting fade
    currentContent.setVisible(true);
    currentContent.setAlpha(1);

    // Calculate next shop number
    const nextShop = this.currentShop === 3 ? 1 : this.currentShop + 1;
    const nextContent = this.shopContents.get(nextShop);
    if (!nextContent) {
      this.isAdvancing = false;
      return;
    }

    // Fade out current content
    this.scene.tweens.add({
      targets: currentContent,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        // Hide current content
        currentContent.setVisible(false);
        currentContent.setAlpha(1);

        // Update shop number and prepare next content
        this.currentShop = nextShop;
        nextContent.setAlpha(0);
        nextContent.setVisible(true);

        // Fade in new content
        this.scene.tweens.add({
          targets: nextContent,
          alpha: 1,
          duration: 200,
          onComplete: () => {
            this.isAdvancing = false;
          },
        });
      },
    });

    // Play page turn sound
    this.scene.sound.play("page-turn");
  }

  private createItemButton(item: ShopItemButton, index: number) {
    const button = new Phaser.GameObjects.Container(this.scene, 0, 0).setName(
      item.name
    );

    const texture = item.purchased
      ? `${item.name}-item`
      : `${item.name}-item-locked`;

    // const itemTexture = item.unlocked ? item.texture : item.texture + "-locked";
    // Create weapon display
    const itemSprite = this.scene.add
      .image(0, 0, texture)
      .setOrigin(0.5)
      .setScale(JOURNAL_SCALE)
      .setName(`${item.name}-texture`);

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

  private handleItemSelection(item: ShopItemButton): void {
    this.scene.sound.play("click");
    if (!item.unlocked) {
      // un released item, deny and return
      this.scene.sound.play("click-deny");
      return;
    }

    if (!item.purchased) {
      if (!this.canAfford(item.price)) {
        this.scene.sound.play("click-deny");
        return;
      }
      // deduct coins, update config/ localstore, update texture
      this.scene.sound.play("coin-pickup");
      EventBus.emit("coins-changed", -item.price);

      const page = this.shopContents
        .get(this.currentShop)
        ?.getByName(item.name) as Phaser.GameObjects.Container;

      const texture = page.getByName(
        `${item.name}-texture`
      ) as Phaser.GameObjects.Image;

      texture.setTexture(`${item.name}-item`);
      // set purchased state in local storage
      this.updatePurchaseState("item", item.name);
    }
    this.scene.registry.set("equiped-item", item.name);
    EventBus.emit("set-weapon", item.name);
    this.closeJournal();
    return;
  }

  // SKINS FUNCTIONALITY
  private createSkinsJournal(): void {
    const container = new Phaser.GameObjects.Container(this.scene, 0, 0);

    const config = this.SKIN_INFO[this.currentSkin];
    const texture = config.unlocked
      ? config.purchased
        ? `${config.name}-skin-purchased`
        : `${config.name}-skin-unlocked`
      : `${config.name}-skin-locked`;

    this.skinPage = this.scene.add
      .image(0, 0, texture)
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
        this.handleSelectSkin(this.SKIN_INFO[this.currentSkin]);
      });

    container.add([this.skinPage, skinHitArea]);
    this.journalContents.set("skins", container);
    this.add(container);
    container.setVisible(false);
  }

  private advanceSkin(): void {
    if (this.isAnimating || this.isAdvancing) return;
    this.isAdvancing = true;
    this.isAnimating = true;
    this.currentSkin = (this.currentSkin % 7) + 1;

    const config = this.SKIN_INFO[this.currentSkin];
    const texture = config.unlocked
      ? config.purchased
        ? `${config.name}-skin-purchased`
        : `${config.name}-skin-unlocked`
      : `${config.name}-skin-locked`;

    this.scene.tweens.add({
      targets: [this.skinPage],
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.skinPage.setTexture(texture);

        this.scene.tweens.add({
          targets: [this.skinPage],
          alpha: 1,
          duration: 200,
          onComplete: () => {
            this.isAnimating = false;
            this.isAdvancing = false;
          },
        });
      },
    });

    this.scene.sound.play("page-turn");
  }

  private handleSelectSkin(skin: SkinButtons[number]): void {
    this.scene.sound.play("click");
    // If the skin isnt unlocked by MC
    if (!skin.unlocked) {
      this.scene.sound.play("click-deny");
      return;
    }
    // If the skin isn't purchased
    if (!skin.purchased) {
      if (!this.canAfford(skin.price)) {
        this.scene.sound.play("click-deny");
        return;
      }
      // deduct coins, update config/ localstore, update texture
      this.scene.sound.play("coin-pickup");
      EventBus.emit("coins-changed", -skin.price);
      this.SKIN_INFO[this.currentSkin].purchased = true;
      this.skinPage.setTexture(`${skin.name}-skin-purchased`);
      // set purchased state in local storage
      this.updatePurchaseState("skin", skin.name);
    }
    // Equip Skin
    this.scene.registry.set("equipped-skin", skin.name);
    EventBus.emit("skin-equipped", skin.name);
    this.closeJournal();
    return;
  }

  // BOXES FUNCTIONALITY
  private createBoxesJournal(): void {
    const container = new Phaser.GameObjects.Container(this.scene, 0, 0);

    const config = this.BOX_INFO[this.currentBox];
    const texture = config.purchased
      ? `${config.name}-box`
      : `${config.name}-box-locked`;

    this.boxPage = this.scene.add
      .image(0, 0, texture)
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
        this.handleSelectBox(this.BOX_INFO[this.currentBox]);
      });

    // Add everything to the container
    container.add([this.boxPage, boxHitArea]);
    this.journalContents.set("boxes", container);
    this.add(container);
    container.setVisible(false);
  }

  private advanceBox(): void {
    if (this.isAnimating || this.isAdvancing) return;
    this.isAdvancing = true;
    this.isAnimating = true;
    this.currentBox = (this.currentBox % 6) + 1;

    const config = this.BOX_INFO[this.currentBox];
    const texture = config.purchased
      ? `${config.name}-box`
      : `${config.name}-box-locked`;

    this.scene.tweens.add({
      targets: [this.boxPage],
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.boxPage.setTexture(texture);

        // Fade back in
        this.scene.tweens.add({
          targets: [this.boxPage],
          alpha: 1,
          duration: 200,
          onComplete: () => {
            this.isAnimating = false;
            this.isAdvancing = false;
          },
        });
      },
    });

    this.scene.sound.play("page-turn");
  }

  private handleSelectBox(box: BoxButtons[number]): void {
    this.scene.sound.play("click");
    if (box.name === "coming-soon") {
      this.scene.sound.play("click-deny");
      return;
    }
    if (!box.purchased) {
      if (!this.canAfford(box.price)) {
        this.scene.sound.play("click-deny");
        return;
      }
      // deduct coins, update config/ localstore, update texture
      this.scene.sound.play("coin-pickup");
      EventBus.emit("coins-changed", -box.price);
      this.BOX_INFO[this.currentBox].purchased = true;
      this.boxPage.setTexture(`${box.name}-box`);
      // set purchased state in local storage
      this.updatePurchaseState("box", box.name);
    }
    this.scene.registry.set(`equipped-bg`, box.name);
    EventBus.emit("bg-change", box.bg);
    this.closeJournal();
    return;
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
        break;
      case "boxes":
        this.basePaper.setTexture("boxes-page");
        break;
      case "skins":
        this.basePaper.setTexture("skins-page");
        break;
      case "shop":
        this.currentState = "shop";
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
        this.currentState = "main";
        this.basePaper.setTexture("levels-page");
        break;
      case "shop":
        this.currentState = "shop";
        this.basePaper.setTexture("shop-page");
        this.shopContents.get(this.currentShop)?.setVisible(true);
        break;
      case "skins":
        this.currentState = "main";
        this.basePaper.setTexture("skins-page");
        break;
      case "boxes":
        this.currentState = "main";
        this.basePaper.setTexture("boxes-page");
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
        this.inputState.unlock("journal");
        EventBus.emit("journal-closed");
      },
    });
  }

  // Utility methods
  private onMarketcapChange(newMarketcap: number): void {
    this.closeJournal();
    this.scene.registry.set("marketcap", newMarketcap);

    this.TIER_INFO[2].unlocked = newMarketcap >= 1000000;
    this.TIER_INFO[3].unlocked = newMarketcap >= 5000000;
    this.TIER_INFO[4].unlocked = newMarketcap >= 10000000;

    this.SKIN_INFO[3].unlocked = newMarketcap >= 1000000;
    this.SKIN_INFO[4].unlocked = newMarketcap >= 5000000;
    this.SKIN_INFO[6].unlocked = newMarketcap >= 10000000;
  }

  public updatePurchaseState(
    type: "weapon" | "item" | "box" | "skin",
    itemName: string
  ): void {
    const storageKey = `${type}-purchases`;
    const currentPurchases = getPurchasedStates(storageKey);
    currentPurchases[itemName] = true;
    localStorage.setItem(storageKey, JSON.stringify(currentPurchases));
  }

  private getCoins(): number {
    const currentCoins = localStorage.getItem("coins");
    if (!currentCoins) {
      localStorage.setItem("coins", "0");
      return 0;
    }
    const coinNum = parseInt(currentCoins);
    return coinNum;
  }

  private canAfford(price: number): boolean {
    // Get current coins from game state
    const coins = this.getCoins();
    return coins >= price;
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

  public destroy(): void {
    EventBus.off("open-journal", this.handleJournalOpen, this);
    super.destroy();
  }
}

