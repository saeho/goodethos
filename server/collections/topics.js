
/**
 * Currently there is absolutely no way to edit, add or delete anything from the Topics collection using the app.
 * Everything with the Topics collection is controlled directly from Mongo.
 *
 * This is one of the things on the TODO list for the Good Ethos app.
 */

Meteor.publish("all-topics", function() {
  return GE_Topics.find()
})
