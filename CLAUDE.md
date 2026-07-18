## Multi-lane git rules

NEVER run git restore, git checkout --, git stash, or git clean on any file. If git status shows modified files outside your task's territory, they belong to a parallel session — leave them exactly as they are and stage ONLY your own files by explicit path.

Commit your territory's files as soon as your implementation compiles and passes checks. Never leave finished work sitting unstaged.

Always push immediately after committing. A local-only commit is unfinished work.

Playwright API note: use browser.newContext(), not browser.createContext(). Verification claims require an actual screenshot artifact; "deferred" screenshots = verification not done.
