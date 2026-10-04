import { Material, Source1MaterialManager, Source1ModelInstance, Source1ModelManager } from 'harmony-3d';
import { Game } from '../misc/character';
import { Character, CharacterTemplate } from './character';
import { Item, ItemTemplate } from './item';
import { Slot } from './slot';

export const MATERIAL_INVULN_BLU = 'models/effects/invulnfx_blue.vmt';
export const MATERIAL_INVULN_RED = 'models/effects/invulnfx_red.vmt';

export const ClassRemovablePartsOff = ['heavy_hand_dex_bodygroup', 'robotarm_bodygroup', 'darts_bodygroup', 'spyMask', 'rocket', 'medal_bodygroup', 'demo_smiley'];

/*
export type CharacterTemplate = {
	game: Game;
	name: string;
	label: string;
	icon: string;
	modelPath: string;
	animation?: string;
	keywords?: string[];
	slots: CharacterSlot[];
	//items: Map<string, Item>;
}
*/

export interface Tf2ItemTemplate extends ItemTemplate {
	skinRed: number;
	skinBlu: number;

	playerBodygroups: Record<string, string>;
	wmBodygroupOverride: Record<string, string>;
	/*
	game: Game;
	id: string;
	slot: string;
	style: string;
	name: string;
	icon: string;
	modelPath: string;
	attachedModel?: string;
	extraWearable?: string;
	skin?: string;
	keywords?: string[];
	*/
}

export class Tf2Character implements Character {
	#template: CharacterTemplate;
	//#game: Game;
	// Character team
	#team: Tf2Team = 'red';
	#items = new Map<string, Tf2Item>();
	#model?: Source1ModelInstance | null;
	#isInvulnerable = false;
	#extraModels = new Set<Source1ModelInstance>();
	//#showBodyParts = new Map<string, boolean>();
	#bodyParts = new Map<string, string | false>();

	constructor(template: CharacterTemplate) {
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

	async setTeam(team: Tf2Team): Promise<void> {
		this.#team = team;
		for (const item of this.#items.values()) {
			item.setTeam(team);
		}

		this.#updateSkin();
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
		const skin = this.#team === 'red' ? 0 : 1;

		(await this.getModel())?.setSkinId(skin);


		await this.#setMaterialOverride(null);
		const zombieSkinOffset = (this.getName() == 'spy' ? 22 : 4);
		if (this.#model) {
			await this.#model.setSkinId(skin + (zombieSkin ? zombieSkinOffset : 0) + (this.#isInvulnerable ? 2 : 0));
		}
		for (const extraModel of this.#extraModels) {
			if (this.#isInvulnerable) {
				const materialOverride = this.#team ? MATERIAL_INVULN_BLU : MATERIAL_INVULN_RED;
				const material = await Source1MaterialManager.getMaterial('tf2', materialOverride);
				await extraModel.setMaterialOverride(material);
			} else {
				extraModel.setSkinId(skin);
			}
		}
	}

	async #setMaterialOverride(materialOverride: string | null): Promise<void> {
		let material: Material | null = null;
		if (materialOverride) {
			material = await Source1MaterialManager.getMaterial('tf2', materialOverride);
		}

		await this.#model?.setMaterialOverride(material);
		for (const extraModel of this.#extraModels) {
			await extraModel.setMaterialOverride(material);
		}
	}

	getTeam(): Tf2Team | undefined {
		return this.#team;
	}

	hasItem(item: Tf2ItemTemplate): boolean {
		return this.#items.has(getItemIdStyle(item));
	}

	async equipItem(itemTemplate: Tf2ItemTemplate): Promise<void> {
		console.info(itemTemplate);
		// If item is present, do nothing
		if (this.hasItem(itemTemplate)) {
			return;
		}

		const item = new Tf2Item(itemTemplate, this);
		this.#items.set(getItemIdStyle(itemTemplate), item);

		await item.setTeam(this.#team);

		const characterModel = await this.getModel();
		if (characterModel) {
			const models = await item.getModels();
			models.forEach(model => characterModel.addChild(model));
		}

		this.#loadoutChanged();
	}

	async unequipItem(itemTemplate: Tf2ItemTemplate): Promise<void> {
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
		this.#checkBodyGroups();
	}

	async #checkBodyGroups(): Promise<void> {
		await this.getModel();

		let bodyGroupIndex: string;
		let bodyGroup;
		this.#renderBodyParts(true);
		this.#bodyParts.clear();
		//this.#model?.setVisible(this.#visible);s
		this.#model?.resetBodyPartModels();

		for (const classRemovableParts of ClassRemovablePartsOff) {
			this.#renderBodyPart(classRemovableParts, false);
		}

		for (const [, item] of this.#items) {
			const playerBodygroups = item.getTemplate().playerBodygroups;
			if (playerBodygroups) {
				for (bodyGroupIndex in playerBodygroups) {
					bodyGroup = playerBodygroups[bodyGroupIndex];
					this.setBodyPartModel(bodyGroupIndex, Number(bodyGroup));
				}
			}

			const wmBodygroupOverride = item.getTemplate().wmBodygroupOverride;
			if (wmBodygroupOverride) {
				for (bodyGroupIndex in wmBodygroupOverride) {
					bodyGroup = wmBodygroupOverride[bodyGroupIndex];
					this.setBodyPartIdModel(Number(bodyGroupIndex), Number(bodyGroup));
				}
			}
		}
	}

	#renderBodyPart(bodyPart: string, render: false): void {
		this.#bodyParts.set(bodyPart, render);
		this.#model?.renderBodyPart(bodyPart, render);
	}

	#renderBodyParts(render: boolean): void {
		this.#model?.renderBodyParts(render);
	}

	setBodyPartIdModel(bodyPartId: number, modelId: number): void {
		this.#bodyParts.set(String(bodyPartId), String(modelId));
		this.#model?.setBodyPartIdModel(bodyPartId, modelId);
	}

	setBodyPartModel(bodyPartId: string, modelId: number): void {
		this.#bodyParts.set(bodyPartId, String(modelId));
		this.#model?.setBodyPartModel(bodyPartId, modelId);
	}

	getItems(): Map<string, Tf2Item> {
		return new Map(this.#items);
	}

	async getModel(): Promise<Source1ModelInstance | null> {
		if (!this.#model) {
			this.#model = await tf2CharacterToModel(this.#template);
		}
		return this.#model;
	}

	getModelPath(): string {
		return this.#template.modelPath;
	}

	getBodyParts(): Map<string, string | false> {

		return new Map(this.#bodyParts);
	}

	getSlots(): Slot[] {
		const slots: Slot[] = [];

		for (const slot of this.#template.slots) {
			slots.push(new Slot(slot, this));
		}

		return slots;
	}

	getTemplate(): CharacterTemplate {
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

export class Tf2Item implements Item {
	#template: Tf2ItemTemplate;
	#owner: Tf2Character;
	#model?: Source1ModelInstance | null;
	#attachedModel?: Source1ModelInstance | null;
	#extraWearable?: Source1ModelInstance | null;
	#team: Tf2Team = 'red';

	constructor(template: Tf2ItemTemplate, owner: Tf2Character) {
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

	getTemplate(): Tf2ItemTemplate {
		return this.#template;
	}

	setOwner(owner: Tf2Character): void {
		this.#owner = owner;
	}

	async setTeam(team: Tf2Team): Promise<void> {
		this.#team = team;
		// Force models to spawn if they don't exist
		await this.getModels();
		this.#updateSkin();
	}

	/**
	 * Update the skin of every models
	 */
	async #updateSkin(): Promise<void> {
		console.info(this.#template);

		// TODO: use item template skin_red / skin_blu

		const skin = this.#team === 'red' ? this.#template.skinRed : this.#template.skinBlu;
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

async function tf2CharacterToModel(character: CharacterTemplate): Promise<Source1ModelInstance | null> {
	let model = await Source1ModelManager.createInstance(character.game, character.modelPath, true);
	model?.playSequence(character.animation ?? 'ref');

	return model;
}

function getItemIdStyle(item: ItemTemplate): string {
	return `${item.id}\0${item.style}`;
}

export type Tf2Team = 'blu' | 'red';
