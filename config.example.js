const development = process.env.DEVELOPMENT === "true" || process.env.DEVELOPMENT === true;

let config = {
	debug: false,
	development,

	guild_id: "463463207114113024",

	reactRoles: [
		{
			id: "",
			rct: "",
			title: "",
			desc: ""
		},
	],

	rcs: [
		[ 'channel', 'roles', '632486044239003648' ],
		[ 'channel', 'testing', '602315767207297044' ],
		[ 'channel', 'staff_logs', '632486688035176448' ],
		[ 'channel', 'welcome', '463464079126691870' ],

		[ 'role', 'nsfw', '525433828806885386' ],
		// [ 'role', 'muted', '525729622202122250' ],
		[ 'role', 'staff', '463478079046680597' ]
	],

	developers: ["193469296557424640"],

	prefix: development ? ";/" : "-",

	dbpass: "",
	token: ""
};

module.exports = config;