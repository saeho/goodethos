
Template.ge_editor.helpers({
	toolbar: function() {
		return _.map( this.toolbar, function( item){
			if( item=='break') return { class: 'geeb-break' }
			else return { 'data-format': item, class: 'geeb as-trigger cursor geeb-'+item }
		})
	},
})
