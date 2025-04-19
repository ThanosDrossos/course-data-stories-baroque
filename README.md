# NFDI4Culture Data Stories

## How to run

1. Clone the repository

´´´
git clone https://gitlab.rlp.net/adwmainz/nfdi4culture/knowledge-graph/shmarql/datastories.git
´´´

2. Start the Shmarql container with docker compose

```
cd datastories && docker compose up -d
```

3. Install the NFDI4Culture theme

```
docker exec -it shmarql /usr/local/bin/pip install -r requirements.txt
```

4. Generate the website

```
docker exec -it shmarql mkdocs build
```

5. Open it in your browser

The Shmarql instance will run at http://localhost:7014
