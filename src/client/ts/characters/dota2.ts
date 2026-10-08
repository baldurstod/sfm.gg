import { Group, Scene, Source2ModelInstance, Source2ModelManager } from 'harmony-3d';
import { JSONObject } from 'harmony-types';
import { createElement } from 'harmony-ui';
import { errorOnce, setTimeoutPromise } from 'harmony-utils';
import { Dota2Hero, Dota2HeroTemplates, Dota2ItemManager, Dota2ItemTemplates } from 'loadout';
import { Game } from '../misc/character';
import { Character, CharacterTemplate } from './character';
import { Item, ItemTemplate } from './item';
import { Slot, SlotTemplate } from './slot';

const DOTA2_REPOSITORY = 'https://dota2content.dotaloadout.com/';
const DOTA2_HEROES_URL = DOTA2_REPOSITORY + 'generated/heroes.json';
const DOTA2_HEROES_IMG_URL = DOTA2_REPOSITORY + 'generated/heroes.jpeg';
const DOTA2_ITEMS_URL = DOTA2_REPOSITORY + 'generated/items/';
const DOTA2_ECON_URL = DOTA2_REPOSITORY + 'panorama/images/';

export interface Dota2CharacterTemplate extends CharacterTemplate {
	id: string;
	heroOrderID: number;
}


export interface Dota2ItemTemplate extends ItemTemplate {
	baseItem: boolean;
	definition: JSONObject;
}

export class Dota2Character implements Character {
	#template: Dota2CharacterTemplate;
	#items = new Map<string, Dota2Item>();
	#model?: Source2ModelInstance | null;
	#isInvulnerable = false;
	#personaId = 0;// Base hero
	//#extraModels = new Set<Source2ModelInstance>();
	//#showBodyParts = new Map<string, boolean>();
	//#bodyParts = new Map<string, string | false>();
	#hero?: Dota2Hero;
	#group = new Group({ name: 'Dota 2 character group' });
	#itemTemplates = new Map<string, Dota2ItemTemplate>();// TODO: remove this; get templates from Dota2ItemManager

	constructor(template: Dota2CharacterTemplate) {
		this.#template = template;
	}

	getGame(): Game {
		return this.#template.game;
	}

	getName(): string {
		return this.#template.id;
	}

	getLabel(): string {
		return this.#template.name;
	}

	async setTeam(/*team: GameTeam*/): Promise<void> {
		// Nothing to do
	}

	/**
	 * Update the character skin
	 */
	async #updateSkin(): Promise<void> {
		// TODO: gold / ice ragdolls + invuln
		const skin = 0;//this.#team === 'red' ? 0 : 1;

		await (await this.getModel())?.setSkinId(skin);


		//await this.#setMaterialOverride(null);
		if (this.#model) {
			await this.#model.setSkinId(skin);
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

	hasItem(itemTemplate: Dota2ItemTemplate): boolean {
		return this.#getHero().hasItem(itemTemplate.id);
		//return this.#items.has(item.id);
	}

	async equipItem(itemTemplate: Dota2ItemTemplate): Promise<void> {
		this.#itemTemplates.set(itemTemplate.id, itemTemplate);
		this.#getHero().addItem(itemTemplate.id);
	}

	async unequipItem(itemTemplate: Dota2ItemTemplate): Promise<void> {
		this.#itemTemplates.set(itemTemplate.id, itemTemplate);
		await this.#getHero().removeItem(itemTemplate.id);

		const baseItem = await Dota2ItemManager.getBaseItemId(this.#template.id, itemTemplate.slot);
		if (baseItem) {
			await this.#getHero().addItem(baseItem);
		}
	}

	async equipDefaultItems(): Promise<void> {
		const items = await getItemsDota2(this.getTemplate().id);
		//console.info(items);
		for (const itemTemplate of items) {
			if (itemTemplate.baseItem) {
				await this.equipItem(itemTemplate);
			}
		}

		//await setTimeoutPromise(1000);
		//await this.#loadoutChanged();
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
		const equippedItems = this.#getHero().getItems();

		Dota2ItemManager.getItems(this.#template.id);

		const items = new Map<string, Dota2Item>();

		for (const [id, equippedItem] of equippedItems) {
			if (!equippedItem.isVisible()) {
				continue;
			}
			const itemTemplate = this.#itemTemplates.get(id);
			if (itemTemplate) {
				items.set(id, new Dota2Item(itemTemplate, this));
			}
		}

		return items;
	}

	async getModel(): Promise<Source2ModelInstance | null> {
		/*
		if (!this.#model) {
			this.#model = await dota2CharacterToModel(this.#template);
		}
		*/
		await this.#getHero().getModel();
		return this.#group as Source2ModelInstance;
	}

	getModelPath(): string {
		return this.#getHero().getModelPath();
		//return this.#template.modelPath;
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


	async select(editMode: boolean): Promise<void> {
		if (!editMode) {
			await this.equipDefaultItems();
		}
	}

	#getHero(): Dota2Hero {
		if (!this.#hero) {
			this.#hero = new Dota2Hero(this.#template.id, this.#group as Scene/*TODO: fix that: remove scene hero constructor*/);
		}

		return this.#hero;
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
	#model?: Source2ModelInstance | null;
	#visible = true;
	//#attachedModel?: Source2ModelInstance | null;
	//#extraWearable?: Source2ModelInstance | null;

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

	async setTeam(/*team: GameTeam*/): Promise<void> {
		// Nothing to do
	}

	/**
	 * Update the skin of every models
	 */
	async #updateSkin(): Promise<void> {
		// TODO: use item template skin_red / skin_blu

		const skin = 0;//this.#team === 'red' ? this.#template.skinRed : this.#template.skinBlu;
		await this.#model?.setSkinId(skin);
		//await this.#attachedModel?.setSkinId(skin);
		//await this.#extraWearable?.setSkinId(skin);
	}

	async getModels(): Promise<Source2ModelInstance[]> {
		const game = this.#template.game;
		const models: Source2ModelInstance[] = [];

		if (!this.#model) {
			//this.#model = (await itemToModel(this.#template))[0];
			if (this.#template.modelPath) {
				this.#model = await Source2ModelManager.createInstance(game, this.#template.modelPath, true);
			}

			if (this.#model) {
				//this.#model.playSequence(/*item.animation ?? */'ref');

				/*
				const itemStartSeq = this.#model.sourceModel.mdl.getSequenceById(0);
				if (itemStartSeq) {
					this.#model.playSequence(itemStartSeq.name);
					this.#model.setAnimation(0, itemStartSeq.name, 1);
				}
				*/
				//this.#model.frame = 0.;

				/*
				const attachedModelPath = this.#template.attachedModel;
				if (this.#model && attachedModelPath && !this.#attachedModel) {
					this.#attachedModel = await Source1ModelManager.createInstance(game, attachedModelPath, true);
					this.#attachedModel?.playSequence('ref');
					this.#model?.addChild(this.#attachedModel);
				}
				*/
			}

			await this.#updateSkin();
		}

		/*
		if (!this.#extraWearable) {
			const extraWearable = this.#template.extraWearable;
			if (extraWearable) {
				this.#extraWearable = await Source1ModelManager.createInstance(game, extraWearable, true);
				//model?.addChild(attachedModel);
				this.#extraWearable?.playSequence('ref');
			}
		}
		*/

		//await this.#updateSkin();

		if (this.#model) {
			models.push(this.#model);
		}
		/*
		if (this.#extraWearable) {
			models.push(this.#extraWearable);
		}
		*/

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

	async setVisible(visible: boolean): Promise<void> {
		this.#visible = visible;

		const models = await this.getModels();
		for (const model of models) {
			model.setVisible(visible ? undefined : visible);
		}
	}

	isVisible(): boolean {
		return this.#visible;
	}

	getPersonaId(): number {
		return getPersonaId(this.#template.slot)
	}

}

async function dota2CharacterToModel(character: Dota2CharacterTemplate): Promise<Source2ModelInstance | null> {
	const model = await Source2ModelManager.createInstance(character.game, character.modelPath, true);
	model?.playSequence(character.animation ?? 'ref');

	return model;
}

/*
function getItemIdStyle(item: ItemTemplate): string {
	return `${item.id}\0${item.style}`;
}
*/

export async function getDota2Characters(): Promise<Dota2CharacterTemplate[]> {
	const heroesJSON = await getDota2Heroes();
	//console.info(heroesJSON);
	if (!heroesJSON) {
		return [];
	}

	const heroes = heroesJSON.heroes as JSONObject[];

	const characters: Dota2CharacterTemplate[] = [];
	for (const hero of heroes) {
		// Populate hero templates
		Dota2HeroTemplates.addTemplate(hero);

		const slots: SlotTemplate[] = [];
		if (hero.ItemSlots) {
			for (const name in hero.ItemSlots as JSONObject) {
				const slot = (hero.ItemSlots as JSONObject)[name] as JSONObject;

				const displayInLoadout = slot.DisplayInLoadout;
				if (displayInLoadout == '0') {
					continue;
				}

				slots.push({
					name: slot.SlotName as string,
					slots: [],
					limit: 1,
				});
			}
		}

		//populateDota2Character(character);
		characters.push({
			game: 'dota2',
			id: hero.ID as string,
			name: hero.Name as string,
			label: hero.Name as string,
			icon: await getHeroPicture(Number(hero.HeroOrderID)),
			modelPath: hero.Model as string,
			slots,
			heroOrderID: Number(hero.HeroOrderID),
		});
	}

	return characters;
}

let dota2Heroes: Promise<JSONObject | null>;
async function getDota2Heroes(): Promise<JSONObject | null> {
	if (dota2Heroes === undefined) {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		dota2Heroes = new Promise<JSONObject | null>(async resolve => {
			while (true) {
				const resp = await fetch(`${DOTA2_HEROES_URL}?t=${new Date().getTime()}`);
				if (resp.ok) {
					const result = await resp.json() as JSONObject;
					resolve(result ?? null);
					return;
				}
				await setTimeoutPromise(5000);
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
	if (dota2HeroesImg === undefined) {
		// Get the all heroes picture
		dota2HeroesImg = new Promise<HTMLImageElement>(resolve => {
			const img = new Image();
			// Prevent tainting the canvas
			img.crossOrigin = 'anonymous';
			img.onload = (): void => resolve(img);
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

export async function getItemsDota2(hero: string, slot?: Slot): Promise<Dota2ItemTemplate[]> {
	const items = await getDota2ItemList(hero);
	if (!items) {
		return [];
	}

	const result: Dota2ItemTemplate[] = [];
	//const slots = slot.getSlots();
	const slotName = slot?.getName();
	for (const item of items) {
		Dota2ItemTemplates.addTemplate(item);
		//const item = (items.items as JSONObject)[index] as JSONObject;
		if (slotName === undefined || item.slot === slotName) {
			result.push(dota2ItemToItem(item));
		}
		/*
		if (slots.includes(item.item_slot as string)) {
			if (item.used_by_classes && (item.used_by_classes as JSONObject)[slot.getOwner().getName()] != 1) {
				continue;
			}

			//result.push(tf2ItemToItem(item, slot.getOwner().getName(), team));
		}
		*/
	}
	return result;
}

const dota2ItemsMap = new Map<string, Promise<JSONObject[] | null>>();
async function getDota2ItemList(hero: string): Promise<JSONObject[] | null> {
	let dota2Items = dota2ItemsMap.get(hero);
	if (!dota2Items) {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		dota2Items = new Promise<JSONObject[] | null>(async resolve => {
			while (true) {
				const resp = await fetch(`${DOTA2_ITEMS_URL}${hero}.json`);
				if (resp.ok) {
					const result = await resp.json() as JSONObject[];
					resolve(result ?? null);
					return;
				}
				await setTimeoutPromise(5000);
			}
		});
		dota2ItemsMap.set(hero, dota2Items);
	}
	return dota2Items;
}

function dota2ItemToItem(item: JSONObject): Dota2ItemTemplate {
	//let skin: string | undefined;
	//if (item.skin_red !== undefined) {
	//skin = item.skin_red as string;
	//}

	const skin: string = item.skin_red as string | undefined ?? '0';

	const attachedModel = item.attached_models as string;
	const extraWearable = item.extra_wearable as string;

	return {
		id: String(item.id),
		slot: item.slot as string,
		style: item.style as string,
		game: 'dota2',
		name: item.name as string,
		icon: DOTA2_ECON_URL + (item.imageInventory as string) + '.png',
		modelPath: item.modelPlayer as string,
		attachedModel,
		extraWearable,
		skin,
		baseItem: item.baseItem == '1',
		definition: item,
	}
}

function getPersonaId(slot: string): number {
	errorOnce(slot);
	const result = /\_persona\_(\d)$/.exec(slot);
	if (result?.length == 2) {
		return Number(result[1]);
	}
	return 0;
}

export async function getDota2Character(id: string): Promise<Character | null> {
	const dota2Characters = await getDota2Characters();

	for (const characterTemplate of dota2Characters) {
		if (characterTemplate.id === id) {
			return new Dota2Character(characterTemplate);
		}
	}

	return null;
}

export async function getDota2ItemTemplate(characterName: string, id: string, itemSlot: string, style: string): Promise<Dota2ItemTemplate | null> {
	const items = await getDota2ItemList(characterName);
	if (!items) {
		return null;
	}

	for (const item of items) {
		if (item.id == id) {
			return dota2ItemToItem(item);
		}
	}
	return null;
}
