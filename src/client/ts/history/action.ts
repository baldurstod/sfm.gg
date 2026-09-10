import { SfmClip } from '../model/clips/clip';
import { SfmFilmClip } from '../model/clips/filmclip';
import { SfmEntity } from '../model/entity';
import { SfmNode } from '../model/node';
import { SfmTrack } from '../model/track';
import { SfmTrackGroup } from '../model/trackgroup';
import { Serializable } from '../serialize/serializable';

export interface Undoable {
	do(command: Command): boolean;
	undo(command: Command): boolean;
}

/**
 * A single command. Multiple commands part of the same action will be undone at once.
 */
export class Command<C extends string = string, T = any/*TODO: improve type*/> {
	readonly element: Undoable;
	readonly command: C;
	readonly params: T;
	readonly action: Action;
	undoParams: any/*TODO: improve type*/;

	constructor(action: Action, element: Undoable, command: C, params: T) {
		this.action = action;
		this.element = element;
		this.command = command;
		this.params = params;
	}

	undo(): boolean {
		return this.element.undo(this);
	}

	redo(): boolean {
		return this.element.do(this);
	}
}

/**
 * An action is an operation or a list of operation that will be undone all at once
 */
export class Action {
	#operations: Command[] = [];
	#committed = false;

	do(element: Serializable, command: 'set-name', params: string): boolean;
	do(element: SfmClip, command: 'set-end', params: number): boolean;
	do(element: SfmClip, command: 'set-start', params: number): boolean;
	do(element: SfmFilmClip, command: 'add-selected-clip', params: SfmClip): boolean;
	do(element: SfmFilmClip, command: 'add-track-group', params: SfmTrackGroup): boolean;
	do(element: SfmFilmClip, command: 'delete-track-group', params: SfmTrackGroup): boolean;
	do(element: SfmFilmClip, command: 'set-selected-clip', params: SfmClip): boolean;
	do(element: SfmNode, command: 'add-child', params: SfmNode): boolean;
	do(element: SfmNode, command: 'set-entity', params: SfmEntity): boolean;
	do(element: SfmNode, command: 'set-parent', params: SfmNode): boolean;
	do(element: SfmTrack, command: 'add-clip', params: SfmClip): boolean;
	do(element: SfmTrack, command: 'delete-clip', params: SfmClip): boolean;
	do(element: SfmTrackGroup, command: 'add-track', params: SfmTrack): boolean;
	do(element: SfmTrackGroup, command: 'delete-track', params: SfmTrack): boolean;

	do(element: Undoable, command: string, params: any): boolean {
		const operation = new Command(this, element, command, params);
		const result = element.do(operation);
		if (!result) {
			return false;
		}

		this.#operations.push(operation);
		return true;
	}

	undo(): boolean {
		let operation: Command;

		for (let i = this.#operations.length - 1; i >= 0; --i) {
			operation = this.#operations[i]!
			if (!operation.undo()) {
				return false;
			}
		}
		return true;
	}

	redo(): boolean {
		let operation: Command;

		for (const operation of this.#operations) {
			if (!operation.redo()) {
				return false;
			}
		}
		return true;
	}

	commit(): void {
		this.#committed = true;
	}

	isCommitted(): boolean {
		return this.#committed;
	}

	hasOperations(): boolean {
		return this.#operations.length > 0;
	}
}
