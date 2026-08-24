import { generateRandomUUID } from 'harmony-3d';
import { JSONObject } from 'harmony-types';
import { JSONSerializable } from './serializer';

/*
export interface Serializable
{
	id: string;
	name: string;
	new(): Serializable;
	fromJSON: (json: JSONObject) => void;
	toJSON: () => JSONObject;
	//static test: () => void;
}
*/

export interface SerializableParameters {
	id?: string;
	name?: string;
}

export class Serializable {
	readonly isSerializable = true as const;
	id: string;
	name: string;
	protected readonly children = new Set<Serializable>();

	constructor(params: SerializableParameters = {}) {
		this.id = params.id ?? generateRandomUUID();
		this.name = params.name ?? '';
	}

	addChild(child: Serializable): Serializable | null {
		if (child === this) {
			console.log('Cannot add a serializable as child of itself');
			return child;
		}
		if (this.hasDescendant(child)) {
			console.info(child, ' is already a child of ', this);
			return child;
		}

		this.children.add(child);
		return child;
	}

	addChilds(...childs: Serializable[]): void {
		childs.forEach(child => this.addChild(child));
	}

	/**
	 * Search a child in any of the descendant
	 * @param search The child to look for
	 * @returns True if any of the descendant has the child, false otherwise
	 */
	hasDescendant(search: Serializable): boolean {
		const ws = new WeakSet<Serializable>();
		const objectStack: Serializable[] = [];

		let currentSerializable: Serializable | undefined = this;

		while (currentSerializable) {
			for (const child of currentSerializable.children) {
				if (search === child) {
					return true
				}
				if (!ws.has(child)) {
					objectStack.push(child);
					ws.add(child);
				}
			}
			currentSerializable = objectStack.shift();
		}
		return false;
	}

	static getTypeName(): string {
		throw new Error('override me');
	}

	/*
	static async constructFromJSON(json: JSONObject): Promise<Serializable> {
		//return new Material(json.parameters as MaterialParams/*TODO: check validity* /);
		//return new Serializable();
		throw new Error('override me');
	}
	*/

	serialize(json: JSONObject, elements: Map<string, Serializable>): void {
		this.id = json.id as string;
		this.name = json.name as string;
	}

	unserialize(): JSONSerializable {
		return {
			id: this.id,
			name: this.name,
			type: (this.constructor as typeof Serializable).getTypeName(),
		};
	}
}
