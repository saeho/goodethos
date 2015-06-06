
Template.user_aids_page_comments.helpers({
	commenting: function(){
		if( !Template) return false // This prevents Meteor reactivity from going crazy when deploy happens
		var parentData = Template.parentData() || {}
		if( !_.has( parentData, 'page')) return false // Reactive is not ready yet, so return false
		var page = parentData.page
		var session = Session.get('show_comments')

		return {
			admin: ge.user_can( 'control_all') || (page.user==Meteor.userId() && ge.user_can( 'publish_or_draft')),
			is_allowed: _.isUndefined( session) ? GE_Help.nk( page, 'info.comment') : session
		}
	},
	comments: function(){
		var comments = GE_Comments.find({}, { sort: { 'date.commented': -1 }}).fetch()
		return _.map( comments, function( c){
			c.excerpt = true // This field cannot be manually updated/inserted, it is blocked from the deny() function
			c.edit_mode = true // This field cannot be manually updated/inserted, it is blocked from the deny() function
			return c
		})
	},
})

// Events
Template.user_aids_page_comments.events({
	'click #commenting-switch': function( e,t){
		var data = Template.parentData()
		var commenting_state = $(e.currentTarget).hasClass('on')
		Session.set('show_comments', !commenting_state)
	},
})

// Destroyed
Template.user_aids_page_comments.rendered = function(){
	//this.origData = Template.parentData() // parentData must be set to this, because it is called on window close
	//this.can_pod = ge.user_can( 'control_all') || (this.origData.page.user==Meteor.userId() && ge.user_can( 'publish_or_draft'))

	this.unload_func = (function(){
		var session = Session.get('show_comments')
		var data = Template.parentData()

		if( data && data.page && !_.isUndefined( session) && data.page.info.comment!=session)
			GE_Posts.update( data.page._id, { $set: { 'info.comment': session } })

	}).bind(this)
	$(window).on('beforeunload', this.unload_func)
}

Template.user_aids_page_comments.destroyed = function(){
	this.unload_func()
	$(window).off('beforeunload', this.unload_func)
	delete Session.keys['show_comments']
}
