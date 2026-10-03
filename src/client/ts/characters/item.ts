import { Entity } from 'harmony-3d';
import { Game, GameTeam } from '../misc/character';
import { Character } from './character';

export interface ItemTemplate {
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

export interface Item {
	// Item owner
	//protected character: Character;

	/*
	constructor(character: Character, template: ItemTemplate) {
		this.character = character;
	}
	*/
	getGame(): Game;
	getId(): string;
	getStyle(): string;
	getSlot(): string;

	setOwner(owner: Character): void;

	setTeam(team: GameTeam): Promise<void>;

	getModel(): Promise<Entity | null>;
	getModelPath(): string;
	getAttachedModel(): string | undefined;
	getExtraWearable(): string | undefined;
	getSkin(): string;
}
