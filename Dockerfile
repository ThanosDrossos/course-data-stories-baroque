FROM ghcr.io/epoz/shmarql:v0.54

RUN pip install git+https://gitlab.rlp.net/adwmainz/nfdi4culture/knowledge-graph/mkdocs-nfdi4culture.git@main#egg=mkdocs-nfdi4culture

RUN rm -r /src/docs/
COPY src/docs/ /src/docs/
COPY src/mkdocs.yml /src/mkdocs.yml

WORKDIR /src/

RUN mkdocs build