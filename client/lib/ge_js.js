/**
 *
 * ge_js.js
 * Collection of useful/common front-end JS classes.
 *
 *
 * # # # # # # # # # # # # # # # # # # # # # # # # # # # #
 * GE_FixedToAbs()
 * Make the element "position: fixed" or "position: absolute"
 * depending on whether or not the element is inside its target area element
 * # # # # # # # # # # # # # # # # # # # # # # # # # # # #
 */
GE_FixedToAbs = function(el, args){
	this.$el = $(el)

	var defaults = {
		$area: false, // If false, rely on $.data()
		buffer: 18, // Buffer
	}
	var args = _.isObject(args) ? _.defaults(args, defaults) : defaults
	_.extend(this, args)

	// If no area is defined, exit
	if(!this.$area && this.$el.data('area'))
		this.$area = $(this.$el.data('area'))
	else if(!this.$area)
		return false

	// In edit mode, #nav-gateway is fixed so we have to account for this.
	// Currently GE_FixedToAbs is only used in edit-mode, but that may change later.
	this.menu_ht = $('#nav-gateway').length ? $('#nav-gateway').innerHeight() : 0
	this.buffer += this.menu_ht

	// Find height of elem
	this.buffer += this.$el.height()
}

GE_FixedToAbs.prototype = {
	calc: function(){
		var st = $(window).scrollTop()
		var ot = this.$area.offset().top
		var area_ht = this.$area.outerHeight()
		var target_bottom = Math.max(5, (ot + area_ht - this.buffer))

		if (st < target_bottom && st > (ot - this.menu_ht))
			this.$el.addClass('fixed').attr('style','')
		else if (this.$el.attr('style')=='' && st > ot)
			this.$el.removeClass('fixed').attr('style','top: '+(area_ht - this.buffer + this.menu_ht)+'px;')
		else
			this.$el.removeClass('fixed')
	},
}

/**
 * GE_Canvas()
 * Make the element height always equal to size of browser
 * Has cross-platform support for Android/iOS/Web App
 *
 * Note: Android has browser address bar that hides/appears itself.
 * This causes inconsistent browser height when scrolling.
 * This class takes that into cosideration.
 *
 * Behaviour is similar to CSS 100vh.
 */
GE_Canvas = function(el, args){
	this.$el = $(el)

	var defaults = {
		mobile_nav: $('#mobile-gateway'), // Any element that is fixed in mobile browsers
		adjust: 0, // Adjustment to calculated height
		min_height: false // Change "height" or "min-height"
	}
	var args = _.isObject(args) ? _.defaults(args, defaults) : defaults
	_.extend(this, args)

	this.css_style = this.min_height ? 'min-height' : 'height'
}

GE_Canvas.prototype = {
	/**
	 * Calculate what the height of the element should be.
	 * Based on the device type, adjustment value and the height of the browser.
	 */
  calc: function(){
		var height = Meteor.Device.isPhone()
			? this.find_absolute()
			: $(window).innerHeight()

		if(_.isNumber(this.adjust))
			height = height + this.adjust

		this.$el.css(this.css_style, height+'px')
	},
	/**
	 * Cross Platform Support for Android
	 * Ignore the browser resize caused by address bar show/hide
	 * and return true absolute height of browser.
	 */
	find_absolute: function(){
		if(!_.isNumber(this.canvas_ht)){
			var nav_height = this.mobile_nav.height()
			this.canvas_ht = Math.max($(window).innerHeight(), $(window).innerWidth())

			if(nav_height && _.isNumber(nav_height))
				this.canvas_ht -= nav_height
		}
		return this.canvas_ht
	},
}






/**
 * GE_Gallery()
 * Fit images horizontally in a row.
 * Do some math to figure out what height all the images need to be and then apply it to all the images so they fit evenly in a row.
 */
GE_Gallery = function(args){
	var defaults = {
		gallery: '.content-gallery',
		selector: '.gallery-item',
	}
	var args = _.isObject(args) ? _.defaults(args, defaults) : defaults

	$gallery = $(args.gallery)
	$selector = $(args.gallery).find(args.selector)

	if ($gallery.length && $selector.length && !$gallery.find('img:not([src])').length) {
		var max_width = Number($gallery.css('width').replace('px',''))
		var margin = Number($selector.css('marginTop').replace('px','')) + Number($selector.css('marginBottom').replace('px',''))

		// Declarations
		var row = [], row_max = 0, counter = 0, max_per_row = Meteor.Device.isPhone() ? 3 : 4

		var organize_func = function(elem, img, i, gCount) {
			var multiplier = 1000/img.height
			this_width = (multiplier * img.width)
			this_height = (multiplier * img.height)

			if(isNaN( this_width)) {
				this_width = 0
				this_height = 0
				counter--
				elem.hide()
				// TODO : Delete error items in gallery from DB (this could happen by faulty uploads)
			}
			row.push({
				width: this_width,
				height: this_height,
				elem: elem
			})
			row_max += this_width

			if( ++counter==max_per_row || elem.hasClass('break') || gCount==(i+1)) {
				var temp_width_memory = 0
				var row_max_width = max_width - margin*counter

				_.each( row, function(item, this_index){
					var multiplier = row_max_width/row_max
					calc_width = Math.round(item.width * multiplier)
					if( !this_index) calc_height = Math.round(item.height * multiplier)

					// Sometimes rounding up/down offsets the end of container by 1 or 2 pixels.
					// To avoid this, I'm checking to see if this gallery item was the last item in the row.
					// If it was, calculate the width by doing "max" - "width so far"
					if ((calc_width + temp_width_memory + 4) > row_max_width)
						calc_width = row_max_width - temp_width_memory

					if( calc_width>0)
						item.elem.attr('style', 'width: '+calc_width+'px; height: '+calc_height+'px;').show()
					else
						item.elem.hide()

					temp_width_memory += calc_width
				})
				// Reset
				row = [], counter = 0, row_max = 0
			}
		}

		$gallery.each( function(){
			var $gItems = $(this).find(args.selector)
			var $gImgs = $(this).find(args.selector+' img')

			// Reset before each loop
			row = [], row_max = 0, counter = 0

			var backup_timeout = null
			var organize_finish = function(all_sizes, force) {
				if ($gImgs.length==_.size(all_sizes) || force) {
					// Wait until all images are loaded
					$gImgs.each( function( func_i ){
						organize_func( $($gItems[func_i]), all_sizes['size'+func_i], func_i, $gItems.length )
					})
					$gallery.find('.loading-master').remove()
					if (backup_timeout) Meteor.clearTimeout(backup_timeout)
				}
			}

			var preloaded = true
			var img_sizes = {} // Do not use an array.push() for img_sizes array, onload() order is not guaranteed to be in order
			$gImgs.each(function(img_order ){
				var width = this.naturalWidth
				if(width) {
					// This will only work if browser is modern (NOT IE) and if the pictures are already loaded
					img_sizes['size'+img_order] = { width: width, height: this.naturalHeight } // This is an already rendered element
				} else if ($(this).hasClass('hidden')) {
					// Elements with class "hidden" is queued for delete so they shouldn't be calculated
					img_sizes['size'+img_order] = { width: 0, height: 0 }
				} else {
					preloaded = false
					var img = new Image()
					img.src = $(this).attr('src')

					img.onload = function(){
						img_sizes['size'+img_order] = { width: this.width, height: this.height }
						organize_finish(img_sizes)
					}
					img.onerror = function(){
						img_sizes['size'+img_order] = { width: 0, height: 0 }
						organize_finish(img_sizes)
					}
				}
			}) // Check if image is rendered already, then appropriately get the width of image

			if( preloaded) organize_finish(img_sizes)
			else {
				backup_timeout = Meteor.setTimeout( function(){
					// If for whatever reason, images are not loaded/calculated in 7 seconds, force the alignment
					organize_finish( img_sizes, true, $gImgs)
				}, 7000)
			}
		}) // END: Master Loop
	} return false
}
