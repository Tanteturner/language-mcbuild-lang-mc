const fs = require('fs')

const MC_LANG_URL =
	'https://raw.githubusercontent.com/MinecraftCommands/syntax-mcfunction/main/mcfunction.tmLanguage.json'

const SYNTAX_OUT_PATH = './syntaxes/syntax-mcfunction/mcfunction.tmLanguage.json'

function inject_lang_mc_syntax(json) {
	delete json.fileTypes
	json.scopeName = 'source.injected-mcfunction'
	json.uuid = 'a339b5ad-d627-4019-a062-1fec13f43274'
	json.repository['inline-js'] = {
		patterns: [
			{
				captures: {
					1: {
						name: 'punctuation.definition.template-expression.begin.lang-mc',
					},
					2: {
						name: 'inline-js',
						patterns: [
							{
								include: 'source.js',
							},
						],
					},
					3: {
						name: 'punctuation.definition.template-expression.end.lang-mc',
					},
				},
				match: '(<%)(.+?)(%>)',
				name: 'meta.inline-js',
			},
		],
	}
	const INCLUDE_INLINE_JS = { include: '#inline-js' }
	// Add inline-js to all patterns that need it.
	json.repository['root'].patterns.unshift(INCLUDE_INLINE_JS)
	json.repository['literals_string-single'].patterns.splice(1, 0, INCLUDE_INLINE_JS)
	json.repository['literals_string-double'].patterns.splice(1, 0, INCLUDE_INLINE_JS)
	json.repository['names'].patterns.splice(7, 0, INCLUDE_INLINE_JS)
	json.repository['property'].patterns.forEach(pattern => {
		pattern.patterns.unshift(INCLUDE_INLINE_JS)
	})
	// FIXME These will need to change every time they are updated in the original mcfunction syntax.
	json.repository['resource-name'].patterns[0].match =
		'#?[a-z_][a-z\\_\\.\\-]*:((<%)(.+?)(%>))?[a-z0-9_\\.\\/\\-]+'
	// Fix inline comments incorrectly ignoring inline-js blocks.
	json.repository.comments.patterns[1].match = '$#(?!<%).*$'
	// Fix entity names consuming first part of unquoted strings.
	json.repository['names'].patterns[4].match = '[A-Za-z_]+(?=\\W)'
}

// MCB classes: `this.<field>`, `<Class>.<static field>` and `@e[class=<Class>]`.
// Idempotent, so it can be applied to the checked-in grammar with `--local`.
function inject_oop_syntax(json) {
	const CLASS_REF = '(?:[a-z0-9_.\\-]+:(?:[a-z0-9_.\\-]+/)*)?[A-Za-z][A-Za-z0-9_]*'
	json.repository['mcb-oop-field'] = {
		patterns: [
			{
				// Same word boundary as the compiler: not after `:`, `.`, `/`, `#`, ...
				match: '(?<![A-Za-z0-9_:./#$@~^\\\\-])(this)(\\.)([a-z0-9_]+)',
				captures: {
					1: { name: 'variable.language.this.mcb' },
					2: { name: 'punctuation.accessor.mcb' },
					3: { name: 'variable.other.property.mcb' },
				},
				name: 'meta.mcb-oop-field',
			},
			{
				// Class names are PascalCase by convention; lowercase ones aren't highlighted.
				match: '(?<![A-Za-z0-9_:./#$@~^\\\\-])([A-Z][A-Za-z0-9_]*)(\\.)([a-z0-9_]+)\\b',
				captures: {
					1: { name: 'entity.name.type.class.mcb' },
					2: { name: 'punctuation.accessor.mcb' },
					3: { name: 'variable.other.property.static.mcb' },
				},
				name: 'meta.mcb-oop-field',
			},
		],
	}
	json.repository['mcb-oop-class-arg'] = {
		match: `\\b(class)(=)(!?)(${CLASS_REF})`,
		captures: {
			1: { name: 'variable.other.mcfunction' },
			2: { name: 'keyword.operator.mcfunction' },
			3: { name: 'keyword.operator.mcfunction' },
			4: { name: 'entity.name.type.class.mcb' },
		},
		name: 'meta.mcb-oop-class-arg',
	}
	const addFirst = (patterns, name, after) => {
		if (patterns.some(p => p.include === `#${name}`)) return
		const index = after ? patterns.findIndex(p => p.include === after) + 1 : 0
		patterns.splice(index, 0, { include: `#${name}` })
	}
	// Before `#names`, which would otherwise take `this.hp` as one unquoted word.
	addFirst(json.repository['root'].patterns, 'mcb-oop-field', '#inline-js')
	// Selector arguments: `[class=Enemy]`, before the generic key/value patterns.
	addFirst(json.repository['property'].patterns[1].patterns, 'mcb-oop-class-arg', '#inline-js')
	// JSON text selectors: `{"selector":"@e[class=Enemy]"}`.
	addFirst(json.repository['literals_string-double'].patterns, 'mcb-oop-class-arg')
}

async function main() {
	if (process.argv.includes('--local')) {
		// Only apply the MCB class patterns to the checked-in grammar.
		const json = JSON.parse(fs.readFileSync(SYNTAX_OUT_PATH, 'utf8'))
		inject_oop_syntax(json)
		fs.writeFileSync(SYNTAX_OUT_PATH, JSON.stringify(json, null, '\t') + '\n')
		return
	}

	const data = await fetch(MC_LANG_URL)
	const json = await data.json()

	fs.writeFileSync(SYNTAX_OUT_PATH, JSON.stringify(json, null, '\t') + '\n')

	inject_lang_mc_syntax(json)
	inject_oop_syntax(json)
	fs.writeFileSync(SYNTAX_OUT_PATH, JSON.stringify(json, null, '\t') + '\n')
}

void main()
