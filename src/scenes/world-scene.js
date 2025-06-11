import Phaser from '../lib/phaser.js';
import { SCENE_KEYS } from './scene-keys.js';
import { WORLD_ASSET_KEYS } from '../assets/asset-keys.js';
import { Player } from '../world/characters/player.js';
import { Controls } from '../utils/controls.js';
import { DIRECTION } from '../common/direction.js';
import { TILE_SIZE, TILED_COLLISION_LAYER_ALPHA } from '../config.js';
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../utils/data-manager.js';
import { getTargetPositionFromGameObjectPositionAndDirection } from '../utils/grid-utils.js';
import { CANNOT_READ_SIGN_TEXT, SAMPLE_TEXT } from '../utils/text-utils.js';
import { DialogUi } from '../world/dialog-ui.js';
import { NPC } from '../world/characters/npc.js';

/**
 * @typedef TiledObjectProperty
 * @type {object}
 * @property {string} name
 * @property {string} type
 * @property {any} value
 */

const TILED_SIGN_PROPERTY = Object.freeze({
	MESSAGE: 'message',
});

const CUSTOM_TILED_TYPES = Object.freeze({
	NPC: 'npc',
	NPC_PATH: 'npc_path',
});

const TILED_NPC_PROPERTY = Object.freeze({
	IS_SPAW_POINT: 'is_spawn_point',
	MOVEMENT_PATTERN: 'movement_pattern',
	MESSAGES: 'messages',
	FRAME: 'frame',
});

export class WorldScene extends Phaser.Scene {
	/** @type {Player} */
	#player;
	/** @type {Controls} */
	#controls;
	/** @type {Phaser.Tilemaps.TilemapLayer} */
	#encounterLayer;
	/** @type {boolean} */
	#wildMonsterEncountered;
	/** @type {Phaser.Tilemaps.ObjectLayer} */
	#signLayer;
	/** @type {DialogUi} */
	#dialogUi;
	/** @type {NPC[]} */
	#npcs;

	constructor() {
		super({
			key: SCENE_KEYS.WORLD_SCENE,
		});
	}

	init() {
		this.#wildMonsterEncountered = false;
	}

	create() {
		console.log(`[${WorldScene.name}:create] invoked`);

		//Ставим границы для камеры, чтобы за пределы не выходило, когда мы перемещаем игрока
		this.cameras.main.setBounds(0, 0, 1280, 2176);
		this.cameras.main.setZoom(0.8);

		//создаем карту из json файла, чтобы удобно было пользоваться
		const map = this.make.tilemap({ key: WORLD_ASSET_KEYS.WORLD_MAIN_LEVEL });

		//добавляем изображение, которое будет использоваться для визуализации элементов столкновения
		const collisionTiles = map.addTilesetImage('collision', WORLD_ASSET_KEYS.WORLD_COLLISION);
		if (!collisionTiles) {
			console.log(
				`[${WorldScene.name}:create] encountered error while creating collision tileset using data from tiled`,
			);
			return;
		}

		//ищем все элементы с именем Collision и создаем из этого слой (авитоматически будет рисоваться)
		const collisionLayer = map.createLayer('Collision', collisionTiles, 0, 0);
		if (!collisionLayer) {
			console.log(
				`[${WorldScene.name}:create] encountered error while creating collision layer using data from tiled`,
			);
			return;
		}
		collisionLayer.setAlpha(TILED_COLLISION_LAYER_ALPHA).setDepth(2);

		//создаем интерактивные слои объектов (sign - указатель)
		this.#signLayer = map.getObjectLayer('Sign');
		if (!this.#signLayer) {
			console.log(
				`[${WorldScene.name}:create] encountered error while creating sign layer using data from tiled`,
			);
			return;
		}

		//добавляем изображение, которое будет использоваться для визуализации элементов зон встречи с монстрами
		const encounterTiles = map.addTilesetImage('encounter', WORLD_ASSET_KEYS.WORLD_ENCOUNTER_ZONE);
		if (!encounterTiles) {
			console.log(
				`[${WorldScene.name}:create] encountered error while creating encounter tileset using data from tiled`,
			);
			return;
		}

		//ищем все элементы с именем Encounter и создаем из этого слой (авитоматически будет рисоваться)
		this.#encounterLayer = map.createLayer('Encounter', encounterTiles, 0, 0);
		if (!this.#encounterLayer) {
			console.log(
				`[${WorldScene.name}:create] encountered error while creating encounter layer using data from tiled`,
			);
			return;
		}
		this.#encounterLayer.setAlpha(TILED_COLLISION_LAYER_ALPHA).setDepth(2);

		this.add.image(0, 0, WORLD_ASSET_KEYS.WORLD_BACKGROUND, 0).setOrigin(0);

		//create npcs
		this.#createNPCs(map);

		this.#player = new Player({
			scene: this,
			position: dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION),
			direction: dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION),
			collisionLayer: collisionLayer,
			spriteGridMovementFinishedCallback: () => {
				this.#handlePlayerMovementUpdate();
			},
			otherCharactersToCheckForCollisionsWith: this.#npcs,
		});

		//startFollow - делает объект по центру всегда
		this.cameras.main.startFollow(this.#player.sprite);

		//update our collisions with npcs
		this.#npcs.forEach((npc) => {
			npc.addCharacterToCheckForCollisionWith(this.#player);
		});

		this.add.image(0, 0, WORLD_ASSET_KEYS.WORLD_FOREGROUND, 0).setOrigin(0);

		this.#controls = new Controls(this);

		this.#dialogUi = new DialogUi(this, 1280);

		this.cameras.main.fadeIn(1000, 0, 0, 0);
	}

	update(time) {
		if (this.#wildMonsterEncountered) {
			this.#player.update(time);
			return;
		}
		const selectedDirection = this.#controls.getDirectionKeyPressedDown();
		if (selectedDirection !== DIRECTION.NONE && !this.#isPlayerInputLocked()) {
			this.#player.moveCharacter(selectedDirection);
		}

		if (this.#controls.wasSpaceKeyPressed() && !this.#player.isMoving) {
			this.#handlePlayerInteraction();
		}
		this.#player.update(time);

		this.#npcs.forEach((npc) => {
			npc.update(time);
		});
	}
	#handlePlayerMovementUpdate() {
		dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION, {
			x: this.#player.sprite.x,
			y: this.#player.sprite.y,
		});
		dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION, this.#player.direction);
		if (!this.#encounterLayer) {
			return;
		}

		const isInEncounterZone =
			this.#encounterLayer.getTileAtWorldXY(this.#player.sprite.x, this.#player.sprite.y, true)
				.index !== -1;
		if (!isInEncounterZone) {
			return;
		}
		console.log(`[${WorldScene.name}:handlePlayerMovementUpdate] player is in an encounter zone`);
		this.#wildMonsterEncountered = Math.random() < 0.5;
		if (this.#wildMonsterEncountered) {
			console.log(
				`[${WorldScene.name}:handlePlayerMovementUpdate] player encountered a wild monster`,
			);
			this.cameras.main.fadeOut(2000);
			this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
				this.scene.start(SCENE_KEYS.BATTLE_SCENE);
			});
		}
	}

	#handlePlayerInteraction() {
		if (this.#dialogUi.isAnimationPlaying) return;
		if (this.#dialogUi.isVisible && !this.#dialogUi.moreMessagesToShow) {
			this.#dialogUi.hideDialogModal();
			return;
		}
		if (this.#dialogUi.isVisible && this.#dialogUi.moreMessagesToShow) {
			this.#dialogUi.showNextMessage();
			return;
		}
		console.log('start of interaction check');

		const { x, y } = this.#player.sprite;
		const targetPosition = getTargetPositionFromGameObjectPositionAndDirection(
			{ x, y },
			this.#player.direction,
		);
		const nearBySign = this.#signLayer.objects.find((object) => {
			if (!object.x || !object.y) {
				return;
			}

			//указатели центрированы по нижнему краю, поэтому вычитаем квадрат
			return object.x === targetPosition.x && object.y - TILE_SIZE === targetPosition.y;
		});

		if (nearBySign) {
			/** @type {TiledObjectProperty[]} */
			const props = nearBySign.properties;
			/** @type {string[]} */
			const msgs = props
				.filter((prop) => prop.name === TILED_SIGN_PROPERTY.MESSAGE)
				.map((msg) => msg.value);

			const usePlaceholderText = this.#player.direction !== DIRECTION.UP;
			let textToShow = [CANNOT_READ_SIGN_TEXT];
			if (!usePlaceholderText) {
				textToShow = msgs || [SAMPLE_TEXT];
			}
			this.#dialogUi.showDialogModal(textToShow);
			return;
		}
	}

	#isPlayerInputLocked() {
		return this.#dialogUi.isVisible;
	}

	/**
	 *
	 * @param {Phaser.Tilemaps.Tilemap} map
	 * @returns {void}
	 */
	#createNPCs(map) {
		this.#npcs = [];

		//ищем все названия слоев с нпс
		const npcLayers = map.getObjectLayerNames().filter((layername) => layername.includes('NPC'));

		//проходимся по каждому названию и добавляем нового нпс
		npcLayers.forEach((layername) => {
			//достаем слой с нпс
			const layer = map.getObjectLayer(layername);

			//достаем объекст
			const npcObject = layer.objects.find((obj) => {
				return obj.type === CUSTOM_TILED_TYPES.NPC;
			});
			if (!npcObject || npcObject.x === undefined || npcObject.y === undefined) return;

			const npcFrame =
				npcObject.properties.find((property) => property.name === TILED_NPC_PROPERTY.FRAME)
					?.value || '0';
			const npc = new NPC({
				scene: this,
				position: { x: npcObject.x, y: npcObject.y - TILE_SIZE },
				direction: DIRECTION.DOWN,
				frame: parseInt(npcFrame, 10),
			});
			this.#npcs.push(npc);
		});
	}
}
