import { Scene } from 'harmony-3d';
import { Serializable } from '../serialize/serializable';
import { SfmSerializer } from '../serialize/serializer';

export class SfmScene extends Serializable {
	readonly isSfmScene = true as const;
	#scene = new Scene();

	getScene(): Scene {
		return this.#scene;
	}

	static override getTypeName(): string {
		return 'Scene';
	}
}

SfmSerializer.registerSerializable(SfmScene);
