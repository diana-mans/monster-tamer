import Phaser from '../lib/phaser.js';
import {
	ATTACK_ASSET_KEYS,
	BATTLE_ASSET_KEYS,
	BATTLE_BACKGROUND_ASSET_KEYS,
	CHARACTER_ASSET_KEYS,
	DATA_ASSET_KEYS,
	HEALTH_BAR_ASSET_KEYS,
	MONSTER_ASSET_KEYS,
	UI_ASSET_KEYS,
	WORLD_ASSET_KEYS,
} from '../assets/asset-keys.js';
import { KENNY_FUTURE_NARROW_FONT_NAME } from '../assets/font-keys.js';
import { WebFontFileLoader } from '../assets/web-font-file-loader.js';
import { SCENE_KEYS } from './scene-keys.js';
import { DataUtils } from '../utils/data-utils.js';

export class PreloadScene extends Phaser.Scene {
	constructor() {
		super({
			key: SCENE_KEYS.PRELOAD_SCENE,
		});
		console.log(SCENE_KEYS.PRELOAD_SCENE);
	}

	// Инициализация
	init() {
		console.log('init');
	}

	// Предзагрузка ресурсов
	preload() {
		console.log(`[${PreloadScene.name}:preload] invoked`);
		const monsterTamerAssetPath = 'assets/images/monster-tamer';
		const kenneysAssetPath = 'assets/images/kenneys-assets';
		const pimenAssetPath = 'assets/images/pimen';
		const axulArtAssetPath = 'assets/images/axulart';
		const pdGamesAssetPath = 'assets/images/parabellum-games';

		//battle backgrounds
		this.load.image(
			BATTLE_BACKGROUND_ASSET_KEYS.FOREST,
			`${monsterTamerAssetPath}/battle-backgrounds/forest-background.png`,
		);

		//battle assets
		this.load.image(
			BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND,
			`${kenneysAssetPath}/ui-space-expansion/custom-ui.png`,
		);

		//health bar assets
		this.load.image(
			HEALTH_BAR_ASSET_KEYS.LEFT_CAP,
			`${kenneysAssetPath}/ui-space-expansion/barHorizontal_green_left.png`,
		);
		this.load.image(
			HEALTH_BAR_ASSET_KEYS.RIGHT_CAP,
			`${kenneysAssetPath}/ui-space-expansion/barHorizontal_green_right.png`,
		);
		this.load.image(
			HEALTH_BAR_ASSET_KEYS.MIDDLE,
			`${kenneysAssetPath}/ui-space-expansion/barHorizontal_green_mid.png`,
		);
		this.load.image(
			HEALTH_BAR_ASSET_KEYS.LEFT_CAP_SHADOW,
			`${kenneysAssetPath}/ui-space-expansion/barHorizontal_shadow_left.png`,
		);
		this.load.image(
			HEALTH_BAR_ASSET_KEYS.MIDDLE_SHADOW,
			`${kenneysAssetPath}/ui-space-expansion/barHorizontal_shadow_mid.png`,
		);
		this.load.image(
			HEALTH_BAR_ASSET_KEYS.RIGHT_CAP_SHADOW,
			`${kenneysAssetPath}/ui-space-expansion/barHorizontal_shadow_right.png`,
		);

		//monster assets
		this.load.image(
			MONSTER_ASSET_KEYS.CARNODUSK,
			`${monsterTamerAssetPath}/monsters/carnodusk.png`,
		);
		this.load.image(
			MONSTER_ASSET_KEYS.IGUANIGNITE,
			`${monsterTamerAssetPath}/monsters/iguanignite.png`,
		);

		//attack assets
		this.load.spritesheet(ATTACK_ASSET_KEYS.ICE_SHARD, `${pimenAssetPath}/ice-attack/active.png`, {
			frameWidth: 32,
			frameHeight: 32,
		});
		this.load.spritesheet(
			ATTACK_ASSET_KEYS.ICE_SHARD_START,
			`${pimenAssetPath}/ice-attack/start.png`,
			{
				frameWidth: 32,
				frameHeight: 32,
			},
		);
		this.load.spritesheet(ATTACK_ASSET_KEYS.SLASH, `${pimenAssetPath}/slash.png`, {
			frameWidth: 48,
			frameHeight: 48,
		});

		//ui assets
		this.load.image(UI_ASSET_KEYS.CURSOR, `${monsterTamerAssetPath}/ui/cursor.png`);

		//load json data
		this.load.json(DATA_ASSET_KEYS.ATTACKS, `assets/data/attacks.json`);
		this.load.json(DATA_ASSET_KEYS.ANIMATIONS, `assets/data/animations.json`);

		//load custom font with loader plugin
		this.load.addFile(new WebFontFileLoader(this.load, [KENNY_FUTURE_NARROW_FONT_NAME]));

		//load world assets
		this.load.image(
			WORLD_ASSET_KEYS.WORLD_BACKGROUND,
			`${monsterTamerAssetPath}/map/level_background.png`,
		);

		//load character assets
		this.load.spritesheet(CHARACTER_ASSET_KEYS.PLAYER, `${axulArtAssetPath}/character/custom.png`, {
			frameWidth: 64,
			frameHeight: 88,
		});
		this.load.spritesheet(CHARACTER_ASSET_KEYS.NPC, `${pdGamesAssetPath}/characters.png`, {
			frameWidth: 16,
			frameHeight: 16,
		});
	}

	// Создание объектов и размещение их на сцене
	create() {
		console.log(`[${PreloadScene.name}:create] invoked`);
		this.#createAnimations();
		//когда все необходимое загрузится, мы запустим другую сцену, а эта сцена закончится
		this.scene.start(SCENE_KEYS.WORLD_SCENE);
	}

	#createAnimations() {
		const animations = DataUtils.getAnimations(this);
		animations.forEach((animation) => {
			const frames = animation.frames
				? this.anims.generateFrameNumbers(animation.assetKey, { frames: animation.frames })
				: this.anims.generateFrameNumbers(animation.assetKey);
			//Создаем анимации
			this.anims.create({
				key: animation.key,
				frames: frames,
				frameRate: animation.frameRate,
				repeat: animation.repeat,
				delay: animation.delay,
				yoyo: animation.yoyo,
			});
		});
	}

	// Обновление каждый кадр
	// update() {
	// 	console.log('update');
	// }
}
