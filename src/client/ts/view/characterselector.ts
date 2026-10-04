import { AmbientLight, Camera, CanvasAttributes, Entity, Graphics, GraphicsEvents, GraphicTickEvent, Group, OrbitControl, Scene, Source1ModelInstance } from 'harmony-3d';
import { createElement, hide, show } from 'harmony-ui';
import { BugReporter, Map2 } from 'harmony-utils';
import characterSelectorCSS from '../../css/characterselector.css';
import { Character, CharacterTemplate, createCharacter } from '../characters/character';
import { Item, ItemTemplate } from '../characters/item';
import { Slot } from '../characters/slot';
import { Controller, UpdateCharacter } from '../controller';
import { GameDefinition, GameTeamDefinition, getItems } from '../misc/character';
import { SfmClip } from '../model/clips/clip';
import { SfmFilmClip } from '../model/clips/filmclip';
import { SfmModel } from '../model/model';
import { SfmNode } from '../model/node';
import { Panel } from './panel';

interface ItemFilter {
	name: string;
}

type ItemSortType = 'index' | 'name';

export class CharacterSelectorPanel extends Panel {
	#htmlGames?: HTMLElement;
	#htmlCharacters?: HTMLElement;
	#htmlTeams?: HTMLElement;
	#htmlSlots?: HTMLElement;
	#htmlSelectedItems?: HTMLElement;
	#htmlItemsContainer?: HTMLElement;
	#htmlItemsContainerSpacer?: HTMLElement;
	#htmlItems = new Map<ItemTemplate, HTMLElement>();
	#htmlCanvas?: HTMLCanvasElement;
	#htmlAddPrimaryClip?: HTMLButtonElement;
	#htmlAddSelectedClips?: HTMLButtonElement;
	#htmlUpdateCharacter?: HTMLButtonElement;
	#htmlClose?: HTMLButtonElement;
	#canvasAttributes: CanvasAttributes | null = null;
	#camera?: Camera;
	#cameraControl?: OrbitControl;
	#scene?: Scene;
	#group?: Group;
	#selectedCharacter?: Character;
	readonly #selectedSlot = new Map<Character, Slot>();//?: CharacterSlot;
	readonly #equipedItems = new Map2<Character, Slot, ItemTemplate[]>();
	#items: ItemTemplate[] = [];
	#characterModels = new Map<Character, Entity>();
	#itemsModels = new Map2<Character, string, Source1ModelInstance[]>();
	#primarySelectedClip?: SfmClip;
	#selectedClips?: Set<SfmClip>;
	#editCharacterClip?: SfmFilmClip | null;
	#editCharacterNode?: SfmNode<SfmModel> | null;
	#currentTeam?: GameTeamDefinition | null;
	#currentSlot?: Slot | null;
	#games = new Map<string, GameDefinition>();
	#selectedGame = '';
	#filters: ItemFilter = { name: '' };
	#sortingDirection = 1;

	constructor() {
		super();
		this.#setSortingType('index');
	}

	protected initPanel(): void {
		if (this.panel) {
			return;
		}
		super.initPanel({
			size: 3,
			layout: 'row',
			floating: true,
			width: 80,
			height: 80,
			titleI18n: '#character_selector',
			adoptStyle: characterSelectorCSS,
		});

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
						this.#htmlGames = createElement('div', {
							class: 'games',
						}),
						// Character selector
						this.#htmlCharacters = createElement('div', {
							class: 'characters',
						}),
						// Team selector
						this.#htmlTeams = createElement('div', {
							class: 'teams',
							hidden: true,
						}),
					]
				}),
				createElement('div', {
					class: 'items-selector',
					childs: [
						createElement('div', {
							class: 'filters',
							childs: [
								// Filter
								createElement('input', {
									class: 'filter-name',
									$input: (event: Event) => this.#setNameFilter((event.target as HTMLInputElement).value),
								}),
								// Slots
								this.#htmlSlots = createElement('div', {
									class: 'slots',
								}),
							],
						}),
						// Selected items
						this.#htmlSelectedItems = createElement('div', {
							class: 'selected-items',
						}),
						// Items selector
						this.#htmlItemsContainer = createElement('div', {
							class: 'items',
							child: this.#htmlItemsContainerSpacer = createElement('div'),// This element force items to use as much width as they can
						}),
					]
				}),
				// Create add button
				this.#htmlAddPrimaryClip = createElement('button', {
					i18n: '#add_to_the_selected_clip',
					$click: () => this.#addCurrentCharacter(true),
				}) as HTMLButtonElement,
				this.#htmlAddSelectedClips = createElement('button', {
					i18n: '#add_to_all_selected_clips',
					$click: () => this.#addCurrentCharacter(false),
				}) as HTMLButtonElement,
				this.#htmlUpdateCharacter = createElement('button', {
					i18n: '#update_character',
					hidden: true,
					$click: () => this.#updateCharacter(),
				}) as HTMLButtonElement,
				this.#htmlClose = createElement('button', {
					i18n: '#close',
					$click: () => this.panel?.close(),
				}) as HTMLButtonElement,
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

		//new SceneExplorer().setScene(this.#scene);
	}

	setGames(games: GameDefinition[]): void {
		this.#games.clear();
		this.initPanel();
		for (const game of games) {
			this.#games.set(game.name, game);
			createElement('img', {
				src: game.icon,
				parent: this.#htmlGames,
				$click: () => this.#selectGame(game.name),
			});
		}
	}

	#selectGame(name: string): void {
		const game = this.#games.get(name);
		if (!game) {
			return;
		}

		this.#selectedGame = name;

		Controller.dispatchEvent('userselectcharacterselectapp', { detail: game.name });
		hide(this.#htmlTeams);

		this.#currentTeam = null;

		if (game.teams) {
			this.#htmlTeams?.replaceChildren();
			show(this.#htmlTeams);
			for (const team of game.teams) {
				createElement('img', {
					src: team.icon,
					parent: this.#htmlTeams,
					$click: () => this.#selectTeam(team),
				});
			}
		}
	}

	async #selectTeam(team: GameTeamDefinition): Promise<void> {
		this.#currentTeam = team;

		this.#selectedCharacter?.setTeam(team.name);
		/*

		if (this.#selectedCharacter) {
			const equippedItems: string[] = [];
			this.#selectedCharacter.setTeam(team.name);
			const items = new Map(this.#selectedCharacter.items);
			if (items) {
				for (const item of items) {
					equippedItems.push(getItemIdStyle(item[1]));
					await this.#itemClick(item[1]);
				}
			}

			// Reselect the slot to refresh item list
			const slot = this.#selectedSlot.get(this.#selectedCharacter);
			if (slot) {
				await this.#selectSlot(slot);
			}

			for (const equippedItem of equippedItems) {
				const item = this.#items.find(element => equippedItem === getItemIdStyle(element));
				if (!item) {
					continue;
				}

				await this.#itemClick(item);
			}
		}
		*/
	}

	setCharacters(characters: CharacterTemplate[]): void {
		this.#selectedCharacter = undefined;
		this.initPanel();
		this.#htmlCharacters!.innerText = '';

		for (const characterTemplate of characters) {
			const character = createCharacter(characterTemplate);
			//c.items = new Map<string, Item>();
			createElement('img', {
				parent: this.#htmlCharacters,
				class: 'character',
				src: characterTemplate.icon,
				$click: () => this.#selectCharacter(character),
			});
		}
	}

	async #selectCharacter(character: Character): Promise<void> {
		this.#selectedCharacter = character;
		console.info('select character', character);
		this.initPanel();

		this.#group?.removeChildren();

		let model = await character.getModel();//characterToModel(character);//await Source1ModelManager.createInstance(character.game, character.model, true);
		if (model) {
			this.#characterModels.set(character, model);
		}
		this.#group!.addChild(model);
		this.#initSlots(character);
		const slot = this.#selectedSlot.get(character) ?? character.getSlots()?.[0];
		if (slot) {
			this.#selectSlot(slot);
		} else {
			BugReporter.reportBug('warning', `No slot found for character ${JSON.stringify(character)}`);
		}

		this.#updateEquippedItems();
	}

	#initSlots(character: Character): void {
		this.#htmlSlots!.innerText = '';
		/*
		if (!character.slots) {
			return;
		}
		*/

		for (const slot of character.getSlots()) {
			createElement('div', {
				parent: this.#htmlSlots,
				class: 'slot',
				innerText: slot.getName(),
				$click: () => this.#selectSlot(slot),
			});
		}
	}

	async #selectSlot(slot: Slot): Promise<void> {
		this.#currentSlot = slot;
		this.#selectedSlot.set(slot.getOwner(), slot);
		const items = await getItems(slot, slot.getOwner().getTeam());

		for (const [, htmlItem] of this.#htmlItems) {
			htmlItem.remove();
		}
		this.#htmlItems.clear();

		this.#items.length = 0;
		items.forEach(item => this.#items.push(item));
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
		for (const item of this.#getfilteredItems()) {
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

	#setSortingType(type: ItemSortType): void {
		let sortingDirection: number = this.#sortingDirection;
		/*
		if (this.#filters.sfmWorkshop) {
			sortingDirection = this.#sortingDirectionSfm;
		}
		*/

		switch (type) {
			case 'name':
				this.#sortByName(sortingDirection);
				break;
			case 'index':
				this.#sortByIndex(sortingDirection);
				break;
			/*
			case 'slot':
				this.#sortBySlot(sortingDirection);
				break;
			case 'subscriptions':
				this.#sortBySubscriptions(sortingDirection);
				break;
			case 'updated':
				this.#sortByLastUpdate(sortingDirection);
				break;
			case 'created':
				this.#sortByCreationTime(sortingDirection);
				break;
			case 'random':
				this.#sortRandom();
				break;
			*/
			default: console.error(`unsupported field: ${type}`);
				break;
		}
	}

	#sortByName(sortingDirection: number): void {
		const self = this;
		this.#items[Symbol.iterator] = function* (): ArrayIterator<ItemTemplate> {
			yield* [...this.values()].sort(
				(a, b) => {
					const aname = a.name.toLowerCase();
					const bname = b.name.toLowerCase();
					return aname < bname ? -sortingDirection : sortingDirection;
				}
			);
		}
	}

	#sortByIndex(sortingDirection: number): void {
		const self = this;
		this.#items[Symbol.iterator] = function* (): ArrayIterator<ItemTemplate> {
			yield* [...this.values()].sort(
				(a, b) => {

					const aname = a.id;
					const bname = b.id;
					const aId = parseInt(aname, 10);
					const bId = parseInt(bname, 10);

					if (aId == bId) {
						return 0;
					}

					return aId < bId ? -sortingDirection : sortingDirection;
				}
			);
		}
	}

	*#getfilteredItems(): Generator<ItemTemplate, null | undefined, unknown> {
		console.info(this.#items);
		for (const item of this.#items) {
			if (this.#matchFilter(item)) {
				yield item;
			}
		}
		return null
	}

	#matchFilter(item: ItemTemplate): boolean {
		//return Math.random() > 0.5;

		const nameFilter = this.#filters.name;
		const itemName = item.name;
		if (nameFilter) {
			return itemName.toLowerCase().includes(nameFilter);
		}

		return true;
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
		throw new Error("TODO: remove me");

	}

	override open(): void {
		throw new Error('use selectCharacter instead');
	}

	selectCharacter(primarySelectedClip: SfmClip, selectedClips: Set<SfmClip>): void {
		this.#editCharacterClip = null;
		this.#editCharacterNode = null;
		this.#primarySelectedClip = primarySelectedClip;
		this.#selectedClips = selectedClips;
		this.initPanel();
		// Forcefully reselect the game to reload characters
		this.#selectGame(this.#selectedGame);
		this.panel!.open();
		hide(this.#htmlUpdateCharacter);
		show(this.#htmlAddPrimaryClip);
		show(this.#htmlAddSelectedClips);
	}

	#addCurrentCharacter(primaryClipOnly: boolean): void {
		if (!this.#selectedCharacter || !this.#primarySelectedClip || !this.#selectedClips) {
			return;
		}

		this.panel?.close();

		let clips: Set<SfmFilmClip>;
		if (primaryClipOnly) {
			if (!(this.#primarySelectedClip as SfmFilmClip).isSfmFilmClip) {
				return;
			}
			clips = new Set<SfmFilmClip>([this.#primarySelectedClip as SfmFilmClip]);
		} else {
			clips = new Set<SfmFilmClip>();

			if ((this.#primarySelectedClip as SfmFilmClip).isSfmFilmClip) {
				clips.add(this.#primarySelectedClip as SfmFilmClip);
			}
			for (const selectedClip of this.#selectedClips) {
				if ((selectedClip as SfmFilmClip).isSfmFilmClip) {
					clips.add(selectedClip as SfmFilmClip);
				}
			}
		}

		Controller.dispatchEvent('useraddcharacter', {
			detail: {
				character: this.#selectedCharacter,
				clips,
			}
		});
	}

	async editCharacter(clip: SfmFilmClip, character: Character, characterNode: SfmNode<SfmModel>): Promise<void> {
		this.#editCharacterClip = clip;
		this.#editCharacterNode = characterNode;

		this.initPanel();
		this.panel!.open();

		show(this.#htmlUpdateCharacter);
		hide(this.#htmlAddPrimaryClip);
		hide(this.#htmlAddSelectedClips);

		//Controller.dispatchEvent('userselectcharacterselectapp', { detail: 440 });

		// Select the character game
		this.#selectGame(character.getGame());
		// Load only this character
		this.setCharacters([character.getTemplate()]);
		await this.#selectCharacter(character);

		//this.#equipedItems.getMap().delete(character);

		// Remove existing items
		/*
		const equipedItems = new Map(this.#equipedItems.getSubMap(character));
		for (const [slot, items] of equipedItems) {
			for (const item of items) {
				this.#unEquipItem(character, item);
			}
		}
		this.#equipedItems.getSubMap(character)?.clear();
		*/

		/*
		// Add new items
		for (const [, item] of character.items) {
			console.log(item);
			await this.#equipItem(character, item);

			const characterSlot = getCharacterSlot(character, item.slot);
			if (!characterSlot) {
				continue;
			}

			let items = this.#equipedItems.get(character, characterSlot) ?? [];
			items.push(item);
			this.#equipedItems.set(character, characterSlot, items);
		}
		*/
	}

	#updateCharacter(): void {
		if (!this.#editCharacterNode) {
			return;
		}

		this.panel?.close();

		Controller.dispatchEvent('userupdatecharacter', {
			detail: {
				character: this.#selectedCharacter,
				clips: new Set([this.#editCharacterClip]),
				characterNode: this.#editCharacterNode,
			} as UpdateCharacter,
		});
	}

	async #itemClick(item: ItemTemplate): Promise<void> {
		if (!this.#selectedCharacter) {
			return;
		}

		console.info(item);
		if (this.#selectedCharacter.hasItem(item)) {
			this.#selectedCharacter.unequipItem(item);
		} else {
			this.#selectedCharacter.equipItem(item);
		}

		this.#updateEquippedItems();

		/*
		const selectedSlot = this.#selectedSlot.get(this.#selectedCharacter);
		if (!selectedSlot) {
			return;
		}

		let items = this.#equipedItems.get(this.#selectedCharacter, selectedSlot);
		if (items) {
			// An equipped item is clicked again: remove it and exit
			const itemIndex = items.findIndex(element => element.id === item.id && element.style === item.style);
			if (itemIndex !== -1) {
				items.splice(itemIndex, 1);
				this.#unEquipItem(this.#selectedCharacter, item);
				return;
			}

			// Unequip the first item if we hit the items limit
			if (items.length && items.length >= (selectedSlot.limit ?? Infinity)) {
				this.#unEquipItem(this.#selectedCharacter, items.pop()!);
			}
		} else {
			// Create the item array
			items = [];
			this.#equipedItems.set(this.#selectedCharacter, selectedSlot, items);
		}
		items.push(item);
		await this.#equipItem(this.#selectedCharacter, item);
		*/
	}

	#updateEquippedItems(): void {
		this.#htmlSelectedItems?.replaceChildren();
		if (!this.#selectedCharacter) {
			return;
		}
		for (const [, item] of this.#selectedCharacter.getItems()) {
			createElement('div', {
				parent: this.#htmlSelectedItems,
				class: 'selected-item',
				child: createElement('img', {
					src: item.getIcon(),
				}),
				$click: () => this.#itemClick(item.getTemplate()),
			});
		}
	}

	async #equipItem(character: Character, item: Item): Promise<void> {
		/*
		//this.#equipedItems.set(character, slot, item);
		const characterModel = this.#characterModels.get(character);
		if (!characterModel) {
			BugReporter.reportBug('debug', `Missing model for character ${JSON.stringify(character)}`);
			return;
		}

		const itemModels = await itemToModel(item);
		if (!itemModels) {
			BugReporter.reportBug('debug', `Missing model for item ${JSON.stringify(item)}`);
			return;
		}

		character.items.set(getItemIdStyle(item), item);

		for (const itemModel of itemModels) {
			characterModel.addChild(itemModel);
		}

		//#itemsModels = new Map2<Character, Item, Source1ModelInstance>();
		this.#itemsModels.set(character, getItemIdStyle(item), itemModels);
		*/
	}

	#unEquipItem(character: Character, item: ItemTemplate): void {
		character.unequipItem(item);

		/*
		const itemHash = getItemIdStyle(item);
		character.items.delete(itemHash);
		const itemModels = this.#itemsModels.get(character, itemHash);
		if (itemModels) {
			itemModels.forEach(itemModel => itemModel.remove());
		}
		*/
		//this.#equipedItems.delete(character, slot);
	}

	#setNameFilter(name: string): void {
		this.#filters.name = name;
		this.#refreshItems();
	}
}
