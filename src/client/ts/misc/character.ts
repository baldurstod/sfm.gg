//import demoman from '../../img/tf2/class/demoman.png';
import { PartialBy, Source1ModelInstance, Source1ModelManager } from 'harmony-3d';
import { JSONObject } from 'harmony-types';
import { BugReporter, setTimeoutPromise } from 'harmony-utils';
import icon440 from '../../img/icons/steam_icon_440.png';
import demoman from '../../img/tf2/class/demoman.png';
import engineer from '../../img/tf2/class/engineer.png';
import heavy from '../../img/tf2/class/heavy.png';
import medic from '../../img/tf2/class/medic.png';
import pyro from '../../img/tf2/class/pyro.png';
import scout from '../../img/tf2/class/scout.png';
import sniper from '../../img/tf2/class/sniper.png';
import soldier from '../../img/tf2/class/soldier.png';
import spy from '../../img/tf2/class/spy.png';
import teamBlu from '../../img/tf2/logo_blue_white.png';
import teamRed from '../../img/tf2/logo_red_white.png';
import { Character, CharacterTemplate } from '../characters/character';
import { ItemTemplate } from '../characters/item';
import { Slot, SlotTemplate } from '../characters/slot';
import { Tf2Character, Tf2ItemTemplate } from '../characters/tf2';


export type CharacterSlot = {
	character: CharacterTemplate;
	name: string;
	slots: string[];
	//icon: string;
	/** Limit the amount of items that this slot can have. Default to no limit. */
	limit?: number;
}

export type Game = 'tf2';

export type Tf2Team = 'blu' | 'red';
export type GameTeam = Tf2Team;

export type GameDefinition = {
	name: string;
	icon: string;
	teams?: GameTeamDefinition[];
}

export const Games: GameDefinition[] = [
	{
		name: 'tf2',
		icon: icon440,
		teams: [
			{
				name: 'red',
				icon: teamRed,
			},
			{
				name: 'blu',
				icon: teamBlu,
			},
		],
	},
]

export type GameTeamDefinition = {
	name: GameTeam;
	icon: string;
}

/*
export type CharacterTemplate = {
	game: Game;
	team?: Tf2Team;
	name: string;
	icon: string;
	modelPath: string;
	animation?: string;
	keywords?: string[];
	slots: CharacterSlot[];
	items: Map<string, Item>;
}
*/


/*
export type Item = {
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
}
*/

export function getItemIdStyle(item: ItemTemplate): string {
	return `${item.id}\0${item.style}`;
}

const tf2Characters: PartialBy<CharacterTemplate, 'game' | 'slots' | 'label'>[] = [
	{ name: 'scout', icon: scout, modelPath: 'models/player/scout', },
	{ name: 'sniper', icon: sniper, modelPath: 'models/player/sniper', },
	{ name: 'soldier', icon: soldier, modelPath: 'models/player/soldier', },
	{ name: 'demoman', icon: demoman, modelPath: 'models/player/demo', },
	{ name: 'medic', icon: medic, modelPath: 'models/player/medic', },
	{ name: 'heavy', icon: heavy, modelPath: 'models/player/heavy', },
	{ name: 'pyro', icon: pyro, modelPath: 'models/player/pyro', },
	{ name: 'spy', icon: spy, modelPath: 'models/player/spy', },
	{ name: 'engineer', icon: engineer, modelPath: 'models/player/engineer', },
]

/**
 * Fill the game, animation and slots character properties
 * @param character The character to update
 */
function populateTf2Character(character: CharacterTemplate): void {
	character.game = 'tf2';
	character.animation = 'stand_secondary';
	character.slots = [
		{
			name: 'weapon',
			slots: ['primary', 'secondary', 'melee'],
			limit: 1,
		},
		{
			name: 'hat',
			slots: ['head'],
		},
		{
			name: 'misc',
			slots: ['misc'],
		},
	];
}

export function getTf2Characters(): CharacterTemplate[] {
	const characters = structuredClone(tf2Characters) as CharacterTemplate[];

	for (const character of characters) {
		populateTf2Character(character);
	}

	return characters;
}

export function getTf2Character(name: string): Character | null {
	const partialCharacter = tf2Characters.find((element) => element.name === name);
	if (!partialCharacter) {
		return null;
	}

	const characterTemplate = structuredClone(partialCharacter) as CharacterTemplate;
	populateTf2Character(characterTemplate);
	//character.items = new Map<string, Item>();
	return new Tf2Character(characterTemplate);
}


//[
/*
[Tf2Class.Scout, { name: 'scout', bot: false, path: 'models/player/scout', icon: scout, npc: 'scout' }],
[Tf2Class.Sniper, { name: 'sniper', bot: false, path: 'models/player/sniper', icon: sniper, npc: 'sniper' }],
[Tf2Class.Soldier, { name: 'soldier', bot: false, path: 'models/player/soldier', icon: soldier, npc: 'soldier' }],
[Tf2Class.Demoman, { name: 'demoman', bot: false, path: 'models/player/demo', icon: demoman, npc: 'demoman' }],
[Tf2Class.Medic, { name: 'medic', bot: false, path: 'models/player/medic', icon: medic, npc: 'medic' }],
[Tf2Class.Heavy, { name: 'heavy', bot: false, path: 'models/player/heavy', icon: heavy, npc: 'heavy' }],
[Tf2Class.Pyro, { name: 'pyro', bot: false, path: 'models/player/pyro', icon: pyro, npc: 'pyro' }],
[Tf2Class.Spy, { name: 'spy', bot: false, path: 'models/player/spy', icon: spy, npc: 'spy' }],
[Tf2Class.Engineer, { name: 'engineer', bot: false, path: 'models/player/engineer', icon: engineer, npc: 'engineer' }],
*/
//]


export async function characterToModel(character: CharacterTemplate): Promise<Source1ModelInstance | null> {
	let model = await Source1ModelManager.createInstance(character.game, character.modelPath, true);
	model?.playSequence(character.animation ?? 'ref');

	return model;
}

export async function itemToModel(item: ItemTemplate): Promise<Source1ModelInstance[]> {
	const models: Source1ModelInstance[] = [];
	const model = await Source1ModelManager.createInstance(item.game, item.modelPath, true);
	model?.playSequence(/*item.animation ?? */'ref');
	if (item.skin) {
		model?.setSkinId(Number(item.skin));
	}

	if (model) {
		models.push(model);
	}

	if (item.attachedModel) {
		const attachedModel = await Source1ModelManager.createInstance(item.game, item.attachedModel, true);
		attachedModel?.playSequence('ref');
		model?.addChild(attachedModel);
	}

	if (item.extraWearable) {
		const extraWearable = await Source1ModelManager.createInstance(item.game, item.extraWearable, true);
		extraWearable?.playSequence('ref');
		//model?.addChild(attachedModel);
		if (extraWearable) {
			models.push(extraWearable);
		}
	}

	return models;
}

export async function getItems(slot: Slot, team?: string): Promise<ItemTemplate[]> {
	switch (slot.getGame()) {
		case 'tf2':
			return getItemsTf2(slot, team as Tf2Team | undefined ?? 'red');
		default:
			const error = `code getItems for game ${slot.getGame()}`;
			BugReporter.reportBug('error', error)
			throw new Error(error);
	}
}

function tf2ItemToItem(item: JSONObject, characterName: string, team: Tf2Team): Tf2ItemTemplate {
	//let skin: string | undefined;
	//if (item.skin_red !== undefined) {
	//skin = item.skin_red as string;
	//}

	let skin: string;
	skin = item.skin_red as string | undefined ?? '0';

	if (team === 'blu') {
		skin = item.skin_blu as string | undefined ?? '1';
	}

	let attachedModel = item.attached_models as string;
	let extraWearable = item.extra_wearable as string;


	let skinRed = Number(item.skin_red as string);
	skinRed = isNaN(skinRed) ? 0 : skinRed;

	let skinBlu = Number(item.skin_blu as string);
	skinBlu = isNaN(skinBlu) ? 1 : skinBlu;

	return {
		id: item.defindex as string,
		slot: item.item_slot as string,
		style: item.style as string,
		game: 'tf2',
		name: item.name as string,
		icon: 'https://tf2content.loadout.tf/materials/' + item.image_inventory + '.png',//TODO: add constant
		modelPath: getTf2ModelPath(characterName, item),//item.model_player as string,// TODO: use model_player_per_class
		attachedModel,
		extraWearable,
		skin,
		skinRed,
		skinBlu,
		playerBodygroups: item.player_bodygroups as Record<string, string>,
		wmBodygroupOverride: item.wm_bodygroup_override as Record<string, string>,
	}
}

async function getItemsTf2(slot: Slot, team: Tf2Team): Promise<Tf2ItemTemplate[]> {
	const items = await getTf2ItemList();
	if (!items) {
		return [];
	}

	const result: Tf2ItemTemplate[] = [];
	const slots = slot.getSlots();
	for (const index in items.items as JSONObject) {
		const item = (items.items as JSONObject)[index] as JSONObject;
		if (slots.includes(item.item_slot as string)) {
			if (item.used_by_classes && (item.used_by_classes as JSONObject)[slot.getOwner().getName()] != 1) {
				continue;
			}

			result.push(tf2ItemToItem(item, slot.getOwner().getName(), team));
		}
	}
	return result;
}

async function getTf2ItemTemplate(characterName: string, id: string, itemSlot: string, style: string, team: Tf2Team): Promise<Tf2ItemTemplate | null> {
	console.info('item style ', style);
	const items = await getTf2ItemList();
	if (!items) {
		return null;
	}
	console.log(items);

	const result: ItemTemplate[] = []
	for (const index in items.items as JSONObject) {
		const item = (items.items as JSONObject)[index] as JSONObject;

		if (item.defindex === id && item.style === style) {
			let skin: string | undefined;
			if (item.skin_red !== undefined) {
				skin = item.skin_red as string;
			}

			return tf2ItemToItem(item, characterName, team);
		}
	}
	return null;
}

let tf2Items: Promise<JSONObject | null>;
async function getTf2ItemList(): Promise<JSONObject | null> {
	if (!tf2Items) {
		tf2Items = new Promise<JSONObject | null>(async resolve => {
			while (true) {
				const resp = await fetch('https://tf2content.loadout.tf/generated/items/items_english.json');//TODO: add var
				if (resp.ok) {
					const result = await resp.json();
					resolve(result ?? null);
					return;
				}
				setTimeoutPromise(5000);
			}
		});
	}
	return tf2Items;
}

function getTf2ModelPath(characterName: string, item: JSONObject): string {
	function convertDemo(npc: string): string {
		if (npc == 'demoman') {
			return 'demo';
		} else {
			return npc;
		}
	}

	const modelPlayerPerClass = item.model_player_per_class as Record<string, string>/*TODO: improve type*/;

	if (modelPlayerPerClass) {
		if (modelPlayerPerClass[characterName]) {
			return modelPlayerPerClass[characterName];
		}

		const basename = modelPlayerPerClass['basename'];
		if (basename) {
			const usedByClasses = item.used_by_classes as Record<string, string>/*TODO: improve type*/;
			if (usedByClasses) {
				if (usedByClasses[characterName] == '1') {
					return basename.replace(/%s/g, convertDemo(characterName));
				} else {
					const arr = Object.keys(usedByClasses);
					if (arr.length > 0) {
						return basename.replace(/%s/g, convertDemo(arr[0]!));
					}
				}
			}
		}
	}

	const modelPlayer = item.model_player as string/*TODO: improve type*/;
	if (modelPlayer) {
		return modelPlayer;
	}

	/*
	const customTauntPropPerClass = this.#definition.custom_taunt_prop_per_class as Record<string, string>/*TODO: improve type* /;
	if (customTauntPropPerClass?.[npc]) {
		return customTauntPropPerClass[npc] ?? null;
	}

	// Look for the first model_player_per_class
	if (modelPlayerPerClass) {
		const arr = Object.keys(modelPlayerPerClass);
		if (arr.length > 0) {
			return modelPlayerPerClass[arr[0]!] ?? null;
		}
	}
	*/

	return '';
}

//https://tf2content.loadout.tf/generated/items/items_english.json?t=1787917844858
//?t=${new Date().getTime()

export function getCharacter(game: Game, name: string): Character | null {
	switch (game) {
		case 'tf2':
			return getTf2Character(name);
		default:
			return null;
	}
}

export async function getItemTemplate(game: Game, characterName: string, itemId: string, itemSlot: string, itemStyle: string, team: string): Promise<ItemTemplate | null> {
	switch (game) {
		case 'tf2':
			return getTf2ItemTemplate(characterName, itemId, itemSlot, itemStyle, team as Tf2Team);
		default:
			return null;
	}
}

export function getCharacterSlot(character: CharacterTemplate, itemSlot: string): SlotTemplate | undefined {
	for (const slot of character.slots) {
		if (slot.slots.indexOf(itemSlot) !== -1) {
			return slot;
		}
	}
}
