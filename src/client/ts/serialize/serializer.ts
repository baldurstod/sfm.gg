import { JSONObject, JSONValue } from 'harmony-types';
import { SfmSession } from '../session/session';
import { Serializable } from './serializable';

//export type SerializableValueSingle = string | number | Serializable;
//export type SerializableValueArray = SerializableValueSingle[];
export type JSONSerializable = { [Key: string]: JSONValue | Serializable | Serializable[] };
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

export class SFMSerializer {

	static readonly #entities = new Map<string, typeof Serializable>();

	static async unserializeJSON(file: JSONFile): Promise<SfmSession | null> {
		let loadedResolve: Function = () => { };// Note: typescript falsely complains about loadedResolve not being assigned without this.
		const loadedPromise = new Promise<void>(resolve => {
			loadedResolve = resolve;
		});

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
			element.unserialize(json, elements);
		}

		if (file.session) {
			session = elements.get(file.session) as SfmSession;
		}

		loadedResolve(true);
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
				json[key] = value as JSONValue;
			}
		}
	}

	static #serializeElementJSON(element: JSONSerializable, elements: Map<string, JSONObject>): JSONObject {
		const json: JSONObject = {};
		for (const key in element) {
			const value = element[key];

			if (value instanceof Serializable) {
				if (!elements.has(value.getId())) {

					this.#serializeElement(value, elements);

				}
				//json[key] = this.#serializeElement(value, elements);
				json[key] = value.getId();

			}

		}

		return {};
	}

	static #checkJSON(json: JSONObject): boolean {
		return true;
	}

	static #getElement(json: JSONElement): Serializable | null {
		const serializableType = this.#getSerializableClass(json.type as string);
		if (!serializableType) {
			console.error('Unknown constructor', json.type);
			return null;
		}

		return new serializableType({ name: json.name as string, id: json.id as string });
	}

	/*
	static async #fromJSON(file: SFMFile): Promise<Serializable | null> {
		let loadedResolve: Function = () => { };// Note: typescript falsely complains about loadedResolve not being assigned without this.
		const loadedPromise = new Promise<void>(resolve => {
			loadedResolve = resolve;
		});
		const entities = new Map<string, Serializable>();
		let root: Serializable | null = null;
		for (const o of file) {
			const serializable = await this.loadSerializable(o, entities, loadedPromise);
			if (!root) {
				root = serializable;
			}
		}

		loadedResolve(true);
		return root;
	}
	*/

	/*
	static async loadSerializable(jsonSerializable: JSONObject, entities: Map<string, Serializable>, loadedPromise: Promise<void>): Promise<Serializable | null> {
		const type = jsonSerializable.type;
		if (typeof type !== 'string') {
			return null;
		}
		const serializableType = this.#getSerializableClass(type);
		if (!serializableType) {
			console.error('Unknown constructor', type);
			return null;
		}
		//const serializable = await serializableType.constructFromJSON(jsonSerializable/*, entities, loadedPromise* /);
		const serializable = new serializableType({ name: jsonSerializable.name as string, id: jsonSerializable.id as string })//.constructFromJSON(jsonSerializable/*, entities, loadedPromise* /);
		if (!serializable) {
			return null;
		}
		serializable.fromJSON(jsonSerializable);
		entities.set(serializable.id, serializable);

		if (jsonSerializable.children) {
			for (const child of jsonSerializable.children as JSONObject[]) {
				const childSerializable = await this.loadSerializable(child, entities, loadedPromise);
				if (childSerializable) {
					serializable.addChild(childSerializable as Serializable);
				}
			}
		}
		return serializable;
	}
	*/

	static registerSerializable(type: typeof Serializable): void {
		const name = type.getTypeName().toLowerCase();
		if (this.#entities.has(name)) {
			throw new Error(`${name} is already registered`);
		}
		this.#entities.set(name, type);
	}

	static #getSerializableClass(name: string) {
		return this.#entities.get(name.toLowerCase());
	}
}
