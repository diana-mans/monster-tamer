/**
 * @typedef {keyof typeof OPTION_MENU_OPTIONS} OptionMenuOptions
 */

/** @enum {OptionMenuOptions} */
export const OPTION_MENU_OPTIONS = Object.freeze({
	TEXT_SPEED: 0,
	BATTLE_SCENE: 1,
	BATTLE_STYLE: 2,
	SOUND: 3,
	VOLUME: 4,
	MENU_COLOR: 5,
	CONFIRM: 6,
});

export const OPTION_MENU_OPTIONS_DATA = Object.freeze({
	TEXT_SPEED: 1,
	BATTLE_SCENE: 0,
	BATTLE_STYLE: 1,
	SOUND: 0,
	VOLUME: 4,
	MENU_COLOR: 1,
	CONFIRM: 6,
});
