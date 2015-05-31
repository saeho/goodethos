var prev_state = {}
var cur_obj = {}

var state = function( edit_type){
	var form_data = $('form#edit-user').serializeArray()
	var new_cur = {}
	_.each( form_data, function( item){
		new_cur[ item.name] = item.value
	})

	new_cur['logo'] = $('.eu-logo-container').css('background-image')
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
		if( equal_check) $(e.currentTarget).removeClass('perm')
		else $(e.currentTarget).addClass('perm')

		if( _.isEmpty(prev_state)) prev_state = state( t.data.cur)
		var user = Meteor.user() || {}

		if( !equal_check) {
			var updateObj = _.omit(cur_obj, 'logo') // Omit blob
			var popup = Session.get('popup')

			var update_func = function(obj){
				console.log(obj)

				Organizations.update( user.organization, {
					$set: obj
				}, function(){
					prev_state = cur_obj // This is the state including the blob
					// Set Popup In Popup msg
					if (!Session.get('new_logo_img')){
						popup.data.pip = { msg: 'Your profile was updated.' }
						Session.set('popup', popup)
					}
					Session.set('saving',false)
				})
			}

			var input = document.getElementById('eu-logo-change')
			if( input.files && input.files[0]) {
				var upload = new ge_uploader({ container: $('#edit-user') })

				popup.data.pip = { loading: true }
				Session.set('popup', popup)

				upload.sImg( input, function(res){
					Session.set('new_logo_img', res)
				})
			}
		}
	},
	'click .change-logo': function(e,t){
		if( $('#eu-logo-change').length)
			$('#eu-logo-change').trigger('click')
	},
	'change #eu-logo-change': function(e,t){
		var file = e.currentTarget.files[0]
		// Preview with Blob, don't do any uploads
		ge.blob_url( file, '.eu-logo-container') // Update to Blob
	},
})

Template.eu_brand.rendered = function(){
	prev_state = state()
}
