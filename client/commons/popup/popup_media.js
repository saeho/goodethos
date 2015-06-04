
/* PopUp Helpers */
Template.popup_media.helpers({
	pip: function(){
		if (_.isString(this.pip))
			return { msg: this.pip }
		else
			return this.pip
	},
	popup_nav: function() {
		var popup_nav_buttons = []
		var cur = this.order_nav
		var max = $(this.selector).length-1 // This should be ok becuase this template is only rendered via popup

		// Prev
		if (cur>0 && !this.new) popup_nav_buttons.push({ name: 'pmn-prev', desc: 'Left' })
		// Add
		if( this.edit_mode && !this.new && !this.images_only) popup_nav_buttons.push({ name: 'pmn-add', desc: 'Add' })
		// Close
		popup_nav_buttons.push({ name: 'pmn-close', desc: 'ESC' })
		// Save
		if( this.edit_mode && this.type) popup_nav_buttons.push({ name: 'pmn-save transition-bg-color', desc: 'Save' })
		// Next
		if (cur<max && !this.new) popup_nav_buttons.push({ name: 'pmn-next', desc: 'Right' })

		return {
			attr: {
				id: 'popup-media-nav',
				class: (this.edit_mode ? 'edit-mode ' : '')+'center unselect sub' // Need this for .sub centered text-indent
			},
			buttons: popup_nav_buttons
		}
	},
	tmpl: function(){
		switch( this.type) {
			case 'img':
			case 'vimeo':
			case 'youtube':
				return 'pmc_media'
			break
			case 'twitter':
			case 'instagram':
				return 'pmc_social'
			break
			case 'new':
				return 'pmc_new'
			break
		}
	},
	content: function() {
		var this_value = Session.get('query') || this.value || true

		if( (!this_value || !this.type) && !this.new) {
			ge.close_popup(); return false // Exit
		} else if( this.type!='new') {
			if( _.contains( ['twitter','instagram'], this.type))
				if( !_.isObject( this_value)) this_value = JSON.parse(this_value)
			else
				this_value = decodeURI(this_value)
		}
		// If unset or false, set it to null
		this.title = this.title ? decodeURI(this.title).trim() : ''
		this.desc = this.desc ? decodeURI(this.desc).trim() : ''

		var pmc = {
			edit_mode: this.edit_mode,
			is_new: this.new,
			type: this.type,
			order: this.order,
			index: this.index>=0 ? this.index : false // Don't do "this.index || false", 0 indexes will fail
		}
		if( this.page_field) pmc.field = this.page_field

		switch( this.type) {
			case 'img':
			case 'vimeo':
			case 'youtube':
				pmc.title = {
					show: this.edit_mode || this.title.length>0,
					attr: { contenteditable: this.edit_mode, id: 'pmc-title', class: 'block center'+(this.edit_mode ? ' no-enter editable' : ''), placeholder: (this.type=='img' ? 'Image' : 'Video')+' Caption Title' },
					text: this.title }
				pmc.desc = {
					attr: { contenteditable: this.edit_mode, id: 'pmc-desc', placeholder: 'Image Caption Description', class: 'block center'+(this.edit_mode ? ' no-enter editable' : '') },
					text: this.desc }
				pmc.caption = { show: ( this.edit_mode || (pmc.title.text.length+pmc.desc.text.length)>0 ) }

				if( this.type=='img') {
					// * * * * Image
					pmc.caption.attr = { class: 'pm-figcaption sans-serif-thin smaller' }
					pmc.img = this_value
				} else {
					// * * * * Video
					pmc.caption.attr = { class: 'center sans-serif-thin padding-t' }
					pmc.video = this.type=='youtube'
						? {
							url: this.new ? '' : 'https://www.youtube.com/watch?v=', id: this.new ? '' : this_value,
							attr: {
								src: this.new ? '' : '//www.youtube.com/embed/'+this_value+(this.edit_mode ? '' : '?autoplay=1'),
								frameborder: 0, allowfullscreen: true
							}
						} : {
							url: this.new ? '' : 'https://vimeo.com/', id: this.new ? '' : this_value,
							attr: {
								src: this.new ? '' : '//player.vimeo.com/video/'+this_value+'?title=0&byline=0&portrait=0'+(this.edit_mode ? '' : '&autoplay=1'),
								frameborder: 0, webkitallowfullscreen: true, mozallowfullscreen: true, allowfullscreen: true
							}
						}
				}
			break // END : Image, Vimeo, YouTube
			case 'twitter':
			case 'instagram':
				// * * * * Twitter or Instagram
				// TODO : You probably don't need deleted>0 since its default false. Do a check later.
				if( this_value.embed) this_value.embed = this_value.embed.replace('http://','https://')
				this_value.embed = this_value.embed && this.deleted && this.deleted>0 ? '/assets/core/deleted-big.png' : this_value.embed

				pmc.social = this_value

				if( !pmc.social.id) pmc.social = false
				pmc.social.date_raw = pmc.social.date
				pmc.social.date = moment( pmc.social.date, 'ddd MMM DD HH:mm ZZ YYYY').fromNow()

				if( this.edit_mode) {
					pmc.query = {
						type_cap: GE_Help.capitalize(this.type),
						type: this.type
					}

					var user = Meteor.user()

					if( this.type=='twitter') {
						// Twitter
						pmc.query.hide_check = ''
						/*
							Until I can find a proper solution for Meteor account problem, just use my API Keys
							pmc.query.authenticated =
								GE_Help.nk( user, 'auth.twitter.accessToken') && GE_Help.nk( user, 'auth.twitter.accessTokenSecret')
								? true : false
						*/
						pmc.query.authenticated = true
						pmc.query.search_types =
							[{ value: 'Keywords', selected:'selected' },
							{ value: 'Username' },
							{ value: 'Tweet URL' }]
					} else {
						// Instagram
						pmc.query.hide_check = 'display: none;'
						/*
							Until I can find a proper solution for Meteor account problem, just use my API Keys
							pmc.query.authenticated =
								GE_Help.nk( user, 'auth.instagram.accessToken')
								? true : false
						*/
						pmc.query.authenticated = true
						pmc.query.search_types =
							[{  value: 'Tags', selected:'selected' }, // If NOT Twitter, Instagram is assumed
							{ value: 'Username' },
							{ value: 'Instagram URL' }]
					}
					pmc.query.st_first = pmc.query.search_types[0].value
				}

			break // Twitter, Instagram, maybe more later
			case 'new':
				// * * * * New Choices
			break // New
		} // END : Switch

		return pmc
	}
})

// Events
Template.popup_media.events( ge.contenteditable_events )
Template.popup_media.events({
	'click .sm-preview': function(e,t) {
		if( t.data.edit_mode) {
			var social_media = $(e.currentTarget)
			var sm_json = {
				id: social_media.attr('id'),
				date: social_media.data('date'),
				msg: social_media.find('.sm-text').text(),
				embed: (social_media.find('.sm-embed').length ? social_media.find('.sm-embed').attr('src') : false),

				by_name: social_media.find('.sm-by-name').text(),
				by_username: social_media.find('.sm-by-screen').text(),
				profile_pic: social_media.find('.sm-profile-pic').attr('src'),

				// Not using Fav/Retweet count at the moment
				// fav: social_media.data('fav'),
				// retweet: social_media.data('retweet'),
			}

			Session.set('query', JSON.stringify(sm_json))

			t.$('#pmc-social-search').removeClass('fade-in').addClass('hide fade-out')
			t.$('#pmc-social').removeClass('hide pop-out-soft').addClass('pop-in-soft')

			t.media.state()
		}
	},
	'click .pip-cancel': function(e,t) { t.media.pip_close(true) },
	'click .pmn-close-yes': function(e,t) {
		if( t.data.edit_mode) {
			t.media.save( function(){
				t.media.pip_close()
				ge.close_popup()
			})
		}
	},
	'click .pmn-close': function(e,t) { t.media.close() },
	'click .pmn-prev': function(e,t) { t.media.go( '-1') },
	'click .pmn-prev-yes': function(e,t) {
		if( t.data.edit_mode) {
			t.media.save( function(){ t.media.go( '-1') })
		}
	},
	'click .pmn-next': function(e,t) { t.media.go( 1) },
	'click .pmn-next-yes': function(e,t) {
		if (t.data.edit_mode) {
			t.media.save( function(){ t.media.go( 1) })
		}
	},
	'click .pmn-save': function(e,t) {
		if( t.data.edit_mode) {
			if( $(e.currentTarget).hasClass('on')) t.media.save()
		}
	},
	'click .pmn-add-yes': function(e,t) {
		if( t.data.edit_mode) {
			t.media.save( t.data.selector, t.data.page_field, t.data.page_id, t.data.id, t.data.index, t.data.container_id, function(){
				$('#'+t.data.key_item).find('.gal-add').trigger('click')
			})
		}
	},
	'click .pmn-add': function(e,t) {
		if( t.data.edit_mode) {
			if ( t.media.force || t.media.state()) {
				t.media.pip_close()
				$('#'+t.data.key_item).find('.gal-add').trigger('click')

			} else {
				t.media.popup_in_popup( t.media.no_save_msg, 'pmn-add')
			}
		}
	},
	'input #pm-query, click #pm-entities': function(e,t) {
		if( t.data.edit_mode) {
			var elem = $('#pmc-social-search')
			var query = $('#pm-query')
			var old_val = query.data('cur')
			var old_check = query.data('check-entities')
			var sm_type = t.data.type

			if( t.media.timer) { Meteor.clearTimeout( t.media.timer) }
			t.media.timer = Meteor.setTimeout( function() {
				var new_val = query.val()
				var new_check = $('#pm-entities').prop('checked')

				if ( new_val.length>2 && (new_val!=old_val || old_check!=new_check.toString())) {
					// Set NEW, Old Values
					query.data('cur', new_val).data('check-entities', new_check.toString())

					var user = Meteor.user()
					var results_container = $('#pm-result')
					var args = {
						query: new_val,
						type: $('#pm-search-types').val(),
						entities: new_check
					}
					// Loading
					elem.addClass('has-result')
					if ( !elem.find('.loading-container').length) {
						elem.append('<div class="bg-bright abs-full loading-container"><span class="loading spin-inifinite"></span></div>')
					}

					if (sm_type=='twitter' /*&& user.auth.twitter && user.auth.twitter.accessToken && user.auth.twitter.accessTokenSecret*/) {
							// Do Twitter Search * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
							Meteor.call('twitter_search', args, GE_Help.nk( user, 'auth.twitter.accessToken'), GE_Help.nk( user, 'auth.twitter.accessTokenSecret'), function(error, result) {
								results_container.html('') // Reset
								elem.find('.loading-container').remove()

								if ( result.error) {
									elem.removeClass('has-result')
									results_container.html( result.message)
								} else if (result && result.length) {
									//console.log( result[0])

									_.each( result, function( r){
										var media_url = GE_Help.nk( r, 'entities.media.0.media_url_https') || GE_Help.nk( r, 'entities.media.0.media_url')
										if( media_url) media_url = media_url.replace('http://','https://')
										var profile_url = r.user.profile_image_url_https || r.user.profile_image_url

										if ( media_url){
											var media_embed = '<img class="sm-embed" src="'+media_url+'" />'
										} else {
											var media_embed = '' // Reset
										}

										results_container.append('<div id="'+r.id_str+'" class="sm-preview clear"\
											data-date="'+r.created_at+'">\
											<img class="sm-profile-pic" src="'+profile_url+'" />\
												'+media_embed+'\
											<p class="sm-text">'+r.text+'</p>\
											<p class="tiny ebony">\
												<strong class="sm-by-name">'+r.user.name+'</strong>\
												<span class="sm-by-screen">@'+r.user.screen_name+'</span> - \
												'+moment( r.created_at, 'ddd MMM DD HH:mm ZZ YYYY').fromNow()+'\
											</p>\
										</div>')
									}) // END : Each Loop
									results_container.scrollTop(0)
								}
							}) // END : Call Finished
					} else if (sm_type=='instagram' /* user.auth.instagram && user.auth.instagram.accessToken */) {
							// Do Instagram Search * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
							Meteor.call('instagram_search', args, GE_Help.nk( user, 'auth.instagram.accessToken'), function(error, result) {
								results_container.html('') // Reset
								elem.find('.loading-container').remove()

								if (result && result.length) {
									//console.log( result[0])

									_.each( result, function( r){
										var media_url = GE_Help.nk( r, 'images.standard_resolution.url')
										if( media_url) media_url = media_url.replace('http://','https://')
										var thumb_url = GE_Help.nk( r, 'images.thumbnail.url')
										if( thumb_url) thumb_url = media_url.replace('http://','https://')
										var created_time = moment( r.created_time, 'X').format('ddd MMM DD HH:mm ZZ YYYY')

										if ( media_url){
											var media_embed = '<img class="sm-embed" src="'+media_url+'" data-thumb="'+thumb_url+'" />'
										} else {
											var media_embed = '' // Reset
										}

										results_container.append('<div id="'+r.id+'" class="sm-preview clear"\
										data-date="'+created_time+'">\
										<img class="sm-profile-pic" src="'+r.user.profile_picture+'" />\
											'+media_embed+'\
										<p class="sm-text">'+(r.caption && r.caption.text ? r.caption.text : '')+'</p>\
										<p class="tiny ebony">\
										<strong class="sm-by-name">'+r.user.full_name+'</strong>\
										<span class="sm-by-screen">'+r.user.username+'</span> - \
										'+moment( created_time, 'ddd MMM DD HH:mm ZZ YYYY').fromNow()+'\
										</p>\
										</div>')
									}) // END : Each Loop
									results_container.scrollTop(0)
								} else if (result.error_msg) {
									elem.removeClass('has-result')
									results_container.html( result.error_msg)
								}
							}) // END : Call Finished
					}
				} // END : If new_val != old_val
				t.media.timer = false
			}, 1000) // Timeout
		}
	},
	'input .video-url-input': function(e,t) {
		if( t.data.edit_mode) {
			var video_input = $( e.currentTarget)
			var video_type = GE_Help.is_video_url( video_input.val() )
			var video_params = GE_Help.url_params( video_input.val())
			var cur_val = video_input.data('id')

			// First get the Video ID based on video type
			if (video_type=='youtube'){
				var video_id = video_params.v,
				result_url = 'https://gdata.youtube.com/feeds/api/videos/',
				embed = '//www.youtube.com/embed/%value%?autoplay=0'
			} else if (video_type=='vimeo'){
				var video_id = video_params.base_url.split('/').pop(),
				result_url = 'https://vimeo.com/api/v2/video/'+video_id+'.json',
				embed = '//player.vimeo.com/video/%value%?title=0&byline=0&portrait=0&autoplay=0'
			} else {
				var video_id = false
			}

			// When video is not found
			var video_not_found = function(text) {
				text = _.isUndefined(text) ? 'Not Found' : text
				var not_found_input = $('#popup-media .video-not-found')
				not_found_input.val(text).show().focus()
				Meteor.setTimeout( function(){
					video_input.focus()
					not_found_input.hide()
				}, 1500)
			}

			// Compare new video ID to current value
			if ( video_id && cur_val != video_id) {

				if( t.media.timer) { Meteor.clearTimeout( t.media.timer) }
				t.media.timer = Meteor.setTimeout( function() {

					HTTP.get( result_url, function( err, res ){
						if (res.statusCode!=200) {
							if (err) console.warn(err)
							video_not_found()
						} else if (res.statusCode==200) {
							if ( video_type=='vimeo' && res.data && res.data[0]) {
								var response = res.data[0]
								var full_url = response.thumbnail_large.replace('http://','https://')
								var small_url = response.thumbnail_medium.replace('http://','https://')
							// END : IF Vimeo
							} else if ( video_type=='youtube') {
								var full_url = 'https://img.youtube.com/vi/'+video_id+'/maxresdefault.jpg'
								var small_url = 'https://img.youtube.com/vi/'+video_id+'/maxresdefault.jpg'
							} // END : IF YouTube

							t.media.video_img_big = full_url
							t.media.video_img_small = small_url
							t.media.type = video_type

							$('#popup-media .iframe-holder iframe').attr( 'src', embed.replace('%value%', video_id))
							video_input.data('id', video_id)
							t.media.state()
						} // END : Was 200 StatusCode
					}) // END : HTTP Call

					t.media.timer = false
				}, 1000) // Timeout

			} else if ( !video_id) {
				if( t.media.timer) { Meteor.clearTimeout( t.media.timer) }
				t.media.timer = Meteor.setTimeout( function() {
					video_not_found()
				}, 1000)
			}
		}
	},
	'click #pmc-img-change': function(e) {
		$('#pmc-file-upload').trigger('click')
	},
	'change #pmc-file-upload': function(e,t) {
		if( t.data.edit_mode) {
			var file = e.currentTarget.files[0]

			$('#pmc-value').addClass('is-loading')
			ge.blob_url( file, '#pmc-value', false, function(){
				t.media.state()
			}) // Update to Blob
		}
	},
	'click #twitter-authenticate': function(e) {
		//Meteor.linkWithTwitter()
	},
	'click #instagram-authenticate': function(e) {
		//Meteor.link_with_instagram()
	},
	'click #pmc-new .cursor': function(e,t) {
		if( t.data.edit_mode) {
			var type = $(e.currentTarget).data('type')
			if( type) {
				var cur_session = Session.get('popup')
				cur_session.data.type = type
				Session.set('popup', cur_session)
			}
		}
	},
	'click .social-change': function(e,t) {
		t.$('#pmc-social-search').toggleClass('hide fade-out fade-in')
		t.$('#pmc-social').toggleClass('pop-in-soft hide pop-out-soft')
	},
	'change #pm-search-types': function(e,t) {
		var search_type = $(e.currentTarget).val()
		$('#pst-visible').html( search_type)

		switch( search_type) {
			case 'Keywords':
				var new_placeholder = 'Search Twitter' // Instagram don't have search by keyword option
				$('#pm-entities, #pm-entities-label').show()
			break
			case 'Tags':
				var new_placeholder = 'Search Instagram' // Twitter don't have search by tags option
				$('#pm-entities, #pm-entities-label').hide()
			break
			case 'Username':
				var new_placeholder = t.data.type=='twitter' ? '@Username' : 'Username'
				$('#pm-entities, #pm-entities-label').hide()
			break
			case 'Tweet URL':
				var new_placeholder = 'https://twitter.com/username/status/...'
				$('#pm-entities, #pm-entities-label').hide()
			break
			case 'Instagram URL':
				var new_placeholder = 'http://instagram.com/p/...'
				$('#pm-entities, #pm-entities-label').hide()
		}

		$('#pm-query').val('').data('cur', '').attr('placeholder', new_placeholder) // Reset
	},
})


Template.popup_media.created = function(){
	this.media = new ge_media()
	this.uploader = new ge_uploader()
	// Key Up Bindings for this template only
	this.popup_keyup = (function(e){
		var is_sm = this.media.is_sm()
		if ( !$('.editable, input, textarea').is(':focus') ) {
			// Allow left/right
			if(e.which==37 && !this.media.force) $('.pmn-prev').trigger('click')
			else if(e.which==39 && !this.media.force) $('.pmn-next').trigger('click')

		} else if (e.which!=27 && !is_sm) {
			this.media.state() // Is typing
		} // END : Save Check
	}).bind(this)
	// Key Down Bindings for this template only
	this.popup_keydown = (function(e){
		var is_sm = this.media.is_sm()
		var sm_query = $('#pm-query')

		if( !_.contains([27,37,39], e.which) && is_sm && sm_query.length && sm_query.is(':visible') && !sm_query.is(':focus')) {
			sm_query.focus()
		} else if( e.which==27 && !Session.get('saving')) { // ESC
			if ( this.media.force || this.media.state()) {
				if ( !this.media.force) {
					this.media.pip_close(true)
					ge.close_popup()
				} else {
					this.media.pip_close(true)
				}
			} else {
				this.media.popup_in_popup( this.media.no_save_msg, 'pmn-close')
			} // END : If ESC is allowed
		}
	}).bind(this)
}

Template.popup_media.rendered = function(){
	// $('#popup-media .editable[contenteditable="true"]').first().focus() // This got in the way of L/R navigation, I didn't like that
	$(document).on( 'keyup', this.popup_keyup)
	$(document).on( 'keydown', this.popup_keydown)

	if( Meteor.Device.isPhone() || Meteor.Device.isTablet()) {
		var media = this.media
		$(document).swipe('destroy')
		$(document).swipe({
			allowPageScroll: 'vertical',
			swipeLeft: function(){
				media.go( 1)
			},
			swipeRight: function(){
				media.go( '-1')
			},
			threshold: 50
		})
	}

	this.autorun( (function(computation) {
		var session = Session.get("popup")

		if (session = session.data) {
			Session.set('query',false) // Reset query every time navigation occurs
			this.media.extract( session) // Extract only the wanted variables from session data (pretty much all of the session data at the moment)
			this.media.loading('#pmc-value')

			if( session.edit_mode) {
				this.media.prev = {
					type: session.type,
					title: session.title ? decodeURI(session.title).trim() : '',
					desc: session.desc ? decodeURI(session.desc).trim() : '',
					value: _.contains(['twitter','instagram'], session.type) && !this.media.new ? JSON.parse(session.value) : session.value
				}
			} // END : Set Prev State
		}
	}).bind(this))
}

Template.popup_media.destroyed = function() {
	delete Session.keys['query']
	$(document).off( 'keyup', this.popup_keyup)
	$(document).off( 'keydown', this.popup_keydown)

	if( Meteor.Device.isPhone() || Meteor.Device.isTablet()) $(document).swipe('destroy')
}
