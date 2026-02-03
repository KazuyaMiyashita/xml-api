# Working Principles for This Repository

## Coding

* Approach: Work slowly and carefully, emphasizing design quality and maintainability.
* If there are design tips or TODOs in the comments, don't remove them in your edits.

## Testing

* **Standard Requirement:** All tests (`pnpm test`) and builds must pass across the entire workspace before committing any changes.

## Committing

* **Language:** Commit messages must be written in Japanese.
* **Granularity:** Commits should be made in small units that represent meaningful changes.
* **TODO Workflow:** Commit changes immediately after clearing a single item (checkbox) in `TODO.md`.
* **Documentation:** For changes in `xml-api`, use `pnpm docs:gen-api` to reflect JSDoc content in your documentation before your commit.
* **Branch Management:** Commit changes to the current branch. Merging into the `main` branch is prohibited.

## Scope of Work

* **Context Awareness:** Be mindful of whether you are working on the core `xml-api` library or the `xml-api-editor`.
* **Editor Development:** When focusing on `xml-api-editor` development:
    * Do not modify the `xml-api` library code directly unless explicitly instructed.
    * **Feedback Loop:** If issues or feature requests for `xml-api` arise during editor development, document them in `packages/xml-api-editor/XML_API_REQUESTS.md` instead of attempting to fix them immediately in the library.

## Others

* **Directory Management:** Moving or changing the current directory is prohibited unless structurally necessary for the workspace.
* **Task Management:** Updating taskwarrior tasks is the user's responsibility, not yours.
