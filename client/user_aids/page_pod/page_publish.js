
/*
 * Publish a Post
*/
// Helpers
Template.user_aids_page_publish.helpers({
	page: function(){
		if (Meteor.userId() && this.page) {
			var img_order = Session.get('query')
			var img = !_.isUndefined(this.imgs[img_order]) ? ge.responsive_img(this.imgs[img_order], 'small') : null
			var summary = GE_Help.nk( this.page, 'content.summary') || ''

			return {
				title: GE_Help.nk( this.page, 'content.title'),
				excerpt: (summary.length ? summary : ge.excerpt( this.page.content.body, 100 )),
				img_nav: this.imgs.length>1,
				img_attr: img ? {
					class: 'preview-img relative'+(img ? ' background bg-black' : ''),
					style: (img ? 'background-image: url(\''+img+'\');' : null)
				} : false,
				preview_text_attr: {
					class: 'preview-text'
				}
			}
		}
	},
	pip: function(){
		if (this.pip) return this.pip
		else if (this.page) {

			// Check if body is empty
			var body = GE_Help.nk (this.page, 'content.body')
			if ( !body.length || (body.length==1 && body[0].value && !ge.clean_text(body[0].value).length)) {
				return {
					msg: 'You must write something<br />before you can publish.',
					ok: 'bg-red pc-close'
				}
			}

			// Check if user can POD
			var user = Meteor.user()
			if (!ge.user_can('control_all', user.level) && !(ge.user_can('publish_or_draft', user.level) && user._id==this.page.user))
				return {
					msg: 'You do not have required priviledges<br />to publish or draft this page.',
					ok: 'red'
				}
		}
		return false
	}
})

// Events
Template.user_aids_page_publish.events({
	'click .prev': function(e,t){
		var count = Session.get('query') - 1
		if( count >= 0) {
			$('.next').removeClass('off')
			Session.set('query', count)
		}
		if( count==0) $(e.currentTarget).addClass('off')
	},
	'click .next': function(e,t){
		var count = Session.get('query') + 1
		if( count < t.data.imgs.length) {
			$('.prev').removeClass('off')
			Session.set('query', count)
		}
		if( (count+1)==t.data.imgs.length) $(e.currentTarget).addClass('off')
	},
	'submit': function(e,t){
		e.preventDefault()

		var user = Meteor.user()
		var page = t.data.page

		var page_content = []
		_.each( page.content.body, function( block, index){
			var new_obj = page.content.body[index]

			if( block.type=='text') {
				var new_value = ge.clean_text( block.value)
				if( new_value.trim().length>0) {
					// Only push text blocks that actually has content
					new_obj.value = new_value
					page_content.push( new_obj)
				}
			} else {
				// If NOT Text, just push it to body
				page_content.push( new_obj)
			}
		}) // END: Body Loop

		var popup = Session.get('popup')

		if (!page_content.length){
			popup.data.pip = { msg: 'You must write something<br />before you can publish.', ok: 'bg-red pc-close' }
			Session.set('popup', popup)
			return
		}

		// Set Args for Call()
		var args = {
			type: t.data.page_type,
			_id: t.data.page_id,
			status: 4,
			title: page.content.title,
			content: page_content,
			img: t.data.imgs[ Session.get('query')],
			publish_date: GE_Help.nk( page, 'date.published')==null
		}

		// Add Loading
		popup.data.pip = { loading: true }
		Session.set('popup', popup)

		// Do POD
		Meteor.call('podPost', args, function(err,res){
			var pip = {}
			if(err || !res) {
				console.warn(err)
				pip.msg = 'Sorry, something went wrong.<br />This page could not be published.'
				pip.ok = 'bg-red'
			} else if (res) {
				var abs_url = Router.url('GE_post', {_page: res.slug} )
				pip.msg = 'This page was published to:<br /><a href="'+abs_url+'" class="dotted-link">'+abs_url+'</a>'
				pip.ok = 'bg-green pc-close'
			}
			popup.data.pip = pip
			Session.set('popup', popup)
		})
		// END: Publishing page exists
	}
})


Template.user_aids_page_publish.created = function(){
	Session.set('query',0)
	this.autorun( (function(){
		this.data.page = GE_Posts.findOne( this.data.page_id)
		this.data.imgs = GE_Help.nk( this.data,'page.content') ? ge.extract_imgs (this.data.page.content) : []
	}).bind(this))
}
Template.user_aids_page_publish.rendered = function(){
	var data = this.data
	if( !GE_Help.nk( data, 'page._id') || !_.has( data, 'page') || data.page._id!=data.page_id )
		ge.close_popup()
}
Template.user_aids_page_publish.destroyed = function(){
	delete Session.keys['query']
	delete Session.keys['error']
}
