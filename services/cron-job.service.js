const Cron = require("moleculer-cron");


module.exports = {
	name: "cron-job",
	mixins: [Cron],
	crons: [
		{
			name: "JobHelloWorld",
			cronTime: "* 1 * * *",
			onTick: function() {

				console.log("JobHelloWorld ticked");

				this.getLocalService("cron-job")
					.actions.say()
					.then((data) => {
						console.log("Oh!", data);
					});
			},
			runOnInit: function() {
				console.log("JobHelloWorld is created");
			},
			manualStart: true,
			timeZone: "America/Nipigon"
		},
		{
			name: "JobWhoStartAnother",
			cronTime: "* 1 * * *",
			onTick: function() {

				console.log("JobWhoStartAnother ticked");
				console.log(this.call("banner.welcome",{name:"tien"}));
				let job = this.getJob("JobHelloWorld");

				if (!job.lastDate()) {
					job.start();
				} else {
					console.log("JobHelloWorld is already started!");
				}

			},
			runOnInit: function() {
				console.log("JobWhoStartAnother is created");
			},
			timeZone: "America/Nipigon"
		}
	],

	actions: {

		say: {
			handler(ctx) {
				return "HelloWorld!";
			}
		}

	}
};