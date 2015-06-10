
/* Header */
Template.nav_master.helpers({
	isLoggedIn: function() {
		return Meteor.userId()
	},
	o_nav: function() {
    var o = GE_Settings.findOne({ type: 'site_info' }, { field: { site_name: 1, site_shortname: 1 }})
		var a_class = 'block main-link wi transition-bg-color'
		var cur = Router.current().route ? Router.current().route.getName() : null

		if (o)
			var o_name = (o.site_name || '').length<=12 ? o.site_name : ((o.site_shortname || '').length ? o.site_shortname : GE_Help.shorten( o.site_name, { len: 12, end_at_space: false }))
		else
			var o_name = 'Blog'

		return [{
			name: o_name,
			url: '/',
			class: a_class+' lmi-home'
		},{
			name: 'Blog',
			url: '/blog',
			class: a_class+' lmi-blog'+(cur=='GE_blog' ? ' cur' : '')
		}]
	},
	nav: function() {
		var user = Meteor.user() || {}

		// # # # # Create Nav
		// .wi is for "WITH-ICON", that means it has an icon and should be highlighted even when <nav> is hidden in user mode
		var a_class = 'block main-link wi transition-bg-color'
		var sa_class = 'block sub-link wi transition-bg-color'
		var cur = Router.current().params._action

		if (user.isStaff){
			// User belong in an organization
			var create_nav = [
				/*{
					name: 'Analytics',
					class: a_class+' lmi-analytics '+(cur=='analytics' ? ' cur' : '')
				},*/{
					name: 'See All',
					url: { route: 'user', action: 'all' },
					class: a_class+' lmi-all '+(cur=='all' ? ' cur' : '')
				},{
					name: 'Create New',
					class: a_class+' cursor lmi-create', // .cursor makes the nav item highlight even though it is not a link
					submenu: [{
							name: 'Blog',
							class: sa_class+' lmi-c-blog cursor create-new-blog'
						},{
							name: 'Story',
							url: { route: 'user', action: 'new_story' },
							class: sa_class+' lmi-c-story '+(cur=='new_story' ? ' cur' : '')
						},/*{
							name: 'Event',
							url: { route: 'user', action: 'new_event' },
							class: sa_class+' lmi-c-event '+(cur=='new_event' ? ' cur' : '')
						},*/
						/*{
							name: 'Initiative',
							// url: { route: 'user', action: 'new_initiative' },
							class: sa_class+' lmi-c-initiative '+(cur=='new_initiative' ? ' cur' : '')
						}*/
					]
				},{
					name: 'Help',
					class: a_class+' lmi-help cursor open-help'
				}]
			var user_nav = [{
				name: 'Team',
				url: { route: 'user', action: 'team' },
				class: a_class+' lmi-team'+(cur=='team' ? ' cur' : '')
			},{
				name: 'Edit Profile',
				url: '#',
				class: a_class+' popup-'+(user.isStaff ? 'profile' : 'organization')+' lmi-profile'
			}]
		} else {
			// User does not belong in any organization
			var create_nav = false
			var user_nav = [{
				name: 'Edit Profile',
				url: '#',
				class: a_class+' popup-profile lmi-profile'
			}]

			if (user.invited) {
				user_nav.push({
					name: 'Invitation',
					url: '#',
					class: a_class+' popup-organization lmi-profile'
				})
			}
		}

		return {
			create: create_nav,
			user: user_nav
		}
	},
})


/* Events */
Template.nav_master.events({
	'click .main-link': function(e,t) {
		var elem =$(e.currentTarget)
		var submenu = elem.parent().find('.submenu')
		var container = $('#nav-master')

		if( submenu.length){
			container.find('.submenu').not( submenu).slideUp( 350)
			submenu.slideToggle( 350)
		}
	},
	'mouseover .ana': function(e,t) {
		if (Meteor.Device.isDesktop()){
			var desc = $(e.currentTarget).data('desc')
			$('#ana-guide').html(desc)
		}
	},
	'mouseout .ana': function(e,t) {
		if (Meteor.Device.isDesktop()){
			$('#ana-guide').html('')
		}
	},
	'click .create-new-blog': function(e,t) {
		// If Blog, temporary create a new post and redirect
		$(e.currentTarget).removeClass('create-new-blog')
		var data = { info: { type: 'blog' }}
		Meteor.call("createPost", data, function(err, res){
			Meteor.setTimeout( function(){
				$(e.currentTarget).addClass('create-new-blog')
			}, 2000)

			if (err) {
				console.warn(err)
				Router.go('/user/all')
			} else
				Router.go('GE_post', { _page: res, _action: 'edit' })
		})
	}
})

/**
 * Nav Master Event handler (it cannot be done by Meteor events)
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

Template.nav_master.rendered = function() {
	if (Meteor.Device.isDesktop()){
		/*
			This MUST be done inside rendered() callback.
			If you try to do this using Meteor even "mouseover/mouseout" it will create unexpected behaviours
			because that event will fire on ALL of its inner child elems.
		*/
		this.click_func = function(){
			Meteor.clearTimeout(timeout)
			timeout = Meteor.setTimeout(timeout_func, 1350)
		}
		this.hover_func = function(){
			Meteor.clearTimeout(timeout)
			timeout = Meteor.setTimeout(timeout_func, 500)
		}
		this.mouseout_func = function(){
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
		$('#nav-master').on('click', this.click_func)
		$('#nav-master').on('mouseover', this.hover_func)
		$(':not(#nav-master)').on('mouseover', this.mouseout_func)
		$('#nav-master').on('mouseout', this.mouseout_func)
	} // END : Desktop only hover event
}
Template.nav_master.destroyed = function() {
	if (Meteor.Device.isDesktop()){
		$('#nav-master').off('click', this.click_func)
		$('#nav-master').off('hover', this.hover_func)
		$(':not(#nav-master)').off('mouseover', this.mouseout_func)
		$('#nav-master').off('mouseout', this.mouseout_func)
	}
}
