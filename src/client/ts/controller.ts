import { Character } from './misc/character';
import { SfmCamera } from './model/camera';
import { SfmClip, SfmClipType } from './model/clips/clip';
import { SfmFilmClip } from './model/clips/filmclip';
import { SfmOperatorClip } from './model/clips/operatorclip';
import { SfmLightType } from './model/lights/light';
import { SfmModel } from './model/model';
import { SfmNode } from './model/node';
import { SfmOperator } from './model/operators/operator';
import { SfmSession } from './model/session';
import { SfmTrack } from './model/track';
import { SfmTrackGroup } from './model/trackgroup';
import { Serializable } from './serialize/serializable';

export type ControllerEvent = 'setsession'
	| 'cameraadded'
	| 'settopfilmclip'
	| 'setcurrentclip'
	| 'setselectedclip' | 'usersetselectedclip' | 'addselectedclip' | 'useraddselectedclip'
	| 'useraddprimaryselectedclip'
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
	| 'updateactiveclips'
	| 'userbladeclip'
	// Delete the selected clips under the provided film clip
	| 'userdeleteselectedclips'
	// Delete the provided film clip
	| 'userdeleteclip'
	| 'userdeletetrack'
	| 'userdeletetrackgroup'
	| 'userdeleteoperator'
	| 'userdeletecharacter'
	| 'useraddcliptotrack'
	| 'useraddtracktotrackgroup'
	| 'useraddtrackgroup'
	| 'userfillgaps'
	| 'usersetname'
	| 'useraddlight'
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
	static addEventListener(type: 'useraddprimaryselectedclip', callback: (evt: CustomEvent<SetSelectedClip>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'setactivefilmclips', callback: (evt: CustomEvent<Set<SfmFilmClip>>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'setactivecamera', callback: (evt: CustomEvent<SetActiveCamera>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'useraddcamera', callback: (evt: CustomEvent<SfmCamera | null>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'userselectcamera', callback: (evt: CustomEvent<SfmCamera>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'usersavesession', callback: (evt: CustomEvent<void>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'useropenoptions', callback: (evt: CustomEvent<void>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'useropenadvancedoptions', callback: (evt: CustomEvent<void>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'useraddmodel', callback: (evt: CustomEvent<void>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'userselectcharacter', callback: (evt: CustomEvent<SelectCharacter | void>) => void, options?: AddEventListenerOptions | boolean): void;
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
	static addEventListener(type: 'userbladeclip' | 'userdeleteselectedclips', callback: (evt: CustomEvent<SfmFilmClip>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'userdeleteclip', callback: (evt: CustomEvent<SfmClip>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'useraddcliptotrack', callback: (evt: CustomEvent<AddClip>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'userfillgaps', callback: (evt: CustomEvent<SfmTrack>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'useraddtracktotrackgroup', callback: (evt: CustomEvent<AddTrack>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'useraddtrackgroup', callback: (evt: CustomEvent<SfmFilmClip>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'usersetname', callback: (evt: CustomEvent<SetName>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'userdeletetrack', callback: (evt: CustomEvent<SfmTrack>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'userdeletetrackgroup', callback: (evt: CustomEvent<SfmTrackGroup>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'userdeleteoperator', callback: (evt: CustomEvent<DeleteOperator>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'userdeletecharacter', callback: (evt: CustomEvent<DeleteCharacter>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'updateactiveclips', callback: (evt: CustomEvent<void>) => void, options?: AddEventListenerOptions | boolean): void;
	static addEventListener(type: 'useraddlight', callback: (evt: CustomEvent<AddLight>) => void, options?: AddEventListenerOptions | boolean): void;

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
	static dispatchEvent(type: 'useraddprimaryselectedclip', options: ControllerEventInit<SetSelectedClip>): boolean;
	static dispatchEvent(type: 'setactivefilmclips', options: ControllerEventInit<Set<SfmFilmClip>>): boolean;
	static dispatchEvent(type: 'userselectcamera', options: ControllerEventInit<SfmCamera>): boolean;
	static dispatchEvent(type: 'usersavesession', options?: EventInit): boolean;
	static dispatchEvent(type: 'useropenoptions', options?: EventInit): boolean;
	static dispatchEvent(type: 'useropenadvancedoptions', options?: EventInit): boolean;
	static dispatchEvent(type: 'useraddmodel', options?: EventInit): boolean;
	static dispatchEvent(type: 'userselectcharacter', options?: CustomEventInit<SelectCharacter>): boolean;
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
	static dispatchEvent(type: 'userbladeclip' | 'userdeleteselectedclips', options: ControllerEventInit<SfmFilmClip>): boolean;
	static dispatchEvent(type: 'userdeleteclip', options: ControllerEventInit<SfmClip>): boolean;
	static dispatchEvent(type: 'useraddcliptotrack', options: ControllerEventInit<AddClip>): boolean;
	static dispatchEvent(type: 'userfillgaps', options: ControllerEventInit<SfmTrack>): boolean;
	static dispatchEvent(type: 'useraddtracktotrackgroup', options: ControllerEventInit<AddTrack>): boolean;
	static dispatchEvent(type: 'useraddtrackgroup', options: ControllerEventInit<SfmFilmClip>): boolean;
	static dispatchEvent(type: 'usersetname', options: ControllerEventInit<SetName>): boolean;
	static dispatchEvent(type: 'userdeletetrack', options: ControllerEventInit<SfmTrack>): boolean;
	static dispatchEvent(type: 'userdeletetrackgroup', options: ControllerEventInit<SfmTrackGroup>): boolean;
	static dispatchEvent(type: 'userdeleteoperator', options: ControllerEventInit<DeleteOperator>): boolean;
	static dispatchEvent(type: 'userdeletecharacter', options: ControllerEventInit<DeleteCharacter>): boolean;
	static dispatchEvent(type: 'updateactiveclips', options?: EventInit): boolean;
	static dispatchEvent(type: 'useraddlight', options: ControllerEventInit<AddLight>): boolean;

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
	/** Enable the add character button */
	addCharacter?: boolean;
	/** Enable the undo button */
	undoButton?: boolean;
	/** Enable the redo button */
	redoButton?: boolean;
}

export type SelectCharacter = {
	primary: SfmClip;
	clips: Set<SfmClip>;
}

export type AddCharacter = {
	character: Character;
	clips: Set<SfmFilmClip>;
}

export type AddClip = {
	/** Track to add the clip into */
	track: SfmTrack;
	/** Time corresponding to the user click */
	time: number;
}

export type AddTrack = {
	type: SfmClipType;
	group: SfmTrackGroup;
}

export type DeleteOperator = {
	clip: SfmOperatorClip;
	operator: SfmOperator;
}

export type DeleteCharacter = {
	clip: SfmFilmClip;
	character: SfmNode<SfmModel>;
}

export type SetName = {
	element: Serializable;
	name: string;
}

export type AddLight = {
	type: SfmLightType;
	clip: SfmFilmClip;
}
