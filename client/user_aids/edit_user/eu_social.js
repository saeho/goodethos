
var prev_state = {}
var cur_obj = {}
var state = function(){
	var form_data = $('form#edit-user').serializeArray()
	var new_cur = {}
	_.each( form_data, function( item){
		new_cur[ item.name] = item.value
	})

	_.each( new_cur, function( val, key){
		if( key.indexOf('social_media.')===0)
			new_cur[key] = GE_Help.is_social_media_url( val,true)
	})
	return new_cur
}

Template.eu_social.events({
	'input input': function(e,t){
		cur_obj = state()
		if( _.isEmpty(prev_state)) prev_state = cur_obj

		var check = _.isEqual( prev_state, cur_obj)

		if( check) t.$('#save-button').removeClass('perm')
		else t.$('#save-button').addClass('perm')
	},
	// TODO : This event and the event above should be merged.
	'input .sm-input': function(e,t){
		var elem = $(e.currentTarget)
		var type = elem.data('type')
		var check = GE_Help.is_social_media_url( elem.val())

		if( type==check || elem.val()=='')
			elem.parent().find('.eu-icons').removeClass('error')
		else
			elem.parent().find('.eu-icons').addClass('error')
	},
	'click #save-button': function(e,t){
		e.preventDefault()

		cur_obj = state()
		if( _.isEmpty(prev_state)) prev_state = cur_obj

		var user = Meteor.user() || {}

		var equal_check = _.isEqual (prev_state, cur_obj)
		if (equal_check) $(e.currentTarget).removeClass('perm')
		else $(e.currentTarget).addClass('perm')

		if (user.isStaff) {
			// Has Organization
			if (!equal_check)
				Meteor.call('update_site_info', cur_obj, function(err,res){
					prev_state = cur_obj
					// Set Popup In Popup msg
					var popup = Session.get('popup')
					popup.data.pip = { msg: 'Your blog was updated.'}
					Session.set('popup', popup)
					$(e.currentTarget).removeClass('perm')
				})
		}
	}
})

Template.eu_social.rendered = function(){
	prev_state = state()
}
