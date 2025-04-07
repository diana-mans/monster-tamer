import { MONSTER_ASSET_KEYS, UI_ASSET_KEYS } from '../../../assets/asset-keys.js';
import { DIRECTION } from '../../../common/direction.js';
import Phaser from '../../../lib/phaser.js';
import { exhaustiveGuard } from '../../../utils/guard.js';
import { PlayerBattleMonster } from '../../monsters/player-battle-monster.js';
import { BATTLE_UI_TEXT_STYLE } from './battle-menu-config.js';
import {
	ACTIVE_BATTE_MENU,
	ATTACK_MOVE_OPTIONS,
	BATTLE_MENU_OPTIONS,
} from './battle-menu-options.js';

const BATTLE_MENU_CURSOR_POS = Object.freeze({ x: 42, y: 38 });
const ATTACK_MENU_CURSOR_POS = Object.freeze({ x: 42, y: 38 });

const PLAYER_INPUT_CURSOR_POS = Object.freeze({ y: 488 });

export class BattleMenu {
	/** @type {Phaser.Scene} */
	#scene;
	/** @type {Phaser.GameObjects.Container} */
	#mainBattleMenuPhaserContainerGameObject;
	/** @type {Phaser.GameObjects.Container} */
	#moveSelectionSubBattleMenuPhaserContainerGameObject;
	/** @type {Phaser.GameObjects.Text} */
	#battleTextGameObjectLine1;
	/** @type {Phaser.GameObjects.Text} */
	#battleTextGameObjectLine2;

	/** @type {Phaser.GameObjects.Image} */
	#mainBattleMenuCursorPhaserImageGameObject;
	/** @type {Phaser.GameObjects.Image} */
	#attackBattleMenuCursorPhaserImageGameObject;

	/** @type {import('./battle-menu-options.js').BattleMenuOptions} */
	#selectedBattleMenuOption;

	/** @type {import('./battle-menu-options.js').AttackMoveOptions} */
	#selectedAttackMenuOption;

	/** @type {import('./battle-menu-options.js').ActiveBattleMenu} */
	#activeBattleMenu;

	/** @type {string[]} */
	#queuedInfoPanelMessages;
	/** @type {() => void | undefined} */
	#queuedInfoPanelCallback;
	/** @type {boolean} */
	#waitingForPlayerInput;

	/** @type {number | undefined} */
	#selectedAttackIndex;

	/** @type {PlayerBattleMonster} */
	#activePlayerMonster;

	/** @type {Phaser.GameObjects.Image} */
	#userInputCursorPhaserImageGameObject;

	/** @type {Phaser.Tweens.Tween} */
	#userInputCursorPhaserTween;

	/**
	 * @param {Phaser.Scene} scene the Phaser 3 Scene the battle menu will be added to
	 * @param {PlayerBattleMonster} activePlayerMonster
	 */
	constructor(scene, activePlayerMonster) {
		this.#scene = scene;
		this.#activePlayerMonster = activePlayerMonster;
		this.#activeBattleMenu = ACTIVE_BATTE_MENU.BATTLE_MAIN;
		this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FIGHT;
		this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_1;
		this.#queuedInfoPanelCallback = undefined;
		this.#queuedInfoPanelMessages = [];
		this.#waitingForPlayerInput = false;
		this.#selectedAttackIndex = undefined;
		this.#createMainInfoPane();
		this.#createMainBattleMenu();
		this.#createMonsterAttackSubMenu();
		this.#createPlayerInputCursor();
	}

	//геттер, к котрому можно обращаться просто как к свойству, он позволяет выполнять код и возвращать приватное свойство (инкапсуляция)
	/** @type {number | undefined} */
	get selectedAttack() {
		if (this.#activeBattleMenu === ACTIVE_BATTE_MENU.BATTLE_MOVE_SELECT)
			return this.#selectedAttackIndex;
		return undefined;
	}

	showMainBattleMenu() {
		this.#activeBattleMenu = ACTIVE_BATTE_MENU.BATTLE_MAIN;
		this.#battleTextGameObjectLine1.setText('what should');
		this.#mainBattleMenuPhaserContainerGameObject.setAlpha(1);
		this.#battleTextGameObjectLine1.setAlpha(1);
		this.#battleTextGameObjectLine2.setAlpha(1);
		this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FIGHT;
		this.#mainBattleMenuCursorPhaserImageGameObject.setPosition(
			BATTLE_MENU_CURSOR_POS.x,
			BATTLE_MENU_CURSOR_POS.y,
		);
		this.#selectedAttackIndex = undefined;
	}

	hideMainBattleMenu() {
		this.#mainBattleMenuPhaserContainerGameObject.setAlpha(0);
		this.#battleTextGameObjectLine1.setAlpha(0);
		this.#battleTextGameObjectLine2.setAlpha(0);
	}

	showMonsterAttackSubMenu() {
		this.#activeBattleMenu = ACTIVE_BATTE_MENU.BATTLE_MOVE_SELECT;
		this.#moveSelectionSubBattleMenuPhaserContainerGameObject.setAlpha(1);
		this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_1;
		this.#attackBattleMenuCursorPhaserImageGameObject.setPosition(
			ATTACK_MENU_CURSOR_POS.x,
			ATTACK_MENU_CURSOR_POS.y,
		);
	}

	hideMonsterAttackSubMenu() {
		this.#activeBattleMenu = ACTIVE_BATTE_MENU.BATTLE_MAIN;
		this.#moveSelectionSubBattleMenuPhaserContainerGameObject.setAlpha(0);
	}

	playerInputCursorAnimation() {
		this.#userInputCursorPhaserImageGameObject.setPosition(
			this.#battleTextGameObjectLine1.displayWidth +
				this.#userInputCursorPhaserImageGameObject.displayWidth * 2.7,
			this.#userInputCursorPhaserImageGameObject.y,
		);
		this.#userInputCursorPhaserImageGameObject.setAlpha(1);
		this.#userInputCursorPhaserTween.restart();
	}

	hideInputCursor() {
		this.#userInputCursorPhaserImageGameObject.setAlpha(0);
		this.#userInputCursorPhaserTween.pause();
	}

	/**
	 *
	 * @param {'OK'|'CANCEL'|DIRECTION} input
	 */
	handlePlayerInput(input) {
		if (this.#waitingForPlayerInput && (input === 'CANCEL' || input === 'OK')) {
			this.#updateInfoPanelWithMessage();
			return;
		}
		if (input === 'CANCEL') {
			this.#switchToMainBattleMenu();
			return;
		}
		if (input === 'OK') {
			if (this.#activeBattleMenu === ACTIVE_BATTE_MENU.BATTLE_MAIN) {
				this.#handlePlayerChooseMainBattleOption();
				return;
			}
			if (this.#activeBattleMenu === ACTIVE_BATTE_MENU.BATTLE_MOVE_SELECT) {
				this.#handlePlayerChooseAttack();
				return;
			}

			return;
		}
		this.#updateSelectedBattleMenuOption(input);
		this.#moveMainBattleMenuCursor();
		this.#updateSelectedMoveMenuOption(input);
		this.#moveAttackBattleMenuCursor();
	}

	/**
	 *
	 * @param {string[]} messages
	 * @param {() => void} [callback]
	 */
	updateInfoPanelMessagesAndWaitForInput(messages, callback) {
		this.#queuedInfoPanelMessages = messages;
		this.#queuedInfoPanelCallback = callback;

		this.#updateInfoPanelWithMessage();
	}

	/**
	 *
	 * @param {string} message
	 * @param {() => void} [callback]
	 */
	updateInfoPanelMessageNoInputRequired(message, callback) {
		this.#battleTextGameObjectLine1.setText('').setAlpha(1);

		//TODO animate message
		this.#battleTextGameObjectLine1.setText(message);
		this.#waitingForPlayerInput = false;
		if (callback) {
			callback();
		}
		// this.#waitingForPlayerInput = true;
	}

	#updateInfoPanelWithMessage() {
		this.#waitingForPlayerInput = false;
		this.#battleTextGameObjectLine1.setText('').setAlpha(1);
		this.hideInputCursor();

		//check if all messages have been dispayed from the queue and call the callback
		if (this.#queuedInfoPanelMessages.length === 0) {
			if (this.#queuedInfoPanelCallback) {
				this.#queuedInfoPanelCallback();
				this.#queuedInfoPanelCallback = undefined;
			}
			return;
		}

		//get first message from queue and animate
		const messageToDisplay = this.#queuedInfoPanelMessages.shift();
		this.#battleTextGameObjectLine1.setText(messageToDisplay);
		this.#waitingForPlayerInput = true;
		this.playerInputCursorAnimation();
	}

	#createMainBattleMenu() {
		this.#battleTextGameObjectLine1 = this.#scene.add.text(
			20,
			468,
			`what should`,
			BATTLE_UI_TEXT_STYLE,
		);

		this.#battleTextGameObjectLine2 = this.#scene.add.text(
			20,
			512,
			`${this.#activePlayerMonster.name} do next`,
			BATTLE_UI_TEXT_STYLE,
		);

		this.#mainBattleMenuCursorPhaserImageGameObject = this.#scene.add
			.image(BATTLE_MENU_CURSOR_POS.x, BATTLE_MENU_CURSOR_POS.y, UI_ASSET_KEYS.CURSOR, 0)
			.setOrigin(0.5)
			.setScale(2.5);

		this.#mainBattleMenuPhaserContainerGameObject = this.#scene.add.container(520, 448, [
			this.#createMainInfoSubPane(),
			this.#scene.add.text(55, 22, BATTLE_MENU_OPTIONS.FIGHT, BATTLE_UI_TEXT_STYLE),
			this.#scene.add.text(240, 22, BATTLE_MENU_OPTIONS.SWITCH, BATTLE_UI_TEXT_STYLE),
			this.#scene.add.text(55, 70, BATTLE_MENU_OPTIONS.ITEM, BATTLE_UI_TEXT_STYLE),
			this.#scene.add.text(240, 70, BATTLE_MENU_OPTIONS.FLEE, BATTLE_UI_TEXT_STYLE),
			this.#mainBattleMenuCursorPhaserImageGameObject,
		]);
		this.hideMainBattleMenu();
	}
	#createMonsterAttackSubMenu() {
		this.#attackBattleMenuCursorPhaserImageGameObject = this.#scene.add
			.image(ATTACK_MENU_CURSOR_POS.x, ATTACK_MENU_CURSOR_POS.y, UI_ASSET_KEYS.CURSOR, 0)
			.setOrigin(0.5)
			.setScale(2.5);

		/** @type {string[]} */
		const attackNames = [];

		for (let i = 0; i < 4; i++) {
			const attackName = this.#activePlayerMonster.attacks[i]?.name || '-';
			attackNames.push(attackName);
		}

		this.#moveSelectionSubBattleMenuPhaserContainerGameObject = this.#scene.add.container(0, 448, [
			this.#scene.add.text(55, 22, attackNames[0], BATTLE_UI_TEXT_STYLE),
			this.#scene.add.text(240, 22, attackNames[1], BATTLE_UI_TEXT_STYLE),
			this.#scene.add.text(55, 70, attackNames[2], BATTLE_UI_TEXT_STYLE),
			this.#scene.add.text(240, 70, attackNames[3], BATTLE_UI_TEXT_STYLE),
			this.#attackBattleMenuCursorPhaserImageGameObject,
		]);
		this.hideMonsterAttackSubMenu();
	}
	#createMainInfoPane() {
		const padding = 4;
		const rectHeight = 124;
		this.#scene.add
			.rectangle(
				padding,
				this.#scene.scale.height - rectHeight - padding,
				this.#scene.scale.width - padding * 2,
				rectHeight,
				0xede4f3,
				1,
			)
			.setOrigin(0)
			.setStrokeStyle(8, 0xe4434a, 1);
	}

	#createMainInfoSubPane() {
		const rectWidth = 500;
		const rectHeight = 124;
		return this.#scene.add
			.rectangle(0, 0, rectWidth, rectHeight, 0xede4f3, 1)
			.setOrigin(0)
			.setStrokeStyle(8, 0x905ac2, 1);
	}
	/**
	 *
	 * @param {DIRECTION} direction
	 */
	#updateSelectedBattleMenuOption(direction) {
		if (this.#activeBattleMenu !== ACTIVE_BATTE_MENU.BATTLE_MAIN) {
			return;
		}
		if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.FIGHT) {
			switch (direction) {
				case DIRECTION.RIGHT:
					this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.SWITCH;
					return;
				case DIRECTION.DOWN:
					this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.ITEM;
					return;
				case DIRECTION.LEFT:
				case DIRECTION.UP:
				case DIRECTION.NONE:
					return;
				default:
					exhaustiveGuard(direction);
			}
			return;
		}

		if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.SWITCH) {
			switch (direction) {
				case DIRECTION.LEFT:
					this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FIGHT;
					return;
				case DIRECTION.DOWN:
					this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FLEE;
					return;
				case DIRECTION.RIGHT:
				case DIRECTION.UP:
				case DIRECTION.NONE:
					return;
				default:
					exhaustiveGuard(direction);
			}
			return;
		}
		if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.FLEE) {
			switch (direction) {
				case DIRECTION.LEFT:
					this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.ITEM;
					return;
				case DIRECTION.UP:
					this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.SWITCH;
					return;
				case DIRECTION.RIGHT:
				case DIRECTION.DOWN:
				case DIRECTION.NONE:
					return;
				default:
					exhaustiveGuard(direction);
			}
			return;
		}
		if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.ITEM) {
			switch (direction) {
				case DIRECTION.RIGHT:
					this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FLEE;
					return;
				case DIRECTION.UP:
					this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FIGHT;
					return;
				case DIRECTION.LEFT:
				case DIRECTION.DOWN:
				case DIRECTION.NONE:
					return;
				default:
					exhaustiveGuard(direction);
			}
			return;
		}
		exhaustiveGuard(this.#selectedBattleMenuOption);
	}

	#moveMainBattleMenuCursor() {
		if (this.#activeBattleMenu !== ACTIVE_BATTE_MENU.BATTLE_MAIN) {
			return;
		}
		switch (this.#selectedBattleMenuOption) {
			case BATTLE_MENU_OPTIONS.FIGHT:
				this.#mainBattleMenuCursorPhaserImageGameObject.setPosition(
					BATTLE_MENU_CURSOR_POS.x,
					BATTLE_MENU_CURSOR_POS.y,
				);
				return;
			case BATTLE_MENU_OPTIONS.SWITCH:
				this.#mainBattleMenuCursorPhaserImageGameObject.setPosition(228, BATTLE_MENU_CURSOR_POS.y);
				return;
			case BATTLE_MENU_OPTIONS.ITEM:
				this.#mainBattleMenuCursorPhaserImageGameObject.setPosition(BATTLE_MENU_CURSOR_POS.x, 86);
				return;
			case BATTLE_MENU_OPTIONS.FLEE:
				this.#mainBattleMenuCursorPhaserImageGameObject.setPosition(228, 86);
				return;
			default:
				exhaustiveGuard(this.#selectedBattleMenuOption);
		}
		return;
	}

	/**
	 *
	 * @param {DIRECTION} direction
	 */
	#updateSelectedMoveMenuOption(direction) {
		if (this.#activeBattleMenu !== ACTIVE_BATTE_MENU.BATTLE_MOVE_SELECT) {
			return;
		}
		if (this.#selectedAttackMenuOption === ATTACK_MOVE_OPTIONS.MOVE_1) {
			switch (direction) {
				case DIRECTION.RIGHT:
					this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_2;
					return;
				case DIRECTION.DOWN:
					this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_3;
					return;
				case DIRECTION.LEFT:
				case DIRECTION.UP:
				case DIRECTION.NONE:
					return;
				default:
					exhaustiveGuard(direction);
			}
			return;
		}
		if (this.#selectedAttackMenuOption === ATTACK_MOVE_OPTIONS.MOVE_2) {
			switch (direction) {
				case DIRECTION.LEFT:
					this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_1;
					return;
				case DIRECTION.DOWN:
					this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_4;
					return;
				case DIRECTION.RIGHT:
				case DIRECTION.UP:
				case DIRECTION.NONE:
					return;
				default:
					exhaustiveGuard(direction);
			}
			return;
		}
		if (this.#selectedAttackMenuOption === ATTACK_MOVE_OPTIONS.MOVE_3) {
			switch (direction) {
				case DIRECTION.RIGHT:
					this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_4;
					return;
				case DIRECTION.UP:
					this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_1;
					return;
				case DIRECTION.LEFT:
				case DIRECTION.DOWN:
				case DIRECTION.NONE:
					return;
				default:
					exhaustiveGuard(direction);
			}
			return;
		}
		if (this.#selectedAttackMenuOption === ATTACK_MOVE_OPTIONS.MOVE_4) {
			switch (direction) {
				case DIRECTION.LEFT:
					this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_3;
					return;
				case DIRECTION.UP:
					this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_2;
					return;
				case DIRECTION.RIGHT:
				case DIRECTION.DOWN:
				case DIRECTION.NONE:
					return;
				default:
					exhaustiveGuard(direction);
			}
			return;
		}
		exhaustiveGuard(this.#selectedAttackMenuOption);
	}

	#moveAttackBattleMenuCursor() {
		if (this.#activeBattleMenu !== ACTIVE_BATTE_MENU.BATTLE_MOVE_SELECT) {
			return;
		}
		switch (this.#selectedAttackMenuOption) {
			case ATTACK_MOVE_OPTIONS.MOVE_1:
				this.#attackBattleMenuCursorPhaserImageGameObject.setPosition(
					ATTACK_MENU_CURSOR_POS.x,
					ATTACK_MENU_CURSOR_POS.y,
				);
				return;
			case ATTACK_MOVE_OPTIONS.MOVE_2:
				this.#attackBattleMenuCursorPhaserImageGameObject.setPosition(
					228,
					ATTACK_MENU_CURSOR_POS.y,
				);
				return;
			case ATTACK_MOVE_OPTIONS.MOVE_3:
				this.#attackBattleMenuCursorPhaserImageGameObject.setPosition(ATTACK_MENU_CURSOR_POS.x, 86);
				return;
			case ATTACK_MOVE_OPTIONS.MOVE_4:
				this.#attackBattleMenuCursorPhaserImageGameObject.setPosition(228, 86);
				return;
			default:
				exhaustiveGuard(this.#selectedAttackMenuOption);
		}
		return;
	}

	#switchToMainBattleMenu() {
		this.#waitingForPlayerInput = false;
		this.hideInputCursor();
		this.hideMonsterAttackSubMenu();
		this.showMainBattleMenu();
	}

	#handlePlayerChooseMainBattleOption() {
		this.hideMainBattleMenu();
		if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.FIGHT) {
			this.showMonsterAttackSubMenu();
			return;
		}
		if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.ITEM) {
			this.updateInfoPanelMessagesAndWaitForInput(['Your bag is empty...'], () => {
				this.#switchToMainBattleMenu();
			});
			this.#activeBattleMenu = ACTIVE_BATTE_MENU.BATTLE_ITEM;

			// TODO
			return;
		}
		if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.SWITCH) {
			this.updateInfoPanelMessagesAndWaitForInput(
				['You have no other monsters in your party...'],
				() => {
					this.#switchToMainBattleMenu();
				},
			);
			this.#activeBattleMenu = ACTIVE_BATTE_MENU.BATTLE_SWITCH;
			// TODO
			return;
		}
		if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.FLEE) {
			this.updateInfoPanelMessagesAndWaitForInput(['You fail to run away...'], () => {
				this.#switchToMainBattleMenu();
			});
			this.#activeBattleMenu = ACTIVE_BATTE_MENU.BATTLE_FLEE;
			// TODO
			return;
		}
		exhaustiveGuard(this.#selectedBattleMenuOption);
	}
	#handlePlayerChooseAttack() {
		let selectedAttackIndex = 0;

		switch (this.#selectedAttackMenuOption) {
			case ATTACK_MOVE_OPTIONS.MOVE_1:
				selectedAttackIndex = 0;
				break;
			case ATTACK_MOVE_OPTIONS.MOVE_2:
				selectedAttackIndex = 1;
				break;
			case ATTACK_MOVE_OPTIONS.MOVE_3:
				selectedAttackIndex = 2;
				break;
			case ATTACK_MOVE_OPTIONS.MOVE_4:
				selectedAttackIndex = 3;
				break;
			default:
				exhaustiveGuard(this.#selectedAttackMenuOption);
		}
		this.#selectedAttackIndex = selectedAttackIndex;
	}

	#createPlayerInputCursor() {
		this.#userInputCursorPhaserImageGameObject = this.#scene.add.image(0, 0, UI_ASSET_KEYS.CURSOR);
		this.#userInputCursorPhaserImageGameObject.setAngle(90).setScale(2.5, 1.25);
		this.#userInputCursorPhaserImageGameObject.setAlpha(0);

		this.#userInputCursorPhaserTween = this.#scene.add.tween({
			delay: 0,
			duration: 500,
			repeat: -1,
			y: {
				from: PLAYER_INPUT_CURSOR_POS.y,
				start: PLAYER_INPUT_CURSOR_POS.y,
				to: PLAYER_INPUT_CURSOR_POS.y + 6,
			},
			targets: this.#userInputCursorPhaserImageGameObject,
		});

		this.#userInputCursorPhaserTween.pause();
	}
}
