module.exports = async function() {
	const { dbconn } = this;

	class UserModel {
		constructor() {
			throw "This is a static class, don't construct an instance.";
		}

		static async getByID(id) {
			console.log(dbconn);
		}
	}

	return UserModel;
}