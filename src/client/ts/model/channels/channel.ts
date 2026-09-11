import { Command } from '../../history/action';
import { Serializable, SerializableParameters, UnserializationContext } from '../../serialize/serializable';
import { JSONSerializable } from '../../serialize/serializer';

export interface ChannelParameters extends SerializableParameters {
	fromElement?: Serializable;
	fromAttribute?: string;
	fromIndex?: number;
	toElement?: Serializable;
	toAttribute?: string;
	toIndex?: number;
}

export class SfmChannel extends Serializable {
	readonly isSfmChannel = true as const;

	#fromElement: Serializable | null;
	#fromAttribute: string;
	#fromIndex: number;
	#toElement: Serializable | null;
	#toAttribute: string;
	#toIndex: number;

	constructor(params: ChannelParameters) {
		super(params);
		this.#fromElement = params.fromElement ?? null;
		this.#fromAttribute = params.fromAttribute ?? '';
		this.#fromIndex = params.fromIndex ?? 0;
		this.#toElement = params.toElement ?? null;
		this.#toAttribute = params.toAttribute ?? '';
		this.#toIndex = params.toIndex ?? 0;
	}

	do(command: Command): boolean {
		switch (command.command) {
			case 'set-from-element':
				command.undoParams = this.#fromElement;
				this.#fromElement = command.params;//TODO: check if it's a suitable element
				return true;
			case 'set-from-attribute':
				command.undoParams = this.#fromAttribute;
				this.#fromAttribute = command.params;//TODO: check if it's a string
				return true;
			case 'set-from-index':
				command.undoParams = this.#fromIndex;
				this.#fromIndex = command.params;//TODO: check if it's a positive integer
				return true;
			case 'set-to-element':
				command.undoParams = this.#toElement;
				this.#toElement = command.params;//TODO: check if it's a suitable element
				return true;
			case 'set-to-attribute':
				command.undoParams = this.#toAttribute;
				this.#toAttribute = command.params;//TODO: check if it's a string
				return true;
			case 'set-to-index':
				command.undoParams = this.#toIndex;
				this.#toIndex = command.params;//TODO: check if it's a positive integer
				return true;
			default:
				return super.do(command);
		}
	}

	undo(command: Command): boolean {
		switch (command.command) {
			case 'set-from-element':
				this.#fromElement = command.undoParams;
				return true;
			case 'set-from-attribute':
				this.#fromAttribute = command.undoParams;
				return true;
			case 'set-from-index':
				this.#fromIndex = command.undoParams;
				return true;
			case 'set-to-element':
				this.#toElement = command.undoParams;
				return true;
			case 'set-to-attribute':
				this.#toAttribute = command.undoParams;
				return true;
			case 'set-to-index':
				this.#toIndex = command.undoParams;
				return true;
			default:
				return super.undo(command);
		}
	}

	static override getTypeName(): string {
		return 'Channel';
	}

	override getDefaultName(): string {
		return 'Channel';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		json.from_element = this.#fromElement;
		json.from_attribute = this.#fromAttribute;
		json.from_index = this.#fromIndex;
		json.to_element = this.#toElement;
		json.to_attribute = this.#toAttribute;
		json.to_index = this.#toIndex;

		return json;
	}

	override unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);


		if (json.from_element) {
			this.#fromElement = context.elements.get(json.from_element as string) as Serializable | null; // TODO: check if it's actually a Serializable
		}

		this.#fromAttribute = json.from_attribute as string ?? '';//TODO:check the actual value
		this.#fromIndex = json.from_index as number ?? 0;//TODO:check the actual value

		if (json.to_element) {
			this.#toElement = context.elements.get(json.to_element as string) as Serializable | null; // TODO: check if it's actually a Serializable
		}


		this.#toAttribute = json.to_attribute as string ?? '';//TODO:check the actual value
		this.#toIndex = json.to_index as number ?? 0;//TODO:check the actual value
	}
}
