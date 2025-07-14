import { UI_ASSET_KEYS } from '../assets/asset-keys.js';
import { KENNY_FUTURE_NARROW_FONT_NAME } from '../assets/font-keys.js';
import { DIRECTION } from '../common/direction.js';
import { OPTION_MENU_OPTIONS } from '../common/options.js';
import Phaser from '../lib/phaser.js';
import { Controls } from '../utils/controls.js';
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../utils/data-manager.js';
import { exhaustiveGuard } from '../utils/guard.js';
import { NineSlice } from '../utils/nine-slice.js';
import { SCENE_KEYS } from './scene-keys.js';

/** @type {Phaser.Types.GameObjects.Text.TextStyle} */
const OPTIONS_TEXT_STYLE = Object.freeze({
	fontFamily: KENNY_FUTURE_NARROW_FONT_NAME,
	color: '#FFFFFF',
	fontSize: '30px',
});

const TEXT_FONT_COLORS = Object.freeze({
	SELECTED: '#ff2222',
	NOT_SELECTED: '#ffffff',
});

export const menuBackgrounds = [
	UI_ASSET_KEYS.MENU_BACKGROUND,
	UI_ASSET_KEYS.MENU_BACKGROUND_GREEN,
	UI_ASSET_KEYS.MENU_BACKGROUND_PURPLE,
];

/**
 * @typedef MenuOptionType
 * @type {object}
 * @property {string} name
 * @property {string} info
 * @property {string[]} [options]
 */

/**
 * @type {MenuOptionType[]}
 */
const menuOptions = [
	{
		name: 'Text Speed',
		info: 'Choose one of three text display speeds.',
		options: ['Slow', 'Mid', 'Fast'],
	},
	{
		name: 'Battle Scene',
		info: 'Choose to display battle animations and effects or not.',
		options: ['On', 'Off'],
	},
	{
		name: 'Battle Style',
		info: 'Choose to allow your monster to be recalled between rounds.',
		options: ['Set', 'Shift'],
	},
	{
		name: 'Sound',
		info: 'Choose to enable or disable the sound.',
		options: ['On', 'Off'],
	},
	{
		name: 'Volume',
		info: 'Choose the volume for the music and sound effects of the game.',
	},
	{
		name: 'Menu Color',
		info: 'Choose one of the three menu color options.',
	},
	{ name: 'Close', info: 'Save your changes and go back to the main menu.' },
];

export class OptionsScene extends Phaser.Scene {
	/** @type {Phaser.GameObjects.Container} */
	#mainContainer;

	/** @type {NineSlice} */
	#nineSliceMainContainer;

	/** @type {Phaser.GameObjects.Group} */
	#textOptions;

	/** @type {Phaser.GameObjects.Rectangle} */
	#volumeOptionMenuCursor;

	/** @type {Phaser.GameObjects.Text} */
	#volumeOptionValueText;

	/** @type {Phaser.GameObjects.Text} */
	#selectedMenuColorTextGameObject;

	/** @type {Phaser.GameObjects.Container} */
	#infoContainer;

	/** @type {Phaser.GameObjects.Text} */
	#selectedOptionInfoMsgTextGameObject;

	/** @type {Phaser.GameObjects.Rectangle} */
	#optionsMenuCursor;

	/** @type {Controls} */
	#controls;
	/** @type {number} */
	#selectedOptionMenuIndex;
	/** @type {number[]} */
	#selectedOptionsIndexes;
	/** @type {number} */
	#volumeValue;
	/** @type {number} */
	#menuColorValue;

	constructor() {
		super({
			key: SCENE_KEYS.OPTIONS_SCENE,
		});
	}
	init() {
		console.log(`[${OptionsScene.name}:init] invoked`);

		this.#nineSliceMainContainer = new NineSlice({
			assetKeys: menuBackgrounds,
			cornerCutSize: 32,
			textureManager: this.sys.textures,
		});

		this.#selectedOptionMenuIndex = 0;
		this.#selectedOptionsIndexes = [
			dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_TEXT_SPEED),
			dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_BATTLE_SCENE_ANIMATIONS),
			dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_BATTLE_STYLE),
			dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_SOUND),
		];
		this.#volumeValue = dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_VOLUME);
		this.#menuColorValue = dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_MENU_COLOR);
	}
	create() {
		console.log(`[${OptionsScene.name}:create] invoked`);

		const { width, height } = this.scale;
		const optionsMenuWidth = width - 200;

		//main options container
		this.#mainContainer = this.#nineSliceMainContainer.createNineSliceContainer(
			this,
			optionsMenuWidth,
			432,
			menuBackgrounds[this.#menuColorValue - 1],
		);
		this.#mainContainer.setX(100).setY(20);

		//create main options selection
		this.add.text(width / 2, 40, 'Options', OPTIONS_TEXT_STYLE).setOrigin(0.5);
		const menuOptionsPosition = { x: 25, yStart: 55, yIncrement: 55 };

		menuOptions.forEach((option, index) => {
			const x = menuOptionsPosition.x;
			const y = menuOptionsPosition.yStart + menuOptionsPosition.yIncrement * index;
			const textGameObject = this.add.text(x, y, option.name, OPTIONS_TEXT_STYLE);
			this.#mainContainer.add(textGameObject);
		});

		//create text options
		this.#textOptions = this.add.group([]);
		menuOptions.forEach((menuOption, menuOptionIndex) => {
			if (menuOption.options) {
				menuOption.options.forEach((option, index) => {
					const textColor =
						this.#selectedOptionsIndexes[menuOptionIndex] === index
							? TEXT_FONT_COLORS.SELECTED
							: TEXT_FONT_COLORS.NOT_SELECTED;
					this.#textOptions.add(
						this.add
							.text(420 + 170 * index, 75 + 55 * menuOptionIndex, option, OPTIONS_TEXT_STYLE)
							.setColor(textColor),
					);
				});
			}
		});

		//create volume options
		this.add.rectangle(420, 312, 300, 4, 0xffffff, 1).setOrigin(0, 0.5);
		this.#volumeOptionMenuCursor = this.add
			.rectangle(420 + 73 * this.#volumeValue, 312, 10, 25, 0xff2222, 1)
			.setOrigin(0, 0.5);

		this.#volumeOptionValueText = this.add.text(760, 295, '100%', OPTIONS_TEXT_STYLE);

		//create frame options
		this.#selectedMenuColorTextGameObject = this.add.text(
			590,
			350,
			`${this.#menuColorValue}`,
			OPTIONS_TEXT_STYLE,
		);
		this.add
			.image(530, 352, UI_ASSET_KEYS.CURSOR_WHITE)
			.setOrigin(1, 0)
			.setScale(2.5)
			.setFlipX(true);
		this.add.image(660, 352, UI_ASSET_KEYS.CURSOR_WHITE).setOrigin(0, 0).setScale(2.5);

		//option details container
		this.#infoContainer = this.#nineSliceMainContainer.createNineSliceContainer(
			this,
			optionsMenuWidth,
			100,
			menuBackgrounds[this.#menuColorValue - 1],
		);
		this.#infoContainer.setX(100).setY(height - 110);
		this.#selectedOptionInfoMsgTextGameObject = this.add.text(
			125,
			480,
			menuOptions[this.#selectedOptionMenuIndex].info,
			{
				...OPTIONS_TEXT_STYLE,
				...{ wordWrap: { width: width - 250 } },
			},
		);

		this.#optionsMenuCursor = this.add
			.rectangle(110, 70, optionsMenuWidth - 20, 40, 0xffffff, 0)
			.setOrigin(0)
			.setStrokeStyle(4, 0xe4434a, 1);

		this.#controls = new Controls(this);

		this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
			this.scene.start(SCENE_KEYS.TITLE_SCENE);
		});
	}
	update() {
		if (this.#controls.isInputLock) return;

		if (this.#controls.wasBackKeyPressed()) {
			this.#controls.lockInput = true;
			this.#updateOptionDataInDataManager();
			this.cameras.main.fadeOut(500, 0, 0, 0);
			return;
		}

		if (
			this.#controls.wasSpaceKeyPressed() &&
			this.#selectedOptionMenuIndex === OPTION_MENU_OPTIONS.CONFIRM
		) {
			this.#controls.lockInput = true;
			this.#updateOptionDataInDataManager();
			this.cameras.main.fadeOut(500, 0, 0, 0);
			return;
		}

		const selectedDirection = this.#controls.getDirectionKeyJustPressed();
		if (selectedDirection !== DIRECTION.NONE) {
			this.#moveOptionMenuCursor(selectedDirection);
		}
	}

	/**
	 *
	 * @param {import('../common/direction.js').Direction} direction
	 * @returns {void}
	 */
	#moveOptionMenuCursor(direction) {
		if (direction === DIRECTION.NONE) return;

		this.#updateSelectedOptionMenuFromInput(direction);

		const newCursorY = 70 + 55 * this.#selectedOptionMenuIndex;
		this.#optionsMenuCursor.setY(newCursorY);

		this.#selectedOptionInfoMsgTextGameObject.setText(
			menuOptions[this.#selectedOptionMenuIndex].info,
		);
	}

	/**
	 *
	 * @param {import('../common/direction.js').Direction} direction
	 * @returns {void}
	 */
	#updateSelectedOptionMenuFromInput(direction) {
		if (direction === DIRECTION.NONE) return;
		switch (direction) {
			case DIRECTION.DOWN:
				this.#selectedOptionMenuIndex += 1;
				if (this.#selectedOptionMenuIndex > menuOptions.length - 1) {
					this.#selectedOptionMenuIndex = 0;
				}
				return;
			case DIRECTION.UP:
				this.#selectedOptionMenuIndex -= 1;
				if (this.#selectedOptionMenuIndex < 0) {
					this.#selectedOptionMenuIndex = menuOptions.length - 1;
				}
				return;
			case DIRECTION.RIGHT:
				if (this.#selectedOptionMenuIndex === OPTION_MENU_OPTIONS.CONFIRM) return;
				if (this.#selectedOptionMenuIndex === OPTION_MENU_OPTIONS.MENU_COLOR) {
					this.#menuColorValue = this.#menuColorValue < 3 ? this.#menuColorValue + 1 : 1;
					this.#selectedMenuColorTextGameObject.setText(`${this.#menuColorValue}`);
					this.#updateMenuColor();
					return;
				}
				if (this.#selectedOptionMenuIndex === OPTION_MENU_OPTIONS.VOLUME) {
					this.#volumeValue = this.#volumeValue < 4 ? this.#volumeValue + 1 : 4;
					this.#updateVolumeCursorPosition();
					return;
				}
				if (
					this.#selectedOptionsIndexes[this.#selectedOptionMenuIndex] <
					menuOptions[this.#selectedOptionMenuIndex].options.length - 1
				) {
					this.#selectedOptionsIndexes[this.#selectedOptionMenuIndex] += 1;
					this.#updateSelectedColors();
				}

				return;
			case DIRECTION.LEFT:
				if (this.#selectedOptionMenuIndex === OPTION_MENU_OPTIONS.CONFIRM) return;
				console.log(this.#selectedOptionMenuIndex);
				if (this.#selectedOptionMenuIndex === OPTION_MENU_OPTIONS.MENU_COLOR) {
					this.#menuColorValue = this.#menuColorValue > 1 ? this.#menuColorValue - 1 : 3;
					this.#selectedMenuColorTextGameObject.setText(`${this.#menuColorValue}`);
					this.#updateMenuColor();
					return;
				}
				if (this.#selectedOptionMenuIndex === OPTION_MENU_OPTIONS.VOLUME) {
					this.#volumeValue = this.#volumeValue > 0 ? this.#volumeValue - 1 : 0;
					this.#updateVolumeCursorPosition();
					return;
				}
				if (this.#selectedOptionsIndexes[this.#selectedOptionMenuIndex] > 0) {
					this.#selectedOptionsIndexes[this.#selectedOptionMenuIndex] -= 1;
					this.#updateSelectedColors();
				}
				return;
			default:
				exhaustiveGuard(direction);
		}

		return;
	}

	#updateSelectedColors() {
		menuOptions.forEach((menuOption, menuOptionIndex) => {
			if (menuOption.options) {
				menuOption.options.forEach((option, index) => {
					const textColor =
						this.#selectedOptionsIndexes[menuOptionIndex] === index
							? TEXT_FONT_COLORS.SELECTED
							: TEXT_FONT_COLORS.NOT_SELECTED;

					const textGameObjectsArray = /** @type {Phaser.GameObjects.Text[]} */ (
						this.#textOptions.getChildren()
					);
					textGameObjectsArray.forEach((textGameObject) => {
						if (textGameObject.text === option && textGameObject.y === 75 + 55 * menuOptionIndex) {
							textGameObject.setColor(textColor);
						}
					});
				});
			}
		});
	}

	#updateMenuColor() {
		this.#nineSliceMainContainer.updateNineSliceContainerTexture(
			this.sys.textures,
			this.#mainContainer,
			menuBackgrounds[this.#menuColorValue - 1],
		);
		this.#nineSliceMainContainer.updateNineSliceContainerTexture(
			this.sys.textures,
			this.#infoContainer,
			menuBackgrounds[this.#menuColorValue - 1],
		);
	}
	#updateVolumeCursorPosition() {
		this.#volumeOptionMenuCursor.setX(420 + 73 * this.#volumeValue);
		this.#volumeOptionValueText.setText(`${25 * this.#volumeValue}%`);
	}

	#updateOptionDataInDataManager() {
		dataManager.store.set({
			[DATA_MANAGER_STORE_KEYS.OPTIONS_TEXT_SPEED]: this.#selectedOptionsIndexes[0],
			[DATA_MANAGER_STORE_KEYS.OPTIONS_BATTLE_SCENE_ANIMATIONS]: this.#selectedOptionsIndexes[1],
			[DATA_MANAGER_STORE_KEYS.OPTIONS_BATTLE_STYLE]: this.#selectedOptionsIndexes[2],
			[DATA_MANAGER_STORE_KEYS.OPTIONS_SOUND]: this.#selectedOptionsIndexes[3],
			[DATA_MANAGER_STORE_KEYS.OPTIONS_VOLUME]: this.#volumeValue,
			[DATA_MANAGER_STORE_KEYS.OPTIONS_MENU_COLOR]: this.#menuColorValue,
		});
		dataManager.saveData();
	}
}
