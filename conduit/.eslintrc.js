module.exports = {
    "root": true,
    "env": {
        "node": true,
        "commonjs": true,
        "es6": true,
        "jquery": false,
        "jest": true,
        "jasmine": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "sourceType": "module",
		"ecmaVersion": 9
    },
    "rules": {
        "indent": [
            "warn",
            "tab",
            { "SwitchCase": 1 }
        ],
        "quotes": [
            "warn",
            "double"
        ],
        "semi": [
            "error",
            "always"
        ],
        "no-var": [
            "error"
        ],
        "no-console": [
            "off"
        ],
        "no-unused-vars": [
            "warn"
        ],
        "no-mixed-spaces-and-tabs": [
            "warn"
        ],
		"space-before-function-paren": [
			"warn",
			{
				"anonymous": "never",
				"named": "never",
				"asyncArrow": "always"
			}
		],
		"object-curly-spacing": [
			"warn",
			"always"
		],
		"require-atomic-updates": 0
    }
};
