import { Scene } from 'harmony-3d';
import { Serializable } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';

export class SfmScene extends Serializable {
	readonly isSfmScene = true as const;
	#scene = new Scene();

	getScene(): Scene {
		return this.#scene;
	}

	static override getTypeName(): string {
		return 'Scene';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();
		return json;
	}

	override unserialize(json: JSONSerializable, elements: Map<string, Serializable>): void {
		super.unserialize(json, elements);
	}
}

SfmSerializer.registerSerializable(SfmScene);
