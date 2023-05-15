# Overview

A command line website scraper that scrapes any company's website and uses OpenAI to perform analysis and return data in a structured JSON format.

## Getting Started

Create a `.env` file in the project root dir and add the following:

```terminal
OPENAI_SECRET_KEY="{YOUR_OPENAI_KEY}"
```

Install dependencies and build the app.

```terminal
yarn 
yarn build
```

Call the service from the command line.

```terminal
yarn start https://openline.ai
```

Substitute `https://openline.ai` with whatever website you want.
