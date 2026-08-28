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
}

export type Item = {
	game: GameList;
	name: string;
	icon: string;
	modelPath: string;
	keywords?: string[];
}

const tf2Characters: PartialBy<Character, 'game'>[] = [
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

export function getTf2Characters(): Character[] {
	const characters = structuredClone(tf2Characters) as Character[];

	for (const character of characters) {
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

		]
	}

	return characters;
	/*
	slots: [
		{
			name: 'weapon',
			limit: 1,
		}
	],
	*/
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

			result.push({
				game: slot.character.game,
				name: item.name as string,
				icon: 'https://tf2content.loadout.tf/materials/' + item.image_inventory + '.png',//TODO: add constant
				modelPath: getTf2ModelPath(slot, item),//item.model_player as string,// TODO: use model_player_per_class
			});
		}
	}
	return result;
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

function getTf2ModelPath(slot: CharacterSlot, item: JSONObject): string {
	function convertDemo(npc: string): string {
		if (npc == 'demoman') {
			return 'demo';
		} else {
			return npc;
		}
	}
	//let modelPlayer = '';
	const characterId = slot.character.name;

	const modelPlayerPerClass = item.model_player_per_class as Record<string, string>/*TODO: improve type*/;

	if (modelPlayerPerClass) {
		if (modelPlayerPerClass[characterId]) {
			return modelPlayerPerClass[characterId];
		}

		const basename = modelPlayerPerClass['basename'];
		if (basename) {
			const usedByClasses = item.used_by_classes as Record<string, string>/*TODO: improve type*/;
			if (usedByClasses) {
				if (usedByClasses[characterId] == '1') {
					return basename.replace(/%s/g, convertDemo(characterId));
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
