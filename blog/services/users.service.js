const fake = require("fakerator")();

function generateFakeData(count) {
	let rows = [];

	for(let i = 0; i < count; i++) {
		let item = fake.entity.user();
		item.id = i + 1;
		item.author = fake.random.number(1, 10);

		rows.push(item);
	}

	return rows;
}

module.exports = {
	name: "users",

	actions: {

	},

	created() {
		this.logger.debug("Generate fake data...");
		this.rows = generateFakeData(10);
	}
};