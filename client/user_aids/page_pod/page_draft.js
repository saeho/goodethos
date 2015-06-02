/*
 * Draft a Post
*/
// Helpers
Template.user_aids_page_draft.helpers({
	can_pod: function(){
		var user = Meteor.user()
		var data = Template.parentData() // This check is not necessary, but if Meteor pushes new version of the app, this prevents errors.
		if (!user || !data) return false

		return (ge.user_can('control_all', user.level) || (ge.user_can('publish_or_draft', user.level) && user._id==data.page.user))
	},
	published_url: function(){
		var user = Meteor.user()
		var data = Template.parentData()
		if (!user || !user.organization || !data) return false

		return data.o ? Meteor.absoluteUrl()+data.o.slug+'/'+data.page.slug : false
	},
})

// Events
Template.user_aids_page_draft.events({
	'submit': function(e,t){
		e.preventDefault()
		var user = Meteor.user()
		var page = Posts.findOne(t.data.page_id)

		var page_content = []
		var was_text = false

		_.each( page.content.body, function( block, index){
			if( block.type=='text') {
				// TODO : If previous was text and current is also text, they should be merged.
				// This should probably be done as a secure measure, but technically this should never happen because the GE editor does the merging for us.
				was_text = true
			} else {
				// If NOT Text, push an empty text block
				if (!was_text) page_content.push( ge.empty_text_block())
				was_text = false
			}
			page_content.push( page.content.body[index] )
			if( (index+1)==page.content.body.length && !was_text) { page_content.push( ge.empty_text_block()) }
		}) // END: Body Loop

		if( page_content.length) {
			// Set Args for Call()
			var args = {
				type: t.data.page_type,
				_id: t.data.page_id, // p_id is used for both ID and Slugs
				status: 1,
				content: page_content
			}

			// Add Loading
			var popup = Session.get('popup')
			popup.data.pip = { loading: true }
			Session.set('popup', popup)

			// Do POD
			Meteor.call('podPost', args, function(err,res) {
				var pip = {}
				if (err || !res) {
					console.warn(err)
					pip.msg = 'Sorry, something went wrong.<br />This page could not be set to draft.'
					pip.ok = 'bg-red'
				} else if (res) {
					pip.msg = 'This page was set to draft.<br />It is no longer public.'
					pip.ok = 'bg-green pc-close'
				}
				popup.data.pip = pip
				Session.set('popup', popup)
			})
		} // END: Finish set to draft
	}
})
