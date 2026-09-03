import { Command, Undoable } from '../../history/action';
import { Serializable, SerializableParameters, UnserializationContext } from '../../serialize/serializable';
import { JSONSerializable } from '../../serialize/serializer';
import { SfmTimeFrame, TimeFrameParameters } from '../timeframe';
import { SfmTrack } from '../track';

export type SfmClipType = 'channel' | 'sound' | 'effect' | 'film' | 'operator';

export interface ClipParameters extends SerializableParameters {
	timeFrame?: TimeFrameParameters;
}

export type SfmClipCommand = 'set-start' | 'set-end';

export abstract class SfmClip extends Serializable implements Undoable {
	readonly isSfmClip = true as const;
	#timeFrame: SfmTimeFrame//= new SfmTimeFrame();
	track: SfmTrack | null = null;

	constructor(params: ClipParameters = {}) {
		super(params);
		this.#timeFrame = new SfmTimeFrame(params.timeFrame);
	}

	getStart(): number {
		return this.#timeFrame.getStart();
	}

	getEnd(): number {
		return this.#timeFrame.getEnd();
	}

	getDuration(): number {
		return this.#timeFrame.getDuration();
	}

	inTimeFrame(time: number): boolean {
		return this.#timeFrame.inTimeFrame(time);
	}

	do(command: Command): boolean {
		switch (command.command) {
			case 'set-start':
				const start = this.#timeFrame.getStart();
				this.#timeFrame.setStart(command.params as number);
				command.undoParams = start;
				return true;
			case 'set-end':
				const end = this.#timeFrame.getEnd();
				this.#timeFrame.setEnd(command.params as number);
				command.undoParams = end;
				return true;
			default:
				return super.do(command);
		}
	}

	undo(command: Command): boolean {
		switch (command.command) {
			case 'set-start':
				this.#timeFrame.setStart(command.undoParams as number);
				return true;
			case 'set-end':
				this.#timeFrame.setEnd(command.undoParams as number);
				return true;
			default:
				return super.undo(command);
		}
	}

	abstract getClipType(): SfmClipType;
	abstract createClip(): SfmClip;

	static override getTypeName(): string {
		return 'Clip';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		json.time_frame = this.#timeFrame;

		return json;
	}

	override unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);

		if (json.time_frame) {
			this.#timeFrame = (context.elements.get(json.time_frame as string) as SfmTimeFrame | undefined) ?? new SfmTimeFrame(); // TODO: check if it's actually a timeframe
		}
	}
}
