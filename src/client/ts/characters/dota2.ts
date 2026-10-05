import { Source1ModelInstance, Source1ModelManager, Source2ModelInstance, Source2ModelManager } from 'harmony-3d';
import { JSONObject } from 'harmony-types';
import { createElement } from 'harmony-ui';
import { setTimeoutPromise } from 'harmony-utils';
import { Game, GameTeam } from '../misc/character';
import { Character, CharacterTemplate } from './character';
import { Item, ItemTemplate } from './item';
import { Slot } from './slot';

const DOTA2_HEROES_URL = 'https://dota2content.dotaloadout.com/generated/heroes.json';
const DOTA2_HEROES_IMG_URL = 'https://dota2content.dotaloadout.com/generated/heroes.jpeg';
const DOTA2_ITEMS_URL = 'https://dota2content.dotaloadout.com/generated/items/';

export interface Dota2CharacterTemplate extends CharacterTemplate {
	id: string;
	heroOrderID: number;
}


export interface Dota2ItemTemplate extends ItemTemplate {
}

export class Dota2Character implements Character {
	#template: Dota2CharacterTemplate;
	#items = new Map<string, Dota2Item>();
	#model?: Source2ModelInstance | null;
	#isInvulnerable = false;
	//#extraModels = new Set<Source2ModelInstance>();
	//#showBodyParts = new Map<string, boolean>();
	//#bodyParts = new Map<string, string | false>();

	constructor(template: Dota2CharacterTemplate) {
		this.#template = template;
	}

	getGame(): Game {
		return this.#template.game;
	}

	getName(): string {
		return this.#template.name;
	}

	getLabel(): string {
		throw new Error("TODO");
	}

	async setTeam(team: GameTeam): Promise<void> {
		// Nothing to do
	}

	/**
	 * Update the character skin
	 */
	async #updateSkin(): Promise<void> {
		let zombieSkin = false;
		for (const [, item] of this.#items) {
			if (item.getTemplate().name.includes('Voodoo-Cursed')) {
				zombieSkin = true;
			}
		}

		// TODO: gold / ice ragdolls + invuln
		const skin = 0;//this.#team === 'red' ? 0 : 1;

		(await this.getModel())?.setSkinId(skin);


		//await this.#setMaterialOverride(null);
		const zombieSkinOffset = (this.getName() == 'spy' ? 22 : 4);
		if (this.#model) {
			await this.#model.setSkinId(skin + (zombieSkin ? zombieSkinOffset : 0) + (this.#isInvulnerable ? 2 : 0));
		}
		/*
		for (const extraModel of this.#extraModels) {
			extraModel.setSkinId(skin);
		}
		*/
	}

	getTeam(): undefined {
		return undefined;
	}

	hasItem(item: Dota2ItemTemplate): boolean {
		return this.#items.has(getItemIdStyle(item));
	}

	async equipItem(itemTemplate: Dota2ItemTemplate): Promise<void> {
		console.info(itemTemplate);
		// If item is present, do nothing
		if (this.hasItem(itemTemplate)) {
			return;
		}

		const item = new Dota2Item(itemTemplate, this);
		this.#items.set(getItemIdStyle(itemTemplate), item);

		//await item.setTeam(this.#team);

		const characterModel = await this.getModel();
		if (characterModel) {
			const models = await item.getModels();
			models.forEach(model => characterModel.addChild(model));
		}

		this.#loadoutChanged();
	}

	async unequipItem(itemTemplate: Dota2ItemTemplate): Promise<void> {
		const id = getItemIdStyle(itemTemplate);
		const item = this.#items.get(id);
		// If item is absent, do nothing
		if (!item) {
			return;
		}

		this.#items.delete(id);

		const models = await item.getModels();
		models.forEach(model => model.remove());

		this.#loadoutChanged();
	}

	#loadoutChanged(): void {
		//this.autoSelectAnim();TODO
		this.#updateSkin();
		//this.#checkBodyGroups();
	}

	/*
	setBodyPartIdModel(bodyPartId: number, modelId: number): void {
		this.#bodyParts.set(String(bodyPartId), String(modelId));
		this.#model?.setBodyPartIdModel(bodyPartId, modelId);
	}

	setBodyPartModel(bodyPartId: string, modelId: number): void {
		this.#bodyParts.set(bodyPartId, String(modelId));
		this.#model?.setBodyPartModel(bodyPartId, modelId);
	}
	*/

	getItems(): Map<string, Dota2Item> {
		return new Map(this.#items);
	}

	async getModel(): Promise<Source2ModelInstance | null> {
		if (!this.#model) {
			this.#model = await dota2CharacterToModel(this.#template);
		}
		return this.#model;
	}

	getModelPath(): string {
		return this.#template.modelPath;
	}

	getBodyParts(): Map<string, string | false> {
		return new Map();
	}

	getSlots(): Slot[] {
		const slots: Slot[] = [];

		for (const slot of this.#template.slots) {
			slots.push(new Slot(slot, this));
		}

		return slots;
	}

	getTemplate(): Dota2CharacterTemplate {
		return this.#template;
	}


	/*
	// Game this character is part of
	game: Game;
	// Character name
	readonly name: string;
	// Label
	readonly label: string;
	// PNG icon as string
	readonly icon: string;
	// Character team
	team?: GameTeam;

	modelPath: string;
	animation?: string;
	keywords?: string[];
	slots: CharacterSlot[];
	items: Map<string, Item>;

	new(template: CharacterTemplate): Character;

	getGame(): Game;

	setTeam(team: GameTeam): void;
	getTeam(): GameTeam | undefined;
	*/
}

export class Dota2Item implements Item {
	#template: Dota2ItemTemplate;
	#owner: Dota2Character;
	#model?: Source1ModelInstance | null;
	#attachedModel?: Source1ModelInstance | null;
	#extraWearable?: Source1ModelInstance | null;

	constructor(template: Dota2ItemTemplate, owner: Dota2Character) {
		this.#template = template;
		this.#owner = owner;
	}

	getGame(): Game {
		return this.#template.game;
	}

	getId(): string {
		return this.#template.id;
	}

	getStyle(): string {
		return this.#template.style;
	}

	getSlot(): string {
		return this.#template.slot;
	}

	getIcon(): string {
		return this.#template.icon;
	}

	getTemplate(): Dota2ItemTemplate {
		return this.#template;
	}

	setOwner(owner: Dota2Character): void {
		this.#owner = owner;
	}

	async setTeam(team: GameTeam): Promise<void> {
		// Nothing to do
	}

	/**
	 * Update the skin of every models
	 */
	async #updateSkin(): Promise<void> {
		console.info(this.#template);

		// TODO: use item template skin_red / skin_blu

		const skin = 0;//this.#team === 'red' ? this.#template.skinRed : this.#template.skinBlu;
		await this.#model?.setSkinId(skin);
		await this.#attachedModel?.setSkinId(skin);
		await this.#extraWearable?.setSkinId(skin);
	}

	async getModels(): Promise<Source1ModelInstance[]> {
		const game = this.#template.game;
		const models: Source1ModelInstance[] = [];

		if (!this.#model) {
			//this.#model = (await itemToModel(this.#template))[0];
			this.#model = await Source1ModelManager.createInstance(game, this.#template.modelPath, true);

			if (this.#model) {
				//this.#model.playSequence(/*item.animation ?? */'ref');

				const itemStartSeq = this.#model.sourceModel.mdl.getSequenceById(0);
				if (itemStartSeq) {
					this.#model.playSequence(itemStartSeq.name);
					this.#model.setAnimation(0, itemStartSeq.name, 1);
				}
				this.#model.frame = 0.;

				const attachedModelPath = this.#template.attachedModel;
				if (this.#model && attachedModelPath && !this.#attachedModel) {
					this.#attachedModel = await Source1ModelManager.createInstance(game, attachedModelPath, true);
					this.#attachedModel?.playSequence('ref');
					this.#model?.addChild(this.#attachedModel);
				}
			}
		}

		if (!this.#extraWearable) {
			const extraWearable = this.#template.extraWearable;
			if (extraWearable) {
				this.#extraWearable = await Source1ModelManager.createInstance(game, extraWearable, true);
				//model?.addChild(attachedModel);
				this.#extraWearable?.playSequence('ref');
			}
		}

		this.#updateSkin();

		if (this.#model) {
			models.push(this.#model);
		}
		if (this.#extraWearable) {
			models.push(this.#extraWearable);
		}

		return models;
	}

	getModelPath(): string {
		return this.#template.modelPath;
	}

	getModelsPath(): string[] {
		const paths: string[] = [];

		paths.push(this.#template.modelPath);
		const extraWearable = this.#template.extraWearable;
		if (extraWearable) {
			paths.push(extraWearable);
		}

		return paths;
	}

	getAttachedModel(): string | undefined {
		return undefined;//TODO
	}

	getExtraWearable(): string | undefined {
		return this.#template.extraWearable;
	}

	getSkin(): string {
		return this.#template.skin ?? '0';//TODO: depend on team
	}
}

async function dota2CharacterToModel(character: Dota2CharacterTemplate): Promise<Source2ModelInstance | null> {
	let model = await Source2ModelManager.createInstance(character.game, character.modelPath, true);
	model?.playSequence(character.animation ?? 'ref');

	return model;
}

function getItemIdStyle(item: ItemTemplate): string {
	return `${item.id}\0${item.style}`;
}

export async function getDota2Characters(): Promise<Dota2CharacterTemplate[]> {
	const heroesJSON = await getDota2Heroes();
	console.info(heroesJSON);
	if (!heroesJSON) {
		return [];
	}

	const heroes = heroesJSON.heroes as JSONObject[];

	const characters: Dota2CharacterTemplate[] = [];
	for (const hero of heroes) {
		//populateDota2Character(character);
		characters.push({
			game: 'dota2',
			id: hero.ID as string,
			name: hero.Name as string,
			label: hero.Name as string,
			icon: await getHeroPicture(Number(hero.HeroOrderID)),
			modelPath: hero.Model as string,
			slots: [],
			heroOrderID: Number(hero.HeroOrderID),
		});
	}

	return characters;
}
/**
 * Fill the game, animation and slots character properties
 * @param character The character to update
 */
function populateDota2Character(character: CharacterTemplate): void {
	character.game = 'dota2';
	character.animation = 'stand_secondary';
	character.slots = [
		{
			name: 'weapon',
			slots: ['primary', 'secondary', 'melee'],
			limit: 1,
		},
		{
			name: 'cosmetics',
			slots: ['head', 'misc'],
		},
	];
}

let dota2Heroes: Promise<JSONObject | null>;
async function getDota2Heroes(): Promise<JSONObject | null> {
	if (!dota2Heroes) {
		dota2Heroes = new Promise<JSONObject | null>(async resolve => {
			while (true) {
				const resp = await fetch(`${DOTA2_HEROES_URL}?t=${new Date().getTime()}`);
				if (resp.ok) {
					const result = await resp.json();
					resolve(result ?? null);
					return;
				}
				setTimeoutPromise(5000);
			}
		});
	}
	return dota2Heroes;
}

let dota2HeroesImg: Promise<HTMLImageElement>;
//let dota2HeroesImgCanvas: HTMLCanvasElement;
//let dota2HeroesImgContext: CanvasRenderingContext2D | null;
const DOTA2_HERO_IMG_WIDTH = 256;
const DOTA2_HERO_IMG_HEIGHT = 144;
async function getHeroPicture(heroOrderID: number): Promise<string> {
	// TODO: optimize: a canvas + context is created for each image
	if (!dota2HeroesImg) {
		// Get the all heroes picture
		dota2HeroesImg = new Promise<HTMLImageElement>(async resolve => {
			const img = new Image();
			// Prevent tainting the canvas
			img.crossOrigin = 'anonymous';
			img.onload = () => resolve(img);
			img.src = DOTA2_HEROES_IMG_URL;
		});
	}

	//if (!dota2HeroesImgCanvas) {
	const dota2HeroesImgCanvas = createElement('canvas') as HTMLCanvasElement;
	const dota2HeroesImgContext = dota2HeroesImgCanvas.getContext('2d');
	//}

	if (!dota2HeroesImgContext) {
		return '';
	}

	dota2HeroesImgContext.drawImage(await dota2HeroesImg, 0, DOTA2_HERO_IMG_HEIGHT * (heroOrderID - 1), DOTA2_HERO_IMG_WIDTH, DOTA2_HERO_IMG_HEIGHT, 0, 0, DOTA2_HERO_IMG_WIDTH, DOTA2_HERO_IMG_HEIGHT);


	return dota2HeroesImgCanvas.toDataURL();
}
