
Template.helpers_time.helpers({
	cal: function() {
		var date = this.date || new Date()
		return {
			cur: moment( date || new Date() ).format('MMM Do, YYYY'),
			name: this.name ? this.name+'-date' : 'time-date', // If you're going to change the format of the name value, change it in created() too
		}
	},
	h: function() {
		var date = this.date || new Date()
		var cur = moment( date).format('h') || 12
		var range = _.range(13)
		range.shift() // You can't do it in just one step, set it to variable first then shift it

		return {
			cur: cur,
			name: this.name ? this.name+'-h' : 'time-hour',
			num: _.map( range, function(h){
				return { val: h, selected: h==cur }
			})
		}
	},
	m: function() {
		var date = this.date || new Date()
		var increment = this.increment ? Math.max(this.increment,1) : 5
		var cur = moment( date).format('m') || 0

		var range = []
		var cur_check = false
		for( i=0; i<60; i = i+increment){
			range.push( i )
			if( !cur_check && i+5>cur && increment!=1){
				cur = i // Round it down
				cur_check = true
			}
		}

		return {
			cur: GE_Help.str_pad(cur),
			name: this.name ? this.name+'-m' : 'time-minute',
			num: _.map( range, function(n){
				return { val: GE_Help.str_pad(n), selected: n==cur }
			})
		}
	},
	ap: function() {
		var date = this.date || new Date()
		var cur = moment( date).format('a') || 'pm'
		var options = ['am','pm']

		return {
			cur: cur,
			name: this.name ? this.name+'-ap' : 'time-ap',
			options: _.map( options, function(opt){
				return { val: opt, selected: opt==cur }
			})
		}
	},
})

Template.helpers_time.rendered = function() {
	var data = Template.currentData()
	var cal_name =  data.name ? data.name+'-date' : 'time-date'

	this.pikaday = new Pikaday({
		field: document.getElementById( cal_name),
		format: 'MMM Do, YYYY',
		yearRange: 2,
		onSelect: function(){
			var new_date = this.getMoment().format('MMM Do, YYYY')
			if (new_date) $('#'+cal_name+'-wrapper .dummy').html( new_date)
		}
	})
}

Template.helpers_time.destroyed = function() {
	this.pikaday = null
	this.$('.pika-single').remove()
}
