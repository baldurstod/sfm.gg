import { Game } from '../misc/character';
import { Character } from './character';

export type SlotTemplate = {
	//game: Game;
	name: string;
	slots: string[];
	limit?: number;
}

/*
export interface Slot {
	getGame(): Game;
	getName(): string;
	getOwner(): Character;
	getSlots(): string[];
}
*/
export class Slot {
	#template: SlotTemplate;
	#owner: Character;

	constructor(template: SlotTemplate, owner: Character) {
		this.#template = template;
		this.#owner = owner;
	}

	getGame(): Game {
		return this.#owner.getGame();
	}

	getName(): string {
		return this.#template.name;
	}

	getOwner(): Character {
		return this.#owner;
	}

	getSlots(): string[] {
		return this.#template.slots;
	}
}


/*
export type CharacterSlot = {
	character: CharacterTemplate;
	name: string;
	slots: string[];
	//icon: string;
	/** Limit the amount of items that this slot can have. Default to no limit. * /
	limit?: number;
}
*/
