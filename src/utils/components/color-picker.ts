import type { HSB } from '../color';
import { createBEM } from '../bem';
import { HEXtoRGB, HSBtoHEX, HSBtoRGB, RGBtoHEX, RGBtoHSB, validateHSB } from '../color';

interface ColorPickerOptions {
  color: string;
  onChange: (color: string) => void;
}
export function createColorPicker(options: Partial<ColorPickerOptions> = {}) {
  const contentWidth = 230;
  const contentHeight = 150;
  const handleSizeSec = 10;

  let hsbValue: HSB = RGBtoHSB(HEXtoRGB(options.color || '#ff0000'));
  const bem = createBEM('color-picker');
  const root = document.createElement('div');
  root.classList.add(bem.b());

  const content = document.createElement('div');
  content.classList.add(bem.be('content'));

  const colorSelector = document.createElement('div');
  colorSelector.classList.add(bem.be('selector'));

  const colorBackground = document.createElement('div');
  colorBackground.classList.add(bem.be('background'));
  colorSelector.appendChild(colorBackground);

  const colorHandle = document.createElement('div');
  colorHandle.classList.add(bem.be('background-handle'));
  colorBackground.appendChild(colorHandle);

  const colorAlpha = document.createElement('div');
  colorAlpha.classList.add(bem.be('alpha'));

  const alphaBg = document.createElement('div');
  alphaBg.classList.add(bem.be('alpha-bg'));

  const alphaHandle = document.createElement('div');
  alphaHandle.classList.add(bem.be('alpha-handle'));

  colorAlpha.appendChild(alphaBg);
  colorAlpha.appendChild(alphaHandle);

  const colorHue = document.createElement('div');
  colorHue.classList.add(bem.be('hue'));

  const colorHueHandle = document.createElement('div');
  colorHueHandle.classList.add(bem.be('hue-handle'));
  colorHue.appendChild(colorHueHandle);

  const action = document.createElement('div');
  action.classList.add(bem.be('action'));

  const [colorRInput, colorGInput, colorBInput, colorAInput] = (['r', 'g', 'b', 'a'] as const).map((key) => {
    const item = document.createElement('div');
    item.classList.add(bem.be('action-item'), key);

    const label = document.createElement('label');
    label.textContent = key.toUpperCase();

    const colorInput = document.createElement('input');
    colorInput.classList.add(bem.be('input'));

    colorInput.addEventListener('input', () => {
      colorInput.value = colorInput.value.replaceAll(/[^0-9]/g, '');
    });
    colorInput.addEventListener('change', () => {
      let value = Math.round(Number(colorInput.value));
      if (key === 'a') {
        value = value / 100;
      }
      const result = validateHSB(RGBtoHSB(Object.assign({}, HSBtoRGB(hsbValue), { [key]: value })));
      updateValue(result);
      updateUI();
    });

    item.appendChild(label);
    item.appendChild(colorInput);
    action.appendChild(item);

    return colorInput;
  });

  content.appendChild(colorHue);
  content.appendChild(colorSelector);
  content.appendChild(colorAlpha);
  root.appendChild(content);
  root.appendChild(action);

  let colorDragging = false;
  let hueDragging = false;
  let alphaDragging = false;

  function updateInput() {
    const hex = HSBtoHEX(hsbValue);
    for (const [i, input] of [colorRInput, colorGInput, colorBInput].entries()) {
      input.value = String(Number.parseInt(hex[i * 2] + hex[i * 2 + 1], 16));
    }
    colorAInput.value = String((hsbValue.a * 100).toFixed(0));
  }
  function updateColorHandle() {
    Object.assign(colorHandle.style, {
      left: `${Math.floor((contentWidth * hsbValue.s) / 100)}px`,
      top: `${Math.floor((contentHeight * (100 - hsbValue.b)) / 100)}px`,
    });
  }
  function updateColorSelector() {
    colorSelector.style.backgroundColor = `#${RGBtoHEX(HSBtoRGB({
      h: hsbValue.h,
      s: 100,
      b: 100,
      a: 1,
    }))}`;
  }
  function updateHue() {
    colorHueHandle.style.top = `${Math.floor(contentHeight - (contentHeight * hsbValue.h) / 360)}px`;
  }
  function updateAlphaHandle() {
    alphaHandle.style.left = `${hsbValue.a * 100}%`;
  }
  function updateAlphaBg() {
    const { r, g, b } = HSBtoRGB(hsbValue);
    alphaBg.style.background = `linear-gradient(to right, rgba(${r}, ${g}, ${b}, 0) 0%, rgba(${r}, ${g}, ${b}, 1) 100%)`;
  }
  function updateUI() {
    updateColorHandle();
    updateColorSelector();
    updateHue();
    updateAlphaHandle();
    updateAlphaBg();
    updateInput();
  }
  function updateValue(value: Partial<HSB>) {
    hsbValue = validateHSB(Object.assign({}, hsbValue, value));

    updateInput();

    if (options.onChange) {
      options.onChange(`#${HSBtoHEX(hsbValue)}`);
    }
  }

  function pickColor(event: MouseEvent) {
    const rect = colorSelector.getBoundingClientRect();
    const top = rect.top + (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0);
    const left = rect.left + document.body.scrollLeft;
    const saturation = Math.floor((100 * Math.max(0, Math.min(contentWidth, event.pageX - left))) / contentWidth);
    const brightness = Math.floor((100 * (contentHeight - Math.max(0, Math.min(contentHeight, event.pageY - top)))) / contentHeight);

    updateValue({
      s: saturation,
      b: brightness,
    });
    updateUI();
  }
  function pickHue(event: MouseEvent) {
    const top = colorHue.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0);

    updateValue({
      h: Math.floor((360 * (contentHeight - Math.max(0, Math.min(contentHeight, event.pageY - top)))) / contentHeight),
    });
    updateUI();
  }
  function pickAlpha(event: MouseEvent) {
    const { pageX } = event;
    const rect = colorAlpha.getBoundingClientRect();
    let left = pageX - rect.left;
    left = Math.max(handleSizeSec / 2, left);
    left = Math.min(left, rect.width - handleSizeSec / 2);

    updateValue({
      a: Math.round(((left - 10 / 2) / (rect.width - 10)) * 100) / 100,
    });
    updateUI();
  }

  function onDrag(event: MouseEvent) {
    if (colorDragging) {
      event.preventDefault();
      pickColor(event);
    }

    if (hueDragging) {
      event.preventDefault();
      pickHue(event);
    }

    if (alphaDragging) {
      event.preventDefault();
      pickAlpha(event);
    }
  }

  function onColorSelectorDragEnd() {
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', onColorSelectorDragEnd);
    colorDragging = false;
  }
  function onColorSelectorMousedown(e: MouseEvent) {
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', onColorSelectorDragEnd);
    colorDragging = true;
    pickColor(e);
  }
  colorSelector.addEventListener('mousedown', onColorSelectorMousedown);

  function onColorHueDragEnd() {
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', onColorHueDragEnd);
    hueDragging = false;
  }
  function onColorHueMousedown(event: MouseEvent) {
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', onColorHueDragEnd);
    hueDragging = true;
    pickHue(event);
  }
  colorHue.addEventListener('mousedown', onColorHueMousedown);

  function onColorAlphaDragEnd() {
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', onColorAlphaDragEnd);
    alphaDragging = false;
  }
  function onColorAlphaMousedown(event: MouseEvent) {
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', onColorAlphaDragEnd);
    alphaDragging = true;
    pickAlpha(event);
  }
  colorAlpha.addEventListener('mousedown', onColorAlphaMousedown);

  updateUI();
  return root;
}
