var prev_state = {}
var cur_obj = {}

var state = function( edit_type){
	var form_data = $('form#edit-user').serializeArray()
	var new_cur = {}
	_.each( form_data, function( item){
		new_cur[ item.name] = item.value
	})

	return new_cur
}

Template.eu_homepage.helpers({
	user: function(){
		var user = Meteor.user() || {}
		var invited = Session.get('eu_homepage')

		if( invited && user.level){
      // Get shorter name
      var full_name = GE_Help.nk( invited, 'name.full')
      var short_name = GE_Help.nk( invited, 'name.short')
      var o_name = GE_Help.return_shorter( full_name, short_name)

			invited.o_name = full_name.length<15 && full_name.length>2 ? full_name : o_name
			invited.role = ge.get_role( user.level )
			invited.o_photo = ge.responsive_img( GE_Help.nk( invited, 'brand.logo'))
			invited.logo_back = GE_Help.nk( invited, 'brand.logo_back')
		} else
			invited = false

		return {
			_id: (user._id || ''),
			invited: invited,
		}
	}
})

Template.eu_homepage.events({
	'input input, input textarea': function(e,t){
		cur_obj = state()
		if( _.isEmpty(prev_state)) prev_state = cur_obj

		var check = _.isEqual( prev_state, cur_obj)

		if( check) t.$('#save-button').removeClass('perm')
		else t.$('#save-button').addClass('perm')
	},
	'input textarea': function(e,t){
		t.chars_remaining()
	},
	'click #join-link': function(e,t){
		Meteor.call('join-organization')
	},
	'click #decline-link': function(e,t){
		var o = Session.get('eu_homepage')
		var user_id = Meteor.userId()
		if( o._id && user_id) {
			Meteor.call( 'remove-invite', o._id, user_id )
			Meteor.call('decline-organization')
		}
	},
	'click #save-button': function(e,t){
		e.preventDefault()

		cur_obj = state()
		if( _.isEmpty(prev_state)) prev_state = cur_obj

		var user = Meteor.user() || {}
		var popup = Session.get('popup')
		popup.data.pip = { loading: true }

		var equal_check = _.isEqual( prev_state, cur_obj)
		if( equal_check) $(e.currentTarget).removeClass('perm')
		else $(e.currentTarget).addClass('perm')

		if (user.organization) {
			// Has Organization
			if (!equal_check) {
				Session.set('popup', popup)
				Organizations.update (user.organization, {
					$set: cur_obj
				}, function (err,res){
					prev_state = cur_obj
					// Set Popup In Popup msg
					popup.data.pip = { msg: 'Your profile was updated.' }
					Session.set('popup', popup)
				})
			}
		} else {
			// New Account but organization name is too short
			popup.data.pip = { msg: cur_obj['name.full'].length<4 ? 'The name of your organization is too short.' : 'The organization short name must be at least 2 characters long.', ok: 'bg-red' }
			Session.set('popup', popup)
		}
	},
})

Template.eu_homepage.events(
	ge.contenteditable_events
)

Template.eu_homepage.created = function(){
	this.chars_remaining = function(){
		if($('#description').length){
			var max = $('#description').attr('data-max')
			var chars = $('#description').val().length
			$('#chars-remaining').html('&nbsp;'+(max-chars)+' Characters Remaining')
		}
	}
	this.autorun( function(){
		var user = Meteor.user()
		var invited = user && user.level>=0 ? Organizations.findOne({ users: { $in: [user._id] } }) : false
		Session.set( 'eu_homepage', invited)
	})
}

Template.eu_homepage.rendered = function(){
	prev_state = state()

	if($('#description').length){
		this.chars_remaining()
		$('#description').autosize()
	}
}

Template.eu_homepage.destroyed = function(){
	$('.autosizejs').remove() // Manually destroy all autosize elems
}
