export type GameSoundKey =
  // Weapon sounds
  | "deagle-cock"
  | "deagle-fire"
  | "rpg-fire"
  | "railgun-fire"
  | "railgun-fire2"
  | "raygun-fire"
  // Impact sounds
  | "explode"
  | "railgun-explode"
  | "raygun-impact"
  | "fire-bomb-impact"
  // Character sounds
  | "death"
  | "grunt"
  | "ouch"
  | "thump"
  // UI sounds
  | "click"
  | "click-deny"
  | "page-turn"
  // Special weapon sounds
  | "railgun-charge"
  | "railgun-power"
  | "fire-bomb-fire";

export type GameWeaponKey =
  | "knife"
  | "deagle"
  | "grenade"
  | "fire-bomb"
  | "sticky-bomb"
  | "chainsaw"
  | "lightsaber"
  | "tommy"
  | "mg"
  | "railgun"
  | "raygun"
  | "rpg"
  | "dynamite"
  | "katana"
  | "kar98"
  | "flamethrower";

export interface WeaponConfig {
  texture: string;
  width: number;
  height: number;
  name: string;
}

