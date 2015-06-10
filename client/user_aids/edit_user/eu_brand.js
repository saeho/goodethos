var prev_state = {}
var cur_obj = {}

var state = function( edit_type){
	var form_data = $('form#edit-user').serializeArray()
	var new_cur = {}
	_.each( form_data, function( item){
		new_cur[ item.name] = item.value
	})

	if ($('.eu-logo-container').length)
		new_cur['logo'] = $('.eu-logo-container').css('background-image')

	if ($('.eu-photo-container').length)
		new_cur['profile_img'] = $('.eu-photo-container').css('background-image')

	return new_cur
}

// Events
Template.eu_brand.events({
	'click #save-button': function(e,t){
		e.preventDefault()

		cur_obj = state()
		if( _.isEmpty(prev_state)) prev_state = cur_obj

		var user = Meteor.user() || {}
		var equal_check = _.isEqual( prev_state, cur_obj)

		if (equal_check) $(e.currentTarget).removeClass('perm')
		else $(e.currentTarget).addClass('perm')

		if (!equal_check) {

			var uploader = new ge_uploader({ container: $('#edit-user') })
			var input = document.getElementById('eu-logo-change')

			if (input.files && input.files[0]) {
				cur_obj.logo = prev_state.logo
				uploader.sImg( input, function(res){
					Session.set('new_logo_img', res)
				})
			}

			var input = document.getElementById('eu-photo-change')
			if (input.files && input.files[0]) {
				cur_obj.profile_img = prev_state.profile_img
				uploader.sImg( input, function(res){
					Session.set('new_photo_img', res)
				})
			}

			var popup = Session.get('popup')
			popup.data.pip = { loading: true }
			Session.set('popup', popup)
		}
	},
	'click .change-logo': function(e,t){
		if( $('#eu-logo-change').length)
			$('#eu-logo-change').trigger('click')
	},
	'click .change-photo': function(e,t){
		if( $('#eu-photo-change').length)
			$('#eu-photo-change').trigger('click')
	},
	'change #eu-logo-change': function(e,t){
		var file = e.currentTarget.files[0]
		// Preview with Blob, don't do any uploads
		ge.blob_url( file, '.eu-logo-container') // Update to Blob
	},
	'change #eu-photo-change': function(e,t){
		var file = e.currentTarget.files[0]
		// Preview with Blob, don't do any uploads
		ge.blob_url( file, '.eu-photo-container') // Update to Blob
	},
})

Template.eu_brand.rendered = function(){
	prev_state = state()
}
