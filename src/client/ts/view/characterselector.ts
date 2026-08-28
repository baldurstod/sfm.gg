import { AmbientLight, Camera, CanvasAttributes, Graphics, GraphicsEvents, GraphicTickEvent, Group, OrbitControl, Scene, Source1ModelInstance } from 'harmony-3d';
import { createElement, hide, show } from 'harmony-ui';
import { BugReporter, Map2 } from 'harmony-utils';
import characterSelectorCSS from '../../css/characterselector.css';
import icon440 from '../../img/icons/steam_icon_440.png';
import { Controller } from '../controller';
import { Character, CharacterSlot, characterToModel, getItems, Item, itemToModel } from '../misc/character';
import { Panel } from './panel';

export class CharacterSelectorPanel extends Panel {
	#htmlCharacters?: HTMLElement;
	#htmlSlots?: HTMLElement;
	#htmlItemsContainer?: HTMLElement;
	#htmlItemsContainerSpacer?: HTMLElement;
	#htmlItems = new Map<Item, HTMLElement>();
	#htmlCanvas?: HTMLCanvasElement;
	#canvasAttributes: CanvasAttributes | null = null;
	#camera?: Camera;
	#cameraControl?: OrbitControl;
	#scene?: Scene;
	#group?: Group;
	#selectedCharacter?: Character;
	readonly #selectedSlot = new Map<Character, CharacterSlot>();//?: CharacterSlot;
	readonly #equipedItems = new Map2<Character, CharacterSlot, Item>();
	#items: Item[] = [];
	#characterModels = new Map<Character, Source1ModelInstance>();
	#itemsModels = new Map2<Character, Item, Source1ModelInstance>();

	protected initPanel(): void {
		if (this.panel) {
			return;
		}
		super.initPanel({ size: 3, layout: 'row', floating: true, titleI18n: '#character_selector', adoptStyle: characterSelectorCSS });

		// Create canvas container
		createElement('div', {
			parent: this.panel!.getContent(),
			class: 'canvas-container',
			child: this.#htmlCanvas = createElement('canvas') as HTMLCanvasElement,
		});

		// Create right panel
		createElement('div', {
			parent: this.panel!.getContent(),
			class: 'right-panel',
			childs: [
				createElement('div', {
					class: 'characters-selector',
					childs: [
						// App selector
						createElement('div', {
							class: 'apps',
							childs: [
								createElement('img', {
									src: icon440,
									$click: () => Controller.dispatchEvent('userselectcharacterselectapp', { detail: 440 }),
								}),
							]
						}),
						// Character selector
						this.#htmlCharacters = createElement('div', {
							class: 'characters',
						}),
					]
				}),
				createElement('div', {
					class: 'items-selector',
					childs: [
						// Slots
						this.#htmlSlots = createElement('div', {
							class: 'slots',
							childs: [
							]
						}),
						// Items selector
						this.#htmlItemsContainer = createElement('div', {
							class: 'items',
							child: this.#htmlItemsContainerSpacer = createElement('div'),// This element force items to use as much width as they can
						}),
					]
				}),
				// Create add button
				createElement('button', {
					i18n: '#add_character',
					$click: () => this.#addCurrentCharacter(),
				}),
			],
		});


		this.#htmlItemsContainer.addEventListener('scroll', () => this.#handleItemsScroll(), { passive: true });

		new ResizeObserver(() => this.#refreshItems()).observe(this.#htmlItemsContainer);

		// Create canvas
		this.#canvasAttributes = Graphics.addCanvas({
			name: 'CharacterSelectorPanel',
			autoResize: true,
			canvas: this.#htmlCanvas,
		});
		this.#initScene();
	}

	#initScene(): void {
		if (this.#scene) {
			return;
		}

		// Create scene and camera
		const view = this.#canvasAttributes?.getLayout(CanvasAttributes.defaultLayout)?.views.get('all');
		this.#camera = new Camera({ position: [500, 0, 40], verticalFov: 10, nearPlane: 10, farPlane: 10000 },);
		this.#cameraControl = new OrbitControl(this.#camera);
		this.#cameraControl.setTargetPosition([0, 0, 40]);
		this.#cameraControl.canvas = this.#htmlCanvas;
		GraphicsEvents.addEventListener('tick', (event) => this.#cameraControl!.update((event as CustomEvent<GraphicTickEvent>).detail.delta));

		this.#scene = new Scene({
			childs: [
				new AmbientLight(),
				this.#group = new Group(),
			]
		});

		// Attach scene to the view
		if (view) {
			view.camera = this.#camera;
			view.scene = this.#scene;
		}
	}

	setCharacters(characters: Character[]): void {
		console.info(characters);
		this.#selectedCharacter = undefined;
		this.initPanel();
		this.#htmlCharacters!.innerText = '';

		for (const character of characters) {
			createElement('img', {
				parent: this.#htmlCharacters,
				class: 'character',
				src: character.icon,
				$click: () => this.#selectCharacter(character),
			});
		}
	}

	async #selectCharacter(character: Character): Promise<void> {
		this.#selectedCharacter = character;
		console.info('select character', character);
		this.initPanel();

		this.#group?.removeChildren();

		let model = await characterToModel(character);//await Source1ModelManager.createInstance(character.game, character.model, true);
		if (model) {
			this.#characterModels.set(character, model);
		}
		this.#group!.addChild(model);
		this.#initSlots(character);
		const slot = this.#selectedSlot.get(character) ?? character.slots?.[0];
		if (slot) {
			this.#selectSlot(slot);
		} else {
			BugReporter.reportBug('warning', `No slot found for character ${JSON.stringify(character)}`);
		}
	}

	#initSlots(character: Character): void {
		this.#htmlSlots!.innerText = '';
		if (!character.slots) {
			return;
		}

		for (const slot of character.slots) {
			createElement('div', {
				parent: this.#htmlSlots,
				class: 'slot',
				innerText: slot.name,
				$click: () => this.#selectSlot(slot),
			});
		}
	}

	async #selectSlot(slot: CharacterSlot): Promise<void> {
		this.#selectedSlot.set(slot.character, slot);
		const items = await getItems(slot);

		for (const [, htmlItem] of this.#htmlItems) {
			htmlItem.remove();
		}
		this.#htmlItems.clear();


		this.#items = items;
		this.#refreshItems();
	}


	#refreshItems(/*items: Item[]*/): void {
		for (const [, htmlItem] of this.#htmlItems) {
			hide(htmlItem);
		}

		const w = this.#htmlItemsContainer!.clientWidth;
		//itemSize
		const elementSize = 150;// Size of each item, in pixel
		const columns = w / elementSize;
		const offset = (columns % 1) * elementSize / 2;

		let row = 0;
		let column = 0;
		for (const item of this.#items) {
			let htmlItem = this.#htmlItems.get(item);
			if (htmlItem) {
				show(htmlItem);
			} else {
				htmlItem = createElement('div', {
					parent: this.#htmlItemsContainer,
					class: 'item',
					//'@top': String(top),
					//'@left': String(left),
					child: createElement('img', {
						src: item.icon,
					}),
					$click: () => this.#itemClick(item),
				});

				this.#htmlItems.set(item, htmlItem);
			}

			const top = row * elementSize;
			const left = column * elementSize + offset;

			htmlItem.setAttribute('data-top', String(top));
			htmlItem.setAttribute('data-left', String(left));
			htmlItem.style.top = `${top}px`;
			htmlItem.style.left = `${left}px`;

			++column;
			if (column + 1 > columns) {
				// Wrap to the next row
				column = 0;
				++row;
			}
		}

		this.#htmlItemsContainerSpacer!.style.height = `${row * elementSize + 200}px`;
		this.#updateFilters();
	}

	#updateFilters(): void {
		/*
		const collections = ItemManager.getCollections();

		const sortType = OptionsManager.getItem('app.items.filter.collection.sort.type') as string;
		switch (sortType) {
			case 'name':
				collections[Symbol.iterator] = function* (): SetIterator<string> {
					yield* [...this.keys()].sort(
						(a, b) => {
							return a < b ? -1 : 1;
						}
					);
				}
				break;
			default:
				break;
		}

		this.#htmlFilterCollection?.replaceChildren();
		createElement('option', { value: '', innerText: '', parent: this.#htmlFilterCollection });
		for (const collection of collections) {
			createElement('option', { value: collection, innerText: collection, parent: this.#htmlFilterCollection });
		}
		this.#htmlFilterCollection!.value = OptionsManager.getItem('app.items.filter.collection') as string;
		*/
		this.#handleItemsScroll();
	}

	#handleItemsScroll(): void {
		const scrollTop = this.#htmlItemsContainer!.scrollTop;

		for (const [, item] of this.#htmlItems) {
			const itemTop = Number(item.getAttribute('data-top'));
			if (itemTop + 200 > scrollTop && itemTop < scrollTop + this.#htmlItemsContainer!.clientHeight) {
				this.#htmlItemsContainer!.append(item);
				//item.hideDetail();
			} else {
				item.remove();
			}
		}
	}

	setItems(items: Item[]): void {
		console.info(items);
	}

	open() {
		this.initPanel();
		this.panel!.open();
	}

	#addCurrentCharacter(): void {
		if (!this.#selectedCharacter) {
			return;
		}

		this.panel?.close();

		Controller.dispatchEvent('useraddcharacter', { detail: this.#selectedCharacter });

	}

	async #itemClick(item: Item): Promise<void> {
		if (!this.#selectedCharacter) {
			return;
		}

		const selectedSlot = this.#selectedSlot.get(this.#selectedCharacter);
		if (!selectedSlot) {
			return;
		}

		const current = this.#equipedItems.get(this.#selectedCharacter, selectedSlot);
		if (current) {
			this.#unEquipItem(this.#selectedCharacter, selectedSlot, current);
		}
		await this.#equipItem(this.#selectedCharacter, selectedSlot, item);
	}

	async #equipItem(character: Character, slot: CharacterSlot, item: Item): Promise<void> {
		this.#equipedItems.set(character, slot, item);
		const characterModel = this.#characterModels.get(character);
		if (!characterModel) {
			BugReporter.reportBug('debug', `Missing model for character ${JSON.stringify(character)}`);
			return;
		}

		const itemModel = await itemToModel(item);
		if (!itemModel) {
			BugReporter.reportBug('debug', `Missing model for item ${JSON.stringify(item)}`);
			return;
		}


		characterModel.addChild(itemModel);

		//#itemsModels = new Map2<Character, Item, Source1ModelInstance>();
		this.#itemsModels.set(character, item, itemModel);
	}

	#unEquipItem(character: Character, slot: CharacterSlot, item: Item): void {
		const itemModel = this.#itemsModels.get(character, item);
		if (itemModel) {
			itemModel.remove();
		}
		this.#equipedItems.delete(character, slot);
	}
}
