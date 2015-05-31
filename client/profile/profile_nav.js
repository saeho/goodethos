
// Helpers
Template.profile_nav.helpers({
	total_comments: function(){
		return Comments.find().count()
	}
})

// Events
Template.profile_nav.events({
	'click .close-small': function(){
		Session.set('query',false)
		$('#search-profile').val('')
	}
})
