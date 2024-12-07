import {
  autoUpdate,
  computePosition,
  flip,
  limitShift,
  offset,
  shift,
} from '@floating-ui/dom';
import { createBEM } from '../bem';

export interface ToolTipOptions {
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
  container?: HTMLElement;
  type?: 'hover' | 'click';
  onOpen?: (force?: boolean) => boolean;
  onClose?: (force?: boolean) => boolean;
  closed?: () => void;
  onDestroy?: () => void;
}
const DISTANCE = 4;
let tooltipContainer: HTMLElement;
export interface TooltipInstance {
  destroy: () => void;
  show: (force?: boolean) => void;
  hide: (force?: boolean) => void;
};
export const createTooltip = (target: HTMLElement, options: ToolTipOptions = {}): TooltipInstance | null => {
  const { msg = '', delay = 150, content, direction = 'bottom', type = 'hover', container, onOpen, onClose, closed, onDestroy } = options;
  const bem = createBEM('tooltip');
  if (msg || content) {
    if (!tooltipContainer) {
      tooltipContainer = document.createElement('div');
      document.body.appendChild(tooltipContainer);
    }
    const appendTo = container || tooltipContainer;
    const tooltip = document.createElement('div');
    tooltip.classList.add(bem.b(), 'hidden', 'transparent');
    if (content) {
      tooltip.appendChild(content);
    }
    else if (msg) {
      tooltip.textContent = msg;
    }
    let showTimer: ReturnType<typeof setTimeout> | undefined;
    let closeTimer: ReturnType<typeof setTimeout> | undefined;
    let closeTransendTimer: ReturnType<typeof setTimeout> | undefined;
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
      if (appendTo.contains(tooltip)) {
        appendTo.removeChild(tooltip);
      }
      if (cleanup) cleanup();
      if (closed) closed();
    };

    const openTooltip = (force: boolean = false) => {
      if (closeTimer) clearTimeout(closeTimer);
      if (closeTransendTimer) clearTimeout(closeTransendTimer);

      showTimer = setTimeout(() => {
        if (onOpen) {
          const allow = onOpen(force);
          if (!force && allow) return;
        }
        appendTo.appendChild(tooltip);
        tooltip.removeEventListener('transitionend', transitionendHandler);
        tooltip.classList.remove('hidden');

        cleanup = autoUpdate(target, tooltip, update);

        tooltip.classList.remove('transparent');
      }, delay);
    };
    const closeTooltip = (force: boolean = false) => {
      if (showTimer) clearTimeout(showTimer);

      closeTimer = setTimeout(() => {
        if (onClose) {
          const allow = onClose(force);
          if (!force && allow) return;
        }
        tooltip.addEventListener('transitionend', transitionendHandler, { once: true });
        tooltip.classList.add('transparent');
      }, delay);
    };

    const hoverDisplay = () => {
      const eventListeners = [target, tooltip];
      const close = closeTooltip.bind(undefined, false);
      const open = openTooltip.bind(undefined, false);
      const prepare = () => {
        for (const listener of eventListeners) {
          listener.addEventListener('mouseenter', open);
          listener.addEventListener('mouseleave', close);
        }
      };
      return {
        prepare,
        show: openTooltip,
        hide: closeTooltip,
        destroy: () => {
          for (const listener of eventListeners) {
            listener.removeEventListener('mouseenter', open);
            listener.removeEventListener('mouseleave', close);
          }
        },
      };
    };
    const clickDisplay = () => {
      const close = (e: MouseEvent) => {
        e.stopPropagation();
        closeTooltip(false);
      };
      const show = (e: MouseEvent) => {
        e.stopPropagation();
        openTooltip();
        document.removeEventListener('click', close);
        document.addEventListener('click', close, { once: true });
      };
      return {
        prepare: () => {
          tooltip.addEventListener('click', (e: Event) => e.stopPropagation());
          target.addEventListener('click', show);
        },
        show: openTooltip,
        hide: (force: boolean = false) => {
          closeTooltip(force);
          document.removeEventListener('click', close);
        },
        destroy: () => {
          target.removeEventListener('click', show);
          document.removeEventListener('click', close);
        },
      };
    };
    const displayMethods = {
      hover: hoverDisplay,
      click: clickDisplay,
    };

    const { prepare, show, hide, destroy: destroyDisplay } = displayMethods[type]();
    prepare();

    const destroy = () => {
      hide(true);
      if (onDestroy) onDestroy();
      destroyDisplay();
      if (cleanup) cleanup();
      tooltip.remove();
    };
    return {
      show,
      hide,
      destroy,
    };
  }
  return null;
};
