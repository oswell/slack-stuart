var AWS = require('aws-sdk');
var _ = require('underscore');

module.exports.run = function(request, stuart, plugin) {

    AWS.config = new AWS.Config({ "region": "us-west-2" });
    var ec2 = new AWS.EC2();

    var filter = request.text.substr(request.text.indexOf(" ") + 1);
    var params = { "Filters": [ {'Name': 'tag:Name', 'Values': [ filter ] } ] };

    stuart.slack_post("Searching instances...", '#'+request.channel_name, request.user_name)

	ec2.describeInstances(params, function(err, data) {
		if (err) {
			stuart.slack_post("Error fetching instance data, " + err, '#'+request.channel_name, request.user_name)
		} else {
		    instances = [];

            _.each(data.Reservations, function(reservation) {
                _.each(reservation.Instances, function(instance) {
                    instance.TagMap = {};
                    _.each(instance.Tags, function(tag) {
                        instance.TagMap[tag.Key.replace(".","_").toLowerCase()] = tag.Value;
                    });
					instances.push(instance.TagMap['name'] + ": [" + instance.PrivateIpAddress + "]")
                });
            });

			stuart.slack_post("Found " + instances.length.toString() + " servers matching your query.\n" + instances.join("\n"), '#'+request.channel_name, request.user_name)
		}
	});
};

module.exports.help = function(request, stuart) {
	stuart.slack_post("Search instances, Usage : '/bot servers [filter string]', eg. '/bot servers app01dc*.d1.*'", '@'+request.user_name, request.user_name);
};
