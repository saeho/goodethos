
// Helpers
Template.GE_blog.helpers({
	/*
		Comments (Guestbook)
	*/
	comments: function(){
		return {
			_id: null,
			page_type: 'profile',
			overlay: true, // This stops duplicate subscriptions
		}
	},
	/*
		Branded (Right) Side
	*/
	site_info: function(){
		var o = this.o
		var title = o.site_name || o.site_shortname || 'Blog'
		var size = ge.title_size( title)
		return {
			title: title,
			size: size,
			description: o.description
		}
	},
	social: function(){
		var o = this.o
		if (!o.social_media) return false // No social media info found, Exit
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
		return Meteor.users.find({
			$and: [
				{ isStaff: true },
				{ level: { $gte: 1 }}
			]
		})
	},
	isOwner: function(){
		var user = Meteor.user() || {}
		if (Meteor.Device.isDesktop() && user.isStaff)
			return ge.user_can('control_profile', user.level)
		else
			return false
	},
	query: function(){
		return Session.get('query')
	},
	loop: function(){
		var query = Session.get('query')
		var cond = {
			$and: [
				{ 'status' : { '$gte': 4 } },
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
		var posts = GE_Posts.find(cond, { sort: { 'date.published': -1 }}).fetch()

		if(posts.length){
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
				var url = Router.url('GE_post', { _page: page.slug })

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

Template.GE_blog.events({
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
		var user = Meteor.user() || {}
		var isAllowed = Meteor.Device.isDesktop() && user.isStaff && ge.user_can('control_profile', user.level)

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
Template.GE_blog.created = function(){
	// Init Sessions
	Session.set('quick_post', false)
	Session.set('query', false)
	Session.set('layout',{ hide_footer: true })
	Session.set('cur_date', new Date()) // This prevents future published posts

	// Do not use Meteor Template subscription here
	this.subscribe('comments', {
		_id: null,
		page_type: 'blog',
	})
}

// Rendered
Template.GE_blog.rendered = function() {
	this.canvas = new GE_Canvas('#house', { min_height: true })
	this.canvas.calc()
	this.canvas_func = (function(){
		this.canvas.calc()
	}).bind(this)

	$(window).on('resize', this.canvas_func)
}

// Destroyed
Template.GE_blog.destroyed = function() {
  $(window).off( 'resize', this.canvas_func )

	delete Session.keys['cur_date']
	delete Session.keys['query']
	delete Session.keys['quick_post']
}
