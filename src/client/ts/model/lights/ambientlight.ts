import { AmbientLight, PointLight } from 'harmony-3d';
import { SerializableProperty, SerializablePropertyValue, UnserializationContext } from '../../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../../serialize/serializer';
import { SfmLight } from './light';

export class SfmAmbientLight extends SfmLight {
	readonly isSfmAmbientLight = true as const;
	#light = new AmbientLight();

	override getEngineEntity(): AmbientLight {
		return this.#light;
	}

	static override getTypeName(): string {
		return 'AmbientLight';
	}

	override getDefaultName(): string {
		return 'Ambient light';
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

SfmSerializer.registerSerializable(SfmAmbientLight);
