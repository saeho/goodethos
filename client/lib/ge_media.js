
ge_media = function(args) {
	var defaults = {
		force: false, // When force is true, "Are you sure?" prompts are ignored
		buffer: 18, // Buffer
		no_save_msg: 'Would you like to save<br />before continuing?',
		form_id: '#popup-media',
		selector: false,

		// Required args
		edit_mode: false,
		page_id: null,
		page_field: 'content.body', // Required
		key: null,
		key_item: null,
		type: null,
		new: false, // Not new unless otherwise

		uploader: new ge_uploader()
	}
	var args = _.isObject(args) ? _.defaults(args, defaults) : defaults
	_.extend(this, args)

	this.prev = {} // Previous media object is used to compare against current object
	this.cur = {} // Current media object
	this.timer = false // Used to set timeouts (to check when the user finishest typing before doing the auto-search)
	this.youtube_vimeo_thumbnails // Used for YouTube/Vimeo only, their thumbnails are not uploaded so we temporary save their URLs

	/*
	var master_id = '#master'
	var no_save_msg =
	var media_timer = false
	*/
}

ge_media.prototype = {
	// # # # # # # # # # # # # # # #
	// # # Media Functions
	// # # # # # # # # # # # # # # #
	go: function(go){
		var go = Number(go)
		var go_id = Number(this.order_nav)+go
		var func = go>0 ? 'pmn-next' : 'pmn-prev'

		var go_elem = $(this.selector+':visible:eq('+go_id+')').find('.trigger')
		if( !go_elem.length) go_elem = $(this.selector+'.trigger:visible:eq('+go_id+')')
		if( !go_elem.length) go_elem = $(this.selector+':visible:eq('+go_id+')').parent().find('.trigger')

		$('#popup-media').removeClass('shake pop-in-soft')

		if ( go_id>=0 && go_elem.length && ( !this.edit_mode || this.force || this.state() )) {
			/*
				# # # # # # # # Bring this back if you need it # # # # # # # #
			Reset social medias before navigating
			if( $('#pmc-social-search').length) $('#pmc-social-search').addClass('hide fade-out').removeClass('fade-in')
			if( $('#pmc-social').length) $('#pmc-social').addClass('pop-in-soft').removeClass('hide pop-out-soft')
			*/
			// Manually reset the editable fields before proceeding
			// ** If you write something in the text field but don't save and proceed,
			// ** Meteor will keep the entered text if the next item is also empty
			$(this.form_id+' .editable').html('')
			go_elem.trigger('click')
			this.pip_close()
		} else if( go_id>=0 && go_elem.length){
			this.popup_in_popup( this.no_save_msg, func)
		} else {
			Meteor.setTimeout( function(){
				$('#popup-media').addClass('shake')
			},50) // Give a quick milliseconds of rest for DOM to catch up
		}
	},
	close: function(){
		if ( this.force || this.state()) {
			this.pip_close()
			ge.close_popup()
		} else {
			this.popup_in_popup( this.no_save_msg, 'pmn-close')
		}
	},
	// # # # # # # # # # # # # # # #
	// # # State Functions
	// # # # # # # # # # # # # # # #
	extract: function( data){
		this.page_id = data.page_id
		this.page_type = data.page_type
		this.edit_mode = data.edit_mode
		this.new = data.new
		this.type = data.type
		this.selector = data.selector
		this.order = data.order
		this.order_nav = data.order_nav
		this.index = data.index
		this.key = data.key
		this.key_item = data.key_item
		this.first_val = data.value || false
		this.break = data.break || false
		if( data.page_field) this.page_field = data.page_field

		// Every time data is extracted, reset the video URLs
		this.video_img_big = null
		this.video_img_small = null
	},
	is_sm: function(){
		return _.contains(['twitter','instagram'], this.type)
	},
	state: function( return_state ){
		// Check if save is needed
		if( !this.edit_mode) return true // Always true if not editing
		else {
			this.cur = { type: this.type }

			switch(this.type) {
				case 'img':
				case 'vimeo':
				case 'youtube':
					this.cur.title = $('#pmc-title').text().trim()
					this.cur.desc = $('#pmc-desc').text().trim()

					if( this.type=='img') this.cur.value = GE_Help.css_to_url( '#pmc-value')
					else this.cur.value = $('#popup-media #new_val').data('id')

					if( this.cur.value=='none' && this.prev.value) this.cur.value = this.prev.value

					// console.log (this.prev)
					// console.log (this.cur)

					var state = this.new && (this.type=='new' || this.prev.type=='new') ? true : _.isEqual( this.prev, this.cur)
				break
				case 'twitter':
				case 'instagram':
					this.cur.title = '' // Always NULL, title is not used for SM
					this.cur.desc = '' // Always NULL, desc is not used for SM
					this.cur.value =
						(Session.get('query') ? JSON.parse(Session.get('query')) : false)
						|| { id: $('#pmc-social').data('id') }

					//console.log (this.prev)
					//console.log (this.cur)

					var state =
						(this.new && (this.type=='new' || this.prev.type=='new')) // New item always passes
						|| (this.prev.value.id==this.cur.value.id && this.prev.type==this.cur.type) ? true : false
				break
				default:
					var state = true // If the type did not match, then this was a new insert attempt
			}

			if (state) $('.pmn-save').removeClass('on')
			else $('.pmn-save').addClass('on')

			return return_state
			? {
				check_required: ( this.cur.value ? true : false),
				check: state,
				data: this.cur
			}
			: state
		}
	},
	// # # # # # # # # # # # # # # #
	// # # Popup Functions
	// # # # # # # # # # # # # # # #
	popup_in_popup: function(msg, func){
		var popup = Session.get('popup')
		var blob_url = GE_Help.css_to_url('#pmc-value')
		if (func=='loading')
			popup.data.pip = { loading: true }
		else {
			popup.data.pip = { msg: msg, function: func }
			this.force = true
		}
		Session.set('popup',popup)
		Meteor.setTimeout( function(){
			$('#pmc-value').css('background-image', 'url('+blob_url+')')
		},50)
	},
	pip_close: function( cancel){
		this.force = false
		this.youtube_vimeo_thumbnails = false
		$( '#pm-pip').remove()
		if( !cancel) $('.pmn-save').removeClass('on')
	},
	// # # # # # # # # # # # # # # #
	// # # Save Function
	// # # # # # # # # # # # # # # #
	save: function( callback) {
		var state = this.state(true)
		var is_sm = this.is_sm()
		var self = this

		if (state.check) return true // No need to save when data matches

		if( state.check_required) {
			// Minimum requirement is met

			var file_input = document.getElementById('pmc-file-upload')
			var update_index = $('#'+this.key_item).data('index') || -1
			var update_order = $('#'+this.key_item).data('order') || false
			var update_row = $('#'+this.key_item).data('row') || 0

			if( this.type=='img' && state.data.value.indexOf('blob:')==0 && file_input.files && file_input.files[0]) {
				// ############################################
				// Update item with new image
				// ############################################
				var blob_url = GE_Help.css_to_url( '#pmc-value')
				if( !blob_url) return false
				var args = {
					id: this.page_id,
					page_type: this.page_type,
					page_field: this.page_field,
					func: this.new ? 'push' : 'update',
					img_type: (!this.page_field || this.page_field=='content.body' ? 'group' : 'src'),
					order: update_order,
					index: update_index,
					value_elem: '.gallery-item',
					extras: { value: {}, row: update_row }
				}
				if( !this.page_field || this.page_field=='content.body') args.target = this.key_item
				args.extras.type = this.type
				args.extras.value.title = state.data.title.length ? state.data.title : ''
				args.extras.value.desc = state.data.desc.length ? state.data.desc : ''

				$('#popup-media').addClass('working')
				this.popup_in_popup( null, 'loading')

				this.uploader.img( file_input, args, (function(){
					$('#popup-media').removeClass('working')

					self.prev = self.cur
					self.state()
					self.pip_close()

					if(self.selector=='.gallery-item') GE_Gallery({ selector: self.selector })
					if( callback) callback()
				}).bind(this))
			} else {
				// ############################################
				// Update data only
				// ############################################

				// When user is inside popup-media, data passed to it is not reactive
				// So re-capture the index and order before proceeding
				var update_field = this.page_field+'.'+update_index
				if( update_order) update_field += '.group.'+update_order

				// TODO : If previous type does not match new type, this is a completely new item,
				// therefore existing data should be completely reset
				// i.e. complete update vs partial update
				var update_obj = {}
				if(this.new) update_obj.type = this.type
				else update_obj[ update_field+'.type'] = this.type

				if( !is_sm) {
					// If not SM, this is an image or a video
					var value = {
						title: state.data.title,
						desc: state.data.desc
					}
					if( this.type!='img') {
						// Videos have a unique need, they need video ID and
						// custom thumbnails directly from YouTube/Vimeo
						value.id = state.data.value

						if( this.video_img_big!=null && this.video_img_small!=null){
							if(this.new) {
								update_obj.full = this.video_img_big
								update_obj.big = this.video_img_big
								update_obj.medium = this.video_img_big
								update_obj.small = this.video_img_big
								update_obj.thumb = this.video_img_small
							} else {
								update_obj[ update_field+'.full'] = this.video_img_big
								update_obj[ update_field+'.big'] = this.video_img_big
								update_obj[ update_field+'.medium'] = this.video_img_big
								update_obj[ update_field+'.small'] = this.video_img_big
								update_obj[ update_field+'.thumb'] = this.video_img_small
							}
						} // END : Check if video thumbnails have been updated and if so, update otherwise don't.
					}
				} else {
					// An empty SM should never happen, but in case it does, send an empty object
					var value = state.data.value || {}
				}

				if(this.new) {
					var call_method = 'pushPageBlock'
					update_obj.value = value
					update_obj.row = update_row
				} else {
					var call_method = 'updatePageBlock'
					update_obj[ update_field+'.value'] = value
					update_obj[ update_field+'.row'] = update_row
				}

				Meteor.call( call_method, update_field, this.page_id, update_obj, (function(err,res){
					self.prev = self.cur
					self.state()
					if( callback) callback()
					else if(res) {
						ge.wait_for_dom( function(){
							var new_elem = document.getElementById( res)
							if( new_elem==null) return false
							return true
						}, function(){
							$('#'+res).find('.trigger').trigger('click')
						}, 100, 2000)
					}
				}).bind(this))
			}
		} else {
			// # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
			// # # # # Required is not set
			// # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
			switch( state.data.type){
				case 'img': var pip_msg = 'You must choose an image'
					break
				case 'vimeo':
				case 'youtube': var pip_msg = 'You must choose a valid<br />YouTube or Vimeo video'
					break
				case 'twitter': var pip_msg = 'You must choose a Twitter post'
					break
				case 'instagram': var pip_msg = 'You must choose an Instagram post'
					break
				default: var pip_msg = 'Required values are missing, please try again'
			}

			this.popup_in_popup( pip_msg, false)
		}
	},
	loading: function( target){
		var target_elem = $(target)
		//console.log( target_elem.css('background-image'))
		if( this.type=='img' && target_elem.length && this.first_val){
			target_elem.css('background-image', 'url(\''+this.first_val+'\')')
			ge.check_imgs( target, this.uploader, { wait_time: 30000, class: 'pop-in-soft' })
		}
	},
}
