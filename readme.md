
#Demo & Intro
For demo, see https://goodethos.com, you can create your own account or log in with **username "demo-public", password "demo-public"** to demo what you will get after installing this package.

This package is basically a free blog application for Meteor.JS. It also installs several very useful Meteor packages for you such Iron:Router, CollectionFS, accounts-facebook, accounts-twitter, accounts-password, accounts-instagram and more.

After installing, you can find your blog at **http://yoursite.com/blog**

**You should read this entire document before using the package**

#Differences
There are several differences between the version at https://goodethos.com and this package. For one, all the fonts are different. I originally used closed-sourced fonts for this application; however when I converted the application into a package, I had to find open-source alternatives for everything.

#Where Good Ethos Might be Useful
1. If you wanted to create an app where your users could comment/discuss using the same account they created in your app, this package would be helpful for you.
2. If you wanted to create an app where your blog/content is literally part of the app (i.e. your users are creating their own content, etc), then this package would be helpful for you.

#Amazon s3
In order to be able to upload images, you must have Amazon s3 set up. Without it, image uploads simply won't work. When I have some time, I will try to add support for image uploads without Amazon s3.

After downloading, there's a short installation process that asks for your Amazon s3 info. You can either enter the information there or put it inside your settings.json file like the example below. DO NOT put this information in your public settings.

Example:
"AWS": {
	"accessKeyId": "1234567890",
	"secretAccessKey": "abcdefghijklmno",
	"bucket": "goodethos",
	"folder": "uploads",
	"root": "https://s3-us-west-2.amazonaws.com/",
	"region": "us-west-2"
},

#Google Analytics
If you provide Google Analytics ID to your settings.json file, this package will keep track of your GA traffic.

Example (Keep this in "PUBLIC" settings):
"public": {
	...
	"gaId": "UA-15876555-13",
	...
}


#Sending Emails
You will need to add your SMTP settings in order to be able to send (verification) emails. To do that, enter your SMTP settings like this inside your **private** settings in your settings.json file.


Example:
"smtp": {
	"username": "hello@goodethos.com",
	"password": "PASSWORD",
	"server": "smtp.gmail.com",
	"port": "1234"
},

#Logging in with Twitter/Facebook/Instagram
Social media logins simply won't work if you don't provide the correct info to the settings.json.

Example:
"Twitter": {
	"consumerKey": "1234567890",
	"secret": "abcdefghhijklmno"
},
"Instagram": {
	"clientId": "1234567890",
	"clientSecret": "abcdefghhijklmno"
},
"Facebook": {
	"appId": "1234567890",
	"secret": "abcdefghhijklmno"
},

#TODO Lists
1. Because this package was actually an application first, I had to go back and retouch all of my code so that it would become stand-alone. As such, I wouldn't be surprised if there were some bugs. Please bare with me for a little bit. But for the most part everything importnat is working fine as long as you provide all the settings.
2. There are no options to "not" use one of the attached packages. For example, if you don't want your application to allow Facebook login, that Facebook login button will always be there even if you don't provide the Facebook API keys. I will make things like this optional soon.
3. I'm less proud of some parts of my code. For example, the user role/permission system is written very loosely, it's basically a field called "level" inside the users collection. Then there's a function that controls whether or not the user is allowed to do something. It's as unsophisticated as it sounds and I hope to rewrite how the roles/permissions are currently done - at a later time.
4. Also, the commenting system code is unsophisticated as well but not as bad as the roles/permissions.

#Email Me
I would love to hear from you if you use my package. You can email me at jason.saeho@gmail.com. Let me know any bugs you find, requests or any way I can help. I would also love it if you want to work on this project with me.
