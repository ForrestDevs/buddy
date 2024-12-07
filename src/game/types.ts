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

export type SpecialWeaponKey =
  | "chainsaw"
  | "katana"
  | "lightsaber"
  | "flamethrower"
  | "railgun";

export interface WeaponConfig {
  texture: string;
  width: number;
  height: number;
  name: string;
}

export const COLLISION_CATEGORIES = {
  HEAD: 0x0001, // 0000 0000 0000 0001
  BODY: 0x0002, // 0000 0000 0000 0010
  ARMS: 0x0004, // 0000 0000 0000 0100
  LEGS: 0x0008, // 0000 0000 0000 1000
  BOUNDS: 0x0010, // 0000 0000 0001 0000
  POINTER: 0x0020, // 0000 0000 0010 0000
};

