import type { HSB } from '../color';
import { createBEM } from '../bem';
import { HEXtoRGB, HSBtoHEX, HSBtoRGB, RGBtoHEX, RGBtoHSB, validateHSB } from '../color';

interface ColorPickerOptions {
  color: string;
  onChange: (color: string) => void;
};
export const createColorPicker = (options: Partial<ColorPickerOptions> = {}) => {
  let hsbValue: HSB = RGBtoHSB(HEXtoRGB(options.color || '#ff0000'));
  const bem = createBEM('color-picker');
  const root = document.createElement('div');
  root.classList.add(bem.b());

  const content = document.createElement('div');
  content.classList.add(bem.be('content'));
  root.appendChild(content);

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
  content.appendChild(colorHue);
  content.appendChild(colorSelector);
  content.appendChild(colorAlpha);

  let colorDragging = false;
  let hueDragging = false;
  let alphaDragging = false;
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
  function updateColorHandle() {
    Object.assign(colorHandle.style, {
      left: `${Math.floor((150 * hsbValue.s) / 100)}px`,
      top: `${Math.floor((150 * (100 - hsbValue.b)) / 100)}px`,
    });
  }
  function pickColor(event: MouseEvent) {
    const rect = colorSelector.getBoundingClientRect();
    const top = rect.top + (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0);
    const left = rect.left + document.body.scrollLeft;
    const saturation = Math.floor((100 * Math.max(0, Math.min(150, event.pageX - left))) / 150);
    const brightness = Math.floor((100 * (150 - Math.max(0, Math.min(150, event.pageY - top)))) / 150);

    hsbValue = validateHSB({
      h: hsbValue.h,
      s: saturation,
      b: brightness,
      a: hsbValue.a,
    });

    updateColorHandle();
    if (options.onChange) {
      options.onChange(`#${HSBtoHEX(hsbValue)}`);
    }
  }

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
  function updateHue() {
    colorHueHandle.style.top = `${Math.floor(150 - (150 * hsbValue.h) / 360)}px`;
  }
  function updateColorSelector() {
    colorSelector.style.backgroundColor = `#${RGBtoHEX(HSBtoRGB({
      h: hsbValue.h,
      s: 100,
      b: 100,
      a: 1,
    }))}`;
  }
  function pickHue(event: MouseEvent) {
    const top = colorHue.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0);

    hsbValue = validateHSB({
      h: Math.floor((360 * (150 - Math.max(0, Math.min(150, event.pageY - top)))) / 150),
      s: hsbValue.s,
      b: hsbValue.b,
      a: hsbValue.a,
    });

    updateColorSelector();
    updateHue();
    updateAlphaBg();

    if (options.onChange) {
      options.onChange(`#${HSBtoHEX(hsbValue)}`);
    }
  }

  function pickAlpha(event: MouseEvent) {
    const { pageX } = event;
    const rect = colorAlpha.getBoundingClientRect();
    let left = pageX - rect.left;
    left = Math.max(10 / 2, left);
    left = Math.min(left, rect.width - 10 / 2);

    hsbValue.a = Math.round(((left - 10 / 2) / (rect.width - 10)) * 100) / 100;

    updateAlphaBg();
    updateAlphaHandle();

    if (options.onChange) {
      options.onChange(`#${HSBtoHEX(hsbValue)}`);
    }
  }
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
  function updateAlphaHandle() {
    alphaHandle.style.left = `${hsbValue.a * 100}%`;
  }
  function updateAlphaBg() {
    const { r, g, b } = HSBtoRGB(hsbValue);
    alphaBg.style.background = `linear-gradient(to right, rgba(${r}, ${g}, ${b}, 0) 0%, rgba(${r}, ${g}, ${b}, 1) 100%)`;
  }

  updateColorHandle();
  updateColorSelector();
  updateHue();
  updateAlphaHandle();
  updateAlphaBg();
  return root;
};
