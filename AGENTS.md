# TECHINPEDIA AGENT OPERATING RULES

## Mandatory startup procedure

Before modifying any code, every agent MUST read:

1. `AGENTS.md`
2. `docs/project/PROJECT_CONTEXT.md`
3. `docs/project/DEPLOYMENT_MAP.md`
4. `docs/project/ARCHITECTURE_DECISIONS.md`
5. `docs/project/CURRENT_STATE.md`
6. `docs/project/NEXT_PHASE.md`
7. `docs/project/DO_NOT_BREAK.md`

Then inspect the actual relevant source code.

Never rely only on previous chat context.

## MANDATORY END-OF-TASK MEMORY UPDATE

Every future agent task MUST end by reviewing whether these files need updates:

- CURRENT_STATE.md
- NEXT_PHASE.md
- ARCHITECTURE_DECISIONS.md
- DEPLOYMENT_MAP.md
- CHANGELOG.md
- DO_NOT_BREAK.md

If architecture/deployment/state changed, update them in the SAME commit.

## NO HALLUCINATION RULE

If repository documentation and a user's new instruction conflict:

DO NOT GUESS.

The newest explicit user-approved instruction wins.

Update the relevant source-of-truth documentation in the same task.

If a value is unknown, write:
`UNKNOWN / NOT YET CONFIGURED`

Do NOT invent domains, ports, credentials, API keys, DB names, plan names, company names, deployment paths, or statuses.

            
SFTP / SSH Server Details:

Protocol: SFTP / SSH
Host: <SERVER_IP>
Username: <SERVER_USER>
Port: 22
1 - Remote Path: /home/<SERVER_USER>/public_html/techinpedia.com
2 - Remote Path: /home/<SERVER_USER>/public_html/admin.techinpedia.com
3 - Remote Path: /home/<SERVER_USER>/public_html/urban.techinpedia.com