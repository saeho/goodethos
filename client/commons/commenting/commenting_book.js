
// Helpers
Template.commenting_book.helpers({
	open: function(){
		return Session.get('open_comments')
	}
})

// Events
Template.commenting_book.events({
	'click .inner-close': function(e,t){
		$('#overlord').addClass('book-comments-off').removeClass('book-comments-on')
		Meteor.setTimeout( function(){
			Session.set('open_comments',false)
		}, 750)
	},
})

Template.commenting_book.destroyed = function(){
	$('#overlord').addClass('book-comments-off').removeClass('book-comments-on')
	delete Session.keys['open_comments']
}
