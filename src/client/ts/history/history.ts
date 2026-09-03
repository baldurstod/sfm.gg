import { Action, Undoable } from './action';

export class History {
	static #undo: Action[] = [];
	static #redo: Action[] = [];

	/**
	 * Create an action. An action is a list of atomic operations
	 * @returns The created action
	 */
	static startAction(): Action {
		const action = new Action();

		this.#undo.push(action);
		if (this.#redo.length > 0) {
			this.#redo = [];
		}

		console.info(this.#undo);

		return action;
	}

	static do(element: Undoable, command: string, params: any): boolean {
		const action = this.startAction();
		return action.do(element, command, params);
	}

	static undo(): boolean {
		let action: Action | undefined;
		while (action = this.#undo.pop()) {
			if (!action || !action.hasOperations()) {
				continue;
			}
			return action.undo();
		}
		return false;
	}
}
