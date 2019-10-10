const development = process.env.DEVELOPMENT === "true" || process.env.DEVELOPMENT === true;

let config = {
	debug: false,
	development,

	reactRoles: [
		{
			id: "",
			rct: "",
			sticky: false,
			title: "",
			desc: ""
		},
	],

	developers: ["193469296557424640"],

	prefix: development ? ";/" : "-",

	token: ""
};

module.exports = config;