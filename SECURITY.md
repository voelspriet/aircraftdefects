# Security policy

## Reporting a vulnerability

Use GitHub's private vulnerability reporting on this repository: **Security** ->
**Report a vulnerability**. That opens a private thread with the maintainer and
is the right route for anything that should not be public yet.

For anything else, open a normal issue.

Please do not open a public issue for:

- a way to read data the site does not intend to publish
- a way to run code, write files or reach the host through the site
- a way to spend the project's model budget from outside
- credentials or keys found anywhere in the repository or in a response

## What this project handles

The site serves two public government files, the FAA Service Difficulty Reports
and the NTSB aviation accident database, plus the FAA releasable registry. None
of it is confidential and there are no user accounts, no login and no personal
data collected from readers.

The one secret is the model API key. It is read from the environment
(`ZAI_API_KEY`), never committed, and `.env` is in `.gitignore`. The health
endpoint publishes whether a key is set, never the key. If you find a key in the
repository, in the git history or in any response, report it privately using the
route above and it will be rotated.

## Scope

The live site is `aircraftdefects.com`. Please do not run load tests, automated
scanners or anything that would spend the model budget against it. If you want
to test something that needs volume, say so in a private report and it can be
arranged against a local build.

## What is not a vulnerability

A number on the page that disagrees with the FAA file is a data-integrity fault,
not a security one. Those are welcome as ordinary public issues, and there is a
template for them.
