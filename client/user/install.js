
/**
 * NOTE
 * This code for install/validation is written loosely. I hacked it together as fast as I could.
 */

// var aws_inputs = ['accessKeyId','secretAccessKey','bucket','folder','root','region']

var error_helper = {
  isValid: function(val){
    var valid = Session.get('valid') || {}
    if (!_.has(valid, val) || valid[val])
      return null // Valid
    return 'error'
  },
  savedVal: function(val){
    var saved = Session.get('GE_install') || {}
    return _.has(saved, val) ? saved[val] : null
  }
}

var install_events = {
  'click .go-back': function(e,t) {
    var prev = $('#ge-install-form').data('prev')
    if (prev) {
      var sessionData = Session.get('GE_install') || {}
      sessionData.stage = prev

      $('.install-block').removeClass('pop-in-soft').addClass('pop-out-soft')
      Meteor.setTimeout(function(){
        Session.set('GE_install', sessionData)
      },400) // Wait for animation
    }
  },
}

Template.GE_install_one.helpers(error_helper)
Template.GE_install_two.helpers(error_helper)
Template.GE_install_three.helpers(error_helper)
Template.GE_install_four.helpers(error_helper)

Template.GE_install_one.events(install_events)
Template.GE_install_two.events(install_events)
Template.GE_install_three.events(install_events)
Template.GE_install_four.events(install_events)

Template.GE_install_two.helpers({
  button_text: function(){
    // var sessionData = Session.get('GE_install') || {}
    // var test = _.every(aws_inputs, function(aws){
    //   return sessionData[aws] && sessionData[aws].length
    // })
    // return test ? 'Next' : 'Skip AWS'
    return Meteor.settings && Meteor.settings.AWS ? 'Next' : 'Skip'
  }
})

Template.GE_install_three.events({
  'click #create-admin': function(){
    var session = Session.get('GE_install') || {}
    session.stage = 'GE_install_four'

    $('.install-block').removeClass('pop-in-soft').addClass('pop-out-soft')
    Meteor.setTimeout(function(){
      Session.set('GE_install', session)
    },400) // Wait for animation
  }
})

Template.GE_install.helpers({
  install: function(){
    var install = Session.get('GE_install') || {}
    return {
      tmpl: install.stage || 'GE_install_one',
      msg: install.msg,
      loading: install.loading,
    }
  },
})

Template.GE_install.events({
  'input': function(e,t) {

    if ($(e.currentTarget).hasClass('error')) {
      // Don't use removeClass() to change class because then it won't be reactive.
      var session = Session.get('valid') || {}
      var key = $(e.currentTarget).attr('name')
      session[key] = true
      Session.set('valid',session)
    }

    // if ($('#aws-button').length) {
    //   var test = _.map(aws_inputs, function(aws){
    //     var input = $('input[name='+aws+']').length ? $('input[name='+aws+']').val() : ''
    //     return input.length ? true : false
    //   })
    //   var text = _.contains(test,true) ? 'Next' : 'Skip AWS'
    //   $('#aws-button').html(text)
    // }
  },
  'submit': function(e,t) {
    e.preventDefault()
    var $install = $('.install-block')
    var $form = $('#ge-install-form')
    var formData = GE_Help.serializeForm($form)
    formData.stage = $form.data('next')

    /**
     * Loose validation for the Site/App Settings
     * Change it to whatever you desire or change the Mongo Collection data manually.
     */
    var error = false
    // var skipAWS = _.every(aws_inputs, function(aws){
    //   var input = $('input[name='+aws+']').length ? $('input[name='+aws+']').val() : ''
    //   return !input.length
    // })
    var validate = _.object( _.map( formData, function(v,k){
      var test = true // Default
      switch(k){
        case 'site_name':
          test = v.length >=2 && v.length<=40
          break
        case 'site_shortname':
          test = v.length >=2 && v.length<=10
          break
        case 'accessKeyId':
        case 'secretAccessKey':
        case 'bucket':
        case 'folder':
        case 'root':
        case 'region':
          test = skipAWS || v.length
          break
        case 'username':
          test = v.length>4
          break
        case 'email':
          var regEx = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
          test = regEx.test(v)
          break
        case 'password':
          test = v.length>=5
          break
        case 'confirm':
          test = (v.length && v==formData.password)
          break
      }
      if (!test)
        error = true
      return [k, test]
    }))

    if (error)
      Session.set('valid', validate)
    else {
      delete Session.keys['valid']

      var sessionData = Session.get('GE_install') || {}
      var curStage = sessionData.stage
      _.extend(sessionData, formData)

      if (!sessionData.stage) {
        sessionData.stage = curStage
        sessionData.loading = true
        Session.set('GE_install', sessionData)
        Meteor.call('install_goodethos', sessionData, function(err,res){
          if (err) {
            alert(err.reason)
            sessionData.loading = false
            Session.set('GE_install', sessionData)
          } else {
            Session.set('nav_state', false)
          }
        })
      } else {
        $install.removeClass('pop-in-soft').addClass('pop-out-soft')
        Meteor.setTimeout(function(){
          Session.set('GE_install', sessionData)
        },400) // Wait for animation
      }
    }
  }
})


Template.GE_install.rendered = function() {
  delete Session.keys['GE_install']
  delete Session.keys['valid']

  Session.set('nav_state', 'none')
}

Template.GE_install.destroyed = function() {
  delete Session.keys['GE_install']
  delete Session.keys['valid']
}

Template.GE_install_one.rendered = function() {
  $('#ge-install-form')
  .data('prev',false)
  .data('next','GE_install_two')

  var session = Session.get('GE_install') || {}
  session.msg = '<p>Thanks for downloading. Before you can use this package, you must enter some information about your application.</p>'
  Session.set('GE_install', session)
}

Template.GE_install_two.rendered = function() {
  $('#ge-install-form')
  .data('prev','GE_install_one')
  .data('next','GE_install_three')

  Meteor.call('check_aws', function(err,res){
    var session = Session.get('GE_install') || {}
    session.msg = res
    ? '<p>Amazon s3 settings were found, please proceed to the next step.</p>'
    : '<p><strong><span class="red">Amazon s3 settings were not found.</span> Without proper s3 settings, you will not be able to upload images. Please see Readme.md for instructions.</strong></p>'
    Session.set('GE_install', session)
  })
}

Template.GE_install_three.rendered = function() {
  $('#ge-install-form')
  .data('prev','GE_install_two')
  .data('next',false)

  var session = Session.get('GE_install') || {}
  // var skipAWS = _.every(aws_inputs, function(aws){
  //   return !_.has(session, aws) || !session[aws].length
  // })
  Meteor.call('check_aws', function(err,res){
    session.msg =
    '<p>Your blog will be created <strong class="'+(res ? 'green' : 'red')+'">with'+(res ? '' : 'out')+' Amazon s3</strong> setup.\
    Your settings.json file can also contain other setups such as Google Analytics, Facebook/Twitter/Instagram login and more.</p>\
    <p>Do you want to create an admin account?</p>'
    Session.set('GE_install', session)
  })
}

Template.GE_install_four.rendered = function() {
  $('#ge-install-form')
  .data('prev','GE_install_three')
  .data('next',false)

  var session = Session.get('GE_install') || {}
  session.msg = '<p>This account you create will have admin priviledges. If you already have an account you want to use, see the Readme.md on how to make any accounts a staff/admin.</p>'
  Session.set('GE_install', session)
}
