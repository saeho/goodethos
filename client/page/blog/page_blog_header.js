var init_elems = []

// Helpers
Template.page_blog_header.helpers({
	lct: function() {
		var page = this.page
		if( !page) return {}

		var edit_mode = page.status>0 && page.status<4
		if( edit_mode) {
			// Buttons inside LCT
			var button_choices = ['img']
			var layout = Session.get('layout') || page.layout

			// All classes use c_align right now, but when they don't, change this
			button_choices.push( (layout.c_align ? 'c_align_false' : 'c_align_true') )

			if( GE_Help.nk( page, 'content.img.0.medium')){
				button_choices.push( (layout.on_top ? 'on_top_false' : 'on_top_true') )
				button_choices.push('remove')
			}

			return {
				buttons: button_choices,
				key: 'page-blog-header',
				ltc_id: '#header-ltc',
				extra_html: '<input id="input-page-blog-header" type="file" class="hide s3-img"\
					data-target="page-blog-header .featured-img img" data-type="src_array" data-field="content.img" />',
			}
		} else return false
	},
	header: function() {
		var page = this.page
		if( !page) return {}

		var new_imgs = Session.get('new_imgs')
		var layout = Session.get('layout') && Session.get('layout').style ? Session.get('layout') : page.layout
		var edit_mode = page.status>0 && page.status<4

		// content.img
		var img_obj = false
		var img = GE_Help.nk( page, 'content.img.0')
		var img_url = null

		if( img) {
			img_obj = {}

			if( _.contains( init_elems, img.key))
				img_url = ge.responsive_img( img, 'medium')
			else if ( _.contains( new_imgs, img.key)){
				img_url = ge.responsive_img( img, 'medium')
				var image = new Image()
				image.src = img_url

				image.onload = function(){
					init_elems.push( img.key)
				}
			}
			img_obj.id = img.key
			img_obj.src = img_url
		}

		// <header> attr
		var header_class = 'background'
		header_class += ' c_align_'+(layout.c_align ? 'true' : 'false')
		header_class += ' on_top_'+(layout.on_top && img_obj ? 'true' : 'false')

		return {
			img: img_obj,
			img_attr: {
				class: 'featured-img'
			},
			attr: {
				id: 'page-blog-header',
				class: header_class,
				'data-ca': layout.c_align,
				'data-ot': layout.on_top
			},
		}
	},


	title: function(){
		var page = this.page
		var action = Router.current().params._action
		var edit_mode = page.status>0 && page.status<4

		var editable = edit_mode ? ' editable no-enter' : ''

		// Title
		var title = GE_Help.nk( page, 'content.title') || '' // This *must* be a String
		var title_obj = { val: action=='edit' ? '' : title }
		title_obj.attr = {
			id: 'page-title',
			class: ge.title_size( title )+' text title '+editable,
			contenteditable: edit_mode
		}

		if( edit_mode){
			title_obj.attr.placeholder = 'Title'
			title_obj.attr['data-max'] = 100
		}

		return title_obj
	},
	summary: function(){
		var page = this.page
		var action = Router.current().params._action
		var edit_mode = page.status>0 && page.status<4

		//var new_imgs = Session.get('new_imgs')
		var editable = edit_mode ? ' editable no-enter' : ''

		// Summary
		var summary = GE_Help.nk( page, 'content.summary') || '' // This *must* be a String
		var summary_obj = { val: action=='edit' ? '' : summary }
		summary_obj.attr = {
			id: 'page-summary',
			class: 'summary text bigger-caption invis-85 serif '+editable,
			contenteditable: edit_mode
		}

		// Edit Mode
		if( edit_mode){
			summary_obj.attr.placeholder = 'Summary (Optional)'
			summary_obj.attr['data-max'] = 255
		}

		return summary_obj
	}
})

Template.page_blog_header.events( ge.contenteditable_events )

Template.page_blog_header.created = function(){
	var imgs = GE_Help.nk( this.data, 'page.content.img')
	if( imgs && imgs.length)
		init_elems = _.map( imgs, function( img){
			return img.key || null
		})
}
