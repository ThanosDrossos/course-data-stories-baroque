# Telling Data Stories with Semantic Technologies and Generative AI

FIZ Karlsruhe – Leibniz Institute for Information Infrastructure
AIFB – Karlsruhe Institute of Technology
Academy of Sciences and Literature, Mainz

## Instructions

To start writing your own data story, please follow these steps:

1. **Clone the repository**: Clone this repository to your local machine using the following command:

   ```bash
   git clone git@github.com:ISE-FIZKarlsruhe/course-data-stories.git
   ```

2. **Start the Shmarql container with docker compose**: Navigate to the cloned repository and and run the following command:
   ```bash
   cd course-data-stories && docker compose up -d
   ```

There should now be a running instance of the NFDI4Culture Datastories running on your machine, it can be viewd at this URI:

[http://localhost:7015/](http://localhost:7015/)

Try to create a new file named 'index.md' in the 'stories' folder. You can fill it with any markdown text, and then refresh the
following page in your browser: http://localhost:7015/course/

This should show the text that was just entered in the 'index.md' file you created.

## More details

The source files for the production NFDI4CUlture Datastories repository can be found at the following URI:
https://gitlab.rlp.net/adwmainz/nfdi4culture/knowledge-graph/shmarql/datastories

You can view the source for more details on how to create your own data stories here.
