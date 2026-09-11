import { Command } from '../../history/action';
import { UnserializationContext } from '../../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../../serialize/serializer';
import { SfmChannel } from '../channels/channel';
import { SfmClip, SfmClipType } from './clip';

export class SfmChannelClip extends SfmClip {
	readonly isSfmChannelClip = true as const;
	#channels = new Set<SfmChannel>();

	getClipType(): SfmClipType {
		return 'channel';
	}

	createClip(name: string): SfmClip {
		return new SfmChannelClip({ name });
	}

	do(command: Command): boolean {
		switch (command.command) {
			case 'add-channel':
				command.undoParams = new Set<SfmChannel>(this.#channels);
				this.#channels.add(command.params);//TODO: check if it's actually a channel
				return true;
			default:
				return super.do(command);
		}
	}

	undo(command: Command): boolean {
		switch (command.command) {
			case 'add-channel':
				this.#channels.clear();
				(command.undoParams as Set<SfmChannel>).forEach(channel => this.#channels.add(channel));
				return true;
			default:
				return super.undo(command);
		}
	}

	static override getTypeName(): string {
		return 'ChannelClip';
	}

	override getDefaultName(): string {
		return 'Channel clip';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		if (this.#channels.size) {
			json.channels = [...this.#channels];
		}

		return json;
	}

	override unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);

		if (json.channels) {
			for (const channelId of json.channels as string[]) {
				const channel = context.elements.get(channelId) as SfmChannel | undefined; // TODO: check if it's actually a channel

				if (channel) {
					this.#channels.add(channel);
				}
			}
		}
	}
}

SfmSerializer.registerSerializable(SfmChannelClip);
