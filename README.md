# Catalyst | Node.js API

This is the repo for Not-Equal Catalyst's API.
It is a [ChowChow](https://www.npmjs.com/package/@robb_j/chowchow) app,
using [node.js](https://nodejs.org) & [express](https://expressjs.com/),
written in [TypeScript](https://www.typescriptlang.org/)
and deployed through [Docker](https://www.docker.com/).
It serves data from a [redis](https://redis.io/) database, which is put there by [catalyst-trello-scraper](https://github.com/unplatform/catalyst-trello-scraper).

[What is Not-Equal Catalyst?](https://github.com/unplatform/catalyst-about)

<!-- toc-head -->

## Table of Contents

- [What is this](#what-is-this)
- [Development](#development)
  - [Setup](#setup)
  - [Regular use](#regular-use)
  - [Irregular use](#irregular-use)
  - [Code Structure](#code-structure)
  - [Code formatting](#code-formatting)
  - [Testing](#testing)
- [Deployment](#deployment)
  - [Building the image](#building-the-image)
  - [Using the image](#using-the-image)
  - [Environment variables](#environment-variables)
  - [Endpoints](#endpoints)
- [Future Work](#future-work)

<!-- toc-tail -->

## What is this

This repo provides a http API to fetch projects from a redis cache
which have been put there by [unplatform/catalyst-trello-scraper](https://github.com/unplatform/catalyst-trello-scraper).
Cards are retrieved from a redis instances and are sent to the client as JSON.
Lightweight analytics are written to a mongo database.

The endpoints follow a meta-data envelope, where `data` is the endpoint payload:

```json
{
  "meta": {
    "success": true,
    "messages": [],
    "status": 200,
    "name": "@openlab/catalyst-node-api",
    "version": "0.2.0"
  },
  "data": { "msg": "Hey!" }
}
```

## Usage

This repo generates a Docker image which runs the node.js server on port `3000`.

Here's an example with docker-compose:

```yml
version: '3'

services:
  node-api:
    image: ghcr.io/digitalinteraction/catalyst-api
    restart: unless-stopped
    ports:
      - 3000:3000
    environment:
      WEB_URL: https://catalyst.not-equal.tech
      REDIS_URL: redis://your_redis_url
      MONGO_URL: mongodb://your_mongo_url
      LOG_LEVEL: info
```

> Get the [latest version](https://github.com/digitalinteraction/catalyst-api/pkgs/container/catalyst-api)

### Environment variables

There are some required and some option environment variables, shown below.

| Variable       | Description                                                |
| -------------- | ---------------------------------------------------------- |
| WEB_URL        | **required** Where the web ui is, used to set cors headers |
| REDIS_URL      | **required** The connection details of the redis database  |
| MONGO_URL      | **required** The connection details of the mongo database  |
| LOG_LEVEL      | (optional) How much logging to generate                    |
| ENABLE_SOCKETS | (optional) Enable the websocket analytics server           |

> For information about LOG_LEVEL see [chowchow-logger](https://github.com/robb-j/chowchow-logger#environment-variables).
> Logs are written to `/app/logs` which is an internal volume by default,
> You can bind those logs to the host machine if you want.

### Endpoints

There are 5 endpoints

| Route           | Description                                       |
| --------------- | ------------------------------------------------- |
| `GET: /`        | An endpoint to let you know everything is working |
| `GET: /cards`   | Retrieve cards from the redis database            |
| `GET: /labels`  | Get the labels which can be filtered by           |
| `GET: /content` | Retrieve site config from the redis database      |
| `GET: /stats`   | Get analytics stats about site usage              |

There are also development endpoints when `NODE_ENV=development`

| Route                | Description                                 |
| -------------------- | ------------------------------------------- |
| `GET: /dev/errors`   | Get errors that have happened in the webapp |
| `GET: /dev/stats`    | Get raw stats                               |
| `GET: /dev/searches` | Get searches that have occured              |

### Sockets

The site uses sockets for anonymous analytics.
A JSON payload is expected with a root level `type` which is used to route the socket to a handler.
Any message with unknown type or incorrect body is silently ignored.

| Type             | Description                                                |
| ---------------- | ---------------------------------------------------------- |
| `echo`           | A test socket which echo's back your body (sans type)      |
| `page_view`      | Register a page was viewed, params: `path`                 |
| `project_action` | Register an action on a project, params: `project`, `link` |
| `client_error`   | Tell the API about an error, params: `message`, `stack`    |
| `search_action`  | Register a user search, params: `search`, `filters`        |

## Development

### Setup

To develop on this repo you will need to have [Docker](https://www.docker.com/) and
[node.js](https://nodejs.org) installed on your dev machine and have an understanding of them.
This guide assumes you have the repo checked out and are on macOS, but equivalent commands are available.
You will also need a Trello account which is used to pull the data from.

You'll only need to follow this setup once for your dev machine.

```bash
# Install dependancies
npm install

# Setup your environment
cp .env.example .env

# Follow these instructions to get your Trello credentials
open https://github.com/unplatform/catalyst-trello-scraper#setup
```

### Regular use

These are the commands you'll regularly run to develop the API, in no particular order.

```bash
# Start up a redis instance seeded it with projects and mongo for analytics
# -> Run this in a new terminal tab
# -> Stop this with a Ctrl+C
# -> See `docker-compose.yml` for how it works
docker-compose up

# Run the API in development mode
# -> Runs the TypeScript directly with `ts-node` and loads the .env
# -> Uses `nodemon` to watch for changes, which will restart the app on save.
npm run dev

# Run unit tests
# -> Looks for files named `*.spec.ts` in the src directory
npm run test
```

### Irregular use

These are commands you might need to run but probably won't, also in no particular order.

```bash
# Generate the table of contents for this readme
# -> It'll replace content between the toc-head and toc-tail HTML comments
npm run gen-readme-toc

# Manually lint code with TypeScript's `tsc`
npm run lint

# Manually format code
# -> This repo is setup to automatically format code on git-push
npm run prettier

# Manually transpile TypeScript to JavaScript
# -> This is part of the docker build which is triggered when deploying
# -> Writes files to dist, which is git-ignored
npm run build

# Manually start code from transpilled JavaScript
# -> It'll automatically load your local .env
npm run start
```

### Commits

All commits to this repo must follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
This ensures changes are structured and means the [CHANGELOG.md](/CHANGELOG.md) can be automatically generated.

This standard is enforced through a `commit-msg` hook using [yorkie](https://www.npmjs.com/package/yorkie).

### Code Structure

| Folder       | Contents                                     |
| ------------ | -------------------------------------------- |
| dist         | Where the transpilled JavaScript is built to |
| logs         | Where access and error logs are stored       |
| node_modules | Where npm's modules get installed into       |
| src          | Where the code of the app is                 |

### Code formatting

This repo uses [Prettier](https://prettier.io/) to automatically format code to a consistent standard.
This works using the [husky](https://www.npmjs.com/package/husky)
and [lint-staged](https://www.npmjs.com/package/lint-staged) packages to
automatically format code whenever you commit code.
This means that code that is pushed to the repo is always formatted to a consistent standard.

You can manually run the formatter with `npm run prettier` if you want.

Prettier is slightly configured in [.prettierrc.yml](/.prettierrc.yml)
and also ignores files using [.prettierignore](/.prettierignore).

### Testing

> This API is currently very simple and doesn't have any unit tests yet

This repo uses [unit tests](https://en.wikipedia.org/wiki/Unit_testing) to ensure that everything is working correctly, guide development, avoid bad code and reduce defects.
The [Jest](https://www.npmjs.com/package/jest) package is used to run unit tests.
Tests are any file in `src/` that end with `.spec.ts`, by convention they are inline with the source code,
in a parallel folder called `__tests__`.

```bash
# Run the tests
npm test -s

# Generate code coverage
npm run coverage -s
```

## Deployment

### Building the image

This repo uses a [GitLab CI](https://about.gitlab.com/product/continuous-integration/)
to build a Docker image when you push a git tag.
This is designed to be used with the `npm version` command so all docker images are [semantically versioned](https://semver.org/).
The `:latest` docker tag is not used.

This job runs using the [.gitlab-ci.yml](/.gitlab-ci.yml) file which
runs a docker build using the [Dockerfile](/Dockerfile)
and **only** runs when you push a [tag](https://git-scm.com/book/en/v2/Git-Basics-Tagging).

It pushes these docker images to the GitLab registry of the repo.
A slight nuance is that it will replace a preceding `v` in tag names, formatting `v1.0.0` to `1.0.0`.

```bash
# Generate a new release
# -> Generates a new version based on the commits since the last version
# -> Generates the CHANGELOG.md based on those commits
# -> There is a "preversion" script to lint & run tests
npm run release

# Push the new version
# -> The GitLab CI will build a new docker image for it
git push --follow-tags
```

## Future work

- n/a
