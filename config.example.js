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

	prefix: development ? ";/" : "-",

	token: ""
};

module.exports = config;