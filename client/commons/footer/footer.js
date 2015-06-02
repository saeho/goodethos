

/* Footer */
/* Footer Helpers */
Template.footer.helpers({
	style: function(){
		if (this.page && GE_Help.nk(this.page, 'info.type')) {
			switch (this.page.info.type) {
				case 'blog':
					return 'no-border'
				default:
					return null
			}
		}
		return null // Else
	},
	// nav_main: function(){
	// 	var this_menu = globals.nav_main
	//
	// 	this_menu.submenu = _.map( this_menu.submenu, function(menu){
	// 		menu.url = menu.route ? Router.routes[ menu.route].path( menu.params || {} ) : false
	// 		return menu
	// 	})
	// 	return this_menu
	// },
	nav_about: function(){
		var this_menu = globals.nav_about

		this_menu.submenu = _.map( this_menu.submenu, function(menu){
			menu.url = menu.route ? Router.routes[ menu.route].path( menu.params || {} ) : false
			return menu
		})
		return this_menu
	},
	nav_social: globals.nav_social,
})

/* Footer Events */
Template.footer.events({
	'click #footer-up-down': function(e,t) {
		var speed = 300
		var check = $(e.currentTarget).hasClass('on')

		// 38 is the default #footer-ghost height
		if( check){
			var footer_height = 0
			var ghost_height = 38
			var cp_height = 38
		} else {
			var footer_height = Meteor.Device.isPhone() ? 430 : 255
			var ghost_height = Meteor.Device.isPhone() ? 430 : 255
			var cp_height = 0
		}

		t.$('#cp').animate({ height: cp_height+'px' }, speed)
		t.$('#footer-ghost').animate({ height: ghost_height+'px' }, speed)
		t.$('#main-footer-wrapper').animate({ height: footer_height+'px' }, speed, function(){
			$(e.currentTarget).toggleClass('on')
		})
		/*
		t.$('#main-footer-wrapper').slideToggle( speed, function(){16px
			$(e.currentTarget).toggleClass('on')
		})*/

		if( !check) $('html,body').stop().animate({scrollTop: $(document).height() }, speed)
		//t.$('#footer-ghost').animate({ height: real_height+'px' }, speed)
},
})
