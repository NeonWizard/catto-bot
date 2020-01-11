const {promisify} = require('util');

module.exports = async function() {
	const { dbquery } = this;

	class UserModel {
		constructor() {
			throw "This is a static class, don't construct an instance.";
		}

		static async getByID(id) {
			const result = await dbquery("SELECT * FROM User WHERE id=?", [id]);
			if (result.length == 0) return null;
			return result[0];
		}

		// -- CREDITS
		static async addCredits(uid, credits) {
			const result = await dbquery("UPDATE User SET credits=credits+? WHERE id=?", [credits, uid]);
			return !!result.affectedRows;
		}
		static async setCredits(uid, credits) {
			const result = await dbquery("UPDATE User SET credits=? WHERE id=?", [credits, uid]);
			return !!result.affectedRows;
		}

		// -- XP
		static async addXP(uid, xp) {
			const result = await dbquery("UPDATE User SET xp=xp+? WHERE id=?", [xp, uid]);
			return !!result.affectedRows;
		}
		static async setXP(uid, xp) {
			const result = await dbquery("UPDATE User SET xp=? WHERE id=?", [xp, uid]);
			return !!result.affectedRows;
		}
	}

	return UserModel;
}