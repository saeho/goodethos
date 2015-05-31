
// House - Loop
// # # # # # # # # # # # # # # # # # # # #
Template.profile_loop.helpers({
	img: function(){
		// Bigger
		var isBig = !(this.order%3) && !Session.get('query')
		var img = ge.featured_img( this.content, (isBig ? 'medium' : 'small'))

		return {
			src: img,
			isBig: isBig && img,
			isSmall: !isBig && img
		}
	}
})

// House - Note
// # # # # # # # # # # # # # # # # # # # #
Template.profile_note.helpers({
	isOwner: function(){
		var o = Template.parentData().o
		return Meteor.Device.isDesktop() && _.isArray(o.users)
			? _.contains( o.users, Meteor.userId())
			: false
	},
	text: function(){
		var text = GE_Help.nk(this.content, 'body.0.value')
		if(!text) return false
		return ge.nl2p(text)
	},
})

Template.profile_note.events({
	'click .close-small': function(e,t){
		if(confirm('Are you sure you want to delete this note?'))
			Pages.remove(t.data._id)
	},
})
