import { Clip } from './clip';

export class Session {
	#activeClip: Clip = new Clip('shot1');
	#clips = new Set<Clip>([this.#activeClip]);

	setActiveClip(clip: Clip): boolean {
		if (this.#clips.has(clip)) {
			this.#activeClip = clip;
			return true;
		}
		return false;
	}

	getActiveClip(): Clip {
		return this.#activeClip;
	}
}
