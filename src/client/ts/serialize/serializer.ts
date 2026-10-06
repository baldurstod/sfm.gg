import { JSONObject, JSONValue } from 'harmony-types';
import { SfmSession } from '../model/session';
import { ConcreteSerializable, Serializable } from './serializable';

//export type SerializableValueSingle = string | number | Serializable;
//export type SerializableValueArray = SerializableValueSingle[];
export type JSONSerializable = Record<string, JSONValue | Serializable | Serializable[]>//{ [Key: string]: JSONValue | Serializable | Serializable[] };
//
//export type SFMFile = JSONSerializable[];

/*
export declare interface JSONSerializable {
	[k: string]: JSONSerializableValue;
}
*/

export declare type JSONSerializableValue = JSONValue | Serializable;

/*
export type JSONFile = {
	file_infos: JSONSerializable;
	session: JSONSerializable;
	elements: JSONSerializable[];
};
*/
export type JSONElement = {
	id: string;
	name: string;
	type: string;
	[Key: string]: JSONValue | Serializable | Serializable[]
};

export type JSONFile = {
	file_infos: JSONObject;
	session: string;
	elements: JSONElement[];
};

export class SfmSerializer {

	static readonly #entities = new Map<string, ConcreteSerializable>();

	static unserializeJSON(file: JSONFile): SfmSession | null {
		/*
		let loadedResolve: (value: boolean) => void;
		const loadedPromise = new Promise<boolean>(resolve => {
			loadedResolve = resolve;
		});
		*/

		let session: SfmSession | null = null;
		const elements = new Map<string, Serializable>();
		const elements2 = new Map<Serializable, JSONElement>();

		// Step 1: recreate the elements
		for (const elementJSON of file.elements) {
			const element = this.#getElement(elementJSON);
			if (element) {
				elements.set(element.getId(), element);
				elements2.set(element, elementJSON);
			}
		}

		/*
		// Step 2: replace the Ids with their element counter part
		for (const [, elementJSON] of elements2) {
			for (const key in elementJSON) {
				// Discard known keys
				if (key === 'id' || key === 'name' || key === 'type') {
					continue;
				}

				const value = elementJSON[key];
				if (typeof value === 'string') {
					// Single value
					const element = elements.get(value);
					if (element) {
						elementJSON[key] = element;
					}
				} else if (Array.isArray(value)) {
					const arr: JSONSerializableValue[] = [];
					for (const arrayValue of value) {
						if (typeof arrayValue === 'string') {
							const element = elements.get(arrayValue);
							if (element) {
								elementJSON[key] = arrayValue;
								arr.push(element);
							}

							if (!elements.has(arrayValue)) {
								this.#serializeElement(arrayValue, elements);
							}
							arr.push(arrayValue.id);
						} else {
							arr.push(arrayValue);
						}
					}
					elementJSON[key] = arr;
				}
			}
		}
			*/

		/*
		const getElement = <T extends Serializable>(id: string, type:): T | null => {

			const elem = elements.get(id);
			if (elem && (elem.constructor as typeof Serializable).getTypeName() === ) {
				return elem;
			}

			return null;
		}
		*/

		for (const [element, json] of elements2) {
			element.unserialize(json, { elements, fileVersion: 1/*TODO: add an actual file version*/ });
		}

		if (file.session) {
			session = elements.get(file.session) as SfmSession;
		}

		//loadedResolve!(true);
		return session;
	}

	static serializeJSON(session: SfmSession): JSONFile {
		//const elements = new Map<string, Serializable>();
		//const json = session.toJSON();
		const elementsMap = new Map<string, JSONObject>();
		this.#serializeElement(session, elementsMap);


		const elements: JSONElement[] = [];
		for (const [, e] of elementsMap) {
			elements.push(e as JSONElement);
		}

		return {
			file_infos: {},
			session: session.getId(),
			elements,
		}
	}

	static #serializeElement(element: Serializable, elements: Map<string, JSONObject>): void {
		const serialized = element.serialize();
		const json: JSONObject = {};
		elements.set(serialized.id as string, json);

		for (const key in serialized) {
			const value = serialized[key];

			if (value instanceof Serializable) {
				if (!elements.has(value.getId())) {
					this.#serializeElement(value, elements);
				}
				json[key] = value.getId();
			} else if (Array.isArray(value)) {
				const arr: JSONValue[] = [];
				for (const arrayValue of value) {
					if (arrayValue instanceof Serializable) {
						if (!elements.has(arrayValue.getId())) {
							this.#serializeElement(arrayValue, elements);
						}
						arr.push(arrayValue.getId());
					} else {
						arr.push(arrayValue);
					}
				}
				json[key] = arr;
			} else {
				json[key] = value;
			}
		}
	}

	/*
	static #checkJSON(json: JSONObject): boolean {
		return true;
	}
	*/

	static #getElement(json: JSONElement): Serializable | null {
		const serializableType = this.#getSerializableClass(json.type);
		if (!serializableType) {
			console.error('Unknown constructor', json.type);
			return null;
		}

		/* eslint-disable @typescript-eslint/no-explicit-any */
		/* eslint-disable @typescript-eslint/no-unsafe-call */
		// We cast the type because Serializable is abstract. However the actual class is guaranteed to be concrete: registerSerializable enforce this
		return new (serializableType as any)({ name: json.name, id: json.id }) as Serializable;
		/* eslint-enable @typescript-eslint/no-explicit-any */
		/* eslint-enable @typescript-eslint/no-unsafe-call */

	}

	/**
	 * Register concrete subclasses of Serializable
	 * @param type Subclass to register
	 */
	static registerSerializable(type: ConcreteSerializable): void {
		const name = type.getTypeName().toLowerCase();
		if (this.#entities.has(name)) {
			throw new Error(`${name} is already registered`);
		}
		this.#entities.set(name, type);
	}

	static #getSerializableClass(name: string): ConcreteSerializable | undefined {
		return this.#entities.get(name.toLowerCase());
	}
}
