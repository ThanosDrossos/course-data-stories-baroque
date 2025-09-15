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

You can add new stories or edit existing ones in the `docs` directory. The files are written in Markdown format, and you can use Shmarql queries to visualize data. A few steps must be followed to register and correctly process new data stories.

##### 4. a) Create a directory for the new data story in the `src/docs/story` directory

A separate directory is created in the `src/docs/story` directory for each data story. The name of the directory is the Culture IRI of the new data story to be added. All files specific to the data story are stored in this directory, such as the `index.md` of the story itself, images, SPARQL queries and Markdown snippets.

##### 4. b) Create an `index.md` in the newly created data story directory

The entry point for each data story is an `index.md` file. The story is written in this file and other files are called up and integrated from it.

Example:

```
src/docs/story/E6263/index.md
```

##### 4. c) Add base path of the new data story directory to `src/mkdocs.yml`

To load snippets, such as custom Markdown files and SPARQL queries, the base path of the new directory must be added in the `src/mkdocs.yml` to

```
- pymdownx.snippets:
    base_path:
```

Example:

```
- docs/story/E6263/
```

##### 4. d) Add path to index.md of the new data story to `src/docs/.nav.yml`

For a new data story to also appear in the navigation, it must be added in `src/docs/.nav.yml` below

```
- Stories:
```
Example:

```
- 01 An Italian Data Journey: story/E6263/index.md
```

##### 4. e) Add accordion for new data story to `src/docs/story/index.md`

A short abstract, author information and a link to the new data story are added in `src/docs/story/index.md` so that the new data story also appears as an accordion on the 'Data Story Index' overview page.

Example:

```
/// details | **01 An Italian Data Journey**
**Abstract:** In this story we analyse Italian Opera of the 18th century using data from the NFDI4Culture Knowledge Graph and federated queries to Wikidata, Corago and the Partitura database of the DHI Rome.

**Author:** Torsten Schrade

[Read the full story](E6263/index.md)
/// 
```