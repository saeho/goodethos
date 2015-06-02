
// Quick Post Bar
// # # # # # # # # # # # # # # # # # # # # # # # #
Template.blog_quick_post.helpers({
	isOpen: function(){
		var parent = Template.parentData()
		var users_list = GE_Help.nk(parent, 'o.users') || []
		var user = Meteor.user()
		var query = this.query

		// TODO : Add permission control
		return query || (user && !query && _.contains( users_list, user._id))
	},
	write: function(){
		var cur = Session.get('quick_post')
		var types = ['text','image','video']
		return _.map(types, function(qp){
			return {
				val: qp,
				name: GE_Help.capitalize(qp),
				cur: cur==qp ? 'green middle-title' : 'cursor'
			}
		})
	},
	quick_post: function(){
		var quick_post = Session.get('quick_post')
		return this.query ? false : quick_post
	},
})

Template.blog_quick_post.events({
	'click .qp': function(e,t){
		Session.set('quick_post', true)
		// Timeout for Reactive
		Meteor.setTimeout( function(){
			$('#quick-post-textarea').focus()
		},250)
	},
	'click .close-small': function(){
		Session.set('quick_post', false)
	}
})


// Write QP
// # # # # # # # # # # # # # # # # # # # # # # # #
Template.write_qp.events({
	'submit': function(e,t){
		e.preventDefault()
	},
	'submit #write-qp': function(e,t){
		var formData = GE_Help.serializeForm($(e.currentTarget))
		if(!t.enabled) return false

		formData.status = 4
		formData.info = { type: 'note' }
		Meteor.call('createPost', formData, function(err,res){
			if(err)
				alert(err.reason)
			else {
				$('#quick-post-textarea').val('') // Reset after post
				Session.set('cur_date', new Date()) // Refresh query
			}
		})
	},
	'input #quick-post-textarea': function(e,t){
		var val = $(e.currentTarget).val()
		if(val.length){
			t.enabled = true
			t.$('#save-button').removeClass('off')
		} else {
			t.enabled = false
			t.$('#save-button').addClass('off')
		}
	},
})

Template.write_qp.rendered = function(){
	$('#quick-post-textarea').autosize()
}

Template.write_qp.destroyed = function(){
	$('.autosizejs').remove() // Manually destroy all autosize elems
}
