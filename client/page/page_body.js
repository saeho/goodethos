var section_class = 'content-block content'
var init_load, init_elems, denied_elems, uploader // These are declared inside created function

/*
	## Content Blocks
	Every Page document's body of content is an array of different content types.

	i.e.
	[{
		type: 'text',
		value: 'ABC DEF GHI JKL, ETC...'
	},{
		type: 'img',
		...
	},{
		type: 'gallery',
		...
	}]

	They are rendered in an #each loop.
	When I want to add something to middle of the body, I simply push it to the desired location.
	i.e. If I want a new image after the first text block, I add it to the body's 1 (2nd) position.
*/
Template.page_body.helpers({
	body: function() {
		var data = Template.parentData()
		var page = data.page

		if( !page._id || !page.organization || !page.content.body || !page.content.body.length) return []

		var edit_mode = page.status>0 && page.status<4
		var page_id = page._id
		var page_type = page.info.type
		var page_body = page.content.body

		var body = _.map( page_body, function( content, index){
			if( _.contains(['text','gallery','img','vimeo','youtube'], content.type)) {
				content.o_id = page.organization
				content.page_id = page_id
				content.page_type = page_type
				content.edit_mode = edit_mode
				content.block_index = index

				// Template: Every content type has its own template.
				content.template = Template['page_body_'+( _.contains( ['vimeo','youtube'], content.type) ? 'video' : content.type)]

				return content
			}
		})
		return body
	}
})

Template.page_body.created = function() {
	// Declarations
	init_load = false
	init_elems = []
	denied_elems = []
	uploader = new ge_uploader()

	// Empty Content Error Fix
	var data = Template.currentData()
	var body = GE_Help.nk( data, 'page.content.body')
	if (!body || !body.length) {
		var new_body = {
			'content.body': [{
				key: GE_Help.random_string(12),
				type: 'text',
				value: '<p></p>'
			}]
		}
		Meteor.call('updatePage', data.page._id, new_body)
	}

	/*
		## ge_js.gallery()
		In the Story posts, galleries are a group of images in unknown heights and widths.
		In order to align these unknown sized images perfectly, I created a function that does some
		basic math to figure out what height they need to be at in order to fit 100% of container width.

		This function is ran at Template.rendered(); $(window).resize(); and also when the side (left) nav opens/closes.
	*/
	this.gallery_resizer = function(){
		Meteor.setTimeout( function(){
			GE_Gallery()
		}, 500)
	}
}

Template.page_body.rendered = function() {
	init_load = true
	$(window).resize( this.gallery_resizer)

	// This is needed for published stories, but for draft mode stories, it's not needed
	var action = Router.current().params._action || 'view'
	if( action!='edit')
		GE_Gallery()
}
Template.page_body.destroyed = function() {
	$(window).off( 'resize', this.gallery_resizer)
}


// ## TEXT Content Block
Template.page_body_text.helpers({
	attr: function(){
		var attr = this.edit_mode
		? {
			'data-type': this.type,
			'contenteditable': true,
		} : {}
		attr.class = section_class+'-wrapper area-placeholder'
		attr.id = this.key || GE_Help.random_string(12)
		return attr
	},
	content: function(){
		// If in edit-mode, return NULL no matter what.
		// Instead of relying on Meteor reactivity, do it manually using the autorun from page_story.js
		var action = Router.current().params._action
		if( action=='edit') return null

		var html = /<|>/.test(this.value) && this.value!='<br>' ? this.value : '<p>'+this.value+'</p>'
		return html
	},
})

Template.page_body_text.events({
	keyup: function(e,t){
		if (t.data.edit_mode){
			var timestamp = Date.now()
			t.$('.content-block').data('ts', timestamp)
		}
	}
})

// ## IMG Content Block
Template.page_body_img.helpers({
	attr: function(){
		var attr = this.edit_mode
		? {
			'data-type': this.type,
			'data-style': this.style,
		} : {}
		attr.class = section_class+'-img '+this.style
		attr.id = this.key || GE_Help.random_string(12)
		return attr
	},
	lct: function() {
		/*
			## LCT
			lct is the tiny buttons that hover on top of the image/gallery for things such as "delete", "change image", etc.
		*/
		if( this.edit_mode) {
			// Buttons inside LCT
			var buttons = ['remove', 'img']
			if( this.page_type!='blog')
				buttons.push(this.style=='big' ? 'img_medium' : 'img_big')

			return {
				extra_html: '<input id="input-'+this.key+'" type="file" class="hide s3-img" data-index="'+this.block_index+'"/>',
				buttons: buttons,
				key: this.key
			}
		} else return false
	},
	img: function() {
		if ( _.isObject(this.src) && this.src.key ) {
			var new_imgs = Session.get('new_imgs')
			var key = this.src.key
			var img = { id: key }
			img_url = ge.responsive_img( this.src, ( this.edit_mode ? 'big' : this.style)) // Find appropriate image size for mobile/tablet/desktop

			/*
				If the image hasn't been uploaded to 100% yet, then the <IMG> SRC will be null
				Because if I return the <IMG> SRC before upload finishes, it will create a broken image.
			*/
			if( _.contains( init_elems, key) || _.contains( new_imgs, key)){
				// Has already be initialized or this is the first time this page was loaded
				img.src = img_url
			}
			return img
		}
		return false
	},
})

Template.page_body_img.created = function(){
	var t = Template.currentData()
	var src = t.src
	if( src.key && src.medium && !init_load) init_elems.push( t.src.key )
}


// ## VIDEO Content Block
Template.page_body_video.helpers({
	attr: function() {
		var attr = this.edit_mode
		? {
			'data-type': this.type,
			'data-raw': GE_Help.strip_tags( this.value),
		} : {}
		attr.class = section_class+'-video'
		attr.id = this.key || GE_Help.random_string(12)
		return attr
	},
	lct: function() {
		if( this.edit_mode) {
			// Buttons inside LCT
			return {
				buttons: ['remove'],
				key: this.key
			}
		} else return false
	},
	content: function() {
		if ( this.type=='youtube') {
			return {
				src: '//www.youtube.com/embed/'+this.value,
				frameborder: 0,
				allowfullscreen: true
			}
		} else if ( this.type=='vimeo') {
			return {
				src: '//player.vimeo.com/video/'+this.value+'?title=0&byline=0&portrait=0',
				frameborder: 0,
				webkitallowfullscreen: true,
				mozallowfullscreen: true,
				allowfullscreen: true,
			}
		} else {
			return false
		}
	}
})


// ## Gallery
Template.page_body_gallery.helpers({
	attr: function() {
		var attr = this.edit_mode
		? {
			'data-type': this.type,
			'data-style': this.style,
			'data-index': this.block_index,
		} : {}
		attr.class = section_class+'-gallery clear gallery-'+this.style+(!this.group || this.group.length<=0 ? ' is-empty' : '')
		attr.id = this.key || GE_Help.random_string(12)
		return attr
	},
	init: function() {
		return !init_load
	},
	gallery: function() {
		// Constants
		var new_imgs = Session.get('new_imgs')
		var page_id = this.page_id
		var block_index = this.block_index
		var gallery_item_class = 'relative gallery-item '
		if( !this.edit_mode) gallery_item_class += 'trigger '
		var edit_mode = this.edit_mode
		var key = this.key

		var group = _.filter( this.group, function(item){
			var src = item.src
			var was_init = _.contains(init_elems, src.key)
			var was_denied = _.contains(denied_elems, src.key)

			return was_init || (init_load && src.key && !was_denied)
		})
		var gallery_length = group ? _.size(group) : 0

		if( gallery_length>0 ) {
			var gallery = _.map( group, function( item, index){

				var big_url = ge.responsive_img( item.src, 'big')
				item.ic_data = edit_mode ? { style: item.style } : false

				// Set <FIGURE>
				item.attr = {
					id: item.key || GE_Help.random_string(12),
					class: gallery_item_class+(item.style || 'table'),
					'data-value': big_url,
					'data-index': block_index,
					'data-order': index,
					'data-title': item.value ? encodeURI(item.value.title) : '',
					'data-desc': item.value ? encodeURI(item.value.desc) : '',
				}
				if( edit_mode) item.attr['data-style'] = item.style || 'normal'

				if( init_load && $('#'+item.key).length)
					item.attr.style = $('#'+item.key).attr('style')
				else if( !$('#'+item.key).length)
					item.attr.style = 'display: none;' // Template.rendered will handle this later

				// Set <IMG>
				item.img = { id: item.src.key }

				if ((_.contains( init_elems, item.src.key) || _.contains( new_imgs, item.src.key)) && big_url) {
					item.img.src = ge.responsive_img( item.src, 'medium') // Small is too small, even if it isn't stand-alone
					item.img.class = 'loaded'
				}
				return item
			}) // END : MAP
		}
		return {
			items: gallery || false,
			edit_mode: edit_mode
		}
	},
})

Template.page_body_gallery.events({
	'click .gallery-item .x': function(e,t) {
		if( t.data.edit_mode) {
			var elem = $(e.currentTarget)
			var parent_elem = elem.closest('.gallery-item')
			var delete_key = parent_elem.attr('id')

			var container_elem = elem.closest('.content-block')
			var container_id = container_elem.attr('id')
			var block_index = $('#page-'+t.data.page_type+'-body').find(container_elem).index()

			if( delete_key && !isNaN(block_index) && block_index>=0) {
				// Not saving rest of content
				$('#if-form').attr('style','').removeClass('on') // Manually reset the if-form

				Meteor.call('popGalleryItem', t.data.page_id, delete_key, block_index, function() {
					Session.set('saving',false)
				})
			}
		}
	},
	'click .gal-add': function(e,t) {
		if( t.data.edit_mode) {
			var parent = $(e.target).closest('.content-gallery')
			var input = parent.find( '#input-'+parent.attr('id'))
			input.data('order', parent.find('.gal-add').index( $(e.currentTarget))+1 )
			input.trigger('click')
		}
	},
	'change .gal-img': function(e,t) {
		/*
			Add a new item to the gallery
		*/
		if( t.data.edit_mode) {
			var container = $(e.target).closest('.content-block')
			var order = $(e.currentTarget).data('order')

			var args = {
				id: t.data.page_id,
				o_id: t.data.o_id,
				page_type: t.data.page_type,
				func: 'push',
				img_type: 'group',
				order: order,
				index: $(e.currentTarget).data('index'),
				value_elem: '.gallery-item',
			}
			$('#if-form').attr('style','').removeClass('on') // Manually and lazily reset the if-form
			var uploader = new ge_uploader()
			var upload_res = uploader.img( e.currentTarget, args, function(){
				ge.wait_for_dom( function(){
					GE_Gallery()
					var test = $('.content-gallery .loading-master')
					return !test.length
				}, function(){
					// Do Nothing
				}, 700, 10000)
			})
			// TODO: JQuery shouldn't be used here. Use Reactive UI Library.
			if (upload_res) container.append('<div class="abs-full loading-master dim"><span class="loading spin-inifinite"></span></div>')
		}
	},
	'click .gal-break': function(e,t) {
		if( t.data.edit_mode) {
			var elem = $(e.currentTarget).closest('.gallery-item')
			var cur = elem.data('style')

			// Currently only allowing one of 2 styles
			if( cur=='break') elem.data('style','normal').removeClass('break')
			else elem.data('style','break').addClass('break')

			GE_Gallery()
			$(e.currentTarget).toggleClass('on')
		}
	},
	'click .gallery-item .trigger, click .gallery-item.trigger': function(e,t) {
		var container = $(e.target).closest('.content-block')
		var selector = '.gallery-item'
		var elem = $(e.currentTarget).closest( selector)
		var elem_id = elem.attr('id')

		if( elem.find('img').attr('id')) {
			// If gallery item doesn't have an image inside, don't proceed
			Session.set('popup', {
				template: 'popup_media',
				class: 'fade-in fixed-full bg-popup',
				data: {
					page_id: t.data.page_id,
					page_type: t.data.page_type,

					edit_mode: t.data.edit_mode,
					images_only: true, // Only accepting images right now for stories
					selector: selector, // Class that is groups all the media items together
					key: elem.find('img').attr('id'), // Key of img or item to be replaced
					key_item: elem_id, // Key of item

					index: $('.content-block').index( container), // Block index number
					order: container.find('.gallery-item').index(elem), // Index number inside block
					order_nav: $(selector).index( elem), // Index number among all selectors, used for L/R navigation

					value: elem.data('value'),
					title: elem.data('title'),
					desc: elem.data('desc'),
					type: elem.data('type') || 'img', // Only accepting images right now for stories
				}
			})
		}
	}
})

Template.page_body_gallery.created = function(){
	var t = Template.currentData()

	if( t.group.length) {
		_.each( t.group, function( item){
			var src = item.src || {}
			if( src.key && src.medium)
				init_elems.push(src.key)
			else if( src.key)
				denied_elems.push(src.key)
		})
	}
}

// ## LCT
Template.page_body_lct.helpers({
	buttons: function() {
		if( this.buttons)
			return ge.layout_options('round ltc-%id% tooltip tooltip-fixed down transition-none', this.buttons, this.key)
		return false
	},
	ltc_attr: function() {
		var ltc_attr = {
			class: 'layout-controls',
			'data-area': this.key,
		}
		if( this.ltc_id) ltc_attr.id = this.ltc_id.replace('#','')
		return ltc_attr
	}
})

Template.page_body_lct.rendered = function(){
	var t = Template.currentData()
	var elem_id = t.ltc_id || '#'+t.key+' .layout-controls'
	init_elems.push(elem_id)

	this.FTA = new GE_FixedToAbs(elem_id, { $area: $('#'+t.key) })
	this.scrollFunc = (function(){
		this.FTA.calc()
	}).bind(this)

	var scrollFunc = this.scrollFunc
	Meteor.setTimeout(function() {
		// Do it once when the page loads
		// Then let the window.scroll to do the rest
		scrollFunc()
		$(window).on('scroll', scrollFunc)
	}, 100) // Wait for dynamic stuff to finish - i.e. GE_Canvas
}

Template.page_body_lct.destroyed = function(){
	$(window).off('scroll', this.scrollFunc)
}

// ## Image Controls
Template.img_controls.helpers({
	break: function(){
		return this.break || this.style=='break' ? 'on' : null
	},
	caption: function(){
		if( this.caption) return 'on'
		return null
	},
})

Template.img_controls.events({
	'mouseover .x': function(e,t) {
		t.$('.img-editor').addClass('delete')
	},
	'mouseout .x': function(e,t) {
		t.$('.img-editor').removeClass('delete')
	},
})
