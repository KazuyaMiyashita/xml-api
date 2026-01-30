# Working Principles for This Repository

## Coding

* Approach: Work slowly and carefully, emphasizing design quality and maintainability.
* Large-scale changes: Use `minimum-grammer.ts` to conduct small experiments when making significant modifications to the parser or architecture.
* If there are design tips or TODOs in the comments, don't remove them in your edits.

## Testing

* Standard requirement: All `pnpm tests` must pass before committing any changes.
* Experimental exception: When testing with `minimum-grammer.ts`, you only need to ensure that your specific changes and the tests in `minimum-grammer.test.ts` pass.

## Committing

* Commits are made in small units that make meaningful changes.
* Language: Commit messages must be written in Japanese.
* Branch management: Commit changes to the current branch. Merging into the `main` branch is prohibited.
* WIP records: After successfully completing an experiment with `minimum-grammer.ts`, include `wip:` in the commit message and review the changes to ensure they meet user expectations.

## Others

* Directory management: Moving or changing the current directory is prohibited.
* Updating waskwarrior tasks is the user's responsibility, not yours.
