import Hammer from 'hammerjs';

function Gesture(view, container, options = {}) {
  const $ = this;
  $.hammer = new Hammer.Manager(view);
  $.el = view;
  $.container = container;
  init();

  function init() {
    const o = $.el.getBoundingClientRect();
    const v = $.container.getBoundingClientRect();
    $.cOffset = {
      width: o.width,
      height: o.height
    };
    $.offset = {
      x: 0,
      y: 0,
      width: v.width,
      height: v.height,
      origin: {x: 0, y: 0}
    };
    $.transform = {
      scale: 1
    };
    $.scaleIndex = 1;
    $.top = 0;
    $.left = 0;
    $.timer = null;
    $.tapTimer = null;
    $.listeners = {};
  }

  function startTimer(timer, duration = 100, callback) {
    $[timer] = setTimeout(() => {
      clearTimer(timer);
      (typeof callback === 'function') && callback();
    }, duration);
  }

  function clearTimer(timer) {
    if ($[timer]) {
      clearTimeout($[timer]);
      $[timer] = null;
    }
  }

  $.initModel = (model) => {
    switch (model) {
      case 'pinch':
        initPinch();
        break;
      case 'pan':
        initPan();
        break;
      case 'doubletap':
        initDoubleTap();
        break;
      case 'tap':
        initTap();
        break;
      case 'press':
        initPress();
        break;
    }
  };

  function initPinch() {
    const pinch = new Hammer.Pinch();
    $.hammer.add(pinch);
    $.hammer.on('pinchmove pinchstart pinchend pinchout pinchin', e => {
      if ($.timer) {
        return;
      }
      if (e.type === 'pinchstart') {
        $.scaleIndex = $.transform.scale || 1;
      }
      $.transform.scale = $.scaleIndex * e.scale;
      if (e.type === 'pinchend') {
        $.transform.scale = Math.max($.transform.scale, 1);
        $.transform.scale = Math.min($.transform.scale, 2);
        startTimer('timer');
      }
      reset();
      update();
    });
  }

  function initPan() {
    const pan = new Hammer.Pan();
    $.hammer.add(pan);
    $.hammer.on('panstart panmove panend', e => {
      if ($.transform.scale === 1 || $.timer) {
        return;
      }
      if (e.type === 'panstart') {
        $.top = $.offset.y;
        $.left = $.offset.x;
      }
      if (e.type === 'panend') {
        startTimer('timer');
      }
      $.offset.x = $.left + e.deltaX;
      $.offset.y = $.top + e.deltaY;
      reset();
      update();
    });
  }

  function initDoubleTap() {
    const double = new Hammer.Tap({
      event: 'doubletap',
      taps: 2
    });
    $.hammer.add(double);
    $.hammer.on('doubletap', e => {
      clearTimer('tapTimer');
      $.transform.scale = $.transform.scale !== 1 ? 1 : 2;
      reset();
      update();
    });
  }

  function initTap() {
    const Tap = new Hammer.Tap({taps: 1});
    $.hammer.add(Tap);
    $.hammer.on('tap', e => {
      startTimer('tapTimer', 300, () => {
        const callback = $.listeners['tap'];
        (typeof callback === 'function') && callback();
      });
    });
  }

  function initPress() {
    const press = new Hammer.Press();
    $.hammer.add(press);
    $.hammer.on('press', e => {
      console.log('on press');
    });
  }

  function reset() {
    if ($.offset.height === 0) {
      $.offset.height = $.container.getBoundingClientRect().height;
    }
    let width = $.offset.width * $.transform.scale;
    let height = $.offset.height * $.transform.scale;
    $.offset.origin.x = (width - $.cOffset.width) / 2;
    $.offset.origin.y = (height - $.cOffset.height) / 2;
    if ($.transform.scale === 1) {
      $.offset.origin.x = 0;
      $.offset.origin.y = 0;
    }
    const ox = $.offset.origin.x;
    const oy = $.offset.origin.y;
    $.offset.x = Math.max($.offset.x, 0 - ox);
    $.offset.x = Math.min($.offset.x, ox);
    $.offset.y = Math.max($.offset.y, 0 - oy);
    $.offset.y = Math.min($.offset.y, oy);
    if (width < $.cOffset.width) {
      $.offset.x = ($.cOffset.width - width) / 2;
    }
    if (height < $.cOffset.height) {
      $.offset.y = ($.cOffset.height - height) / 2;
    }
  }

  function update() {
    $.container.style.top = 0;
    $.container.style.left = 0;
    const x = $.offset.x / $.transform.scale;
    const y = $.offset.y / $.transform.scale;
    $.container.style.transformOrigin = `${$.offset.origin.x}px ${$.offset.origin.y}px`;
    $.container.style.transform = `scale(${$.transform.scale}) translate(${x}px, ${y}px)`;
  }

  return $;
}

Gesture.prototype.on = function (handle, callback) {
  this.listeners[handle] = callback;
  return this;
};
Gesture.prototype.models = function (models = []) {
  if (models instanceof Array) {
    models.forEach(m => this.initModel(m));
  } else if (typeof models === 'string') {
    this.initModel(models);
  }
  return this;
};
Gesture.prototype.destroy = function () {
  this.hammer.destroy();
  return this;
};
const gesture = (view, container, options = {}) => new Gesture(view, container, options);
export {
  Gesture
}
export default gesture;
module.exports = gesture;
exports.Gesture = Gesture;
