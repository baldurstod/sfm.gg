import { PointLight } from 'harmony-3d';
import { SerializableProperty, SerializablePropertyValue, UnserializationContext } from '../../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../../serialize/serializer';
import { SfmEntity } from '../entity';

export class SfmPointLight extends SfmEntity {
	readonly isSfmPointLight = true as const;
	#light = new PointLight();

	override getEngineEntity(): PointLight {
		return this.#light;
	}

	static override getTypeName(): string {
		return 'PointLight';
	}

	override getDefaultName(): string {
		return 'Point light';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();


		return json;
	}

	override unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);

	}

	override getProperties(): SerializableProperty[] {
		return [
			/*
			{
				name: 'TODO',
				i18n: '#TODO',
				settable: true,
			},
			*/
		];
	}

	override getProperty(name: string): SerializablePropertyValue {
		switch (name) {
			case 'TODO':
				return 'TODO';
			default:
				throw new Error("do me " + name);
		}
	}
}

SfmSerializer.registerSerializable(SfmPointLight);
