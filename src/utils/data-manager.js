import { DIRECTION } from '../common/direction.js';
import { OPTION_MENU_OPTIONS, OPTION_MENU_OPTIONS_DATA } from '../common/options.js';
import { TILE_SIZE } from '../config.js';
import Phaser from '../lib/phaser.js';

const LOCAL_STORAGE_KEY = 'MONSTER_TAMER_DATA';

/**
 * @typedef GlobalState
 * @type {object}
 * @property {object} player
 * @property {object} player.position
 * @property {number} player.position.x
 * @property {number} player.position.y
 * @property {import('../common/direction.js').Direction} player.direction
 * @property {object} options
 * @property {number} options.textSpeed
 * @property {number} options.battleSceneAnimations
 * @property {number} options.battleStyle
 * @property {number} options.sound
 * @property {number} options.volume
 * @property {number} options.menuColor
 */

/** @type {GlobalState} */
const initialState = {
	player: {
		position: {
			x: 6 * TILE_SIZE,
			y: 21 * TILE_SIZE,
		},
		direction: DIRECTION.DOWN,
	},
	options: {
		textSpeed: OPTION_MENU_OPTIONS_DATA.TEXT_SPEED,
		battleSceneAnimations: OPTION_MENU_OPTIONS_DATA.BATTLE_SCENE,
		battleStyle: OPTION_MENU_OPTIONS_DATA.BATTLE_STYLE,
		sound: OPTION_MENU_OPTIONS_DATA.SOUND,
		volume: OPTION_MENU_OPTIONS_DATA.VOLUME,
		menuColor: OPTION_MENU_OPTIONS_DATA.MENU_COLOR,
	},
};

export const DATA_MANAGER_STORE_KEYS = Object.freeze({
	PLAYER_POSITION: 'PLAYER_POSITION',
	PLAYER_DIRECTION: 'PLAYER_DIRECTION',
	OPTIONS_TEXT_SPEED: 'OPTIONS_TEXT_SPEED',
	OPTIONS_BATTLE_SCENE_ANIMATIONS: 'OPTIONS_BATTLE_SCENE_ANIMATIONS',
	OPTIONS_BATTLE_STYLE: 'OPTIONS_BATTLE_STYLE',
	OPTIONS_SOUND: 'OPTIONS_SOUND',
	OPTIONS_VOLUME: 'OPTIONS_VOLUME',
	OPTIONS_MENU_COLOR: 'OPTIONS_MENU_COLOR',
});

class DataManager extends Phaser.Events.EventEmitter {
	/** @type {Phaser.Data.DataManager} */
	#store;
	constructor() {
		super();
		this.#store = new Phaser.Data.DataManager(this);
		this.#updateDataManager(initialState);
	}

	/** @type {Phaser.Data.DataManager} */
	get store() {
		return this.#store;
	}

	loadData() {
		if (typeof Storage === 'undefined') {
			console.warn(
				`[${DataManager.name}:loadData] local storage is not supported, will not be able to save and load data`,
			);
			return;
		}

		const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
		if (savedData === null) return;

		try {
			const parsedData = JSON.parse(savedData);
			this.#updateDataManager(parsedData);
		} catch (err) {
			console.warn(
				`[${DataManager.name}:loadData] encountered an error while attempting to load and parse saved data`,
			);
		}
	}

	saveData() {
		if (typeof Storage === 'undefined') {
			console.warn(
				`[${DataManager.name}:saveData] local storage is not supported, will not be able to save and load data`,
			);
			return;
		}

		const dataToSave = this.#dataManagerDataToGlobalStateObject();
		localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
	}

	/**
	 * @param {GlobalState} data
	 * @returns {void}
	 */
	#updateDataManager(data) {
		this.store.set({
			[DATA_MANAGER_STORE_KEYS.PLAYER_POSITION]: data.player.position,
			[DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION]: data.player.direction,
			[DATA_MANAGER_STORE_KEYS.OPTIONS_TEXT_SPEED]: data.options.textSpeed,
			[DATA_MANAGER_STORE_KEYS.OPTIONS_BATTLE_SCENE_ANIMATIONS]: data.options.battleSceneAnimations,
			[DATA_MANAGER_STORE_KEYS.OPTIONS_BATTLE_STYLE]: data.options.battleStyle,
			[DATA_MANAGER_STORE_KEYS.OPTIONS_SOUND]: data.options.sound,
			[DATA_MANAGER_STORE_KEYS.OPTIONS_VOLUME]: data.options.volume,
			[DATA_MANAGER_STORE_KEYS.OPTIONS_MENU_COLOR]: data.options.menuColor,
		});
	}

	#dataManagerDataToGlobalStateObject() {
		return {
			player: {
				position: {
					x: this.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION).x,
					y: this.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION).y,
				},
				direction: DIRECTION.DOWN,
			},
			options: {
				textSpeed: this.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_TEXT_SPEED),
				battleSceneAnimations: this.store.get(
					DATA_MANAGER_STORE_KEYS.OPTIONS_BATTLE_SCENE_ANIMATIONS,
				),
				battleStyle: this.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_BATTLE_STYLE),
				sound: this.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_SOUND),
				volume: this.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_VOLUME),
				menuColor: this.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_MENU_COLOR),
			},
		};
	}
}

//Чтобы создать только один раз
export const dataManager = new DataManager();
