(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('quill')) :
  typeof define === 'function' && define.amd ? define(['exports', 'quill'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.TableUp = {}, global.Quill));
})(this, (function (exports, Quill) { 'use strict';

  /**
   * Custom positioning reference element.
   * @see https://floating-ui.com/docs/virtual-elements
   */

  const min = Math.min;
  const max = Math.max;
  const round = Math.round;
  const floor = Math.floor;
  const createCoords = v => ({
    x: v,
    y: v
  });
  const oppositeSideMap = {
    left: 'right',
    right: 'left',
    bottom: 'top',
    top: 'bottom'
  };
  const oppositeAlignmentMap = {
    start: 'end',
    end: 'start'
  };
  function clamp(start, value, end) {
    return max(start, min(value, end));
  }
  function evaluate(value, param) {
    return typeof value === 'function' ? value(param) : value;
  }
  function getSide(placement) {
    return placement.split('-')[0];
  }
  function getAlignment(placement) {
    return placement.split('-')[1];
  }
  function getOppositeAxis(axis) {
    return axis === 'x' ? 'y' : 'x';
  }
  function getAxisLength(axis) {
    return axis === 'y' ? 'height' : 'width';
  }
  function getSideAxis(placement) {
    return ['top', 'bottom'].includes(getSide(placement)) ? 'y' : 'x';
  }
  function getAlignmentAxis(placement) {
    return getOppositeAxis(getSideAxis(placement));
  }
  function getAlignmentSides(placement, rects, rtl) {
    if (rtl === void 0) {
      rtl = false;
    }
    const alignment = getAlignment(placement);
    const alignmentAxis = getAlignmentAxis(placement);
    const length = getAxisLength(alignmentAxis);
    let mainAlignmentSide = alignmentAxis === 'x' ? alignment === (rtl ? 'end' : 'start') ? 'right' : 'left' : alignment === 'start' ? 'bottom' : 'top';
    if (rects.reference[length] > rects.floating[length]) {
      mainAlignmentSide = getOppositePlacement(mainAlignmentSide);
    }
    return [mainAlignmentSide, getOppositePlacement(mainAlignmentSide)];
  }
  function getExpandedPlacements(placement) {
    const oppositePlacement = getOppositePlacement(placement);
    return [getOppositeAlignmentPlacement(placement), oppositePlacement, getOppositeAlignmentPlacement(oppositePlacement)];
  }
  function getOppositeAlignmentPlacement(placement) {
    return placement.replace(/start|end/g, alignment => oppositeAlignmentMap[alignment]);
  }
  function getSideList(side, isStart, rtl) {
    const lr = ['left', 'right'];
    const rl = ['right', 'left'];
    const tb = ['top', 'bottom'];
    const bt = ['bottom', 'top'];
    switch (side) {
      case 'top':
      case 'bottom':
        if (rtl) return isStart ? rl : lr;
        return isStart ? lr : rl;
      case 'left':
      case 'right':
        return isStart ? tb : bt;
      default:
        return [];
    }
  }
  function getOppositeAxisPlacements(placement, flipAlignment, direction, rtl) {
    const alignment = getAlignment(placement);
    let list = getSideList(getSide(placement), direction === 'start', rtl);
    if (alignment) {
      list = list.map(side => side + "-" + alignment);
      if (flipAlignment) {
        list = list.concat(list.map(getOppositeAlignmentPlacement));
      }
    }
    return list;
  }
  function getOppositePlacement(placement) {
    return placement.replace(/left|right|bottom|top/g, side => oppositeSideMap[side]);
  }
  function expandPaddingObject(padding) {
    return {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      ...padding
    };
  }
  function getPaddingObject(padding) {
    return typeof padding !== 'number' ? expandPaddingObject(padding) : {
      top: padding,
      right: padding,
      bottom: padding,
      left: padding
    };
  }
  function rectToClientRect(rect) {
    const {
      x,
      y,
      width,
      height
    } = rect;
    return {
      width,
      height,
      top: y,
      left: x,
      right: x + width,
      bottom: y + height,
      x,
      y
    };
  }

  function computeCoordsFromPlacement(_ref, placement, rtl) {
    let {
      reference,
      floating
    } = _ref;
    const sideAxis = getSideAxis(placement);
    const alignmentAxis = getAlignmentAxis(placement);
    const alignLength = getAxisLength(alignmentAxis);
    const side = getSide(placement);
    const isVertical = sideAxis === 'y';
    const commonX = reference.x + reference.width / 2 - floating.width / 2;
    const commonY = reference.y + reference.height / 2 - floating.height / 2;
    const commonAlign = reference[alignLength] / 2 - floating[alignLength] / 2;
    let coords;
    switch (side) {
      case 'top':
        coords = {
          x: commonX,
          y: reference.y - floating.height
        };
        break;
      case 'bottom':
        coords = {
          x: commonX,
          y: reference.y + reference.height
        };
        break;
      case 'right':
        coords = {
          x: reference.x + reference.width,
          y: commonY
        };
        break;
      case 'left':
        coords = {
          x: reference.x - floating.width,
          y: commonY
        };
        break;
      default:
        coords = {
          x: reference.x,
          y: reference.y
        };
    }
    switch (getAlignment(placement)) {
      case 'start':
        coords[alignmentAxis] -= commonAlign * (rtl && isVertical ? -1 : 1);
        break;
      case 'end':
        coords[alignmentAxis] += commonAlign * (rtl && isVertical ? -1 : 1);
        break;
    }
    return coords;
  }

  /**
   * Computes the `x` and `y` coordinates that will place the floating element
   * next to a given reference element.
   *
   * This export does not have any `platform` interface logic. You will need to
   * write one for the platform you are using Floating UI with.
   */
  const computePosition$1 = async (reference, floating, config) => {
    const {
      placement = 'bottom',
      strategy = 'absolute',
      middleware = [],
      platform
    } = config;
    const validMiddleware = middleware.filter(Boolean);
    const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(floating));
    let rects = await platform.getElementRects({
      reference,
      floating,
      strategy
    });
    let {
      x,
      y
    } = computeCoordsFromPlacement(rects, placement, rtl);
    let statefulPlacement = placement;
    let middlewareData = {};
    let resetCount = 0;
    for (let i = 0; i < validMiddleware.length; i++) {
      const {
        name,
        fn
      } = validMiddleware[i];
      const {
        x: nextX,
        y: nextY,
        data,
        reset
      } = await fn({
        x,
        y,
        initialPlacement: placement,
        placement: statefulPlacement,
        strategy,
        middlewareData,
        rects,
        platform,
        elements: {
          reference,
          floating
        }
      });
      x = nextX != null ? nextX : x;
      y = nextY != null ? nextY : y;
      middlewareData = {
        ...middlewareData,
        [name]: {
          ...middlewareData[name],
          ...data
        }
      };
      if (reset && resetCount <= 50) {
        resetCount++;
        if (typeof reset === 'object') {
          if (reset.placement) {
            statefulPlacement = reset.placement;
          }
          if (reset.rects) {
            rects = reset.rects === true ? await platform.getElementRects({
              reference,
              floating,
              strategy
            }) : reset.rects;
          }
          ({
            x,
            y
          } = computeCoordsFromPlacement(rects, statefulPlacement, rtl));
        }
        i = -1;
      }
    }
    return {
      x,
      y,
      placement: statefulPlacement,
      strategy,
      middlewareData
    };
  };

  /**
   * Resolves with an object of overflow side offsets that determine how much the
   * element is overflowing a given clipping boundary on each side.
   * - positive = overflowing the boundary by that number of pixels
   * - negative = how many pixels left before it will overflow
   * - 0 = lies flush with the boundary
   * @see https://floating-ui.com/docs/detectOverflow
   */
  async function detectOverflow(state, options) {
    var _await$platform$isEle;
    if (options === void 0) {
      options = {};
    }
    const {
      x,
      y,
      platform,
      rects,
      elements,
      strategy
    } = state;
    const {
      boundary = 'clippingAncestors',
      rootBoundary = 'viewport',
      elementContext = 'floating',
      altBoundary = false,
      padding = 0
    } = evaluate(options, state);
    const paddingObject = getPaddingObject(padding);
    const altContext = elementContext === 'floating' ? 'reference' : 'floating';
    const element = elements[altBoundary ? altContext : elementContext];
    const clippingClientRect = rectToClientRect(await platform.getClippingRect({
      element: ((_await$platform$isEle = await (platform.isElement == null ? void 0 : platform.isElement(element))) != null ? _await$platform$isEle : true) ? element : element.contextElement || (await (platform.getDocumentElement == null ? void 0 : platform.getDocumentElement(elements.floating))),
      boundary,
      rootBoundary,
      strategy
    }));
    const rect = elementContext === 'floating' ? {
      x,
      y,
      width: rects.floating.width,
      height: rects.floating.height
    } : rects.reference;
    const offsetParent = await (platform.getOffsetParent == null ? void 0 : platform.getOffsetParent(elements.floating));
    const offsetScale = (await (platform.isElement == null ? void 0 : platform.isElement(offsetParent))) ? (await (platform.getScale == null ? void 0 : platform.getScale(offsetParent))) || {
      x: 1,
      y: 1
    } : {
      x: 1,
      y: 1
    };
    const elementClientRect = rectToClientRect(platform.convertOffsetParentRelativeRectToViewportRelativeRect ? await platform.convertOffsetParentRelativeRectToViewportRelativeRect({
      elements,
      rect,
      offsetParent,
      strategy
    }) : rect);
    return {
      top: (clippingClientRect.top - elementClientRect.top + paddingObject.top) / offsetScale.y,
      bottom: (elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom) / offsetScale.y,
      left: (clippingClientRect.left - elementClientRect.left + paddingObject.left) / offsetScale.x,
      right: (elementClientRect.right - clippingClientRect.right + paddingObject.right) / offsetScale.x
    };
  }

  /**
   * Optimizes the visibility of the floating element by flipping the `placement`
   * in order to keep it in view when the preferred placement(s) will overflow the
   * clipping boundary. Alternative to `autoPlacement`.
   * @see https://floating-ui.com/docs/flip
   */
  const flip$1 = function (options) {
    if (options === void 0) {
      options = {};
    }
    return {
      name: 'flip',
      options,
      async fn(state) {
        var _middlewareData$arrow, _middlewareData$flip;
        const {
          placement,
          middlewareData,
          rects,
          initialPlacement,
          platform,
          elements
        } = state;
        const {
          mainAxis: checkMainAxis = true,
          crossAxis: checkCrossAxis = true,
          fallbackPlacements: specifiedFallbackPlacements,
          fallbackStrategy = 'bestFit',
          fallbackAxisSideDirection = 'none',
          flipAlignment = true,
          ...detectOverflowOptions
        } = evaluate(options, state);

        // If a reset by the arrow was caused due to an alignment offset being
        // added, we should skip any logic now since `flip()` has already done its
        // work.
        // https://github.com/floating-ui/floating-ui/issues/2549#issuecomment-1719601643
        if ((_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) {
          return {};
        }
        const side = getSide(placement);
        const initialSideAxis = getSideAxis(initialPlacement);
        const isBasePlacement = getSide(initialPlacement) === initialPlacement;
        const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating));
        const fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipAlignment ? [getOppositePlacement(initialPlacement)] : getExpandedPlacements(initialPlacement));
        const hasFallbackAxisSideDirection = fallbackAxisSideDirection !== 'none';
        if (!specifiedFallbackPlacements && hasFallbackAxisSideDirection) {
          fallbackPlacements.push(...getOppositeAxisPlacements(initialPlacement, flipAlignment, fallbackAxisSideDirection, rtl));
        }
        const placements = [initialPlacement, ...fallbackPlacements];
        const overflow = await detectOverflow(state, detectOverflowOptions);
        const overflows = [];
        let overflowsData = ((_middlewareData$flip = middlewareData.flip) == null ? void 0 : _middlewareData$flip.overflows) || [];
        if (checkMainAxis) {
          overflows.push(overflow[side]);
        }
        if (checkCrossAxis) {
          const sides = getAlignmentSides(placement, rects, rtl);
          overflows.push(overflow[sides[0]], overflow[sides[1]]);
        }
        overflowsData = [...overflowsData, {
          placement,
          overflows
        }];

        // One or more sides is overflowing.
        if (!overflows.every(side => side <= 0)) {
          var _middlewareData$flip2, _overflowsData$filter;
          const nextIndex = (((_middlewareData$flip2 = middlewareData.flip) == null ? void 0 : _middlewareData$flip2.index) || 0) + 1;
          const nextPlacement = placements[nextIndex];
          if (nextPlacement) {
            // Try next placement and re-run the lifecycle.
            return {
              data: {
                index: nextIndex,
                overflows: overflowsData
              },
              reset: {
                placement: nextPlacement
              }
            };
          }

          // First, find the candidates that fit on the mainAxis side of overflow,
          // then find the placement that fits the best on the main crossAxis side.
          let resetPlacement = (_overflowsData$filter = overflowsData.filter(d => d.overflows[0] <= 0).sort((a, b) => a.overflows[1] - b.overflows[1])[0]) == null ? void 0 : _overflowsData$filter.placement;

          // Otherwise fallback.
          if (!resetPlacement) {
            switch (fallbackStrategy) {
              case 'bestFit':
                {
                  var _overflowsData$filter2;
                  const placement = (_overflowsData$filter2 = overflowsData.filter(d => {
                    if (hasFallbackAxisSideDirection) {
                      const currentSideAxis = getSideAxis(d.placement);
                      return currentSideAxis === initialSideAxis ||
                      // Create a bias to the `y` side axis due to horizontal
                      // reading directions favoring greater width.
                      currentSideAxis === 'y';
                    }
                    return true;
                  }).map(d => [d.placement, d.overflows.filter(overflow => overflow > 0).reduce((acc, overflow) => acc + overflow, 0)]).sort((a, b) => a[1] - b[1])[0]) == null ? void 0 : _overflowsData$filter2[0];
                  if (placement) {
                    resetPlacement = placement;
                  }
                  break;
                }
              case 'initialPlacement':
                resetPlacement = initialPlacement;
                break;
            }
          }
          if (placement !== resetPlacement) {
            return {
              reset: {
                placement: resetPlacement
              }
            };
          }
        }
        return {};
      }
    };
  };

  // For type backwards-compatibility, the `OffsetOptions` type was also
  // Derivable.

  async function convertValueToCoords(state, options) {
    const {
      placement,
      platform,
      elements
    } = state;
    const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating));
    const side = getSide(placement);
    const alignment = getAlignment(placement);
    const isVertical = getSideAxis(placement) === 'y';
    const mainAxisMulti = ['left', 'top'].includes(side) ? -1 : 1;
    const crossAxisMulti = rtl && isVertical ? -1 : 1;
    const rawValue = evaluate(options, state);

    // eslint-disable-next-line prefer-const
    let {
      mainAxis,
      crossAxis,
      alignmentAxis
    } = typeof rawValue === 'number' ? {
      mainAxis: rawValue,
      crossAxis: 0,
      alignmentAxis: null
    } : {
      mainAxis: rawValue.mainAxis || 0,
      crossAxis: rawValue.crossAxis || 0,
      alignmentAxis: rawValue.alignmentAxis
    };
    if (alignment && typeof alignmentAxis === 'number') {
      crossAxis = alignment === 'end' ? alignmentAxis * -1 : alignmentAxis;
    }
    return isVertical ? {
      x: crossAxis * crossAxisMulti,
      y: mainAxis * mainAxisMulti
    } : {
      x: mainAxis * mainAxisMulti,
      y: crossAxis * crossAxisMulti
    };
  }

  /**
   * Modifies the placement by translating the floating element along the
   * specified axes.
   * A number (shorthand for `mainAxis` or distance), or an axes configuration
   * object may be passed.
   * @see https://floating-ui.com/docs/offset
   */
  const offset$1 = function (options) {
    if (options === void 0) {
      options = 0;
    }
    return {
      name: 'offset',
      options,
      async fn(state) {
        var _middlewareData$offse, _middlewareData$arrow;
        const {
          x,
          y,
          placement,
          middlewareData
        } = state;
        const diffCoords = await convertValueToCoords(state, options);

        // If the placement is the same and the arrow caused an alignment offset
        // then we don't need to change the positioning coordinates.
        if (placement === ((_middlewareData$offse = middlewareData.offset) == null ? void 0 : _middlewareData$offse.placement) && (_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) {
          return {};
        }
        return {
          x: x + diffCoords.x,
          y: y + diffCoords.y,
          data: {
            ...diffCoords,
            placement
          }
        };
      }
    };
  };

  /**
   * Optimizes the visibility of the floating element by shifting it in order to
   * keep it in view when it will overflow the clipping boundary.
   * @see https://floating-ui.com/docs/shift
   */
  const shift$1 = function (options) {
    if (options === void 0) {
      options = {};
    }
    return {
      name: 'shift',
      options,
      async fn(state) {
        const {
          x,
          y,
          placement
        } = state;
        const {
          mainAxis: checkMainAxis = true,
          crossAxis: checkCrossAxis = false,
          limiter = {
            fn: _ref => {
              let {
                x,
                y
              } = _ref;
              return {
                x,
                y
              };
            }
          },
          ...detectOverflowOptions
        } = evaluate(options, state);
        const coords = {
          x,
          y
        };
        const overflow = await detectOverflow(state, detectOverflowOptions);
        const crossAxis = getSideAxis(getSide(placement));
        const mainAxis = getOppositeAxis(crossAxis);
        let mainAxisCoord = coords[mainAxis];
        let crossAxisCoord = coords[crossAxis];
        if (checkMainAxis) {
          const minSide = mainAxis === 'y' ? 'top' : 'left';
          const maxSide = mainAxis === 'y' ? 'bottom' : 'right';
          const min = mainAxisCoord + overflow[minSide];
          const max = mainAxisCoord - overflow[maxSide];
          mainAxisCoord = clamp(min, mainAxisCoord, max);
        }
        if (checkCrossAxis) {
          const minSide = crossAxis === 'y' ? 'top' : 'left';
          const maxSide = crossAxis === 'y' ? 'bottom' : 'right';
          const min = crossAxisCoord + overflow[minSide];
          const max = crossAxisCoord - overflow[maxSide];
          crossAxisCoord = clamp(min, crossAxisCoord, max);
        }
        const limitedCoords = limiter.fn({
          ...state,
          [mainAxis]: mainAxisCoord,
          [crossAxis]: crossAxisCoord
        });
        return {
          ...limitedCoords,
          data: {
            x: limitedCoords.x - x,
            y: limitedCoords.y - y,
            enabled: {
              [mainAxis]: checkMainAxis,
              [crossAxis]: checkCrossAxis
            }
          }
        };
      }
    };
  };
  /**
   * Built-in `limiter` that will stop `shift()` at a certain point.
   */
  const limitShift$1 = function (options) {
    if (options === void 0) {
      options = {};
    }
    return {
      options,
      fn(state) {
        const {
          x,
          y,
          placement,
          rects,
          middlewareData
        } = state;
        const {
          offset = 0,
          mainAxis: checkMainAxis = true,
          crossAxis: checkCrossAxis = true
        } = evaluate(options, state);
        const coords = {
          x,
          y
        };
        const crossAxis = getSideAxis(placement);
        const mainAxis = getOppositeAxis(crossAxis);
        let mainAxisCoord = coords[mainAxis];
        let crossAxisCoord = coords[crossAxis];
        const rawOffset = evaluate(offset, state);
        const computedOffset = typeof rawOffset === 'number' ? {
          mainAxis: rawOffset,
          crossAxis: 0
        } : {
          mainAxis: 0,
          crossAxis: 0,
          ...rawOffset
        };
        if (checkMainAxis) {
          const len = mainAxis === 'y' ? 'height' : 'width';
          const limitMin = rects.reference[mainAxis] - rects.floating[len] + computedOffset.mainAxis;
          const limitMax = rects.reference[mainAxis] + rects.reference[len] - computedOffset.mainAxis;
          if (mainAxisCoord < limitMin) {
            mainAxisCoord = limitMin;
          } else if (mainAxisCoord > limitMax) {
            mainAxisCoord = limitMax;
          }
        }
        if (checkCrossAxis) {
          var _middlewareData$offse, _middlewareData$offse2;
          const len = mainAxis === 'y' ? 'width' : 'height';
          const isOriginSide = ['top', 'left'].includes(getSide(placement));
          const limitMin = rects.reference[crossAxis] - rects.floating[len] + (isOriginSide ? ((_middlewareData$offse = middlewareData.offset) == null ? void 0 : _middlewareData$offse[crossAxis]) || 0 : 0) + (isOriginSide ? 0 : computedOffset.crossAxis);
          const limitMax = rects.reference[crossAxis] + rects.reference[len] + (isOriginSide ? 0 : ((_middlewareData$offse2 = middlewareData.offset) == null ? void 0 : _middlewareData$offse2[crossAxis]) || 0) - (isOriginSide ? computedOffset.crossAxis : 0);
          if (crossAxisCoord < limitMin) {
            crossAxisCoord = limitMin;
          } else if (crossAxisCoord > limitMax) {
            crossAxisCoord = limitMax;
          }
        }
        return {
          [mainAxis]: mainAxisCoord,
          [crossAxis]: crossAxisCoord
        };
      }
    };
  };

  function hasWindow() {
    return typeof window !== 'undefined';
  }
  function getNodeName(node) {
    if (isNode(node)) {
      return (node.nodeName || '').toLowerCase();
    }
    // Mocked nodes in testing environments may not be instances of Node. By
    // returning `#document` an infinite loop won't occur.
    // https://github.com/floating-ui/floating-ui/issues/2317
    return '#document';
  }
  function getWindow(node) {
    var _node$ownerDocument;
    return (node == null || (_node$ownerDocument = node.ownerDocument) == null ? void 0 : _node$ownerDocument.defaultView) || window;
  }
  function getDocumentElement(node) {
    var _ref;
    return (_ref = (isNode(node) ? node.ownerDocument : node.document) || window.document) == null ? void 0 : _ref.documentElement;
  }
  function isNode(value) {
    if (!hasWindow()) {
      return false;
    }
    return value instanceof Node || value instanceof getWindow(value).Node;
  }
  function isElement(value) {
    if (!hasWindow()) {
      return false;
    }
    return value instanceof Element || value instanceof getWindow(value).Element;
  }
  function isHTMLElement(value) {
    if (!hasWindow()) {
      return false;
    }
    return value instanceof HTMLElement || value instanceof getWindow(value).HTMLElement;
  }
  function isShadowRoot(value) {
    if (!hasWindow() || typeof ShadowRoot === 'undefined') {
      return false;
    }
    return value instanceof ShadowRoot || value instanceof getWindow(value).ShadowRoot;
  }
  function isOverflowElement(element) {
    const {
      overflow,
      overflowX,
      overflowY,
      display
    } = getComputedStyle$1(element);
    return /auto|scroll|overlay|hidden|clip/.test(overflow + overflowY + overflowX) && !['inline', 'contents'].includes(display);
  }
  function isTableElement(element) {
    return ['table', 'td', 'th'].includes(getNodeName(element));
  }
  function isTopLayer(element) {
    return [':popover-open', ':modal'].some(selector => {
      try {
        return element.matches(selector);
      } catch (e) {
        return false;
      }
    });
  }
  function isContainingBlock(elementOrCss) {
    const webkit = isWebKit();
    const css = isElement(elementOrCss) ? getComputedStyle$1(elementOrCss) : elementOrCss;

    // https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block
    return css.transform !== 'none' || css.perspective !== 'none' || (css.containerType ? css.containerType !== 'normal' : false) || !webkit && (css.backdropFilter ? css.backdropFilter !== 'none' : false) || !webkit && (css.filter ? css.filter !== 'none' : false) || ['transform', 'perspective', 'filter'].some(value => (css.willChange || '').includes(value)) || ['paint', 'layout', 'strict', 'content'].some(value => (css.contain || '').includes(value));
  }
  function getContainingBlock(element) {
    let currentNode = getParentNode(element);
    while (isHTMLElement(currentNode) && !isLastTraversableNode(currentNode)) {
      if (isContainingBlock(currentNode)) {
        return currentNode;
      } else if (isTopLayer(currentNode)) {
        return null;
      }
      currentNode = getParentNode(currentNode);
    }
    return null;
  }
  function isWebKit() {
    if (typeof CSS === 'undefined' || !CSS.supports) return false;
    return CSS.supports('-webkit-backdrop-filter', 'none');
  }
  function isLastTraversableNode(node) {
    return ['html', 'body', '#document'].includes(getNodeName(node));
  }
  function getComputedStyle$1(element) {
    return getWindow(element).getComputedStyle(element);
  }
  function getNodeScroll(element) {
    if (isElement(element)) {
      return {
        scrollLeft: element.scrollLeft,
        scrollTop: element.scrollTop
      };
    }
    return {
      scrollLeft: element.scrollX,
      scrollTop: element.scrollY
    };
  }
  function getParentNode(node) {
    if (getNodeName(node) === 'html') {
      return node;
    }
    const result =
    // Step into the shadow DOM of the parent of a slotted node.
    node.assignedSlot ||
    // DOM Element detected.
    node.parentNode ||
    // ShadowRoot detected.
    isShadowRoot(node) && node.host ||
    // Fallback.
    getDocumentElement(node);
    return isShadowRoot(result) ? result.host : result;
  }
  function getNearestOverflowAncestor(node) {
    const parentNode = getParentNode(node);
    if (isLastTraversableNode(parentNode)) {
      return node.ownerDocument ? node.ownerDocument.body : node.body;
    }
    if (isHTMLElement(parentNode) && isOverflowElement(parentNode)) {
      return parentNode;
    }
    return getNearestOverflowAncestor(parentNode);
  }
  function getOverflowAncestors(node, list, traverseIframes) {
    var _node$ownerDocument2;
    if (list === void 0) {
      list = [];
    }
    if (traverseIframes === void 0) {
      traverseIframes = true;
    }
    const scrollableAncestor = getNearestOverflowAncestor(node);
    const isBody = scrollableAncestor === ((_node$ownerDocument2 = node.ownerDocument) == null ? void 0 : _node$ownerDocument2.body);
    const win = getWindow(scrollableAncestor);
    if (isBody) {
      const frameElement = getFrameElement(win);
      return list.concat(win, win.visualViewport || [], isOverflowElement(scrollableAncestor) ? scrollableAncestor : [], frameElement && traverseIframes ? getOverflowAncestors(frameElement) : []);
    }
    return list.concat(scrollableAncestor, getOverflowAncestors(scrollableAncestor, [], traverseIframes));
  }
  function getFrameElement(win) {
    return win.parent && Object.getPrototypeOf(win.parent) ? win.frameElement : null;
  }

  function getCssDimensions(element) {
    const css = getComputedStyle$1(element);
    // In testing environments, the `width` and `height` properties are empty
    // strings for SVG elements, returning NaN. Fallback to `0` in this case.
    let width = parseFloat(css.width) || 0;
    let height = parseFloat(css.height) || 0;
    const hasOffset = isHTMLElement(element);
    const offsetWidth = hasOffset ? element.offsetWidth : width;
    const offsetHeight = hasOffset ? element.offsetHeight : height;
    const shouldFallback = round(width) !== offsetWidth || round(height) !== offsetHeight;
    if (shouldFallback) {
      width = offsetWidth;
      height = offsetHeight;
    }
    return {
      width,
      height,
      $: shouldFallback
    };
  }

  function unwrapElement(element) {
    return !isElement(element) ? element.contextElement : element;
  }

  function getScale(element) {
    const domElement = unwrapElement(element);
    if (!isHTMLElement(domElement)) {
      return createCoords(1);
    }
    const rect = domElement.getBoundingClientRect();
    const {
      width,
      height,
      $
    } = getCssDimensions(domElement);
    let x = ($ ? round(rect.width) : rect.width) / width;
    let y = ($ ? round(rect.height) : rect.height) / height;

    // 0, NaN, or Infinity should always fallback to 1.

    if (!x || !Number.isFinite(x)) {
      x = 1;
    }
    if (!y || !Number.isFinite(y)) {
      y = 1;
    }
    return {
      x,
      y
    };
  }

  const noOffsets = /*#__PURE__*/createCoords(0);
  function getVisualOffsets(element) {
    const win = getWindow(element);
    if (!isWebKit() || !win.visualViewport) {
      return noOffsets;
    }
    return {
      x: win.visualViewport.offsetLeft,
      y: win.visualViewport.offsetTop
    };
  }
  function shouldAddVisualOffsets(element, isFixed, floatingOffsetParent) {
    if (isFixed === void 0) {
      isFixed = false;
    }
    if (!floatingOffsetParent || isFixed && floatingOffsetParent !== getWindow(element)) {
      return false;
    }
    return isFixed;
  }

  function getBoundingClientRect(element, includeScale, isFixedStrategy, offsetParent) {
    if (includeScale === void 0) {
      includeScale = false;
    }
    if (isFixedStrategy === void 0) {
      isFixedStrategy = false;
    }
    const clientRect = element.getBoundingClientRect();
    const domElement = unwrapElement(element);
    let scale = createCoords(1);
    if (includeScale) {
      if (offsetParent) {
        if (isElement(offsetParent)) {
          scale = getScale(offsetParent);
        }
      } else {
        scale = getScale(element);
      }
    }
    const visualOffsets = shouldAddVisualOffsets(domElement, isFixedStrategy, offsetParent) ? getVisualOffsets(domElement) : createCoords(0);
    let x = (clientRect.left + visualOffsets.x) / scale.x;
    let y = (clientRect.top + visualOffsets.y) / scale.y;
    let width = clientRect.width / scale.x;
    let height = clientRect.height / scale.y;
    if (domElement) {
      const win = getWindow(domElement);
      const offsetWin = offsetParent && isElement(offsetParent) ? getWindow(offsetParent) : offsetParent;
      let currentWin = win;
      let currentIFrame = getFrameElement(currentWin);
      while (currentIFrame && offsetParent && offsetWin !== currentWin) {
        const iframeScale = getScale(currentIFrame);
        const iframeRect = currentIFrame.getBoundingClientRect();
        const css = getComputedStyle$1(currentIFrame);
        const left = iframeRect.left + (currentIFrame.clientLeft + parseFloat(css.paddingLeft)) * iframeScale.x;
        const top = iframeRect.top + (currentIFrame.clientTop + parseFloat(css.paddingTop)) * iframeScale.y;
        x *= iframeScale.x;
        y *= iframeScale.y;
        width *= iframeScale.x;
        height *= iframeScale.y;
        x += left;
        y += top;
        currentWin = getWindow(currentIFrame);
        currentIFrame = getFrameElement(currentWin);
      }
    }
    return rectToClientRect({
      width,
      height,
      x,
      y
    });
  }

  // If <html> has a CSS width greater than the viewport, then this will be
  // incorrect for RTL.
  function getWindowScrollBarX(element, rect) {
    const leftScroll = getNodeScroll(element).scrollLeft;
    if (!rect) {
      return getBoundingClientRect(getDocumentElement(element)).left + leftScroll;
    }
    return rect.left + leftScroll;
  }

  function getHTMLOffset(documentElement, scroll, ignoreScrollbarX) {
    if (ignoreScrollbarX === void 0) {
      ignoreScrollbarX = false;
    }
    const htmlRect = documentElement.getBoundingClientRect();
    const x = htmlRect.left + scroll.scrollLeft - (ignoreScrollbarX ? 0 :
    // RTL <body> scrollbar.
    getWindowScrollBarX(documentElement, htmlRect));
    const y = htmlRect.top + scroll.scrollTop;
    return {
      x,
      y
    };
  }

  function convertOffsetParentRelativeRectToViewportRelativeRect(_ref) {
    let {
      elements,
      rect,
      offsetParent,
      strategy
    } = _ref;
    const isFixed = strategy === 'fixed';
    const documentElement = getDocumentElement(offsetParent);
    const topLayer = elements ? isTopLayer(elements.floating) : false;
    if (offsetParent === documentElement || topLayer && isFixed) {
      return rect;
    }
    let scroll = {
      scrollLeft: 0,
      scrollTop: 0
    };
    let scale = createCoords(1);
    const offsets = createCoords(0);
    const isOffsetParentAnElement = isHTMLElement(offsetParent);
    if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
      if (getNodeName(offsetParent) !== 'body' || isOverflowElement(documentElement)) {
        scroll = getNodeScroll(offsetParent);
      }
      if (isHTMLElement(offsetParent)) {
        const offsetRect = getBoundingClientRect(offsetParent);
        scale = getScale(offsetParent);
        offsets.x = offsetRect.x + offsetParent.clientLeft;
        offsets.y = offsetRect.y + offsetParent.clientTop;
      }
    }
    const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll, true) : createCoords(0);
    return {
      width: rect.width * scale.x,
      height: rect.height * scale.y,
      x: rect.x * scale.x - scroll.scrollLeft * scale.x + offsets.x + htmlOffset.x,
      y: rect.y * scale.y - scroll.scrollTop * scale.y + offsets.y + htmlOffset.y
    };
  }

  function getClientRects(element) {
    return Array.from(element.getClientRects());
  }

  // Gets the entire size of the scrollable document area, even extending outside
  // of the `<html>` and `<body>` rect bounds if horizontally scrollable.
  function getDocumentRect(element) {
    const html = getDocumentElement(element);
    const scroll = getNodeScroll(element);
    const body = element.ownerDocument.body;
    const width = max(html.scrollWidth, html.clientWidth, body.scrollWidth, body.clientWidth);
    const height = max(html.scrollHeight, html.clientHeight, body.scrollHeight, body.clientHeight);
    let x = -scroll.scrollLeft + getWindowScrollBarX(element);
    const y = -scroll.scrollTop;
    if (getComputedStyle$1(body).direction === 'rtl') {
      x += max(html.clientWidth, body.clientWidth) - width;
    }
    return {
      width,
      height,
      x,
      y
    };
  }

  function getViewportRect(element, strategy) {
    const win = getWindow(element);
    const html = getDocumentElement(element);
    const visualViewport = win.visualViewport;
    let width = html.clientWidth;
    let height = html.clientHeight;
    let x = 0;
    let y = 0;
    if (visualViewport) {
      width = visualViewport.width;
      height = visualViewport.height;
      const visualViewportBased = isWebKit();
      if (!visualViewportBased || visualViewportBased && strategy === 'fixed') {
        x = visualViewport.offsetLeft;
        y = visualViewport.offsetTop;
      }
    }
    return {
      width,
      height,
      x,
      y
    };
  }

  // Returns the inner client rect, subtracting scrollbars if present.
  function getInnerBoundingClientRect(element, strategy) {
    const clientRect = getBoundingClientRect(element, true, strategy === 'fixed');
    const top = clientRect.top + element.clientTop;
    const left = clientRect.left + element.clientLeft;
    const scale = isHTMLElement(element) ? getScale(element) : createCoords(1);
    const width = element.clientWidth * scale.x;
    const height = element.clientHeight * scale.y;
    const x = left * scale.x;
    const y = top * scale.y;
    return {
      width,
      height,
      x,
      y
    };
  }
  function getClientRectFromClippingAncestor(element, clippingAncestor, strategy) {
    let rect;
    if (clippingAncestor === 'viewport') {
      rect = getViewportRect(element, strategy);
    } else if (clippingAncestor === 'document') {
      rect = getDocumentRect(getDocumentElement(element));
    } else if (isElement(clippingAncestor)) {
      rect = getInnerBoundingClientRect(clippingAncestor, strategy);
    } else {
      const visualOffsets = getVisualOffsets(element);
      rect = {
        x: clippingAncestor.x - visualOffsets.x,
        y: clippingAncestor.y - visualOffsets.y,
        width: clippingAncestor.width,
        height: clippingAncestor.height
      };
    }
    return rectToClientRect(rect);
  }
  function hasFixedPositionAncestor(element, stopNode) {
    const parentNode = getParentNode(element);
    if (parentNode === stopNode || !isElement(parentNode) || isLastTraversableNode(parentNode)) {
      return false;
    }
    return getComputedStyle$1(parentNode).position === 'fixed' || hasFixedPositionAncestor(parentNode, stopNode);
  }

  // A "clipping ancestor" is an `overflow` element with the characteristic of
  // clipping (or hiding) child elements. This returns all clipping ancestors
  // of the given element up the tree.
  function getClippingElementAncestors(element, cache) {
    const cachedResult = cache.get(element);
    if (cachedResult) {
      return cachedResult;
    }
    let result = getOverflowAncestors(element, [], false).filter(el => isElement(el) && getNodeName(el) !== 'body');
    let currentContainingBlockComputedStyle = null;
    const elementIsFixed = getComputedStyle$1(element).position === 'fixed';
    let currentNode = elementIsFixed ? getParentNode(element) : element;

    // https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block
    while (isElement(currentNode) && !isLastTraversableNode(currentNode)) {
      const computedStyle = getComputedStyle$1(currentNode);
      const currentNodeIsContaining = isContainingBlock(currentNode);
      if (!currentNodeIsContaining && computedStyle.position === 'fixed') {
        currentContainingBlockComputedStyle = null;
      }
      const shouldDropCurrentNode = elementIsFixed ? !currentNodeIsContaining && !currentContainingBlockComputedStyle : !currentNodeIsContaining && computedStyle.position === 'static' && !!currentContainingBlockComputedStyle && ['absolute', 'fixed'].includes(currentContainingBlockComputedStyle.position) || isOverflowElement(currentNode) && !currentNodeIsContaining && hasFixedPositionAncestor(element, currentNode);
      if (shouldDropCurrentNode) {
        // Drop non-containing blocks.
        result = result.filter(ancestor => ancestor !== currentNode);
      } else {
        // Record last containing block for next iteration.
        currentContainingBlockComputedStyle = computedStyle;
      }
      currentNode = getParentNode(currentNode);
    }
    cache.set(element, result);
    return result;
  }

  // Gets the maximum area that the element is visible in due to any number of
  // clipping ancestors.
  function getClippingRect(_ref) {
    let {
      element,
      boundary,
      rootBoundary,
      strategy
    } = _ref;
    const elementClippingAncestors = boundary === 'clippingAncestors' ? isTopLayer(element) ? [] : getClippingElementAncestors(element, this._c) : [].concat(boundary);
    const clippingAncestors = [...elementClippingAncestors, rootBoundary];
    const firstClippingAncestor = clippingAncestors[0];
    const clippingRect = clippingAncestors.reduce((accRect, clippingAncestor) => {
      const rect = getClientRectFromClippingAncestor(element, clippingAncestor, strategy);
      accRect.top = max(rect.top, accRect.top);
      accRect.right = min(rect.right, accRect.right);
      accRect.bottom = min(rect.bottom, accRect.bottom);
      accRect.left = max(rect.left, accRect.left);
      return accRect;
    }, getClientRectFromClippingAncestor(element, firstClippingAncestor, strategy));
    return {
      width: clippingRect.right - clippingRect.left,
      height: clippingRect.bottom - clippingRect.top,
      x: clippingRect.left,
      y: clippingRect.top
    };
  }

  function getDimensions(element) {
    const {
      width,
      height
    } = getCssDimensions(element);
    return {
      width,
      height
    };
  }

  function getRectRelativeToOffsetParent(element, offsetParent, strategy) {
    const isOffsetParentAnElement = isHTMLElement(offsetParent);
    const documentElement = getDocumentElement(offsetParent);
    const isFixed = strategy === 'fixed';
    const rect = getBoundingClientRect(element, true, isFixed, offsetParent);
    let scroll = {
      scrollLeft: 0,
      scrollTop: 0
    };
    const offsets = createCoords(0);
    if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
      if (getNodeName(offsetParent) !== 'body' || isOverflowElement(documentElement)) {
        scroll = getNodeScroll(offsetParent);
      }
      if (isOffsetParentAnElement) {
        const offsetRect = getBoundingClientRect(offsetParent, true, isFixed, offsetParent);
        offsets.x = offsetRect.x + offsetParent.clientLeft;
        offsets.y = offsetRect.y + offsetParent.clientTop;
      } else if (documentElement) {
        // If the <body> scrollbar appears on the left (e.g. RTL systems). Use
        // Firefox with layout.scrollbar.side = 3 in about:config to test this.
        offsets.x = getWindowScrollBarX(documentElement);
      }
    }
    const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
    const x = rect.left + scroll.scrollLeft - offsets.x - htmlOffset.x;
    const y = rect.top + scroll.scrollTop - offsets.y - htmlOffset.y;
    return {
      x,
      y,
      width: rect.width,
      height: rect.height
    };
  }

  function isStaticPositioned(element) {
    return getComputedStyle$1(element).position === 'static';
  }

  function getTrueOffsetParent(element, polyfill) {
    if (!isHTMLElement(element) || getComputedStyle$1(element).position === 'fixed') {
      return null;
    }
    if (polyfill) {
      return polyfill(element);
    }
    let rawOffsetParent = element.offsetParent;

    // Firefox returns the <html> element as the offsetParent if it's non-static,
    // while Chrome and Safari return the <body> element. The <body> element must
    // be used to perform the correct calculations even if the <html> element is
    // non-static.
    if (getDocumentElement(element) === rawOffsetParent) {
      rawOffsetParent = rawOffsetParent.ownerDocument.body;
    }
    return rawOffsetParent;
  }

  // Gets the closest ancestor positioned element. Handles some edge cases,
  // such as table ancestors and cross browser bugs.
  function getOffsetParent(element, polyfill) {
    const win = getWindow(element);
    if (isTopLayer(element)) {
      return win;
    }
    if (!isHTMLElement(element)) {
      let svgOffsetParent = getParentNode(element);
      while (svgOffsetParent && !isLastTraversableNode(svgOffsetParent)) {
        if (isElement(svgOffsetParent) && !isStaticPositioned(svgOffsetParent)) {
          return svgOffsetParent;
        }
        svgOffsetParent = getParentNode(svgOffsetParent);
      }
      return win;
    }
    let offsetParent = getTrueOffsetParent(element, polyfill);
    while (offsetParent && isTableElement(offsetParent) && isStaticPositioned(offsetParent)) {
      offsetParent = getTrueOffsetParent(offsetParent, polyfill);
    }
    if (offsetParent && isLastTraversableNode(offsetParent) && isStaticPositioned(offsetParent) && !isContainingBlock(offsetParent)) {
      return win;
    }
    return offsetParent || getContainingBlock(element) || win;
  }

  const getElementRects = async function (data) {
    const getOffsetParentFn = this.getOffsetParent || getOffsetParent;
    const getDimensionsFn = this.getDimensions;
    const floatingDimensions = await getDimensionsFn(data.floating);
    return {
      reference: getRectRelativeToOffsetParent(data.reference, await getOffsetParentFn(data.floating), data.strategy),
      floating: {
        x: 0,
        y: 0,
        width: floatingDimensions.width,
        height: floatingDimensions.height
      }
    };
  };

  function isRTL(element) {
    return getComputedStyle$1(element).direction === 'rtl';
  }

  const platform = {
    convertOffsetParentRelativeRectToViewportRelativeRect,
    getDocumentElement,
    getClippingRect,
    getOffsetParent,
    getElementRects,
    getClientRects,
    getDimensions,
    getScale,
    isElement,
    isRTL
  };

  // https://samthor.au/2021/observing-dom/
  function observeMove(element, onMove) {
    let io = null;
    let timeoutId;
    const root = getDocumentElement(element);
    function cleanup() {
      var _io;
      clearTimeout(timeoutId);
      (_io = io) == null || _io.disconnect();
      io = null;
    }
    function refresh(skip, threshold) {
      if (skip === void 0) {
        skip = false;
      }
      if (threshold === void 0) {
        threshold = 1;
      }
      cleanup();
      const {
        left,
        top,
        width,
        height
      } = element.getBoundingClientRect();
      if (!skip) {
        onMove();
      }
      if (!width || !height) {
        return;
      }
      const insetTop = floor(top);
      const insetRight = floor(root.clientWidth - (left + width));
      const insetBottom = floor(root.clientHeight - (top + height));
      const insetLeft = floor(left);
      const rootMargin = -insetTop + "px " + -insetRight + "px " + -insetBottom + "px " + -insetLeft + "px";
      const options = {
        rootMargin,
        threshold: max(0, min(1, threshold)) || 1
      };
      let isFirstUpdate = true;
      function handleObserve(entries) {
        const ratio = entries[0].intersectionRatio;
        if (ratio !== threshold) {
          if (!isFirstUpdate) {
            return refresh();
          }
          if (!ratio) {
            // If the reference is clipped, the ratio is 0. Throttle the refresh
            // to prevent an infinite loop of updates.
            timeoutId = setTimeout(() => {
              refresh(false, 1e-7);
            }, 1000);
          } else {
            refresh(false, ratio);
          }
        }
        isFirstUpdate = false;
      }

      // Older browsers don't support a `document` as the root and will throw an
      // error.
      try {
        io = new IntersectionObserver(handleObserve, {
          ...options,
          // Handle <iframe>s
          root: root.ownerDocument
        });
      } catch (e) {
        io = new IntersectionObserver(handleObserve, options);
      }
      io.observe(element);
    }
    refresh(true);
    return cleanup;
  }

  /**
   * Automatically updates the position of the floating element when necessary.
   * Should only be called when the floating element is mounted on the DOM or
   * visible on the screen.
   * @returns cleanup function that should be invoked when the floating element is
   * removed from the DOM or hidden from the screen.
   * @see https://floating-ui.com/docs/autoUpdate
   */
  function autoUpdate(reference, floating, update, options) {
    if (options === void 0) {
      options = {};
    }
    const {
      ancestorScroll = true,
      ancestorResize = true,
      elementResize = typeof ResizeObserver === 'function',
      layoutShift = typeof IntersectionObserver === 'function',
      animationFrame = false
    } = options;
    const referenceEl = unwrapElement(reference);
    const ancestors = ancestorScroll || ancestorResize ? [...(referenceEl ? getOverflowAncestors(referenceEl) : []), ...getOverflowAncestors(floating)] : [];
    ancestors.forEach(ancestor => {
      ancestorScroll && ancestor.addEventListener('scroll', update, {
        passive: true
      });
      ancestorResize && ancestor.addEventListener('resize', update);
    });
    const cleanupIo = referenceEl && layoutShift ? observeMove(referenceEl, update) : null;
    let reobserveFrame = -1;
    let resizeObserver = null;
    if (elementResize) {
      resizeObserver = new ResizeObserver(_ref => {
        let [firstEntry] = _ref;
        if (firstEntry && firstEntry.target === referenceEl && resizeObserver) {
          // Prevent update loops when using the `size` middleware.
          // https://github.com/floating-ui/floating-ui/issues/1740
          resizeObserver.unobserve(floating);
          cancelAnimationFrame(reobserveFrame);
          reobserveFrame = requestAnimationFrame(() => {
            var _resizeObserver;
            (_resizeObserver = resizeObserver) == null || _resizeObserver.observe(floating);
          });
        }
        update();
      });
      if (referenceEl && !animationFrame) {
        resizeObserver.observe(referenceEl);
      }
      resizeObserver.observe(floating);
    }
    let frameId;
    let prevRefRect = animationFrame ? getBoundingClientRect(reference) : null;
    if (animationFrame) {
      frameLoop();
    }
    function frameLoop() {
      const nextRefRect = getBoundingClientRect(reference);
      if (prevRefRect && (nextRefRect.x !== prevRefRect.x || nextRefRect.y !== prevRefRect.y || nextRefRect.width !== prevRefRect.width || nextRefRect.height !== prevRefRect.height)) {
        update();
      }
      prevRefRect = nextRefRect;
      frameId = requestAnimationFrame(frameLoop);
    }
    update();
    return () => {
      var _resizeObserver2;
      ancestors.forEach(ancestor => {
        ancestorScroll && ancestor.removeEventListener('scroll', update);
        ancestorResize && ancestor.removeEventListener('resize', update);
      });
      cleanupIo == null || cleanupIo();
      (_resizeObserver2 = resizeObserver) == null || _resizeObserver2.disconnect();
      resizeObserver = null;
      if (animationFrame) {
        cancelAnimationFrame(frameId);
      }
    };
  }

  /**
   * Modifies the placement by translating the floating element along the
   * specified axes.
   * A number (shorthand for `mainAxis` or distance), or an axes configuration
   * object may be passed.
   * @see https://floating-ui.com/docs/offset
   */
  const offset = offset$1;

  /**
   * Optimizes the visibility of the floating element by shifting it in order to
   * keep it in view when it will overflow the clipping boundary.
   * @see https://floating-ui.com/docs/shift
   */
  const shift = shift$1;

  /**
   * Optimizes the visibility of the floating element by flipping the `placement`
   * in order to keep it in view when the preferred placement(s) will overflow the
   * clipping boundary. Alternative to `autoPlacement`.
   * @see https://floating-ui.com/docs/flip
   */
  const flip = flip$1;

  /**
   * Built-in `limiter` that will stop `shift()` at a certain point.
   */
  const limitShift = limitShift$1;

  /**
   * Computes the `x` and `y` coordinates that will place the floating element
   * next to a given reference element.
   */
  const computePosition = (reference, floating, options) => {
    // This caches the expensive `getClippingElementAncestors` function so that
    // multiple lifecycle resets re-use the same result. It only lives for a
    // single call. If other functions become expensive, we can add them as well.
    const cache = new Map();
    const mergedOptions = {
      platform,
      ...options
    };
    const platformWithCache = {
      ...mergedOptions.platform,
      _c: cache
    };
    return computePosition$1(reference, floating, {
      ...mergedOptions,
      platform: platformWithCache
    });
  };

  const isFunction = (val) => typeof val === 'function';
  const isBoolean = (val) => typeof val === 'boolean';
  const isArray = Array.isArray;
  const randomId = () => Math.random().toString(36).slice(2);
  const debounce = (fn, delay) => {
      let timestamp;
      return function (...args) {
          if (timestamp) {
              clearTimeout(timestamp);
          }
          timestamp = setTimeout(() => {
              fn.apply(this, args);
          }, delay);
      };
  };
  function findParentBlot(blot, targetBlotName) {
      let target = blot.parent;
      while (target && target.statics.blotName !== targetBlotName && target !== blot.scroll) {
          target = target.parent;
      }
      if (target === blot.scroll) {
          throw new Error(`${blot.statics.blotName} must be a child of ${targetBlotName}`);
      }
      return target;
  }
  function findParentBlots(blot, targetBlotNames) {
      const resultBlots = new Array(targetBlotNames.length);
      const blotNameIndexMaps = new Map(targetBlotNames.map((name, i) => [name, i]));
      let target = blot.parent;
      while (target && target !== blot.scroll) {
          if (blotNameIndexMaps.size === 0)
              break;
          if (blotNameIndexMaps.has(target.statics.blotName)) {
              const index = blotNameIndexMaps.get(target.statics.blotName);
              resultBlots[index] = target;
              blotNameIndexMaps.delete(target.statics.blotName);
          }
          target = target.parent;
      }
      if (blotNameIndexMaps.size > 0) {
          throw new Error(`${blot.statics.blotName} must be a child of ${Array.from(blotNameIndexMaps.keys()).join(', ')}`);
      }
      return resultBlots;
  }
  function mixinProps(target, source) {
      for (const prop of Object.getOwnPropertyNames(source)) {
          if (/^constructor$/.test(prop))
              continue;
          Object.defineProperty(target, prop, Object.getOwnPropertyDescriptor(source, prop));
      }
      return target;
  }
  function mixinClass(base, mixins) {
      const targetClass = class extends base {
          constructor(...props) {
              super(...props);
          }
      };
      for (const source of mixins) {
          mixinProps(targetClass.prototype, source.prototype);
      }
      return targetClass;
  }
  const viewportPadding = 8;
  const limitDomInViewPort = (rect) => {
      let { left, top, width, height } = rect;
      const { clientWidth, clientHeight } = document.documentElement;
      let leftLimited = false;
      let topLimited = false;
      if (left + width > clientWidth) {
          left = clientWidth - width - viewportPadding;
          leftLimited = true;
      }
      else if (left < 0) {
          left = viewportPadding;
          leftLimited = true;
      }
      if (top + height > clientHeight) {
          top = clientHeight - height - viewportPadding;
          topLimited = true;
      }
      else if (top < 0) {
          top = viewportPadding;
          topLimited = true;
      }
      return {
          left,
          top,
          leftLimited,
          topLimited,
      };
  };
  function addScrollEvent(dom, handle) {
      dom.addEventListener('scroll', handle);
      this.scrollHandler.push([dom, handle]);
  }
  function clearScrollEvent() {
      for (let i = 0; i < this.scrollHandler.length; i++) {
          const [dom, handle] = this.scrollHandler[i];
          dom.removeEventListener('scroll', handle);
      }
      this.scrollHandler = [];
  }
  const handleIfTransitionend = (domNode, duration, handler, options) => {
      domNode.addEventListener('transitionend', handler, options);
      // handle remove when transition set none
      setTimeout(() => {
          handler();
      }, duration);
  };

  const createInputItem = (label, options) => {
      options.type || (options.type = 'text');
      options.value || (options.value = '');
      const inputItem = document.createElement('div');
      inputItem.classList.add('input__item');
      if (label) {
          const inputLabel = document.createElement('span');
          inputLabel.classList.add('input__label');
          inputLabel.textContent = label;
          inputItem.appendChild(inputLabel);
      }
      const inputInput = document.createElement('div');
      inputInput.classList.add('input__input');
      const input = document.createElement('input');
      for (const key in options) {
          input.setAttribute(key, options[key]);
      }
      if (options.max || options.min) {
          input.addEventListener('blur', () => {
              if (options.max && options.max <= Number(input.value)) {
                  input.value = String(options.max);
              }
              if (options.min && options.min >= Number(input.value)) {
                  input.value = String(options.min);
              }
          });
      }
      inputInput.appendChild(input);
      inputItem.appendChild(inputInput);
      input.addEventListener('focus', () => {
          inputInput.classList.add('focus');
      });
      input.addEventListener('blur', () => {
          inputInput.classList.remove('focus');
      });
      const errorTip = (msg) => {
          let errorTip;
          if (inputInput.classList.contains('error')) {
              errorTip = inputInput.querySelector('.input__error-tip');
          }
          else {
              errorTip = document.createElement('span');
              errorTip.classList.add('input__error-tip');
              inputInput.appendChild(errorTip);
          }
          errorTip.textContent = msg;
          inputInput.classList.add('error');
          const removeError = () => {
              inputInput.classList.remove('error');
              errorTip.remove();
          };
          return { removeError };
      };
      return { item: inputItem, input, errorTip };
  };
  let zindex = 8000;
  const createDialog = ({ child, target = document.body, beforeClose = () => { } } = {}) => {
      const appendTo = target;
      const dialog = document.createElement('div');
      dialog.classList.add('dialog');
      dialog.style.zIndex = String(zindex);
      const overlay = document.createElement('div');
      overlay.classList.add('dialog__overlay');
      dialog.appendChild(overlay);
      if (child) {
          const content = document.createElement('div');
          content.classList.add('dialog__content');
          content.appendChild(child);
          overlay.appendChild(content);
          content.addEventListener('click', (e) => {
              e.stopPropagation();
          });
      }
      const originOverflow = getComputedStyle(appendTo).overflow;
      appendTo.style.overflow = 'hidden';
      appendTo.appendChild(dialog);
      const close = () => {
          beforeClose();
          dialog.remove();
          appendTo.style.overflow = originOverflow;
      };
      dialog.addEventListener('click', close);
      zindex += 1;
      return { dialog, close };
  };
  const showTableCreator = async (options = {}) => {
      const box = document.createElement('div');
      box.classList.add('table-creator');
      const inputContent = document.createElement('div');
      inputContent.classList.add('table-creator__input');
      const { item: rowItem, input: rowInput, errorTip: rowErrorTip, } = createInputItem(options.rowText || '行数', { type: 'number', value: String(options.row || ''), max: 99 });
      const { item: colItem, input: colInput, errorTip: colErrorTip, } = createInputItem(options.colText || '列数', { type: 'number', value: String(options.col || ''), max: 99 });
      inputContent.appendChild(rowItem);
      inputContent.appendChild(colItem);
      box.appendChild(inputContent);
      const control = document.createElement('div');
      control.classList.add('table-creator__control');
      const confirmBtn = document.createElement('button');
      confirmBtn.classList.add('table-creator__btn', 'confirm');
      confirmBtn.textContent = options.confirmText || 'Confirm';
      const cancelBtn = document.createElement('button');
      cancelBtn.classList.add('table-creator__btn', 'cancel');
      cancelBtn.textContent = options.cancelText || 'Cancel';
      control.appendChild(confirmBtn);
      control.appendChild(cancelBtn);
      box.appendChild(control);
      const validateInput = (row = Number(rowInput.value), col = Number(colInput.value)) => {
          if (Number.isNaN(row) || row <= 0) {
              rowErrorTip(options.notPositiveNumberError || '请输入正整数');
              return;
          }
          if (Number.isNaN(col) || col <= 0) {
              colErrorTip(options.notPositiveNumberError || '请输入正整数');
              return;
          }
          return { row, col };
      };
      const keyboardClose = (e) => {
          if (e.key === 'Escape') {
              close();
              document.removeEventListener('keydown', keyboardClose);
          }
      };
      return new Promise((resolve, reject) => {
          const { close } = createDialog({ child: box, beforeClose: reject });
          rowInput.focus();
          for (const input of [rowInput, colInput]) {
              input.addEventListener('keydown', (e) => {
                  if (e.key === 'Enter') {
                      const result = validateInput();
                      if (result) {
                          resolve(result);
                          close();
                      }
                  }
              });
          }
          confirmBtn.addEventListener('click', async () => {
              const result = validateInput();
              if (result) {
                  resolve(result);
                  close();
              }
          });
          document.addEventListener('keydown', keyboardClose);
          cancelBtn.addEventListener('click', close);
      });
  };
  const createSelectBox = (options = {}) => {
      const selectDom = document.createElement('div');
      selectDom.classList.add('select-box');
      const selectBlock = document.createElement('div');
      selectBlock.classList.add('select-box__block');
      for (let r = 0; r < (options.row || 8); r++) {
          for (let c = 0; c < (options.col || 8); c++) {
              const selectItem = document.createElement('div');
              selectItem.classList.add('select-box__item');
              selectItem.dataset.row = String(r + 1);
              selectItem.dataset.col = String(c + 1);
              selectBlock.appendChild(selectItem);
          }
      }
      const updateSelectBlockItems = () => {
          const { row, col } = selectDom.dataset;
          for (const item of Array.from(selectBlock.querySelectorAll('.active'))) {
              item.classList.remove('active');
          }
          if (!row || !col)
              return;
          const childs = Array.from(selectBlock.children);
          for (let i = 0; i < childs.length; i++) {
              const { row: childRow, col: childCol } = childs[i].dataset;
              if (childRow > row && childCol > col) {
                  return;
              }
              if (childRow <= row && childCol <= col) {
                  childs[i].classList.add('active');
              }
              else {
                  childs[i].classList.remove('active');
              }
          }
      };
      selectBlock.addEventListener('mousemove', (e) => {
          if (!e.target)
              return;
          const { row, col } = e.target.dataset;
          if (!row || !col)
              return;
          selectDom.dataset.row = row;
          selectDom.dataset.col = col;
          updateSelectBlockItems();
      });
      selectBlock.addEventListener('mouseleave', () => {
          selectDom.removeAttribute('data-row');
          selectDom.removeAttribute('data-col');
          updateSelectBlockItems();
      });
      selectBlock.addEventListener('click', () => {
          const { row, col } = selectDom.dataset;
          if (!row || !col)
              return;
          options.onSelect && options.onSelect(Number(row), Number(col));
      });
      selectDom.appendChild(selectBlock);
      if (options.customBtn) {
          const texts = options.texts || {};
          const selectCustom = document.createElement('div');
          selectCustom.classList.add('select-box__custom');
          selectCustom.textContent = texts.customBtnText || '自定义行列数';
          selectCustom.addEventListener('click', async () => {
              const res = await showTableCreator(texts);
              if (res) {
                  options.onSelect && options.onSelect(res.row, res.col);
              }
          });
          selectDom.appendChild(selectCustom);
      }
      return selectDom;
  };
  const DISTANCE = 4;
  let tooltipContainer;
  const createTooltip = (target, options = {}) => {
      const { msg = '', delay = 150, content, direction = 'bottom' } = options;
      if (msg || content) {
          if (!tooltipContainer) {
              tooltipContainer = document.createElement('div');
              document.body.appendChild(tooltipContainer);
          }
          const tooltip = document.createElement('div');
          tooltip.classList.add('tooltip', 'hidden', 'transparent');
          if (content) {
              tooltip.appendChild(content);
          }
          else if (msg) {
              tooltip.textContent = msg;
          }
          let timer;
          let cleanup;
          const update = () => {
              if (cleanup)
                  cleanup();
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
              if (cleanup)
                  cleanup();
          };
          const open = () => {
              if (timer)
                  clearTimeout(timer);
              timer = setTimeout(() => {
                  tooltipContainer.appendChild(tooltip);
                  tooltip.removeEventListener('transitionend', transitionendHandler);
                  tooltip.classList.remove('hidden');
                  cleanup = autoUpdate(target, tooltip, update);
                  tooltip.classList.remove('transparent');
              }, delay);
          };
          const close = () => {
              if (timer)
                  clearTimeout(timer);
              timer = setTimeout(() => {
                  tooltip.classList.add('transparent');
                  handleIfTransitionend(tooltip, 150, transitionendHandler, { once: true });
              }, delay);
          };
          const eventListeners = [target, tooltip];
          for (const listener of eventListeners) {
              listener.addEventListener('mouseenter', open);
              listener.addEventListener('mouseleave', close);
          }
          const destroy = () => {
              for (const listener of eventListeners) {
                  listener.removeEventListener('mouseenter', open);
                  listener.removeEventListener('mouseleave', close);
              }
              if (cleanup)
                  cleanup();
              tooltip.remove();
          };
          return {
              destroy,
          };
      }
      return null;
  };

  const blotName = {
      container: 'table-up-container',
      tableWrapper: 'table-up',
      tableMain: 'table-up-main',
      tableColgroup: 'table-up-colgroup',
      tableCol: 'table-up-col',
      tableBody: 'table-up-body',
      tableRow: 'table-up-row',
      tableCell: 'table-up-cell',
      tableCellInner: 'table-up-cell-inner',
  };
  const tableUpSize = {
      colMinWidthPre: 5,
      colMinWidthPx: 26,
      rowMinHeightPx: 36,
  };
  const tableUpEvent = {
      AFTER_TABLE_RESIZE: 'after-table-resize',
  };
  const defaultColorMap = [
      [
          'rgb(255, 255, 255)',
          'rgb(0, 0, 0)',
          'rgb(72, 83, 104)',
          'rgb(41, 114, 244)',
          'rgb(0, 163, 245)',
          'rgb(49, 155, 98)',
          'rgb(222, 60, 54)',
          'rgb(248, 136, 37)',
          'rgb(245, 196, 0)',
          'rgb(153, 56, 215)',
      ],
      [
          'rgb(242, 242, 242)',
          'rgb(127, 127, 127)',
          'rgb(243, 245, 247)',
          'rgb(229, 239, 255)',
          'rgb(229, 246, 255)',
          'rgb(234, 250, 241)',
          'rgb(254, 233, 232)',
          'rgb(254, 243, 235)',
          'rgb(254, 249, 227)',
          'rgb(253, 235, 255)',
      ],
      [
          'rgb(216, 216, 216)',
          'rgb(89, 89, 89)',
          'rgb(197, 202, 211)',
          'rgb(199, 220, 255)',
          'rgb(199, 236, 255)',
          'rgb(195, 234, 213)',
          'rgb(255, 201, 199)',
          'rgb(255, 220, 196)',
          'rgb(255, 238, 173)',
          'rgb(242, 199, 255)',
      ],
      [
          'rgb(191, 191, 191)',
          'rgb(63, 63, 63)',
          'rgb(128, 139, 158)',
          'rgb(153, 190, 255)',
          'rgb(153, 221, 255)',
          'rgb(152, 215, 182)',
          'rgb(255, 156, 153)',
          'rgb(255, 186, 132)',
          'rgb(255, 226, 112)',
          'rgb(213, 142, 255)',
      ],
      [
          'rgb(165, 165, 165)',
          'rgb(38, 38, 38)',
          'rgb(53, 59, 69)',
          'rgb(20, 80, 184)',
          'rgb(18, 116, 165)',
          'rgb(39, 124, 79)',
          'rgb(158, 30, 26)',
          'rgb(184, 96, 20)',
          'rgb(163, 130, 0)',
          'rgb(94, 34, 129)',
      ],
      [
          'rgb(147, 147, 147)',
          'rgb(13, 13, 13)',
          'rgb(36, 39, 46)',
          'rgb(12, 48, 110)',
          'rgb(10, 65, 92)',
          'rgb(24, 78, 50)',
          'rgb(88, 17, 14)',
          'rgb(92, 48, 10)',
          'rgb(102, 82, 0)',
          'rgb(59, 21, 81)',
      ],
  ];

  const Parchment$2 = Quill.import('parchment');
  const Container = Quill.import('blots/container');
  const Block$2 = Quill.import('blots/block');
  const BlockEmbed$2 = Quill.import('blots/block/embed');
  class ContainerFormat extends Container {
      static tagName;
      static blotName = blotName.container;
      static scope = Parchment$2.Scope.BLOCK_BLOT;
      static allowedChildren = [Block$2, BlockEmbed$2, Container];
      static requiredContainer;
      static defaultChild;
      static create(_value) {
          const node = document.createElement(this.tagName);
          if (this.className) {
              node.classList.add(this.className);
          }
          return node;
      }
      insertAt(index, value, def) {
          const [child] = this.children.find(index);
          if (!child) {
              const defaultChild = this.scroll.create(this.statics.defaultChild.blotName || 'block');
              this.appendChild(defaultChild);
          }
          super.insertAt(index, value, def);
      }
      optimize(_context) {
          if (this.children.length === 0) {
              if (this.statics.defaultChild != null) {
                  const child = this.scroll.create(this.statics.defaultChild.blotName);
                  this.appendChild(child);
              }
              else {
                  this.remove();
              }
          }
          if (this.children.length > 0 && this.next != null && this.checkMerge()) {
              this.next.moveChildren(this);
              this.next.remove();
          }
      }
  }

  const Parchment$1 = Quill.import('parchment');
  const Block$1 = Quill.import('blots/block');
  class BlockOverride extends Block$1 {
      replaceWith(name, value) {
          const replacement = typeof name === 'string' ? this.scroll.create(name, value) : name;
          if (replacement instanceof Parchment$1.ParentBlot) {
              // replace block to TableCellInner length is 0 when setContents
              // that will set text direct in TableCellInner but not in block
              // so we need to set text in block and block in TableCellInner
              // wrap with TableCellInner.formatAt when length is 0 will create a new block
              // that can make sure TableCellInner struct correctly
              if (replacement.statics.blotName === blotName.tableCellInner) {
                  const selfParent = this.parent;
                  if (selfParent.statics.blotName === blotName.tableCellInner) {
                      if (selfParent != null) {
                          selfParent.insertBefore(replacement, this.prev ? null : this.next);
                      }
                      if (this.parent.statics.blotName === blotName.tableCellInner && this.prev) {
                          let block = this;
                          while (block) {
                              const next = block.next;
                              replacement.appendChild(block);
                              block = next;
                          }
                      }
                      else {
                          replacement.appendChild(this);
                      }
                      // remove empty cell. tableCellFormat.optimize need col to compute
                      if (selfParent && selfParent.length() === 0) {
                          selfParent.parent.remove();
                          const selfRow = selfParent.parent.parent;
                          if (selfRow.statics.blotName === blotName.tableRow && selfRow.children.length === 0) {
                              selfRow.remove();
                          }
                      }
                  }
                  else {
                      if (selfParent != null) {
                          selfParent.insertBefore(replacement, this.next);
                      }
                      replacement.appendChild(this);
                  }
                  return replacement;
              }
              else {
                  this.moveChildren(replacement);
              }
          }
          if (this.parent != null) {
              this.parent.insertBefore(replacement, this.next || undefined);
              this.remove();
          }
          this.attributes.copy(replacement);
          return replacement;
      }
      format(name, value) {
          if (name === blotName.tableCellInner && this.parent.statics.blotName === name && !value) {
              // when set tableCellInner null. not only clear current block tableCellInner block and also
              // need move td/tr after current cell out of current table. like code-block, split into two table
              const [tableCell, tableRow, tableWrapper] = findParentBlots(this, [blotName.tableCell, blotName.tableRow, blotName.tableWrapper]);
              const tableNext = tableWrapper.next;
              let tableRowNext = tableRow.next;
              let tableCellNext = tableCell.next;
              // clear cur block
              tableWrapper.parent.insertBefore(this, tableNext);
              // only move out of table. `optimize` will generate new table
              // move table cell
              while (tableCellNext) {
                  const next = tableCellNext.next;
                  tableWrapper.parent.insertBefore(tableCellNext, tableNext);
                  tableCellNext = next;
              }
              // move table row
              while (tableRowNext) {
                  const next = tableRowNext.next;
                  tableWrapper.parent.insertBefore(tableRowNext, tableNext);
                  tableRowNext = next;
              }
          }
          else {
              super.format(name, value);
          }
      }
  }

  const Blockquote = Quill.import('formats/blockquote');
  class BlockquoteOverride extends mixinClass(Blockquote, [BlockOverride]) {
  }

  const CodeBlock = Quill.import('formats/code-block');
  class CodeBlockOverride extends mixinClass(CodeBlock, [BlockOverride]) {
  }

  const Header = Quill.import('formats/header');
  class HeaderOverride extends mixinClass(Header, [BlockOverride]) {
  }

  const ListItem = Quill.import('formats/list');
  class ListItemOverride extends mixinClass(ListItem, [BlockOverride]) {
      static register() { }
  }

  const Parchment = Quill.import('parchment');
  const ScrollBlot = Quill.import('blots/scroll');
  class ScrollOverride extends ScrollBlot {
      createBlock(attributes, refBlot) {
          let createBlotName;
          let formats = {};
          // if attributes have not only one block blot. will save last. that will conflict with list/header in tableCellInner
          for (const [key, value] of Object.entries(attributes)) {
              const isBlockBlot = this.query(key, Parchment.Scope.BLOCK & Parchment.Scope.BLOT) != null;
              if (isBlockBlot) {
                  createBlotName = key;
              }
              else {
                  formats[key] = value;
              }
          }
          // only add this judgement to merge block blot at table cell
          if (createBlotName === blotName.tableCellInner) {
              formats = { ...attributes };
              delete formats[createBlotName];
          }
          const block = this.create(createBlotName || this.statics.defaultChild.blotName, createBlotName ? attributes[createBlotName] : undefined);
          this.insertBefore(block, refBlot || undefined);
          const length = block.length();
          for (const [key, value] of Object.entries(formats)) {
              block.formatAt(0, length, key, value);
          }
          return block;
      }
  }

  const Block = Quill.import('blots/block');
  const BlockEmbed$1 = Quill.import('blots/block/embed');
  const allowAttrs = ['table-id', 'row-id', 'col-id', 'rowspan', 'colspan', 'background-color', 'border-color', 'height'];
  class TableCellInnerFormat extends ContainerFormat {
      static blotName = blotName.tableCellInner;
      static tagName = 'div';
      static className = 'ql-table-cell-inner';
      static defaultChild = Block;
      static create(value) {
          const { tableId, rowId, colId, rowspan, colspan, backgroundColor, borderColor, height } = value;
          const node = super.create();
          node.dataset.tableId = tableId;
          node.dataset.rowId = rowId;
          node.dataset.colId = colId;
          node.dataset.rowspan = String(rowspan || 1);
          node.dataset.colspan = String(colspan || 1);
          height && (node.dataset.height = height);
          backgroundColor && (node.dataset.backgroundColor = backgroundColor);
          borderColor && (node.dataset.borderColor = borderColor);
          return node;
      }
      static formats(domNode) {
          const { tableId, rowId, colId, rowspan, colspan, backgroundColor, borderColor, height } = domNode.dataset;
          const value = {
              tableId,
              rowId,
              colId,
              rowspan: Number(rowspan),
              colspan: Number(colspan),
          };
          height && (value.height = height);
          backgroundColor && (value.backgroundColor = backgroundColor);
          borderColor && (value.borderColor = borderColor);
          return value;
      }
      allowDataAttrs = new Set(allowAttrs);
      setFormatValue(name, value) {
          if (!this.allowDataAttrs.has(name))
              return;
          const attrName = `data-${name}`;
          if (value) {
              this.domNode.setAttribute(attrName, value);
          }
          else {
              this.domNode.removeAttribute(attrName);
          }
          if (this.parent) {
              this.parent.setFormatValue(name, value);
          }
          const blocks = this.descendants(Block, 0);
          for (const child of blocks) {
              child.cache = {};
          }
      }
      get tableId() {
          return this.domNode.dataset.tableId;
      }
      get rowId() {
          return this.domNode.dataset.rowId;
      }
      set rowId(value) {
          this.setFormatValue('row-id', value);
      }
      get colId() {
          return this.domNode.dataset.colId;
      }
      set colId(value) {
          this.setFormatValue('col-id', value);
      }
      get rowspan() {
          return Number(this.domNode.dataset.rowspan);
      }
      set rowspan(value) {
          this.setFormatValue('rowspan', value);
      }
      get colspan() {
          return Number(this.domNode.dataset.colspan);
      }
      set colspan(value) {
          this.setFormatValue('colspan', value);
      }
      get backgroundColor() {
          return this.domNode.dataset.backgroundColor || '';
      }
      set backgroundColor(value) {
          this.setFormatValue('background-color', value);
      }
      get height() {
          return this.domNode.dataset.height || '';
      }
      set height(value) {
          this.setFormatValue('height', value);
      }
      get borderColor() {
          return this.domNode.dataset.borderColor || '';
      }
      getColumnIndex() {
          const table = findParentBlot(this, blotName.tableMain);
          return table.getColIds().indexOf(this.colId);
      }
      formatAt(index, length, name, value) {
          if (this.children.length === 0) {
              this.appendChild(this.scroll.create(this.statics.defaultChild.blotName));
              // block min length is 1
              length += 1;
          }
          super.formatAt(index, length, name, value);
      }
      formats() {
          const value = TableCellInnerFormat.formats(this.domNode);
          return {
              [this.statics.blotName]: value,
          };
      }
      checkMerge() {
          const { colId, rowId, colspan, rowspan } = this;
          const next = this.next;
          return (next !== null
              && next.statics.blotName === this.statics.blotName
              && next.rowId === rowId
              && next.colId === colId
              && next.colspan === colspan
              && next.rowspan === rowspan);
      }
      optimize() {
          const parent = this.parent;
          const blotValue = TableCellInnerFormat.formats(this.domNode);
          // handle BlockEmbed to insert tableCellInner when setContents
          if (this.prev && this.prev instanceof BlockEmbed$1) {
              const afterBlock = this.scroll.create('block');
              this.appendChild(this.prev);
              this.appendChild(afterBlock);
          }
          if (parent !== null && parent.statics.blotName !== blotName.tableCell) {
              this.wrap(blotName.tableCell, blotValue);
              // when insert delta like: [ { attributes: { 'table-up-cell-inner': { ... } }, insert: '\n' }, { attributes: { 'table-up-cell-inner': { ... } }, insert: '\n' }, ...]
              // that delta will create dom like: <td><div></div></td>... . that means TableCellInner will be an empty cell without 'block'
              // in this case, a 'block' should to inserted to makesure that the cell will not be remove
              if (this.children.length === 0) {
                  const child = this.scroll.create(this.statics.defaultChild.blotName);
                  this.appendChild(child);
              }
          }
          if (this.children.length > 0 && this.next != null && this.checkMerge()) {
              this.next.moveChildren(this);
              this.next.remove();
          }
          // TODO: uiNode not test, maybe have bug
          if (this.uiNode != null && this.uiNode !== this.domNode.firstChild) {
              this.domNode.insertBefore(this.uiNode, this.domNode.firstChild);
          }
          // this is necessary when redo or undo. else will delete or insert wrong index
          if (this.children.length === 0) {
              // if cellInner doesn't have child then remove it. not insert a block
              this.remove();
          }
      }
      insertBefore(blot, ref) {
          if (blot.statics.blotName === this.statics.blotName) {
              const cellInnerBlot = blot;
              const cellInnerBlotValue = TableCellInnerFormat.formats(cellInnerBlot.domNode);
              const selfValue = TableCellInnerFormat.formats(this.domNode);
              const isSame = Object.entries(selfValue).every(([key, value]) => value === cellInnerBlotValue[key]);
              if (!isSame) {
                  const [selfRow, selfCell] = findParentBlots(this, [blotName.tableRow, blotName.tableCell]);
                  // split current cellInner
                  if (ref) {
                      const index = ref.offset();
                      const length = this.length();
                      if (index + 1 < length) {
                          const newCellInner = this.scroll.create(blotName.tableCellInner, selfValue);
                          this.children.forEachAt(index + 1, this.length(), (block) => {
                              newCellInner.appendChild(block);
                          });
                          selfRow.insertBefore(newCellInner.wrap(blotName.tableCell, selfValue), selfCell.next);
                          if (this.children.length === 0) {
                              this.remove();
                              if (this.parent.children.length === 0) {
                                  this.parent.remove();
                              }
                          }
                      }
                  }
                  // different rowId. split current row. move lines which after ref to next row
                  if (this.rowId !== cellInnerBlot.rowId) {
                      if (ref) {
                          const index = ref.offset(selfRow);
                          selfRow.split(index);
                      }
                      else if (selfCell.next) {
                          const index = selfCell.next.offset(selfRow);
                          selfRow.split(index);
                      }
                      const row = this.scroll.create(blotName.tableRow, cellInnerBlotValue);
                      const cell = this.scroll.create(blotName.tableCell, cellInnerBlotValue);
                      cell.appendChild(cellInnerBlot);
                      row.appendChild(cell);
                      return selfRow.parent.insertBefore(row, selfRow.next);
                  }
                  return selfRow.insertBefore(cellInnerBlot.wrap(blotName.tableCell, cellInnerBlotValue), ref ? selfCell : selfCell.next);
              }
              else {
                  return this.parent.insertBefore(cellInnerBlot, this.next);
              }
          }
          super.insertBefore(blot, ref);
      }
  }

  class TableRowFormat extends ContainerFormat {
      static blotName = blotName.tableRow;
      static tagName = 'tr';
      static className = 'ql-table-row';
      static create(value) {
          const node = super.create();
          node.dataset.tableId = value.tableId;
          node.dataset.rowId = value.rowId;
          return node;
      }
      get rowId() {
          return this.domNode.dataset.rowId;
      }
      get tableId() {
          return this.domNode.dataset.tableId;
      }
      setHeight(value) {
          this.foreachCellInner((cellInner) => {
              cellInner.height = value;
          });
      }
      // insert cell at index
      // return the minus skip column number
      // [2, 3]. means next line should skip 2 columns. next next line skip 3 columns
      insertCell(targetIndex, value) {
          const skip = [];
          const next = this.children.iterator();
          let index = 0;
          let cur;
          while ((cur = next())) {
              index += cur.colspan;
              if (index > targetIndex)
                  break;
              if (cur.rowspan !== 1) {
                  for (let i = 0; i < cur.rowspan - 1; i++) {
                      skip[i] = (skip[i] || 0) + cur.colspan;
                  }
              }
          }
          if (cur && index - cur.colspan < targetIndex) {
              const tableCell = cur.getCellInner();
              tableCell.colspan += 1;
              if (cur.rowspan !== 1) {
                  skip.skipRowNum = cur.rowspan - 1;
              }
          }
          else {
              const tableCell = this.scroll.create(blotName.tableCell, value);
              const tableCellInner = this.scroll.create(blotName.tableCellInner, value);
              const block = this.scroll.create('block');
              block.appendChild(this.scroll.create('break'));
              tableCellInner.appendChild(block);
              tableCell.appendChild(tableCellInner);
              this.insertBefore(tableCell, cur);
          }
          return skip;
      }
      getCellByColumIndex(stopIndex) {
          const skip = [];
          let cur = null;
          let cellEndIndex = 0;
          if (stopIndex < 0)
              return [cur, cellEndIndex, skip];
          const next = this.children.iterator();
          while ((cur = next())) {
              cellEndIndex += cur.colspan;
              if (cur.rowspan !== 1) {
                  for (let i = 0; i < cur.rowspan - 1; i++) {
                      skip[i] = (skip[i] || 0) + cur.colspan;
                  }
              }
              if (cellEndIndex > stopIndex)
                  break;
          }
          return [cur, cellEndIndex, skip];
      }
      removeCell(targetIndex) {
          if (targetIndex < 0)
              return [];
          const columnIndexData = this.getCellByColumIndex(targetIndex);
          const [cur, index] = columnIndexData;
          const skip = columnIndexData[2];
          if (!cur)
              return skip;
          if (index - cur.colspan < targetIndex || cur.colspan > 1) {
              const [tableCell] = cur.descendants(TableCellInnerFormat);
              if (cur.colspan !== 1 && targetIndex === index - cur.colspan) {
                  // if delete index is cell start index. update cell colId to next colId
                  const tableBlot = findParentBlot(this, blotName.tableMain);
                  const colIds = tableBlot.getColIds();
                  tableCell.colId = colIds[colIds.indexOf(tableCell.colId) + 1];
              }
              if (cur.rowspan !== 1) {
                  skip.skipRowNum = cur.rowspan - 1;
              }
              tableCell.colspan -= 1;
          }
          else {
              cur.remove();
          }
          return skip;
      }
      foreachCellInner(func) {
          const next = this.children.iterator();
          let i = 0;
          let cur;
          while ((cur = next())) {
              const [tableCell] = cur.descendants(TableCellInnerFormat);
              if (func(tableCell, i++))
                  break;
          }
      }
      checkMerge() {
          const next = this.next;
          return (next !== null
              && next.statics.blotName === this.statics.blotName
              && next.rowId === this.rowId);
      }
      optimize(context) {
          const parent = this.parent;
          const { tableId } = this;
          if (parent !== null && parent.statics.blotName !== blotName.tableBody) {
              this.wrap(blotName.tableBody, tableId);
          }
          super.optimize(context);
      }
  }

  class TableBodyFormat extends ContainerFormat {
      static blotName = blotName.tableBody;
      static tagName = 'tbody';
      static create(value) {
          const node = super.create();
          node.dataset.tableId = value;
          return node;
      }
      get tableId() {
          return this.domNode.dataset.tableId;
      }
      // insert row at index
      insertRow(targetIndex) {
          const tableBlot = findParentBlot(this, blotName.tableMain);
          if (!tableBlot)
              return;
          // get all column id. exclude the columns of the target index row with rowspan
          const colIds = tableBlot.getColIds();
          const rows = this.descendants(TableRowFormat);
          const insertColIds = new Set(colIds);
          let index = 0;
          for (const row of rows) {
              if (index === targetIndex)
                  break;
              row.foreachCellInner((cell) => {
                  if (index + cell.rowspan > targetIndex) {
                      cell.rowspan += 1;
                      insertColIds.delete(cell.colId);
                      // colspan cell need remove all includes colId
                      if (cell.colspan !== 1) {
                          const colIndex = colIds.indexOf(cell.colId);
                          for (let i = 0; i < cell.colspan - 1; i++) {
                              insertColIds.delete(colIds[colIndex + i + 1]);
                          }
                      }
                  }
              });
              index += 1;
          }
          // append new row
          const tableId = tableBlot.tableId;
          const rowId = randomId();
          const tableRow = this.scroll.create(blotName.tableRow, {
              tableId,
              rowId,
          });
          for (const colId of insertColIds) {
              const breakBlot = this.scroll.create('break');
              const block = breakBlot.wrap('block');
              const tableCellInner = block.wrap(blotName.tableCellInner, {
                  tableId,
                  rowId,
                  colId,
                  rowspan: 1,
                  colspan: 1,
              });
              const tableCell = tableCellInner.wrap(blotName.tableCell, {
                  tableId,
                  rowId,
                  colId,
                  rowspan: 1,
                  colspan: 1,
              });
              tableRow.appendChild(tableCell);
          }
          this.insertBefore(tableRow, rows[targetIndex] || null);
      }
      checkMerge() {
          const next = this.next;
          return (next !== null
              && next.statics.blotName === this.statics.blotName
              && next.tableId === this.tableId);
      }
      optimize(context) {
          const parent = this.parent;
          if (parent !== null && parent.statics.blotName !== blotName.tableMain) {
              const { tableId } = this;
              this.wrap(blotName.tableMain, { tableId });
          }
          super.optimize(context);
      }
  }

  class TableCellFormat extends ContainerFormat {
      static blotName = blotName.tableCell;
      static tagName = 'td';
      static className = 'ql-table-cell';
      static create(value) {
          const { tableId, rowId, colId, rowspan, colspan, backgroundColor, borderColor, height } = value;
          const node = super.create();
          node.dataset.tableId = tableId;
          node.dataset.rowId = rowId;
          node.dataset.colId = colId;
          node.setAttribute('rowspan', String(rowspan || 1));
          node.setAttribute('colspan', String(colspan || 1));
          height && (node.style.height = height);
          backgroundColor && (node.style.backgroundColor = backgroundColor);
          borderColor && (node.style.borderColor = borderColor);
          return node;
      }
      static formats(domNode) {
          const { tableId, rowId, colId } = domNode.dataset;
          const rowspan = Number(domNode.getAttribute('rowspan'));
          const colspan = Number(domNode.getAttribute('colspan'));
          const value = {
              tableId,
              rowId,
              colId,
              rowspan,
              colspan,
          };
          const { height, backgroundColor, borderColor } = domNode.style;
          height && (value.height = height);
          backgroundColor && (value.backgroundColor = backgroundColor);
          borderColor && (value.borderColor = borderColor);
          return value;
      }
      allowDataAttrs = new Set(['table-id', 'row-id', 'col-id']);
      allowAttrs = new Set(['rowspan', 'colspan']);
      allowStyle = new Set(['background-color', 'border-color', 'height']);
      setFormatValue(name, value) {
          if (this.allowAttrs.has(name) || this.allowDataAttrs.has(name)) {
              let attrName = name;
              if (this.allowDataAttrs.has(name)) {
                  attrName = `data-${name}`;
              }
              if (value) {
                  this.domNode.setAttribute(attrName, value);
              }
              else {
                  this.domNode.removeAttribute(attrName);
              }
          }
          else if (this.allowStyle.has(name)) {
              Object.assign(this.domNode.style, {
                  [name]: value,
              });
          }
      }
      get tableId() {
          return this.domNode.dataset.tableId;
      }
      get rowId() {
          return this.domNode.dataset.rowId;
      }
      get colId() {
          return this.domNode.dataset.colId;
      }
      get rowspan() {
          return Number(this.domNode.getAttribute('rowspan'));
      }
      get colspan() {
          return Number(this.domNode.getAttribute('colspan'));
      }
      get backgroundColor() {
          return this.domNode.dataset.backgroundColor || '';
      }
      get height() {
          return this.domNode.style.height;
      }
      getCellInner() {
          return this.descendants(TableCellInnerFormat)[0];
      }
      checkMerge() {
          const { colId, rowId, colspan, rowspan } = this;
          const next = this.next;
          return (next !== null
              && next.statics.blotName === this.statics.blotName
              && next.rowId === rowId
              && next.colId === colId
              && next.colspan === colspan
              && next.rowspan === rowspan);
      }
      optimize(context) {
          const parent = this.parent;
          const { tableId, rowId } = this;
          if (parent !== null && parent.statics.blotName !== blotName.tableRow) {
              this.wrap(blotName.tableRow, { tableId, rowId });
          }
          super.optimize(context);
      }
  }

  const BlockEmbed = Quill.import('blots/block/embed');
  class TableColFormat extends BlockEmbed {
      scroll;
      domNode;
      static blotName = blotName.tableCol;
      static tagName = 'col';
      static create(value) {
          const { width, tableId, colId, full } = value;
          const node = super.create();
          node.setAttribute('width', `${Number.parseFloat(width)}${full ? '%' : 'px'}`);
          full && (node.dataset.full = String(full));
          node.dataset.tableId = tableId;
          node.dataset.colId = colId;
          node.setAttribute('contenteditable', 'false');
          return node;
      }
      constructor(scroll, domNode) {
          super(scroll, domNode);
          this.scroll = scroll;
          this.domNode = domNode;
      }
      get width() {
          const width = this.domNode.getAttribute('width');
          return Number.parseFloat(width);
      }
      set width(value) {
          const width = Number.parseFloat(value);
          this.domNode.setAttribute('width', `${width}${this.full ? '%' : 'px'}`);
      }
      get tableId() {
          return this.domNode.dataset.tableId;
      }
      get colId() {
          return this.domNode.dataset.colId;
      }
      get full() {
          return Object.hasOwn(this.domNode.dataset, 'full');
      }
      static value(domNode) {
          const { tableId, colId } = domNode.dataset;
          const width = domNode.getAttribute('width');
          const full = Object.hasOwn(domNode.dataset, 'full');
          const value = {
              tableId,
              colId,
              full,
          };
          width && (value.width = Number.parseFloat(width));
          return value;
      }
      checkMerge() {
          const next = this.next;
          const { tableId, colId } = this;
          return (next !== null
              && next.statics.blotName === this.statics.blotName
              && next.tableId === tableId
              && next.colId === colId);
      }
      optimize(context) {
          const parent = this.parent;
          if (parent != null && parent.statics.blotName !== blotName.tableColgroup) {
              const { tableId, full } = this;
              this.wrap(blotName.tableColgroup, { tableId, full });
          }
          super.optimize(context);
      }
      insertAt(index, value, def) {
          if (def != null) {
              super.insertAt(index, value, def);
              return;
          }
          const lines = value.split('\n');
          const text = lines.pop();
          const blocks = lines.map((line) => {
              const block = this.scroll.create('block');
              block.insertAt(0, line);
              return block;
          });
          const ref = this.split(index);
          const [tableColgroupBlot, tableMainBlot] = findParentBlots(this, [blotName.tableColgroup, blotName.tableMain]);
          const tableBodyBlot = tableColgroupBlot.next;
          if (ref) {
              const index = ref.offset(tableColgroupBlot);
              tableColgroupBlot.split(index);
          }
          // create tbody
          let insertBlot = tableMainBlot.parent.parent;
          let nextBlotRef = tableMainBlot.parent.next;
          if (tableBodyBlot) {
              const cellInners = tableBodyBlot.descendants(TableCellInnerFormat);
              if (cellInners.length > 0) {
                  const cellInnerBlot = cellInners[0];
                  const value = {
                      tableId: cellInnerBlot.tableId,
                      rowId: cellInnerBlot.rowId,
                      colId: cellInnerBlot.colId,
                      rowspan: cellInnerBlot.rowspan,
                      colspan: cellInnerBlot.colspan,
                      backgroundColor: cellInnerBlot.backgroundColor,
                      height: cellInnerBlot.height,
                  };
                  const newBlock = this.scroll.create('block');
                  const newTableCellInner = newBlock.wrap(blotName.tableCellInner, value);
                  const newTableCell = newTableCellInner.wrap(blotName.tableCell, value);
                  const newTableRow = newTableCell.wrap(blotName.tableRow, value);
                  const newTableBody = newTableRow.wrap(blotName.tableBody, value.tableId);
                  tableColgroupBlot.parent.insertBefore(newTableBody, tableColgroupBlot.next);
                  insertBlot = newBlock;
                  nextBlotRef = newBlock.next;
              }
          }
          for (const block of blocks) {
              insertBlot.insertBefore(block, nextBlotRef);
          }
          if (text) {
              insertBlot.insertBefore(this.scroll.create('text', text), nextBlotRef);
          }
      }
  }

  class TableMainFormat extends ContainerFormat {
      static blotName = blotName.tableMain;
      static tagName = 'table';
      static create(value) {
          const node = super.create();
          const { tableId, full } = value;
          node.dataset.tableId = tableId;
          full && (node.dataset.full = String(full));
          node.classList.add('ql-table');
          node.setAttribute('cellpadding', '0');
          node.setAttribute('cellspacing', '0');
          return node;
      }
      colWidthFillTable() {
          if (this.full)
              return;
          const cols = this.getCols();
          if (!cols)
              return;
          const colsWidth = cols.reduce((sum, col) => col.width + sum, 0);
          if (colsWidth === 0 || Number.isNaN(colsWidth))
              return null;
          this.domNode.style.width = `${colsWidth}px`;
          return colsWidth;
      }
      get tableId() {
          return this.domNode.dataset.tableId;
      }
      get full() {
          return Object.hasOwn(this.domNode.dataset, 'full');
      }
      set full(value) {
          this.domNode[value ? 'setAttribute' : 'removeAttribute']('data-full', '');
      }
      getRows() {
          return this.descendants(TableRowFormat);
      }
      getRowIds() {
          return this.getRows().map(d => d.rowId);
      }
      getCols() {
          return this.descendants(TableColFormat);
      }
      getColIds() {
          return this.getCols().map(d => d.colId);
      }
      checkMerge() {
          const next = this.next;
          return (next !== null
              && next.statics.blotName === this.statics.blotName
              && next.domNode.dataset.tableId === this.tableId);
      }
      optimize(context) {
          const parent = this.parent;
          if (parent !== null && parent.statics.blotName !== blotName.tableWrapper) {
              this.wrap(blotName.tableWrapper, this.tableId);
          }
          super.optimize(context);
      }
  }

  class TableColgroupFormat extends ContainerFormat {
      static blotName = blotName.tableColgroup;
      static tagName = 'colgroup';
      static create(value) {
          const node = super.create();
          node.dataset.tableId = value.tableId;
          value.full && (node.dataset.full = String(value.full));
          node.setAttribute('contenteditable', 'false');
          return node;
      }
      get tableId() {
          return this.domNode.dataset.tableId;
      }
      get full() {
          return Object.hasOwn(this.domNode.dataset, 'full');
      }
      findCol(index) {
          const next = this.children.iterator();
          let i = 0;
          let cur;
          while ((cur = next())) {
              if (i === index) {
                  break;
              }
              i++;
          }
          return cur;
      }
      insertColByIndex(index, value) {
          const table = this.parent;
          if (!(table instanceof TableMainFormat)) {
              throw new TypeError('TableColgroupFormat should be child of TableFormat');
          }
          const col = this.findCol(index);
          const tableCellInner = this.scroll.create(blotName.tableCol, value);
          if (table.full) {
              // TODO: first minus column should be near by
              const next = this.children.iterator();
              let cur;
              while ((cur = next())) {
                  if (cur.width - tableCellInner.width >= tableUpSize.colMinWidthPre) {
                      cur.width -= tableCellInner.width;
                      break;
                  }
              }
          }
          this.insertBefore(tableCellInner, col);
      }
      removeColByIndex(index) {
          const table = this.parent;
          if (!(table instanceof TableMainFormat)) {
              throw new TypeError('TableColgroupFormat should be child of TableMainFormat');
          }
          const col = this.findCol(index);
          if (col) {
              if (table.full) {
                  if (col.next) {
                      col.next.width += col.width;
                  }
                  else if (col.prev) {
                      col.prev.width += col.width;
                  }
              }
              col.remove();
              table.colWidthFillTable();
          }
      }
      checkMerge() {
          const next = this.next;
          const reuslt = (next !== null
              && next.statics.blotName === this.statics.blotName
              && next.tableId === this.tableId);
          const tableMain = this.parent;
          if (reuslt && (tableMain instanceof TableMainFormat) && !tableMain.full) {
              tableMain.colWidthFillTable();
          }
          return reuslt;
      }
      optimize(context) {
          const parent = this.parent;
          if (parent != null && parent.statics.blotName !== blotName.tableMain) {
              const { tableId, full } = this;
              this.wrap(blotName.tableMain, { tableId, full });
          }
          super.optimize(context);
      }
  }

  class TableWrapperFormat extends ContainerFormat {
      static blotName = blotName.tableWrapper;
      static tagName = 'div';
      static className = 'ql-table-wrapper';
      static create(value) {
          const node = super.create();
          node.dataset.tableId = value;
          node.addEventListener('dragstart', (e) => {
              e.preventDefault();
              e.stopPropagation();
          }, true);
          // not allow drop content into table
          node.addEventListener('drop', (e) => {
              e.preventDefault();
          });
          node.addEventListener('dragover', (e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'none';
          });
          return node;
      }
      get tableId() {
          return this.domNode.dataset.tableId;
      }
      checkMerge() {
          const next = this.next;
          return (next !== null
              && next.statics.blotName === this.statics.blotName
              && next.tableId === this.tableId);
      }
      deleteAt(index, length) {
          super.deleteAt(index, length);
          const tableBodys = (this.descendants(TableBodyFormat));
          const tableColgroups = (this.descendants(TableColgroupFormat));
          if (tableBodys.length === 0 || tableColgroups.length === 0) {
              this.remove();
          }
      }
  }

  var Background = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\"><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m4 8l4-4m6 0L4 14m0 6L20 4m0 6L10 20m10-4l-4 4\"/></svg>";

  var Border = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\"><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\" d=\"m12.01 16l-.01.011M12.01 12l-.01.011M12.01 8l-.01.011M8.01 12l-.01.011M16.01 12l-.01.011M21 3.6v16.8a.6.6 0 0 1-.6.6H3.6a.6.6 0 0 1-.6-.6V3.6a.6.6 0 0 1 .6-.6h16.8a.6.6 0 0 1 .6.6\"/></svg>";

  var InsertBottom = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"M4 3h14a2 2 0 0 1 2 2v7.08a6 6 0 0 0-4.32.92H12v4h1.08c-.11.68-.11 1.35 0 2H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2m0 4v4h6V7zm8 0v4h6V7zm-8 6v4h6v-4zm11.94 5.5h2v-4h2v4h2l-3 3z\"/></svg>";

  var InsertLeft = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"M4 3h14a2 2 0 0 1 2 2v7.08a6 6 0 0 0-4.32.92H12v4h1.08c-.11.68-.11 1.35 0 2H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2m0 4v4h6V7zm8 0v4h6V7zm-8 6v4h6v-4zm14.44 2v2h4v2h-4v2l-3-3z\"/></svg>";

  var InsertRight = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"M4 3h14a2 2 0 0 1 2 2v7.08a6 6 0 0 0-4.32.92H12v4h1.08c-.11.68-.11 1.35 0 2H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2m0 4v4h6V7zm8 0v4h6V7zm-8 6v4h6v-4zm15.44 8v-2h-4v-2h4v-2l3 3z\"/></svg>";

  var InsertTop = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"M4 3h14a2 2 0 0 1 2 2v7.08a6 6 0 0 0-4.32.92H12v4h1.08c-.11.68-.11 1.35 0 2H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2m0 4v4h6V7zm8 0v4h6V7zm-8 6v4h6v-4zm17.94 4.5h-2v4h-2v-4h-2l3-3z\"/></svg>";

  var MergeCell = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"M5 10H3V4h8v2H5zm14 8h-6v2h8v-6h-2zM5 18v-4H3v6h8v-2zM21 4h-8v2h6v4h2zM8 13v2l3-3l-3-3v2H3v2zm8-2V9l-3 3l3 3v-2h5v-2z\"/></svg>";

  var RemoveColumn = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"M4 2h7a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2m0 8v4h7v-4zm0 6v4h7v-4zM4 4v4h7V4zm13.59 8L15 9.41L16.41 8L19 10.59L21.59 8L23 9.41L20.41 12L23 14.59L21.59 16L19 13.41L16.41 16L15 14.59z\"/></svg>";

  var RemoveRow = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"M9.41 13L12 15.59L14.59 13L16 14.41L13.41 17L16 19.59L14.59 21L12 18.41L9.41 21L8 19.59L10.59 17L8 14.41zM22 9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2zM4 9h4V6H4zm6 0h4V6h-4zm6 0h4V6h-4z\"/></svg>";

  var RemoveTable = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"m15.46 15.88l1.42-1.42L19 16.59l2.12-2.13l1.42 1.42L20.41 18l2.13 2.12l-1.42 1.42L19 19.41l-2.12 2.13l-1.42-1.42L17.59 18zM4 3h14a2 2 0 0 1 2 2v7.08a6 6 0 0 0-4.32.92H12v4h1.08c-.11.68-.11 1.35 0 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m0 4v4h6V7zm8 0v4h6V7zm-8 6v4h6v-4z\"/></svg>";

  var SplitCell = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"M19 14h2v6H3v-6h2v4h14zM3 4v6h2V6h14v4h2V4zm8 7v2H8v2l-3-3l3-3v2zm5 0V9l3 3l-3 3v-2h-3v-2z\"/></svg>";

  const menuColorSelectClassName = 'color-selector';
  const contextmenuClassName = 'contextmenu';
  const usedColors = new Set();
  const defaultTools = [
      {
          name: 'InsertTop',
          icon: InsertTop,
          tip: 'Insert row above',
          handle: (tableModule) => {
              tableModule.appendRow(false);
              tableModule.hideTableTools();
          },
      },
      {
          name: 'InsertRight',
          icon: InsertRight,
          tip: 'Insert column right',
          handle: (tableModule) => {
              tableModule.appendCol(true);
              tableModule.hideTableTools();
          },
      },
      {
          name: 'InsertBottom',
          icon: InsertBottom,
          tip: 'Insert row below',
          handle: (tableModule) => {
              tableModule.appendRow(true);
              tableModule.hideTableTools();
          },
      },
      {
          name: 'InsertLeft',
          icon: InsertLeft,
          tip: 'Insert column Left',
          handle: (tableModule) => {
              tableModule.appendCol(false);
              tableModule.hideTableTools();
          },
      },
      {
          name: 'break',
      },
      {
          name: 'MergeCell',
          icon: MergeCell,
          tip: 'Merge Cell',
          handle: (tableModule) => {
              tableModule.mergeCells();
              tableModule.hideTableTools();
          },
      },
      {
          name: 'SplitCell',
          icon: SplitCell,
          tip: 'Split Cell',
          handle: (tableModule) => {
              tableModule.splitCell();
              tableModule.hideTableTools();
          },
      },
      {
          name: 'break',
      },
      {
          name: 'DeleteRow',
          icon: RemoveRow,
          tip: 'Delete Row',
          handle: (tableModule) => {
              tableModule.removeRow();
              tableModule.hideTableTools();
          },
      },
      {
          name: 'DeleteColumn',
          icon: RemoveColumn,
          tip: 'Delete Column',
          handle: (tableModule) => {
              tableModule.removeCol();
              tableModule.hideTableTools();
          },
      },
      {
          name: 'DeleteTable',
          icon: RemoveTable,
          tip: 'Delete table',
          handle: (tableModule) => {
              tableModule.deleteTable();
          },
      },
      {
          name: 'break',
      },
      {
          name: 'BackgroundColor',
          icon: Background,
          isColorChoose: true,
          tip: 'Set background color',
          key: 'background-color',
          handle: (tableModule, selectedTds, color) => {
              tableModule.setCellAttrs(selectedTds, 'background-color', color);
          },
      },
      {
          name: 'BorderColor',
          icon: Border,
          isColorChoose: true,
          tip: 'Set border color',
          key: 'border-color',
          handle: (tableModule, selectedTds, color) => {
              tableModule.setCellAttrs(selectedTds, 'border-color', color);
          },
      },
  ];

  class TableMenuCommon {
      tableModule;
      quill;
      options;
      menu = null;
      updateUsedColor;
      colorItemClass = `color-${randomId()}`;
      tooltipItem = [];
      constructor(tableModule, quill, options) {
          this.tableModule = tableModule;
          this.quill = quill;
          this.options = this.resolveOptions(options);
          try {
              const storageValue = localStorage.getItem(this.options.localstorageKey) || '[]';
              let colorValue = JSON.parse(storageValue);
              if (!isArray(colorValue)) {
                  colorValue = [];
              }
              colorValue.map((c) => usedColors.add(c));
          }
          catch { }
          this.updateUsedColor = debounce((color) => {
              if (color) {
                  usedColors.add(color);
              }
              if (usedColors.size > 10) {
                  const saveColors = Array.from(usedColors).slice(-10);
                  usedColors.clear();
                  saveColors.map(v => usedColors.add(v));
              }
              localStorage.setItem(this.options.localstorageKey, JSON.stringify(Array.from(usedColors)));
              const usedColorWrappers = Array.from(document.querySelectorAll(`.${this.colorItemClass}.table-color-used`));
              for (const usedColorWrapper of usedColorWrappers) {
                  if (!usedColorWrapper)
                      continue;
                  usedColorWrapper.innerHTML = '';
                  for (const recordColor of usedColors) {
                      const colorItem = document.createElement('div');
                      colorItem.classList.add('table-color-item');
                      colorItem.style.backgroundColor = recordColor;
                      usedColorWrapper.appendChild(colorItem);
                  }
              }
          }, 1000);
      }
      resolveOptions(options) {
          const value = Object.assign({
              tipText: true,
              tipTexts: {},
              tools: defaultTools,
              localstorageKey: '__table-bg-used-color',
              defaultColorMap,
          }, options);
          value.texts = Object.assign(this.resolveTexts(options.texts), options.texts);
          return value;
      }
      ;
      resolveTexts(texts = {}) {
          return Object.assign({
              custom: 'Custom',
              clear: 'Clear',
              transparent: 'Transparent',
          }, texts);
      }
      getUsedColors() {
          return usedColors;
      }
      buildTools() {
          const toolBox = document.createElement('div');
          toolBox.classList.add('ql-table-menu');
          document.body.appendChild(toolBox);
          Object.assign(toolBox.style, { display: 'flex' });
          for (const tool of this.options.tools) {
              const { name, icon, handle, isColorChoose, key: attrKey, tip = '' } = tool;
              const item = document.createElement('span');
              item.classList.add('ql-table-menu-item');
              if (name === 'break') {
                  item.classList.add('break');
              }
              else {
                  // add icon
                  const iconDom = document.createElement('i');
                  iconDom.classList.add('icon');
                  if (isFunction(icon)) {
                      iconDom.appendChild(icon(this.tableModule));
                  }
                  else {
                      iconDom.innerHTML = icon;
                  }
                  item.appendChild(iconDom);
                  // color choose handler will trigger when the color input event
                  if (isColorChoose && attrKey) {
                      const colorSelectWrapper = this.createColorChoose({ name, icon, handle, isColorChoose, key: attrKey, tip });
                      const tooltipItem = createTooltip(item, { content: colorSelectWrapper, direction: 'top' });
                      tooltipItem && this.tooltipItem.push(tooltipItem);
                      item.classList.add(menuColorSelectClassName);
                  }
                  else {
                      isFunction(handle) && item.addEventListener('click', (e) => {
                          this.quill.focus();
                          handle(this.tableModule, this.getSelectedTds(), e);
                      }, false);
                  }
                  // add text
                  const tipText = this.options.tipTexts[name] || tip;
                  if (tipText && tip) {
                      this.createTipText(item, tipText);
                  }
              }
              toolBox.appendChild(item);
          }
          return toolBox;
      }
      ;
      createColorChoose({ handle, key }) {
          const colorSelectWrapper = document.createElement('div');
          colorSelectWrapper.classList.add('table-color-select-wrapper');
          if (this.options.defaultColorMap.length > 0) {
              const colorMap = document.createElement('div');
              colorMap.classList.add('table-color-map');
              for (const colors of this.options.defaultColorMap) {
                  const colorMapRow = document.createElement('div');
                  colorMapRow.classList.add('table-color-map-row');
                  for (const color of colors) {
                      const colorItem = document.createElement('div');
                      colorItem.classList.add('table-color-item');
                      colorItem.style.backgroundColor = color;
                      colorMapRow.appendChild(colorItem);
                  }
                  colorMap.appendChild(colorMapRow);
              }
              colorSelectWrapper.appendChild(colorMap);
          }
          const colorMapRow = document.createElement('div');
          colorMapRow.classList.add('table-color-map-row');
          Object.assign(colorMapRow.style, {
              marginTop: '4px',
          });
          const transparentColor = document.createElement('div');
          transparentColor.classList.add('table-color-transparent');
          transparentColor.textContent = this.options.texts.transparent;
          transparentColor.addEventListener('click', () => {
              handle(this.tableModule, this.getSelectedTds(), 'transparent');
          });
          const clearColor = document.createElement('div');
          clearColor.classList.add('table-color-clear');
          clearColor.textContent = this.options.texts.clear;
          clearColor.addEventListener('click', () => {
              handle(this.tableModule, this.getSelectedTds(), null);
          });
          const label = document.createElement('label');
          const customColor = document.createElement('span');
          customColor.textContent = this.options.texts.custom;
          const input = document.createElement('input');
          input.type = 'color';
          Object.assign(input.style, {
              width: 0,
              height: 0,
              padding: 0,
              border: 0,
              outline: 'none',
              opacity: 0,
          });
          input.addEventListener('input', () => {
              handle(this.tableModule, this.getSelectedTds(), input.value);
              this.updateUsedColor(input.value);
          }, false);
          label.appendChild(customColor);
          label.appendChild(input);
          label.classList.add('table-color-custom');
          colorMapRow.appendChild(transparentColor);
          colorMapRow.appendChild(clearColor);
          colorMapRow.appendChild(label);
          colorSelectWrapper.appendChild(colorMapRow);
          if (usedColors.size > 0) {
              const usedColorWrap = document.createElement('div');
              usedColorWrap.classList.add('table-color-used');
              usedColorWrap.classList.add(this.colorItemClass);
              for (const recordColor of usedColors) {
                  const colorItem = document.createElement('div');
                  colorItem.classList.add('table-color-item');
                  colorItem.style.backgroundColor = recordColor;
                  usedColorWrap.appendChild(colorItem);
              }
              colorSelectWrapper.appendChild(usedColorWrap);
          }
          colorSelectWrapper.addEventListener('click', (e) => {
              const item = e.target;
              const color = item.style.backgroundColor;
              const selectedTds = this.getSelectedTds();
              if (item && color && selectedTds.length > 0) {
                  this.tableModule.setCellAttrs(selectedTds, key, color);
                  this.updateUsedColor(color);
              }
          });
          return colorSelectWrapper;
      }
      getSelectedTds() {
          return this.tableModule.tableSelection?.selectedTds || [];
      }
      createTipText(item, text) {
          const tipTextDom = createTooltip(item, { msg: text });
          tipTextDom && this.tooltipItem.push(tipTextDom);
      }
      updateTools() {
          if (!this.menu || !this.tableModule.tableSelection || !this.tableModule.tableSelection.boundary)
              return;
          Object.assign(this.menu.style, { display: 'flex' });
      }
      hideTools() {
          this.menu && Object.assign(this.menu.style, { display: 'none' });
      }
      destroy() {
          for (const tooltip of this.tooltipItem)
              tooltip.destroy();
          if (!this.menu)
              return;
          this.menu.remove();
          this.menu = null;
      }
  }

  class TableMenuContextmenu extends TableMenuCommon {
      tableModule;
      quill;
      constructor(tableModule, quill, options) {
          super(tableModule, quill, options);
          this.tableModule = tableModule;
          this.quill = quill;
          this.quill.root.addEventListener('contextmenu', this.listenContextmenu);
      }
      listenContextmenu = (e) => {
          e.preventDefault();
          const path = e.composedPath();
          if (!path || path.length <= 0)
              return;
          const tableNode = path.find(node => node.tagName && node.tagName.toUpperCase() === 'TABLE' && node.classList.contains('ql-table'));
          if (tableNode && this.tableModule.tableSelection?.selectedTds?.length) {
              if (!this.menu) {
                  this.menu = this.buildTools();
              }
              this.updateTools({ x: e.clientX, y: e.clientY });
              document.addEventListener('click', () => {
                  this.hideTools();
              }, { once: true });
          }
          else {
              this.hideTools();
          }
      };
      buildTools() {
          const menu = super.buildTools();
          menu.classList.add(contextmenuClassName);
          const items = menu.getElementsByClassName(menuColorSelectClassName);
          for (const item of Array.from(items)) {
              item.addEventListener('click', e => e.stopPropagation());
          }
          return menu;
      }
      createTipText(item, text) {
          const tipTextDom = document.createElement('span');
          tipTextDom.textContent = text;
          item.appendChild(tipTextDom);
      }
      updateTools(position) {
          if (!this.menu || !this.tableModule.tableSelection || !this.tableModule.tableSelection.boundary)
              return;
          super.updateTools();
          const style = {
              display: 'flex',
              left: 0,
              top: 0,
          };
          if (!position) {
              return this.hideTools();
          }
          const { x, y } = position;
          style.left = x;
          style.top = y;
          Object.assign(this.menu.style, {
              ...style,
              left: `${style.left + window.scrollX}px`,
              top: `${style.top + window.scrollY}px`,
          });
          // limit menu in viewport
          const menuRect = this.menu.getBoundingClientRect();
          const { left: limitLeft, top: limitTop } = limitDomInViewPort(menuRect);
          Object.assign(this.menu.style, {
              left: `${limitLeft + window.scrollX}px`,
              top: `${limitTop + window.scrollY}px`,
          });
      }
      destroy() {
          for (const tooltip of this.tooltipItem)
              tooltip.destroy();
          this.quill.root.removeEventListener('contextmenu', this.listenContextmenu);
          if (!this.menu)
              return;
          this.menu.remove();
          this.menu = null;
      }
  }

  class TableMenuSelect extends TableMenuCommon {
      tableModule;
      quill;
      constructor(tableModule, quill, options) {
          super(tableModule, quill, options);
          this.tableModule = tableModule;
          this.quill = quill;
          this.menu = this.buildTools();
      }
      updateTools() {
          if (!this.menu || !this.tableModule.tableSelection || !this.tableModule.tableSelection.boundary)
              return;
          super.updateTools();
          computePosition(this.tableModule.tableSelection.cellSelect, this.menu, {
              placement: 'bottom',
              middleware: [flip(), shift({ limiter: limitShift() }), offset(8)],
          }).then(({ x, y }) => {
              Object.assign(this.menu.style, {
                  left: `${x}px`,
                  top: `${y}px`,
              });
          });
          // const { boundary, selectedTds } = this.tableModule.tableSelection;
          // this.selectedTds = selectedTds;
          // const style: Record<string, any> = {
          //   display: 'flex',
          //   left: 0,
          //   top: 0,
          // };
          // const containerRect = this.quill.container.getBoundingClientRect();
          // style.left = containerRect.left + boundary.x + (boundary.width / 2);
          // style.top = containerRect.top + boundary.y + boundary.height;
          // style.transform = `translate(-50%, 20%)`;
          // Object.assign(this.menu.style, {
          //   ...style,
          //   left: `${style.left + window.scrollX}px`,
          //   top: `${style.top + window.scrollY}px`,
          // });
          // // limit menu in viewport
          // const menuRect = this.menu.getBoundingClientRect();
          // const { left: limitLeft, top: limitTop, leftLimited } = limitDomInViewPort(menuRect);
          // Object.assign(this.menu.style, {
          //   left: `${limitLeft + window.scrollX}px`,
          //   top: `${limitTop + window.scrollY}px`,
          //   transform: leftLimited ? `translate(0%, 20%)` : null,
          // });
      }
      destroy() {
          for (const tooltip of this.tooltipItem)
              tooltip.destroy();
          if (!this.menu)
              return;
          this.menu.remove();
          this.menu = null;
      }
  }

  class TableResizeCommon {
      quill;
      colIndex = -1;
      tableMain;
      dragging = false;
      dragColBreak = null;
      handleColMouseUpFunc = this.handleColMouseUp.bind(this);
      handleColMouseMoveFunc = this.handleColMouseMove.bind(this);
      handleColMouseDownFunc = this.handleColMouseDown.bind(this);
      rowIndex = -1;
      dragRowBreak = null;
      handleRowMouseUpFunc = this.handleRowMouseUp.bind(this);
      handleRowMouseMoveFunc = this.handleRowMouseMove.bind(this);
      handleRowMouseDownFunc = this.handleRowMouseDown.bind(this);
      constructor(quill) {
          this.quill = quill;
      }
      findCurrentColIndex(_e) {
          return -1;
      }
      colWidthChange(_i, _w, _isFull) { }
      handleColMouseUp() {
          if (!this.dragColBreak || !this.tableMain || this.colIndex === -1)
              return;
          const cols = this.tableMain.getCols();
          const w = Number.parseInt(this.dragColBreak.dataset.w);
          const isFull = this.tableMain.full;
          if (isFull) {
              let pre = (w / this.tableMain.domNode.getBoundingClientRect().width) * 100;
              const oldWidthPre = cols[this.colIndex].width;
              if (pre < oldWidthPre) {
                  // minus
                  // if not the last col. add the reduced amount to the next col
                  // if is the last col. add the reduced amount to the pre col
                  pre = Math.max(tableUpSize.colMinWidthPre, pre);
                  if (cols[this.colIndex + 1] || cols[this.colIndex - 1]) {
                      const i = cols[this.colIndex + 1] ? this.colIndex + 1 : this.colIndex - 1;
                      const changeTableCol = cols[i];
                      const resultWidth = changeTableCol.width + oldWidthPre - pre;
                      changeTableCol.width = `${resultWidth}%`;
                      this.colWidthChange(i, resultWidth, isFull);
                  }
                  else {
                      pre = 100;
                  }
                  cols[this.colIndex].width = `${pre}%`;
                  this.colWidthChange(this.colIndex, pre, isFull);
              }
              else {
                  // magnify col
                  // the last col can't magnify. control last but one minus to magnify last col
                  if (cols[this.colIndex + 1]) {
                      const totalWidthNextPre = oldWidthPre + cols[this.colIndex + 1].width;
                      pre = Math.min(totalWidthNextPre - tableUpSize.colMinWidthPre, pre);
                      cols[this.colIndex].width = `${pre}%`;
                      this.colWidthChange(this.colIndex, pre, isFull);
                      cols[this.colIndex + 1].width = `${totalWidthNextPre - pre}%`;
                      this.colWidthChange(this.colIndex + 1, totalWidthNextPre - pre, isFull);
                  }
              }
          }
          else {
              this.tableMain.domNode.style.width = `${Number.parseFloat(this.tableMain.domNode.style.width)
                - cols[this.colIndex].domNode.getBoundingClientRect().width
                + w}px`;
              cols[this.colIndex].width = `${w}px`;
              this.colWidthChange(this.colIndex, w, isFull);
          }
          document.body.removeChild(this.dragColBreak);
          this.dragColBreak = null;
          document.removeEventListener('mouseup', this.handleColMouseUpFunc);
          document.removeEventListener('mousemove', this.handleColMouseMoveFunc);
          this.dragging = false;
          this.quill.emitter.emit(tableUpEvent.AFTER_TABLE_RESIZE);
      }
      ;
      handleColMouseMove(e) {
          e.preventDefault();
          if (!this.dragColBreak || !this.tableMain || this.colIndex === -1)
              return;
          const cols = this.tableMain.getCols();
          const rect = cols[this.colIndex].domNode.getBoundingClientRect();
          const tableRect = this.tableMain.domNode.getBoundingClientRect();
          let resX = e.clientX;
          if (this.tableMain.full) {
              // max width = current col.width + next col.width
              // if current col is last. max width = current col.width
              const minWidth = (tableUpSize.colMinWidthPre / 100) * tableRect.width;
              const maxRange = resX > rect.right
                  ? cols[this.colIndex + 1]
                      ? Math.max(cols[this.colIndex + 1].domNode.getBoundingClientRect().right - minWidth, rect.left + minWidth)
                      : tableRect.right
                  : Infinity;
              const minRange = rect.x + minWidth;
              resX = Math.min(Math.max(resX, minRange), maxRange);
          }
          else {
              if (resX - rect.x < tableUpSize.colMinWidthPx) {
                  resX = rect.x + tableUpSize.colMinWidthPx;
              }
          }
          this.dragColBreak.style.left = `${resX}px`;
          this.dragColBreak.dataset.w = String(resX - rect.x);
          return {
              left: resX,
              width: resX - rect.x,
          };
      }
      ;
      handleColMouseDown(e) {
          if (e.button !== 0)
              return;
          e.preventDefault();
          if (!this.tableMain)
              return;
          // set drag init width
          const cols = this.tableMain.getCols();
          const tableMainRect = this.tableMain.domNode.getBoundingClientRect();
          const fullWidth = tableMainRect.width;
          this.colIndex = this.findCurrentColIndex(e);
          if (this.colIndex === -1)
              return;
          const colWidthAttr = cols[this.colIndex].width;
          const width = this.tableMain.full ? colWidthAttr / 100 * fullWidth : colWidthAttr;
          // if the column already smaller than min width, don't allow drag
          if (this.tableMain.full) {
              if (colWidthAttr < tableUpSize.colMinWidthPre) {
                  return;
              }
          }
          else {
              if (width < tableUpSize.colMinWidthPx) {
                  return;
              }
          }
          document.addEventListener('mouseup', this.handleColMouseUpFunc);
          document.addEventListener('mousemove', this.handleColMouseMoveFunc);
          this.dragging = true;
          const divDom = document.createElement('div');
          divDom.classList.add('ql-table-drag-line');
          divDom.classList.add('col');
          divDom.dataset.w = String(width);
          const styleValue = {
              top: tableMainRect.y,
              left: e.clientX,
              height: tableMainRect.height,
          };
          Object.assign(divDom.style, {
              top: `${styleValue.top}px`,
              left: `${styleValue.left}px`,
              height: `${styleValue.height}px`,
          });
          const appendTo = document.body;
          appendTo.appendChild(divDom);
          if (this.dragColBreak)
              appendTo.removeChild(this.dragColBreak);
          this.dragColBreak = divDom;
          return styleValue;
      }
      ;
      findCurrentRowIndex(_e) {
          return -1;
      }
      rowHeightChange(_i, _h) { }
      handleRowMouseUp() {
          if (!this.tableMain || !this.dragRowBreak || this.rowIndex === -1)
              return;
          const h = Number.parseInt(this.dragRowBreak.dataset.h);
          const rows = this.tableMain.getRows();
          rows[this.rowIndex].setHeight(`${h}px`);
          this.rowHeightChange(this.rowIndex, h);
          document.body.removeChild(this.dragRowBreak);
          this.dragRowBreak = null;
          document.removeEventListener('mouseup', this.handleRowMouseUpFunc);
          document.removeEventListener('mousemove', this.handleRowMouseMoveFunc);
          this.dragging = false;
          this.quill.emitter.emit(tableUpEvent.AFTER_TABLE_RESIZE);
      }
      handleRowMouseMove(e) {
          if (!this.tableMain || !this.dragRowBreak || this.rowIndex === -1)
              return;
          e.preventDefault();
          const rows = this.tableMain.getRows();
          const rect = rows[this.rowIndex].domNode.getBoundingClientRect();
          let resY = e.clientY;
          if (resY - rect.y < tableUpSize.rowMinHeightPx) {
              resY = rect.y + tableUpSize.rowMinHeightPx;
          }
          this.dragRowBreak.style.top = `${resY}px`;
          this.dragRowBreak.dataset.h = String(resY - rect.y);
          return {
              top: resY,
              height: resY - rect.y,
          };
      }
      handleRowMouseDown(e) {
          if (e.button !== 0)
              return;
          e.preventDefault();
          if (!this.tableMain)
              return;
          this.rowIndex = this.findCurrentRowIndex(e);
          if (this.rowIndex === -1)
              return;
          this.dragging = true;
          document.addEventListener('mouseup', this.handleRowMouseUpFunc);
          document.addEventListener('mousemove', this.handleRowMouseMoveFunc);
          const rows = this.tableMain.getRows();
          // set drag init width
          const height = rows[this.rowIndex].domNode.getBoundingClientRect().height;
          const tableMainRect = this.tableMain?.domNode.getBoundingClientRect();
          const divDom = document.createElement('div');
          divDom.classList.add('ql-table-drag-line');
          divDom.classList.add('row');
          divDom.dataset.h = String(height);
          const styleValue = {
              top: e.clientY,
              left: tableMainRect.x,
              width: tableMainRect.width,
          };
          Object.assign(divDom.style, {
              top: `${styleValue.top}px`,
              left: `${styleValue.left}px`,
              width: `${styleValue.width}px`,
          });
          const appendTo = document.body;
          appendTo.appendChild(divDom);
          if (this.dragRowBreak)
              appendTo.removeChild(this.dragRowBreak);
          this.dragRowBreak = divDom;
          return styleValue;
      }
      ;
  }

  class TableResizeBox extends TableResizeCommon {
      tableModule;
      table;
      options;
      root;
      tableMain;
      tableWrapper;
      resizeObserver;
      tableCols = [];
      tableRows = [];
      rowHeadWrapper = null;
      colHeadWrapper = null;
      scrollHandler = [];
      constructor(tableModule, table, quill, options) {
          super(quill);
          this.tableModule = tableModule;
          this.table = table;
          this.options = this.resolveOptions(options);
          this.tableMain = Quill.find(this.table);
          if (!this.tableMain)
              return;
          this.tableWrapper = this.tableMain.parent;
          if (!this.tableWrapper)
              return;
          this.root = this.tableModule.addContainer('ql-table-resizer');
          this.resizeObserver = new ResizeObserver(() => {
              this.showTool();
          });
          this.resizeObserver.observe(this.table);
      }
      resolveOptions(options) {
          return Object.assign({
              size: 12,
          }, options);
      }
      handleResizerHeader(isX, e) {
          const { clientX, clientY } = e;
          const tableRect = this.table.getBoundingClientRect();
          if (this.tableModule.tableSelection) {
              const tableSelection = this.tableModule.tableSelection;
              tableSelection.selectedTds = tableSelection.computeSelectedTds({ x: clientX, y: clientY }, { x: isX ? tableRect.right : clientX, y: isX ? clientY : tableRect.bottom });
              tableSelection.showSelection();
          }
      }
      ;
      findCurrentColIndex(e) {
          return Array.from(this.root.getElementsByClassName('ql-table-col-separator')).indexOf(e.target);
      }
      colWidthChange(i, w, isFull) {
          const tableColHeads = Array.from(this.root.getElementsByClassName('ql-table-col-header'));
          tableColHeads[i].style.width = `${w}${isFull ? '%' : 'px'}`;
      }
      handleColMouseDownFunc = function (e) {
          const value = this.handleColMouseDown(e);
          if (value) {
              Object.assign(this.dragColBreak.style, {
                  top: `${value.top - this.options.size}px`,
                  left: `${value.left}px`,
                  height: `${value.height + this.options.size}px`,
              });
          }
          return value;
      }.bind(this);
      bindColEvents() {
          const tableColHeads = Array.from(this.root.getElementsByClassName('ql-table-col-header'));
          const tableColHeadSeparators = Array.from(this.root.getElementsByClassName('ql-table-col-separator'));
          addScrollEvent.call(this, this.tableWrapper.domNode, () => {
              this.colHeadWrapper.scrollLeft = this.tableWrapper.domNode.scrollLeft;
          });
          for (const el of tableColHeads) {
              el.addEventListener('click', this.handleResizerHeader.bind(this, false));
          }
          for (const el of tableColHeadSeparators) {
              el.addEventListener('mousedown', this.handleColMouseDownFunc);
              // prevent drag
              el.addEventListener('dragstart', e => e.preventDefault());
          }
      }
      findCurrentRowIndex(e) {
          return Array.from(this.root.getElementsByClassName('ql-table-row-separator')).indexOf(e.target);
      }
      rowHeightChange(i, h) {
          const tableRowHeads = Array.from(this.root.getElementsByClassName('ql-table-row-header'));
          tableRowHeads[i].style.height = `${h}px`;
      }
      handleRowMouseDownFunc = function (e) {
          const value = this.handleRowMouseDown(e);
          if (value) {
              Object.assign(this.dragRowBreak.style, {
                  top: `${value.top}px`,
                  left: `${value.left - this.options.size}px`,
                  width: `${value.width + this.options.size}px`,
              });
          }
          return value;
      }.bind(this);
      bindRowEvents() {
          const tableRowHeads = Array.from(this.root.getElementsByClassName('ql-table-row-header'));
          const tableRowHeadSeparators = Array.from(this.root.getElementsByClassName('ql-table-row-separator'));
          addScrollEvent.call(this, this.tableWrapper.domNode, () => {
              this.rowHeadWrapper.scrollTop = this.tableWrapper.domNode.scrollTop;
          });
          for (const el of tableRowHeads) {
              el.addEventListener('click', this.handleResizerHeader.bind(this, true));
          }
          for (const el of tableRowHeadSeparators) {
              el.addEventListener('mousedown', this.handleRowMouseDownFunc);
              // prevent drag
              el.addEventListener('dragstart', e => e.preventDefault());
          }
      }
      updateRootPosition() {
          const tableWrapperRect = this.tableWrapper.domNode.getBoundingClientRect();
          const rootRect = this.quill.root.getBoundingClientRect();
          Object.assign(this.root.style, {
              top: `${tableWrapperRect.y - rootRect.y}px`,
              left: `${tableWrapperRect.x - rootRect.x}px`,
          });
      }
      showTool() {
          this.tableCols = this.tableMain.getCols();
          this.tableRows = this.tableMain.getRows();
          this.root.innerHTML = '';
          const tableWrapperRect = this.tableWrapper.domNode.getBoundingClientRect();
          const tableMainRect = this.tableMain.domNode.getBoundingClientRect();
          const rootRect = this.quill.root.getBoundingClientRect();
          Object.assign(this.root.style, {
              top: `${tableWrapperRect.y - rootRect.y}px`,
              left: `${tableWrapperRect.x - rootRect.x}px`,
          });
          if (this.tableCols.length > 0 && this.tableRows.length > 0) {
              const corner = document.createElement('div');
              corner.classList.add('ql-table-resizer-corner');
              Object.assign(corner.style, {
                  width: `${this.options.size}px`,
                  height: `${this.options.size}px`,
                  transform: `translate(-${this.options.size}px, -${this.options.size}px)`,
              });
              corner.addEventListener('click', () => {
                  const tableRect = this.table.getBoundingClientRect();
                  if (this.tableModule.tableSelection) {
                      const tableSelection = this.tableModule.tableSelection;
                      tableSelection.selectedTds = tableSelection.computeSelectedTds({ x: tableRect.x, y: tableRect.y }, { x: tableRect.right, y: tableRect.bottom });
                      tableSelection.showSelection();
                  }
              });
              this.root.appendChild(corner);
          }
          if (this.tableCols.length > 0) {
              let colHeadStr = '';
              for (const col of this.tableCols) {
                  let width = col.width + (this.tableMain.full ? '%' : 'px');
                  if (!col.width) {
                      width = `${col.domNode.getBoundingClientRect().width}px`;
                  }
                  colHeadStr += `<div class="ql-table-col-header" style="width: ${width}">
          <div class="ql-table-col-separator" style="height: ${tableMainRect.height + this.options.size - 3}px"></div>
        </div>`;
              }
              const colHeadWrapper = document.createElement('div');
              colHeadWrapper.classList.add('ql-table-resizer-col');
              const colHead = document.createElement('div');
              colHead.classList.add('ql-table-col-wrapper');
              Object.assign(colHeadWrapper.style, {
                  transform: `translateY(-${this.options.size}px)`,
                  width: `${tableWrapperRect.width}px`,
                  height: `${this.options.size}px`,
              });
              Object.assign(colHead.style, {
                  width: `${tableMainRect.width}px`,
              });
              colHead.innerHTML = colHeadStr;
              colHeadWrapper.appendChild(colHead);
              this.root.appendChild(colHeadWrapper);
              colHeadWrapper.scrollLeft = this.tableWrapper.domNode.scrollLeft;
              this.colHeadWrapper = colHeadWrapper;
              this.bindColEvents();
          }
          if (this.tableRows.length > 0) {
              let rowHeadStr = '';
              for (const row of this.tableRows) {
                  const height = `${row.domNode.getBoundingClientRect().height}px`;
                  rowHeadStr += `<div class="ql-table-row-header" style="height: ${height}">
          <div class="ql-table-row-separator" style="width: ${tableMainRect.width + this.options.size - 3}px"></div>
        </div>`;
              }
              const rowHeadWrapper = document.createElement('div');
              rowHeadWrapper.classList.add('ql-table-resizer-row');
              const rowHead = document.createElement('div');
              rowHead.classList.add('ql-table-row-wrapper');
              Object.assign(rowHeadWrapper.style, {
                  transform: `translateX(-${this.options.size}px)`,
                  width: `${this.options.size}px`,
                  height: `${tableWrapperRect.height}px`,
              });
              Object.assign(rowHead.style, {
                  height: `${tableMainRect.height}px`,
              });
              rowHead.innerHTML = rowHeadStr;
              rowHeadWrapper.appendChild(rowHead);
              this.root.appendChild(rowHeadWrapper);
              rowHeadWrapper.scrollTop = this.tableWrapper.domNode.scrollTop;
              this.rowHeadWrapper = rowHeadWrapper;
              this.bindRowEvents();
          }
          addScrollEvent.call(this, this.quill.root, () => {
              this.updateRootPosition();
          });
      }
      hideTool() {
          this.root.classList.add('ql-hidden');
      }
      destroy() {
          this.hideTool();
          clearScrollEvent.call(this);
          this.resizeObserver.disconnect();
          for (const [dom, handle] of this.scrollHandler) {
              dom.removeEventListener('scroll', handle);
          }
          this.root.remove();
      }
  }

  class TableResizeLine extends TableResizeCommon {
      tableModule;
      colResizer;
      rowResizer;
      currentTableCell;
      dragging = false;
      options;
      curColIndex = -1;
      curRowIndex = -1;
      tableCellBlot;
      constructor(tableModule, quill, options) {
          super(quill);
          this.tableModule = tableModule;
          this.options = this.resolveOptions(options);
          this.colResizer = this.tableModule.addContainer('ql-table-resize-line-col');
          this.rowResizer = this.tableModule.addContainer('ql-table-resize-line-row');
          this.quill.root.addEventListener('mousemove', (e) => {
              if (this.dragging)
                  return;
              const tableCell = this.findTableCell(e);
              if (!tableCell) {
                  return this.hideResizer();
              }
              const tableCellBlot = Quill.find(tableCell);
              if (!tableCellBlot)
                  return;
              if (this.currentTableCell !== tableCell) {
                  this.showResizer();
                  this.currentTableCell = tableCell;
                  this.tableCellBlot = tableCellBlot;
                  this.tableMain = findParentBlot(tableCellBlot, blotName.tableMain);
                  if (this.tableMain.getCols().length > 0) {
                      this.updateColResizer();
                  }
                  this.updateRowResizer();
              }
          });
          this.quill.on(Quill.events.TEXT_CHANGE, () => {
              this.hideResizer();
          });
      }
      resolveOptions(options) {
          return Object.assign({}, options);
      }
      findTableCell(e) {
          for (const el of e.composedPath()) {
              if (el instanceof HTMLElement && el.tagName === 'TD') {
                  return el;
              }
              if (el === document.body) {
                  return null;
              }
          }
          return null;
      }
      findCurrentColIndex() {
          return this.curColIndex;
      }
      handleColMouseUpFunc = function () {
          this.handleColMouseUp();
          this.updateColResizer();
      }.bind(this);
      updateColResizer() {
          if (!this.tableMain || !this.tableCellBlot)
              return;
          const tableCellBlot = this.tableCellBlot;
          this.tableModule.toolBox.removeChild(this.colResizer);
          this.colResizer = this.tableModule.addContainer('ql-table-resize-line-col');
          const [tableBodyBlot] = findParentBlots(tableCellBlot, [blotName.tableBody]);
          const tableBodyect = tableBodyBlot.domNode.getBoundingClientRect();
          const tableCellRect = tableCellBlot.domNode.getBoundingClientRect();
          const rootRect = this.quill.root.getBoundingClientRect();
          Object.assign(this.colResizer.style, {
              top: `${tableBodyect.y - rootRect.y}px`,
              left: `${tableCellRect.right - rootRect.x}px`,
              height: `${tableBodyect.height}px`,
          });
          const cols = this.tableMain.getCols();
          this.curColIndex = cols.findIndex(col => col.colId === tableCellBlot.colId);
          this.colResizer.addEventListener('mousedown', this.handleColMouseDownFunc);
          this.colResizer.addEventListener('dragstart', (e) => {
              e.preventDefault();
          });
      }
      findCurrentRowIndex() {
          return this.curRowIndex;
      }
      handleRowMouseUpFunc = function () {
          this.handleRowMouseUp();
          this.updateRowResizer();
      }.bind(this);
      updateRowResizer() {
          if (!this.tableMain || !this.tableCellBlot)
              return;
          const tableCellBlot = this.tableCellBlot;
          this.tableModule.toolBox.removeChild(this.rowResizer);
          this.rowResizer = this.tableModule.addContainer('ql-table-resize-line-row');
          const currentRow = tableCellBlot.parent;
          if (!(currentRow instanceof TableRowFormat)) {
              return;
          }
          const [tableBodyBlot] = findParentBlots(tableCellBlot, [blotName.tableBody]);
          const tableBodynRect = tableBodyBlot.domNode.getBoundingClientRect();
          const tableCellRect = tableCellBlot.domNode.getBoundingClientRect();
          const rootRect = this.quill.root.getBoundingClientRect();
          Object.assign(this.rowResizer.style, {
              top: `${tableCellRect.bottom - rootRect.y}px`,
              left: `${tableBodynRect.x - rootRect.x}px`,
              width: `${tableBodynRect.width}px`,
          });
          const rows = this.tableMain.getRows();
          this.curRowIndex = rows.indexOf(currentRow);
          this.rowResizer.addEventListener('mousedown', this.handleRowMouseDownFunc);
          this.rowResizer.addEventListener('dragstart', (e) => {
              e.preventDefault();
          });
      }
      showResizer() {
          Object.assign(this.colResizer.style, { display: null });
          Object.assign(this.rowResizer.style, { display: null });
      }
      hideResizer() {
          this.currentTableCell = undefined;
          this.rowResizer.style.display = 'none';
          this.colResizer.style.display = 'none';
      }
  }

  class Scrollbar {
      quill;
      isVertical;
      table;
      scrollbarContainer;
      minSize = 20;
      gap = 4;
      move = 0;
      cursorDown = false;
      cursorLeave = false;
      ratioY = 1;
      ratioX = 1;
      sizeWidth = '';
      sizeHeight = '';
      thumbState = {
          X: 0,
          Y: 0,
      };
      ob;
      container;
      scrollbar;
      thumb = document.createElement('div');
      scrollHandler = [];
      propertyMap;
      constructor(quill, isVertical, table, scrollbarContainer) {
          this.quill = quill;
          this.isVertical = isVertical;
          this.table = table;
          this.scrollbarContainer = scrollbarContainer;
          this.container = table.parentElement;
          this.propertyMap = this.isVertical
              ? {
                  size: 'height',
                  offset: 'offsetHeight',
                  scrollDirection: 'scrollTop',
                  scrollSize: 'scrollHeight',
                  axis: 'Y',
                  direction: 'top',
                  client: 'clientY',
              }
              : {
                  size: 'width',
                  offset: 'offsetWidth',
                  scrollDirection: 'scrollLeft',
                  scrollSize: 'scrollWidth',
                  axis: 'X',
                  direction: 'left',
                  client: 'clientX',
              };
          this.calculateSize();
          this.ob = new ResizeObserver(() => {
              this.calculateSize();
              this.setScrollbarPosition();
          });
          this.ob.observe(table);
          this.scrollbar = this.createScrollbar();
          this.setScrollbarPosition();
          addScrollEvent.call(this, this.quill.root, () => this.setScrollbarPosition());
          this.showScrollbar();
      }
      setScrollbarPosition() {
          const { scrollLeft: editorScrollX, scrollTop: editorScrollY } = this.quill.root;
          const { offsetWidth: containerOffsetWidth, offsetHeight: containerOffsetHeight, offsetLeft: containerOffsetLeft, offsetTop: containerOffsetTop } = this.container;
          const { offsetHeight: tableOffsetHeight, offsetWidth: tableOffsetWidth } = this.table;
          Object.assign(this.scrollbar.style, {
              [this.propertyMap.size]: `${this.isVertical ? containerOffsetHeight : containerOffsetWidth}px`,
              transform: `translate(${(this.isVertical
                ? Math.min(containerOffsetWidth, tableOffsetWidth) + containerOffsetLeft
                : containerOffsetLeft) - editorScrollX}px, ${(this.isVertical
                ? containerOffsetTop
                : Math.min(containerOffsetHeight, tableOffsetHeight) + containerOffsetTop) - editorScrollY}px)`,
          });
          this.containerScrollHandler(this.container);
      }
      calculateSize() {
          const offsetHeight = this.container.offsetHeight - this.gap;
          const offsetWidth = this.container.offsetWidth - this.gap;
          const originalHeight = offsetHeight ** 2 / this.container.scrollHeight;
          const originalWidth = offsetWidth ** 2 / this.container.scrollWidth;
          const height = Math.max(originalHeight, this.minSize);
          const width = Math.max(originalWidth, this.minSize);
          this.ratioY = originalHeight / (offsetHeight - originalHeight) / (height / (offsetHeight - height));
          this.ratioX = originalWidth / (offsetWidth - originalWidth) / (width / (offsetWidth - width));
          this.sizeWidth = width + this.gap < offsetWidth ? `${width}px` : '';
          this.sizeHeight = height + this.gap < offsetHeight ? `${height}px` : '';
      }
      createScrollbar() {
          const scrollbar = document.createElement('div');
          scrollbar.classList.add('ql-table-scrollbar');
          scrollbar.classList.add(this.isVertical ? 'vertical' : 'horizontal');
          Object.assign(scrollbar.style, {
              display: 'none',
          });
          this.thumb.classList.add('ql-table-scrollbar-thumb');
          // eslint-disable-next-line unicorn/consistent-function-scoping
          const mouseMoveDocumentHandler = (e) => {
              if (this.cursorDown === false)
                  return;
              const prevPage = this.thumbState[this.propertyMap.axis];
              if (!prevPage)
                  return;
              const offsetRatio = this.scrollbar[this.propertyMap.offset] ** 2
                  / this.container[this.propertyMap.scrollSize] / (this.isVertical ? this.ratioY : this.ratioX)
                  / this.thumb[this.propertyMap.offset];
              const offset = (this.scrollbar.getBoundingClientRect()[this.propertyMap.direction] - e[this.propertyMap.client]) * -1;
              const thumbClickPosition = this.thumb[this.propertyMap.offset] - prevPage;
              const thumbPositionPercentage = ((offset - thumbClickPosition) * 100 * offsetRatio) / this.scrollbar[this.propertyMap.offset];
              this.container[this.propertyMap.scrollDirection] = (thumbPositionPercentage * this.container[this.propertyMap.scrollSize]) / 100;
          };
          const mouseUpDocumentHandler = () => {
              this.thumbState[this.propertyMap.axis] = 0;
              this.cursorDown = false;
              document.removeEventListener('mousemove', mouseMoveDocumentHandler);
              document.removeEventListener('mouseup', mouseUpDocumentHandler);
              if (this.cursorLeave) {
                  this.scrollbar.style.display = 'none';
              }
          };
          const startDrag = (e) => {
              e.stopImmediatePropagation();
              this.cursorDown = true;
              document.addEventListener('mousemove', mouseMoveDocumentHandler);
              document.addEventListener('mouseup', mouseUpDocumentHandler);
              // eslint-disable-next-line unicorn/prefer-add-event-listener
              document.onselectstart = () => false;
          };
          this.thumb.addEventListener('mousedown', (e) => {
              e.stopPropagation();
              if (e.ctrlKey || [1, 2].includes(e.button))
                  return;
              window.getSelection()?.removeAllRanges();
              startDrag(e);
              const el = e.currentTarget;
              if (!el)
                  return;
              this.thumbState[this.propertyMap.axis] = el[this.propertyMap.offset] - (e[this.propertyMap.client] - el.getBoundingClientRect()[this.propertyMap.direction]);
          });
          const displayListener = [this.table, scrollbar];
          for (const el of displayListener) {
              el.addEventListener('mouseenter', this.showScrollbar);
              el.addEventListener('mouseleave', this.hideScrollbar);
          }
          addScrollEvent.call(this, this.container, () => {
              this.containerScrollHandler(this.container);
          });
          addScrollEvent.call(this, this.quill.root, () => {
              this.setScrollbarPosition();
          });
          scrollbar.appendChild(this.thumb);
          return scrollbar;
      }
      containerScrollHandler(wrap) {
          if (wrap) {
              const offset = wrap[this.propertyMap.offset] - this.gap;
              this.move = wrap[this.propertyMap.scrollDirection] * 100 / offset * (this.isVertical ? this.ratioY : this.ratioX);
              Object.assign(this.thumb.style, {
                  [this.propertyMap.size]: this.isVertical ? this.sizeHeight : this.sizeWidth,
                  transform: `translate${this.propertyMap.axis}(${this.move}%)`,
              });
          }
      }
      // eslint-disable-next-line unicorn/consistent-function-scoping
      showScrollbar = debounce(() => {
          this.cursorLeave = false;
          this.scrollbar.style.display = (this.isVertical ? this.sizeHeight : this.sizeWidth) ? 'block' : 'none';
      }, 200);
      // eslint-disable-next-line unicorn/consistent-function-scoping
      hideScrollbar = debounce(() => {
          this.cursorLeave = true;
          this.scrollbar.style.display = this.cursorDown && (this.isVertical ? this.sizeHeight : this.sizeWidth) ? 'block' : 'none';
      }, 200);
      destroy() {
          this.ob.disconnect();
          clearScrollEvent.call(this);
          this.table.removeEventListener('mouseenter', this.showScrollbar);
          this.table.removeEventListener('mouseleave', this.hideScrollbar);
      }
  }
  class TableVitrualScroll {
      tableModule;
      table;
      quill;
      scrollbarContainer;
      scrollbar;
      constructor(tableModule, table, quill) {
          this.tableModule = tableModule;
          this.table = table;
          this.quill = quill;
          this.scrollbarContainer = this.tableModule.addContainer('ql-table-scrollbar-container');
          this.scrollbar = [
              new Scrollbar(quill, true, table, this.scrollbarContainer),
              new Scrollbar(quill, false, table, this.scrollbarContainer),
          ];
          for (const item of this.scrollbar) {
              this.scrollbarContainer.appendChild(item.scrollbar);
          }
      }
      destroy() {
          this.scrollbarContainer.remove();
          for (const scrollbar of this.scrollbar) {
              scrollbar.destroy();
          }
          return null;
      }
  }

  const ERROR_LIMIT = 2;
  class TableSelection {
      tableModule;
      table;
      quill;
      options;
      boundary = null;
      startScrollX = 0;
      startScrollY = 0;
      selectedTableScrollX = 0;
      selectedTableScrollY = 0;
      selectedEditorScrollX = 0;
      selectedEditorScrollY = 0;
      selectedTds = [];
      cellSelectWrap;
      cellSelect;
      dragging = false;
      scrollHandler = [];
      selectingHandler = this.mouseDownHandler.bind(this);
      tableMenu;
      constructor(tableModule, table, quill, options = {}) {
          this.tableModule = tableModule;
          this.table = table;
          this.quill = quill;
          this.options = this.resolveOptions(options);
          this.cellSelectWrap = this.tableModule.addContainer('ql-table-selection');
          this.cellSelect = this.helpLinesInitial();
          const resizeObserver = new ResizeObserver(() => this.hideSelection());
          resizeObserver.observe(this.table);
          this.quill.root.addEventListener('mousedown', this.selectingHandler, false);
          this.tableMenu = new this.options.tableMenuClass(this.tableModule, quill, this.options.tableMenu);
      }
      resolveOptions(options) {
          return Object.assign({
              selectColor: '#0589f3',
              tableMenuClass: TableMenuSelect,
              tableMenu: {},
          }, options);
      }
      ;
      helpLinesInitial() {
          const cellSelect = document.createElement('div');
          cellSelect.classList.add('ql-table-selection_line');
          Object.assign(cellSelect.style, {
              'border-color': this.options.selectColor,
          });
          this.cellSelectWrap.appendChild(cellSelect);
          return cellSelect;
      }
      computeSelectedTds(startPoint, endPoint) {
          // Use TableCell to calculation selected range, because TableCellInner is scrollable, the width will effect calculate
          const tableMain = Quill.find(this.table);
          if (!tableMain)
              return [];
          const tableCells = new Set(tableMain.descendants(TableCellFormat).map((cell, i) => {
              cell.index = i;
              return cell;
          }));
          const { x: tableScrollX, y: tableScrollY } = this.getTableViewScroll();
          const { x: editorScrollX, y: editorScrollY } = this.getQuillViewScroll();
          this.selectedTableScrollX = tableScrollX;
          this.selectedTableScrollY = tableScrollY;
          this.selectedEditorScrollX = editorScrollX;
          this.selectedEditorScrollY = editorScrollY;
          // set boundary to initially mouse move rectangle
          const tableRect = this.table.getBoundingClientRect();
          const startPointX = startPoint.x - tableScrollX + this.startScrollX;
          const startPointY = startPoint.y - tableScrollY + this.startScrollY;
          let boundary = {
              x: Math.max(tableRect.left, Math.min(endPoint.x, startPointX)),
              y: Math.max(tableRect.top, Math.min(endPoint.y, startPointY)),
              x1: Math.min(tableRect.right, Math.max(endPoint.x, startPointX)),
              y1: Math.min(tableRect.bottom, Math.max(endPoint.y, startPointY)),
          };
          const selectedCells = new Set();
          let findEnd = true;
          // loop all cells to find correct boundary
          while (findEnd) {
              findEnd = false;
              for (const cell of tableCells) {
                  if (!cell.__rect) {
                      cell.__rect = cell.domNode.getBoundingClientRect();
                  }
                  // Determine whether the cell intersects with the current boundary
                  const { x, y, right, bottom } = cell.__rect;
                  if (isRectanglesIntersect(boundary, { x, y, x1: right, y1: bottom }, ERROR_LIMIT)) {
                      // add cell to selected
                      selectedCells.add(cell);
                      tableCells.delete(cell);
                      // update boundary
                      boundary = {
                          x: Math.min(boundary.x, x),
                          y: Math.min(boundary.y, y),
                          x1: Math.max(boundary.x1, right),
                          y1: Math.max(boundary.y1, bottom),
                      };
                      // recalculate boundary last cells
                      findEnd = true;
                      break;
                  }
                  else if (x > boundary.x1 && y > boundary.y1) {
                      break;
                  }
              }
          }
          for (const cell of [...selectedCells, ...tableCells]) {
              delete cell.__rect;
          }
          // save result boundary relative to the editor
          this.boundary = getRelativeRect({
              ...boundary,
              width: boundary.x1 - boundary.x,
              height: boundary.y1 - boundary.y,
          }, this.quill.root);
          return Array.from(selectedCells).sort((a, b) => a.index - b.index).map((cell) => {
              delete cell.index;
              return cell.getCellInner();
          });
      }
      mouseDownHandler(mousedownEvent) {
          const { button, target, clientX, clientY } = mousedownEvent;
          const closestTable = target.closest('.ql-table');
          if (button !== 0 || !closestTable)
              return;
          const startTableId = closestTable.dataset.tableId;
          const startPoint = { x: clientX, y: clientY };
          const { x: tableScrollX, y: tableScrollY } = this.getTableViewScroll();
          this.startScrollX = tableScrollX;
          this.startScrollY = tableScrollY;
          this.selectedTds = this.computeSelectedTds(startPoint, startPoint);
          this.showSelection();
          this.tableMenu.hideTools();
          const mouseMoveHandler = (mousemoveEvent) => {
              const { button, target, clientX, clientY } = mousemoveEvent;
              const closestTable = target.closest('.ql-table');
              if (button !== 0
                  || !closestTable
                  || closestTable.dataset.tableId !== startTableId) {
                  return;
              }
              this.dragging = true;
              const movePoint = { x: clientX, y: clientY };
              this.selectedTds = this.computeSelectedTds(startPoint, movePoint);
              if (this.selectedTds.length > 1) {
                  this.quill.blur();
              }
              this.updateSelection();
          };
          const mouseUpHandler = () => {
              document.body.removeEventListener('mousemove', mouseMoveHandler, false);
              document.body.removeEventListener('mouseup', mouseUpHandler, false);
              this.dragging = false;
              this.tableMenu.updateTools();
          };
          document.body.addEventListener('mousemove', mouseMoveHandler, false);
          document.body.addEventListener('mouseup', mouseUpHandler, false);
      }
      updateSelection() {
          if (this.selectedTds.length === 0 || !this.boundary)
              return;
          const { x: editorScrollX, y: editorScrollY } = this.getQuillViewScroll();
          const { x: tableScrollX, y: tableScrollY } = this.getTableViewScroll();
          const tableWrapperRect = this.table.parentElement.getBoundingClientRect();
          const rootRect = this.quill.root.getBoundingClientRect();
          const wrapLeft = tableWrapperRect.x - rootRect.x;
          const wrapTop = tableWrapperRect.y - rootRect.y;
          Object.assign(this.cellSelect.style, {
              left: `${this.selectedEditorScrollX * 2 - editorScrollX + this.boundary.x + this.selectedTableScrollX - tableScrollX - wrapLeft}px`,
              top: `${this.selectedEditorScrollY * 2 - editorScrollY + this.boundary.y + this.selectedTableScrollY - tableScrollY - wrapTop}px`,
              width: `${this.boundary.width}px`,
              height: `${this.boundary.height}px`,
          });
          Object.assign(this.cellSelectWrap.style, {
              left: `${wrapLeft}px`,
              top: `${wrapTop}px`,
              width: `${tableWrapperRect.width + 2}px`,
              height: `${tableWrapperRect.height + 2}px`,
          });
          if (!this.dragging) {
              this.tableMenu.updateTools();
          }
      }
      getQuillViewScroll() {
          return {
              x: this.quill.root.scrollLeft,
              y: this.quill.root.scrollTop,
          };
      }
      getTableViewScroll() {
          return {
              x: this.table.parentElement.scrollLeft,
              y: this.table.parentElement.scrollTop,
          };
      }
      showSelection() {
          clearScrollEvent.call(this);
          Object.assign(this.cellSelectWrap.style, { display: 'block' });
          this.updateSelection();
          addScrollEvent.call(this, this.quill.root, () => {
              this.updateSelection();
          });
          addScrollEvent.call(this, this.table.parentElement, () => {
              this.updateSelection();
          });
      }
      hideSelection() {
          this.boundary = null;
          this.selectedTds = [];
          this.cellSelectWrap && Object.assign(this.cellSelectWrap.style, { display: 'none' });
          this.tableMenu.hideTools();
          clearScrollEvent.call(this);
      }
      destroy() {
          this.hideSelection();
          this.tableMenu.destroy();
          this.cellSelectWrap.remove();
          clearScrollEvent.call(this);
          this.quill.root.removeEventListener('mousedown', this.selectingHandler, false);
          return null;
      }
  }
  function isRectanglesIntersect(a, b, tolerance = 4) {
      const { x: minAx, y: minAy, x1: maxAx, y1: maxAy } = a;
      const { x: minBx, y: minBy, x1: maxBx, y1: maxBy } = b;
      const notOverlapX = maxAx <= minBx + tolerance || minAx + tolerance >= maxBx;
      const notOverlapY = maxAy <= minBy + tolerance || minAy + tolerance >= maxBy;
      return !(notOverlapX || notOverlapY);
  }
  function getRelativeRect(targetRect, container) {
      const containerRect = container.getBoundingClientRect();
      return {
          x: targetRect.x - containerRect.x - container.scrollLeft,
          y: targetRect.y - containerRect.y - container.scrollTop,
          x1: targetRect.x - containerRect.x - container.scrollLeft + targetRect.width,
          y1: targetRect.y - containerRect.y - container.scrollTop + targetRect.height,
          width: targetRect.width,
          height: targetRect.height,
      };
  }

  const Delta = Quill.import('delta');
  const Break = Quill.import('blots/break');
  const icons = Quill.import('ui/icons');
  const createCell = (scroll, { tableId, rowId, colId }) => {
      const value = {
          tableId,
          rowId,
          colId,
          colspan: 1,
          rowspan: 1,
      };
      const tableCell = scroll.create(blotName.tableCell, value);
      const tableCellInner = scroll.create(blotName.tableCellInner, value);
      const block = scroll.create('block');
      block.appendChild(scroll.create('break'));
      tableCellInner.appendChild(block);
      tableCell.appendChild(tableCellInner);
      return tableCell;
  };
  // Blots that cannot be inserted into a table
  const tableCantInsert = [blotName.tableCell];
  const isForbidInTableBlot = (blot) => tableCantInsert.includes(blot.statics.blotName);
  const isForbidInTable = (current) => current && current.parent
      ? isForbidInTableBlot(current.parent)
          ? true
          : isForbidInTable(current.parent)
      : false;
  class TableUp {
      static moduleName = 'tableUp';
      static toolName = blotName.tableWrapper;
      static keyboradHandler = {
          'forbid remove table by backspace': {
              bindInHead: true,
              key: 'Backspace',
              collapsed: true,
              offset: 0,
              handler(range, context) {
                  const line = this.quill.getLine(range.index);
                  const blot = line[0];
                  if (blot.prev instanceof TableWrapperFormat) {
                      blot.prev.remove();
                      return true;
                  }
                  if (context.format[blotName.tableCellInner]) {
                      const offset = blot.offset(findParentBlot(blot, blotName.tableCellInner));
                      if (offset === 0) {
                          return false;
                      }
                  }
                  return true;
              },
          },
          'forbid remove table by delete': {
              bindInHead: true,
              key: 'Delete',
              collapsed: true,
              handler(range, context) {
                  const line = this.quill.getLine(range.index);
                  const blot = line[0];
                  const offsetInline = line[1];
                  if ((blot.next instanceof TableWrapperFormat || blot.next instanceof TableColFormat) && offsetInline === blot.length() - 1)
                      return false;
                  if (context.format[blotName.tableCellInner]) {
                      const tableInnerBlot = findParentBlot(blot, blotName.tableCellInner);
                      if (blot === tableInnerBlot.children.tail && offsetInline === blot.length() - 1) {
                          return false;
                      }
                  }
                  return true;
              },
          },
          'after table insert new line': {
              // lick 'code exit'
              bindInHead: true,
              key: 'Enter',
              collapsed: true,
              format: [blotName.tableCellInner],
              prefix: /^$/,
              suffix: /^\s*$/,
              handler(range) {
                  const [line, offset] = this.quill.getLine(range.index);
                  const format = this.quill.getFormat(range.index + offset + 1, 1);
                  // next line still in table. not exit
                  if (format[blotName.tableCellInner]) {
                      return true;
                  }
                  // if have tow empty lines in table cell. enter will exit table and add a new line after table
                  let numLines = 2;
                  let cur = line;
                  while (cur !== null && cur.length() <= 1) {
                      cur = cur.prev;
                      numLines -= 1;
                      if (numLines <= 0) {
                          this.quill.insertText(range.index + 1, '\n');
                          this.quill.setSelection(range.index + 1, Quill.sources.SILENT);
                          return false;
                      }
                  }
                  return true;
              },
          },
      };
      static register() {
          TableWrapperFormat.allowedChildren = [TableMainFormat];
          TableMainFormat.allowedChildren = [TableBodyFormat, TableColgroupFormat];
          TableMainFormat.requiredContainer = TableWrapperFormat;
          TableColgroupFormat.allowedChildren = [TableColFormat];
          TableColgroupFormat.requiredContainer = TableMainFormat;
          TableBodyFormat.allowedChildren = [TableRowFormat];
          TableBodyFormat.requiredContainer = TableMainFormat;
          TableRowFormat.allowedChildren = [TableCellFormat];
          TableCellFormat.requiredContainer = TableBodyFormat;
          TableCellFormat.allowedChildren = [TableCellInnerFormat, Break];
          TableCellFormat.requiredContainer = TableRowFormat;
          TableCellInnerFormat.requiredContainer = TableCellFormat;
          Quill.register({
              'blots/scroll': ScrollOverride,
              'blots/block': BlockOverride,
              [`blots/${blotName.container}`]: ContainerFormat,
              'formats/header': HeaderOverride,
              'formats/list': ListItemOverride,
              'formats/blockquote': BlockquoteOverride,
              'formats/code-block': CodeBlockOverride,
              [`formats/${blotName.tableCell}`]: TableCellFormat,
              [`formats/${blotName.tableCellInner}`]: TableCellInnerFormat,
              [`formats/${blotName.tableRow}`]: TableRowFormat,
              [`formats/${blotName.tableBody}`]: TableBodyFormat,
              [`formats/${blotName.tableCol}`]: TableColFormat,
              [`formats/${blotName.tableColgroup}`]: TableColgroupFormat,
              [`formats/${blotName.tableMain}`]: TableMainFormat,
              [`formats/${blotName.tableWrapper}`]: TableWrapperFormat,
          }, true);
      }
      quill;
      options;
      toolBox;
      fixTableByLisenter = debounce(this.balanceTables, 100);
      selector;
      picker;
      range;
      table;
      tableSelection;
      tableResizerBox;
      tableResizerLine;
      tableScrollbar;
      get statics() {
          return this.constructor;
      }
      constructor(quill, options) {
          this.quill = quill;
          this.options = this.resolveOptions(options || {});
          if (isBoolean(this.options.scrollbar) && !this.options.scrollbar) {
              this.quill.container.classList.add('ql-table-scrollbar--origin');
          }
          this.toolBox = this.quill.addContainer('ql-table-toolbox');
          const toolbar = this.quill.getModule('toolbar');
          if (toolbar && this.quill.theme.pickers) {
              const [, select] = (toolbar.controls || []).find(([name]) => name === this.statics.toolName) || [];
              if (select && select.tagName.toLocaleLowerCase() === 'select') {
                  this.picker = this.quill.theme.pickers.find(picker => picker.select === select);
                  if (this.picker) {
                      this.picker.label.innerHTML = this.options.icon;
                      this.buildCustomSelect(this.options.customSelect);
                      this.picker.label.addEventListener('mousedown', this.handleInViewport);
                  }
              }
          }
          const keyboard = this.quill.getModule('keyboard');
          for (const handle of Object.values(TableUp.keyboradHandler)) {
              // insert before default key handler
              if (handle.bindInHead) {
                  keyboard.bindings[handle.key].unshift(handle);
              }
              else {
                  keyboard.addBinding(handle.key, handle);
              }
          }
          this.quill.root.addEventListener('click', (evt) => {
              const path = evt.composedPath();
              if (!path || path.length <= 0)
                  return;
              const tableNode = path.find(node => node.tagName && node.tagName.toUpperCase() === 'TABLE' && node.classList.contains('ql-table'));
              if (tableNode) {
                  if (this.table === tableNode) {
                      this.tableSelection && this.tableSelection?.showSelection();
                      return;
                  }
                  if (this.table)
                      this.hideTableTools(true);
                  this.showTableTools(tableNode, quill);
              }
              else if (this.table) {
                  this.hideTableTools(true);
              }
          }, false);
          this.quill.on(Quill.events.EDITOR_CHANGE, (event, range, oldRange) => {
              if (event === Quill.events.SELECTION_CHANGE && range) {
                  const [startBlot] = this.quill.getLine(range.index);
                  const [endBlot] = this.quill.getLine(range.index + range.length);
                  let startTableBlot;
                  let endTableBlot;
                  try {
                      startTableBlot = findParentBlot(startBlot, blotName.tableMain);
                  }
                  catch { }
                  try {
                      endTableBlot = findParentBlot(endBlot, blotName.tableMain);
                  }
                  catch { }
                  // only can select inside table or select all table
                  if (startBlot instanceof TableColFormat) {
                      return this.quill.setSelection(range.index + (oldRange.index > range.index ? -1 : 1), range.length + (oldRange.length === range.length ? 0 : oldRange.length > range.length ? -1 : 1), Quill.sources.USER);
                  }
                  else if (endBlot instanceof TableColFormat) {
                      return this.quill.setSelection(range.index + 1, range.length + 1, Quill.sources.USER);
                  }
                  if (range.length > 0) {
                      if (startTableBlot && !endTableBlot) {
                          this.quill.setSelection(range.index - 1, range.length + 1, Quill.sources.USER);
                      }
                      else if (endTableBlot && !startTableBlot) {
                          this.quill.setSelection(range.index, range.length + 1, Quill.sources.USER);
                      }
                  }
                  // if range is not in table. hide table tools
                  if (!startTableBlot || !endTableBlot) {
                      this.hideTableTools(true);
                  }
              }
          });
          if (!this.options.resizerSetOuter) {
              this.tableResizerLine = new TableResizeLine(this, quill, this.options.resizeLine || {});
          }
          this.quill.on(tableUpEvent.AFTER_TABLE_RESIZE, () => {
              this.tableSelection && this.tableSelection.hideSelection();
          });
          this.pasteTableHandler();
          this.listenBalanceCells();
      }
      addContainer(classes) {
          const el = document.createElement('div');
          for (const classname of classes.split(' ')) {
              el.classList.add(classname);
          }
          this.toolBox.appendChild(el);
          return el;
      }
      resolveOptions(options) {
          return Object.assign({
              customBtn: true,
              texts: this.resolveTexts(options.texts || {}),
              full: false,
              resizerSetOuter: false,
              icon: icons.table,
              scrollbar: true,
          }, options);
      }
      ;
      resolveTexts(options) {
          return Object.assign({
              customBtnText: 'Custom',
              confirmText: 'Confirm',
              cancelText: 'Cancel',
              rowText: 'Row',
              colText: 'Column',
              notPositiveNumberError: 'Please enter a positive integer',
          }, options);
      }
      ;
      pasteTableHandler() {
          let tableId = randomId();
          let rowId = randomId();
          let colIds = [];
          let cellCount = 0;
          let colCount = 0;
          this.quill.clipboard.addMatcher('table', (node, delta) => {
              if (delta.ops.length === 0)
                  return delta;
              let colDelta;
              // paste table have or not col
              let hasCol = false;
              if (delta.ops[0] && typeof delta.ops[0].insert !== 'string') {
                  for (let i = 0; i < delta.ops.length; i++) {
                      const { insert, attributes } = delta.ops[i];
                      if (insert && typeof insert !== 'string' && insert[blotName.tableCol]) {
                          hasCol = true;
                          break;
                      }
                      if (attributes && attributes[blotName.tableCellInner]) {
                          break;
                      }
                  }
                  hasCol = !!delta.ops[0].insert?.[blotName.tableCol];
              }
              let isFull = this.options.full;
              if (hasCol) {
                  isFull = !!delta.ops[0].insert?.[blotName.tableCol]?.full;
              }
              // computed default col width
              const editorStyle = window.getComputedStyle(this.quill.root);
              const editorPaddingLeft = Number.parseFloat(editorStyle.paddingLeft);
              const editorPaddingRight = Number.parseFloat(editorStyle.paddingRight);
              const editorInnerWidth = Number.parseFloat(editorStyle.width) - editorPaddingLeft - editorPaddingRight;
              const defaultColWidth = isFull
                  ? `${Math.max(100 / colIds.length, tableUpSize.colMinWidthPre)}%`
                  : `${Math.max(editorInnerWidth / colIds.length, tableUpSize.colMinWidthPx)}px`;
              if (!hasCol) {
                  colDelta = colIds.reduce((colDelta, id) => {
                      colDelta.insert({
                          [blotName.tableCol]: {
                              colId: id,
                              tableId,
                              width: defaultColWidth,
                              full: isFull,
                          },
                      });
                      return colDelta;
                  }, new Delta());
              }
              else {
                  for (let i = 0; i < delta.ops.length; i++) {
                      const insert = delta.ops[i].insert;
                      if (!insert || typeof insert === 'string' || !insert[blotName.tableCol]) {
                          if (insert === '\n') {
                              delta.ops.splice(i, 1);
                          }
                          break;
                      }
                      Object.assign(insert[blotName.tableCol], {
                          tableId,
                          colId: colIds[i],
                          full: isFull,
                          width: !insert[blotName.tableCol].width
                              ? defaultColWidth
                              : Number.parseFloat(insert[blotName.tableCol].width) + (isFull ? '%' : 'px'),
                      });
                  }
              }
              // remove quill origin table format
              for (let i = 0; i < delta.ops.length; i++) {
                  const attrs = delta.ops[i].attributes;
                  if (attrs && attrs.table) {
                      delete attrs.table;
                  }
              }
              tableId = randomId();
              colIds = [];
              cellCount = 0;
              colCount = 0;
              delta = colDelta ? colDelta.concat(delta) : delta;
              // insert break line before table and after table
              delta.ops.unshift({ insert: '\n' });
              delta.ops.push({ insert: '\n' });
              return delta;
          });
          this.quill.clipboard.addMatcher('col', (node) => {
              colIds[colCount] = randomId();
              const delta = new Delta().insert({
                  [blotName.tableCol]: {
                      tableId,
                      colId: colIds[colCount],
                      full: Object.hasOwn(node.dataset, 'full'),
                  },
              });
              colCount += 1;
              return delta;
          });
          this.quill.clipboard.addMatcher('tr', (node, delta) => {
              rowId = randomId();
              cellCount = 0;
              for (const op of delta.ops) {
                  if (op.attributes && op.attributes.background
                      && op.attributes[blotName.tableCellInner]
                      && !op.attributes[blotName.tableCellInner].backgroundColor) {
                      op.attributes[blotName.tableCellInner].backgroundColor = op.attributes.background;
                  }
              }
              return delta;
          });
          const matchCell = (node, delta) => {
              const cell = node;
              const rowspan = Number(cell.getAttribute('rowspan')) || 1;
              const colspan = Number(cell.getAttribute('colspan')) || 1;
              if (!colIds[cellCount]) {
                  for (let i = cellCount; i >= 0; i--) {
                      if (!colIds[i])
                          colIds[i] = randomId();
                  }
              }
              const colId = colIds[cellCount];
              cellCount += Number(colspan);
              if (delta.slice(delta.length() - 1).ops[0]?.insert !== '\n') {
                  delta.insert('\n');
              }
              // add each insert tableCellInner format
              const value = Object.assign(TableCellFormat.formats(cell), {
                  tableId,
                  rowId,
                  colId,
                  rowspan: Number.isNaN(rowspan) ? 1 : rowspan,
                  colspan: Number.isNaN(colspan) ? 1 : colspan,
              });
              return delta.compose(new Delta().retain(delta.length(), {
                  [blotName.tableCellInner]: value,
              }));
          };
          this.quill.clipboard.addMatcher('td', matchCell);
          this.quill.clipboard.addMatcher('th', matchCell);
      }
      showTableTools(table, quill) {
          if (table) {
              this.table = table;
              this.tableSelection = new TableSelection(this, table, quill, this.options.selection || {});
              if (this.options.scrollbar) {
                  this.tableScrollbar = new TableVitrualScroll(this, table, quill);
              }
              if (this.options.resizerSetOuter) {
                  this.tableResizerBox = new TableResizeBox(this, table, quill, this.options.resizeBox || {});
              }
          }
      }
      hideTableTools(removeAll = false) {
          if (this.tableSelection) {
              this.tableSelection.destroy();
              this.tableSelection = undefined;
          }
          if (removeAll) {
              // eslint-disable-next-line unicorn/no-lonely-if
              if (this.tableScrollbar) {
                  this.tableScrollbar.destroy();
              }
          }
          this.table = undefined;
          if (this.options.resizerSetOuter) {
              this.tableResizerBox && this.tableResizerBox.destroy();
              this.tableResizerBox = undefined;
          }
      }
      async buildCustomSelect(customSelect) {
          if (!this.picker)
              return;
          const dom = document.createElement('div');
          dom.classList.add('ql-custom-select');
          this.selector = customSelect && isFunction(customSelect)
              ? await customSelect(this)
              : createSelectBox({
                  onSelect: (row, col) => {
                      this.insertTable(row, col);
                      if (this.picker) {
                          this.picker.close();
                      }
                  },
                  customBtn: this.options.customBtn,
                  texts: this.options.texts,
              });
          dom.appendChild(this.selector);
          this.picker.options.appendChild(dom);
      }
      ;
      handleInViewport = () => {
          if (!this.selector || !this.picker)
              return;
          const selectRect = this.selector.getBoundingClientRect();
          if (selectRect.right >= window.innerWidth) {
              const labelRect = this.picker.label.getBoundingClientRect();
              Object.assign(this.picker.options.style, { transform: `translateX(calc(-100% + ${labelRect.width}px))` });
          }
          else {
              Object.assign(this.picker.options.style, { transform: undefined });
          }
      };
      insertTable(rows, columns) {
          if (rows >= 30 || columns >= 30) {
              throw new Error('Both rows and columns must be less than 30.');
          }
          this.quill.focus();
          this.range = this.quill.getSelection();
          const range = this.range;
          if (range == null)
              return;
          const [currentBlot] = this.quill.getLeaf(range.index);
          if (!currentBlot)
              return;
          if (isForbidInTable(currentBlot)) {
              throw new Error(`Not supported ${currentBlot.statics.blotName} insert into table.`);
          }
          const rootStyle = getComputedStyle(this.quill.root);
          const paddingLeft = Number.parseInt(rootStyle.paddingLeft);
          const paddingRight = Number.parseInt(rootStyle.paddingRight);
          const width = Number.parseInt(rootStyle.width) - paddingLeft - paddingRight;
          const tableId = randomId();
          const colIds = new Array(columns).fill(0).map(() => randomId());
          // insert delta data to create table
          const colWidth = !this.options.full ? `${Math.max(Math.floor(width / columns), tableUpSize.colMinWidthPx)}px` : `${Math.max((1 / columns) * 100, tableUpSize.colMinWidthPre)}%`;
          const delta = [
              { retain: range.index },
              { insert: '\n' },
          ];
          for (let i = 0; i < columns; i++) {
              delta.push({
                  insert: {
                      [blotName.tableCol]: {
                          width: colWidth,
                          tableId,
                          colId: colIds[i],
                          full: this.options.full,
                      },
                  },
              });
          }
          for (let j = 0; j < rows; j++) {
              const rowId = randomId();
              for (let i = 0; i < columns; i++) {
                  delta.push({
                      insert: '\n',
                      attributes: {
                          [blotName.tableCellInner]: {
                              tableId,
                              rowId,
                              colId: colIds[i],
                              rowspan: 1,
                              colspan: 1,
                          },
                      },
                  });
              }
          }
          this.quill.updateContents(new Delta(delta), Quill.sources.USER);
          this.quill.setSelection(range.index + columns + columns * rows + 1, Quill.sources.SILENT);
          this.quill.focus();
      }
      // handle unusual delete cell
      fixUnusuaDeletelTable(tableBlot) {
          // calculate all cells
          const trBlots = tableBlot.getRows();
          const tableColIds = tableBlot.getColIds();
          if (trBlots.length === 0) {
              return tableBlot.remove();
          }
          if (tableColIds.length === 0)
              return;
          // append by col
          const cellSpanMap = new Array(trBlots.length).fill(0).map(() => new Array(tableColIds.length).fill(false));
          const tableId = tableBlot.tableId;
          for (const [indexTr, tr] of trBlots.entries()) {
              let indexTd = 0;
              let indexCol = 0;
              const curCellSpan = cellSpanMap[indexTr];
              const tds = tr.descendants(TableCellFormat);
              // loop every row and column
              while (indexCol < tableColIds.length) {
                  // skip when rowspan or colspan
                  if (curCellSpan[indexCol]) {
                      indexCol += 1;
                      continue;
                  }
                  const curTd = tds[indexTd];
                  // if colId does not match. insert a new one
                  if (!curTd || curTd.colId !== tableColIds[indexCol]) {
                      tr.insertBefore(createCell(this.quill.scroll, {
                          tableId,
                          colId: tableColIds[indexCol],
                          rowId: tr.rowId,
                      }), curTd);
                  }
                  else {
                      if (indexTr + curTd.rowspan - 1 >= trBlots.length) {
                          curTd.getCellInner().rowspan = trBlots.length - indexTr;
                      }
                      const { colspan, rowspan } = curTd;
                      // skip next column cell
                      if (colspan > 1) {
                          for (let c = 1; c < colspan; c++) {
                              curCellSpan[indexCol + c] = true;
                          }
                      }
                      // skip next rowspan cell
                      if (rowspan > 1) {
                          for (let r = indexTr + 1; r < indexTr + rowspan; r++) {
                              for (let c = 0; c < colspan; c++) {
                                  cellSpanMap[r][indexCol + c] = true;
                              }
                          }
                      }
                      indexTd += 1;
                  }
                  indexCol += 1;
              }
              // if td not match all exist td. Indicates that a cell has been inserted
              if (indexTd < tds.length) {
                  for (let i = indexTd; i < tds.length; i++) {
                      tds[i].remove();
                  }
              }
          }
      }
      balanceTables() {
          for (const tableBlot of this.quill.scroll.descendants(TableMainFormat)) {
              this.fixUnusuaDeletelTable(tableBlot);
          }
      }
      listenBalanceCells() {
          this.quill.on(Quill.events.SCROLL_OPTIMIZE, (mutations) => {
              mutations.some((mutation) => {
                  if (
                  // TODO: if need add ['COL', 'COLGROUP']
                  ['TD', 'TR', 'TBODY', 'TABLE'].includes(mutation.target.tagName)) {
                      this.fixTableByLisenter();
                      return true;
                  }
                  return false;
              });
          });
      }
      setCellAttrs(selectedTds, attr, value) {
          if (selectedTds.length === 0)
              return;
          for (const td of selectedTds) {
              td.setFormatValue(attr, value);
          }
      }
      deleteTable() {
          if (!this.tableSelection || this.tableSelection.selectedTds.length === 0)
              return;
          const selectedTds = this.tableSelection.selectedTds;
          const tableBlot = findParentBlot(selectedTds[0], blotName.tableMain);
          tableBlot && tableBlot.remove();
          this.hideTableTools(true);
      }
      appendRow(isDown) {
          if (!this.tableSelection)
              return;
          const selectedTds = this.tableSelection.selectedTds;
          if (selectedTds.length <= 0)
              return;
          // find baseTd and baseTr
          const baseTd = selectedTds[isDown ? selectedTds.length - 1 : 0];
          const [tableBlot, tableBodyBlot, baseTdParentTr] = findParentBlots(baseTd, [blotName.tableMain, blotName.tableBody, blotName.tableRow]);
          const tableTrs = tableBlot.getRows();
          const i = tableTrs.indexOf(baseTdParentTr);
          const insertRowIndex = i + (isDown ? baseTd.rowspan : 0);
          tableBodyBlot.insertRow(insertRowIndex);
      }
      appendCol(isRight) {
          if (!this.tableSelection)
              return;
          const selectedTds = this.tableSelection.selectedTds;
          if (selectedTds.length <= 0)
              return;
          // find insert column index in row
          const [baseTd] = selectedTds.reduce((pre, cur) => {
              const columnIndex = cur.getColumnIndex();
              if (!isRight && columnIndex <= pre[1]) {
                  pre = [cur, columnIndex];
              }
              else if (isRight && columnIndex >= pre[1]) {
                  pre = [cur, columnIndex];
              }
              return pre;
          }, [selectedTds[0], selectedTds[0].getColumnIndex()]);
          const columnIndex = baseTd.getColumnIndex() + (isRight ? baseTd.colspan : 0);
          const tableBlot = findParentBlot(baseTd, blotName.tableMain);
          const tableId = tableBlot.tableId;
          const newColId = randomId();
          const [colgroup] = tableBlot.descendants(TableColgroupFormat);
          if (colgroup) {
              colgroup.insertColByIndex(columnIndex, {
                  tableId,
                  colId: newColId,
                  width: tableBlot.full ? '6%' : '160px',
                  full: tableBlot.full,
              });
          }
          // loop tr and insert cell at index
          // if index is inner cell, skip next `rowspan` line
          // if there are cells both have column span and row span before index cell, minus `colspan` cell for next line
          const trs = tableBlot.getRows();
          const spanCols = [];
          let skipRowNum = 0;
          for (const tr of Object.values(trs)) {
              const spanCol = spanCols.shift() || 0;
              if (skipRowNum > 0) {
                  skipRowNum -= 1;
                  continue;
              }
              const nextSpanCols = tr.insertCell(columnIndex - spanCol, {
                  tableId,
                  rowId: tr.rowId,
                  colId: newColId,
                  rowspan: 1,
                  colspan: 1,
              });
              if (nextSpanCols.skipRowNum) {
                  skipRowNum += nextSpanCols.skipRowNum;
              }
              for (const [i, n] of nextSpanCols.entries()) {
                  spanCols[i] = (spanCols[i] || 0) + n;
              }
          }
      }
      /**
       * after insert or remove cell. handle cell colspan and rowspan merge
       */
      fixTableByRemove(tableBlot) {
          // calculate all cells
          // maybe will get empty tr
          const trBlots = tableBlot.getRows();
          const tableCols = tableBlot.getCols();
          const colIdMap = tableCols.reduce((idMap, col) => {
              idMap[col.colId] = 0;
              return idMap;
          }, {});
          // merge rowspan
          const reverseTrBlots = [...trBlots].reverse();
          const removeTr = [];
          for (const [index, tr] of reverseTrBlots.entries()) {
              const i = trBlots.length - index - 1;
              if (tr.children.length <= 0) {
                  removeTr.push(i);
              }
              else {
                  // if have td rowspan across empty tr. minus rowspan
                  tr.foreachCellInner((td) => {
                      const sum = removeTr.reduce((sum, val) => td.rowspan + i > val ? sum + 1 : sum, 0);
                      td.rowspan -= sum;
                      // count exist col
                      colIdMap[td.colId] += 1;
                  });
              }
          }
          // merge colspan
          let index = 0;
          for (const count of Object.values(colIdMap)) {
              if (count === 0) {
                  const spanCols = [];
                  let skipRowNum = 0;
                  for (const tr of Object.values(trBlots)) {
                      const spanCol = spanCols.shift() || 0;
                      let nextSpanCols = [];
                      if (skipRowNum > 0) {
                          nextSpanCols = tr.getCellByColumIndex(index - spanCol)[2];
                          skipRowNum -= 1;
                      }
                      else {
                          nextSpanCols = tr.removeCell(index - spanCol);
                          if (nextSpanCols.skipRowNum) {
                              skipRowNum += nextSpanCols.skipRowNum;
                          }
                      }
                      for (const [i, n] of nextSpanCols.entries()) {
                          spanCols[i] = (spanCols[i] || 0) + n;
                      }
                  }
              }
              else {
                  index += 1;
              }
          }
          // remove col
          for (const col of tableCols) {
              if (colIdMap[col.colId] === 0) {
                  if (col.prev) {
                      col.prev.width += col.width;
                  }
                  else if (col.next) {
                      col.next.width += col.width;
                  }
                  col.remove();
              }
          }
      }
      removeRow() {
          if (!this.tableSelection)
              return;
          const selectedTds = this.tableSelection.selectedTds;
          if (selectedTds.length <= 0)
              return;
          const baseTd = selectedTds[0];
          const tableBlot = findParentBlot(baseTd, blotName.tableMain);
          const trs = tableBlot.getRows();
          let endTrIndex = trs.length;
          let nextTrIndex = -1;
          for (const td of selectedTds) {
              const tr = findParentBlot(td, blotName.tableRow);
              const index = trs.indexOf(tr);
              if (index < endTrIndex) {
                  endTrIndex = index;
              }
              if (index + td.rowspan > nextTrIndex) {
                  nextTrIndex = index + td.rowspan;
              }
          }
          const patchTds = {};
          for (let i = endTrIndex; i < Math.min(trs.length, nextTrIndex); i++) {
              const tr = trs[i];
              tr.foreachCellInner((td) => {
                  // find cells in rowspan that exceed the deletion range
                  if (td.rowspan + i > nextTrIndex) {
                      patchTds[td.colId] = {
                          rowspan: td.rowspan + i - nextTrIndex,
                          colspan: td.colspan,
                          colIndex: td.getColumnIndex(),
                      };
                  }
                  // only remove td. empty tr to calculate colspan and rowspan
                  td.parent.remove();
              });
          }
          if (trs[nextTrIndex]) {
              const nextTr = trs[nextTrIndex];
              const tableId = tableBlot.tableId;
              // insert cell in nextTr to patch exceed cell
              for (const [colId, { colIndex, colspan, rowspan }] of Object.entries(patchTds)) {
                  nextTr.insertCell(colIndex, {
                      tableId,
                      rowId: nextTr.rowId,
                      colId,
                      colspan,
                      rowspan,
                  });
              }
          }
          this.fixTableByRemove(tableBlot);
      }
      removeCol() {
          if (!this.tableSelection)
              return;
          const selectedTds = this.tableSelection.selectedTds;
          if (selectedTds.length <= 0)
              return;
          const baseTd = selectedTds[0];
          const tableBlot = findParentBlot(baseTd, blotName.tableMain);
          const colspanMap = {};
          for (const td of selectedTds) {
              if (!colspanMap[td.rowId])
                  colspanMap[td.rowId] = 0;
              colspanMap[td.rowId] += td.colspan;
          }
          const colspanCount = Math.max(...Object.values(colspanMap));
          const columnIndex = baseTd.getColumnIndex();
          const trs = tableBlot.descendants(TableRowFormat);
          for (let i = 0; i < colspanCount; i++) {
              const spanCols = [];
              let skipRowNum = 0;
              for (const tr of Object.values(trs)) {
                  const spanCol = spanCols.shift() || 0;
                  if (skipRowNum > 0) {
                      skipRowNum -= 1;
                      continue;
                  }
                  const nextSpanCols = tr.removeCell(columnIndex - spanCol);
                  if (nextSpanCols.skipRowNum) {
                      skipRowNum += nextSpanCols.skipRowNum;
                  }
                  for (const [i, n] of nextSpanCols.entries()) {
                      spanCols[i] = (spanCols[i] || 0) + n;
                  }
              }
          }
          // delete col need after remove cell. remove cell need all column id
          // manual delete col. use fixTableByRemove to delete col will delete extra cells
          const [colgroup] = tableBlot.descendants(TableColgroupFormat);
          if (colgroup) {
              for (let i = 0; i < colspanCount; i++) {
                  colgroup.removeColByIndex(columnIndex);
              }
          }
          this.fixTableByRemove(tableBlot);
      }
      mergeCells() {
          if (!this.tableSelection)
              return;
          const selectedTds = this.tableSelection.selectedTds;
          if (selectedTds.length <= 1)
              return;
          const counts = selectedTds.reduce((pre, selectTd, index) => {
              // count column span
              const colId = selectTd.colId;
              if (!pre[0][colId])
                  pre[0][colId] = 0;
              pre[0][colId] += selectTd.rowspan;
              // count row span
              const rowId = selectTd.rowId;
              if (!pre[1][rowId])
                  pre[1][rowId] = 0;
              pre[1][rowId] += selectTd.colspan;
              // merge select cell
              if (index !== 0) {
                  selectTd.moveChildren(pre[2]);
                  selectTd.parent.remove();
              }
              return pre;
          }, [{}, {}, selectedTds[0]]);
          const rowCount = Math.max(...Object.values(counts[0]));
          const colCount = Math.max(...Object.values(counts[1]));
          const baseTd = counts[2];
          baseTd.colspan = colCount;
          baseTd.rowspan = rowCount;
          const tableBlot = findParentBlot(baseTd, blotName.tableMain);
          this.fixTableByRemove(tableBlot);
      }
      splitCell() {
          if (!this.tableSelection)
              return;
          const selectedTds = this.tableSelection.selectedTds;
          if (selectedTds.length !== 1)
              return;
          const baseTd = selectedTds[0];
          if (baseTd.colspan === 1 && baseTd.rowspan === 1)
              return;
          const [tableBlot, baseTr] = findParentBlots(baseTd, [blotName.tableMain, blotName.tableRow]);
          const tableId = tableBlot.tableId;
          const colIndex = baseTd.getColumnIndex();
          const colIds = tableBlot.getColIds().slice(colIndex, colIndex + baseTd.colspan).reverse();
          let curTr = baseTr;
          let rowspan = baseTd.rowspan;
          // reset span first. insertCell need colspan to judge insert position
          baseTd.colspan = 1;
          baseTd.rowspan = 1;
          while (curTr && rowspan > 0) {
              for (const id of colIds) {
                  // keep baseTd. baseTr should insert at baseTd's column index + 1
                  if (curTr === baseTr && id === baseTd.colId)
                      continue;
                  curTr.insertCell(colIndex + (curTr === baseTr ? 1 : 0), {
                      tableId,
                      rowId: curTr.rowId,
                      colId: id,
                      rowspan: 1,
                      colspan: 1,
                  });
              }
              rowspan -= 1;
              curTr = curTr.next;
          }
      }
  }
  const updateTableConstants = (data) => {
      Object.assign(blotName, data.blotName || {});
      Object.assign(tableUpSize, data.tableUpSize || {});
      Object.assign(tableUpEvent, data.tableUpEvent || {});
      TableUp.toolName = blotName.tableWrapper;
      ContainerFormat.blotName = blotName.container;
      TableWrapperFormat.blotName = blotName.tableWrapper;
      TableMainFormat.blotName = blotName.tableMain;
      TableColgroupFormat.blotName = blotName.tableColgroup;
      TableColFormat.blotName = blotName.tableCol;
      TableBodyFormat.blotName = blotName.tableBody;
      TableRowFormat.blotName = blotName.tableRow;
      TableCellFormat.blotName = blotName.tableCell;
      TableCellInnerFormat.blotName = blotName.tableCellInner;
  };

  exports.BlockOverride = BlockOverride;
  exports.BlockquoteOverride = BlockquoteOverride;
  exports.CodeBlockOverride = CodeBlockOverride;
  exports.ContainerFormat = ContainerFormat;
  exports.HeaderOverride = HeaderOverride;
  exports.ListItemOverride = ListItemOverride;
  exports.ScrollOverride = ScrollOverride;
  exports.Scrollbar = Scrollbar;
  exports.TableBodyFormat = TableBodyFormat;
  exports.TableCellFormat = TableCellFormat;
  exports.TableCellInnerFormat = TableCellInnerFormat;
  exports.TableColFormat = TableColFormat;
  exports.TableColgroupFormat = TableColgroupFormat;
  exports.TableMainFormat = TableMainFormat;
  exports.TableMenuCommon = TableMenuCommon;
  exports.TableMenuContextmenu = TableMenuContextmenu;
  exports.TableMenuSelect = TableMenuSelect;
  exports.TableResizeBox = TableResizeBox;
  exports.TableResizeCommon = TableResizeCommon;
  exports.TableResizeLine = TableResizeLine;
  exports.TableRowFormat = TableRowFormat;
  exports.TableSelection = TableSelection;
  exports.TableUp = TableUp;
  exports.TableVitrualScroll = TableVitrualScroll;
  exports.TableWrapperFormat = TableWrapperFormat;
  exports.allowAttrs = allowAttrs;
  exports.blotName = blotName;
  exports.default = TableUp;
  exports.findParentBlot = findParentBlot;
  exports.findParentBlots = findParentBlots;
  exports.getRelativeRect = getRelativeRect;
  exports.isRectanglesIntersect = isRectanglesIntersect;
  exports.randomId = randomId;
  exports.tableCantInsert = tableCantInsert;
  exports.tableUpEvent = tableUpEvent;
  exports.tableUpSize = tableUpSize;
  exports.updateTableConstants = updateTableConstants;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=dev.js.map
