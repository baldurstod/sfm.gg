import { Controller } from '../controller';
import { Action } from './action';

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

		//console.info(this.#undo);
		Controller.dispatchEvent('refreshtoolbar', {
			detail: {
				undoButton: this.#hasUndo(),
				redoButton: this.#hasRedo(),
			}
		});

		return action;
	}

	static commit(action: Action): void {
		action.commit();
		Controller.dispatchEvent('refreshtoolbar', {
			detail: {
				undoButton: this.#hasUndo(),
				redoButton: this.#hasRedo(),
			}
		});
	}

	static undo(): boolean {
		let action: Action | undefined;
		while (action = this.#undo.pop()) {
			if (!action || !action.hasOperations()) {
				continue;
			}
			this.#redo.push(action);
			Controller.dispatchEvent('refreshtoolbar', {
				detail: {
					undoButton: this.#hasUndo(),
					redoButton: this.#hasRedo(),
				}
			});
			return action.undo();
		}
		return false;
	}

	static redo(): boolean {
		let action: Action | undefined;
		while (action = this.#redo.pop()) {
			if (!action || !action.hasOperations()) {
				continue;
			}
			this.#undo.push(action);
			Controller.dispatchEvent('refreshtoolbar', {
				detail: {
					undoButton: this.#hasUndo(),
					redoButton: this.#hasRedo(),
				}
			});
			return action.redo();
		}
		return false;
	}

	static #hasUndo(): boolean {
		for (const undo of this.#undo) {
			if (undo.hasOperations()) {
				return true;
			}
		}
		return false;
	}

	static #hasRedo(): boolean {
		for (const redo of this.#redo) {
			if (redo.hasOperations()) {
				return true;
			}
		}
		return false;
	}
}
