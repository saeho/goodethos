
// Helpers
Template.page_blog.helpers({
	edit_mode: function(){
		return this.page.status>0 && this.page.status<4
	},
	editor: function(){
		if( this.page.status>0 && this.page.status<4){
			var toolbar = [
				'bold', 'i', 'u', // Inline Formatting
				'a', // Anchor Formatting
				//'break', // Does nothing, just adds a thin line as a separator
				'h2', 'h3', // Heading Formatting
				'blockquote', // Pullquote Formatting
			]
			return {
				toolbar: toolbar,
				//new_block_bar: ['toolbar','img','video','gallery'] // When gallery is ready, bring this back
				new_block_bar: ['toolbar','img','video']
			}
		}
	},
})

// Events
Template.page_blog.events({
	'click .ltc-on_top_true, click .ltc-on_top_false': function(e,t) {
		if(t.data.page.status>0 && t.data.page.status<4) {
			var elem_id = $(e.currentTarget).data('area')
			if (elem_id ) {
				var elem = $('#'+elem_id)

				var newData = elem.hasClass( 'on_top_false')
				var newClass = newData ? 'on_top_true' : 'on_top_false'
				var oldClass = newData ? 'on_top_false' : 'on_top_true'

				elem.removeClass('on_top_true on_top_false').addClass(newClass).data('ot', newData)

				// Update the tooltip
				var switched_button = ge.layout_options( null, [oldClass] )
				switched_button = switched_button[0].attr

				$(e.currentTarget).data('tooltip', switched_button['data-tooltip'])
					.removeClass('ltc-on_top_true ltc-on_top_false')
					.addClass( oldClass.replace('on_top_','ltc-on_top_'))
				$('#tooltip-info').removeClass('on')
			}
		}
	},
	'click #ifb-gallery': function(e,t) {
		if(t.data.page.status>0 && t.data.page.status<4) {
			// Do this for blogs too
		}
	}
})


Template.page_blog.created = function(){

	// Basic Setups
	this.action = Router.current().params._action
	this.editor = new ge_editor({
		page_type: this.data.page.info.type,
		page_id: this.data.page._id,
	})
	this.uploader = new ge_uploader()
	this.subscribe('futureImages')

	// Page Edit Mode
	var layout = this.data.page.layout
	layout.nav_class = 'nav-white-perm'

	if( this.action=='edit')
		layout.fixed = true

	Session.set('layout', layout)

	// Autoruns
	this.autorun( (function(){
		var data = Template.currentData()
		var status = data.page.status
		var edit_mode = status >0 && status<4
		var saving_img = Session.get('saving')
		this.editor.page_status = status

		if( edit_mode && _.isString( saving_img)) {
			var future_images = Images.find().fetch()
			var session = Session.get('new_imgs') || []

			var new_imgs = []
			_.each( future_images, function( img){
				// These 3 sizes are the most commonly used.
				// Full and Thumbs aren't normally used so don't check them.
				if( _.contains( session, img._id) || (img.hasStored('big') && img.hasStored('medium') && img.hasStored('small'))) new_imgs.push( img._id)
			})

			var diff = _.difference( new_imgs, session)
			if( diff.length){
				// To avoid unnecessary reactivity, only set session if its not equal to previous state
				if( _.contains( diff, saving_img)){
					var filter = _.filter( diff, function( key){
						return key==saving_img
					})
					var union = _.filter( _.union( session, filter), function( key){
						return key!=null
					})
					Session.set('saving', false)
					Session.set('new_imgs', union)
				}
			}
		}
	}).bind(this))

	// Subscribe to Comments
	this.autorun( (function(){
		// Comments are always subscribed if in edit-mode, even if it is turned off
		if( GE_Help.nk( this.data,'page.info.comment') || this.action=='edit'){
			// Not using Meteor Template subscriptions because I do not want the page to wait for commenting subscription
			if( !this.comment_subscription){
				this.comment_subscription = Meteor.subscribe('comments', {
					_id: this.data.page._id,
				})
			}
		} else if( this.comment_subscription) {
			// Stop comment subscription if commenting is turned off
			this.comment_subscription.stop()
			this.comment_subscription = false
		}
	}).bind(this))
}

Template.page_blog.rendered = function(){
	this.editor.restructure()

	// Canvas the Body only, minus the header height
	var hHeight = $('#page-blog-header').innerHeight()
	var mTop = $('#page-blog-master').css('padding-top').replace('px','')
	var mBot = $('#page-blog-master').css('padding-bottom').replace('px','')
	var pTop = $('#page-blog-body').css('padding-top').replace('px','')
	var pBot = $('#page-blog-body').css('padding-bottom').replace('px','')
	var adjust =
		Number(hHeight)+Number(pTop)+Number(pBot)+Number(mTop)+Number(mBot)
		+ 38 // +38 is for footer

  this.canvas = new GE_Canvas('#page-blog-body', { adjust: -adjust, min_height: true })
	this.canvas_func = (function(){
		var check = $('#page-blog-master').innerHeight() < $(window).height()
		// Only do GE_Canvas if there is a need for it
		if(check)
			this.canvas.calc()
		else
			this.canvas.$el.attr('style', '')
	}).bind(this)
	this.canvas_func()
	$(window).on('resize', this.canvas_func)

	if( this.action=='edit'){
    // Non Reactive
    this.autorun( function(){
			var page = Template.currentData().page
			ge.non_reactive( page.content)
		})

		// Document Level Key Events
		this.key_func = (function(e){
			var cmd_plus = [
				82, // R
				83, // S
			]
			if ( _.contains( cmd_plus, e.keyCode) && (e.metaKey || e.ctrlKey) ) {
				// # # # # # # # #
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
				return false
			}
		}).bind(this)
		$(document).on('keydown', this.key_func)

		this.doc_save_func = (function(e){
			if( $(e.currentTarget).hasClass('special')) this.editor.save_state = this.editor.save()
		}).bind(this)
		$('#page-save').on('click', this.doc_save_func)
	} // END: page-edit

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

	// Loading Images
	ge.check_imgs('#page-'+this.data.page.info.type+'-body img', this.uploader, { wait_time: 30000 })

	// Unload Func (Do this in Rendered(), not Created())
	this.unload_func = (function(){
		var page = this.data.page
		var has_content = _.every( (GE_Help.nk( page, 'content.body') || [{}] ), function( block){
			var type = block.type || 'text'
			var val = (block.value || '').trim()
			return type!='text' || (val && val!='<p></p>')
		})
		var has_main = GE_Help.nk( page, 'content.img.0.key')
		var has_title = GE_Help.nk( page, 'content.title') || $('#page-title').text().trim().length
		var has_summary = GE_Help.nk( page, 'content.summary') || $('#page-summary').text().trim().length

		// Delete if it's an empty blog, save if it's not
		if( !has_title && !has_summary && !has_content && !has_main)
			Posts.remove( page._id )
		else if( page.status && page.status<4 && page.status>0 // Check if page is in draft mode
		&& page._id!=null && page._id==this.editor.page_id) // Check if page id matches the editor page id
			this.editor.save() // Save before exit (if there's no difference, save won't happen)
	}).bind(this)
	$(window).on('beforeunload', this.unload_func)
}

Template.page_blog.destroyed = function(){
	// Unload
	this.unload_func()

	// Reset
	delete Session.keys['new_imgs']
	Session.set('saving', false) // Always make sure save status is false before exiting
	this.unload_func = null
	this.editor = null

	// Off
	$('#page-save').off('click', this.doc_save_func)
	$(window).off('resize', this.canvas_func)
	$(window).off('beforeunload', this.unload_func)
	$(document).off('keydown', this.key_func)
}
