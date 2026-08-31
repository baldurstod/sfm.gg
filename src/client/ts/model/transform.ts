import { quat, ReadonlyQuat, ReadonlyVec3, vec3 } from 'gl-matrix';
import { Serializable, SerializableParameters, UnserializationContext } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';

const DEFAULT_POS = vec3.create();
const DEFAULT_ORIENTATION = quat.create();
const DEFAULT_SCALE = vec3.fromValues(1, 1, 1);

export interface TransformParameters extends SerializableParameters {
	position?: ReadonlyVec3;
	orientation?: ReadonlyQuat;
	scale?: ReadonlyVec3;
}

export class SfmTransform extends Serializable {
	readonly isSfmTransform = true as const;
	#position = vec3.create();
	#orientation = quat.create();
	#scale = vec3.create();

	constructor(params: TransformParameters = {}) {
		super(params);
		this.#init(params);
	}

	#init(params: TransformParameters = {}): void {
		vec3.copy(this.#position, params.position ?? DEFAULT_POS);
		vec3.copy(this.#orientation, params.orientation ?? DEFAULT_ORIENTATION);
		vec3.copy(this.#scale, params.scale ?? DEFAULT_SCALE);
	}

	reset() {
		vec3.zero(this.#position);
		quat.identity(this.#orientation);
		vec3.set(this.#scale, 1, 1, 1);
	}

	static override getTypeName(): string {
		return 'Transform';
	}

	override getDefaultName(): string {
		return 'Transform';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		json.position = [...this.#position];
		json.orientation = [...this.#orientation];
		json.scale = [...this.#scale];

		return json;
	}

	override unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);

		this.#init(json);
	}
}

SfmSerializer.registerSerializable(SfmTransform);
