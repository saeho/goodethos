
/* Header */
Template.header.helpers({
	layout: function() {
		var layout = Session.get('layout') || {}
		var nav_class = layout.nav_class || ''

		return {
			nav_class: nav_class
		}
	},
	// Page Session
	page: function() {
		var page = this.page
		if (!page) return false
		else if(_.isObject(page)){

			var edit_mode = Router.current().params._action=='edit'
			if( !edit_mode && this.share_url){
				var share_url = Meteor.absoluteUrl() + this.share_url
				var share_text = encodeURIComponent( this.page.content.title)
			} else {
				var share_url = false
				var share_text = false
			}

			var save = Session.get('saving')
			var author = Meteor.user(page.user)

			if( _.isString( save)) var save_text = 'Uploading'
			else var save_text = save ? 'Saving' : false

			return {
				_id: page._id,
				organization: page.organization,

				edit_mode: edit_mode,
				commenting: edit_mode ? false : page.info.comment,
				show_edit_url: page.user==Meteor.userId() && !edit_mode,
				share_url: share_url,
				share_text: share_text,

				type: _.contains(['story','event','blog'], page.info.type)
					? GE_Help.capitalize( page.info.type).replace('Blog', 'Blog Post')
					: false,
				author_name: ge.get_name(author) || 'Unknown',

				header: edit_mode
					? {
						save_status: save_text,
						timestamp: page.date.edited,
						last_saved: moment( page.date.edited ).fromNow().replace('a few seconds', 'few seconds'),
						published: page.status>=4 ? true : false
					} : false
			}
		}
		return true
	},
	comments: function() {
		var count = Comments.find().count()
		return count+' Comment'+( count>1 || count===0 ? 's' : '')
	},
})

/* Events */
Template.header.events({
	'mouseover .nav-by': function(){
		if( !$('body').hasClass('overflow')) $('#overlord').addClass('nav-hover')
	},
	'mouseout .nav-by': function(){
		$('#overlord').removeClass('nav-hover')
	},
	'click .share-social': function(e,t){
		e.preventDefault()
		var loc = $(e.currentTarget).attr('href')
		if (loc) window.open( loc, 'social_share_window', 'height=450, width=550, top='+($(window).height()/2 - 225) +', left='+$(window).width()/2 +', toolbar=0, location=0, menubar=0, directories=0, scrollbars=0')
	},
	'click #page-comments-button': function(e,t){
		var page = GE_Help.nk( t, 'data.page')
		var popup = Session.get('popup')

		if( _.isObject(page) && (!popup || popup.template!='user_aids_page_comments') && page._id) {
			Session.set('popup', {
				template: 'user_aids_page_comments',
				style: 'left',
				class: 'bg-dim fade-in fixed-full show-header',
				data: {
					page_id: page._id
				}
			})
		}
	},
	'click #page-settings-button': function(e,t){
		var page = GE_Help.nk( t, 'data.page')
		var popup = Session.get('popup')

		if( _.isObject(page) && (!popup || popup.template!='user_aids_page_settings') && page._id) {
			Session.set('popup', {
				template: 'user_aids_page_settings',
				style: 'right',
				class: 'bg-dim fade-in fixed-full show-header',
				data: {
					page_id: page._id
				}
			})
		}
	},
	'click #page-save': function(e,t){
		var page = GE_Help.nk( t, 'data.page')
		var popup = Session.get('popup')

		if( _.isObject(page) && (!popup || !_.contains( ['user_aids_page_draft','user_aids_page_publish'], popup.template))) {
			var page_type = page.info.type
			var page_id = page._id
			var do_pod = function(){
				var save_button = e.currentTarget
				if( page._id && page_type) {
					if( page.status>=4)
						var template_name = 'user_aids_page_draft' // Is published, set it to draft
					else if ( page.status>0)
						var template_name = 'user_aids_page_publish' // Is draft, set it to published
					else
						return false // Do nothing if deleted or if NOT in edit mode

					Session.set('popup', {
						template: template_name,
						style: 'middle',
						class: 'bg-dim fade-in fixed-full show-header',
						data: {
							page_type: page_type,
							page_id: page_id
						}
					})
				} // IF there is Page ID
			} // END : do_pod()

			var save = Session.get('saving')
			if( save){
				if( _.isString(save)){
					// If save session is a string, it's an image ID.
					// That could be a little long. So display a message.
					// If its a boolean just wait, that shouldn't take very long.
					Session.set('popup',{
						template: 'loading',
						data: { message: 'Waiting for image upload to finish...' },
						class: 'bg-dim fade-in fixed-full show-header',
					})
				}
				ge.wait_for_save( do_pod, false)
			} else {
				// There is no save taking place, just do pod
				do_pod()
			}
		}
	},
})

Template.header.rendered = function() {
	var elem = $('#overlord')
	var didScroll = false
	var lastScrollTop = 0
	var delta = 5
	var navbarHeight = 50 //elem.outerHeight()
	var up_down_interval = null
	var window_scroll_event = function(){ didScroll = true }

	this.autorun( function(){
		var layout = Session.get('layout') || {}
		if( layout.fixed) {
			document.removeEventListener('scroll', window_scroll_event)
			Meteor.clearInterval( up_down_interval)
			$('#overlord').removeClass('up down nav-switch')

		} else {
			document.addEventListener('scroll', window_scroll_event)
			up_down_interval = Meteor.setInterval(function() {
				if (didScroll) {
					// Begin Check
					var st = $(window).scrollTop()

					if(Math.abs(lastScrollTop - st) <= delta) { return }

					if (st > lastScrollTop && st > navbarHeight){
						// Scroll Down
						elem.removeClass('down').addClass('up')
						Meteor.setTimeout( function(){
							$('#page-share').addClass('fade-in').removeClass('fade-out')
							$('#page-share .share-social').show().addClass('pop-in').removeClass('pop-out-soft')
						}, 150)
					} else {
						// Scroll Up
						if(st + $(window).height() < $(document).height()) {
							elem.removeClass('up').addClass('down')
							$('#page-share').addClass('fade-out').removeClass('fade-in')
							$('#page-share .share-social').addClass('pop-out-soft').removeClass('pop-in')
						}
					}

					if (st>200) { elem.addClass('nav-switch') }
					else { elem.removeClass('nav-switch') }

					lastScrollTop = st
					// End Check

					didScroll = false
				}
			}, 350)
		}
	})
}
