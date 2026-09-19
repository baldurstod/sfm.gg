import { Serializable, SerializableParameters, SerializableProperty, SerializablePropertyValue, UnserializationContext } from '../../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../../serialize/serializer';
import { RenderSettingsParameters, SfmRenderSettings } from './rendersettings';

export interface SessionSettingsParameters extends SerializableParameters {
	renderSettings?: RenderSettingsParameters;
}

export class SfmSessionSettings extends Serializable {
	readonly isSfmSessionSettings = true as const;
	#renderSettings: SfmRenderSettings;

	constructor(params: SessionSettingsParameters = {}) {
		super(params);
		this.#renderSettings = new SfmRenderSettings(params.renderSettings);
	}

	static override getTypeName(): string {
		return 'SessionSettings';
	}

	override getDefaultName(): string {
		return 'Session settings';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		if (this.#renderSettings) {
			json.render_settings = this.#renderSettings;
		}

		return json;
	}

	override unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);

		if (json.render_settings) {
			this.#renderSettings = (context.elements.get(json.render_settings as string) as SfmRenderSettings | undefined) ?? new SfmRenderSettings(); // TODO: check if it's actually a session settings
		}
	}

	override getProperties(): SerializableProperty[] {
		return [
			{
				name: 'renderSettings',
				i18n: '#render_settings',
				type: 'element',
				settable: false,
			},
		];
	}

	override getProperty(name: string): SerializablePropertyValue {
		switch (name) {
			case 'renderSettings':
				return this.#renderSettings;
			default:
				throw new Error("do me " + name);
		}
	}
}

SfmSerializer.registerSerializable(SfmSessionSettings);
