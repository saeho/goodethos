
Template.GE_layout.helpers({
	nav_state: function() {
		var nav_state = Session.get('nav_state')
		var nav_mini = Meteor.Device.isPhone() || Meteor.Device.isTablet() ? '' : 'nav-mini'
		//var nav_mini = '' // DEVELOPMENT MODE

		if (nav_state=='none')
			return ''
		return nav_state ? 'nav-open' : nav_mini
	},
	display_popup: function() {
		// This check is necessary.
		// Upon false, it will destroy the popup_master template and run Template.destroyed() which contains the cleanup functions.
		return Session.get('popup') ? true : false
	},
	hide_header: function() {
		var layout = Session.get('layout')
		return _.isObject(layout) && layout.hide_header
	},
	hide_footer: function() {
		var layout = Session.get('layout')
		return _.isObject(layout) && layout.hide_footer
	},
	isInstalled: function() {
		return GE_Settings.find({ type: 'site_info' }).count()
	},
})

/* Layout Events */
Template.GE_layout.events({
	'click .anchor': function(e,t){
		// Immitate <A> actions
		var url = $(e.currentTarget).data('url')
		if(url && url!='#')
			Router.go( url)
	},
	// Commenting
	'click .sign-guestbook': function(e,t){
		// Open Comments by Session
		$('#overlord').addClass('book-comments-on').removeClass('book-comments-off')
		Session.set('open_comments',true)
	},
	'click .open-comments': function(e,t){
		// Open Comments by Popup
		var data = t.data
		if( data && GE_Help.nk(data, 'page.info.type')){
			Session.set('popup', {
				template: 'commenting',
				class: 'fade-in fixed-full',
				data: {
					_id: data.page._id,
					page_type: data.page.info.type,
					o_id: data.page.organization,
					overlay: true,
				}
			})
		}
	},
	'click .open-help': function(e,t){
		Session.set('popup', {
			id: 'popup-help',
			html: '<p><strong>Thank you for using Good Ethos.</strong></p>\
			<p>For feedback, feature requests, bug reports and friendly hello\'s, please e-mail me at <a href="mailto:hello@goodethos.com" class="dotted-link">hello@goodethos.com</a>.</p>\
			<p>I would love to see what you\'ve done with this software or help out in any way I can.</p>',
			class: 'bg-dim fade-in fixed-full',
			data: {
				overlay: true,
			}
		})
	},
	// Form Helpers
	'change .invis-select select': function(e,t) {
		var this_sel = $(e.currentTarget)
		this_sel.parent().find('.ref').html( this_sel.find(':selected').text())
	},
	// LAYOUT-WIDE : Popup Templates
	// Edit Profile
	'click .popup-profile, click .popup-organization, click .popup-social, click .popup-brand': function(e) {
		if(Meteor.userId()) {
			var elem = $(e.currentTarget)

			if( elem.hasClass('popup-profile')) var cur = 'profile'
			else if( elem.hasClass('popup-organization')) var cur = 'organization'
			else if( elem.hasClass('popup-social')) var cur = 'social'
			else var cur = 'brand'

			e.preventDefault()
			Session.set('popup', {
				template: 'edit_user',
				class: 'bg-dim fade-in fixed-full',
				data: {
					cur: cur,
					overlay: true,
				}
			})
		}
	},
	// Auth related events
	'click .auth-signout': function() {
		Session.set('popup', false)
		$('#ana-guide').html('') // Reset hover tooltip
		Meteor.logout()
	},
	'click .auth-signin': function(e) {
		e.preventDefault()

		var do_auth = function(){
			var passover = Session.get('popup') ? true : false
			Session.set('popup', {
				template: 'signin',
				class: 'bg-dim fade-in fixed-full',
				data: {
					overlay: true,
					passover: passover,
				}
			})
		}

		if( !Meteor.Device.isDesktop() && Session.get('popup')){
			ge.close_popup()
			Meteor.setTimeout( do_auth, 780) // Wait for animation to end before the next popup animation
		} else
			do_auth()
	},
	'click .auth-signup': function(e) {
		e.preventDefault()

		var do_auth = function(){
			var passover = Session.get('popup') ? true : false
			Session.set('popup', {
				template: 'signup',
				class: 'bg-dim fade-in fixed-full',
				data: {
					overlay: true,
					passover: passover,
				}
			})
		}

		if( !Meteor.Device.isDesktop() && Session.get('popup')){
			ge.close_popup()
			Meteor.setTimeout( do_auth, 780) // Wait for animation to end before the next popup animation
		} else
			do_auth()
	},
	// LAYOUT-WIDE : Nav (master) related events
	'click .nav-door': function(event, template) {
		//if( Meteor.Device.isDesktop()) // DEVELOPMENT MODE
		if( !Meteor.Device.isDesktop())
			Session.set('popup', {
				template: 'mobile_nav',
				close: 'big white',
				class: 'fixed-full card-in bg-ge-darker',
			})
		else {
			var nav_state = Session.get('nav_state')

			Session.set('nav_state', !nav_state)

			$('#overlord').addClass('moving')
			$('#nav-name').hide()

			// GE Editor Only
			if( $('#ge-editor').length)
				$('#ge-editor, #if-form').removeClass('on pop-in').attr('style','')

			Meteor.setTimeout(function(){
				$('#overlord').removeClass('moving')
				// Galleries need resizing
				if ($('.content-gallery').length) GE_Gallery()
			}, 350)
		}
	},
	'mouseout #overlord.nav-mini .main-link, mouseout #overlord.nav-mini .sub-link': function(e,t){
		$('#nav-name').hide()
	},
	// LAYOUT-WIDE : Other events
	// .pc-close is not styled
	'click .popup-close, click .pc-close': function(e,t){
		ge.close_popup()
	},
})

Template.GE_layout.created = function() {
	this.subscribe('all-topics') // Always subscribe to Topics
	var self = this
	this.autorun((function(){
		self.subscribe('user-o') // Subscribe to additional user data and blog info
		var user = Meteor.user() // Reactive Cursor
	}).bind(this))
}

Template.GE_layout.rendered = function() {
	this.canvas = new GE_Canvas('#master-wrapper', { min_height: true })
	this.canvas.calc()
  this.canvas_func = (function(){
    this.canvas.calc()
  }).bind(this)
  $(window).on('resize', this.canvas_func)

	if( Meteor.Device.isDesktop()){
		/*
			This MUST be done inside rendered() callback.
			Meteor events do not support hover.
			If you try to do this using Meteor even "mouseover/mouseout" it will create unexpected behaviours
			because that event will fire on ALL of its inner child elems.
		*/
		var timeout = null
		var timeout_func = function(){
			//var nav_state = Session.get('nav_state')
			//if( Meteor.Device.isDesktop() && !nav_state){ // Optional
			if( !$('#overlord').hasClass('nav-open')){
				Session.set('nav_state', true)

				$('#overlord').addClass('moving')
				$('#nav-name').hide()

				// GE Editor Only
				if( $('#ge-editor').length)
					$('#ge-editor, #if-form').removeClass('on pop-in').attr('style','')

				Meteor.setTimeout(function(){
					$('#overlord').removeClass('moving')
					// Galleries need resizing
					if ($('.content-gallery').length) GE_Gallery()
				}, 350)
			}
		} // END : Timeout Func

		$('#nav-master').on( 'click', function(){
			Meteor.clearTimeout( timeout)
			timeout = Meteor.setTimeout( timeout_func, 1350)
		})
		$('#nav-master').hover( function(){
			Meteor.clearTimeout( timeout)
			timeout = Meteor.setTimeout( timeout_func, 500)
		})
		var mouseout_func = function(){
			//var nav_state = Session.get('nav_state')
			//if( Meteor.Device.isDesktop() && nav_state){ // Optional
			if( !$('#nav-master:hover').length){ // This check is necessary, don't remove it
				Meteor.clearTimeout( timeout)
				timeout = Meteor.setTimeout( function(){
					if($('#overlord').hasClass('nav-open')){
						Session.set('nav_state', false)

						$('#overlord').addClass('moving')
						$('#nav-name').hide()

						// GE Editor Only
						if( $('#ge-editor').length)
							$('#ge-editor, #if-form').removeClass('on pop-in').attr('style','')

						Meteor.setTimeout(function(){
							$('#overlord').removeClass('moving')
							// Galleries need resizing
							if ($('.content-gallery').length) GE_Gallery()
						}, 350)
					}
				}, 350)
			}
		}
		$(':not(#nav-master)').on('mouseover', mouseout_func)
		$('#nav-master').on('mouseout', mouseout_func)
	} // END : Desktop only hover event
}

Template.GE_layout.destroyed = function() {
  $(window).off('resize', this.canvas_func)
}
