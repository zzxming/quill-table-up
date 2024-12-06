import {
  autoUpdate,
  computePosition,
  flip,
  limitShift,
  offset,
  shift,
} from '@floating-ui/dom';
import { createBEM } from '../bem';

interface ToolTipOptions {
  direction?:
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
    | 'right'
    | 'right-start'
    | 'right-end'
    | 'left'
    | 'left-start'
    | 'left-end';
  msg?: string;
  delay?: number;
  content?: HTMLElement;
  type?: 'hover' | 'click';
}
const DISTANCE = 4;
let tooltipContainer: HTMLElement;
export interface TooltipInstance {
  destroy: () => void;
};
export const createTooltip = (target: HTMLElement, options: ToolTipOptions = {}): TooltipInstance | null => {
  const { msg = '', delay = 150, content, direction = 'bottom', type = 'hover' } = options;
  const bem = createBEM('tooltip');
  if (msg || content) {
    if (!tooltipContainer) {
      tooltipContainer = document.createElement('div');
      document.body.appendChild(tooltipContainer);
    }
    const tooltip = document.createElement('div');
    tooltip.classList.add(bem.b(), 'hidden', 'transparent');
    if (content) {
      tooltip.appendChild(content);
    }
    else if (msg) {
      tooltip.textContent = msg;
    }
    let timer: ReturnType<typeof setTimeout> | null;
    let cleanup: () => void;
    const update = () => {
      if (cleanup) cleanup();
      computePosition(target, tooltip, {
        placement: direction,
        middleware: [flip(), shift({ limiter: limitShift() }), offset(DISTANCE)],
      }).then(({ x, y }) => {
        Object.assign(tooltip.style, {
          left: `${x}px`,
          top: `${y}px`,
        });
      });
    };
    const transitionendHandler = () => {
      tooltip.classList.add('hidden');
      if (tooltipContainer.contains(tooltip)) {
        tooltipContainer.removeChild(tooltip);
      }
      if (cleanup) cleanup();
    };
    const open = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        tooltipContainer.appendChild(tooltip);
        tooltip.removeEventListener('transitionend', transitionendHandler);
        tooltip.classList.remove('hidden');

        cleanup = autoUpdate(target, tooltip, update);

        tooltip.classList.remove('transparent');
      }, delay);
    };
    const close = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        tooltip.addEventListener('transitionend', transitionendHandler, { once: true });
        tooltip.classList.add('transparent');
      }, delay);
    };

    const hoverDisplay = () => {
      const eventListeners = [target, tooltip];
      const show = () => {
        for (const listener of eventListeners) {
          listener.addEventListener('mouseenter', open);
          listener.addEventListener('mouseleave', close);
        }
      };
      const hide = () => {
        for (const listener of eventListeners) {
          listener.removeEventListener('mouseenter', open);
          listener.removeEventListener('mouseleave', close);
        }
      };
      return {
        show,
        hide,
        destroy: () => {},
      };
    };
    const stopPropagation = (e: Event) => e.stopPropagation();
    const clickDisplay = () => {
      // eslint-disable-next-line unicorn/consistent-function-scoping
      const show = (e: MouseEvent) => {
        stopPropagation(e);
        open();
        document.removeEventListener('click', close);
        document.addEventListener('click', close, { once: true });
      };
      return {
        show: () => {
          tooltip.addEventListener('click', stopPropagation);
          target.addEventListener('click', show);
        },
        hide: () => {
          document.removeEventListener('click', close);
        },
        destroy: () => {
          tooltip.removeEventListener('click', stopPropagation);
          target.removeEventListener('click', show);
        },
      };
    };
    const displayMethods = {
      hover: hoverDisplay,
      click: clickDisplay,
    };

    const { show, hide, destroy: destroyDisplay } = displayMethods[type]();
    show();

    const destroy = () => {
      hide();
      destroyDisplay();
      if (cleanup) cleanup();
      tooltip.remove();
    };
    return {
      destroy,
    };
  }
  return null;
};
