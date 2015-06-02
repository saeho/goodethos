// Helpers
Template.user_all.helpers({
	hasPosts: function(){
		return Posts.find().count()
	},
	posts: function(){
		var o_slug = this.o.slug

		// # # # #
		// Sort
		var andCond = [{ 'info.type': { $in: ['story','blog']} }]
		switch( Session.get('sort') || 'Date'){
			case 'Drafts':
				// var cond = { $and: [{ 'status' : { '$lt': 4 } }, { 'status' : { '$gt': 0 } }] }
				andCond = _.union(andCond, [{'status' : { '$lt': 4 }}, {'status' : { '$gt': 0 }}])
				var sort = { sort: { 'status': 1, 'date.edited': -1 }}
				break
			case 'Published':
				andCond.push({ 'status' : { '$gte': 4 }})
				var sort = { sort: { 'status': -1, 'date.edited': -1 }}
				break
			case 'Stories':
				andCond.push({ 'info.type' : 'story' })
				var sort = { sort: { 'info.type': 1, 'date.edited': -1 }}
				break
			case 'Title':
				var sort = { sort: { 'content.title': 1, 'date.edited': -1 }}
				break
			default:
				// Default = Last Edited
				var sort = { sort: { 'date.edited': -1 }}
		}

		var cond = { $and: andCond }
		var posts = Posts.find(cond, sort).fetch()
		var authors_collection = Meteor.users.find({}, {
			fields: {
				name: 1,
				services: 1
			}}).fetch()
		var authors = _.object( _.map(authors_collection, function(a,i){
			return [a._id, a]
		}))

		return _.map( posts, function( page, index){
			page.author = authors[page.user] || {}
			page.status_name = ge.status( page.status)
			page.url = page.status>=4
				? '/'+o_slug+'/'+page.slug
				: false
			return page
		})
	},
	query: function(){
		return Session.get('query')
	},
	sort: function( r){
		var sort = ['Last Edited', 'Drafts', 'Published', 'Stories', 'Title']
		return r && sort[r] ? sort[r] : sort
	}
})

// Events
Template.user_all.events({
	'change #see-all-sort': function(e,t){
		Session.set('sort', $(e.currentTarget).val())
	},
})

Template.user_all.created = function(){
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
