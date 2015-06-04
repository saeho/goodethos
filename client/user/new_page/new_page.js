var editor = new ge_editor()

// Function for switching windows
var pop_in_windows = function( container, turn_off){
	var container = $(container)
	var not_container = $('.cn-choices').not( container)

	not_container.removeClass('cur')
	container.addClass('cur')

	if( turn_off) not_container.find('.pop-in').removeClass('pop-in')

	Meteor.setTimeout( function(){
		container.find('.cn-option').addClass('pop-in')
	}, 100)
}

// Helpers
Template.user_new_page.helpers({
	master_attr: {
		class: 'relative unselect',
		id: 'create-new',
	},
	page_type: function() {
		var allowed_types = {
			new_story: 'Story',
			new_event: 'Event',
		}
		if ( _.has( allowed_types, this.action)) return allowed_types[ this.action]
		else { Router.go('blog/user') }
	},
	popup: function(){ return this.popup },
	not_popup: function(){ return !this.popup },
	layout_options: function(){

		var actor_loop = function( loop){
			return _.map( _.range( loop), function( index) {
				return 'actor'+index
			})
		}

		switch ( this.action) {
			case 'new_story':
				return [{
					id: 'full-back',
					desc: 'Title on top of a fullscreen picture',
					actors: actor_loop(3),
					cur: (this.cur=='full-back' ? 'on' : '')
				},{
					id: 'regular',
					desc: 'Dark picture with emphasis on title',
					actors: actor_loop(11),
					cur: (this.cur=='regular' ? 'on' : '')
				},{
					id: 'no-pic',
					desc: 'Title on white background',
					actors: actor_loop(6),
					cur: (this.cur=='no-pic' ? 'on' : '')
				}]
			break
			// case 'new_event':
			// 	return [{
			// 		id: 'event-slideshow',
			// 		desc: 'Prominent slideshow gallery at top',
			// 		actors: actor_loop(15),
			// 		cur: (this.cur=='event-slideshow' ? 'on' : '')
			// 	},{
			// 		id: 'event-quarters',
			// 		desc: 'Up to three media items per row',
			// 		actors: actor_loop(10),
			// 		cur: (this.cur=='event-quarters' ? 'on' : '')
			// 	},{
			// 		id: 'event-timeline',
			// 		desc: 'Timeline of event (Beta)',
			// 		actors: actor_loop(13),
			// 		cur: (this.cur=='event-timeline' ? 'on' : '')
			// 	}]
			// break
		} // END : Switch
	},
})

// Events
Template.user_new_page.events(ge.contenteditable_events)
Template.user_new_page.events({
		'click .cn-option': function(e,t){
			var this_button = $(e.target).closest('.cn-option')
			var this_parent = this_button.parent()
			var this_switch = this_parent.data('switch')
			var t = t.data

			if ( !t.popup) {
				// Not a popup
				switch (this_switch) {
					case 'layout':
						this_parent.find('.on').removeClass('on')
						this_button.addClass('on')
						pop_in_windows( '.cn-text', true)
						$('#page-title').trigger('click')
					break
				}
			} else {
				// Is a popup
				// This prevents split second on/off animation
				this_parent.find('.on').removeClass('on')
				this_button.addClass('on')

				// Setup New Layout Data
				var layout_style = this_button.data('layout')
				var layout_session = Session.get('layout')
				layout_session.style = layout_style
				Session.set('layout', layout_session)

				$('#if-form').removeClass('on').attr('style','')

				// Do Popup close
				window.scrollTo(0,0)
				ge.close_popup()
			}
		},
		// .editable is already being used, use .no-enter for this event instead
		'focus .no-enter': function(e){
			$(e.currentTarget).closest('.cn-option').addClass('on')
		},
		// .editable is already being used, use .no-enter for this event instead
		'blur .no-enter': function(e){
			$(e.currentTarget).closest('.cn-option').removeClass('on')
		},
		// .editable is already being used, use .no-enter for this event instead
		'click .cn-text .cn-option': function(e){
			var target = $(e.currentTarget).find('.editable')
			if ( !target.is(':focus')) {
				target.focus()
			}
		},
		// .editable is already being used, use .no-enter for this event instead
		'click .new-back': function(e){
			$('.cn-option').removeClass('on')
			pop_in_windows( '.cn-layout', true)
		},
		// .editable is already being used, use .no-enter for this event instead
		'keyup .no-enter': function(e, t){
			var layout = $('.cn-layout .on').data('layout'),
			title = t.$('#page-title').text().trim()

			if ( title.length && layout) { $('button').addClass('bg-ge-solid-reverse').removeClass('bg-charcoal') }
			else { $('button').removeClass('bg-ge-solid-reverse').addClass('bg-charcoal') }
		},
		'click button': function(event, t) {
			if ( !t.data.popup) {
				event.preventDefault()

				// Page (Story) Insert
				var layout = $('.cn-layout .on').data('layout')
				var title = t.$('#page-title').text().trim()
				var summary = t.$('#page-summary').text().trim()

				if ( title.length && layout) {
					var page_type = t.data.action.replace('new_','')
					var data = {
						content: {
							title: title,
							summary: summary,
						},
						layout: {
							style: layout,
						},
						info: {
							type: (_.contains(['story','event'], page_type) ? page_type : ' Unknown'),
						}
					}
					Meteor.call("createPost", data, function(err, res){
						if (err) console.warn(err)
						else Router.go('post', { _page: res, _action: 'edit' })
					})
				}
			}
		},
		'keyup #page-title': function(e,t){
			var elem = e.currentTarget
			ge.title_size_change( elem )
		},
	}) // END : Events

Template.user_new_page.created = function(){
	if( !this.data.popup){
		this.autorun( function(){
			var data = Template.currentData()
			pop_in_windows( '.cn-layout', true)
			$('.cn-option').removeClass('on')
		})
	}
}
