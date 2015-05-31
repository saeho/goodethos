/**
 * Story/Blog Page editor functions
 */
var common_events = {
  /*
    Body & Editor Events
  */
  mouseup: function(e,t) {
    if(t.data.page.status>0 && t.data.page.status<4) {
      t.editor.toolbar_switch()
      t.editor.new_block_switch() // This will only work inside the editor
    }
  },
  paste: function(e,t) {
		if(t.data.page.status>0 && t.data.page.status<4) {
			e.preventDefault()

			var wrapper = t.editor.wrapper()
			var clipboard = (e.originalEvent || e).clipboardData
			var text = clipboard.getData("text/plain").trim()

			if ( wrapper && (wrapper.hasClass('add-video') || wrapper.find('.add-video').length) && GE_Help.is_video_url(text)){
				var video_elem = wrapper.hasClass('add-video')
					? wrapper
					: wrapper.find('.add-video')
				video_elem.text( text)
				t.editor.insert_video( video_elem, text)
			} else if (wrapper && wrapper.prop('tagName')!='MAIN') {
				document.execCommand("insertText", false, text)
				document.execCommand("removeFormat")
				t.editor.restructure()
			}
		}
	},
  'click .as-trigger': function(e,t) {
		if(t.data.page.status>0 && t.data.page.status<4){
			Meteor.clearTimeout(t.editor.autosave_timeout)
			t.editor.autosave_timeout = Meteor.setTimeout((t.editor.save_func).bind(t.editor), 7000)
		}
	},
  keyup: function(e,t) {
		if(t.data.page.status>0 && t.data.page.status<4) {
			var helper_keys = [
				// 91, // Cmd // This makes CMD+V not work. so disable it
				18, // Option
				17, // Ctrl
				16, // Shift
				20, // Caps
				9, // Tab
				27, // Esc
				192, // `
				13, // Enter
				38, // Up
				40, // Down
				37, // Left
				39, // Right
			]
			if ( e==1 || !_.contains(helper_keys, e.keyCode)){
				Meteor.clearTimeout(t.editor.autosave_timeout)
				t.editor.autosave_timeout = Meteor.setTimeout((t.editor.save_func).bind(t.editor), 7000)
			}
			t.editor.toolbar_switch()
			t.editor.new_block_switch() // This will only work inside the editor
		}
	},
  // '#a-helper keydown': function(e,t) { // This won't work because #a-helper is outside this Template
  keydown: function(e,t) {
		if(t.data.page.status>0 && t.data.page.status<4) {
			var wrapper = t.editor.wrapper()
			if (wrapper && wrapper.attr('id')=='a-helper' && e.keyCode==13){
				// Link Helper
				e.preventDefault()

				// Check if user is attempting to create link over multiple paragrahs
				t.editor.restore_sel()
				var new_anchor = t.editor.wrapper()
				var tag = new_anchor.prop('tagName')
				var is_allowed = !_.contains(['SECTION','MAIN','DIV'], tag)
				var anchor = $('#a-input')
				var url = anchor.val()

				if (url) {
					url = (url.indexOf('http://')!=0 && url.indexOf('https://')!=0)
						? 'http://'+url : url
					anchor.val(url)

					// ADD LINK
					if (is_allowed) {
						document.execCommand('CreateLink', false, url)
						$('#a-helper').removeClass('on')

						new_anchor = t.editor.wrapper()
						tag = new_anchor.prop('tagName')
						if (tag=='A')
							new_anchor.attr('target', '_blank')
					} else {
						// setTimeout is needed to prevent an unwanted linebreak.
						// This prevents (double) event handlers for enter key.
						Meteor.setTimeout(function(){
							alert('You cannot create a link that spans outside a paragraph.')
						}, 20)
					}
					// END : IF Input has Value
				} else {
					// If input was submitted but was empty
					document.execCommand('unlink')
					$('#a-helper').removeClass('on')
				} // END : Anchor Helper
			}
		}
	},
  'keydown .page-body': function(e,t) {
		if(t.data.page.status>0 && t.data.page.status<4) {
			var wrapper = t.editor.wrapper()
			var cmd_plus = [
				66, // B
				73, // I
				85, // U
			]

			// User presses CMD+ Key
			if ( _.contains(cmd_plus, e.keyCode) && (e.metaKey || e.ctrlKey)) {
				e.preventDefault()
				switch (e.keyCode){
					case 66: // Bold
						t.editor.bold()
						break
					case 73: // Italic
						t.editor.italic()
						break
					case 85: // Underline
						document.execCommand('underline')
						break
				}
				// Do toolbar buttons check
				t.editor.toolbar_button()
				return false

			// END : If there was no CMD pressed
			} else if (wrapper) {
				switch (e.keyCode){
					case 8: // Backspace
						if ( _.contains(['MAIN','DIV'], wrapper.prop('tagName')) || (wrapper[0].previousSibling==null && wrapper.html().length<=0))
							e.preventDefault() // Deny if selecting too much

						if (!wrapper.hasClass('add-video')) {
							Meteor.setTimeout((function(){
								t.editor.restructure( false)
							}).bind(t.editor), 20)
						}
					break
					case 13: // Enter
						if ( wrapper.hasClass('add-video') && GE_Help.is_video_url(wrapper.text())) {
							// Add video to content
							e.preventDefault()
							t.editor.insert_video(wrapper)
						} else if ( !_.contains(['H5','H6'], wrapper.prop('tagName')) && !e.shiftKey) {
							// No <h5> and <h6> allowed
							e.preventDefault()
							document.execCommand('insertHTML', false, '<p>')
						}
						t.editor.restructure()
					break
					default: // Regular key press
						wrapper.closest('.content-block').removeClass('area-placeholder')
						if( wrapper.prop('tagName')=='DIV') e.preventDefault()
				}
			}
		}
	},
  'focus .content-wrapper': function(e,t){
    if (t.data.page.status>0 && t.data.page.status<4 && !$(e.currentTarget).text().length)
			$(e.currentTarget).addClass('area-placeholder')
  },
  'dragstart .content-block, dragstart figure': function(e,t) {
		if (t.data.page.status>0 && t.data.page.status<4) {
			var type = $(e.currentTarget).data('type')
			if (type!='gallery') e.preventDefault()
		}
	},
  /*
    Editor - Content Blocks
    #ifb's
  */
  'click #ifb-img': function(e,t) {
		if(t.data.page.status>0 && t.data.page.status<4) {
			t.editor.restore_sel() // Probably not necessary -- but just in case
			var wrapper = t.editor.wrapper()
			t.$('#ifb-img_helper').trigger('click')
		}
	},
  'click #ifb-video': function(e,t){
		if(t.data.page.status>0 && t.data.page.status<4) {
			var $wrapper = t.editor.wrapper()
      var node = $wrapper[0]

      var addVideo = document.createElement('p')
      addVideo.className = 'placeholder add-video'
      addVideo.setAttribute('placeholder', 'Paste a YouTube or Vimeo URL and press enter.')
      node.parentNode.replaceChild(addVideo, node)

      var $elem = t.$('.add-video')[0]
      var selection = window.getSelection()
      var range = document.createRange()
      range.selectNodeContents($elem)
      selection.removeAllRanges()
      selection.addRange(range)

			t.editor.new_block_hide()
		}
	},
  'click #ifb-break': function(e,t){
		if(t.data.page.status>0 && t.data.page.status<4) {
			var $wrapper = t.editor.wrapper()
			$wrapper.replaceWith('<hr />')
			t.editor.new_block_hide()
		}
	},
  /*
   * Common Header & Content Block Events
  */
	'click .ltc-remove': function(e,t) {
		if(t.data.page.status>0 && t.data.page.status<4) {
			var delete_key = $(e.currentTarget).data('delete')
			/*
				## Delete "content block" Function
				Every "content block" has a unique ID attached to it. The delete button stores the unique ID in a data attribute.
				This function takes the unique ID and calls a server method that removes the content block with matching ID from this Page.
			*/
			if( delete_key){
				if (delete_key=='page-'+t.data.page.info.type+'-header') {
					// No need to do page save when updating the header image
          delete_key = $('#'+'page-'+t.data.page.info.type+'-header').data('key')
					Meteor.call('popPageBlock', t.data.page._id, delete_key, 'content.img')
					Session.set('saving', false)
					$('#page-story-header').css('background-image','none') // This resets the image even if a delete is attempted while the image is still being uploaded
				} else {
					// Do a page save before popping the content block where delete is attempted.
					t.editor.save( function(){
						Meteor.call('popPageBlock', t.data.page._id, delete_key, function(){
							Session.set('saving', false) // Cancel the session that notifies the user that an image upload is currently taking place.
							t.$('#tooltip-info').removeClass('on') // Hide tooltip
							t.editor.new_block_hide() // Hide new block bar
						}) })
				}
			} // END : Delete
		}
	},
	'click #header-ltc .ltc-img': function(e,t){
		if(t.data.page.status>0 && t.data.page.status<4)
			$('#input-page-'+t.data.page.info.type+'-header').trigger('click')
	},
	'click .content-block .ltc-img': function(e,t){
		if(t.data.page.status>0 && t.data.page.status<4)
			$(e.target).closest('.content-block').find('input.s3-img[type=file]').trigger('click')
	},
  /*
   * Page Title & Header Events
  */
	'change input.s3-img[type=file]': function(e,t) {
		if(t.data.page.status>0 && t.data.page.status<4) {
			/*
				## Upload/replace the header image
				var "args"
				args.id = The ID for the MongoDB document being edited.
				args.o_id = The ID of the organization that this page belongs to. (All members of this organization can view this file, and if they have enough permissions, they can edit the file too.)
				args.page_type = This Page's type (i.e. Story, Blog, Event)
			*/
			var args = {
				id: t.data.page._id,
				o_id: t.data.organization._id,
				page_type: t.data.page.info.type,
			}

			if( $(e.currentTarget).data('field')) args.page_field = $(e.currentTarget).data('field')
			if( $(e.currentTarget).data('type')) args.img_type = $(e.currentTarget).data('type')
			if( $(e.currentTarget).data('index')) args.index = $(e.currentTarget).data('index')
			if( $(e.currentTarget).data('target')) args.target = $(e.currentTarget).data('target')

			var container = $(e.target).closest('.content-block')
			var uploader = new ge_uploader({ container: container })
			uploader.img( e.currentTarget, args)
		}
	},
  'keyup #page-title': function(e,t) {
		ge.title_size_change(e.currentTarget)
	},
  'change #ifb-img_helper': function(e,t) {
		if(t.data.page.status>0 && t.data.page.status<4) {

			var split = t.editor.split_in_two()
			var args = {
				//id: t.data.page._id,
				//page_type: t.data.page.info.type,
				id: t.data.page._id,
				page_type: t.data.page.info.type,
				func: 'split',
				insert: {
					split: split,
				}}

			if( _.has( t.data, 'organization'))
				args.o_id = t.data.organization._id

			var uploader = new ge_uploader()
			t.editor.new_block_hide()
			t.editor.page_body( true)
			var passed = uploader.img( e.currentTarget, args)

			if(passed){
				// Manually update before Reactivity handles it
				var target_elem = $('#'+split.key)
				if( target_elem.length)
					target_elem.html( split.before)
			}
		}
	},
	// Left/Right Header Title Alignment
	'click .ltc-ca_false, click .ltc-ca_true, click .ltc-va_false, click .ltc-va_true': function(e,t) {
		if(t.data.page.status>0 && t.data.page.status<4) {
			var elem_id = $(e.currentTarget).data('area')
			if (elem_id){
				var $elem = $('#'+elem_id)
				var hv = $(e.currentTarget).is('.ltc-ca_false, .ltc-ca_true') ? 'c' : 'v'

				var newData = $elem.hasClass( hv+'_align_false')
				var newClass = newData ? hv+'_align_true' : hv+'_align_false'
				var oldClass = newData ? hv+'_align_false' : hv+'_align_true'

				$elem.removeClass(hv+'_align_true '+hv+'_align_false').addClass(newClass).data(hv+'a', newData)

				// Update the tooltip
				var switched_button = ge.layout_options( null, [oldClass] )
				switched_button = switched_button[0].attr

				$(e.currentTarget).data('tooltip', switched_button['data-tooltip'])
					.removeClass('ltc-'+hv+'a_true ltc-'+hv+'a_false')
					.addClass( oldClass.replace(hv+'_align_','ltc-'+hv+'a_'))
				t.$('#tooltip-info').removeClass('on')
			}
		}
	},
  /*
    Editor Events
  */
  'click #ifb-toolbar': function(e,t) {
		if(t.data.page.status>0 && t.data.page.status<4) {
			var wrapper = t.editor.wrapper()
			wrapper.removeAttr('placeholder class style') // It's important to get rid of all attributes (i.e. add-video to new-toolbar)
			t.editor.toolbar_switch(true)
			t.editor.new_block_hide()
		}
	},
  'mouseover .geeb': function(e,t) {
		//var wrapper = t.editor.wrapper()
		t.editor.saved_selection = t.editor.save_sel()
	},
  'click .geeb': function(e,t) {
		if(t.data.page.status>0 && t.data.page.status<4) {
			var wrapper = t.editor.wrapper()
			if(!wrapper) t.editor.restore_sel()

			var action = $(e.currentTarget).data('format')
			switch(action){
				case 'bold':
					t.editor.bold()
				break
				case 'i':
					t.editor.italic()
				break
				case 'u':
					document.execCommand('underline')
				break
				case 'h2':
				case 'h3':
				case 'h4':
				case 'h5':
				case 'h6':
				case 'blockquote':
					var wrapper = t.editor.wrapper()
					if(wrapper){
						var format = wrapper.prop('tagName')==action.toUpperCase()  ? 'p' : action
						if( wrapper.is(':empty')) wrapper.html('<br />')
						document.execCommand('formatBlock', false, format)
					}
				break
				case 'a':
					t.editor.a()
				break
			}
			// Do toolbar buttons check
			//this.restructure() DO NOT uncomment this, this makes the new page #ifb-toolbar click not work
			if (action!='a') t.editor.toolbar_switch()
		}
	},
  'mouseover .tooltip': function(e,t) {
		if(t.data.page.status>0 && t.data.page.status<4) {
			var tooltip_info = t.$('#tooltip-info')
      if(!tooltip_info.length) return false

			if ($(e.target).hasClass('tooltip-fixed'))
				tooltip_info.addClass('fixed')

			tooltip_info.addClass('on').text($(e.currentTarget).data('tooltip'))

			var pos = e.target.getClientRects()
			var buffer = 15

			pos = pos[0]

			var top = $(e.target).hasClass('down') ? pos.top + pos.height + 7 : pos.top - pos.height - 7
      var left = pos.left
			var css = { top: top+'px' }

			if (window.innerWidth <= (left + tooltip_info.offsetWidth + buffer)){
        css.left = 'auto'
        css.right = '15px'
			} else {
				// +25 is for approximate button size
        css.left = $(e.target).hasClass('right') ? left-tooltip_info.offsetWidth+25 : left
        css.right = 'auto'
			}
			tooltip_info.css(css)
		}
	},
  'mouseout .tooltip': function(e,t) {
		if(t.data.page.status>0 && t.data.page.status<4) {
			var tooltip_info = t.$('#tooltip-info')
			if (tooltip_info.length)
  			tooltip_info.removeClass('on fixed').text('')
    }
	},
}

Template.page_story.events(common_events)
Template.page_blog.events(common_events)
