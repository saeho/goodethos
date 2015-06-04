
Template.no_staff.rendered = function() {
    this.canvas = new GE_Canvas('#no-staff')
    this.canvas.calc()
    this.canvas_func = (function(){
      this.canvas.calc()
    }).bind(this)

    $(window).on('resize', this.canvas_func)
}

Template.no_staff.destroyed = function() {
    $(window).off( 'resize', this.canvas_func )
}
