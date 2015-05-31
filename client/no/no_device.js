
Template.no_device.rendered = function() {
    this.canvas = new GE_Canvas('#no-device')
    this.canvas.calc()
    this.canvas_func = (function(){
      this.canvas.calc()
    }).bind(this)

    $(window).on('resize', this.canvas_func)
}

Template.no_device.destroyed = function() {
    $(window).off('resize', this.canvas_func)
}
