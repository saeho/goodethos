
/* Header */
Template.nav_master.helpers({
	is: function() {
		var user = Meteor.user()

		return {
			logged_in: user ? true : false,
		}
	},
	version: function() {
		return Meteor.settings.public.version
	},
	o_nav: function() {
    var user = Meteor.user() || {}
    var o = Organizations.findOne( user.organization)

		var a_class = 'block main-link wi transition-bg-color'
		var cur = Router.current().route ? Router.current().route.getName() : null

		if(o){
			// User belongs in an organization
			var full = GE_Help.nk( o, 'name.full') || ''
			var short = GE_Help.nk( o, 'name.short') || ''
			var o_name = full.length<=12
				? full
				: (short.length ? short : GE_Help.shorten( full, { len: 12, end_at_space: false }))

			var o_nav = [{
				name: o_name,
				url: { route: 'profile', o_slug: o.slug },
				class: a_class+' lmi-home'+(cur=='profile' ? ' cur' : '')
			}]
		} else {
			var o_nav = []
		}

		o_nav.push({
			name: 'Good Ethos',
			url: 'https://goodethos.com',
			class: a_class+' lmi-goodethos'
		})

		return o_nav
	},
	ge_nav: function() {
		// .hn is for "HIDE-NAV", it means it should not be visible when <nav> is collapsed
		// var a_class = 'block transition hn'
		var a_class = 'block main-link wi transition-bg-color'
		var cur = Router.current().route ? Router.current().route.getName() : null

		/*
			Disabled for now, if bringing this back, use the following HTML code
			<nav class="menu" id="nav-master-ge">
				{{#each ge_nav}}
					{{#if this.url}}
					<a href="{{pathFor route=this.url.route}}" class="{{this.class}}">{{this.name}}</a>
					{{else}}
					<span class="{{this.class}}">{{{this.name}}}</span>
					{{/if}}
				{{/each}}
			</nav>
		*/

		return [{
				name: 'Good Ethos',
				url: 'https://goodethos.com',
				class: a_class+' lmi-goodethos'
			},{
				name: 'Good Company',
				// url: { route: 'goodcompany' },
				class: a_class+' lmi-goodcompany'+(cur=='goodcompany' ? ' cur' : '')
			},{
				name: 'Good Reads',
				// url: { route: 'goodreads' },
				class: a_class+' lmi-goodreads'+(cur=='goodreads' ? ' cur' : '')
			}]
	},
	nav: function() {
		var user = Meteor.user() || {}

		var msg = (user && GE_Help.nk( user, 'services.password') && !_.has( user, 'organization'))
		? '<a href="#" class="popup-organization">\
			<img src="https://s3-us-west-2.amazonaws.com/goodethos/assets/editor/signup-initial.png" width="55" height="55" /><br />\
			Click here to finish your<br />registration process.</a>'
		: false

		// # # # # Create Nav
		// .wi is for "WITH-ICON", that means it has an icon and should be highlighted even when <nav> is hidden in user mode
		var a_class = 'block main-link wi transition-bg-color'
		var sa_class = 'block sub-link wi transition-bg-color'
		var cur = Router.current().params._action

		if( user.organization){
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
				class: a_class+' popup-'+(user.organization ? 'profile' : 'organization')+' lmi-profile'
			}]
		} else {
			// User does not belong in any organization
			var create_nav = false
			var user_nav = [{
				name: 'Edit Profile',
				url: '#',
				class: a_class+' popup-'+(user.organization ? 'profile' : 'organization')+' lmi-profile'
			}]
		}

		return {
			msg: msg,
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

			if (err){
				console.warn(err)
				Router.go('/user/all')
			} else
				Router.go(res)
		})
	}
})
