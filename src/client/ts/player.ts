import { Controller } from './controller';
import { SfmFilmClip } from './model/clips/filmclip';

export class Player {
	#frame = 0;
	#frameRate = 24;
	#clip?: SfmFilmClip;
	#animationFrame = -1;
	#previousTick = performance.now();
	#playing = false;
	// Used for autoplay
	#playTime = 0;

	constructor() {
		this.#tick(0);
	}

	#tick(timestamp: number): void {
		cancelAnimationFrame(this.#animationFrame);
		this.#animationFrame = requestAnimationFrame((timestamp: number) => this.#tick(timestamp));


		//this.#time = (tick - this.#timeOrigin) * 0.001;
		const delta = (timestamp - this.#previousTick);
		this.#previousTick = timestamp;

		if (this.#playing) {
			this.#playTime += delta * 0.001;
			this.setCurrentTime(this.#playTime);
			Controller.dispatchEvent('setcurrenttime', { detail: this.#playTime });
		}
	}

	setPlaying(playing: boolean): void {
		if (this.#playing === playing) {
			return;
		}
		this.#playing = playing;
		if (playing) {
			// Start playing, init current time
			this.#playTime = this.getCurrentTime();
		}
	}

	setFilmClip(clip: SfmFilmClip): void {
		this.#clip = clip;
	}

	setFrameRate(frameRate: number): void {
		this.#frameRate = Math.max(Math.round(frameRate), 1);
	}

	getFrameRate(): number {
		return this.#frameRate;
	}

	getCurrentFrame(): number {
		return this.#frame;
	}

	getCurrentTime(): number {
		return this.#frame / this.#frameRate;
	}

	setCurrentTime(time: number): void {
		this.#frame = Math.round(time * this.#frameRate)
	}

	getFrameTime(frame: number): number {
		return frame / this.#frameRate;
	}

	previousFrame(): number {
		const previousFrame = this.#frame - 1;
		/*
		const clip = this.#getSubClipAtFrame(previousFrame);
		if (!clip) {
			return this.#frame;
		}
		*/
		console.info('previous frame', previousFrame);
		return this.#frame = previousFrame;
	}

	nextFrame(): number {
		const nextFrame = this.#frame + 1;
		/*
		const clip = this.#getSubClipAtFrame(nextFrame);
		if (!clip) {
			return this.#frame;
		}
		*/
		console.info('next frame', nextFrame);
		return this.#frame = nextFrame;
	}

	#getCurrentSubClip(): SfmFilmClip | null {
		return this.#getSubClipAtFrame(this.#frame);
	}

	#getSubClipAtFrame(frame: number): SfmFilmClip | null {
		if (!this.#clip) {
			return null;
		}

		const activeFilmTrack = this.#clip.getActiveFilmTrack();
		if (!activeFilmTrack) {
			return null;
		}

		const clips = activeFilmTrack.getClips();

		const time = this.getFrameTime(frame);
		for (const clip of clips) {
			if ((clip as SfmFilmClip).isSfmFilmClip && clip.inTimeFrame(time)) {
				return clip as SfmFilmClip;
			}
		}

		return null;
	}
}
