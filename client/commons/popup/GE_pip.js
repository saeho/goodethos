
Template.GE_pip.helpers({
  showPip: function(){
    return this.loading || this.msg
  },
  back: function(){
    return this.back || 'bg-white'
  },
  ok: function(){
    return this.ok || 'bg-green'
  },
})

Template.GE_pip.events({
  'click .ok': function(e,t){
    var popup = Session.get('popup') || {}
    if (!$(e.currentTarget).hasClass('pc-close') && popup.data.pip) {
  		t.$('#popup-in-popup').removeClass('pop-in-soft').addClass('pop-out-soft')
  		Meteor.setTimeout( function(){
    		if(_.isObject(popup.data))
    			popup.data.pip = false
    		else
  				popup.data = { pip: false }
    		Session.set('popup', popup)
  		},350)
    }
  }
})
