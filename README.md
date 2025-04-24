# NFDI4Culture Data Stories

This repository contains a customized Shmarql instance with the official NFDI4Culture theme for our interactive data story platform.

## How to run it

#### 1. Clone the repository

```
git clone https://gitlab.rlp.net/adwmainz/nfdi4culture/knowledge-graph/shmarql/datastories.git
```

#### 2. Start the Shmarql container with docker compose

```
cd datastories && docker compose up -d
```

#### 3. Open it in your browser

The Shmarql instance will run at http://localhost:7014

#### 4. Edit the files in the ./docs directory

You can add new stories or edit existing ones in the `docs` directory. The files are written in Markdown format, and you can use Shmarql queries to visualize data.
