
Template.comment_single.helpers({
	author: function(){

		var author = Meteor.users.findOne( this.user)
		var isImg = true
		var name = GE_Help.nk( author, 'name.first')+' '+GE_Help.nk( author, 'name.last')

		switch( this.account){
			case 'facebook':
				var img = 'https://graph.facebook.com/'+GE_Help.nk( author, 'services.facebook.id')+'/picture'
				var name = GE_Help.nk( author, 'services.facebook.name')
				break
			case 'instagram':
				var img = GE_Help.nk( author, 'services.instagram.profile_picture')
				var name = GE_Help.nk( author, 'services.instagram.full_name')
				break
			case 'twitter':
				var img = GE_Help.nk( author, 'services.twitter.profile_image_url_https')
				var name = '@'+GE_Help.nk( author, 'services.twitter.screenName')
				break
			case 'good ethos':
				isImg = false
        var img = ge.responsive_img(author.profile_img,'thumb')
				var name = ge.get_name(author)
				break
		}

		return {
			isImg: isImg,
			img: img,
			name: name,
			time_ago: moment( this.date.commented).fromNow().replace('a few seconds', 'few seconds'),
			service: this.account!='good ethos' ? 'via '+GE_Help.capitalize( this.account, true) : null
		}
	},
	message_html: function(){
		if( this.hidden) return '<p class="is-hidden '+(this.excerpt ? 'excerpt': '')+'">This message has been removed.</p>'

		var msg = this.excerpt ? '<p class="ellipsis">'+this.message+'</p>' : ge.nl2p( this.message)
		if( this.excerpt && this.edit_mode) msg += ge.nl2p( this.message, { class: 'real' })
		return msg
	},
})


Template.comment_single.events({
	'click .mini-switch': function(e,t){
		if( t.data.edit_mode){
			Meteor.clearTimeout( this.abuse_timer)
			this.abuse_timer = Meteor.setTimeout( function(){
				GE_Comments.update( t.data._id, { $set: { hidden: $(e.currentTarget).hasClass('on') }})
			},500)
		}
	},
})

Template.comment_single.created = function(){
	this.abuse_timer = null
}
