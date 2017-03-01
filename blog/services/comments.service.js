const fake = require("fakerator")();

function generateFakeData(count) {
	let rows = [];

	for(let i = 0; i < count; i++) {
		let item = {
			id: i + 1,
			post: fake.random.number(1, 10),
			user: fake.random.number(1, 10),
			content: fake.lorem.paragraph()
		};

		rows.push(item);
	}

	return rows;
}

module.exports = {
	name: "comments",

	actions: {

	},

	created() {
		this.logger.debug("Generate fake data...");
		this.rows = generateFakeData(30);
	}
};