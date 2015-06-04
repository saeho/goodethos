// Helpers
Template.user_team.helpers({
	team: function() {
		var sortBy = Session.get('sort') || 'Alphabetical'
		var user = Meteor.user()

		if( !user || !user.organization) return false

		// # # # #
		// Sort
		var cond = {}
		switch( sortBy){
			case 'Managers Only':
				// Managers
				cond.level = { $gte: 8 }
				break
			case 'Editors Only':
				// Editors
				cond.level = 5
				break
			case 'Writers Only':
				// Writers
				cond.level = 3
				break
			case 'Staff Only':
				// Staffs
				cond.level = 1
				break
			case 'Assistants Only':
				// Assistants
				cond.level = 0
				break
		}

		var team = Meteor.users.find( cond ).fetch()
		var user_level = user.level || 0

		var team_mapped = _.map( team, function( person, index){
			var name = ge.get_name( person)
			var service = ge.get_service( person, true)
			var isUser = user._id==person._id

			person.role = ge.get_role( person.level)
			person.name = name
			person.isUser = isUser
			person.name_raw = service=='tw' ? name.substr(1) : name
			person.user_level = user_level

			if( !_.has( person, 'level')) person.level = 0

			return person
		})

		//if( sortBy=='Alphabetical')
		return _.sortBy( team_mapped, 'name_raw') // It is assumed that everything is sorted by alphabetical

		return team_mapped
	},
	query: function(){
		var query = Session.get('query')
		if( _.isObject(query) && query._id){
			var queried_user = Meteor.users.findOne( query._id )
			if( queried_user){
				query.level = queried_user.level
				query.role = ge.get_role( queried_user.level)
				query.organization = queried_user.organization
			}
		}
		return query
	},
	sort: function( r){
		var sort = ['Alphabetical', 'Managers Only', 'Editors Only', 'Writers Only', 'Staff Only', 'Assistants Only']
		return r && sort[r] ? sort[r] : sort
	}
})

// Events
Template.user_team.events({
	'change #see-all-sort': function(e,t){
		Session.set('sort', $(e.currentTarget).val())
	},
})

Template.user_team.created = function(){
	Session.set('query',false)
	Session.set('sort',false)

	this.timer = null
	this.keydownFunc = function(){
		var elem = $('#input-search-users')
		var popup = Session.get('popup')
		if( !elem.is(':focus') && !popup){
			elem.focus()
		}
	}
	this.keyupFunc = (function(){
		var elem = $('#input-search-users')
		if( elem.is(':focus')){
			Meteor.clearTimeout( this.timer)
			this.timer = Meteor.setTimeout( function(){
				var query = $('#input-search-users').val() || ''
				if( query.length >= 2)
					Session.set('query', query)

			}, 1000)
		}
	}).bind(this)
	$(document).on('keydown', this.keydownFunc)
	$(document).on('keyup', this.keyupFunc)
}

Template.user_team.destroyed = function(){
	delete Session.keys['query']
	delete Session.keys['sort']

	$(document).off('keydown', this.keydownFunc)
	$(document).off('keyup', this.keyupFunc)
}
