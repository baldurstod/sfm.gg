import { Camera } from 'harmony-3d';
import { Clip } from './session/clip';
import { Session } from './session/session';

export type ControllerEvent = 'setsession' | 'cameraadded' | 'setactiveclip' | 'setactivecamera' | 'addcamera';

interface ControllerEventInit<T = any> extends EventInit {
	detail: T;
}

export class Controller {
	static readonly #eventTarget = new EventTarget();

	static addEventListener(type: 'setsession', callback: (evt: CustomEvent<Session>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'cameraadded', callback: (evt: CustomEvent<CameraAdded>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'setactiveclip', callback: (evt: CustomEvent<Clip>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'setactivecamera', callback: (evt: CustomEvent<SetActiveCamera>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'addcamera', callback: (evt: CustomEvent<Camera | null>) => void, options?: AddEventListenerOptions | boolean): void;

	static addEventListener(type: ControllerEvent, callback: (evt: CustomEvent) => void, options?: AddEventListenerOptions | boolean): void {
		this.#eventTarget.addEventListener(type, callback as (evt: Event) => void, options);
	}

	static dispatchEvent(type: 'addcamera', options: ControllerEventInit<Camera | null>): boolean;
	static dispatchEvent(type: 'cameraadded', options: ControllerEventInit<CameraAdded>): boolean;
	static dispatchEvent(type: 'setactivecamera', options: ControllerEventInit<SetActiveCamera>): boolean;
	static dispatchEvent(type: 'setactiveclip', options: ControllerEventInit<Clip>): boolean;

	static dispatchEvent<T>(type: ControllerEvent, options?: CustomEventInit<T>): boolean {
		return this.#eventTarget.dispatchEvent(new CustomEvent<T>(type, options));
	}

	static removeEventListener(type: ControllerEvent, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void {
		this.#eventTarget.removeEventListener(type, callback, options);
	}
}

export type CameraAdded = {
	clip: Clip;
	camera: Camera;
}

export type SetActiveCamera = {
	clip: Clip;
	camera: Camera;
}
