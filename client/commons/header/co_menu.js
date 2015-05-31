
// Menu
Template.co_menu.helpers({
	comment: function(){
		var nav = []
		var action = Router.current().params._action
		var edit_mode = action=='edit'

		return !edit_mode && this.page && GE_Help.nk(this.page, 'info.comment')
	},
	url: function(){
		var o_slug = Router.current().params._org
		if(!o_slug) return false
		return '/'+o_slug
	},
})
