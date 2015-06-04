
// Reactive UI Helpers
Template.page_story.helpers({
	master_attr: function() {
		var edit_mode = this.page.status>0 && this.page.status<4
		var layout = this.page.layout

		// Return element attributes for master DOM element
		return {
			id: layout.style+'-master',
			class: (edit_mode ? 'edit-mode' : '')
		}
	},
	editor: function(){
		if( this.page.status>0 && this.page.status<4){
			// This is the editor for my "edit story" page.
			var toolbar = [
				'bold', 'i', 'u', // Inline Formatting
				'a', // Anchor Formatting
				//'break', // Does nothing, just adds a thin line as a separator
				'h2', 'h3', // Heading Formatting
				'h5', 'blockquote', 'h6' // Pullquote Formatting (I chose to use a different tag for Left/Right Pullquotes instead of using <blockquote class="LEFT/RIGHT">)
			]
			return {
				toolbar: toolbar,
				new_block_bar: ['toolbar','img','video','gallery','break']
			}
		}
	},
})

// Event Handlers
Template.page_story.events({
	'click .ltc-master': function(e,t) {
		if(t.data.page.status>0 && t.data.page.status<4) {
			var page_type = t.data.page.info.type,
			header_id = 'page-'+page_type+'-header'
			t.$('#tooltip-info').removeClass('on')

			Session.set('popup', {
				template: 'user_new_page',
				close: 'center shadow-soft',
				class: 'bg-popup-alt fade-in fixed-full edit-mode',
				data: {
					action: 'new_'+page_type,
					cur: t.data.page.layout.style,
					target: header_id,
				}
			})
		}
	},
	'click .ltc-img_medium, click .ltc-img_big': function(e,t) {
		if(t.data.page.status>0 && t.data.page.status<4) {
			//var elem_id = $(e.target).data('target')
			var elem_id = $(e.target).data('target')
			if (elem_id){
				var newSize = $(e.currentTarget).hasClass('ltc-img_medium') ? 'medium' : 'big'
				var oldSize = newSize=='medium' ? 'big' : 'medium'

				$('#'+elem_id).removeClass(oldSize).addClass(newSize).data('style', newSize)

				// Update the tooltip (the black bar with text that you see when you hover over icons)
				var switched_button = ge.layout_options( null, ['img_'+oldSize] )
				switched_button = switched_button[0].attr

				$(e.currentTarget).data('tooltip', switched_button['data-tooltip'])
					.removeClass('ltc-img_medium ltc-img_big')
					.addClass('ltc-img_'+oldSize)

				t.$('#tooltip-info').removeClass('on')
			}
		}
	},
	// Insert Gallery
	'click #ifb-gallery': function(e,t) {
		if(t.data.page.status>0 && t.data.page.status<4){
			/*
				## Insert a gallery content block to body
				Insert an empty gallery object to middle of the page Mongo doc.
				Then let Meteor's reactivity do the rest.
			*/
			var insert = {
				key : GE_Help.random_string(12), // Generate random Unique Key
				group : [],
				style : "table",
				type : "gallery" }

		/*
			When you push an empty gallery object to page document,
			It will trigger Meteor reactivity, therby updating any changes you made with old information (if the autosave hasn't happened yet.)

			To avoid that problem, I capture the latest text changes in the page and save MongoDB when pushing this new empty gallery object.
		*/
		var split_elems = t.editor.split_in_two( true)
		var page_data = t.editor.page_body( true)
		t.editor.new_block_hide()

		// wait_for_save() waits for any current autosaves/saves to finish before proceeding with this function
		ge.wait_for_save( function(){
			Meteor.call('splitPageBlock', t.data.page._id, insert, split_elems, function(err,res){
				Session.set('saving',false)
				t.editor.restructure(true)

				// This is not necessary because of Meteor Reactivity
				// But manually update the DOM with JQuery anyways in order to avoid ~.5 second stutter that will occur.
				var target_elem = $('#'+split_elems.key)
				if( target_elem.length)
					target_elem.html( split_elems.before)
			}) })
		}
	}
})

Template.page_story.created = function() {
	this.action = Router.current().params._action || 'view'
	this.editor = new ge_editor({ page_type: this.data.page.info.type, page_id: this.data.page._id })
	this.uploader = new ge_uploader()
	this.subscribe('futureImages')

	this.autorun( (function(){
		var data = Template.currentData()
		var status = data.page.status
		var edit_mode = status >0 && status<4
		var saving_img = Session.get('saving') // This session keeps track of any autosaves/saves or image uploads taking place.
		this.editor.page_status = status

		/*
			If "saving" session is a string, it's the Unique ID of the image being uploaded.
			If "saving" session is Boolean, it's a normal autosave.
		*/
		if( edit_mode && _.isString( saving_img)){
			/*
				## Future Images
				I use "new_imgs" session to figure out if there were any images uploaded.

				First, I subscribe to "futureImages" which returns any Images that were uploaded after the moment of subscription.
				I then compare the Unique ID inside my "new_imgs" session against the results of Images.find().fetch()

				This allows me to figure out if the image in question has been uploaded 100% or not.

				The reason why I do this is because when I update the Page document with an uploaded image,
				that will cause a broken image to render on screen (because data is faster than an image upload).

				So by using this subscription and session, I'm able to put a delay rendering the image or use a BLOB url until the image is 100% uploaded.
			*/
			var future_images = Images.find().fetch()
			var session = Session.get('new_imgs') || []

			var new_imgs = []
			_.each( future_images, function( img){
				if( _.contains( session, img._id) || (img.hasStored('big') && img.hasStored('medium') && img.hasStored('small')))
					new_imgs.push( img._id)
			})

			var diff = _.difference( new_imgs, session)
			if( diff.length){
				/*
					In order to avoid unnecessary activity caused by reactivity,
					only set session if its not equal to previous state
				*/
				if( _.contains( diff, saving_img)){
					var filter = _.filter( diff, function( key){
						return key==saving_img
					})
					var union = _.filter( _.union( session, filter), function( key){
						return key!=null
					})
					Session.set('saving', false) // Set saving to false to notify that save/upload is finished.
					Session.set('new_imgs', union) // Session that contains future images that has been uploaded to 100%
				}
			}
		}
	}).bind(this))

	// Subscribe to Comments
	this.autorun( (function(){
		// Comments are always subscribed if in edit-mode, even if it is turned off
		if( GE_Help.nk( this.data,'page.info.comment') || this.action=='edit'){
			/*
				## Comments Subscription
				For speed reasons, I do not use Template subscriptions for comments.
				This way, the page doesn't have to wait for comment subscription to be ready before rendering the page.
			*/
			if( !this.comment_subscription){
				this.comment_subscription = Meteor.subscribe('comments', {
					_id: this.data.page._id,
				})
			}
		} else if( this.comment_subscription){
			// Stop comment subscription if commenting is turned off
			this.comment_subscription.stop()
			this.comment_subscription = false
		}
	}).bind(this))
}

Template.page_story.rendered = function() {
	if( this.action=='edit'){
		/*
			## Non-Reactive
			Meteor's reactivity is great but it has a problem handling contenteEditable elements.
			I don't want to get into the problem here but if you're curious what that problem is, just let me know and I'll explain.

			To avoid this problem, I have made it so that all content is returned "null" when in edit-mode.
			Then, this autorun is used to manually update every DOM element using JQuery .html() function.
		*/
	  this.autorun( function(){
			var page = Template.currentData().page
			ge.non_reactive( page.content) // All content related information is contained in page.content object which holds the title, summary, and body.
	  })

		// Document Level Key Events
		this.key_func = (function(e){
			var cmd_plus = [
				82, // "R" Key
				83, // "S" Key
			]
			if ( _.contains( cmd_plus, e.keyCode) && (e.metaKey || e.ctrlKey) ) {
				// User presses CMD+ Key
				e.preventDefault()
				switch (e.keyCode){
					case 83: // Save
						if( !Session.get('saving')) this.editor.save_state = this.editor.save()
					break
					case 82: // Refresh
						// Should I allow refresh? Currently refresh attempt is denied.
					break
				}
				// Do toolbar buttons check
				this.editor.toolbar_button()
				return
			}
		}).bind(this)
		$(document).on('keydown', this.key_func)
	} // END: IF Edit-Mode

	this.editor.restructure()
	var $header = $('#page-'+this.editor.page_type+'-header')
	$header.data('layout', GE_Help.nk(this.data, 'page.layout.style')) // This is needed

	/*
		Every Page document has a layout object that contians some information about how the page should look.
		I save that information into a session called "layout" so that it can be used to trigger autoruns.

		Furthermore, "layout" session controls some of the layout information in other templates.
		For example, I use the "layout" session to hide header DOM, footer DOM, or set header to Fixed, etc.
	*/
	var layout = this.data.page.layout
	layout.nav_class = this.editor.header_class( layout.style ) // Extra nav class for this layout style/name
	layout.fixed = this.action=='edit' // If in edit-mode, set header to fixed.
	Session.set('layout', layout) // Save to session and use it to trigger autoruns or communicate with other Templates.

	this.canvas = new GE_Canvas('#page-story-header')
	this.canvas_func = (function(){
		this.canvas.calc()
	}).bind(this)

	this.autorun( (function() {
		var session = Session.get('layout') || {}
		/*
			## Canvas Function
			Some layouts have a special JS requirement where the header *must* be full height of the window.
			I created a function called "canvas" that calculates the height of the window and set the target DOM element's min-height to be equal.

			When the layout of the page changes, this autorun is used to either turn on/off the canvas function.
		*/
		if (session.style){
			if (_.contains(GE_canvas_layouts, session.style)){
				this.canvas.calc()
				$(window).on('resize', this.canvas_func)
			} else {
				this.canvas.$el.css('height','') // Leave the other style attributes alone
				$(window).off('resize', this.canvas_func)
			}

			if( session.style=='no-pic')
				$header.attr('style','') // This layout does not use background-image, so set background-image to null

			if( $header.data('layout')!=session.style){
				var setObj = {}
				setObj[ 'layout.style'] = session.style
				Posts.update( this.editor.page_id, { $set: setObj } )

				// Update Session so the header Template can change accordingly
				// i.e. Some layout styles require black header bar, some require white.
				session.nav_class = this.editor.header_class( session.style )
				session.fixed = this.action=='edit'
				Session.set('layout', session)
				$header.data('layout', session.style)
			}
		}
	}).bind(this))

	// Save Event Handler for DOM elements outside this Template
	this.doc_save_func = (function(e){
		if( $(e.currentTarget).hasClass('special')) this.editor.save_state = this.editor.save()
	}).bind(this)
	$('#page-save').on('click', this.doc_save_func)

	// If this is published (and editing), create popup message
	if( !Session.get('popup') && this.action=='edit' && this.data.page.status>=4) {
		// If editing and the page is published
		Session.set('popup', {
			template: 'user_aids_page_draft',
			style: 'middle',
			class: 'bg-dim fade-in fixed-full show-header',
			data: {
				page_type: this.data.page.info.type,
				page_id: this.data.page._id
			}
		})
	} else if( this.data.page.status>0 && this.data.page.status<4) {
		// Edit Mode
		this.editor.save_state = this.editor.page_body()
	}

	/*
		At the start of every page render, my check_imgs() function loops through all the request
		DOM elements and check to see if its SRC or CSS background-image URL is broken or not.

		If it's broken, this function will wait up to 30000 milliseconds for it to see if it's NOT broken.

		When the user visits this page while an image upload is taking place, they will see a broken
		image. To avoid this, my function refreshes the image once its loaded. It will give up after a
		specified wait_time if it really is broken.
	*/
	ge.check_imgs('#page-'+this.data.page.info.type+'-body img, #page-'+this.data.page.info.type+'-header', this.uploader, { wait_time: 30000 })

	/*
		## unload_func
		This function saves upon exiting the page.
		This function is triggered by Template.destroyed() and also $(window).beforeunload
	*/
	this.unload_func = (function(){
		if( GE_Help.nk( this.data, 'page.status') && this.data.page.status<4 && this.data.page.status>0 // Check if page is in draft mode
		&& GE_Help.nk( this.data, 'page._id')!=null && GE_Help.nk( this.data, 'page._id')==this.editor.page_id) // Check if page id matches the editor page id
			this.editor.save() // Save before exit (if there's no difference, save won't happen)
	}).bind(this)
	$(window).on('beforeunload', this.unload_func)
}

Template.page_story.destroyed = function() {
	var data = Template.currentData()

	// Save on Exit
	Meteor.clearTimeout( this.editor.autosave_timeout)
	this.unload_func()

	// Turn off ALL document level event handlers on Exit
	$('#page-save').off('click', this.doc_save_func)
	$(window).off('resize', this.canvas_func)
	$(window).off('beforeunload', this.unload_func)
	if( this.key_func) $(document).off('keydown', this.key_func)

	delete Session.keys['new_imgs'] // Delete Session for Future Images

	if( this.comment_subscription) this.comment_subscription.stop() // If subscribed to comments, stop it.
	Session.set('saving', false) // Set save status to false on exit

	this.unload_func = null
	this.editor = null
}
