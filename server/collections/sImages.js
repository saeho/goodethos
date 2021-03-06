
/**
 * Small Image Uploads
 * Look to "/lib/collections/" folder for the sImages settings.
 */

// Allow & Deny
sImages.allow({
  insert: function(userId, document) {
    return userId==document.owner
  },
  update: function(userId, document) {
    return userId==document.owner
  },
  remove: function(userId, document) {
    return userId==document.owner
  }
})

var get_img_obj = function( key, name) {
  var sizes = ['medium','small','thumb']
  var url_obj = { key: key }
  _.each( sizes, function( size){
    url_obj[size] = GE_Help.nk(Meteor, 'settings.AWS')
      ? Meteor.settings.AWS.root+Meteor.settings.AWS.bucket+'/'+Meteor.settings.AWS.folder+'/'+size+'/sImages/'+key+'-'+name
      : file.url
  })
  return url_obj
}

// Methods
Meteor.methods({
  sImage_obj: function( args) {
    if( !_.isObject(args) || !args.key || !args.name) return false
    var img_obj = get_img_obj(args)
    return img_obj
  },
})
