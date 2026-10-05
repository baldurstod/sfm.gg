import { Entity } from 'harmony-3d';
import { Game, GameTeam } from '../misc/character';
import { Dota2Character, Dota2CharacterTemplate } from './dota2';
import { Item, ItemTemplate } from './item';
import { Slot, SlotTemplate } from './slot';
import { Tf2Character } from './tf2';

export type CharacterTemplate = {
	game: Game;
	name: string;
	label: string;
	icon: string;
	modelPath: string;
	animation?: string;
	keywords?: string[];
	slots: SlotTemplate[];
}

export interface Character {
	/*
	// Game this character is part of
	game: Game;
	// Character name
	readonly name: string;
	// Label
	readonly label: string;
	// PNG icon as string
	readonly icon: string;

	modelPath: string;
	animation?: string;
	keywords?: string[];
	slots: CharacterSlot[];
	items: Map<string, Item>;
	*/

	//new(template: CharacterTemplate): Character;
	//constructor(make: string, model: string, year: number): Character;

	getGame(): Game;
	getName(): string;
	getLabel(): string;

	setTeam(team: GameTeam): Promise<void>;
	getTeam(): GameTeam | undefined;

	hasItem(item: ItemTemplate): boolean;
	equipItem(item: ItemTemplate): Promise<void>;
	unequipItem(item: ItemTemplate): Promise<void>;
	getItems(): Map<string, Item>;

	getModel(): Promise<Entity | null>;
	getModelPath(): string;
	getBodyParts(): Map<string, string | false>;

	getSlots(): Slot[];

	getTemplate(): CharacterTemplate;

	select(): Promise<void>
}

/*
export abstract class Character {
	// Game this character is part of
	protected game: Game;
	// Character team
	protected team?: GameTeam;

	protected readonly items = new Map<string, Item>();

	constructor(template: CharacterTemplate) {
		this.game = template.game;
	}

	getGame(): Game {
		return this.game;
	}

	setTeam(team: GameTeam): void {
		this.team = team;

	}

	getTeam(): GameTeam | undefined {
		return this.team;
	}

	/*
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

	* /
}
*/

export function createCharacter(template: CharacterTemplate): Character {
	const game = template.game;
	switch (game) {
		case 'tf2':
			return new Tf2Character(template);
		case 'dota2':
			return new Dota2Character(template as Dota2CharacterTemplate);
		default:
			throw new Error(`Can't create character: unknown game ${game}`);
	}
}
