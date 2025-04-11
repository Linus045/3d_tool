export class CustomSlider extends HTMLElement {
	title: string;
	min: number;
	max: number;
	step: number;
	value: number;

	container: HTMLElement;
	slider: HTMLInputElement;
	titleElem: HTMLElement;

	onChangeCallback: (slider: CustomSlider, value: number) => void;

	setValue: (value: number) => void;
	getValue: () => number;
	getTitle: () => string;


	static createSlider(title: string, min: number, max: number, step: number, value: number): CustomSlider {
		let slider = <CustomSlider>document.createElement('custom-slider', {
			is: 'custom-slider'
		});

		slider.title = title;
		slider.min = min;
		slider.max = max;
		slider.step = step;
		slider.value = value;


		// TODO: figure out why i need to set them here and cant just define them outside
		slider.setValue = function(value: number) {
			this.value = value;
			this.slider.value = value.toString();
			this.titleElem.innerHTML = this.title + ': ' + this.slider.value.toString();
		}

		slider.getValue = function(): number {
			return this.value;
		}

		slider.getTitle = function(): string {
			return this.title;
		}

		/*
					<p>rotation x: <span id="rotxout"></span></p>
					<label for="rotxin"></label >
				<input type="range" id="rotXIn" min="-180" max="180" class="slider" />
			*/

		slider.className = 'slider';

		slider.titleElem = document.createElement('p');
		slider.titleElem.innerHTML = slider.title + ': ' + slider.value.toFixed(4).toString();
		slider.appendChild(slider.titleElem);

		slider.slider = document.createElement('input');
		slider.slider.type = 'range';
		slider.slider.step = "0.01"
		slider.slider.min = slider.min.toString();
		slider.slider.max = slider.max.toString();
		// slider.slider.step = slider.step.toString();
		slider.slider.value = slider.value.toString();

		slider.slider.addEventListener('input', () => {
			slider.setValue(parseFloat(slider.slider.value));
			if (slider.onChangeCallback) {
				slider.onChangeCallback(slider, slider.value);
			}
		});
		slider.appendChild(slider.slider);

		return slider
	}

	constructor() {
		super()
	}

}

customElements.define('custom-slider', CustomSlider, { extends: "div" });
