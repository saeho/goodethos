
// Helpers
Template.blog.helpers({
	/*
		Comments (Guestbook)
	*/
	comments: function(){
		return {
			_id: null,
			page_type: 'blog',
			overlay: true, // This stops duplicate subscriptions
		}
	},
	/*
		Branded (Right) Side
	*/
	title: function(){
		var o = this.o
		if(!o) return false
		var title = GE_Help.nk(o, 'name.full') || GE_Help.nk(o, 'name.short') || 'Unknown House'
		var size = ge.title_size( title)
		return {
			val: title,
			size: size
		}
	},
	social: function(){
		var o = this.o
		if( !o || !o.social_media) return false
		var sm = _.map( o.social_media, function( item, key){
			return item
				? {
					name: key,
					url: item
				} : false
		})
		return _.filter(sm, function(s){
			return s
		})
	},
	contributors: function(){
		var o = this.o

		return []

		// TODO : THIS!!

		var team = Meteor.users.find({
			$and: [
				{ _id: { $in: o.users }},
				{ organization: o._id }
			]
		})
		return team.count() > 1 ? team.fetch() : false
	},
	profile: function(){
		var o = this.o
		var isOwner =
			Meteor.Device.isDesktop() && _.isArray(o.users)
				? _.contains( o.users, Meteor.userId())
				: false
		var data = Template.instance().data

		return {
			users: o.users,
			o_id: o._id,
			isOwner: isOwner,
		}
	},
	query: function(){
		return Session.get('query')
	},
	loop: function(){
		var o = this.o
		var posts

		if(o){
			var query = Session.get('query')
			var cond = {
				$and: [
					{ 'status' : { '$gte': 4 } },
					{ 'organization' : o._id },
					{ 'date.published': { $lt: Session.get('cur_date') }}
				]}

			if(_.isString(query) && query.trim().length>=2){
				query = query.trim()
				var or = []
				var query_array = query.split(' ').splice(0,3) // Maximum search of up to 3 words
				_.each(query_array, function(q){
					var regex = new RegExp( '.*'+GE_Help.regexEsc(q)+'.*', 'i' )
					or.push({ 'content.title': regex })
					or.push({ 'content.summary': regex })
				})
				cond.$and.push({ $or: or })
			}
			posts = Posts.find(cond, { sort: { 'date.published': -1 }}).fetch()
		}

		if(o && posts.length){
			var authors_list = _.map( posts, function(p){
				return p.user
			})
			var authors = Meteor.users.find({ _id: { $in: authors_list }}).fetch()
			authors = authors ?
				_.object( _.map( authors, function(a){
					return [a._id, a]
				})) : {}

			// var authors = Meteor.users.find({ }, {
			// 	fields: {
			// 		name: 1,
			// 		services: 1
			// 	}}).fetch()

			var loop = _.map( posts, function( page, index){
				var url = '/'+o.slug+'/'+page.slug

				//var date = page.date.published || page.date.edited || page.date.created
				//date = moment(date)
				date = moment( page.date.published)
				var time_ago = moment().diff( date, 'days')>=5 ? date.format('MMM Do') : GE_Help.capitalize( date.fromNow())

				return {
					_id: page._id,
					author: authors[page.user],

					tmpl: page.info.type=='note' ? Template['blog_note'] : Template['blog_loop'],
					order: index,
					url: url,

					content: page.content,
					time_ago: time_ago,

					title: page.content.title || null,
					excerpt: page.content.summary ? GE_Help.shorten( page.content.summary, {len: 90}) : ge.excerpt( page.content.body, 90),

					type_raw: page.info.type,
					type: GE_Help.capitalize(page.info.type).replace('Blog', 'Blog Post'),
				}
			})
			return loop
		} else
			return false
	},
})

Template.blog.events({
	'input #search-profile': function(e,t){
		Meteor.clearTimeout(this.timer)
		this.timer = Meteor.setTimeout( function(){
			var elem = $(e.currentTarget)
			var query = elem.val()

			if(query.length)
				Session.set('query',query)
			else
				Session.set('query',false)
		}, 1500)
	},
	'click .edit-brand': function(e,t){
		var isAllowed =
			Meteor.Device.isDesktop() && GE_Help.nk( t.data, 'o.users') && _.isArray( t.data.o.users)
				? _.contains( t.data.o.users, Meteor.userId())
				: false

		if( isAllowed){
			Session.set('popup', {
				template: 'blog_redesign',
				class: 'bg-dim fade-in fixed-full',
				data: {
					overlay: true,
				}
			})
		}
	},
})

// Created
Template.blog.created = function(){
	// Init Sessions
	Session.set('quick_post', false)
	Session.set('query', false)
	Session.set('layout',{ hide_footer: true })
	Session.set('cur_date', new Date()) // This prevents future published posts

	// Do not use Meteor Template subscription here
	this.autorun( (function(){
		// Use Session to re-subscribe comments based on page numbers
		if( GE_Help.nk( this.data, 'o._id') && !this.comment_subscription){
			this.comment_subscription =
			Meteor.subscribe('comments', {
				_id: this.data.o._id,
				page_type: 'profile',
				o_id: this.data.o._id,
			})
		}
	}).bind(this))
}

// Rendered
Template.blog.rendered = function() {
	this.canvas = new GE_Canvas('#house', { min_height: true })
	this.canvas.calc()
	this.canvas_func = (function(){
		this.canvas.calc()
	}).bind(this)

	$(window).on('resize', this.canvas_func)
}

// Destroyed
Template.blog.destroyed = function() {
  $(window).off( 'resize', this.canvas_func )

	if( this.comment_subscription)
		this.comment_subscription.stop()

	delete Session.keys['query','cur_date','quick_post']
}
