import React, { useState, useEffect, useRef } from "react";

/* ============================ GAME DATA (SRD 5.1 mechanics) ============================ */

const ABILITIES = [
  { key: "str", name: "Strength", short: "STR", desc: "Raw physical power. Melee attacks, lifting, Athletics." },
  { key: "dex", name: "Dexterity", short: "DEX", desc: "Agility & reflexes. Armor Class, initiative, ranged attacks, Stealth." },
  { key: "con", name: "Constitution", short: "CON", desc: "Health & stamina. Determines your hit points." },
  { key: "int", name: "Intelligence", short: "INT", desc: "Reasoning & memory. Arcana, Investigation, wizard spells." },
  { key: "wis", name: "Wisdom", short: "WIS", desc: "Awareness & insight. Perception, cleric/druid spells." },
  { key: "cha", name: "Charisma", short: "CHA", desc: "Force of personality. Persuasion, bard/sorcerer/warlock spells." },
];

const SKILLS = [
  { key: "acrobatics", name: "Acrobatics", ability: "dex" },
  { key: "animal", name: "Animal Handling", ability: "wis" },
  { key: "arcana", name: "Arcana", ability: "int" },
  { key: "athletics", name: "Athletics", ability: "str" },
  { key: "deception", name: "Deception", ability: "cha" },
  { key: "history", name: "History", ability: "int" },
  { key: "insight", name: "Insight", ability: "wis" },
  { key: "intimidation", name: "Intimidation", ability: "cha" },
  { key: "investigation", name: "Investigation", ability: "int" },
  { key: "medicine", name: "Medicine", ability: "wis" },
  { key: "nature", name: "Nature", ability: "int" },
  { key: "perception", name: "Perception", ability: "wis" },
  { key: "performance", name: "Performance", ability: "cha" },
  { key: "persuasion", name: "Persuasion", ability: "cha" },
  { key: "religion", name: "Religion", ability: "int" },
  { key: "sleight", name: "Sleight of Hand", ability: "dex" },
  { key: "stealth", name: "Stealth", ability: "dex" },
  { key: "survival", name: "Survival", ability: "wis" },
];
const SKILL_BY_KEY = Object.fromEntries(SKILLS.map((s) => [s.key, s]));

const RACES = {
  human: {
    name: "Human", speed: 30, bonus: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
    blurb: "Adaptable and ambitious, found in every corner of the world. The jack-of-all-trades.",
    traits: ["+1 to every ability score", "One extra language", "Extra skill / feat in many tables"],
  },
  dwarf: {
    name: "Dwarf", speed: 25, bonus: { con: 2 },
    blurb: "Stout, stubborn folk of mountain and stone. Famous for resilience and long memories.",
    traits: ["Darkvision 60 ft", "Resistance to poison", "Stonecunning"],
    subraces: {
      hill: { name: "Hill Dwarf", bonus: { wis: 1 }, traits: ["+1 hit point per level (Dwarven Toughness)"] },
      mountain: { name: "Mountain Dwarf", bonus: { str: 2 }, traits: ["Light & medium armor proficiency"] },
    },
  },
  elf: {
    name: "Elf", speed: 30, bonus: { dex: 2 },
    blurb: "Graceful, long-lived, and attuned to magic and nature.",
    traits: ["Darkvision 60 ft", "Keen Senses (Perception)", "Fey Ancestry", "Trance (4 hr rest)"],
    subraces: {
      high: { name: "High Elf", bonus: { int: 1 }, traits: ["One wizard cantrip", "Extra language"] },
      wood: { name: "Wood Elf", bonus: { wis: 1 }, speed: 35, traits: ["Speed 35 ft", "Mask of the Wild (hide in nature)"] },
    },
  },
  halfling: {
    name: "Halfling", speed: 25, bonus: { dex: 2 },
    blurb: "Small, cheerful, and astonishingly lucky. Punches well above its size.",
    traits: ["Lucky (reroll natural 1s)", "Brave (advantage vs frightened)", "Halfling Nimbleness"],
    subraces: {
      lightfoot: { name: "Lightfoot", bonus: { cha: 1 }, traits: ["Naturally Stealthy"] },
      stout: { name: "Stout", bonus: { con: 1 }, traits: ["Stout Resilience (poison)"] },
    },
  },
  dragonborn: {
    name: "Dragonborn", speed: 30, bonus: { str: 2, cha: 1 },
    blurb: "Proud, draconic humanoids who exhale elemental fury.",
    traits: ["Breath Weapon", "Damage resistance by ancestry"],
  },
  gnome: {
    name: "Gnome", speed: 25, bonus: { int: 2 },
    blurb: "Tiny, brilliant tinkerers bursting with curiosity.",
    traits: ["Darkvision 60 ft", "Gnome Cunning (advantage on mental saves vs magic)"],
    subraces: {
      rock: { name: "Rock Gnome", bonus: { con: 1 }, traits: ["Artificer's Lore", "Tinker"] },
      forest: { name: "Forest Gnome", bonus: { dex: 1 }, traits: ["Minor Illusion cantrip", "Speak with small beasts"] },
    },
  },
  halfelf: {
    name: "Half-Elf", speed: 30, bonus: { cha: 2 }, choose2: true,
    blurb: "Caught between two worlds, charming and versatile.",
    traits: ["+2 Charisma and +1 to two abilities of your choice", "Darkvision", "Fey Ancestry", "Two skill proficiencies"],
  },
  halforc: {
    name: "Half-Orc", speed: 30, bonus: { str: 2, con: 1 },
    blurb: "Strong, fierce survivors who refuse to fall.",
    traits: ["Darkvision", "Relentless Endurance (drop to 1 HP once)", "Savage Attacks"],
  },
  tiefling: {
    name: "Tiefling", speed: 30, bonus: { cha: 2, int: 1 },
    blurb: "Marked by an infernal bloodline; mistrusted, but rarely powerless.",
    traits: ["Darkvision", "Fire resistance", "Thaumaturgy cantrip + innate spells"],
  },
};

const CLASSES = {
  barbarian: { name: "Barbarian", hd: 12, primary: ["str"], saves: ["str", "con"], skillCount: 2,
    skills: ["animal", "athletics", "intimidation", "nature", "perception", "survival"],
    blurb: "A roaring melee bruiser who turns fury into damage and durability. Hard to kill, easy to play." },
  bard: { name: "Bard", hd: 8, primary: ["cha"], saves: ["dex", "cha"], skillCount: 3,
    skills: SKILLS.map((s) => s.key),
    blurb: "A magical jack-of-all-trades. Buffs allies, talks past trouble, and casts a bit of everything." },
  cleric: { name: "Cleric", hd: 8, primary: ["wis"], saves: ["wis", "cha"], skillCount: 2,
    skills: ["history", "insight", "medicine", "persuasion", "religion"],
    blurb: "A divine spellcaster who heals, protects, and smites. The classic support backbone." },
  druid: { name: "Druid", hd: 8, primary: ["wis"], saves: ["int", "wis"], skillCount: 2,
    skills: ["arcana", "animal", "insight", "medicine", "nature", "perception", "religion", "survival"],
    blurb: "A nature caster who can shapeshift into beasts and command the elements." },
  fighter: { name: "Fighter", hd: 10, primary: ["str", "dex"], saves: ["str", "con"], skillCount: 2,
    skills: ["acrobatics", "animal", "athletics", "history", "insight", "intimidation", "perception", "survival"],
    blurb: "The most flexible martial class. Wears any armor, swings any weapon, gets extra attacks fast. Great first class." },
  monk: { name: "Monk", hd: 8, primary: ["dex", "wis"], saves: ["str", "dex"], skillCount: 2,
    skills: ["acrobatics", "athletics", "history", "insight", "religion", "stealth"],
    blurb: "An unarmored martial artist with flurries of strikes and supernatural mobility." },
  paladin: { name: "Paladin", hd: 10, primary: ["str", "cha"], saves: ["wis", "cha"], skillCount: 2,
    skills: ["athletics", "insight", "intimidation", "medicine", "persuasion", "religion"],
    blurb: "A holy warrior: heavy armor, big smites, healing, and auras that protect the party." },
  ranger: { name: "Ranger", hd: 10, primary: ["dex", "wis"], saves: ["str", "dex"], skillCount: 3,
    skills: ["animal", "athletics", "insight", "investigation", "nature", "perception", "stealth", "survival"],
    blurb: "A wilderness hunter blending weapon skill with a touch of nature magic." },
  rogue: { name: "Rogue", hd: 8, primary: ["dex"], saves: ["dex", "int"], skillCount: 4,
    skills: ["acrobatics", "athletics", "deception", "insight", "intimidation", "investigation", "perception", "performance", "persuasion", "sleight", "stealth"],
    blurb: "The skill master. Sneak Attack burst damage, stealth, locks, traps, and the most skills of any class." },
  sorcerer: { name: "Sorcerer", hd: 6, primary: ["cha"], saves: ["con", "cha"], skillCount: 2,
    skills: ["arcana", "deception", "insight", "intimidation", "persuasion", "religion"],
    blurb: "An innate spellcaster who bends magic with raw force (Metamagic). Fragile but explosive." },
  warlock: { name: "Warlock", hd: 8, primary: ["cha"], saves: ["wis", "cha"], skillCount: 2,
    skills: ["arcana", "deception", "history", "intimidation", "investigation", "nature", "religion"],
    blurb: "A pact-bound caster with the reliable Eldritch Blast and powerful short-rest magic." },
  wizard: { name: "Wizard", hd: 6, primary: ["int"], saves: ["int", "wis"], skillCount: 2,
    skills: ["arcana", "history", "insight", "investigation", "medicine", "religion"],
    blurb: "The deepest spellbook in the game. Squishy, but unmatched versatility and control." },
};

const BACKGROUNDS = {
  acolyte: { name: "Acolyte", skills: ["insight", "religion"], blurb: "You served in a temple. Trained in faith and the rituals of the divine." },
  criminal: { name: "Criminal", skills: ["deception", "stealth"], blurb: "You lived outside the law, with contacts in the underworld." },
  folkhero: { name: "Folk Hero", skills: ["animal", "survival"], blurb: "A commoner who stood up to tyranny. The people remember." },
  noble: { name: "Noble", skills: ["history", "persuasion"], blurb: "Born to privilege, fluent in courts, titles, and influence." },
  sage: { name: "Sage", skills: ["arcana", "history"], blurb: "A scholar and researcher who knows where answers are buried." },
  soldier: { name: "Soldier", skills: ["athletics", "intimidation"], blurb: "You served in an army and know rank, tactics, and discipline." },
  entertainer: { name: "Entertainer", skills: ["acrobatics", "performance"], blurb: "You lived for the stage and the applause of a crowd." },
  guild: { name: "Guild Artisan", skills: ["insight", "persuasion"], blurb: "A skilled crafter with a trade and a guild at your back." },
  outlander: { name: "Outlander", skills: ["athletics", "survival"], blurb: "Raised in the wilds, far from cities and their soft comforts." },
  urchin: { name: "Urchin", skills: ["sleight", "stealth"], blurb: "You grew up on the streets and learned to survive on nothing." },
};

// Sensible default level-1 starting kits (one common option per class).
const CLASS_EQUIPMENT = {
  barbarian: ["Greataxe", "Two handaxes", "Four javelins", "Explorer's pack"],
  bard: ["Rapier", "Dagger", "Leather armor", "Lute", "Entertainer's pack"],
  cleric: ["Mace", "Scale mail", "Shield", "Light crossbow + 20 bolts", "Holy symbol", "Priest's pack"],
  druid: ["Scimitar", "Wooden shield", "Leather armor", "Druidic focus", "Explorer's pack"],
  fighter: ["Chain mail", "Longsword", "Shield", "Light crossbow + 20 bolts", "Dungeoneer's pack"],
  monk: ["Shortsword", "10 darts", "Explorer's pack"],
  paladin: ["Chain mail", "Longsword", "Shield", "Five javelins", "Holy symbol", "Priest's pack"],
  ranger: ["Scale mail", "Two shortswords", "Longbow + 20 arrows", "Dungeoneer's pack"],
  rogue: ["Rapier", "Shortbow + 20 arrows", "Leather armor", "Two daggers", "Thieves' tools", "Burglar's pack"],
  sorcerer: ["Light crossbow + 20 bolts", "Two daggers", "Component pouch", "Dungeoneer's pack"],
  warlock: ["Light crossbow + 20 bolts", "Leather armor", "Two daggers", "Component pouch", "Scholar's pack"],
  wizard: ["Quarterstaff", "Dagger", "Spellbook", "Component pouch", "Scholar's pack"],
};
const BACKGROUND_EQUIPMENT = {
  acolyte: ["Holy symbol", "Prayer book", "5 sticks of incense", "Vestments", "15 gp"],
  criminal: ["Crowbar", "Dark common clothes with hood", "15 gp"],
  folkhero: ["Set of artisan's tools", "Shovel", "Iron pot", "Common clothes", "10 gp"],
  noble: ["Fine clothes", "Signet ring", "Scroll of pedigree", "25 gp"],
  sage: ["Bottle of ink", "Quill", "Small knife", "Letter from a dead colleague", "10 gp"],
  soldier: ["Insignia of rank", "Trophy from a fallen enemy", "Deck of cards", "Common clothes", "10 gp"],
  entertainer: ["Musical instrument", "Favor of an admirer", "Costume", "15 gp"],
  guild: ["Set of artisan's tools", "Letter of introduction from guild", "Traveler's clothes", "15 gp"],
  outlander: ["Staff", "Hunting trap", "Trophy from an animal", "Traveler's clothes", "10 gp"],
  urchin: ["Small knife", "Map of your home city", "Pet mouse", "Common clothes", "10 gp"],
};
function defaultEquipment(c) {
  return [...(CLASS_EQUIPMENT[c.class] || []), ...(BACKGROUND_EQUIPMENT[c.background] || [])];
}

// Classes that actually cast spells at level 1 (Paladins & Rangers don't until level 2).
const CASTERS = { bard: "cha", cleric: "wis", druid: "wis", sorcerer: "cha", warlock: "cha", wizard: "int" };
const isCaster = (cls) => !!CASTERS[cls];

// A curated set of SRD spells (cantrips + levels 1-3), tagged by class.
const SPELLS = [
  // Cantrips (level 0)
  { name: "Fire Bolt", level: 0, classes: ["sorcerer", "wizard"], time: "1 action", comp: "V, S", effect: "Ranged fire damage; reliable attack cantrip." },
  { name: "Ray of Frost", level: 0, classes: ["sorcerer", "wizard"], time: "1 action", comp: "V, S", effect: "Cold damage that also slows the target." },
  { name: "Shocking Grasp", level: 0, classes: ["sorcerer", "wizard"], time: "1 action", comp: "V, S", effect: "Melee lightning; stops reactions." },
  { name: "Chill Touch", level: 0, classes: ["sorcerer", "warlock", "wizard"], time: "1 action", comp: "V, S", effect: "Necrotic touch at range; blocks healing." },
  { name: "Eldritch Blast", level: 0, classes: ["warlock"], time: "1 action", comp: "V, S", effect: "Force beam; the iconic warlock attack." },
  { name: "Sacred Flame", level: 0, classes: ["cleric"], time: "1 action", comp: "V, S", effect: "Radiant damage that ignores cover." },
  { name: "Vicious Mockery", level: 0, classes: ["bard"], time: "1 action", comp: "V", effect: "Psychic insult; gives the target disadvantage." },
  { name: "Produce Flame", level: 0, classes: ["druid"], time: "1 action", comp: "V, S", effect: "A flame for light or a thrown attack." },
  { name: "Shillelagh", level: 0, classes: ["druid"], time: "1 bonus action", comp: "V, S, M", effect: "Empower a club or staff with nature magic." },
  { name: "Guidance", level: 0, classes: ["cleric", "druid"], time: "1 action", comp: "V, S", effect: "Add 1d4 to one ability check." },
  { name: "Light", level: 0, classes: ["bard", "cleric", "sorcerer", "wizard"], time: "1 action", comp: "V, M", effect: "Make an object shed bright light." },
  { name: "Mage Hand", level: 0, classes: ["bard", "sorcerer", "warlock", "wizard"], time: "1 action", comp: "V, S", effect: "A spectral hand moves small objects." },
  { name: "Minor Illusion", level: 0, classes: ["bard", "sorcerer", "warlock", "wizard"], time: "1 action", comp: "S, M", effect: "Create a small sound or image." },
  { name: "Prestidigitation", level: 0, classes: ["bard", "sorcerer", "warlock", "wizard"], time: "1 action", comp: "V, S", effect: "Minor magical tricks and flourishes." },
  { name: "Spare the Dying", level: 0, classes: ["cleric"], time: "1 action", comp: "V, S", effect: "Stabilize a creature at 0 HP." },
  // Level 1
  { name: "Magic Missile", level: 1, classes: ["sorcerer", "wizard"], time: "1 action", comp: "V, S", effect: "Three darts of force that never miss." },
  { name: "Burning Hands", level: 1, classes: ["sorcerer", "wizard"], time: "1 action", comp: "V, S", effect: "A cone of fire." },
  { name: "Cure Wounds", level: 1, classes: ["bard", "cleric", "druid", "paladin", "ranger"], time: "1 action", comp: "V, S", effect: "Heal a creature you touch." },
  { name: "Healing Word", level: 1, classes: ["bard", "cleric", "druid"], time: "1 bonus action", comp: "V", effect: "Heal at range as a bonus action." },
  { name: "Shield", level: 1, classes: ["sorcerer", "wizard"], time: "1 reaction", comp: "V, S", effect: "Reaction; a big burst of AC." },
  { name: "Mage Armor", level: 1, classes: ["sorcerer", "wizard"], time: "1 action", comp: "V, S, M", effect: "Set unarmored AC to 13 + Dex." },
  { name: "Sleep", level: 1, classes: ["bard", "sorcerer", "wizard"], time: "1 action", comp: "V, S, M", effect: "Put weaker creatures to sleep." },
  { name: "Thunderwave", level: 1, classes: ["bard", "druid", "sorcerer", "wizard"], time: "1 action", comp: "V, S", effect: "A wave of force that knocks foes back." },
  { name: "Charm Person", level: 1, classes: ["bard", "druid", "sorcerer", "warlock", "wizard"], time: "1 action", comp: "V, S", effect: "Make a humanoid regard you as friendly." },
  { name: "Faerie Fire", level: 1, classes: ["bard", "druid"], time: "1 action", comp: "V", effect: "Outline foes; attacks against them gain advantage." },
  { name: "Bless", level: 1, classes: ["cleric", "paladin"], time: "1 action", comp: "V, S, M", effect: "Allies add 1d4 to attacks and saves." },
  { name: "Guiding Bolt", level: 1, classes: ["cleric"], time: "1 action", comp: "V, S", effect: "Radiant attack; the next hit gets advantage." },
  { name: "Hunter's Mark", level: 1, classes: ["ranger"], time: "1 bonus action", comp: "V", effect: "Bonus damage against a marked target." },
  { name: "Hex", level: 1, classes: ["warlock"], time: "1 bonus action", comp: "V, S, M", effect: "Curse a target for bonus damage." },
  { name: "Detect Magic", level: 1, classes: ["bard", "cleric", "druid", "paladin", "ranger", "sorcerer", "wizard"], time: "1 action", comp: "V, S", effect: "Sense magic around you." },
  // Level 2
  { name: "Misty Step", level: 2, classes: ["sorcerer", "warlock", "wizard"], time: "1 bonus action", comp: "V", effect: "Teleport 30 ft as a bonus action." },
  { name: "Scorching Ray", level: 2, classes: ["sorcerer", "wizard"], time: "1 action", comp: "V, S", effect: "Three rays of fire." },
  { name: "Hold Person", level: 2, classes: ["bard", "cleric", "druid", "sorcerer", "warlock", "wizard"], time: "1 action", comp: "V, S, M", effect: "Paralyze a humanoid." },
  { name: "Invisibility", level: 2, classes: ["bard", "sorcerer", "warlock", "wizard"], time: "1 action", comp: "V, S, M", effect: "Turn a creature invisible." },
  { name: "Lesser Restoration", level: 2, classes: ["bard", "cleric", "druid", "paladin", "ranger"], time: "1 action", comp: "V, S", effect: "Cure a disease or condition." },
  { name: "Spiritual Weapon", level: 2, classes: ["cleric"], time: "1 bonus action", comp: "V, S", effect: "A floating weapon attacks for you." },
  { name: "Aid", level: 2, classes: ["cleric", "paladin"], time: "1 action", comp: "V, S, M", effect: "Raise allies' current and max HP." },
  { name: "Web", level: 2, classes: ["sorcerer", "wizard"], time: "1 action", comp: "V, S, M", effect: "Restrain creatures in sticky webbing." },
  { name: "Flaming Sphere", level: 2, classes: ["druid", "wizard"], time: "1 action", comp: "V, S, M", effect: "A rolling ball of fire you control." },
  { name: "Moonbeam", level: 2, classes: ["druid"], time: "1 action", comp: "V, S, M", effect: "A movable beam of searing light." },
  { name: "Suggestion", level: 2, classes: ["bard", "sorcerer", "warlock", "wizard"], time: "1 action", comp: "V, M", effect: "Magically suggest a course of action." },
  // Level 3
  { name: "Fireball", level: 3, classes: ["sorcerer", "wizard"], time: "1 action", comp: "V, S, M", effect: "A huge explosion of fire." },
  { name: "Lightning Bolt", level: 3, classes: ["sorcerer", "wizard"], time: "1 action", comp: "V, S, M", effect: "A line of lightning." },
  { name: "Counterspell", level: 3, classes: ["sorcerer", "warlock", "wizard"], time: "1 reaction", comp: "S", effect: "Reaction; interrupt another spell." },
  { name: "Fly", level: 3, classes: ["sorcerer", "warlock", "wizard"], time: "1 action", comp: "V, S, M", effect: "Grant a flying speed." },
  { name: "Dispel Magic", level: 3, classes: ["bard", "cleric", "druid", "paladin", "sorcerer", "warlock", "wizard"], time: "1 action", comp: "V, S", effect: "End ongoing magical effects." },
  { name: "Revivify", level: 3, classes: ["cleric", "paladin"], time: "1 action", comp: "V, S, M", effect: "Bring back the recently dead." },
  { name: "Mass Healing Word", level: 3, classes: ["cleric"], time: "1 bonus action", comp: "V", effect: "Heal several allies at range." },
  { name: "Spirit Guardians", level: 3, classes: ["cleric"], time: "1 action", comp: "V, S, M", effect: "Protective spirits harm nearby foes." },
  { name: "Haste", level: 3, classes: ["sorcerer", "wizard"], time: "1 action", comp: "V, S, M", effect: "Greatly speed up an ally." },
  { name: "Hypnotic Pattern", level: 3, classes: ["bard", "sorcerer", "warlock", "wizard"], time: "1 action", comp: "S, M", effect: "Charm foes with a swirling pattern." },
  { name: "Call Lightning", level: 3, classes: ["druid"], time: "1 action", comp: "V, S", effect: "Summon bolts from a storm cloud." },
];
const SPELL_LEVEL_NAMES = { 0: "Cantrips", 1: "1st Level", 2: "2nd Level", 3: "3rd Level" };

const WEAPON_DICE = ["1d4", "1d6", "1d8", "1d10", "1d12", "2d6"];

// Recognized weapons for auto-detecting attacks from the inventory.
// ability: "str", "dex" (ranged), or "finesse" (auto-picks the higher of STR/DEX).
// Ordered so multi-word/specific names match before generic ones.
const WEAPON_DB = [
  { key: "light crossbow", name: "Light Crossbow", dice: "1d8", ability: "dex" },
  { key: "hand crossbow", name: "Hand Crossbow", dice: "1d6", ability: "dex" },
  { key: "heavy crossbow", name: "Heavy Crossbow", dice: "1d10", ability: "dex" },
  { key: "crossbow", name: "Crossbow", dice: "1d8", ability: "dex" },
  { key: "shortbow", name: "Shortbow", dice: "1d6", ability: "dex" },
  { key: "longbow", name: "Longbow", dice: "1d8", ability: "dex" },
  { key: "greatsword", name: "Greatsword", dice: "2d6", ability: "str" },
  { key: "shortsword", name: "Shortsword", dice: "1d6", ability: "finesse" },
  { key: "longsword", name: "Longsword", dice: "1d8", ability: "str" },
  { key: "greataxe", name: "Greataxe", dice: "1d12", ability: "str" },
  { key: "battleaxe", name: "Battleaxe", dice: "1d8", ability: "str" },
  { key: "handaxe", name: "Handaxe", dice: "1d6", ability: "str" },
  { key: "quarterstaff", name: "Quarterstaff", dice: "1d6", ability: "str" },
  { key: "warhammer", name: "Warhammer", dice: "1d8", ability: "str" },
  { key: "morningstar", name: "Morningstar", dice: "1d8", ability: "str" },
  { key: "rapier", name: "Rapier", dice: "1d8", ability: "finesse" },
  { key: "scimitar", name: "Scimitar", dice: "1d6", ability: "finesse" },
  { key: "dagger", name: "Dagger", dice: "1d4", ability: "finesse" },
  { key: "javelin", name: "Javelin", dice: "1d6", ability: "str" },
  { key: "mace", name: "Mace", dice: "1d6", ability: "str" },
  { key: "spear", name: "Spear", dice: "1d6", ability: "str" },
  { key: "trident", name: "Trident", dice: "1d6", ability: "str" },
  { key: "glaive", name: "Glaive", dice: "1d10", ability: "str" },
  { key: "halberd", name: "Halberd", dice: "1d10", ability: "str" },
  { key: "maul", name: "Maul", dice: "2d6", ability: "str" },
  { key: "club", name: "Club", dice: "1d4", ability: "str" },
  { key: "dart", name: "Dart", dice: "1d4", ability: "finesse" },
  { key: "sling", name: "Sling", dice: "1d4", ability: "dex" },
  { key: "staff", name: "Quarterstaff", dice: "1d6", ability: "str" },
];

function deriveWeapons(c) {
  const eq = c.equipment || [];
  const strMod = mod(finalScore(c, "str"));
  const dexMod = mod(finalScore(c, "dex"));
  const out = [];
  const seen = new Set();
  eq.forEach((item) => {
    const low = String(item).toLowerCase();
    for (const w of WEAPON_DB) {
      if (low.includes(w.key) && !seen.has(w.name)) {
        seen.add(w.name);
        const ability = w.ability === "finesse" ? (dexMod >= strMod ? "dex" : "str") : w.ability;
        out.push({ id: "auto-" + w.name, name: w.name, ability, dice: w.dice, auto: true });
        break;
      }
    }
  });
  return out;
}

const ALIGNMENTS = [
  "Lawful Good", "Neutral Good", "Chaotic Good",
  "Lawful Neutral", "True Neutral", "Chaotic Neutral",
  "Lawful Evil", "Neutral Evil", "Chaotic Evil",
];

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
const POINT_BUY_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
const PROF_BONUS = 2; // level 1

/* ============================ HELPERS ============================ */

const mod = (score) => Math.floor((score - 10) / 2);
const fmt = (n) => (n >= 0 ? "+" : "") + n;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const roll4d6 = () => {
  const r = [0, 0, 0, 0].map(() => 1 + Math.floor(Math.random() * 6)).sort((a, b) => b - a);
  return r[0] + r[1] + r[2];
};

function racialBonus(c) {
  const out = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
  const race = RACES[c.race];
  if (!race) return out;
  Object.entries(race.bonus || {}).forEach(([k, v]) => (out[k] += v));
  if (race.subraces && c.subrace && race.subraces[c.subrace]) {
    Object.entries(race.subraces[c.subrace].bonus || {}).forEach(([k, v]) => (out[k] += v));
  }
  if (race.choose2) (c.halfElf || []).forEach((k) => { if (k) out[k] += 1; });
  return out;
}
const finalScore = (c, key) => (c.baseScores?.[key] || 0) + racialBonus(c)[key];
const getSpeed = (c) => {
  const race = RACES[c.race];
  if (!race) return "—";
  const sr = race.subraces && c.subrace ? race.subraces[c.subrace] : null;
  return (sr && sr.speed) || race.speed;
};
function maxHP(c) {
  const cls = CLASSES[c.class];
  if (!cls) return "—";
  let hp = cls.hd + mod(finalScore(c, "con"));
  if (c.race === "dwarf" && c.subrace === "hill") hp += 1;
  return Math.max(1, hp);
}
function allProficientSkills(c) {
  const bg = BACKGROUNDS[c.background];
  const set = new Set([...(c.classSkills || []), ...((bg && bg.skills) || [])]);
  return set;
}
function blankChar() {
  return {
    id: uid(), name: "", player: "", race: "", subrace: "", halfElf: ["", ""],
    class: "", background: "", alignment: "", scoreMethod: "array",
    baseScores: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
    pool: [...STANDARD_ARRAY], classSkills: [], acOverride: "", notes: "",
    equipment: [], equipmentLoaded: false, weapons: [], spells: [], photo: "",
    level: 1, createdAt: Date.now(),
  };
}

/* ============================ APP ============================ */

export default function App() {
  const [roster, setRoster] = useState([]);
  const [view, setView] = useState("home"); // home | learn | build | sheet
  const [currentId, setCurrentId] = useState(null);
  const [step, setStep] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved
  const [raceImages, setRaceImages] = useState({}); // { raceKey: dataURL } — session photos for the selector

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("dnd:roster");
        if (r && r.value) setRoster(JSON.parse(r.value));
      } catch (e) { /* first run / no storage */ }
      try {
        const im = await window.storage.get("dnd:raceImages");
        if (im && im.value) setRaceImages(JSON.parse(im.value));
      } catch (e) { /* not published / no storage — held in session only */ }
      setLoaded(true);
    })();
  }, []);

  const setRaceImage = (key, dataUrl) => {
    setRaceImages((prev) => {
      const next = { ...prev };
      if (dataUrl) next[key] = dataUrl; else delete next[key];
      try { window.storage.set("dnd:raceImages", JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };

  useEffect(() => {
    if (!loaded) return;
    setSaveState("saving");
    const t = setTimeout(async () => {
      try { await window.storage.set("dnd:roster", JSON.stringify(roster)); } catch (e) {}
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1400);
    }, 350);
    return () => clearTimeout(t);
  }, [roster, loaded]);

  const current = roster.find((c) => c.id === currentId) || null;
  const update = (patch) =>
    setRoster((r) => r.map((c) => (c.id === currentId ? { ...c, ...patch } : c)));

  const startNew = () => {
    const c = blankChar();
    setRoster((r) => [...r, c]);
    setCurrentId(c.id);
    setStep(0);
    setView("build");
  };
  const editChar = (id) => { setCurrentId(id); setStep(0); setView("build"); };
  const viewSheet = (id) => { setCurrentId(id); setView("sheet"); };
  const deleteChar = (id) => setRoster((r) => r.filter((c) => c.id !== id));

  return (
    <>
      <style>{CSS}</style>
      <div className="grim">
        {view !== "sheet" && (
          <header className="topbar no-print">
            <div className="brand" onClick={() => setView("home")}>
              <span className="crest">✦</span>
              <div>
                <div className="brand-title">The Adventurer's Forge</div>
                <div className="brand-sub">D&amp;D 5e Character Creator</div>
              </div>
            </div>
            <div className="save-pill">
              {saveState === "saving" ? "Saving…" : saveState === "saved" ? "✓ Saved" : "Auto-save on"}
            </div>
          </header>
        )}

        {!loaded && <div className="loading">Unrolling the scrolls…</div>}
        {loaded && view === "home" && (
          <Home roster={roster} onNew={startNew} onLearn={() => setView("learn")}
            onEdit={editChar} onSheet={viewSheet} onDelete={deleteChar} />
        )}
        {loaded && view === "learn" && <Learn onBack={() => setView("home")} onStart={startNew} raceImages={raceImages} setRaceImage={setRaceImage} />}
        {loaded && view === "build" && current && (
          <Builder c={current} update={update} step={step} setStep={setStep}
            raceImages={raceImages} setRaceImage={setRaceImage}
            onHome={() => setView("home")} onFinish={() => viewSheet(current.id)} />
        )}
        {loaded && view === "sheet" && current && (
          <Sheet c={current} update={update} onBack={() => setView("home")} onEdit={() => editChar(current.id)} />
        )}
      </div>
    </>
  );
}

/* ============================ HOME / ROSTER ============================ */

function Home({ roster, onNew, onLearn, onEdit, onSheet, onDelete }) {
  return (
    <div className="page fade-in">
      <div className="hero">
        <div className="hero-rule">◈ ◈ ◈</div>
        <h1>Forge Your Hero</h1>
        <p className="hero-lead">
          Welcome, first-time adventurers. Build a Dungeons &amp; Dragons character step by step —
          everything saves automatically, and you can print a finished sheet for the table.
        </p>
        <div className="hero-actions">
          <button className="btn btn-ghost" onClick={onLearn}>📖 Learn the Basics</button>
          <button className="btn btn-primary" onClick={onNew}>＋ Create a Character</button>
        </div>
      </div>

      <div className="section-head">
        <span>Your Party</span>
        <i />
      </div>

      {roster.length === 0 ? (
        <div className="empty">No characters yet. Press <b>Create a Character</b> to begin your tale.</div>
      ) : (
        <div className="card-grid">
          {roster.map((c) => (
            <CharCard key={c.id} c={c} onSheet={onSheet} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function CharCard({ c, onSheet, onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const race = RACES[c.race];
  const cls = CLASSES[c.class];
  const sub = race && race.subraces && c.subrace ? race.subraces[c.subrace].name + " " : "";
  return (
    <div className={"char-card" + (confirming ? " confirming" : "")}>
      <div className="char-card-top">
        <div className="char-name">{c.name || "Unnamed Hero"}</div>
        <div className="char-meta">
          {sub}{race ? race.name : "—"} · {cls ? cls.name : "—"} · Lvl {c.level}
        </div>
      </div>
      {confirming ? (
        <div className="confirm-bar">
          <span>Delete this hero?</span>
          <button className="mini danger" onClick={() => onDelete(c.id)}>Yes, delete</button>
          <button className="mini" onClick={() => setConfirming(false)}>Cancel</button>
        </div>
      ) : (
        <div className="char-card-actions">
          <button className="mini" onClick={() => onSheet(c.id)}>Sheet</button>
          <button className="mini" onClick={() => onEdit(c.id)}>Edit</button>
          <button className="mini danger" onClick={() => setConfirming(true)} title="Delete">✕</button>
        </div>
      )}
    </div>
  );
}

/* ============================ LEARN ============================ */

// Tiny race/class emblems for the Learn page (inline SVG; no external images).
const RACE_ICONS = {
  human: `<circle cx="12" cy="8.3" r="4.3" fill="#2c2014"/><path d="M4.8 21c0-4.3 3.3-7 7.2-7s7.2 2.7 7.2 7z" fill="#2c2014"/>`,
  dwarf: `<path d="M5 10.5a7 7 0 0 1 14 0z" fill="#7a1f1f"/><rect x="4.3" y="9.3" width="15.4" height="2" rx="1" fill="#c39a3e"/><circle cx="12" cy="11.5" r="3.4" fill="#f3e6c9"/><circle cx="10.6" cy="11" r="0.7" fill="#2c2014"/><circle cx="13.4" cy="11" r="0.7" fill="#2c2014"/><path d="M8 12.6c0 6 1.6 8.8 4 8.8s4-2.8 4-8.8c-1.2 1.6-2.6 2.4-4 2.4s-2.8-.8-4-2.4z" fill="#2c2014"/>`,
  elf: `<circle cx="12" cy="9" r="4.2" fill="#2c2014"/><path d="M15.9 6.6 19.6 3.6 16.7 9z" fill="#2c2014"/><path d="M8.1 6.6 4.4 3.6 7.3 9z" fill="#2c2014"/><path d="M8.4 7.2q3.6-2.6 7.2 0" stroke="#c39a3e" stroke-width="1.2" fill="none"/><path d="M5 21c0-4.3 3.1-7 7-7s7 2.7 7 7z" fill="#2c2014"/>`,
  halfling: `<circle cx="9.4" cy="6.6" r="1.6" fill="#2c2014"/><circle cx="12" cy="5.9" r="1.7" fill="#2c2014"/><circle cx="14.6" cy="6.6" r="1.6" fill="#2c2014"/><circle cx="12" cy="10.2" r="4.1" fill="#2c2014"/><path d="M5.5 21c0-4 2.9-6.5 6.5-6.5s6.5 2.5 6.5 6.5z" fill="#2c2014"/>`,
  dragonborn: `<path d="M3.8 11.5c.2-3 2.6-5.6 6.2-5.6 2 0 3.4.7 4.4 1.7l1-2.4.7 2.9 4 .4-2.6 1.6 1.4 1.2-2.9.6c-.5 2.9-3 5-6.2 5-2.4 0-4.2-1.1-5.2-2.8l1.8-.4-2-1.1 1.5-.6z" fill="#3f5a35" stroke="#2c2014" stroke-width="0.5"/><path d="M9 5.6c.4-2.6 2.6-3.6 2.6-3.6-.6 1.6-.3 3.1.2 3.8z" fill="#2c2014"/><circle cx="11.6" cy="10.4" r="1" fill="#2c2014"/><circle cx="18.6" cy="10.2" r="0.5" fill="#2c2014"/>`,
  gnome: `<path d="M12 2 18.2 11.2H5.8z" fill="#7a1f1f"/><circle cx="12" cy="14" r="3.8" fill="#f3e6c9"/><circle cx="10.5" cy="13.3" r="0.6" fill="#2c2014"/><circle cx="13.5" cy="13.3" r="0.6" fill="#2c2014"/><circle cx="12" cy="14.8" r="1.1" fill="#2c2014"/><path d="M9 16.6c0 3 1.3 4.6 3 4.6s3-1.6 3-4.6c-.9 1-1.9 1.5-3 1.5s-2.1-.5-3-1.5z" fill="#2c2014"/>`,
  halfelf: `<circle cx="12" cy="9" r="4.2" fill="#2c2014"/><path d="M15.6 7.2 20 3.8 16.6 9.4z" fill="#2c2014"/><path d="M5 21c0-4.3 3.1-7 7-7s7 2.7 7 7z" fill="#2c2014"/>`,
  halforc: `<circle cx="12" cy="8.5" r="4.4" fill="#3f5a35"/><circle cx="10.4" cy="8" r="0.7" fill="#2c2014"/><circle cx="13.6" cy="8" r="0.7" fill="#2c2014"/><path d="M10.1 12.4 9.4 15l1.6-1.2z" fill="#f3e6c9"/><path d="M13.9 12.4 14.6 15 13 13.8z" fill="#f3e6c9"/><path d="M5 21c0-4 3-6.5 7-6.5s7 2.5 7 6.5z" fill="#3f5a35"/>`,
  tiefling: `<path d="M8.2 7.2C6.1 5.2 6 3 6 3c2 .5 3.2 2.1 3.6 3.6z" fill="#7a1f1f"/><path d="M15.8 7.2C17.9 5.2 18 3 18 3c-2 .5-3.2 2.1-3.6 3.6z" fill="#7a1f1f"/><circle cx="12" cy="10" r="4.2" fill="#2c2014"/><path d="M5 21c0-4.3 3.1-7 7-7s7 2.7 7 7z" fill="#2c2014"/>`,
};
const CLASS_ICONS = {
  barbarian: `<rect x="11" y="3" width="2" height="18" rx="1" fill="#2c2014"/><path d="M13 4c4.2 0 7 2.2 7 5.2-3-1.1-5-1.1-7-1.1z" fill="#7a1f1f"/><path d="M11 4c-4.2 0-7 2.2-7 5.2 3-1.1 5-1.1 7-1.1z" fill="#7a1f1f"/>`,
  bard: `<ellipse cx="10" cy="15.5" rx="5" ry="6" fill="#7a1f1f"/><circle cx="10" cy="15.5" r="1.6" fill="#2c2014"/><path d="M12.5 13.5 18 4" stroke="#2c2014" stroke-width="2" stroke-linecap="round"/><circle cx="18.3" cy="3.8" r="1.3" fill="#c39a3e"/>`,
  cleric: `<g stroke="#7a1f1f" stroke-width="1.6" stroke-linecap="round"><line x1="12" y1="2" x2="12" y2="4.6"/><line x1="12" y1="19.4" x2="12" y2="22"/><line x1="2" y1="12" x2="4.6" y2="12"/><line x1="19.4" y1="12" x2="22" y2="12"/><line x1="5.2" y1="5.2" x2="7" y2="7"/><line x1="17" y1="17" x2="18.8" y2="18.8"/><line x1="5.2" y1="18.8" x2="7" y2="17"/><line x1="17" y1="7" x2="18.8" y2="5.2"/></g><circle cx="12" cy="12" r="4.2" fill="#c39a3e" stroke="#2c2014" stroke-width="0.7"/>`,
  druid: `<path d="M12 3C18 7 18 17 12 21 6 17 6 7 12 3z" fill="#3f5a35" stroke="#2c2014" stroke-width="0.6"/><path d="M12 5v14" stroke="#2c2014" stroke-width="1"/><path d="M12 9.5 15 7.5M12 13 15 11M12 9.5 9 7.5M12 13 9 11" stroke="#2c2014" stroke-width="0.8"/>`,
  fighter: `<path d="M12 2 13.2 4.6h-2.4z" fill="#2c2014"/><rect x="11" y="4.4" width="2" height="11" fill="#2c2014"/><rect x="7.4" y="15" width="9.2" height="2" rx="1" fill="#c39a3e"/><rect x="11" y="17" width="2" height="3" fill="#2c2014"/><circle cx="12" cy="20.6" r="1.4" fill="#c39a3e"/>`,
  monk: `<rect x="6.5" y="10" width="11" height="8.5" rx="3.2" fill="#2c2014"/><rect x="6.8" y="9" width="2.3" height="4" rx="1.1" fill="#2c2014"/><rect x="9.3" y="8.4" width="2.3" height="4.6" rx="1.1" fill="#2c2014"/><rect x="11.8" y="8.4" width="2.3" height="4.6" rx="1.1" fill="#2c2014"/><rect x="14.3" y="9" width="2.3" height="4" rx="1.1" fill="#2c2014"/><path d="M6.5 12.5c-1.6 0-2.6 1-2.6 2.3s1 2.2 2.6 2.2z" fill="#2c2014"/>`,
  paladin: `<path d="M12 2 20 4.5v6c0 6-8 11-8 11S4 16.5 4 10.5v-6z" fill="#7a1f1f" stroke="#2c2014" stroke-width="0.7"/><path d="M12 7 13.3 10l3.2.2-2.5 2 .9 3.1L12 16.6l-2.8 1.7.9-3.1-2.5-2 3.2-.2z" fill="#c39a3e"/>`,
  ranger: `<path d="M7 3C13 7 13 17 7 21" stroke="#2c2014" stroke-width="2" fill="none"/><line x1="7" y1="3" x2="7" y2="21" stroke="#2c2014" stroke-width="0.8"/><line x1="5" y1="12" x2="19.5" y2="12" stroke="#7a1f1f" stroke-width="1.6"/><path d="M19.5 12 16.3 10v4z" fill="#2c2014"/><path d="M5 12 7.2 10.5v3z" fill="#c39a3e"/>`,
  rogue: `<path d="M12 3 13.3 6.5h-2.6z" fill="#2c2014"/><rect x="11" y="6.2" width="2" height="6.6" fill="#2c2014"/><rect x="8.5" y="12.6" width="7" height="1.8" rx="0.9" fill="#c39a3e"/><rect x="11" y="14.2" width="2" height="3.6" rx="0.6" fill="#7a1f1f"/>`,
  sorcerer: `<path d="M12 2c3 4 5 6 5 10a5 5 0 0 1-10 0c0-2.2 1-3.2 1-3.2 0 1.1 1 2.1 2 2.1-1-3 1-6 2-8.9z" fill="#7a1f1f"/><path d="M12 9.5c1.5 2 2.4 2.9 2.4 4.8a2.4 2.4 0 0 1-4.8 0c0-1.9 1.4-2.8 2.4-4.8z" fill="#c39a3e"/>`,
  warlock: `<path d="M2.5 12C6 6.8 18 6.8 21.5 12 18 17.2 6 17.2 2.5 12z" fill="#f3e6c9" stroke="#2c2014" stroke-width="1"/><circle cx="12" cy="12" r="3.2" fill="#7a1f1f"/><circle cx="12" cy="12" r="1.3" fill="#2c2014"/>`,
  wizard: `<path d="M12 2 17.2 16H6.8z" fill="#7a1f1f" stroke="#2c2014" stroke-width="0.6"/><ellipse cx="12" cy="16" rx="7.6" ry="2" fill="#2c2014"/><path d="M12 8 12.7 9.7l1.8.1-1.4 1.1.5 1.8L12 12.8l-1.6 1 .5-1.8-1.4-1.1 1.8-.1z" fill="#c39a3e"/>`,
};
function MiniIcon({ type, kind, className = "mini-icon" }) {
  const inner = (type === "race" ? RACE_ICONS : CLASS_ICONS)[kind] || "";
  return (
    <span className={className} aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: `<svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">${inner}</svg>` }} />
  );
}

// Shows the user's loaded photo for a race, or the drawn emblem as a fallback.
function RacePortrait({ kind, img, artClass = "race-portrait-art" }) {
  if (img) return <img className="race-photo" src={img} alt="" />;
  return <MiniIcon type="race" kind={kind} className={artClass} />;
}

// File picker that loads a local image into a race slot for this session.
function RaceUpload({ kind, img, setRaceImage, label }) {
  const ref = useRef(null);
  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setRaceImage(kind, r.result);
    r.readAsDataURL(f);
    e.target.value = "";
  };
  return (
    <span className="img-controls">
      <button className="img-btn" onClick={() => ref.current && ref.current.click()}>
        {img ? "Change photo" : (label || "＋ Add photo")}
      </button>
      {img && <button className="img-btn clear" title="Remove photo" onClick={() => setRaceImage(kind, null)}>✕</button>}
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={onFile} />
    </span>
  );
}

function Learn({ onBack, onStart, raceImages = {}, setRaceImage }) {
  const lessons = [
    { n: 1, art: "race", t: "Choose a Race", d: "Your race (or species) is your character's heritage. It sets your speed, size, special traits, and gives bonuses to ability scores. Want a tank? Dwarves and half-orcs add Constitution and Strength. Want to be sneaky or a caster? Elves boost Dexterity, gnomes boost Intelligence.",
      opts: Object.values(RACES).map((r) => r.name) },
    { n: 2, art: "class", t: "Choose a Class", d: "Your class is what you DO in the party — fight, sneak, heal, or cast spells. It decides your hit points (toughness), what you're proficient with, and your core abilities. Fighters and barbarians are the friendliest starting classes; wizards and druids have the most to track.",
      opts: Object.values(CLASSES).map((c) => c.name) },
    { n: 3, art: "dice", t: "Set Ability Scores", d: "Six numbers describe your body and mind: Strength, Dexterity, Constitution, Intelligence, Wisdom, and Charisma. Each becomes a modifier (the +/- you add to dice rolls). Decide them with the Standard Array (a fixed, balanced set), Point Buy (spend points to customize), or by rolling dice and placing the results where you like.",
      opts: ["Standard Array (15, 14, 13, 12, 10, 8)", "Point Buy (27 points)", "Roll 4d6, drop lowest"] },
    { n: 4, art: "background", t: "Pick a Background", d: "Your background is who you were before adventuring — a soldier, a criminal, a scholar. It grants two skill proficiencies and some roleplay flavor, and it's the easiest place to add personality.",
      opts: Object.values(BACKGROUNDS).map((b) => b.name) },
    { n: 5, art: "skills", t: "Choose Skills", d: "Skills are the things you're good at (Stealth, Perception, Persuasion…). Your class lets you pick a few, and your background gives two for free. Each skill is tied to an ability score, so a high score makes that skill better.",
      opts: ["Class grants 2–4 skill choices", "Background grants 2 fixed skills", "Proficiency adds +2 at level 1"] },
    { n: 6, art: "equipment", t: "Gather Equipment", d: "Every hero starts with gear — armor, weapons, tools, and a pack of supplies. A sensible starter kit is suggested from your class and background, and you can add or swap anything you like.",
      opts: ["Class starter kit", "Background gear & gold", "Add your own items"] },
    { n: 7, art: "finish", t: "Finishing Touches", d: "Name your hero, pick an alignment (their moral compass), and the sheet calculates the rest: hit points, armor class, initiative, saving throws, and passive perception. Then print it and you're ready to roll!",
      opts: ["Name & alignment", "Auto-calculated stats", "Print your sheet"] },
  ];
  return (
    <div className="page fade-in">
      <button className="back-link no-print" onClick={onBack}>‹ Back</button>
      <div className="hero compact">
        <div className="hero-rule">◈ ◈ ◈</div>
        <h1>How a Character is Made</h1>
        <p className="hero-lead">Seven steps turn an idea into a hero. Skim this, then build one — the creator walks you through the same steps with every option explained.</p>
      </div>
      <div className="lesson-list">
        {lessons.map((l) => (
          <div className="lesson" key={l.n}>
            <div className="lesson-art">
              <LessonArt kind={l.art} />
              <span className="lesson-badge">{l.n}</span>
            </div>
            <div className="lesson-body">
              <h3>{l.t}</h3>
              <p>{l.d}</p>
              {l.art === "race" ? (
                <div className="race-gallery">
                  {Object.entries(RACES).map(([key, r]) => (
                    <div className="race-portrait" key={key}>
                      <div className={"race-portrait-frame" + (raceImages[key] ? " has-photo" : "")}>
                        <RacePortrait kind={key} img={raceImages[key]} />
                      </div>
                      <div className="race-portrait-name">{r.name}</div>
                      <div className="race-portrait-bonus">
                        {Object.entries(r.bonus).map(([ab, v]) => `${ABILITIES.find((a) => a.key === ab).short} +${v}`).join("  ")}
                        {r.choose2 ? "  +1×2" : ""}
                      </div>
                      {setRaceImage && <RaceUpload kind={key} img={raceImages[key]} setRaceImage={setRaceImage} />}
                    </div>
                  ))}
                </div>
              ) : l.art === "class" ? (
                <div className="class-grid">
                  {Object.entries(CLASSES).map(([key, v]) => (
                    <div className="class-card" key={key}>
                      <div className="class-card-head">
                        <span className="class-icon-frame">
                          <MiniIcon type="class" kind={key} className="class-icon-art" />
                        </span>
                        <div>
                          <div className="class-card-name">{v.name}</div>
                          <div className="class-card-tags">d{v.hd} hit die · {v.primary.map((p) => p.toUpperCase()).join("/")}</div>
                        </div>
                      </div>
                      <div className="class-card-desc">{v.blurb}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="chips">
                  {l.opts.map((o) => <span className="chip" key={o}>{o}</span>)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="center-cta">
        <button className="btn btn-primary" onClick={onStart}>I'm ready — Create a Character ›</button>
      </div>
    </div>
  );
}

// Hand-drawn SVG emblems for the learn section (no external images; copyright-clean).
function LessonArt({ kind }) {
  const common = { width: "100%", height: "100%", viewBox: "0 0 100 100", xmlns: "http://www.w3.org/2000/svg" };
  const ox = "#7a1f1f", ox2 = "#9a2b2b", ink = "#2c2014", gold = "#c39a3e", parch = "#f3e6c9", green = "#3f5a35";
  if (kind === "race") {
    return (
      <svg {...common}>
        <circle cx="50" cy="50" r="42" fill={parch} stroke={gold} strokeWidth="3" />
        <path d="M50 22c-13 0-20 10-20 24 0 6 2 11 5 15h30c3-4 5-9 5-15 0-14-7-24-20-24z" fill={ink} />
        <circle cx="50" cy="44" r="11" fill={parch} />
        <path d="M30 72c4-9 12-12 20-12s16 3 20 12z" fill={ox} />
        <path d="M50 22c5 0 9 2 12 5-3-1-7-1-12-1s-9 0-12 1c3-3 7-5 12-5z" fill={ox2} />
      </svg>
    );
  }
  if (kind === "class") {
    return (
      <svg {...common}>
        <path d="M50 14l28 9v26c0 22-28 35-28 35S22 71 22 49V23z" fill={green} stroke={ink} strokeWidth="3" />
        <path d="M50 14l28 9v26c0 22-28 35-28 35z" fill="#34492c" />
        <rect x="47" y="30" width="6" height="34" rx="2" fill={parch} />
        <rect x="38" y="40" width="24" height="6" rx="2" fill={parch} />
        <path d="M50 26l4 6h-8z" fill={gold} />
        <circle cx="50" cy="68" r="3.5" fill={gold} />
      </svg>
    );
  }
  if (kind === "dice") {
    return (
      <svg {...common}>
        <polygon points="50,10 86,31 86,69 50,90 14,69 14,31" fill={ox} stroke={ink} strokeWidth="3" />
        <polygon points="50,10 86,31 50,48 14,31" fill={ox2} />
        <polygon points="86,31 86,69 50,48" fill="#641818" />
        <polygon points="14,31 14,69 50,48" fill="#8a2424" />
        <polygon points="50,48 86,69 50,90 14,69" fill="#711b1b" />
        <text x="50" y="60" textAnchor="middle" fontSize="22" fontWeight="700" fill={parch} fontFamily="Cinzel, serif">20</text>
      </svg>
    );
  }
  if (kind === "background") {
    return (
      <svg {...common}>
        <path d="M50 26C40 20 26 20 18 24v50c8-4 22-4 32 2 10-6 24-6 32-2V24c-8-4-22-4-32 2z" fill={parch} stroke={ink} strokeWidth="3" />
        <line x1="50" y1="26" x2="50" y2="78" stroke={ink} strokeWidth="2.5" />
        {[34, 42, 50].map((y) => <line key={"l" + y} x1="24" y1={y} x2="44" y2={y - 2} stroke={gold} strokeWidth="2" />)}
        {[34, 42, 50].map((y) => <line key={"r" + y} x1="56" y1={y - 2} x2="76" y2={y} stroke={gold} strokeWidth="2" />)}
      </svg>
    );
  }
  if (kind === "skills") {
    return (
      <svg {...common}>
        <circle cx="50" cy="50" r="38" fill="none" stroke={gold} strokeWidth="4" />
        <circle cx="50" cy="50" r="25" fill="none" stroke={ox2} strokeWidth="4" />
        <circle cx="50" cy="50" r="9" fill={ox} />
        <path d="M76 24L52 48" stroke={ink} strokeWidth="4" strokeLinecap="round" />
        <path d="M76 24l2 12-12-2z" fill={green} />
        <path d="M52 48l-6 2 2-6z" fill={gold} />
      </svg>
    );
  }
  if (kind === "equipment") {
    return (
      <svg {...common}>
        <rect x="20" y="42" width="60" height="36" rx="5" fill={ox} stroke={ink} strokeWidth="3" />
        <path d="M20 47c0-9 7-15 30-15s30 6 30 15v6H20z" fill={ox2} stroke={ink} strokeWidth="3" />
        <rect x="18" y="50" width="64" height="8" rx="2" fill={gold} />
        <rect x="45" y="54" width="10" height="16" rx="2" fill={gold} stroke={ink} strokeWidth="2" />
        <circle cx="50" cy="61" r="2.5" fill={ink} />
      </svg>
    );
  }
  // finish — quill + ink
  return (
    <svg {...common}>
      <path d="M78 20C58 26 40 44 32 66l8 4C50 50 64 34 80 26z" fill={parch} stroke={ink} strokeWidth="3" />
      <path d="M78 20c-6 8-12 14-20 20 4 1 8 0 11-2 5-5 8-11 9-18z" fill={gold} />
      <path d="M32 66l-6 14 14-6z" fill={ink} />
      <ellipse cx="36" cy="80" rx="14" ry="5" fill={ox} stroke={ink} strokeWidth="2" />
      <path d="M28 78c0-4 4-6 8-6s8 2 8 6" fill="#641818" />
    </svg>
  );
}

/* ============================ BUILDER ============================ */

function Builder({ c, update, step, setStep, onHome, onFinish, raceImages, setRaceImage }) {
  const steps = [
    { key: "identity", label: "Identity" },
    { key: "race", label: "Race" },
    { key: "class", label: "Class" },
    { key: "abilities", label: "Abilities" },
    { key: "background", label: "Background" },
    { key: "skills", label: "Skills" },
    { key: "equipment", label: "Equipment" },
    ...(isCaster(c.class) ? [{ key: "spells", label: "Spells" }] : []),
    { key: "review", label: "Review" },
  ];
  const safeStep = Math.min(step, steps.length - 1);
  const cur = steps[safeStep];
  const num = safeStep + 1;
  const go = (n) => setStep(Math.max(0, Math.min(steps.length - 1, n)));

  // If the class changes and removes/adds the Spells step, keep the index in range.
  useEffect(() => { if (step > steps.length - 1) setStep(steps.length - 1); }, [steps.length]); // eslint-disable-line

  return (
    <div className="page fade-in">
      <div className="builder-top no-print">
        <button className="back-link" onClick={onHome}>‹ Party</button>
        <div className="stepper">
          {steps.map((s, i) => (
            <button key={s.key} className={"step-dot" + (i === safeStep ? " active" : "") + (i < safeStep ? " done" : "")}
              onClick={() => go(i)} title={s.label}>
              <span>{i + 1}</span>
              <em>{s.label}</em>
            </button>
          ))}
        </div>
      </div>

      <div className="builder-stage">
        {cur.key === "identity" && <StepIdentity c={c} update={update} num={num} />}
        {cur.key === "race" && <StepRace c={c} update={update} raceImages={raceImages} setRaceImage={setRaceImage} num={num} />}
        {cur.key === "class" && <StepClass c={c} update={update} num={num} />}
        {cur.key === "abilities" && <StepAbilities c={c} update={update} num={num} />}
        {cur.key === "background" && <StepBackground c={c} update={update} num={num} />}
        {cur.key === "skills" && <StepSkills c={c} update={update} num={num} />}
        {cur.key === "equipment" && <StepEquipment c={c} update={update} num={num} />}
        {cur.key === "spells" && <StepSpells c={c} update={update} num={num} />}
        {cur.key === "review" && <StepReview c={c} num={num} />}
      </div>

      <div className="builder-nav no-print">
        <button className="btn btn-ghost" disabled={safeStep === 0} onClick={() => go(safeStep - 1)}>‹ Back</button>
        {safeStep < steps.length - 1 ? (
          <button className="btn btn-primary" onClick={() => go(safeStep + 1)}>Next ›</button>
        ) : (
          <button className="btn btn-primary" onClick={onFinish}>View Character Sheet ✓</button>
        )}
      </div>
    </div>
  );
}

function StepIdentity({ c, update, num }) {
  return (
    <div className="step">
      <StepHead n={num} title="Who is your hero?" sub="You can leave these blank for now and fill them in later." />
      <div className="field">
        <label>Character Name</label>
        <input value={c.name} placeholder="e.g. Thorin Quickblade"
          onChange={(e) => update({ name: e.target.value })} />
      </div>
      <div className="field">
        <label>Player Name <span className="hint">(that's you!)</span></label>
        <input value={c.player} placeholder="Your name"
          onChange={(e) => update({ player: e.target.value })} />
      </div>
      <div className="field">
        <label>Alignment <span className="hint">(your moral compass — pick later if unsure)</span></label>
        <select value={c.alignment} onChange={(e) => update({ alignment: e.target.value })}>
          <option value="">— Choose —</option>
          {ALIGNMENTS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
    </div>
  );
}

function StepRace({ c, update, raceImages = {}, setRaceImage, num }) {
  const race = RACES[c.race];
  const pick = (key) => update({ race: key, subrace: "", halfElf: ["", ""] });
  return (
    <div className="step">
      <StepHead n={num} title="Choose a Race" sub="Your heritage — sets speed, traits, and ability bonuses." />
      <div className="option-grid">
        {Object.entries(RACES).map(([k, r]) => (
          <button key={k} className={"option option-race" + (c.race === k ? " selected" : "")} onClick={() => pick(k)}>
            <div className={"race-thumb" + (raceImages[k] ? " has-photo" : "")}>
              <RacePortrait kind={k} img={raceImages[k]} artClass="race-thumb-art" />
            </div>
            <div className="race-thumb-body">
              <div className="option-name">{r.name}</div>
              <div className="option-tags">
                {Object.entries(r.bonus).map(([ab, v]) => (
                  <span className="tag" key={ab}>{ABILITIES.find((a) => a.key === ab).short} +{v}</span>
                ))}
                {r.choose2 && <span className="tag">+1 ×2 choice</span>}
              </div>
              <div className="option-blurb">{r.blurb}</div>
            </div>
          </button>
        ))}
      </div>

      {setRaceImage && (
        <p className="tiny-note">
          Want pictures here? Use <b>Learn the Basics → Choose a Race</b> to load a photo for each race,
          {race ? <> or set one for {race.name} now: <RaceUpload kind={c.race} img={raceImages[c.race]} setRaceImage={setRaceImage} /></> : " then come back."}
        </p>
      )}

      {race && race.subraces && (
        <div className="subpanel">
          <div className="subpanel-label">Choose a {race.name} subrace:</div>
          <div className="pill-row">
            {Object.entries(race.subraces).map(([k, sr]) => (
              <button key={k} className={"pill" + (c.subrace === k ? " on" : "")} onClick={() => update({ subrace: k })}>
                {sr.name}
                <em>{Object.entries(sr.bonus || {}).map(([a, v]) => `${ABILITIES.find((x) => x.key === a).short}+${v}`).join(" ")}</em>
              </button>
            ))}
          </div>
        </div>
      )}

      {race && race.choose2 && (
        <div className="subpanel">
          <div className="subpanel-label">Half-Elf: pick two abilities to gain +1 each:</div>
          <div className="pill-row">
            {[0, 1].map((i) => (
              <select key={i} className="he-select" value={c.halfElf[i] || ""}
                onChange={(e) => {
                  const next = [...c.halfElf]; next[i] = e.target.value; update({ halfElf: next });
                }}>
                <option value="">— ability {i + 1} —</option>
                {ABILITIES.filter((a) => a.key !== "cha").map((a) => (
                  <option key={a.key} value={a.key} disabled={c.halfElf[1 - i] === a.key}>{a.name}</option>
                ))}
              </select>
            ))}
          </div>
        </div>
      )}

      {race && (
        <div className="info-box">
          <div className="info-title">{race.name} traits</div>
          <ul>{race.traits.map((t) => <li key={t}>{t}</li>)}
            {race.subraces && c.subrace && race.subraces[c.subrace].traits.map((t) => <li key={t}>{t}</li>)}
          </ul>
          <div className="info-foot">Speed {getSpeed(c)} ft</div>
        </div>
      )}
    </div>
  );
}

function StepClass({ c, update, num }) {
  return (
    <div className="step">
      <StepHead n={num} title="Choose a Class" sub="Your role in the party. Hit Die = how tough you are." />
      <div className="option-grid">
        {Object.entries(CLASSES).map(([k, cl]) => (
          <button key={k} className={"option" + (c.class === k ? " selected" : "")}
            onClick={() => update({ class: k, classSkills: [] })}>
            <div className="option-name">{cl.name}</div>
            <div className="option-tags">
              <span className="tag">d{cl.hd} HP</span>
              <span className="tag">{cl.primary.map((p) => p.toUpperCase()).join("/")}</span>
            </div>
            <div className="option-blurb">{cl.blurb}</div>
          </button>
        ))}
      </div>
      {CLASSES[c.class] && (
        <div className="info-box">
          <div className="info-title">{CLASSES[c.class].name} at a glance</div>
          <ul>
            <li>Hit Die: d{CLASSES[c.class].hd} — your starting HP is {CLASSES[c.class].hd} + your Constitution modifier.</li>
            <li>Saving throw proficiencies: {CLASSES[c.class].saves.map((s) => ABILITIES.find((a) => a.key === s).name).join(" & ")}.</li>
            <li>You'll choose {CLASSES[c.class].skillCount} skill{CLASSES[c.class].skillCount > 1 ? "s" : ""} in step 6.</li>
          </ul>
        </div>
      )}
    </div>
  );
}

function StepAbilities({ c, update, num }) {
  const method = c.scoreMethod;
  const blank = { str: null, dex: null, con: null, int: null, wis: null, cha: null };
  const setMethod = (m) => {
    if (m === "array") update({ scoreMethod: m, pool: [...STANDARD_ARRAY], baseScores: blank });
    else if (m === "custom") update({ scoreMethod: m, pool: (c.pool && c.pool.length === 6 ? c.pool : [15, 14, 13, 12, 10, 8]), baseScores: blank });
    else if (m === "pointbuy") update({ scoreMethod: m, baseScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 } });
    else update({ scoreMethod: m, pool: [], baseScores: blank }); // roll
  };

  const setCustomVal = (i, raw) => {
    const next = [...(c.pool || [15, 14, 13, 12, 10, 8])];
    if (raw === "") next[i] = "";
    else { const n = Math.max(1, Math.min(30, parseInt(raw, 10))); next[i] = Number.isNaN(n) ? "" : n; }
    update({ pool: next, baseScores: blank });
  };
  const customPool = (c.pool || []).map((v) => Number(v)).filter((n) => Number.isFinite(n) && n > 0);

  const pbSpent = method === "pointbuy"
    ? ABILITIES.reduce((sum, a) => sum + (POINT_BUY_COST[c.baseScores[a.key]] ?? 0), 0) : 0;
  const pbLeft = 27 - pbSpent;

  const rollPoolReady = method === "roll" && (c.pool || []).length >= 6;

  return (
    <div className="step">
      <StepHead n={num} title="Set Ability Scores" sub="Higher is better. The number in (parentheses) is the modifier you'll add to rolls." />
      <div className="method-row">
        {[["array", "Standard Array", "Balanced & fast"], ["custom", "Custom Array", "Your own six"], ["pointbuy", "Point Buy", "Customize, 27 pts"], ["roll", "Roll Dice", "Roll then place"]].map(([m, t, s]) => (
          <button key={m} className={"method" + (method === m ? " on" : "")} onClick={() => setMethod(m)}>
            <b>{t}</b><span>{s}</span>
          </button>
        ))}
      </div>

      {method === "pointbuy" && (
        <div className={"points-left" + (pbLeft < 0 ? " over" : "")}>
          Points remaining: <b>{pbLeft}</b> / 27 {pbLeft < 0 && "— too many!"}
        </div>
      )}
      {method === "array" && (
        <div className="pool-show center">Assign these to your abilities: <b>{STANDARD_ARRAY.join(", ")}</b></div>
      )}
      {method === "custom" && (
        <div className="custom-array">
          <div className="custom-array-label">Enter your six numbers (your DM's homebrew array), then place them below:</div>
          <div className="custom-inputs">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <input key={i} type="number" min="1" max="30" className="custom-num"
                value={c.pool && c.pool[i] != null ? c.pool[i] : ""}
                onChange={(e) => setCustomVal(i, e.target.value)} />
            ))}
          </div>
          <div className="assign-hint">{customPool.length < 6 ? `Fill in all six numbers (${customPool.length}/6).` : "Now place each number wherever you like ↓"}</div>
        </div>
      )}

      {method === "roll" && !rollPoolReady && <DiceRoller c={c} update={update} />}

      {method === "roll" && rollPoolReady && (
        <div className="pool-show center">
          Your rolled scores: <b>{[...c.pool].sort((a, b) => b - a).join(", ")}</b>
          <button className="linkbtn" onClick={() => setMethod("roll")}> · reroll all six</button>
          <div className="assign-hint">Now place each number wherever you like ↓</div>
        </div>
      )}

      {method === "pointbuy" && <PointBuyGrid c={c} update={update} pbLeft={pbLeft} />}
      {method === "array" && <AssignGrid c={c} update={update} pool={STANDARD_ARRAY} />}
      {method === "custom" && <AssignGrid c={c} update={update} pool={customPool} />}
      {method === "roll" && rollPoolReady && <AssignGrid c={c} update={update} pool={c.pool} />}

      {(method === "array" || method === "custom" || rollPoolReady || method === "pointbuy") && (
        <p className="tiny-note">Tip: put your highest score in your class's main ability —
          {CLASSES[c.class] ? " " + CLASSES[c.class].primary.map((p) => ABILITIES.find((a) => a.key === p).name).join(" or ") + " for a " + CLASSES[c.class].name + "." : " choose a class first to see which one."}</p>
      )}
    </div>
  );
}

// Shared assignment grid: drop each pooled number onto an ability of your choice.
function AssignGrid({ c, update, pool }) {
  const availFor = (key) => {
    const otherUsed = ABILITIES.filter((a) => a.key !== key).map((a) => c.baseScores[a.key]);
    const counts = {};
    pool.forEach((v) => (counts[v] = (counts[v] || 0) + 1));
    otherUsed.forEach((v) => { if (v != null) counts[v] = (counts[v] || 0) - 1; });
    return Object.entries(counts).filter(([, n]) => n > 0).map(([v]) => Number(v)).sort((a, b) => b - a);
  };
  return (
    <div className="ability-grid">
      {ABILITIES.map((a) => {
        const base = c.baseScores[a.key];
        const total = base != null ? base + racialBonus(c)[a.key] : null;
        return (
          <div className="ability-card" key={a.key}>
            <div className="ability-head">
              <span className="ability-name">{a.name}</span>
              <span className="ability-short">{a.short}</span>
            </div>
            <select className="assign-select" value={base ?? ""}
              onChange={(e) => update({ baseScores: { ...c.baseScores, [a.key]: e.target.value === "" ? null : Number(e.target.value) } })}>
              <option value="">—</option>
              {availFor(a.key).map((v, i) => <option key={a.key + v + i} value={v}>{v}</option>)}
            </select>
            <div className="ability-foot">
              <div className="af-block"><span className="af-label">Base</span><span className="af-num">{base ?? "—"}</span></div>
              <div className="af-arrow">→</div>
              <div className="af-block total">
                <span className="af-label">Total</span>
                <span className="af-num big">{total ?? "—"}</span>
                <span className="af-mod">{total != null ? `(${fmt(mod(total))})` : ""}</span>
              </div>
            </div>
            {racialBonus(c)[a.key] > 0 && <div className="racial-note">+{racialBonus(c)[a.key]} from race</div>}
          </div>
        );
      })}
    </div>
  );
}

function PointBuyGrid({ c, update, pbLeft }) {
  return (
    <div className="ability-grid">
      {ABILITIES.map((a) => {
        const base = c.baseScores[a.key];
        const total = base != null ? base + racialBonus(c)[a.key] : null;
        return (
          <div className="ability-card" key={a.key}>
            <div className="ability-head">
              <span className="ability-name">{a.name}</span>
              <span className="ability-short">{a.short}</span>
            </div>
            <div className="pb-controls">
              <button className="step-btn" disabled={base <= 8}
                onClick={() => update({ baseScores: { ...c.baseScores, [a.key]: base - 1 } })}>−</button>
              <span className="pb-val">{base}</span>
              <button className="step-btn" disabled={base >= 15 || pbLeft <= 0}
                onClick={() => update({ baseScores: { ...c.baseScores, [a.key]: base + 1 } })}>＋</button>
            </div>
            <div className="ability-foot">
              <div className="af-block"><span className="af-label">Base</span><span className="af-num">{base ?? "—"}</span></div>
              <div className="af-arrow">→</div>
              <div className="af-block total">
                <span className="af-label">Total</span>
                <span className="af-num big">{total ?? "—"}</span>
                <span className="af-mod">{total != null ? `(${fmt(mod(total))})` : ""}</span>
              </div>
            </div>
            {racialBonus(c)[a.key] > 0 && <div className="racial-note">+{racialBonus(c)[a.key]} from race</div>}
          </div>
        );
      })}
    </div>
  );
}

const PIP_MAP = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
function Die({ value, dropped, rolling }) {
  const pips = PIP_MAP[value] || [];
  return (
    <div className={"die" + (dropped ? " dropped" : "") + (rolling ? " spin" : "")}>
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} className={"pip" + (pips.includes(i) ? " on" : "")} />
      ))}
    </div>
  );
}

function DiceRoller({ c, update }) {
  const pool = c.pool || [];
  const remaining = 6 - pool.length;

  const [dice, setDice] = useState([6, 6, 6, 6]);
  const [phase, setPhase] = useState("idle"); // idle | rolling | settled
  const [dropIdx, setDropIdx] = useState(-1);
  const [lastTotal, setLastTotal] = useState(null);
  const ivRef = useRef(null);

  useEffect(() => () => clearInterval(ivRef.current), []);

  const doRoll = () => {
    if (remaining <= 0) return;
    clearInterval(ivRef.current);
    setPhase("rolling"); setDropIdx(-1); setLastTotal(null);
    let ticks = 0;
    ivRef.current = setInterval(() => {
      setDice([0, 0, 0, 0].map(() => 1 + Math.floor(Math.random() * 6)));
      ticks++;
      if (ticks >= 14) {
        clearInterval(ivRef.current);
        const fd = [0, 0, 0, 0].map(() => 1 + Math.floor(Math.random() * 6));
        const di = fd.indexOf(Math.min(...fd));
        const total = fd.reduce((s, v, i) => (i === di ? s : s + v), 0);
        setDice(fd); setDropIdx(di); setPhase("settled"); setLastTotal(total);
        update({ pool: [...pool, total] }); // banked into the pool
      }
    }, 60);
  };

  const rollRest = () => {
    clearInterval(ivRef.current);
    const more = [];
    for (let i = 0; i < remaining; i++) more.push(roll4d6());
    update({ pool: [...pool, ...more] });
    setPhase("idle");
  };

  return (
    <div className="dice-arena">
      <div className="roller-card">
        <div className="roller-prompt">
          Roll your six scores
          <span className="roller-progress">{pool.length} / 6 rolled</span>
        </div>
        <div className="dice-tray">
          {dice.map((v, i) => (
            <Die key={i} value={v} rolling={phase === "rolling"} dropped={phase === "settled" && i === dropIdx} />
          ))}
        </div>
        {phase === "settled" && lastTotal != null && (
          <div className="roll-result">
            Drop the lowest (<s>{dice[dropIdx]}</s>) → banked <b>{lastTotal}</b>
          </div>
        )}
        <div className="roller-actions">
          <button className="btn btn-primary" disabled={phase === "rolling" || remaining <= 0} onClick={doRoll}>
            {phase === "rolling" ? "Rolling…" : `🎲 Roll 4d6 · ${remaining} left`}
          </button>
          {remaining > 0 && pool.length > 0 && (
            <button className="btn btn-ghost" disabled={phase === "rolling"} onClick={rollRest}>Roll the rest ⏩</button>
          )}
        </div>
      </div>

      {pool.length > 0 && (
        <div className="pool-chips">
          {[...pool].sort((a, b) => b - a).map((v, i) => <span className="pool-chip" key={i}>{v}</span>)}
        </div>
      )}
      <div className="roll-tip">Roll six numbers (4d6, drop the lowest each time). Once all six are in, you decide which ability each one goes to — nothing is locked to a stat.</div>
    </div>
  );
}

function StepBackground({ c, update, num }) {
  return (
    <div className="step">
      <StepHead n={num} title="Pick a Background" sub="Who you were before adventuring. Grants two free skills." />
      <div className="option-grid">
        {Object.entries(BACKGROUNDS).map(([k, b]) => (
          <button key={k} className={"option" + (c.background === k ? " selected" : "")}
            onClick={() => update({ background: k })}>
            <div className="option-name">{b.name}</div>
            <div className="option-tags">
              {b.skills.map((s) => <span className="tag" key={s}>{SKILL_BY_KEY[s].name}</span>)}
            </div>
            <div className="option-blurb">{b.blurb}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepSkills({ c, update, num }) {
  const cls = CLASSES[c.class];
  const bg = BACKGROUNDS[c.background];
  if (!cls) return <div className="step"><StepHead n={num} title="Choose Skills" sub="" /><div className="empty">Pick a class first (step 3).</div></div>;
  const bgSkills = (bg && bg.skills) || [];
  const max = cls.skillCount;
  const toggle = (key) => {
    if (bgSkills.includes(key)) return; // free from background, locked
    const has = c.classSkills.includes(key);
    if (has) update({ classSkills: c.classSkills.filter((s) => s !== key) });
    else if (c.classSkills.length < max) update({ classSkills: [...c.classSkills, key] });
  };
  return (
    <div className="step">
      <StepHead n={num} title="Choose Skills"
        sub={`Pick ${max} from your ${cls.name} list. Background skills are added free (locked).`} />
      <div className={"skill-counter" + (c.classSkills.length === max ? " done" : "")}>
        Chosen {c.classSkills.length} / {max}
      </div>
      <div className="skill-grid">
        {cls.skills.map((key) => {
          const sk = SKILL_BY_KEY[key];
          const free = bgSkills.includes(key);
          const chosen = c.classSkills.includes(key) || free;
          const abil = ABILITIES.find((a) => a.key === sk.ability);
          return (
            <button key={key} className={"skill" + (chosen ? " on" : "") + (free ? " free" : "")}
              disabled={free} onClick={() => toggle(key)}>
              <span className="skill-name">{sk.name}</span>
              <span className="skill-abil">{abil.short}</span>
              {free && <span className="skill-free">free · background</span>}
            </button>
          );
        })}
      </div>
      {bg && bgSkills.some((s) => !cls.skills.includes(s)) && (
        <div className="info-box">
          <div className="info-title">Also from your {bg.name} background</div>
          <div className="chips">
            {bgSkills.filter((s) => !cls.skills.includes(s)).map((s) => (
              <span className="chip" key={s}>{SKILL_BY_KEY[s].name} (free)</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StepEquipment({ c, update, num }) {
  const [draft, setDraft] = useState("");
  const cls = CLASSES[c.class];
  const items = c.equipment || [];

  // Auto-load the class+background starter kit the first time this step is opened.
  useEffect(() => {
    if (!c.equipmentLoaded && c.class) {
      update({ equipment: defaultEquipment(c), equipmentLoaded: true });
    }
  }, [c.class]); // eslint-disable-line

  const addItem = () => {
    const v = draft.trim();
    if (!v) return;
    update({ equipment: [...items, v] });
    setDraft("");
  };
  const removeItem = (i) => update({ equipment: items.filter((_, idx) => idx !== i) });
  const loadKit = () => update({ equipment: defaultEquipment(c), equipmentLoaded: true });

  return (
    <div className="step">
      <StepHead n={num} title="Starting Equipment"
        sub="A sensible starter kit is filled in from your class and background. Add or remove anything you like." />
      {!cls && <div className="warn">Pick a class first (step 3) to load a starter kit.</div>}

      <div className="equip-wrap">
        <div className="equip-add">
          <input value={draft} placeholder="Add an item (e.g. Healer's kit, 50 gp, Torches ×5)"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addItem(); }} />
          <button className="btn btn-primary small" onClick={addItem}>＋ Add</button>
        </div>

        {items.length === 0 ? (
          <div className="empty">No gear yet. {cls && <button className="linkbtn" onClick={loadKit}>Load the {cls.name} starter kit</button>}</div>
        ) : (
          <ul className="equip-list">
            {items.map((it, i) => (
              <li key={i} className="equip-item">
                <span className="equip-bullet">◆</span>
                <span className="equip-text">{it}</span>
                <button className="equip-x" title="Remove" onClick={() => removeItem(i)}>✕</button>
              </li>
            ))}
          </ul>
        )}

        {cls && (
          <button className="linkbtn reload" onClick={loadKit}>↺ Reset to {cls.name} + background starter kit</button>
        )}
      </div>

      <WeaponEditor c={c} update={update} />
    </div>
  );
}

function WeaponEditor({ c, update }) {
  const auto = deriveWeapons(c);
  const custom = c.weapons || [];
  const rows = [...auto, ...custom];
  const [name, setName] = useState("");
  const [ability, setAbility] = useState("str");
  const [dice, setDice] = useState("1d8");

  const add = () => {
    const n = name.trim();
    if (!n) return;
    update({ weapons: [...custom, { id: uid(), name: n, ability, dice }] });
    setName("");
  };
  const remove = (id) => update({ weapons: custom.filter((w) => w.id !== id) });

  return (
    <div className="equip-wrap weapons-wrap">
      <div className="subhead">⚔ Attacks</div>
      <p className="tiny-note left">These are detected automatically from the weapons in your gear above — attack and damage bonuses are figured for you (finesse weapons use whichever of Strength/Dexterity is higher). Add a custom attack only if something's missing.</p>
      {rows.length > 0 ? (
        <table className="weapon-table">
          <thead><tr><th>Weapon</th><th>Attack</th><th>Damage</th><th></th></tr></thead>
          <tbody>
            {rows.map((w, i) => {
              const m = mod(finalScore(c, w.ability));
              return (
                <tr key={w.id || i}>
                  <td>{w.name} <span className="w-tag">{w.ability.toUpperCase()}{w.auto ? " · from gear" : ""}</span></td>
                  <td className="w-num">{fmt(m + PROF_BONUS)}</td>
                  <td className="w-num">{w.dice} {fmt(m)}</td>
                  <td>{!w.auto && <button className="equip-x" title="Remove" onClick={() => remove(w.id)}>✕</button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="empty">No weapons in your gear yet — add a weapon to your equipment above and it'll appear here automatically.</div>
      )}
      <div className="weapon-add">
        <input className="w-name" value={name} placeholder="Custom attack (e.g. Unarmed strike)"
          onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); }} />
        <select value={ability} onChange={(e) => setAbility(e.target.value)} className="w-ability">
          <option value="str">STR</option>
          <option value="dex">DEX</option>
        </select>
        <select value={dice} onChange={(e) => setDice(e.target.value)} className="w-dice">
          {WEAPON_DICE.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <button className="btn btn-primary small" onClick={add}>＋ Add custom</button>
      </div>
    </div>
  );
}

function StepSpells({ c, update, num }) {
  const cls = CLASSES[c.class];
  if (!isCaster(c.class)) {
    return (
      <div className="step">
        <StepHead n={num} title="Spells" sub="" />
        <div className="empty">
          {cls ? `The ${cls.name} doesn't cast spells at low levels — nothing to pick here.` : "Pick a class first (step 3)."}
          <div className="tiny-note" style={{ marginTop: 8 }}>Just press <b>Next</b> to continue.</div>
        </div>
      </div>
    );
  }
  const abilKey = CASTERS[c.class];
  const abil = ABILITIES.find((a) => a.key === abilKey);
  const abilMod = mod(finalScore(c, abilKey));
  const saveDC = 8 + PROF_BONUS + abilMod;
  const atk = PROF_BONUS + abilMod;
  const chosen = c.spells || [];
  const available = SPELLS.filter((s) => s.classes.includes(c.class));
  const toggle = (name) => {
    update({ spells: chosen.includes(name) ? chosen.filter((s) => s !== name) : [...chosen, name] });
  };

  return (
    <div className="step">
      <StepHead n={num} title="Choose Spells" sub={`You're level 1, so you can take cantrips and 1st-level spells for your ${cls.name}. Your DM sets exactly how many — pick the ones that excite you.`} />
      <div className="spell-meta">
        <div className="sm-block"><span>Casting Ability</span><b>{abil.name}</b></div>
        <div className="sm-block"><span>Spell Save DC</span><b>{saveDC}</b></div>
        <div className="sm-block"><span>Spell Attack</span><b>{fmt(atk)}</b></div>
        <div className="sm-block"><span>Chosen</span><b>{chosen.length}</b></div>
      </div>

      {[0, 1].map((lvl) => {
        const list = available.filter((s) => s.level === lvl);
        if (list.length === 0) return null;
        return (
          <div className="spell-group" key={lvl}>
            <div className="spell-group-title">{SPELL_LEVEL_NAMES[lvl]}</div>
            <div className="spell-grid">
              {list.map((s) => (
                <button key={s.name} className={"spell" + (chosen.includes(s.name) ? " on" : "")} onClick={() => toggle(s.name)}>
                  <span className="spell-check">{chosen.includes(s.name) ? "✓" : "+"}</span>
                  <span className="spell-body">
                    <span className="spell-name">{s.name}</span>
                    <span className="spell-meta-line">{s.time} · {s.comp}</span>
                    <span className="spell-effect">{s.effect}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StepReview({ c, num }) {
  const race = RACES[c.race];
  const cls = CLASSES[c.class];
  const bg = BACKGROUNDS[c.background];
  const ready = race && cls;
  return (
    <div className="step">
      <StepHead n={num} title="Review" sub="Looks good? Head to the sheet — you can always come back and edit." />
      {!ready && <div className="warn">Pick at least a race and a class to complete your hero.</div>}
      <div className="review-grid">
        <ReviewRow label="Name" value={c.name || "—"} />
        <ReviewRow label="Race" value={race ? ((race.subraces && c.subrace ? race.subraces[c.subrace].name + " " : "") + race.name) : "—"} />
        <ReviewRow label="Class" value={cls ? cls.name : "—"} />
        <ReviewRow label="Background" value={bg ? bg.name : "—"} />
        <ReviewRow label="Alignment" value={c.alignment || "—"} />
        <ReviewRow label="Hit Points" value={ready ? maxHP(c) : "—"} />
      </div>
      {ready && (
        <div className="mini-scores">
          {ABILITIES.map((a) => {
            const t = finalScore(c, a.key);
            return (
              <div className="ms" key={a.key}>
                <span className="ms-short">{a.short}</span>
                <span className="ms-num">{t}</span>
                <span className="ms-mod">{fmt(mod(t))}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const ReviewRow = ({ label, value }) => (
  <div className="review-row"><span>{label}</span><b>{value}</b></div>
);
const StepHead = ({ n, title, sub }) => (
  <div className="step-head">
    <div className="step-eyebrow">Step {n}</div>
    <h2>{title}</h2>
    {sub && <p>{sub}</p>}
  </div>
);

/* ============================ CHARACTER SHEET ============================ */

function Sheet({ c, update, onBack, onEdit }) {
  const race = RACES[c.race];
  const cls = CLASSES[c.class];
  const bg = BACKGROUNDS[c.background];
  const sub = race && race.subraces && c.subrace ? race.subraces[c.subrace].name + " " : "";
  const dexMod = mod(finalScore(c, "dex"));
  const ac = c.acOverride !== "" && c.acOverride != null ? Number(c.acOverride) : 10 + dexMod;
  const prof = allProficientSkills(c);
  const perceptionMod = mod(finalScore(c, "wis")) + (prof.has("perception") ? PROF_BONUS : 0);
  const weapons = [...deriveWeapons(c), ...(c.weapons || [])];
  const casterAbilKey = CASTERS[c.class];
  const casterAbil = casterAbilKey ? ABILITIES.find((a) => a.key === casterAbilKey) : null;
  const spellMod = casterAbilKey ? mod(finalScore(c, casterAbilKey)) : 0;
  const spellDC = 8 + PROF_BONUS + spellMod;
  const spellAtk = PROF_BONUS + spellMod;
  const knownSpells = (c.spells || []).map((n) => SPELLS.find((s) => s.name === n)).filter(Boolean);

  const photoRef = useRef(null);
  const onPhoto = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f || !update) return;
    const r = new FileReader();
    r.onload = () => update({ photo: r.result });
    r.readAsDataURL(f);
    e.target.value = "";
  };

  return (
    <div className="sheet-wrap">
      <div className="sheet-toolbar no-print">
        <button className="back-link" onClick={onBack}>‹ Party</button>
        <div className="toolbar-right">
          <button className="btn btn-ghost small" onClick={onEdit}>✎ Edit</button>
          <button className="btn btn-primary small" onClick={() => window.print()}>🖨 Print</button>
        </div>
      </div>

      <div className="sheet print-area">
        <div className="sheet-header">
          <div className="sheet-portrait-wrap">
            <div className={"sheet-portrait" + (c.photo ? " has" : "")}>
              {c.photo
                ? <img src={c.photo} alt="Character portrait" />
                : <span className="sheet-portrait-ph no-print">Portrait</span>}
            </div>
            {update && (
              <div className="sheet-portrait-btns no-print">
                <button className="img-btn" onClick={() => photoRef.current && photoRef.current.click()}>
                  {c.photo ? "Change" : "＋ Add photo"}
                </button>
                {c.photo && <button className="img-btn clear" title="Remove" onClick={() => update({ photo: "" })}>✕</button>}
                <input ref={photoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onPhoto} />
              </div>
            )}
          </div>
          <div className="sheet-title">
            <div className="sheet-name">{c.name || "Unnamed Hero"}</div>
            <div className="sheet-subline">
              {sub}{race ? race.name : "—"} · {cls ? cls.name : "—"} · Level {c.level} · {c.alignment || "Unaligned"}
            </div>
          </div>
          <div className="sheet-player">
            <span>Player</span><b>{c.player || "—"}</b>
          </div>
        </div>

        <div className="sheet-cols">
          {/* LEFT: abilities */}
          <div className="col abilities-col">
            {ABILITIES.map((a) => {
              const total = finalScore(c, a.key);
              return (
                <div className="abox" key={a.key}>
                  <div className="abox-name">{a.short}</div>
                  <div className="abox-mod">{fmt(mod(total))}</div>
                  <div className="abox-score">{total}</div>
                </div>
              );
            })}
          </div>

          {/* MIDDLE: combat + saves */}
          <div className="col mid-col">
            <div className="combat-row">
              <Stat label="Armor Class" value={ac} />
              <Stat label="Initiative" value={fmt(dexMod)} />
              <Stat label="Speed" value={getSpeed(c) + " ft"} />
            </div>
            <div className="combat-row">
              <Stat label="Hit Points" value={cls ? maxHP(c) : "—"} big />
              <Stat label="Hit Dice" value={cls ? `1d${cls.hd}` : "—"} />
              <Stat label="Prof. Bonus" value={fmt(PROF_BONUS)} />
            </div>

            {weapons.length > 0 && (
              <div className="panel">
                <div className="panel-title">Attacks</div>
                <table className="attacks-table">
                  <thead><tr><th>Weapon</th><th>Atk</th><th>Damage</th></tr></thead>
                  <tbody>
                    {weapons.map((w) => {
                      const m = mod(finalScore(c, w.ability));
                      return (
                        <tr key={w.id}>
                          <td>{w.name} <span className="w-tag">{w.ability.toUpperCase()}</span></td>
                          <td className="w-num">{fmt(m + PROF_BONUS)}</td>
                          <td className="w-num">{w.dice} {fmt(m)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="panel">
              <div className="panel-title">Saving Throws</div>
              <div className="save-grid">
                {ABILITIES.map((a) => {
                  const isProf = cls && cls.saves.includes(a.key);
                  const val = mod(finalScore(c, a.key)) + (isProf ? PROF_BONUS : 0);
                  return (
                    <div className={"save-row" + (isProf ? " prof" : "")} key={a.key}>
                      <span className="dot" />
                      <span className="save-val">{fmt(val)}</span>
                      <span className="save-name">{a.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="panel passive">
              <span>Passive Perception</span>
              <b>{10 + perceptionMod}</b>
            </div>
          </div>

          {/* RIGHT: skills */}
          <div className="col skills-col">
            <div className="panel">
              <div className="panel-title">Skills</div>
              <div className="skill-list">
                {SKILLS.map((s) => {
                  const isProf = prof.has(s.key);
                  const val = mod(finalScore(c, s.ability)) + (isProf ? PROF_BONUS : 0);
                  return (
                    <div className={"skill-line" + (isProf ? " prof" : "")} key={s.key}>
                      <span className="dot" />
                      <span className="skill-val">{fmt(val)}</span>
                      <span className="skill-label">{s.name}</span>
                      <span className="skill-tag">{ABILITIES.find((a) => a.key === s.ability).short}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {casterAbil && knownSpells.length > 0 && (
          <div className="panel spells-panel">
            <div className="panel-title">
              Spells — {casterAbil.name} · Save DC {spellDC} · Attack {fmt(spellAtk)}
              <span className="comp-legend">V verbal · S somatic · M material</span>
            </div>
            <div className="spell-detail-list">
              {[0, 1].map((lvl) => {
                const list = knownSpells.filter((s) => s.level === lvl);
                if (list.length === 0) return null;
                return (
                  <div className="sd-group" key={lvl}>
                    <div className="sd-group-title">{SPELL_LEVEL_NAMES[lvl]}</div>
                    {list.map((s) => (
                      <div className="sd-item" key={s.name}>
                        <div className="sd-head">
                          <span className="sd-name">{s.name}</span>
                          <span className="sd-meta">{s.time} · {s.comp}</span>
                        </div>
                        <div className="sd-desc">{s.effect}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="sheet-bottom three">
          <div className="panel">
            <div className="panel-title">Features &amp; Traits</div>
            <div className="features">
              {race && [...race.traits, ...(race.subraces && c.subrace ? race.subraces[c.subrace].traits : [])].map((t, i) => (
                <span className="feat" key={"r" + i}>{t}</span>
              ))}
              {cls && <span className="feat">Class: {cls.name} (saves in {cls.saves.map((s) => s.toUpperCase()).join(", ")})</span>}
              {bg && <span className="feat">Background: {bg.name}</span>}
            </div>
          </div>
          <div className="panel">
            <div className="panel-title">Equipment</div>
            {(c.equipment && c.equipment.length) ? (
              <ul className="sheet-equip">
                {c.equipment.map((it, i) => <li key={i}>{it}</li>)}
              </ul>
            ) : (
              <div className="notes-text">No equipment recorded yet.</div>
            )}
          </div>
          <div className="panel notes-panel">
            <div className="panel-title">Notes</div>
            <div className="notes-text">{c.notes || "Spells, backstory, and the rest live here — write them in by hand at the table."}</div>
          </div>
        </div>

        <div className="sheet-foot">Forged in The Adventurer's Forge · D&amp;D 5e mechanics (SRD 5.1)</div>
      </div>
    </div>
  );
}

const Stat = ({ label, value, big }) => (
  <div className={"stat" + (big ? " stat-big" : "")}>
    <div className="stat-val">{value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

/* ============================ STYLES ============================ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap');

* { box-sizing: border-box; }
.grim {
  --ink:#2c2014; --ink-soft:#5a4a36; --parch:#f3e6c9; --parch-2:#ead7b0;
  --parch-deep:#e0cba0; --oxblood:#7a1f1f; --oxblood-2:#9a2b2b;
  --gold:#9a7515; --gold-2:#c39a3e; --green:#3f5a35;
  font-family:'EB Garamond', Georgia, serif; color:var(--ink);
  min-height:100%; line-height:1.5;
  background:
    radial-gradient(circle at 20% 10%, rgba(154,117,21,.10), transparent 45%),
    radial-gradient(circle at 85% 90%, rgba(122,31,31,.10), transparent 45%),
    repeating-linear-gradient(0deg, rgba(120,90,40,.015) 0 2px, transparent 2px 4px),
    linear-gradient(160deg, #f6ecd4, #ecdab4 60%, #e4cfa3);
}
.loading { text-align:center; padding:80px; font-style:italic; color:var(--ink-soft); }

/* topbar */
.topbar { display:flex; align-items:center; justify-content:space-between;
  padding:14px 22px; border-bottom:2px solid rgba(122,31,31,.35);
  background:linear-gradient(180deg, rgba(255,250,235,.6), transparent); }
.brand { display:flex; gap:12px; align-items:center; cursor:pointer; }
.crest { font-size:28px; color:var(--oxblood); filter:drop-shadow(0 1px 0 var(--gold-2)); }
.brand-title { font-family:'Cinzel',serif; font-weight:700; font-size:18px; letter-spacing:.04em; color:var(--oxblood); }
.brand-sub { font-size:12px; color:var(--ink-soft); letter-spacing:.12em; text-transform:uppercase; }
.save-pill { font-size:12px; letter-spacing:.08em; color:var(--green); border:1px solid rgba(63,90,53,.4);
  padding:5px 12px; border-radius:20px; background:rgba(255,255,255,.35); }

.page { max-width:1080px; margin:0 auto; padding:30px 22px 70px; }
.fade-in { animation:fade .5s ease both; }
@keyframes fade { from { opacity:0; transform:translateY(8px);} to {opacity:1; transform:none;} }

/* hero */
.hero { text-align:center; padding:34px 16px 26px; }
.hero.compact { padding:18px 16px 10px; }
.hero-rule { color:var(--gold); letter-spacing:.6em; font-size:13px; margin-bottom:10px; }
.hero h1 { font-family:'Cinzel',serif; font-size:44px; margin:0 0 12px; color:var(--ink);
  text-shadow:0 1px 0 rgba(255,255,255,.5); letter-spacing:.01em; }
.hero-lead { max-width:620px; margin:0 auto 22px; font-size:18px; color:var(--ink-soft); }
.hero-actions { display:flex; gap:14px; justify-content:center; flex-wrap:wrap; }
.center-cta { text-align:center; margin-top:30px; }

/* buttons */
.btn { font-family:'Cinzel',serif; font-size:15px; letter-spacing:.03em; cursor:pointer;
  padding:12px 22px; border-radius:6px; border:1px solid transparent; transition:.18s; }
.btn.small { font-size:13px; padding:8px 16px; }
.btn-primary { background:linear-gradient(180deg, var(--oxblood-2), var(--oxblood));
  color:#f7ecd2; border-color:#5a1414; box-shadow:0 3px 0 #5a1414, 0 6px 14px rgba(90,20,20,.3); }
.btn-primary:hover { transform:translateY(-1px); box-shadow:0 4px 0 #5a1414, 0 9px 18px rgba(90,20,20,.35); }
.btn-ghost { background:rgba(255,255,255,.4); border-color:var(--gold); color:var(--ink); }
.btn-ghost:hover { background:rgba(255,255,255,.7); }
.btn:disabled { opacity:.4; cursor:not-allowed; transform:none; box-shadow:none; }
.back-link { background:none; border:none; font-family:'Cinzel',serif; color:var(--oxblood);
  cursor:pointer; font-size:14px; letter-spacing:.04em; padding:6px 0; }
.back-link:hover { text-decoration:underline; }

/* section head */
.section-head { display:flex; align-items:center; gap:16px; margin:28px 0 18px; }
.section-head span { font-family:'Cinzel',serif; font-size:20px; color:var(--oxblood); letter-spacing:.04em; }
.section-head i { flex:1; height:2px; background:linear-gradient(90deg, var(--gold-2), transparent); }
.empty { text-align:center; padding:40px; color:var(--ink-soft); font-style:italic;
  border:1px dashed rgba(122,31,31,.3); border-radius:10px; background:rgba(255,255,255,.25); }

/* char cards */
.card-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:16px; }
.char-card { border:1px solid rgba(122,31,31,.3); border-radius:10px; padding:16px;
  background:linear-gradient(180deg, rgba(255,251,240,.7), rgba(244,230,201,.5));
  box-shadow:0 2px 8px rgba(90,60,20,.12); }
.char-name { font-family:'Cinzel',serif; font-size:18px; color:var(--oxblood); }
.char-meta { font-size:14px; color:var(--ink-soft); margin-top:3px; }
.char-card-actions { display:flex; gap:8px; margin-top:14px; }
.mini { font-family:'EB Garamond',serif; font-size:13px; padding:6px 12px; border-radius:5px;
  border:1px solid var(--gold); background:rgba(255,255,255,.5); cursor:pointer; color:var(--ink); }
.mini:hover { background:#fff; }
.mini.danger { border-color:var(--oxblood); color:var(--oxblood); margin-left:auto; }

/* learn */
.lesson-list { display:flex; flex-direction:column; gap:16px; margin-top:8px; }
.lesson { display:flex; gap:20px; padding:20px; border-radius:10px; align-items:flex-start;
  border:1px solid rgba(154,117,21,.35);
  background:linear-gradient(180deg, rgba(255,251,240,.6), rgba(244,230,201,.4)); }
.lesson-art { flex:none; position:relative; width:88px; height:88px; border-radius:14px; padding:8px;
  background:radial-gradient(circle at 40% 30%, rgba(255,255,255,.7), rgba(244,230,201,.5));
  border:1px solid rgba(154,117,21,.4); box-shadow:0 3px 10px rgba(90,60,20,.15); }
.lesson-art svg { display:block; }
.lesson-badge { position:absolute; top:-8px; left:-8px; width:26px; height:26px; border-radius:50%;
  display:grid; place-items:center; font-family:'Cinzel',serif; font-size:13px; color:#f7ecd2;
  background:radial-gradient(circle at 35% 30%, var(--oxblood-2), var(--oxblood));
  box-shadow:0 0 0 2px rgba(195,154,62,.6); }
.lesson-body h3 { font-family:'Cinzel',serif; margin:2px 0 8px; color:var(--oxblood); font-size:20px; }
.lesson-body p { margin:0 0 12px; color:var(--ink-soft); font-size:16px; }
.chips { display:flex; flex-wrap:wrap; gap:8px; }
.pic-pills { display:flex; flex-wrap:wrap; gap:8px; }
.pic-pill { display:inline-flex; align-items:center; gap:7px; padding:5px 12px 5px 6px; border-radius:20px;
  background:rgba(255,251,240,.8); border:1px solid rgba(154,117,21,.45); font-size:14px; color:var(--ink);
  box-shadow:0 1px 3px rgba(90,60,20,.12); }
.mini-icon { width:24px; height:24px; flex:none; display:grid; place-items:center; border-radius:50%;
  background:radial-gradient(circle at 40% 30%, rgba(255,255,255,.9), rgba(244,225,196,.7));
  border:1px solid rgba(154,117,21,.4); padding:2px; }
.mini-icon svg { display:block; }
.race-gallery { display:grid; grid-template-columns:repeat(auto-fill,minmax(118px,1fr)); gap:16px; margin-top:6px; width:100%; }
.race-portrait { text-align:center; }
.race-portrait-frame { position:relative; width:100%; aspect-ratio:1/1; border-radius:16px;
  background:radial-gradient(circle at 42% 30%, #ffffff, var(--parch) 64%, var(--parch-deep));
  border:2px solid var(--gold); box-shadow:0 5px 14px rgba(90,60,20,.18);
  display:grid; place-items:center; padding:14%; margin-bottom:8px; }
.race-portrait-frame::after { content:""; position:absolute; inset:5px; border-radius:12px;
  border:1px solid rgba(122,31,31,.25); pointer-events:none; }
.race-portrait-art { width:100%; height:100%; display:block; }
.race-portrait-art svg { display:block; }
.race-portrait-name { font-family:'Cinzel',serif; color:var(--oxblood); font-size:16px; line-height:1.2; }
.race-portrait-bonus { font-size:12px; color:var(--green); font-weight:600; margin-top:2px; }
.race-photo { width:100%; height:100%; object-fit:cover; border-radius:10px; display:block; }
.race-portrait-frame.has-photo { padding:6px; }
.race-portrait-frame.has-photo .race-photo { border-radius:11px; }
.img-controls { display:inline-flex; gap:6px; align-items:center; margin-top:6px; }
.img-btn { font-family:'EB Garamond',serif; font-size:12px; padding:3px 10px; border-radius:14px; cursor:pointer;
  border:1px solid var(--gold); background:rgba(255,255,255,.6); color:var(--ink); }
.img-btn:hover { background:#fff; }
.img-btn.clear { border-color:var(--oxblood); color:var(--oxblood); padding:3px 8px; }
.option-race { display:flex; gap:12px; align-items:flex-start; text-align:left; }
.race-thumb { flex:none; width:64px; height:64px; border-radius:10px; overflow:hidden;
  background:radial-gradient(circle at 42% 30%, #fff, var(--parch) 70%, var(--parch-deep));
  border:1px solid var(--gold); display:grid; place-items:center; padding:6px; }
.race-thumb.has-photo { padding:0; }
.race-thumb-art { width:100%; height:100%; display:block; }
.race-thumb-art svg { display:block; }
.race-thumb-body { flex:1; }
.class-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(232px,1fr)); gap:12px; margin-top:6px; width:100%; }
.class-card { padding:12px 14px; border-radius:10px; border:1px solid rgba(154,117,21,.4);
  background:rgba(255,251,240,.7); }
.class-card-head { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
.class-icon-frame { flex:none; width:42px; height:42px; border-radius:50%; padding:6px; display:grid; place-items:center;
  background:radial-gradient(circle at 40% 30%, rgba(255,255,255,.9), rgba(244,225,196,.7));
  border:1px solid rgba(154,117,21,.45); }
.class-icon-art { width:100%; height:100%; display:block; }
.class-icon-art svg { display:block; }
.class-card-name { font-family:'Cinzel',serif; font-size:17px; color:var(--oxblood); }
.class-card-tags { font-size:12px; color:var(--green); font-weight:600; }
.class-card-desc { font-size:14px; color:var(--ink-soft); line-height:1.45; }
.chip { font-size:13px; padding:4px 11px; border-radius:14px; background:rgba(122,31,31,.1);
  border:1px solid rgba(122,31,31,.25); color:var(--ink); }

/* builder */
.builder-top { display:flex; flex-direction:column; gap:16px; margin-bottom:10px; }
.stepper { display:flex; gap:6px; justify-content:center; flex-wrap:wrap; }
.step-dot { background:none; border:none; cursor:pointer; display:flex; flex-direction:column;
  align-items:center; gap:4px; opacity:.5; transition:.2s; padding:4px 6px; }
.step-dot span { width:30px; height:30px; border-radius:50%; display:grid; place-items:center;
  font-family:'Cinzel',serif; border:2px solid var(--ink-soft); color:var(--ink-soft); font-size:14px; background:rgba(255,255,255,.4); }
.step-dot em { font-size:11px; font-style:normal; letter-spacing:.04em; color:var(--ink-soft); }
.step-dot.active { opacity:1; }
.step-dot.active span { border-color:var(--oxblood); background:var(--oxblood); color:#f7ecd2; }
.step-dot.done { opacity:.85; }
.step-dot.done span { border-color:var(--green); color:var(--green); }

.builder-stage { min-height:340px; }
.step-head { text-align:center; margin-bottom:22px; }
.step-eyebrow { font-family:'Cinzel',serif; font-size:12px; letter-spacing:.2em; text-transform:uppercase; color:var(--gold); }
.step-head h2 { font-family:'Cinzel',serif; font-size:30px; margin:4px 0 8px; color:var(--ink); }
.step-head p { color:var(--ink-soft); max-width:560px; margin:0 auto; font-size:16px; }

.builder-nav { display:flex; justify-content:space-between; margin-top:30px;
  border-top:1px solid rgba(122,31,31,.25); padding-top:20px; }

/* fields */
.field { max-width:520px; margin:0 auto 18px; }
.field label { display:block; font-family:'Cinzel',serif; font-size:13px; letter-spacing:.05em;
  color:var(--oxblood); margin-bottom:6px; }
.field .hint { font-family:'EB Garamond',serif; font-weight:normal; color:var(--ink-soft); letter-spacing:0; font-size:13px; }
input, select { width:100%; font-family:'EB Garamond',serif; font-size:16px; color:var(--ink);
  padding:11px 13px; border-radius:6px; border:1px solid rgba(122,31,31,.4);
  background:rgba(255,253,247,.85); }
input:focus, select:focus { outline:none; border-color:var(--oxblood); box-shadow:0 0 0 3px rgba(122,31,31,.12); }

/* option grid */
.option-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:14px; }
.option { text-align:left; cursor:pointer; padding:16px; border-radius:10px;
  border:1px solid rgba(154,117,21,.4); background:rgba(255,251,240,.55); transition:.16s; }
.option:hover { transform:translateY(-2px); box-shadow:0 6px 16px rgba(90,60,20,.18); border-color:var(--gold-2); }
.option.selected { border-color:var(--oxblood); background:linear-gradient(180deg, rgba(255,247,232,.95), rgba(244,225,196,.8));
  box-shadow:0 0 0 2px var(--oxblood), 0 6px 16px rgba(122,31,31,.2); }
.option-name { font-family:'Cinzel',serif; font-size:18px; color:var(--oxblood); margin-bottom:6px; }
.option-tags { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px; }
.tag { font-size:12px; padding:2px 9px; border-radius:12px; background:rgba(63,90,53,.14);
  border:1px solid rgba(63,90,53,.3); color:var(--green); font-weight:600; }
.option-blurb { font-size:14px; color:var(--ink-soft); }

.subpanel { margin-top:18px; padding:16px; border-radius:10px; background:rgba(255,255,255,.4);
  border:1px solid rgba(122,31,31,.25); }
.subpanel-label { font-family:'Cinzel',serif; font-size:14px; color:var(--oxblood); margin-bottom:10px; }
.pill-row { display:flex; gap:10px; flex-wrap:wrap; }
.pill { cursor:pointer; padding:10px 16px; border-radius:24px; border:1px solid var(--gold);
  background:rgba(255,255,255,.5); display:flex; flex-direction:column; align-items:center; gap:2px; font-family:'EB Garamond',serif; }
.pill em { font-style:normal; font-size:11px; color:var(--green); font-weight:600; }
.pill.on { background:var(--oxblood); color:#f7ecd2; border-color:#5a1414; }
.pill.on em { color:#f0d9b0; }
.he-select { width:auto; min-width:150px; }

.info-box { margin-top:20px; padding:16px 18px; border-radius:10px; border-left:4px solid var(--gold);
  background:rgba(255,255,255,.4); }
.info-title { font-family:'Cinzel',serif; color:var(--oxblood); margin-bottom:8px; font-size:15px; }
.info-box ul { margin:0; padding-left:20px; color:var(--ink-soft); }
.info-box li { margin-bottom:4px; }
.info-foot { margin-top:8px; font-weight:600; color:var(--green); }

/* abilities step */
.method-row { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin-bottom:18px; }
.method { cursor:pointer; padding:12px 20px; border-radius:8px; border:1px solid var(--gold);
  background:rgba(255,255,255,.5); display:flex; flex-direction:column; gap:2px; min-width:140px; }
.method b { font-family:'Cinzel',serif; color:var(--ink); }
.method span { font-size:13px; color:var(--ink-soft); }
.method.on { background:var(--oxblood); border-color:#5a1414; }
.method.on b { color:#f7ecd2; } .method.on span { color:#f0d9b0; }
.points-left { text-align:center; font-size:16px; margin-bottom:14px; color:var(--green); }
.points-left.over { color:var(--oxblood); font-weight:700; }
.roll-row { display:flex; gap:14px; justify-content:center; align-items:center; margin-bottom:14px; flex-wrap:wrap; }
.pool-show { color:var(--ink-soft); font-size:15px; }
.pool-show.center { text-align:center; display:block; margin-bottom:14px; }
.assign-hint { font-size:13px; font-style:italic; color:var(--green); margin-top:4px; }
.custom-array { text-align:center; margin-bottom:16px; }
.custom-array-label { font-size:15px; color:var(--ink-soft); margin-bottom:10px; }
.custom-inputs { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }
.custom-num { width:62px; text-align:center; font-family:'Cinzel',serif; font-size:18px; padding:8px 4px; }
.custom-num::-webkit-outer-spin-button, .custom-num::-webkit-inner-spin-button { opacity:1; }
.pool-chips { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }
.pool-chip { font-family:'Cinzel',serif; font-size:18px; color:var(--oxblood);
  width:46px; height:46px; display:grid; place-items:center; border-radius:10px;
  background:rgba(255,247,230,.9); border:1px solid var(--gold); box-shadow:0 2px 6px rgba(90,60,20,.15);
  animation:fade .35s ease both; }
.ability-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(210px,1fr)); gap:14px; }
.ability-card { padding:14px; border-radius:10px; border:1px solid rgba(154,117,21,.4);
  background:rgba(255,251,240,.6); text-align:center; }
.ability-head { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:10px; }
.ability-name { font-family:'Cinzel',serif; font-size:15px; color:var(--oxblood); }
.ability-short { font-size:12px; color:var(--ink-soft); letter-spacing:.1em; }
.pb-controls { display:flex; align-items:center; justify-content:center; gap:14px; margin:6px 0; }
.step-btn { width:34px; height:34px; border-radius:50%; border:1px solid var(--oxblood);
  background:rgba(255,255,255,.6); font-size:18px; cursor:pointer; color:var(--oxblood); }
.step-btn:disabled { opacity:.3; cursor:not-allowed; }
.pb-val { font-family:'Cinzel',serif; font-size:24px; min-width:30px; }
.assign-select { text-align:center; margin:4px 0; }
.ability-foot { display:flex; align-items:center; justify-content:center; gap:10px; margin-top:10px; }
.af-block { display:flex; flex-direction:column; }
.af-label { font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:var(--ink-soft); }
.af-num { font-family:'Cinzel',serif; font-size:20px; }
.af-num.big { font-size:28px; color:var(--oxblood); }
.af-arrow { color:var(--gold); }
.af-block.total { background:rgba(122,31,31,.07); border-radius:8px; padding:2px 12px; }
.af-mod { font-size:13px; color:var(--green); font-weight:600; }
.racial-note { margin-top:6px; font-size:12px; color:var(--green); }
.tiny-note { text-align:center; margin-top:18px; color:var(--ink-soft); font-size:14px; font-style:italic; }

/* skills step */
.skill-counter { text-align:center; font-family:'Cinzel',serif; color:var(--oxblood); margin-bottom:14px; }
.skill-counter.done { color:var(--green); }
.skill-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:10px; }
.skill { display:flex; align-items:center; gap:8px; padding:10px 12px; border-radius:8px; cursor:pointer;
  border:1px solid rgba(154,117,21,.4); background:rgba(255,255,255,.45); text-align:left; }
.skill:hover { border-color:var(--gold-2); }
.skill.on { background:var(--oxblood); border-color:#5a1414; color:#f7ecd2; }
.skill.on .skill-abil { color:#f0d9b0; }
.skill.free { background:rgba(63,90,53,.16); border-color:var(--green); cursor:default; }
.skill-name { font-size:15px; flex:1; }
.skill-abil { font-size:11px; letter-spacing:.08em; color:var(--ink-soft); }
.skill-free { font-size:10px; color:var(--green); }

/* review */
.warn, .points-left.over { color:var(--oxblood); }
.warn { text-align:center; padding:12px; border-radius:8px; background:rgba(122,31,31,.1);
  border:1px solid rgba(122,31,31,.3); margin-bottom:18px; }
.review-grid { max-width:520px; margin:0 auto; }
.review-row { display:flex; justify-content:space-between; padding:10px 4px;
  border-bottom:1px dotted rgba(122,31,31,.3); }
.review-row span { color:var(--ink-soft); }
.review-row b { font-family:'Cinzel',serif; color:var(--ink); }
.mini-scores { display:flex; gap:10px; justify-content:center; margin-top:24px; flex-wrap:wrap; }
.ms { display:flex; flex-direction:column; align-items:center; padding:10px 16px; border-radius:8px;
  background:rgba(255,251,240,.7); border:1px solid rgba(154,117,21,.4); }
.ms-short { font-size:11px; letter-spacing:.1em; color:var(--ink-soft); }
.ms-num { font-family:'Cinzel',serif; font-size:22px; color:var(--oxblood); }
.ms-mod { font-size:13px; color:var(--green); font-weight:600; }

/* ============ SHEET ============ */
.sheet-wrap { max-width:1000px; margin:0 auto; padding:20px 16px 60px; }
.sheet-toolbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
.toolbar-right { display:flex; gap:10px; }
.sheet { background:linear-gradient(160deg,#fbf3df,#f1e1bd); border:2px solid var(--oxblood);
  border-radius:6px; padding:26px; box-shadow:0 0 0 4px rgba(195,154,62,.4), 0 10px 30px rgba(90,60,20,.2);
  position:relative; }
.sheet::before { content:""; position:absolute; inset:8px; border:1px solid rgba(122,31,31,.3);
  border-radius:4px; pointer-events:none; }
.sheet-header { display:flex; justify-content:space-between; align-items:flex-end; gap:16px;
  border-bottom:2px solid var(--oxblood); padding-bottom:14px; margin-bottom:18px; }
.sheet-title { flex:1; }
.sheet-portrait-wrap { flex:none; display:flex; flex-direction:column; align-items:center; gap:6px; }
.sheet-portrait { width:92px; height:92px; border-radius:12px; overflow:hidden; flex:none;
  border:2px solid var(--gold); background:radial-gradient(circle at 42% 30%, #fff, var(--parch) 70%, var(--parch-deep));
  display:grid; place-items:center; box-shadow:0 3px 10px rgba(90,60,20,.18); }
.sheet-portrait img { width:100%; height:100%; object-fit:cover; display:block; }
.sheet-portrait-ph { font-family:'Cinzel',serif; font-size:12px; letter-spacing:.06em; color:var(--ink-soft); }
.sheet-portrait-btns { display:flex; gap:6px; align-items:center; }
.sheet-name { font-family:'Cinzel',serif; font-size:34px; color:var(--oxblood); line-height:1.1; }
.sheet-subline { font-size:15px; color:var(--ink-soft); margin-top:4px; }
.sheet-player { text-align:right; }
.sheet-player span { display:block; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--ink-soft); }
.sheet-player b { font-family:'Cinzel',serif; font-size:16px; }

.sheet-cols { display:grid; grid-template-columns:80px 1fr 1fr; gap:18px; }
.abilities-col { display:flex; flex-direction:column; gap:10px; }
.abox { border:2px solid var(--ink); border-radius:10px; padding:8px 4px; text-align:center;
  background:rgba(255,255,255,.55); }
.abox-name { font-family:'Cinzel',serif; font-size:12px; letter-spacing:.1em; color:var(--oxblood); }
.abox-mod { font-family:'Cinzel',serif; font-size:26px; color:var(--ink); line-height:1; margin:4px 0; }
.abox-score { font-size:13px; color:var(--ink-soft); border-top:1px solid rgba(122,31,31,.3); padding-top:3px; }

.combat-row { display:flex; gap:12px; margin-bottom:12px; }
.stat { flex:1; border:1px solid rgba(122,31,31,.4); border-radius:8px; padding:8px; text-align:center;
  background:rgba(255,255,255,.5); }
.stat-val { font-family:'Cinzel',serif; font-size:22px; color:var(--oxblood); }
.stat-big .stat-val { font-size:28px; }
.stat-label { font-size:10px; letter-spacing:.08em; text-transform:uppercase; color:var(--ink-soft); }

.panel { border:1px solid rgba(122,31,31,.4); border-radius:8px; padding:12px 14px;
  background:rgba(255,255,255,.4); margin-bottom:12px; }
.panel-title { font-family:'Cinzel',serif; font-size:13px; letter-spacing:.08em; text-transform:uppercase;
  color:var(--oxblood); border-bottom:1px solid rgba(122,31,31,.3); padding-bottom:6px; margin-bottom:8px; }
.save-grid { display:grid; grid-template-columns:1fr 1fr; gap:4px 14px; }
.save-row, .skill-line { display:flex; align-items:center; gap:8px; font-size:14px; padding:2px 0; }
.dot { width:9px; height:9px; border-radius:50%; border:1.5px solid var(--ink-soft); flex:none; }
.save-row.prof .dot, .skill-line.prof .dot { background:var(--oxblood); border-color:var(--oxblood); }
.save-row.prof, .skill-line.prof { font-weight:600; }
.save-val, .skill-val { font-family:'Cinzel',serif; min-width:26px; }
.skill-list { display:flex; flex-direction:column; }
.skill-label { flex:1; }
.skill-tag { font-size:11px; color:var(--ink-soft); }
.passive { display:flex; justify-content:space-between; align-items:center; }
.passive b { font-family:'Cinzel',serif; font-size:22px; color:var(--oxblood); }

.sheet-bottom { display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-top:6px; }
.sheet-bottom.three { grid-template-columns:1fr 1fr 1fr; }
.sheet-equip { margin:0; padding-left:18px; font-size:13px; color:var(--ink); columns:1; }
.sheet-equip li { margin-bottom:3px; }
.features { display:flex; flex-wrap:wrap; gap:6px; }
.feat { font-size:13px; padding:3px 10px; border-radius:12px; background:rgba(63,90,53,.12);
  border:1px solid rgba(63,90,53,.3); color:var(--ink); }
.notes-text { font-size:14px; color:var(--ink-soft); font-style:italic; min-height:60px; }
.sheet-foot { text-align:center; margin-top:18px; font-size:12px; color:var(--ink-soft); letter-spacing:.06em; }

@media (max-width:760px) {
  .sheet-cols { grid-template-columns:1fr; }
  .abilities-col { flex-direction:row; flex-wrap:wrap; }
  .abox { flex:1; min-width:80px; }
  .sheet-bottom, .sheet-bottom.three { grid-template-columns:1fr; }
  .spell-detail-list { grid-template-columns:1fr; }
  .hero h1 { font-size:32px; }
  .dice-tray { gap:10px; }
}

/* ============ CONFIRM / LINK / DICE / EQUIPMENT ============ */
.char-card.confirming { border-color:var(--oxblood); box-shadow:0 0 0 2px rgba(122,31,31,.3); }
.confirm-bar { display:flex; align-items:center; gap:8px; margin-top:14px; flex-wrap:wrap; }
.confirm-bar span { font-size:14px; color:var(--oxblood); flex:1; min-width:100%; }
.linkbtn { background:none; border:none; color:var(--oxblood); cursor:pointer; font-family:'EB Garamond',serif;
  font-size:inherit; text-decoration:underline; padding:0; }
.linkbtn.reload { display:inline-block; margin-top:14px; font-size:13px; color:var(--ink-soft); }

.dice-arena { display:flex; flex-direction:column; align-items:center; gap:20px; }
.roller-card { width:100%; max-width:460px; text-align:center; padding:22px; border-radius:14px;
  border:1px solid rgba(154,117,21,.5);
  background:radial-gradient(circle at 50% 0%, rgba(255,247,230,.9), rgba(244,225,196,.7));
  box-shadow:0 6px 20px rgba(90,60,20,.18); }
.roller-prompt { font-family:'Cinzel',serif; font-size:18px; color:var(--ink); margin-bottom:16px;
  display:flex; flex-direction:column; gap:4px; }
.roller-prompt b { color:var(--oxblood); font-size:22px; }
.roller-progress { font-family:'EB Garamond',serif; font-size:12px; letter-spacing:.1em;
  text-transform:uppercase; color:var(--ink-soft); }
.dice-tray { display:flex; gap:14px; justify-content:center; margin-bottom:14px; }
.die { width:54px; height:54px; border-radius:11px; background:linear-gradient(150deg,#fdf6e6,#e9d4a6);
  border:2px solid var(--ink); display:grid; grid-template-columns:repeat(3,1fr); grid-template-rows:repeat(3,1fr);
  padding:7px; box-shadow:inset 0 -3px 6px rgba(120,90,40,.25), 0 3px 6px rgba(90,60,20,.25); transition:.15s; }
.die .pip { width:9px; height:9px; border-radius:50%; background:transparent; place-self:center; }
.die .pip.on { background:var(--oxblood); box-shadow:0 1px 1px rgba(0,0,0,.3); }
.die.spin { animation:diceshake .25s infinite; }
.die.dropped { opacity:.4; border-color:var(--ink-soft); transform:scale(.86) rotate(-6deg); }
.die.dropped .pip.on { background:var(--ink-soft); }
@keyframes diceshake {
  0%{transform:translateY(0) rotate(0);} 25%{transform:translateY(-4px) rotate(-7deg);}
  50%{transform:translateY(0) rotate(4deg);} 75%{transform:translateY(-3px) rotate(8deg);} 100%{transform:translateY(0) rotate(0);}
}
.roll-result { font-size:16px; color:var(--ink-soft); margin-bottom:14px; }
.roll-result b { font-family:'Cinzel',serif; font-size:22px; color:var(--green); }
.roll-result s { color:var(--oxblood); }
.roller-actions { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }
.roller-done { font-size:16px; color:var(--green); text-align:center; max-width:460px; }

.roll-track { width:100%; max-width:460px; display:flex; flex-direction:column; gap:6px; }
.track-row { display:flex; align-items:center; gap:10px; padding:8px 12px; border-radius:8px;
  border:1px solid rgba(154,117,21,.3); background:rgba(255,255,255,.35); }
.track-row.active { border-color:var(--oxblood); box-shadow:0 0 0 2px rgba(122,31,31,.18);
  background:rgba(255,247,230,.8); }
.track-row.filled { background:rgba(63,90,53,.1); }
.track-name { font-family:'Cinzel',serif; font-size:14px; flex:1; color:var(--ink); }
.track-base { font-size:14px; color:var(--ink-soft); min-width:22px; text-align:center; }
.track-arrow { color:var(--gold); }
.track-total { font-family:'Cinzel',serif; font-size:15px; color:var(--oxblood); min-width:70px; }
.track-redo { background:none; border:1px solid var(--gold); border-radius:6px; cursor:pointer;
  color:var(--ink-soft); width:28px; height:28px; }
.track-redo:hover { background:#fff; color:var(--oxblood); }
.roll-tip { max-width:460px; text-align:center; font-size:13px; font-style:italic; color:var(--ink-soft); }

.equip-wrap { max-width:560px; margin:0 auto; }
.equip-add { display:flex; gap:10px; margin-bottom:16px; }
.equip-add input { flex:1; }
.equip-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:6px; }
.equip-item { display:flex; align-items:center; gap:10px; padding:9px 14px; border-radius:8px;
  border:1px solid rgba(154,117,21,.35); background:rgba(255,251,240,.6); }
.equip-bullet { color:var(--gold); }
.equip-text { flex:1; font-size:15px; }
.equip-x { background:none; border:none; color:var(--oxblood); cursor:pointer; font-size:14px; opacity:.6; }
.equip-x:hover { opacity:1; }

/* weapons editor */
.weapons-wrap { margin-top:18px; }
.subhead { font-family:'Cinzel',serif; font-size:16px; color:var(--oxblood); margin-bottom:6px; }
.tiny-note.left { text-align:left; margin:0 0 12px; }
.weapon-add { display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap; }
.weapon-add .w-name { flex:1; min-width:150px; }
.weapon-add .w-ability, .weapon-add .w-dice { width:auto; }
.weapon-table { width:100%; border-collapse:collapse; }
.weapon-table th { text-align:left; font-family:'Cinzel',serif; font-size:11px; letter-spacing:.06em;
  text-transform:uppercase; color:var(--ink-soft); border-bottom:1px solid rgba(122,31,31,.3); padding:6px 8px; }
.weapon-table td { padding:8px; border-bottom:1px dotted rgba(122,31,31,.25); }
.w-num { font-family:'Cinzel',serif; color:var(--oxblood); }
.w-tag { font-size:11px; color:var(--ink-soft); }

/* spell picker */
.spell-meta { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin-bottom:18px; }
.sm-block { display:flex; flex-direction:column; align-items:center; padding:8px 16px; border-radius:8px;
  background:rgba(255,251,240,.7); border:1px solid rgba(154,117,21,.4); }
.sm-block span { font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:var(--ink-soft); }
.sm-block b { font-family:'Cinzel',serif; font-size:18px; color:var(--oxblood); }
.spell-group { margin-bottom:16px; }
.spell-group-title { font-family:'Cinzel',serif; color:var(--oxblood); font-size:16px; margin-bottom:8px;
  border-bottom:1px solid rgba(122,31,31,.25); padding-bottom:4px; }
.spell-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:8px; }
.spell { display:flex; align-items:flex-start; gap:8px; padding:9px 11px; border-radius:8px; cursor:pointer;
  border:1px solid rgba(154,117,21,.4); background:rgba(255,255,255,.45); text-align:left; }
.spell:hover { border-color:var(--gold-2); }
.spell.on { background:var(--oxblood); border-color:#5a1414; color:#f7ecd2; }
.spell.on .spell-effect { color:#f0d9b0; }
.spell-check { flex:none; width:20px; height:20px; border-radius:50%; display:grid; place-items:center;
  border:1px solid currentColor; font-size:12px; margin-top:1px; }
.spell-body { display:flex; flex-direction:column; }
.spell-name { font-family:'Cinzel',serif; font-size:14px; }
.spell-meta-line { font-size:11px; letter-spacing:.03em; color:var(--green); font-weight:600; }
.spell.on .spell-meta-line { color:#e9c98f; }
.spell-effect { font-size:12px; color:var(--ink-soft); }

/* sheet attacks + spells */
.attacks-table { width:100%; border-collapse:collapse; }
.attacks-table th { text-align:left; font-size:10px; letter-spacing:.06em; text-transform:uppercase;
  color:var(--ink-soft); padding:2px 4px; border-bottom:1px solid rgba(122,31,31,.3); }
.attacks-table td { padding:3px 4px; font-size:13px; border-bottom:1px dotted rgba(122,31,31,.2); }
.spells-panel { margin-top:6px; }
.comp-legend { float:right; font-family:'EB Garamond',serif; font-size:10px; letter-spacing:0;
  text-transform:none; color:var(--ink-soft); font-weight:normal; }
.spell-detail-list { display:grid; grid-template-columns:1fr 1fr; gap:6px 20px; }
.sd-group { break-inside:avoid; }
.sd-group-title { font-family:'Cinzel',serif; font-size:12px; letter-spacing:.05em; color:var(--oxblood);
  border-bottom:1px solid rgba(122,31,31,.25); margin:4px 0; padding-bottom:2px; }
.sd-item { margin-bottom:6px; }
.sd-head { display:flex; justify-content:space-between; align-items:baseline; gap:8px; }
.sd-name { font-family:'Cinzel',serif; font-size:13px; color:var(--ink); }
.sd-meta { font-size:10px; color:var(--green); font-weight:600; white-space:nowrap; }
.sd-desc { font-size:12px; color:var(--ink-soft); line-height:1.35; }


@media print {
  .no-print { display:none !important; }
  .grim { background:#fff !important; }
  .sheet-wrap { padding:0; max-width:100%; }
  .sheet { box-shadow:none; border:none; background:#fff !important;
    -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .sheet::before { display:none; }
  .abox { background:#fff !important; }
  body { background:#fff; }
  @page { margin:12mm; }

  /* Stack into one column so panels paginate cleanly, then keep each block whole. */
  .sheet-cols { display:block; }
  .col { width:100%; }
  .abilities-col { display:flex; flex-direction:row; flex-wrap:wrap; gap:8px; margin-bottom:12px; }
  .abox { flex:1; min-width:84px; }
  .sheet-bottom, .sheet-bottom.three { display:block; }
  .spell-detail-list { grid-template-columns:1fr 1fr; }

  /* Never split these across a page break. */
  .panel, .abox, .combat-row, .stat,
  .sd-group, .sd-item, .save-row, .skill-line,
  .sheet-header, .features, .sheet-equip li, tr {
    break-inside: avoid; page-break-inside: avoid;
  }
  .panel { margin-bottom:10px; }
  .sheet-bottom .panel { margin-bottom:10px; }
}
`;