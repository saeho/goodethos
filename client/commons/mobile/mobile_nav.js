
Template.mobile_nav.helpers({
	links: function(){
		var user = Meteor.user()
		var o = GE_Settings.findOne({ type: 'site_info' }) || {}

		var nav = [
			{ class: 'mobile-home', url: '/', title: o.site_name || 'Homepage' },
			{ class: 'mobile-blog', url: Router.path('GE_blog'), title: 'Blog' },
			{ break: true }
		]

		if (user.isStaff){
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

/*
Template.mobile_nav.rendered = function(){
	if( Meteor.Device.isPhone() || Meteor.Device.isTablet()) {
		$('#mobile-nav').swipe({ // TODO
			//allowPageScroll: 'vertical',
      // tap:function(e,t) {
			//
      // },
			swipeUp: function(){
				ge.close_popup()
			},
			threshold: 50
		})
	}
}

Template.mobile_nav.destroyed = function(){
	if( Meteor.Device.isPhone() || Meteor.Device.isTablet())
		$('#mobile-nav').swipe('destroy') // TODO
}
*/
