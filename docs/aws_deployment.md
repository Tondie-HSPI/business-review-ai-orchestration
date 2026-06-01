# AWS Deployment Notes

SubmissionReady AI now includes a Next.js front end in `web/` and Python workflow logic in `src/`.

## Recommended AWS Demo Path

Use AWS Amplify for the first polished demo deployment:

1. Connect the GitHub repository to AWS Amplify.
2. Set the app root to `web`.
3. Use `npm install` as the install command.
4. Use `npm run build` as the build command.
5. Deploy the Next.js app.

This path is the simplest way to show a clean web product without managing servers.

The deployed demo includes three workflows:

- Liquor / Restaurant quote intake
- Application prep
- Business review

## Local Next.js Commands

```bash
cd web
npm install
npm run dev
```

Production build:

```bash
cd web
npm run build
```

## Python Workflow Checks

The Python logic and tests remain available from the repository root:

```bash
pip install -r requirements.txt
python -m pytest
```

## Production Extensions

- Add a Python API layer with FastAPI or AWS Lambda.
- Persist review packets to DynamoDB or Postgres.
- Add authentication with Cognito.
- Add file upload and document parsing.
- Add audit logging for triggered rules and reviewer decisions.
- Add optional LLM extraction behind environment variables.
