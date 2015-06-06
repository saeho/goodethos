
// Helpers
Template.blog_nav.helpers({
	total_comments: function(){
		return GE_Comments.find().count()
	}
})

// Events
Template.blog_nav.events({
	'click .close-small': function(){
		Session.set('query',false)
		$('#search-profile').val('')
	}
})
