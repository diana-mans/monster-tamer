import { BATTLE_ASSET_KEYS, MONSTER_ASSET_KEYS } from '../assets/asset-keys.js';
import { Background } from '../battle/background.js';
import { EnemyBattleMonster } from '../battle/monsters/enemy-battle-monster.js';
import { PlayerBattleMonster } from '../battle/monsters/player-battle-monster.js';
import { HealthBar } from '../battle/ui/health-bar.js';
import { BattleMenu } from '../battle/ui/menu/battle-menu.js';
import { DIRECTION } from '../common/direction.js';
import Phaser from '../lib/phaser.js';
import { StateMachine } from '../utils/state-machine.js';
import { SCENE_KEYS } from './scene-keys.js';

const BATTLE_STATES = Object.freeze({
	INTRO: 'INTRO',
	PRE_BATTLE_INFO: 'PRE_BATTLE_INFO', //анимация
	BRING_OUT_MONSTER: 'BRING_OUT_MONSTER', //анимация здоровья монстра
	PLAYER_INPUT: 'PLAYER_INPUT', //меню боя, ожидание действий игрока
	ENEMY_INPUT: 'ENEMY_INPUT', //противник выбирает атаку
	BATTLE: 'BATTLE', //определние урона
	POST_ATTACK_CHECK: 'POST_ATTACK_CHECK', //умер, сбежал или переключился
	FINISHED: 'FINISHED', //завершаем бой
	FLEE_ATTEMPT: 'FLEE_ATTEMPT', //попытка сбежать
});

export class BattleScene extends Phaser.Scene {
	/** @type {BattleMenu} */
	#battleMenu;

	/** @type {Phaser.Types.Input.Keyboard.CursorKeys} */
	#cursorKeys;

	/** @type {EnemyBattleMonster} */
	#activeEnemyMonster;

	/** @type {PlayerBattleMonster} */
	#activePlayerMonster;

	/** @type {number} */
	#activePlayerAttackIndex;

	/** @type {StateMachine} */
	#battleStateMachine;

	constructor() {
		super({
			key: SCENE_KEYS.BATTLE_SCENE,
		});
	}

	init() {
		this.#activePlayerAttackIndex = -1;
	}

	// Создание объектов и размещение их на сцене
	create() {
		//create main bg
		const background = new Background(this);
		background.showForest();
		//рендерим игрока и врага
		this.#activeEnemyMonster = new EnemyBattleMonster({
			scene: this,
			monsterDetails: {
				name: MONSTER_ASSET_KEYS.CARNODUSK,
				assetKey: MONSTER_ASSET_KEYS.CARNODUSK,
				assetFrame: 0,
				currentHp: 25,
				maxHp: 25,
				baseAttack: 15,
				attackIds: [1],
				currentLevel: 5,
			},
		});
		this.#activePlayerMonster = new PlayerBattleMonster({
			scene: this,
			monsterDetails: {
				name: MONSTER_ASSET_KEYS.IGUANIGNITE,
				assetKey: MONSTER_ASSET_KEYS.IGUANIGNITE,
				assetFrame: 0,
				currentHp: 25,
				maxHp: 25,
				baseAttack: 5,
				attackIds: [2],
				currentLevel: 5,
			},
		});

		//рендерим осн и доп инф-ые панели
		this.#battleMenu = new BattleMenu(this, this.#activePlayerMonster);

		this.#createBattleStateMachine();

		this.#cursorKeys = this.input.keyboard.createCursorKeys();
	}

	update() {
		this.#battleStateMachine.update();
		const wasSpaceKeyPressed = Phaser.Input.Keyboard.JustDown(this.#cursorKeys.space);

		//limit input based on the current battle state we ar in
		//if we are not in the right battle state, return early and do not process input

		if (
			wasSpaceKeyPressed &&
			(this.#battleStateMachine.currentStateName === BATTLE_STATES.PRE_BATTLE_INFO ||
				this.#battleStateMachine.currentStateName === BATTLE_STATES.POST_ATTACK_CHECK ||
				this.#battleStateMachine.currentStateName === BATTLE_STATES.FLEE_ATTEMPT)
		) {
			this.#battleMenu.handlePlayerInput('OK');
			return;
		}

		if (this.#battleStateMachine.currentStateName !== BATTLE_STATES.PLAYER_INPUT) {
			return;
		}

		if (wasSpaceKeyPressed) {
			this.#battleMenu.handlePlayerInput('OK');

			//check if the player selected an attack, and update display text
			if (this.#battleMenu.selectedAttack === undefined) return;

			this.#activePlayerAttackIndex = this.#battleMenu.selectedAttack;

			if (!this.#activePlayerMonster.attacks[this.#activePlayerAttackIndex]) {
				return;
			}
			console.log('PLayer selected the following move:', this.#battleMenu.selectedAttack);

			this.#battleMenu.hideMonsterAttackSubMenu();
			this.#battleStateMachine.setState(BATTLE_STATES.ENEMY_INPUT);
		}
		if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.shift)) {
			this.#battleMenu.handlePlayerInput('CANCEL');
			return;
		}

		/** @type {DIRECTION} */
		let selectedDirection = DIRECTION.NONE;
		if (this.#cursorKeys.left.isDown) {
			selectedDirection = DIRECTION.LEFT;
		} else if (this.#cursorKeys.right.isDown) {
			selectedDirection = DIRECTION.RIGHT;
		} else if (this.#cursorKeys.down.isDown) {
			selectedDirection = DIRECTION.DOWN;
		} else if (this.#cursorKeys.up.isDown) {
			selectedDirection = DIRECTION.UP;
		}

		if (selectedDirection !== DIRECTION.NONE) {
			this.#battleMenu.handlePlayerInput(selectedDirection);
		}
	}

	#playerAttack() {
		this.#battleMenu.updateInfoPanelMessageNoInputRequired(
			`${this.#activePlayerMonster.name} used ${
				this.#activePlayerMonster.attacks[this.#activePlayerAttackIndex].name
			}`,

			() => {
				this.time.delayedCall(500, () => {
					this.#activeEnemyMonster.playTakeDamageAnimation(() => {
						this.#activeEnemyMonster.takeDamage(this.#activePlayerMonster.baseAttack, () => {
							this.#enemyAttack();
						});
					});
				});
			},
		);
	}

	#enemyAttack() {
		if (this.#activeEnemyMonster.isFainted) {
			this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK_CHECK);
			return;
		}
		this.#battleMenu.updateInfoPanelMessageNoInputRequired(
			`for ${this.#activeEnemyMonster.name} used ${this.#activeEnemyMonster.attacks[0].name}`,
			() => {
				this.time.delayedCall(500, () => {
					this.#activePlayerMonster.playTakeDamageAnimation(() => {
						this.#activePlayerMonster.takeDamage(this.#activeEnemyMonster.baseAttack, () => {
							this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK_CHECK);
						});
					});
				});
			},
		);
	}
	#postBattleSequenceCheck() {
		if (this.#activeEnemyMonster.isFainted) {
			this.#activeEnemyMonster.playDeathAnimation(() => {
				this.#battleMenu.updateInfoPanelMessagesAndWaitForInput(
					[`Wild ${this.#activeEnemyMonster.name} fainted`, `You have gained some experience`],
					() => {
						this.#battleStateMachine.setState(BATTLE_STATES.FINISHED);
					},
				);
			});
			return;
		}
		if (this.#activePlayerMonster.isFainted) {
			this.#activePlayerMonster.playDeathAnimation(() => {
				this.#battleMenu.updateInfoPanelMessagesAndWaitForInput(
					[
						`${this.#activeEnemyMonster.name} fainted`,
						`You have no more monsters, escaping to safety...`,
					],
					() => {
						this.#battleStateMachine.setState(BATTLE_STATES.FINISHED);
					},
				);
			});
			return;
		}
		this.#battleMenu.showMainBattleMenu();
		this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_INPUT);
	}
	#transitionToNextScene() {
		this.cameras.main.fadeOut(600, 0, 0, 0);
		this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
			this.scene.start(SCENE_KEYS.BATTLE_SCENE);
		});
	}
	#createBattleStateMachine() {
		//Создаем контроллер состояния
		this.#battleStateMachine = new StateMachine('battle', this);

		//Добавляем различные состояния
		this.#battleStateMachine.addState({
			name: BATTLE_STATES.INTRO,
			onEnter: () => {
				//Ожидаем завершения настройки сцены и всех переходов (имитация)
				this.time.delayedCall(1200, () => {
					this.#battleStateMachine.setState(BATTLE_STATES.PRE_BATTLE_INFO);
				});
			},
		});
		this.#battleStateMachine.addState({
			name: BATTLE_STATES.PRE_BATTLE_INFO,
			onEnter: () => {
				//Дожидаемся появления вражеского монстра и сообщаем игроку о нем
				this.#activeEnemyMonster.playMonsterAppearAnimation(() => {
					this.#activeEnemyMonster.playHealthBarAppearAnimation(() => undefined);
					this.#battleMenu.updateInfoPanelMessagesAndWaitForInput(
						[`wild ${this.#activeEnemyMonster.name} appeared!`],
						() => {
							//типа ждем окончания анимации текста
							this.#battleStateMachine.setState(BATTLE_STATES.BRING_OUT_MONSTER);
						},
					);
				});
			},
		});
		this.#battleStateMachine.addState({
			name: BATTLE_STATES.BRING_OUT_MONSTER,
			onEnter: () => {
				//Дожидаемся появления монстра игрока и сообщаем игроку о нем
				this.#activePlayerMonster.playMonsterAppearAnimation(() => {
					this.#activePlayerMonster.playHealthBarAppearAnimation(() => undefined);
					this.#battleMenu.updateInfoPanelMessageNoInputRequired(
						`go ${this.#activePlayerMonster.name}!`,
						() => {
							//типа ждем окончания анимации текста
							this.time.delayedCall(1200, () => {
								this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_INPUT);
							});
						},
					);
				});
			},
		});
		this.#battleStateMachine.addState({
			name: BATTLE_STATES.PLAYER_INPUT,
			onEnter: () => {
				this.#battleMenu.showMainBattleMenu();
			},
		});
		this.#battleStateMachine.addState({
			name: BATTLE_STATES.ENEMY_INPUT,
			onEnter: () => {
				//TODO выбираем случайное действия для вражеского монстра
				this.#battleStateMachine.setState(BATTLE_STATES.BATTLE);
			},
		});
		this.#battleStateMachine.addState({
			name: BATTLE_STATES.BATTLE,
			onEnter: () => {
				//general battle flow
				//show attack used, brief pause
				//then play attack animation, brief pause
				//then play damage animation, brief pause
				//then play health bar animation, brief pause
				//repeate the steps above for the other monster

				this.#playerAttack();
			},
		});
		this.#battleStateMachine.addState({
			name: BATTLE_STATES.POST_ATTACK_CHECK,
			onEnter: () => {
				this.#postBattleSequenceCheck();
			},
		});
		this.#battleStateMachine.addState({
			name: BATTLE_STATES.FINISHED,
			onEnter: () => {
				this.#transitionToNextScene();
			},
		});
		this.#battleStateMachine.addState({
			name: BATTLE_STATES.FLEE_ATTEMPT,
			onEnter: () => {
				this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`You got away safely!`], () => {
					this.#battleStateMachine.setState(BATTLE_STATES.FINISHED);
				});
			},
		});

		//Запускаем контроллер состояний
		this.#battleStateMachine.setState('INTRO');
	}
}
