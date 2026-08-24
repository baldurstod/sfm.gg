import { SfmCamera } from './session/camera';
import { SfmClip } from './session/clip';
import { SfmSession } from './session/session';

export type ControllerEvent = 'setsession' | 'cameraadded' | 'setactiveclip' | 'setactivecamera' | 'useraddcamera' | 'userselectcamera' | 'usersavesession';

interface ControllerEventInit<T = any> extends EventInit {
	detail: T;
}

export class Controller {
	static readonly #eventTarget = new EventTarget();

	static addEventListener(type: 'setsession', callback: (evt: CustomEvent<SfmSession>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'cameraadded', callback: (evt: CustomEvent<CameraAdded>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'setactiveclip', callback: (evt: CustomEvent<SfmClip>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'setactivecamera', callback: (evt: CustomEvent<SetActiveCamera>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'useraddcamera', callback: (evt: CustomEvent<SfmCamera | null>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'userselectcamera', callback: (evt: CustomEvent<SfmCamera>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'usersavesession', callback: (evt: CustomEvent<void>) => void, options?: AddEventListenerOptions | boolean): void;

	static addEventListener(type: ControllerEvent, callback: (evt: CustomEvent) => void, options?: AddEventListenerOptions | boolean): void {
		this.#eventTarget.addEventListener(type, callback as (evt: Event) => void, options);
	}

	static dispatchEvent(type: 'setsession', options: ControllerEventInit<SfmCamera | null>): boolean;
	static dispatchEvent(type: 'useraddcamera', options: ControllerEventInit<SfmCamera | null>): boolean;
	static dispatchEvent(type: 'cameraadded', options: ControllerEventInit<CameraAdded>): boolean;
	static dispatchEvent(type: 'setactivecamera', options: ControllerEventInit<SetActiveCamera>): boolean;
	static dispatchEvent(type: 'setactiveclip', options: ControllerEventInit<SfmClip>): boolean;
	static dispatchEvent(type: 'userselectcamera', options: ControllerEventInit<SfmCamera>): boolean;
	static dispatchEvent(type: 'usersavesession', options?: ControllerEventInit<void>): boolean;

	static dispatchEvent<T>(type: ControllerEvent, options?: CustomEventInit<T>): boolean {
		return this.#eventTarget.dispatchEvent(new CustomEvent<T>(type, options));
	}

	static removeEventListener(type: ControllerEvent, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void {
		this.#eventTarget.removeEventListener(type, callback, options);
	}
}

export type CameraAdded = {
	clip: SfmClip;
	camera: SfmCamera;
}

export type SetActiveCamera = {
	clip: SfmClip;
	camera: SfmCamera;
}
