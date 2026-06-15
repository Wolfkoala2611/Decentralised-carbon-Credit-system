# CarbonChain Backend Service

This directory contains the core backend services for the Carbon Marketplace.

## Setup

First, ensure you have your environment variables set up. Copy the example environment file and fill in your API keys:

```bash
cp .env.example .env
```

Install the required Node.js dependencies:

```bash
npm install
```

## Running the Server

Start the backend server on your local machine:

```bash
npm start
```

This will run the server at `http://localhost:3000`. The frontend will be served directly from this address.

## AI Configuration

The backend supports multiple AI providers for project verification and analysis. You can configure them via the `.env` file:

- `OPENAI_API_KEY`: Enables OpenAI models
- `GROK_API_KEY`: Enables Grok models
- `GEMINI_API_KEY`: Enables Google Gemini models

If multiple keys are provided, the system prioritizes OpenAI, then Grok, then Gemini. You can also specify custom models using `OPENAI_MODEL`, `GROK_MODEL`, or `GEMINI_MODEL` environment variables.

If no API keys are provided or if the external services are unreachable, the server will automatically fall back to local rule-based evaluations to ensure the application continues running without interruption.
