import { SerializableProperty, SerializablePropertyType, UnserializationContext } from '../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../serialize/serializer';
import { SfmCamera } from './camera';
import { ClipParameters, SfmClip, SfmClipType } from './clip';
import { SfmScene } from './scene';
import { SfmTrack } from './track';
import { SfmTrackGroup } from './trackgroup';

export interface FilmClipParameters extends ClipParameters {
	scene?: SfmScene;
	camera?: SfmCamera;
	trackGroups?: SfmTrackGroup[];
}

export class SfmFilmClip extends SfmClip {
	readonly isSfmFilmClip = true as const;
	scene?: SfmScene;
	readonly #cameras = new Set<SfmCamera>();
	activeCamera?: SfmCamera;
	readonly #trackGroups = new Set<SfmTrackGroup>();
	#activeFilmTrack?: SfmTrack;

	constructor(params: FilmClipParameters = {}) {
		super(params);

		this.scene = params.scene;
		this.activeCamera = params.camera;

		if (params.trackGroups) {
			for (const trackGroup of params.trackGroups) {
				this.addTrackGroup(trackGroup);
			}
		}
	}

	addTrackGroup(group: SfmTrackGroup): SfmTrackGroup {
		this.#trackGroups.add(group);
		return group;
	}

	deleteTrackGroup(group: SfmTrackGroup): void {
		this.#trackGroups.delete(group);
	}

	getTrackGroup(): SfmTrackGroup[] {
		return [...this.#trackGroups];
	}

	setScene(scene: SfmScene): void {
		this.scene = scene;
	}

	addCamera(camera: SfmCamera): void {
		this.#cameras.add(camera);

		this.scene?.getScene().addChild(camera.getCamera());
	}

	setActiveCamera(camera: SfmCamera): void {
		this.activeCamera = camera;
	}

	getCameras(): Set<SfmCamera> {
		return new Set(this.#cameras);
	}

	hasCamera(camera: SfmCamera): boolean {
		return this.#cameras.has(camera);
	}

	getActiveFilmTrack(): SfmTrack | null {
		if (this.#activeFilmTrack) {
			// TODO: check if the track is still part of the clip
			return this.#activeFilmTrack;
		}

		for (const trackGroup of this.#trackGroups) {
			for (const track of trackGroup.getTracks()) {
				if (track.getTrackType() === 'film') {
					this.#activeFilmTrack = track;
					return track;
				}
			}
		}

		return null;
	}

	getClipType(): SfmClipType {
		return 'film';
	}

	static override getTypeName(): string {
		return 'FilmClip';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		json.scene = this.scene;

		if (this.activeCamera) {
			json.active_camera = this.activeCamera;
		}

		if (this.#cameras.size) {
			json.cameras = [...this.#cameras];
		}

		if (this.#trackGroups.size) {
			json.track_groups = [...this.#trackGroups];
		}

		if (this.#activeFilmTrack) {
			json.active_film_track = this.#activeFilmTrack;
		}

		return json;
	}

	override unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);

		const elements = context.elements;

		this.activeCamera = undefined;
		this.#cameras.clear();

		if (json.scene) {
			const scene = elements.get(json.scene as string) as SfmScene | undefined; // TODO: check if it's actually a scene
			if (scene) {
				this.scene = scene;
			}
		}

		if (json.active_camera) {
			this.activeCamera = elements.get(json.active_camera as string) as SfmCamera | undefined; // TODO: check if it's actually a camera
		}

		this.#cameras.clear();
		if (json.cameras) {
			for (const cameraId of json.cameras as string[]) {
				const camera = elements.get(cameraId) as SfmCamera | undefined; // TODO: check if it's actually a camera

				if (camera) {
					this.#cameras.add(camera);
				}
			}
		}

		this.#trackGroups.clear();
		if (json.track_groups) {
			for (const trackGroupId of json.track_groups as string[]) {
				const trackGroup = context.elements.get(trackGroupId) as SfmTrackGroup | undefined; // TODO: check if it's actually a track group

				if (trackGroup) {
					this.#trackGroups.add(trackGroup);
				}
			}
		}

		if (json.active_film_track) {
			this.#activeFilmTrack = elements.get(json.active_film_track as string) as SfmTrack | undefined; // TODO: check if it's actually a track
			// TODO: check if it's actually a track
		}
	}

	override getProperties(): SerializableProperty[] {
		return [
			{
				name: 'scene',
				i18n: '#scene',
				//type: typeof SfmScene,
				settable: true,
			},
			{
				name: 'activeCamera',
				i18n: '#active_camera',
				//type: typeof SfmCamera,
				settable: true,
			},
			{
				name: 'trackGroups',
				i18n: '#track_groups',
				//type: typeof nodeArray,
				settable: false,
			},
		];
	}

	override getProperty(name: string): SerializablePropertyType {
		switch (name) {
			case 'scene':
				return this.scene;
			case 'activeCamera':
				return this.activeCamera;
			case 'trackGroups':
				return [...this.#trackGroups];
			default:
				throw new Error("do me " + name);
		}
	}
}

SfmSerializer.registerSerializable(SfmFilmClip);
