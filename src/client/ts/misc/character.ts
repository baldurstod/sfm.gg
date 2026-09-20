//import demoman from '../../img/tf2/class/demoman.png';
import { PartialBy, Source1ModelInstance, Source1ModelManager } from 'harmony-3d';
import { JSONObject } from 'harmony-types';
import { BugReporter, setTimeoutPromise } from 'harmony-utils';
import demoman from '../../img/tf2/class/demoman.png';
import engineer from '../../img/tf2/class/engineer.png';
import heavy from '../../img/tf2/class/heavy.png';
import medic from '../../img/tf2/class/medic.png';
import pyro from '../../img/tf2/class/pyro.png';
import scout from '../../img/tf2/class/scout.png';
import sniper from '../../img/tf2/class/sniper.png';
import soldier from '../../img/tf2/class/soldier.png';
import spy from '../../img/tf2/class/spy.png';


export type CharacterSlot = {
	character: Character;
	name: string;
	slots: string[];
	//icon: string;
	/** Limit the amount of items that this slot can have. Default to no limit. */
	limit?: number;
}

export type GameList = 'tf2';

export type Character = {
	game: GameList;
	name: string;
	icon: string;
	modelPath: string;
	animation?: string;
	keywords?: string[];
	slots?: CharacterSlot[];
	items: Set<Item>;
}

export type Item = {
	game: GameList;
	id: string;
	slot: string;
	slotName: string;
	style: string;
	name: string;
	icon: string;
	modelPath: string;
	skin?: string;
	keywords?: string[];
}

const tf2Characters: PartialBy<Character, 'game' | 'items'>[] = [
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
function populateTf2Character(character: Character): void {
	character.game = 'tf2';
	character.animation = 'stand_secondary';
	character.slots = [
		{
			character,
			name: 'weapon',
			slots: ['primary', 'secondary', 'melee'],
			limit: 1,
		},
		{
			character,
			name: 'hat',
			slots: ['head'],
		},
		{
			character,
			name: 'misc',
			slots: ['misc'],
		},
	];
}

export function getTf2Characters(): PartialBy<Character, 'items'>[] {
	const characters = structuredClone(tf2Characters) as Character[];

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

	const character = structuredClone(partialCharacter) as Character;
	populateTf2Character(character);
	character.items = new Set<Item>();
	return character;
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


export async function characterToModel(character: Character): Promise<Source1ModelInstance | null> {
	let model = await Source1ModelManager.createInstance(character.game, character.modelPath, true);
	model?.playSequence(character.animation ?? 'ref');

	return model;
}

export async function itemToModel(item: Item): Promise<Source1ModelInstance | null> {
	let model = await Source1ModelManager.createInstance(item.game, item.modelPath, true);
	model?.playSequence(/*item.animation ?? */'ref');
	if (item.skin) {
		model?.setSkin(item.skin);
	}

	return model;
}

export async function getItems(slot: CharacterSlot): Promise<Item[]> {
	switch (slot.character.game) {
		case 'tf2':
			return getItemsTf2(slot);
		default:
			const error = `code getItems for game ${slot.character.game}`;
			BugReporter.reportBug('error', error)
			throw new Error(error);
	}
}

async function getItemsTf2(slot: CharacterSlot): Promise<Item[]> {
	const items = await getTf2ItemList();
	if (!items) {
		return [];
	}
	console.log(items);

	const result: Item[] = []
	for (const index in items.items as JSONObject) {
		const item = (items.items as JSONObject)[index] as JSONObject;
		if (slot.slots.includes(item.item_slot as string)) {
			if (item.used_by_classes && (item.used_by_classes as JSONObject)[slot.character.name] != 1) {
				continue;
			}

			let skin: string | undefined;
			if (item.skin_red !== undefined) {
				skin = item.skin_red as string;
			}

			result.push({
				id: item.defindex as string,
				slot: item.item_slot as string,
				slotName: slot.name,
				style: item.style as string,
				game: slot.character.game,
				name: item.name as string,
				icon: 'https://tf2content.loadout.tf/materials/' + item.image_inventory + '.png',//TODO: add constant
				modelPath: getTf2ModelPath(slot.character.name, item),//item.model_player as string,// TODO: use model_player_per_class
				skin,
			});
		}
	}
	return result;
}

async function getTf2Item(characterName: string, id: string, itemSlot: string, style: string): Promise<Item | null> {
	console.info('item style ', style);
	const items = await getTf2ItemList();
	if (!items) {
		return null;
	}
	console.log(items);

	const result: Item[] = []
	for (const index in items.items as JSONObject) {
		const item = (items.items as JSONObject)[index] as JSONObject;

		if (item.defindex === id && item.style === style) {
			let skin: string | undefined;
			if (item.skin_red !== undefined) {
				skin = item.skin_red as string;
			}

			return {
				id: item.defindex as string,
				slot: item.item_slot as string,
				slotName: itemSlot,
				style: item.style as string,
				game: 'tf2',
				name: item.name as string,
				icon: 'https://tf2content.loadout.tf/materials/' + item.image_inventory + '.png',//TODO: add constant
				modelPath: getTf2ModelPath(characterName, item),//item.model_player as string,// TODO: use model_player_per_class
				skin,
			}
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

export function getCharacter(game: GameList, name: string): Character | null {
	switch (game) {
		case 'tf2':
			return getTf2Character(name);
		default:
			return null;
	}
}

export async function getItem(game: GameList, characterName: string, itemId: string, itemSlot: string, itemStyle: string): Promise<Item | null> {
	switch (game) {
		case 'tf2':
			return getTf2Item(characterName, itemId, itemSlot, itemStyle);
		default:
			return null;
	}
}
