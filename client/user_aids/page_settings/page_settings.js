
/* Page - Draft to Publish */

// Helpers
Template.user_aids_page_settings.helpers({
	topics: function(){
		if( !Template) return false // This prevents Meteor reactivity from going crazy when deploy happens
		var parentData = Template.parentData() || {}
		if( !_.has( parentData, 'page')) return false // Reactive is not ready yet, so return false

		var cur_id = GE_Help.nk( parentData, 'page.info.topic')
		var cur = 'None'

		var all_topics = _.map( Topics.find().fetch(), function( topic){
			if( topic._id==cur_id) cur = topic.name
			return {
				val: topic._id,
				name: topic.name,
				selected: cur_id==topic._id
			}
		})
		all_topics.unshift({
			val: 0,
			name: 'None',
			selected: !cur_id || cur_id==0
		})

		return {
			cur: cur,
			all: all_topics
		}
	},
	status: function(){
		if( !Template) return false // This prevents Meteor reactivity from going crazy when deploy happens
		var parentData = Template.parentData() || {}
		if( !_.has( parentData, 'page')) return false // Reactive is not ready yet, so return false

		var page = parentData.page
		var date = GE_Help.nk( page, 'date.published')

		var status = {
			is_published: page.status>=4,
			name: ge.status( page.status),
			date: date,
		}

		if( page.status>=4){
			var can_pod = ge.user_can( 'control_all') || (page.user==Meteor.userId() && ge.user_can( 'publish_or_draft'))
			status.can_pod = can_pod
			status.date_render = date ? moment( date).format('MMM Do, YYYY @h:mm a') : 'Unknown Date'
		}

		return status
	},
	static: function(){

		if( !Template) return false // This prevents Meteor reactivity from going crazy when deploy happens
		var parentData = Template.parentData() || {}
		if( !_.has( parentData, 'page')) return false // Reactive is not ready yet, so return false

		var page = parentData.page
		var author = Meteor.users.findOne( page.user)
		var author_name = GE_Help.nk( author, 'name.first')!=null || GE_Help.nk( author, 'name.last')!=null
			? GE_Help.nk( author, 'name.first')+' '+GE_Help.nk( author, 'name.last')
			: 'Unknown'

		return [{
			name: 'Author:',
			value: author_name
		},{
			name: 'Edited:',
			value: GE_Help.capitalize( moment( page.date.edited).fromNow())
		}]

		if( user) {
			if(this.page) {

				var img_order = Session.get('query')
				var img = !_.isUndefined( this.imgs[ img_order]) ? ge.responsive_img( this.imgs[ img_order], 'small') : null
				var summary = GE_Help.nk( this.page, 'content.summary') || ''

				return {
					title: this.page.content.title,
					excerpt: (summary.length ? summary : ge.excerpt( this.page.content.body )),
					img_nav: this.imgs.length>1,
					img_attr: img ? {
						class: 'preview-img relative'+(img ? ' background bg-black' : ''),
						style: (img ? 'background-image: url(\''+img+'\');' : null)
					} : false,
					preview_text_attr: {
						class: 'preview-text'
					}
				}
			} else {
				ge.close_popup()
			}
		} // END : If User
	},
})


// Rendered
Template.user_aids_page_settings.rendered = function(){
	this.page_id = this.data.page_id
	this.saved_topic = $('#ps-topic').val()
	this.saved_date = $('#ps-time-date').length && $('#ps-time-h').length && $('#ps-time-m').length && $('#ps-time-ap').length
		? new Date( moment(
			$('#ps-time-date').val()+' '+ $('#ps-time-h').val()+':'+$('#ps-time-m').val()+' '+$('#ps-time-ap').val(),
			'MMM Do, YYYY h:mm a'))
		: false

	Session.set('user_aids_page_settings', false)

	this.input_func = function(){
		var new_date = moment(
			$('#ps-time-date').val()+' '+ $('#ps-time-h').val()+':'+$('#ps-time-m').val()+' '+$('#ps-time-ap').val(),
			'MMM Do, YYYY h:mm a').toDate()
		var topic = $('#ps-topic').val()

		Session.set('user_aids_page_settings', {
			new_date: new_date,
			topic: topic
		})
	}

	this.unload_func = (function(){
		var session = Session.get('user_aids_page_settings')
		if( session){
			var setObj = { $set: {} }

			if( this.saved_date && this.saved_date.getTime()!=session.new_date.getTime()) setObj.$set['date.published'] = session.new_date
			if( session.topic!=this.saved_topic ) setObj.$set['info.topic'] = session.topic

			if( !_.isEmpty( setObj.$set) && this.data.page_id && this.data.page_id==this.page_id)
				Posts.update( this.data.page_id, setObj)
		}
	}).bind(this)
	$(window).on('beforeunload', this.unload_func)
	$(document).on('input, change select', this.input_func)
}

// Destroyed
Template.user_aids_page_settings.destroyed = function(){
	this.unload_func()
	$(window).off('beforeunload', this.unload_func)
	$(document).off('input, change select', this.input_func)

	// Hard Reset
	this.unload_func = null
}
