
// Social Media Template
// Helpers
Template.social_media_tmpl.helpers({
	embed_attr: function() {
		// TODO : Allow embed of videos too
		return this.embed && !this.hide_embed ? {
			class: 'inner-sm background',
			style: 'background-image: url(\''+this.embed.replace('http://','https://')+'\');',
		} : false
	},
	text_attr: function() {
		return {
			class: 'sm-text white '+(this.embed ? 'with' : 'no')+'-embed'
		}
	},
	profile: function() {
		return {
			attr: { class: 'clear sm-by condensed', },
			pic: { src: this.profile_pic, class: 'sm-pic' },
			name: this.by_name,
			username: this.by_username,
			time_ago: moment( this.date, 'ddd MMM DD HH:mm ZZ YYYY').fromNow()
		}
	},
	msg: function() {
		return GE_Help.shorten( this.msg, { len: 250 })
	},
})
