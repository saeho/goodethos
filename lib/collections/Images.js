
// FS.debug = true // Debug Mode

// Client
if (Meteor.isClient) {
  /**
   * Small Image Uploads
   * Used for quick uploads (i.e. images in comments and small sized files)
   */
  var sImg_stores = _.map(['smedium','ssmall','sthumb'], function(s){
    return new FS.Store.S3(s)
  })

  sImages = new FS.Collection("sImages", {
    stores: sImg_stores,
    filter: {
      maxSize: Meteor.settings.public.small_upload_limit,
      allow: { contentTypes: ['image/*'] },
      onInvalid: function (err_msg) {
				Session.set('popup', {
					html: '<p>'+err_msg+'</p>',
					ok: 'red',
					class: 'bg-dim fade-in fixed-full',
				})
      }
    }
  })

  /**
   * Normal Image Uploads
   */
  var img_stores = _.map(['big','medium','small','thumb'], function(s){
    return new FS.Store.S3(s)
  })
  Images = new FS.Collection("images", {
    stores: img_stores,
    filter: {
      maxSize: Meteor.settings.public.upload_limit,
      allow: { contentTypes: ['image/*'] },
      onInvalid: function (err_msg) {
        // Next 4 lines are temporary. When ge_media.js is rewritten, get rid of it.
        var popup = Session.get('popup')
        if (popup && popup.template=='popup_media') {
          popup.data.pip = err_msg
          Session.set('popup',popup)
          $('#popup-media').removeClass('working')
        } else
    			Session.set('popup', {
    				html: '<p>'+err_msg+'</p>',
    				ok: 'red',
    				class: 'bg-dim fade-in fixed-full',
      		})
      }
    },
  })

// Server
} else if (Meteor.isServer) {

  // Image Stores Options
  var aws_define = function(size, small) {
    var settings = small ? Meteor.settings.simg_size : Meteor.settings.img_size
    var aws_obj = {
      region: Meteor.settings.AWS.region,
      accessKeyId: Meteor.settings.AWS.accessKeyId,
      secretAccessKey: Meteor.settings.AWS.secretAccessKey,
      bucket: Meteor.settings.AWS.bucket,

      maxTries: 1, // Optional
      ACL: "private", // Optional
      folder: Meteor.settings.AWS.folder+"/"+size,

      transformWrite: function(fileObj, readStream, writeStream) {
        var resized_img = gm(readStream, fileObj.name()).resize( settings[size].width, settings[size].height).quality( settings[size].quality)
        if( settings[size].sharpen) resized_img.sharpen( settings[size].sharpen)
        resized_img.stream().pipe(writeStream)
      },
      //transformRead: function() {},
    }
    return aws_obj
  }

  /**
   * Small Image Uploads
   */
   var sImg_stores = _.map(['smedium','ssmall','sthumb'], function(s){
     return new FS.Store.S3(s, aws_define(s.substr(1), true))
   })

  sImages = new FS.Collection("sImages", {
  	stores: sImg_stores,
  	filter: {
      maxSize: Meteor.settings.public.small_upload_limit,
      allow: { contentTypes: ['image/*'] }
    }
  })

  /**
   * Normal Image Uploads
   */
   var img_stores = _.map(['big','medium','small','thumb'], function(s){
     return new FS.Store.S3(s, aws_define(s))
   })

  Images = new FS.Collection("images", {
    stores: img_stores,
    filter: {
      maxSize: Meteor.settings.public.upload_limit,
      allow: { contentTypes: ['image/*'] }
    }
  })
}
