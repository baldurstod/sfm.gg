import { Entity, Graphics, Source1ModelInstance, Source1ModelManager } from 'harmony-3d';
import { SerializableParameters, SerializableProperty, UnserializationContext } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';
import { SfmEntity } from './entity';
import { SfmTransform } from './transform';

export interface ModelParameters extends SerializableParameters {
	repository?: string;
	path?: string;
	skin?: string;
	bodyParts?: Map<string, string | false>;
}

export class SfmModel extends SfmEntity {
	readonly isSfmModel = true as const;
	readonly #bones: SfmTransform[] = [];
	#repository?: string;
	#path?: string;
	#skin?: string;
	#model?: Promise<Source1ModelInstance | null>;
	#bodyParts = new Map<string, string | false>();

	constructor(params: ModelParameters = {}) {
		super(params);
		this.#repository = params.repository;
		this.#path = params.path;
		this.#skin = params.skin;
		if (params.bodyParts) {
			this.setBodyParts(params.bodyParts);
		}
	}

	override getEngineEntity(): Entity | null {
		return null;
	}

	override async getEngineEntityAsync(): Promise<Entity | null> {
		if (this.#model === undefined) {
			this.#model = Promise.resolve(null);
			await Graphics.ready;

			if (this.#repository && this.#path) {
				this.#model = Source1ModelManager.createInstance(this.#repository, this.#path, true);
				this.#model.then(async model => {
					(model as Source1ModelInstance)?.playSequence('ref')
					if (this.#skin !== undefined) {
						model?.setSkinName(this.#skin);
					}
					await this.#updateBodyParts();
				});
			}
		}
		return this.#model;
	}

	async setBodyParts(bodyParts: Map<string, string | false>): Promise<void> {
		for (const [name, value] of bodyParts) {
			//await this.setBodyPart(name, value);
			this.#bodyParts.set(name, value);
		}
		await this.#updateBodyParts();
	}

	async setBodyPart(name: string, value: string | false): Promise<void> {
		this.#bodyParts.set(name, value);
		await this.#updateBodyParts();
	}

	async #updateBodyParts(): Promise<void> {
		const model = await this.#model;
		if (!model) {
			return;
		}

		model.resetBodyPartModels();
		for (const [name, value] of this.#bodyParts) {
			if (value === false) {
				model.renderBodyPart(name, false);
			} else {
				model.setBodyPartModel(name, Number(value));
			}
		}
	}

	override getProperties(): SerializableProperty[] {
		return [];
	}

	static override getTypeName(): string {
		return 'Model';
	}

	override getDefaultName(): string {
		return 'Model';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		if (this.#repository) {
			json.repository = this.#repository;
		}

		if (this.#path) {
			json.path = this.#path;
		}

		if (this.#skin) {
			json.skin = this.#skin;
		}

		if (this.#bones.length) {
			json.bones = [...this.#bones];
		}

		return json;
	}

	override unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);

		this.#repository = json.repository as string;//TODO: check value
		this.#path = json.path as string;//TODO: check value
		this.#skin = json.skin as string;//TODO: check value

		this.#bones.length = 0;
		const bones = json.bones as string[];
		if (bones) {

			for (const boneId of bones) {
				const bone = context.elements.get(boneId) as SfmTransform | undefined; // TODO: check if it's actually a transform

				if (bone) {
					this.#bones.push(bone);
				}
			}
		}
	}
}

SfmSerializer.registerSerializable(SfmModel);
