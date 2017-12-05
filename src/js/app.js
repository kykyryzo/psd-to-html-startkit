/* -------------------------------------------------------------------------------------------------
 Vendors
 ------------------------------------------------------------------------------------------------- */

//= ./../../bower_components/jquery/dist/jquery.min.js
//= ./../../bower_components/swiper/dist/js/swiper.jquery.min.js
//= ./../../bower_components/bootstrap/dist/js/bootstrap.min.js
//= ./../../bower_components/magnific-popup/dist/jquery.magnific-popup.js
//= ./can.custom.js

var APP         = window.APP || {},
    IE          = navigator.userAgent.indexOf("MSIE") != -1, // In MSIE < 11, the true version is after "MSIE" in userAgent
    ieVer       = (function() { if (new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})").exec(navigator.userAgent) != null) { return parseFloat( RegExp.$1 ); } else { return false; } })();

function d($var) {

	console.log($var);
}

$(function() {

    // pixel perfect debug
    /*debug({
        picture:    $('body').data('layout'),
        top:        $('body').data('top'),
        left:       $('body').data('left')
    });
    // */

    // plugins
    //$('.js-lightbox-iframe')            .magnificPopup({type: 'iframe'});

    // controls
    $('.js-swiper')                     .each(function(i, el) { new APP.SwiperSlider 		($(el)); });
    $('.js-scroll')                     .each(function(i, el) { new APP.ScrollBlock  		($(el)); }); // запуск анимации по скроллу
    $('.js-add-class-to-animation')     .each(function(i, el) { new APP.AddClassToAnimation ($(el)); });
});

/* -------------------------------------------------------------------------------------------------
 Карусель
 ------------------------------------------------------------------------------------------------- */
APP.SwiperSlider = can.Control.extend({
    defaults: {
        paginationClickable: 			true,
        autoplayDisableOnInteraction: 	false,
        loop: 							true,
        loopAdditionalSlides: 			1,
        pagination:                     '.swiper-pagination',
    }
},{
    init: function() {

        var responsive      = this.element.data('responsive') == true || false,
            breakpoints     = responsive ? {
                    // when window width is <= 550px
                    550: {
                        slidesPerView: 1,
                        spaceBetween: 0
                    },

                    // when window width is <= 990px
                    990: {
                        slidesPerView: 2,
                        spaceBetween: 30
                    },

                    // when window width is <= 1190px
                    1190: {
                        slidesPerView: 3,
                        spaceBetween: 30
                    }
                } : null,
            autospeed       = parseInt(this.element.data('autospeed'), 10) || 0,
            params          = $.extend(this.options, {
                autoplay:       autospeed,
                spaceBetween:   responsive ? 30 : 0,
                slidesPerView:  responsive ? this.element.data('slides-per-view') : 1,
                breakpoints:    breakpoints,
                nextButton:     this.element.data('next-button') || this.element.find('.swiper-button-next'),
                prevButton:     this.element.data('prev-button') || this.element.find('.swiper-button-prev')    ,
            });

        this.swiper = (ieVer > 9 || !IE) ? new Swiper(this.element, params) : null;
    }
});

/* -------------------------------------------------------------------------------------------------
 Каркас для блока с анимацией
 ------------------------------------------------------------------------------------------------- */
APP.AnimationBlock = can.Control.extend({

    init: function() {

        this.running = false;
    },

    start: function() {

        if (!this.running) {

            var $animation = this.element.find('.js-animation').addBack().filter('.js-animation');

            if ($animation.length > 0 &&
                $animation.controls().length > 0 &&
                typeof $animation.controls()[0].startAnimation == 'function') {

                $animation.controls()[0].startAnimation();

                this.running = true;
            }
        }
    },

    stop: function() { /* TODO realize */}
});

/* -------------------------------------------------------------------------------------------------
 Запуск анимации у блока при перемотке к нему
 ------------------------------------------------------------------------------------------------- */
APP.ScrollBlock = APP.AnimationBlock.extend({

    init: function() {

        var offset = (this.element.data('offset') || 50) + '%';

        this.element.waypoint({
            handler: 	this.proxy(this.handler),
            offset: 	offset
        })
    },

    handler: function(direction) {

        direction == 'down' ? this.start() : this.stop();
    }
});

/* -------------------------------------------------------------------------------------------------
 Когда для анимации блока достаточно просто добавить класс контейнеру
 ------------------------------------------------------------------------------------------------- */
APP.AddClassToAnimation = APP.AnimationBlock.extend({

    init: function() {

        this.items		= this.element.find('.js-item');
        this.step      	= 1;
        this.maxStep   	= this.items.length;
        this.pause     	= this.element.data('pause') || 1000;
        this.timer     	= null;
        this.running   	= false;
        this.callback 	= this.element.data('callback') || undefined;

        this.element.addClass('not-animated-section');
    },

    startAnimation: function() {

        if (!this.running) {

            this.element.addClass('animated-section');

            clearInterval(this.timer);

            this.running = true;

            this.defaultState();
            this.nextStep();

            if (this.callback != undefined) { window[this.callback](this.element); }
        }
    },

    stopAnimation: function() {

        clearInterval(this.timer);
    },

    defaultState: function() {

        this.items.removeClass('animated-item');
    },

    nextStep: function() {

        this.items.eq(this.step - 1).addClass('animated-item');

        this.timer = sleep(this.pause, this.proxy(function() {

            ++this.step;

            if (this.step > this.maxStep) {

                this.element.find('.js-final').addClass('animated-final');
                clearInterval(this.timer);

                return;
            }

            this.nextStep();
        }));
    }
});


/* -------------------------------------------------------------------------------------------------
 Helpers
 ------------------------------------------------------------------------------------------------- */

// пауза
function sleep(duration, callback) {

	return setTimeout(callback, duration);
}

// parents
jQuery.expr[':'].parents = function(a,i,m){
    return jQuery(a).parents(m[3]).length < 1;
};

// сериализация в объект
$.fn.serializeObject = function() {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name]) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

// плавно скроллируем к нужному элементу
function scrollToElement(selector, callback, delta) {

    var destination = $(selector).offset();

    if (destination) {

        var top = (destination.top - 30 > 0) ? (destination.top - 30) : 0;

        delta = parseInt(delta, 10) || 0;

        top += delta;

        callback = callback || function() {};

        $('body, html').animate({'scrollTop': top}, {'duration': 1500, 'complete': function() {callback();}});
    }
}

/**
 * Аналог функции empty в php
 *
 * @param mixed_var
 * @returns {boolean}
 */
function empty(mixed_var) {

    var undef, key, i, len;
    var emptyValues = [undef, null, false, 0, '', '0'];

    for (i = 0, len = emptyValues.length; i < len; i++) {
        if (mixed_var === emptyValues[i]) {
            return true;
        }
    }

    if (typeof mixed_var === 'object') {
        for (key in mixed_var) {
            return false;
        }
        return true;
    }

    return false;
}

/**
 * Форматирует число для вывода как цену
 *
 * @param number
 * @returns {*|String}
 */
function price(number) {

    return new Intl.NumberFormat().format(number);
}

/* -------------------------------------------------------------------------------------------------
 @Debug
 ------------------------------------------------------------------------------------------------- */
var debug = function(options) {

    var self = this;

    this.options = options;

    this.defaults = {
        top: -66,
        left: -39,
        zIndex: 0,
        opacity: 50,
        picture: null,
        maxZIndex: 10000
    };

    $('body').prepend('<div class="jsDebug"></div>');

    this.debug = $('.jsDebug');

    var opacity = this.defaults.opacity / 100;

    this.debug.css({
        position: 'absolute',
        top: parseInt(this.options.top),
        left: parseInt(this.options.left),
        width: '100%',
        height: '1500%',
        zIndex: this.options.zIndex,
        textAlign: 'center',
        opacity: opacity,
        display: 'none',
        overflow: 'hidden',
        zIndex: '10000000'
    });

    this.debug.append('<img src="' + this.options.picture + '" alt="">');

    $(document).on('keydown', function(ev) {

        switch (ev.keyCode) {
            case 48:  self.toggleDebug();     break; // *
            case 106: self.toggleDebug();     break; //
            case 107: self.increaseOpacity(); break; //
            case 109: self.decreaseOpacity(); break; //
            case 111: self.toggleZIndex();    break; //
            case 120: less.refresh();         break; //
        }
    });

    this.toggleDebug = function()
    {
        self.debug.toggle();
    };


    this.decreaseOpacity = function()
    {
        if (self.options.opacity > 10) {
            self.options.opacity = self.options.opacity - 10;
        }

        var opacity = self.options.opacity / 100;
        self.debug.css({
            opacity: opacity
        })
    };

    this.increaseOpacity = function()
    {
        if (self.options.opacity < 100) {
            self.options.opacity = self.options.opacity + 10;
        }

        var opacity = self.options.opacity / 100;
        self.debug.css({
            opacity: opacity
        })
    };

    this.toggleZIndex = function()
    {
        var zIndex = self.debug.css('z-index');
        if (zIndex == 0) {
            self.debug.css('z-index', self.options.maxZIndex);
        } else {
            self.debug.css('z-index', 0);
        }
    }
}; // */