/**
 * @author: Jason.友伟 zhanyouwei@meitunmama.com
 * Created on 16/5/17.
 */

'use strict';

var $ = (window.jQuery);

function Toast($element, options) {
  var timeOut = null;
  this.$element = $element;
  this.options = $.extend({
    text: 'This is a Toast',
    duration: 2000
  }, options);
  this.show();
  timeOut = setTimeout(function () {
    $element.find('.am-toast').remove();
    window.clearTimeout(timeOut);
  }, this.options.duration);
}

Toast.prototype = {
  show: function () {
    var html = [];
    var classArr = ['am-toast'];
    var typeClass = 'am-toast-' + this.options.type;
    classArr.push(typeClass);
    html.push('<div class="' + classArr.join(' ') + '">');
    html.push(this.options.text);
    html.push('</div>');
    this.$element.append(html.join(""));
  }
};

$.fn.toast = function toast(options) {
  new Toast(this, options);
};
