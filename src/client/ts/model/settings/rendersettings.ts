import { Serializable, SerializableParameters, SerializableProperty, SerializablePropertyValue, UnserializationContext } from '../../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../../serialize/serializer';

export interface RenderSettingsParameters extends SerializableParameters {
	/** Frame rate. Default to 24 */
	frameRate?: number;
}

export class SfmRenderSettings extends Serializable {
	readonly isSfmRenderSettings = true as const;
	frameRate: number;

	constructor(params: RenderSettingsParameters = {}) {
		super(params);

		this.frameRate = params.frameRate ?? 24;
	}

	static override getTypeName(): string {
		return 'RenderSettings';
	}

	override getDefaultName(): string {
		return 'Render settings';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		json.frame_rate = this.frameRate;

		return json;
	}

	override unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);

		this.frameRate = json.frame_rate as number ?? 24;// TODO: check the actual value
	}

	override getProperties(): SerializableProperty[] {
		return [
			{
				name: 'frameRate',
				i18n: '#frame_rate',
				type: 'integer',
				settable: true,
			},
		];
	}

	override getProperty(name: string): SerializablePropertyValue {
		switch (name) {
			case 'frameRate':
				return this.frameRate;
			default:
				throw new Error("do me " + name);
		}
	}
}

SfmSerializer.registerSerializable(SfmRenderSettings);
