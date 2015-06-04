
Template.mobile_nav.helpers({
	links: function(){
		var user = Meteor.user()

		var prefix = 'mobile-'
		var nav = _.map( globals.nav_about.submenu, function( menu){
			menu.class = prefix+menu.ref
			menu.url = menu.route ? Router.routes[ menu.route].path( menu.params || {}) : false
			return menu
		})
		nav = _.filter( nav, function( menu){
			return menu.url!==false
		})
		nav.push( { break: true })

		if( user){
			var o = Organizations.findOne( user.organization) || {}

			if( o) nav.push({ class: 'mobile-home', url: Router.routes['blog'].path({_o_slug: o.slug}), title: 'Homepage' })
			nav.push({ class: 'mobile-all', url: Router.routes['user'].path({ _action: 'all'}),  title: 'See All' })
			nav.push({ class: 'popup-profile mobile-profile', url: '#', title: 'Edit Profile' })
			nav.push({ class: 'auth-signout mobile-signout', url: '#', title: 'Sign Out' })
		} else {
			nav.push({ class: 'auth-signin mobile-signin', url: '#', title: 'Sign In' })
			nav.push({ class: 'auth-signup mobile-signup', url: '#', title: 'Create Account' })
		}

		return nav
	},
})

Template.mobile_nav.rendered = function(){
	if( Meteor.Device.isPhone() || Meteor.Device.isTablet()) {
		$('#mobile-nav').swipe({
			//allowPageScroll: 'vertical',
			/*
	        tap:function(e,t) {

	        },
			*/
			swipeUp: function(){
				ge.close_popup()
			},
			threshold: 50
		})
	}
}

Template.mobile_nav.destroyed = function(){
	if( Meteor.Device.isPhone() || Meteor.Device.isTablet())
		$('#mobile-nav').swipe('destroy')
}
