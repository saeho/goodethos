
Template.team_preview.helpers({
	no_result_msg: function(){
		return "If you cannot find the person you are looking for, they haven't <strong>signed up</strong> or they belong in another organization already."
	},
	isPreview: function(){
		return this.data._id ? true : false
	},
	pages: function(){
		// This is for preview when a user is clicked
		var pages = Pages.find({ user: this._id },{sort: { 'date.edited': -1}}).fetch()

		return _.map( pages, function(p){
			var status = ge.status( p.status)
			var type = GE_Help.capitalize( p.info.type)
			var status_name = p.status<4 ? '<strong>'+status+' '+type+'</strong>' : '<strong class="charcoal">'+status+' '+type+'</strong>'
			var time_ago = moment( p.date.edited ).fromNow().replace('a few seconds', 'few seconds')
			var url = '/'+p.organization+'/'+p._id+'/edit'

			return {
				title: p.content.title,
				type: p.info.type,
				status_name: status_name,
				time_ago: time_ago,
				url: url
			}
		})
	},
	sm_url: function(){
		if( !this.service) return null

		switch( this.service){
			case 'ss-tw':
				return 'https://twitter.com/'+this.name
			case 'ss-fb':
				return 'https://facebook.com/'+this.services.facebook.username
			case 'ss-is':
				return 'https://instagram.com/'+this.services.instagram.username
			default:
				return null
		}
	},
	isO: function(){
		var user = Meteor.user()
		if( this.was_queried){
			// User is not in organization yet
			var parent = Template.parentData(2)
			var o = parent.o
			return {
				invited: _.contains( o.users, this._id),
				inside: !this.organization || o._id!=this.organization
			}
		} else if( user){
			// User is in organization already
			return {
				allow_remove: ge.user_can('control_users', user.level) && this._id!=user._id && this.level<=user.level
			}
		}
		return false
	},
	roles_opt: function(){
		var parent = Template.parentData(2)
		var o = parent.o
		var person = this
		var admin_level = person.user_level || 0
		var denied = _.range( admin_level, 11 )
		var cur = this.level
		var was_invited = _.contains( o.users, this._id)

		var roles = _.filter( ge.get_role('*'), function( role){
			return !_.contains( denied, role.level)
		})

		return _.map( roles, function(r){
			r.checked = (was_invited && cur==r.level) || (!was_invited && r.level==3)
			return r
		})
	},

	// # # # #
	// For searching
	search_query: function(){
		return _.isString( this.data) ? this.data : ''
	},
	search_result: function(){
		var query = this.data
		if( _.isString( query)){

			var query_array = query.split(' ').splice(0,3)
			var or = [{ _id: query }]
			_.each( query_array, function( q){
				var regex = new RegExp( '.*'+q+'.*', 'i' )
				or.push({ 'services.instagram.full_name': regex })
				or.push({ 'services.facebook.first_name': regex })
				or.push({ 'services.facebook.last_name': regex })
				or.push({ 'services.twitter.screenName': regex })
			})

			// Because Meteor.publish() only published users without an organization,
			// We do *not* need to do that check.
			var cond = { $or: or }

			var res = Meteor.users.find( cond ).fetch()
			var user = Meteor.user()
			var user_level = user.level || 0

			var res_mapped = _.map( res, function( person, index){
				var name = ge.get_name( person)
				var service = ge.get_service( person, true)
				var isUser = user._id==person._id

				person.role = ge.get_role( person.level)
				person.service = 'ss-'+service
				person.photo = ge.get_photo( person)
				person.name = name
				person.isUser = isUser
				person.name_raw = service=='tw' ? name.substr(1) : name
				person.user_level = user_level

				person.was_queried = true

				return person
			})

			return _.sortBy( res_mapped, 'name_raw')
		}
	},
})

// Events
Template.team_preview.events({
	'change input': function(e,t){
		var elem = t.$('input[name="role"]:checked')
		var val = Number( elem.val() )
		var person = Template.currentData()

		if( val>=0 && val<=8)
			t.$('#invite-button').addClass('perm').removeClass('disabled off')
		else
			t.$('#invite-button').removeClass('perm').addClass('disabled off')
	},
	'click #invite-button': function(e,t){
		e.preventDefault()
		var elem = t.$('input[name="role"]:checked')
		var val = Number( elem.val() )
		var person = Template.currentData()

		if( val>=0 && val<=8 ){
			var parent = Template.parentData()
			var o = parent.o
			Meteor.call( 'user-invite', o._id, person.data._id, val, function( err, res){
				if( !err){
					var query = Session.get('query')
					query.role = ge.get_role( val)
					Session.set('query', query)
				}
			})
		}
	},
	'click #cancel-button, click #remove-user': function(e,t){
		e.preventDefault()
		var parent = Template.parentData()
		var o = parent.o
		var was_removed = $(e.currentTarget).attr('id')=='remove-user'
		Meteor.call('remove-invite', o._id, this._id, function(err){
			if( !err && was_removed)
				Session.set('query',false)
		})
	},
})

// # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
// user_team_single  # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
// # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

Template.user_team_single.helpers({
	cur: function(){
		var session = Session.get('query') || {}
		return this._id==session._id ? 'cur' : ''
	},
	isO: function(){
		if( this.was_queried){
			var parent = Template.parentData(2)
			var o = parent.o
			var isTeam = this.organization && o._id==this.organization
			var invited = _.contains( o.users, this._id)

			if( isTeam)
				var msg = 'Already in your organization'
			else
				var msg = invited ? 'Team invite sent' : 'Not in your organization'

			var color = isTeam ? 'green' : (invited ? 'blue' : 'red')

			return {
				msg: msg,
				color: color,
			}
		}
		return false
	},
	change_roles: function(){
		// Do not allow administrator roles to be changed
		if( this.user_level>=8 && this.level<10 && !this.isUser){
			var roles = _.filter( ge.get_role('*'), function( role){
				return role.level!=10
			})
			var cur = this.level

			return _.map( roles, function( role){
				role.selected = role.level==cur
				return role
			})
		}
		return false
	}
})

Template.user_team_single.events({
	'change .change-roles': function(e,t){
		if( t.data.user_level>=8){
			var level = Number( $(e.currentTarget).val())

			if( _.isNumber(level) && level<=8 && level>=0 && t.data.level!=level){
				Meteor.call( 'change-role', t.data._id, level, function(err,res){
					if( err) console.warn( err)
					else {
						var session = Session.get('query')
						if( session._id==t.data._id){
							session.level = level
							session.role = ge.get_role( level)
							Session.set('query', session)
						}
					}
				})
			}
		}
	},
	'click .sa-loop': function(e,t){
		var check = $(e.target).hasClass('change-roles')
		if( !check){
			/*
			if( Meteor.Device.isPhone() || Meteor.Device.isTablet())
				Router.go(t.data.url || '/'+t.data.organization+'/'+t.data._id+'/edit')
			else
				Session.set('query', t.data)
			*/
			// TODO : For mobile, allow user info to show
			if( Meteor.Device.isDesktop())
				Session.set('query', t.data)
		}
	}
})
