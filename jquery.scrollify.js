/*!
 * jQuery Scrollify
 * Version 0.1.14
 *
 * Requires:
 * - jQuery 1.6 or higher
 *
 * https://github.com/lukehaas/Scrollify
 *
 * Copyright 2016, Luke Haas
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
(function (global,factory) {
	"use strict";
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], function($) {
			return factory($, global, global.document);
		});
	} else if (typeof module === 'object' && module.exports) {
		// Node/CommonJS
		module.exports = function( root, jQuery ) {
			if ( jQuery === undefined ) {
				// require('jQuery') returns a factory that requires window to
				// build a jQuery instance, we normalize how we use modules
				// that require this pattern but the window provided is a noop
				// if it's defined (how jquery works)
				if ( typeof window !== 'undefined' ) {
					jQuery = require('jquery');
				}
				else {
					jQuery = require('jquery')(root);
				}
			}
			factory(jQuery, global, global.document);
			return jQuery;
		};
	} else {
		// Browser globals
		factory(jQuery, global, global.document);
	}
}(typeof window !== 'undefined' ? window : this, function ($, window, document, undefined) {
	"use strict";
	var heights = [],
		names = [],
		elements = [],
		overflow = [],
		index = 0,
		interstitialIndex = 1,
		hasLocation = false,
		timeoutId,
		timeoutId2,
		top = $(window).scrollTop(),
		scrollable = false,
		locked = false,
		scrolled = true,
		manualScroll,
		swipeScroll,
		util,
		disabled = false,
		scrollSamples = [],
		scrollTime = new Date().getTime(),
		firstLoad = true,
		settings = {
			//section should be an identifier that is the same for each section
			section: "section",
			sectionName: "section-name",
			easing: "easeOutExpo",
			scrollSpeed: 1100,
			offset : 0,
			scrollbars: true,
			axis:"y",
			target:"html,body",
			standardScrollElements: false,
			setHeights: true,
			before:function() {},
			after:function() {},
			afterResize:function() {},
			afterRender:function() {}
		},
		currentSectionID, // Angular Fix
		isIE;

	function isIECheck(){

		var ua = window.navigator.userAgent;
		var msie = ua.indexOf('MSIE ');
		var version;
		if (msie > 0) {
			// IE 10 or older => return version number
			version = parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
		}

		var trident = ua.indexOf('Trident/');
		if (trident > 0) {
			// IE 11 => return version number
			var rv = ua.indexOf('rv:');
			version = parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
		}
		if(version) {
			isIE = true;
		} else {
			isIE = false;
		}
		return isIE;
	}

	function animateScroll(index,instant,callbacks, broadcast) {
		if(broadcast) {
			$(window).trigger("scrollify.section.changed", {
				index: index,
				elem: names[index]
			});
		}
		if(disabled===true) {
			return true;
		}
		if(names[index]) {
			scrollable = false;

			//console.log('CURRENT:', index, elements.length, elements[index], elements, heights);
			if(index === 0) {
				$('.btn-prev').addClass('hide');
			} else {
				$('.btn-prev').removeClass('hide');
			}
			if(index+1 >= elements.length) {
				$('.btn-next').addClass('hide');
			} else {
				$('.btn-next').removeClass('hide');
			}
			$('section').removeClass('active-section');
			$(elements[index]).addClass('active-section');

			if(callbacks) {
				settings.before(index,elements);
			}
			interstitialIndex = 1;
			if(!settings.sectionName && !(firstLoad===true && index===0)) {

				currentSectionID = names[index];		// Angular Fix
				/*
				if(history.pushState) {
				    try {
						history.replaceState(null, null, names[index]);
				    } catch (e) {
				    	if(window.console) {
				    		console.warn("Scrollify warning: This needs to be hosted on a server to manipulate the hash value.");
				    	}
				    }

				} else {
					window.location.hash = names[index];
				}
				*/
			}
			if(instant) {
				$(settings.target).stop().scrollTop(heights[index]);
				if(callbacks) {
					settings.after(index,elements);
				}
			} else {
				if(firstLoad===true && index===0) {
					locked = false;
					firstLoad = false;
					scrolled = true;
				} else {
					locked = true;

					if( jQuery().velocity ) {
						// Animate using Velocity!
						$(settings.target).stop().velocity('scroll', {
							duration: settings.scrollSpeed,
							//easing: settings.easing,
							offset: heights[index],
							progress: function(elements, complete, remaining, start, tweenValue) {
								if(!scrolled) {
									$(settings.target).stop();
								}
							},
							mobileHA: false
						});
					} else {
					
						// Fallback to jQuery animation
						$(settings.target).stop().animate({
							scrollTop: heights[index]
						}, {
							step: function() {
								if(!scrolled) {
									$(settings.target).stop();
								}
							},
							duration: settings.scrollSpeed,
							easing: settings.easing
						});
					}

					/*$(settings.target).velocity({
						scrollTop: heights[index]
					}, {
						step: function() {
							if(!scrolled) {
								$(settings.target).stop();
							}
						},
						duration: settings.scrollSpeed,
						easing: settings.easing
					});*/
					/*
					$(settings.target).stop().animate({
						scrollTop: heights[index]
					}, {
						step: function() {
							if(!scrolled) {
								$(settings.target).stop();
							}
						},
						duration: settings.scrollSpeed,
						easing: settings.easing
					});
					*/

					$(settings.target).promise().done(function(){
						locked = false;
						firstLoad = false;
						scrolled = true;
						if(callbacks) {
							settings.after(index,elements);
						}
					});
				}



				/* Angular Fix
				if(window.location.hash.length) {
					if($(window.location.hash).length && window.console) {
						console.warn("Scrollify warning: There are IDs on the page that match the hash value - this will cause the page to anchor.");
					}
				}
				*/

			}

		}
	}

	function isAccelerating(samples) {

		if(samples<4) {
			return false;
		}
		var limit = 20,sum = 0,i = samples.length-1,l;
		if(samples.length<limit*2) {
			limit = Math.floor(samples.length/2);
		}
		l = samples.length-limit;
		for(;i>=l;i--) {
			sum = sum+samples[i];
		}
		var average1 = sum/limit;

		sum = 0;
		i = samples.length-limit-1;
		l = samples.length-(limit*2);
		for(;i>=l;i--) {
			sum = sum+samples[i];
		}
		var average2 = sum/limit;

		if(average1>=average2) {
			return true;
		} else {
			return false;
		}
	}
	$.scrollify = function(options) {

		$.easing['easeLinear'] = function (x, t, b, c, d) {
			return c*t/d + b;
		};
		
		$.easing['easeOutExpo'] = function(x, t, b, c, d) {
			return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
		};

		$.easing['easeOutCubic'] = function (x, t, b, c, d) {
			return c*((t=t/d-1)*t*t + 1) + b;
		};

		$.easing['easeOutQuad'] = function (x, t, b, c, d) {
			return -c *(t/=d)*(t-2) + b;
		};

		$.easing['easeInOutQuad'] = function (x, t, b, c, d) {
			if ((t/=d/2) < 1) return c/2*t*t + b;
			return -c/2 * ((--t)*(t-2) - 1) + b;
		};

		$.easing['easeInOutCubic'] = function (x, t, b, c, d) {
			if ((t/=d/2) < 1) return c/2*t*t*t + b;
			return c/2*((t-=2)*t*t + 2) + b;
		};

		$.easing['easeInOutSine'] = function (x, t, b, c, d) {
			return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
		};

		$.easing['easeInOutExpo'] = function (x, t, b, c, d) {
			if (t==0) return b;
			if (t==d) return b+c;
			if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
			return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
		};

		manualScroll = {
			handleMousedown:function() {
				if(disabled===true) {
					return true;
				}
				scrollable = false;
				scrolled = false;
				if(isIE) {
					$(document).bind('mousemove',function(event){
						if(event.pageX < ($(window).width() - 30)){
							//mouse is off scrollbar
							$(this).unbind(event);
							$(this).trigger('mouseup');
						}
					});
				}
			},
			handleMouseup:function() {
				if(disabled===true) {
					return true;
				}
				scrollable = true;
				/*
				if(scrolled) {
					manualScroll.calculateNearest();
				}*/
				scrolled = true;
				manualScroll.calculateNearest();
			},
			handleScroll:function() {
				if(disabled===true) {
					return true;
				}
				if(timeoutId){
					clearTimeout(timeoutId);
				}
				timeoutId = setTimeout(function(){
					scrolled = true;
					if(scrollable===false) {
						return false;
					}
					scrollable = false;
					manualScroll.calculateNearest();

				}, 500);
			},
			calculateNearest:function() {
				top = $(window).scrollTop();
				var i =1,
					max = heights.length,
					closest = 0,
					prev = Math.abs(heights[0] - top),
					diff;
				for(;i<max;i++) {
					diff = Math.abs(heights[i] - top);

					if(diff < prev) {
						prev = diff;
						closest = i;
					}
				}
				if(atBottom() || atTop()) {
					index = closest;
					animateScroll(closest,false,true, true);
				}
			},
			wheelHandler:function(e,delta) {
				if(disabled===true) {
					return true;
				} else if(settings.standardScrollElements) {
					if($(e.target).is(settings.standardScrollElements) || $(e.target).closest(settings.standardScrollElements).length) {
						return true;
					}
				}
				if(!overflow[index]) {
					e.preventDefault();
				}
				var currentScrollTime = new Date().getTime();
				delta = delta || -e.originalEvent.detail / 3 || e.originalEvent.wheelDelta / 120;


				if((currentScrollTime-scrollTime) > 1300){
					scrollSamples = [];
				}
				scrollTime = currentScrollTime;

				if(scrollSamples.length >= 35){
					scrollSamples.shift();
				}
				scrollSamples.push(Math.abs(delta*10));

				if(locked) {
					return false;
				}

				if(delta<0) {
					if(index<heights.length-1) {
						if(atBottom()) {
							if(isAccelerating(scrollSamples)) {
								e.preventDefault();
								index++;
								locked = true;
								animateScroll(index,false,true);
							} else {
								return false;
							}
						}
					}
				} else if(delta>0) {
					if(index>0) {
						if(atTop()) {
							if(isAccelerating(scrollSamples)) {
								e.preventDefault();
								index--;
								locked = true;
								animateScroll(index,false,true);
							} else {
								return false;
							}
						}
					}
				}

			},
			keyHandler:function(e) {
				if(disabled===true) {
					return true;
				}
				if(e.keyCode==38) {
					if(index>0) {
						if(atTop()) {
							index--;
							animateScroll(index,false,true);
						}
					}
				} else if(e.keyCode==40) {
					if(index<heights.length-1) {
						if(atBottom()) {
							index++;
							animateScroll(index,false,true);
						}
					}
				}
			},
			init:function() {

				isIECheck();
				if(settings.scrollbars) {
					$(window).bind('mousedown', manualScroll.handleMousedown);
					$(window).bind('mouseup', manualScroll.handleMouseup);
					$(window).bind('scroll', manualScroll.handleScroll);
				} else {
					$("body").css({"overflow":"hidden"});
				}

				$(document).bind('DOMMouseScroll mousewheel',manualScroll.wheelHandler);
				$(document).bind('keydown', manualScroll.keyHandler);
			}
		};

		swipeScroll = {
			touches : {
				"touchstart": {"y":-1,"x":-1}, 
				"touchmove" : {"y":-1,"x":-1},
				"touchend"  : false,
				"direction" : "undetermined",
				"startTime" : new Date().getTime()
			},
			options:{
				"distance" : 30,
				"timeGap" : 800,
				"timeStamp" : new Date().getTime()
			},
			touchHandler: /*function(event){
				switch (event.type) {
					case 'touchstart':
						var touchobj = e.changedTouches[0];
						swipeScroll.touches.direction = 'none';
						swipeScroll.touches.touchstart.x = touchobj.pageX;
						swipeScroll.touches.touchstart.y = touchobj.pageY;
						swipeScroll.touches.startTime = new Date().getTime(); // record time when finger first makes contact with surface
						e.preventDefault();
						break;
					case 'touchmove':
						e.preventDefault();
						break;
					case 'touchend':
						var touchobj = e.changedTouches[0];
						var distX = touchobj.pageX - startX; // get horizontal dist traveled by finger while in contact with surface
						var distY = touchobj.pageY - startY; // get vertical dist traveled by finger while in contact with surface
						var elapsedTime = new Date().getTime() - startTime; // get time elapsed
						if (elapsedTime <= 300){ // first condition for awipe met
							if (Math.abs(distX) >= 150 && Math.abs(distY) <= 100){ // 2nd condition for horizontal swipe met
								swipeScroll.touches.direction = (distX < 0)? 'left' : 'right'; // if dist traveled is negative, it indicates left swipe
							}
							else if (Math.abs(distY) >= 150 && Math.abs(distX) <= 100){ // 2nd condition for vertical swipe met
								swipeScroll.touches.direction = (distY < 0)? 'up' : 'down'; // if dist traveled is negative, it indicates up swipe
							}
						}
						if(swipeScroll.touches.direction === 'up' || swipeScroll.touches.direction === 'left'){
							swipeScroll.up();
						} if (swipeScroll.touches.direction === 'down' || swipeScroll.touches.direction === 'right') {
							swipeScroll.down();
						}
						e.preventDefault();
						break;
					default:
						break;
				}
			},*/
			function(event) {
				if(disabled===true) {
					return true;
				} else if(settings.standardScrollElements) {
					if($(event.target).is(settings.standardScrollElements) || $(event.target).closest(settings.standardScrollElements).length) {
						return true;
					}
				}
				var touch;
				if (typeof event !== 'undefined'){	
					if (typeof event.touches !== 'undefined') {
						touch = event.touches[0];
						switch (event.type) {
							case 'touchstart':
								swipeScroll.touches.touchstart.y = touch.pageY;
								swipeScroll.touches.touchmove.y = -1;

								swipeScroll.touches.touchstart.x = touch.pageX;
								swipeScroll.touches.touchmove.x = -1;

								swipeScroll.options.timeStamp = new Date().getTime();
								swipeScroll.touches.touchend = false;
							case 'touchmove':
								swipeScroll.touches.touchmove.y = touch.pageY;
								swipeScroll.touches.touchmove.x = touch.pageX;
								if(swipeScroll.touches.touchstart.y!==swipeScroll.touches.touchmove.y && (Math.abs(swipeScroll.touches.touchstart.y-swipeScroll.touches.touchmove.y)>Math.abs(swipeScroll.touches.touchstart.x-swipeScroll.touches.touchmove.x))) {
									//if(!overflow[index]) {
									event.preventDefault();
									//}
									swipeScroll.touches.direction = "y";
									if((swipeScroll.options.timeStamp+swipeScroll.options.timeGap)<(new Date().getTime()) && swipeScroll.touches.touchend == false) {

										swipeScroll.touches.touchend = true;
										if (swipeScroll.touches.touchstart.y > -1) {

											if(Math.abs(swipeScroll.touches.touchmove.y-swipeScroll.touches.touchstart.y)>swipeScroll.options.distance) {
												if(swipeScroll.touches.touchstart.y < swipeScroll.touches.touchmove.y) {

													swipeScroll.up();

												} else {
													swipeScroll.down();

												}
											}
										}
									}
								} else if(swipeScroll.touches.touchstart.x!==swipeScroll.touches.touchmove.x && (Math.abs(swipeScroll.touches.touchstart.x-swipeScroll.touches.touchmove.x)>Math.abs(swipeScroll.touches.touchstart.y-swipeScroll.touches.touchmove.y))) {
									//if(!overflow[index]) {
									event.preventDefault();
									//}
									swipeScroll.touches.direction = "x";
									if((swipeScroll.options.timeStamp+swipeScroll.options.timeGap)<(new Date().getTime()) && swipeScroll.touches.touchend == false) {

										swipeScroll.touches.touchend = true;
										if (swipeScroll.touches.touchstart.x > -1) {

											if(Math.abs(swipeScroll.touches.touchmove.x-swipeScroll.touches.touchstart.x)>swipeScroll.options.distance) {
												if(swipeScroll.touches.touchstart.x < swipeScroll.touches.touchmove.x) {

													swipeScroll.up();

												} else {
													swipeScroll.down();

												}
											}
										}
									}
								}
								break;
							case 'touchend':
								if(swipeScroll.touches[event.type]===false) {
									swipeScroll.touches[event.type] = true;
									if (swipeScroll.touches.touchstart.y > -1 && swipeScroll.touches.touchmove.y > -1 && swipeScroll.touches.direction==="y") {

										if(Math.abs(swipeScroll.touches.touchmove.y-swipeScroll.touches.touchstart.y)>swipeScroll.options.distance) {
											if(swipeScroll.touches.touchstart.y < swipeScroll.touches.touchmove.y) {
												swipeScroll.up();

											} else {
												swipeScroll.down();

											}
										}
										swipeScroll.touches.touchstart.y = -1;
										swipeScroll.touches.touchstart.x = -1;
										swipeScroll.touches.direction = "undetermined";
									} else if (swipeScroll.touches.touchstart.x > -1 && swipeScroll.touches.touchmove.x > -1 && swipeScroll.touches.direction==="x") {

										if(Math.abs(swipeScroll.touches.touchmove.x-swipeScroll.touches.touchstart.x)>swipeScroll.options.distance) {
											if(swipeScroll.touches.touchstart.x < swipeScroll.touches.touchmove.x) {
												swipeScroll.up();

											} else {
												swipeScroll.down();

											}
										}
										swipeScroll.touches.touchstart.y = -1;
										swipeScroll.touches.touchstart.x = -1;
										swipeScroll.touches.direction = "undetermined";
									}
								}
							default:
								break;
						}
					}
				}
			},
			down: function() {
				if(index<=heights.length-1) {
					if(atBottom() && index<heights.length-1) {

						index++;
						animateScroll(index,false,true);
					} else {
						if(Math.floor(elements[index].height()/$(window).height())>interstitialIndex) {

							interstitialScroll(parseInt(heights[index])+($(window).height()*interstitialIndex));
							interstitialIndex += 1;

						} else {
							interstitialScroll(parseInt(heights[index])+(elements[index].height()-$(window).height()));
						}

					}
				}
			},
			up: function() {
				if(index>=0) {
					if(atTop() && index>0) {

						index--;
						animateScroll(index,false,true);
					} else {

						if(interstitialIndex>2) {

							interstitialIndex -= 1;
							interstitialScroll(parseInt(heights[index])+($(window).height()*interstitialIndex));

						} else {

							interstitialIndex = 1;
							interstitialScroll(parseInt(heights[index]));
						}
					}

				}
			},
			init: function() {
				if (document.addEventListener) {
					document.addEventListener('touchstart', swipeScroll.touchHandler, false);	
					document.addEventListener('touchmove', swipeScroll.touchHandler, false);	
					document.addEventListener('touchend', swipeScroll.touchHandler, false);
				}
			}
		};


		util = {
			handleResize:function() {
				clearTimeout(timeoutId2);
				timeoutId2 = setTimeout(function() {
					sizePanels();
					calculatePositions(true);
					settings.afterResize();
				},400);
			}
		};
		settings = $.extend(settings, options);

		sizePanels();

		calculatePositions(false);

		if(true===hasLocation) {
			animateScroll(index,false,true);
		} else {
			animateScroll(0,true,true);
		}

		manualScroll.init();
		swipeScroll.init();

		$(window).bind("resize",util.handleResize);
		if (document.addEventListener) {
			window.addEventListener("orientationchange", util.handleResize, false);
		}

		function interstitialScroll(pos) {
			if( jQuery().velocity ) {
				// Animate using Velocity!
				$(settings.target).stop().velocity('scroll', {
					duration: settings.scrollSpeed,
					easing: settings.easing,
					offset: pos,
					mobileHA: false
				});
			} else {
				// Fallback to jQuery animate
				$(settings.target).stop().animate({
					scrollTop: pos
				}, settings.scrollSpeed,settings.easing);
			}
			/*
			$(settings.target).velocity({
				scrollTop: pos
			}, settings.scrollSpeed,settings.easing);*/
			/*
			$(settings.target).stop().animate({
				scrollTop: pos
			}, settings.scrollSpeed,settings.easing);*/
		}

		function sizePanels() {
			$(settings.section).each(function(i) {
				if(settings.setHeights) {
					if($(this).css("height","auto").outerHeight()<$(window).height()) {
						$(this).css({"height":$(window).height()});

						overflow[i] = false;
					} else {
						$(this).css({"height":$(this).height()});

						overflow[i] = true;
					}
				} else {
					if($(this).outerHeight()<$(window).height()) {
						overflow[i] = false;
					} else {
						overflow[i] = true;
					}
				}
			});
		}
		function calculatePositions(resize) {
			$(settings.section).each(function(i){
				if(i>0) {
					heights[i] = parseInt($(this).offset().top) + settings.offset;
				} else {
					heights[i] = parseInt($(this).offset().top);
				}
				if(settings.sectionName && $(this).data(settings.sectionName)) {
					names[i] = "#" + $(this).data(settings.sectionName).replace(/ /g,"-");
				} else {
					names[i] = "#" + (i + 1);
				}

				elements[i] = $(this);

				if($(names[i]).length && window.console) {
					console.warn("Scrollify warning: Section names can't match IDs on the page - this will cause the browser to anchor.");
				}
				/*
				if(window.location.hash===names[i]) {
					index = i;
					hasLocation = true;
				}*/
				if(currentSectionID===names[i]) {		// Angular Fix
					index = i;
					hasLocation = true;
				}

			});

			if(true===resize) {
				animateScroll(index,false,false);
			} else {
				settings.afterRender();
			}
		}

		function atTop() {
			top = $(window).scrollTop();
			if(top>parseInt(heights[index])) {
				return false;
			} else {
				return true;
			}
		}
		function atBottom() {
			top = $(window).scrollTop();
			if(top<parseInt(heights[index])+(elements[index].height()-$(window).height())) {
				return false;
			} else {
				return true;
			}
		}
	}

	
	function move(panel,instant) {
		var z = names.length;
		for(;z>=0;z--) {
			if(typeof panel === 'string') {
				if (names[z]===panel) {
					index = z;
					animateScroll(z,instant,true, true);
				}
			} else {
				if(z===panel) {
					index = z;
					animateScroll(z,instant,true);
				}
			}
		}
	}
	$.scrollify.move = function(panel) {
		if(panel===undefined) {
			return false;
		}
		move(panel,false);
	};
	$.scrollify.instantMove = function(panel) {
		if(panel===undefined) {
			return false;
		}
		move(panel,true);
	};
	$.scrollify.next = function() {
		if(index<names.length) {
			index += 1;
			animateScroll(index,false,true, true);
		}
	};
	$.scrollify.previous = function() {
		if(index>0) {
			index -= 1;
			animateScroll(index,false,true, true);
		}
	};
	$.scrollify.instantNext = function() {
		if(index<names.length) {
			index += 1;
			animateScroll(index,true,true, true);
		}
	};
	$.scrollify.instantPrevious = function() {
		if(index>0) {
			index -= 1;
			animateScroll(index,true,true, true);
		}
	};
	$.scrollify.destroy = function() {
		$(settings.section).each(function() {
			$(this).css("height","auto");
		});
		$(window).unbind("resize",util.handleResize);
		if(settings.scrollbars) {
			$(window).unbind('mousedown', manualScroll.handleMousedown);
			$(window).unbind('mouseup', manualScroll.handleMouseup);
			$(window).unbind('scroll', manualScroll.handleScroll);
		}
		$(document).unbind('DOMMouseScroll mousewheel',manualScroll.wheelHandler);
		$(document).unbind('keydown', manualScroll.keyHandler);

		if (document.addEventListener) {
			document.removeEventListener('touchstart', swipeScroll.touchHandler, false);	
			document.removeEventListener('touchmove', swipeScroll.touchHandler, false);	
			document.removeEventListener('touchend', swipeScroll.touchHandler, false);
		}
		heights = [];
		names = [];
		elements = [];
		overflow = [];
		currentSectionID = null;
		firstLoad = true;
		index = 0;
	};
	$.scrollify.update = function() {
		util.handleResize();
	};
	$.scrollify.current = function() {
		return elements[index];
	};
	$.scrollify.disable = function() {
		disabled = true;
	};
	$.scrollify.disableNearest = function () {
		manualScroll.calculateNearest  = function () {}
	};
	$.scrollify.disableSwipe = function () {
		document.removeEventListener('touchstart', swipeScroll.touchHandler, false);	
		document.removeEventListener('touchmove', swipeScroll.touchHandler, false);	
		document.removeEventListener('touchend', swipeScroll.touchHandler, false);
	}
	$.scrollify.enableSwipe = function () {
		swipeScroll.init();
	};
	$.scrollify.enableNearest = function () {
		manualScroll.calculateNearest = function() {
			top = $(window).scrollTop();
			var i =1,
				max = heights.length,
				closest = 0,
				prev = Math.abs(heights[0] - top),
				diff;
			for(;i<max;i++) {
				diff = Math.abs(heights[i] - top);

				if(diff < prev) {
					prev = diff;
					closest = i;
				}
			}
			if(atBottom() || atTop()) {
				index = closest;
				animateScroll(closest,false,true, true);
			}
		}
	};
	$.scrollify.enable = function() {
		disabled = false;
	};
	$.scrollify.isDisabled = function() {
		return disabled;
	};
	$.scrollify.setOptions = function(updatedOptions) {
		if(typeof updatedOptions === "object") {
			settings = $.extend(settings, updatedOptions);
			util.handleResize();
		} else if(window.console) {
			console.warn("Scrollify warning: Options need to be in an object.");
		}
	};
}));
