var prev_state = {}
var cur_obj = {}

var state = function( edit_type){

	var new_cur = {
		'brand.text': $('#profile-bg-main').hasClass('brand-light') ? 'brand-light' : 'brand-dark',
		'brand.bg': $('#change-bg-main .eucc-input').val(),
		'brand.bg_second': $('#change-bg-second .eucc-input').val(),
	}

	return new_cur
}

Template.profile_redesign.helpers({
	pip: function(){
		if( this.pip) {
			return {
				msg: this.pip.msg || 'Your homepage has been re-designed.',
			}
		}
	},
	profile: function(){
		var user = Meteor.user()
		var o = Organizations.findOne( user.organization )
		if( !o) return false

		var brand = o.brand

		// Main BG
		var main_pg = this.main_pg || 0
		var main = {
			input: {
				value: brand.bg,
				class: 'eucc-input',
				type: 'text'
			},
			cc: ge.color_choices( main_pg, 30),
			show_prev: main_pg>0,
			show_next: main_pg<18,
		}

		// Second BG
		var second_pg = this.second_pg || 0
		var second = {
			input: {
				value: brand.bg_second,
				class: 'eucc-input',
				type: 'text'
			},
			cc: ge.color_choices( second_pg, 30),
			show_prev: second_pg>0,
			show_next: second_pg<18,
		}

		return {
			main: main,
			second: second,
			text: {
				white: brand.text=='brand-light',
				black: brand.text!='brand-light',
			}
		}
	}
})


// Events
Template.profile_redesign.events({
	'click .eucc': function(e,t){
		// It is assumed that you are changing the second bg if *not* main
		var change_main = $(e.currentTarget).closest('#change-bg-main').length

		var elem = $(e.currentTarget)
		var color = elem.attr('data-color')

		var target_elem = change_main ? $('#profile-bg-main, #change-bg-main .eucc-preview') : $('#profile-bg-second, #change-bg-second .eucc-preview')
		var target_input = change_main ? $('#change-bg-main input.eucc-input') : $('#change-bg-second input.eucc-input')

		elem.parent().find('.eucc').not( elem).removeClass('on')
		elem.addClass('on')

		target_elem.css({
			'background-color': color
		})
		target_input.val( color).attr('data-color', color)
	},
	'click #change-bg-main .pmn-prev:not(.invis-35), click #change-bg-second .pmn-prev:not(.invis-35)': function(e,t){
		// It is assumed that you are changing the second bg if *not* main
		var change_main = $(e.currentTarget).closest('#change-bg-main').length
		var pg = (change_main ? t.data.main_pg : t.data.second_pg) || 0

		if( pg>0) {
			var session = Session.get('popup')
			if( !session.data) session.data = {}
			var new_pg = pg-1

			if( change_main) session.data.main_pg = new_pg
			else session.data.second_pg = new_pg

			Session.set('popup', session)
		}
	},
	'click #change-bg-main .pmn-next:not(.invis-35), click #change-bg-second .pmn-next:not(.invis-35)': function(e,t){
		// It is assumed that you are changing the second bg if *not* main
		var change_main = $(e.currentTarget).closest('#change-bg-main').length
		var pg = (change_main ? t.data.main_pg : t.data.second_pg) || 0

		if( pg<18) {
			var session = Session.get('popup')
			if( !session.data) session.data = {}
			var new_pg = pg+1

			if( change_main) session.data.main_pg = new_pg
			else session.data.second_pg = new_pg

			Session.set('popup', session)
		}
	},
	'input .eucc-input': function(e,t){
		var elem = $(e.currentTarget)
		var color = elem.val()

		if( color[0]!='#') {
			color = '#'+color
			elem.val( color)
		}

		if( GE_Help.is_hex( color)) {
			// It is assumed that you are changing the second bg if *not* main
			var change_main = $(e.currentTarget).closest('#change-bg-main').length

			var target_elem = change_main ? $('#profile-bg-main, #change-bg-main .eucc-preview') : $('#profile-bg-second, #change-bg-second .eucc-preview')
			var target_input = change_main ? $('#change-bg-main input.eucc-input') : $('#change-bg-second input.eucc-input')

			target_elem.css({
				'border-color': color,
				'background-color': color
			})
			target_input.attr('data-color', color)
		}
	},
	'click .text-color': function(e,t){
		var elem = $(e.currentTarget)
		t.$('.text-color').removeClass('on')
		elem.addClass('on')

		var white = elem.hasClass('white')
		if( white)
			$('#profile-bg-main').removeClass('brand-dark').addClass('brand-light')
		else
			$('#profile-bg-main').removeClass('brand-light').addClass('brand-dark')
	},
	'click #save-button': function(e,t){
		e.preventDefault()

		cur_obj = state()
		if( _.isEmpty(prev_state)) prev_state = cur_obj

		var user = Meteor.user() || {}

		var equal_check = _.isEqual( prev_state, cur_obj)
		if( equal_check) $(e.currentTarget).removeClass('perm')
		else $(e.currentTarget).addClass('perm')

		if( !equal_check){
			Organizations.update( user.organization, {
				$set: cur_obj
			}, function(){
				prev_state = cur_obj // This is the state including the blob
				// Set Popup In Popup msg
				var session = Session.get('popup')
				session.data.pip = true
				Session.set('popup', session)
			})
		}
	},
})


Template.profile_redesign.rendered = function(){
	prev_state = state()
}
