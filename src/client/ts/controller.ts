import { Character } from './misc/character';
import { SfmCamera } from './model/camera';
import { SfmClip } from './model/clips/clip';
import { SfmFilmClip } from './model/clips/filmclip';
import { SfmSession } from './model/session';
import { Serializable } from './serialize/serializable';

export type ControllerEvent = 'setsession'
	| 'cameraadded'
	| 'settopfilmclip'
	| 'setcurrentclip'
	| 'setselectedclip' | 'usersetselectedclip' | 'addselectedclip' | 'useraddselectedclip'
	| 'setactivefilmclips'
	| 'setactivecamera'
	| 'useraddcamera'
	| 'userselectcamera'
	| 'usersavesession'
	| 'useropenoptions'
	| 'useropenadvancedoptions'
	| 'useraddmodel'
	| 'userselectcharacter'
	| 'userselectcharacterselectapp'
	| 'useraddcharacter'
	| 'viewelement'
	// Playback controls
	| 'usersetplaying'
	//| 'userpause'
	| 'usergotopreviousframe'
	| 'usergotonextframe'
	| 'usergotopreviousclip'
	| 'usergotonextclip'
	| 'usergotofirstframe'
	| 'usergotolastframe'
	| 'setcurrenttime'
	| 'usersetcurrenttime'
	| 'playersetcurrenttime'
	| 'userundolastaction'
	| 'userredolastaction'
	| 'refreshtimeline'
	| 'refreshtoolbar'
	;

// Same as CustomEventInit with required detail
export interface ControllerEventInit<T = any> extends EventInit {
	detail: T;
}

export class Controller {
	static readonly #eventTarget = new EventTarget();

	static addEventListener(type: 'setsession', callback: (evt: CustomEvent<SfmSession>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'cameraadded', callback: (evt: CustomEvent<CameraAdded>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'settopfilmclip', callback: (evt: CustomEvent<SfmFilmClip>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'setcurrentclip', callback: (evt: CustomEvent<SfmClip>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'setselectedclip' | 'usersetselectedclip' | 'addselectedclip' | 'useraddselectedclip', callback: (evt: CustomEvent<SetSelectedClip>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'setactivefilmclips', callback: (evt: CustomEvent<Set<SfmFilmClip>>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'setactivecamera', callback: (evt: CustomEvent<SetActiveCamera>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'useraddcamera', callback: (evt: CustomEvent<SfmCamera | null>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'userselectcamera', callback: (evt: CustomEvent<SfmCamera>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'usersavesession', callback: (evt: CustomEvent<void>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'useropenoptions', callback: (evt: CustomEvent<void>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'useropenadvancedoptions', callback: (evt: CustomEvent<void>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'useraddmodel' | 'userselectcharacter', callback: (evt: CustomEvent<void>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'userselectcharacterselectapp' | 'setcurrenttime' | 'usersetcurrenttime' | 'playersetcurrenttime', callback: (evt: CustomEvent<number>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'useraddcharacter', callback: (evt: CustomEvent<AddCharacter>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'viewelement', callback: (evt: CustomEvent<Serializable | null>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'usersetplaying', callback: (evt: CustomEvent<boolean>) => void, options?: AddEventListenerOptions | boolean): void;
	//static addEventListener(type: 'userpause', callback: (evt: CustomEvent<void>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'usergotopreviousframe', callback: (evt: CustomEvent<void>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'usergotonextframe', callback: (evt: CustomEvent<void>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'usergotopreviousclip', callback: (evt: CustomEvent<void>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'usergotonextclip', callback: (evt: CustomEvent<void>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'usergotofirstframe', callback: (evt: CustomEvent<void>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'usergotolastframe', callback: (evt: CustomEvent<void>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'refreshtoolbar', callback: (evt: CustomEvent<RefreshToolbar>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'userundolastaction' | 'userredolastaction' | 'refreshtimeline', callback: (evt: CustomEvent<void>) => void, options?: AddEventListenerOptions | boolean): void;

	static addEventListener(type: ControllerEvent, callback: (evt: CustomEvent) => void, options?: AddEventListenerOptions | boolean): void {
		this.#eventTarget.addEventListener(type, callback as (evt: Event) => void, options);
	}

	static dispatchEvent(type: 'setsession', options: ControllerEventInit<SfmCamera | null>): boolean;
	static dispatchEvent(type: 'useraddcamera', options: ControllerEventInit<SfmCamera | null>): boolean;
	static dispatchEvent(type: 'cameraadded', options: ControllerEventInit<CameraAdded>): boolean;
	static dispatchEvent(type: 'setactivecamera', options: ControllerEventInit<SetActiveCamera>): boolean;
	static dispatchEvent(type: 'settopfilmclip', options: ControllerEventInit<SfmFilmClip>): boolean;
	static dispatchEvent(type: 'setcurrentclip', options: ControllerEventInit<SfmClip>): boolean;
	static dispatchEvent(type: 'setselectedclip' | 'usersetselectedclip' | 'addselectedclip' | 'useraddselectedclip', options: ControllerEventInit<SetSelectedClip>): boolean;
	static dispatchEvent(type: 'setactivefilmclips', options: ControllerEventInit<Set<SfmFilmClip>>): boolean;
	static dispatchEvent(type: 'userselectcamera', options: ControllerEventInit<SfmCamera>): boolean;
	static dispatchEvent(type: 'usersavesession', options?: EventInit): boolean;
	static dispatchEvent(type: 'useropenoptions', options?: EventInit): boolean;
	static dispatchEvent(type: 'useropenadvancedoptions', options?: EventInit): boolean;
	static dispatchEvent(type: 'useraddmodel' | 'userselectcharacter', options?: EventInit): boolean;
	static dispatchEvent(type: 'userselectcharacterselectapp' | 'setcurrenttime' | 'usersetcurrenttime' | 'playersetcurrenttime', options: ControllerEventInit<number>): boolean;
	static dispatchEvent(type: 'useraddcharacter', options: ControllerEventInit<AddCharacter>): boolean;
	static dispatchEvent(type: 'viewelement', options: ControllerEventInit<Serializable | null>): boolean;
	static dispatchEvent(type: 'usersetplaying', options: ControllerEventInit<boolean>): boolean;
	//static dispatchEvent(type: 'userpause', options?: EventInit): boolean;
	static dispatchEvent(type: 'usergotopreviousframe', options?: EventInit): boolean;
	static dispatchEvent(type: 'usergotonextframe', options?: EventInit): boolean;
	static dispatchEvent(type: 'usergotopreviousclip', options?: EventInit): boolean;
	static dispatchEvent(type: 'usergotonextclip', options?: EventInit): boolean;
	static dispatchEvent(type: 'usergotofirstframe', options?: EventInit): boolean;
	static dispatchEvent(type: 'usergotolastframe', options?: EventInit): boolean;
	static dispatchEvent(type: 'refreshtoolbar', options: ControllerEventInit<RefreshToolbar>): boolean;
	static dispatchEvent(type: 'userundolastaction' | 'userredolastaction' | 'refreshtimeline', options?: EventInit): boolean;

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

export type SetSelectedClip = {
	topClip: SfmFilmClip;
	selected: SfmClip;
}

export type RefreshToolbar = {
	addCharacter?: boolean;
	undoButton?: boolean;
	redoButton?: boolean;
}

export type AddCharacter = {
	character: Character;
	clips: Set<SfmFilmClip>;
}
