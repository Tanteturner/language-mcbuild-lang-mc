# Change Log

## Unreleased

-   Syntax highlighting for MC-Build classes: `class` / `abstract class` with `extends`, class
    members (`entity`, `score` / `data` fields, `constructor`, `destructor`, `method`, `tick`,
    `load`), the `new`, `invoke` and `attach` statements (also after `execute ... run`),
    `this.<field>` and `Class.<field>` in commands, and `@e[class=Name]` selectors.
-   Snippets for classes, methods, constructors, `new`, `invoke` and `attach`.
-   `yarn build-mcfunction --local` re-applies the MC-Build patches to the bundled mcfunction
    grammar without downloading a new copy.

-   Initial release
