# Black Code Format Action

A GitHub Action that runs Black code formatter on your Python code and provides formatting feedback directly in your pull requests.

## Features

- Runs Black code formatter on Python files
- Comments on pull requests with formatting results
- Updates existing comments instead of creating new ones
- Configurable paths to check
- Optional failure on formatting issues
- Automatic Python setup
- Detailed formatting instructions in comments
- Customizable Black arguments

## Usage

Add this to your GitHub workflow:

```yaml
name: Black Code Format Check

on:
  pull_request:
    branches: [ main, develop ]
    paths:
      - '**.py'

jobs:
  black:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: your-username/black-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          python-version: '3.x'        # optional, default is '3.x'
          black-version: '23.12.0'     # optional, default is '23.12.0'
          black-args: '--check --verbose'  # optional, default is '--check --verbose'
          paths: 'src tests'           # optional, default is '.'
          fail-on-error: 'true'        # optional, default is 'true'
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `github-token` | GitHub token for PR comments | Yes | `${{ github.token }}` |
| `python-version` | Python version to use | No | '3.x' |
| `black-version` | Black version to use | No | '23.12.0' |
| `black-args` | Space-separated Black arguments | No | '--check --verbose' |
| `paths` | Space-separated paths to check | No | '.' |
| `fail-on-error` | Whether to fail on formatting issues | No | 'true' |

## Examples

### Check specific directories
```yaml
- uses: your-username/black-action@v1
  with:
    paths: 'src tests scripts'
```

### Format check without failing
```yaml
- uses: your-username/black-action@v1
  with:
    fail-on-error: 'false'
```

### Custom Black arguments
```yaml
- uses: your-username/black-action@v1
  with:
    black-args: '--check --diff --color'
```

## How it works

1. Sets up Python environment
2. Installs Black with specified version
3. Runs Black with custom arguments on specified paths
4. Creates or updates a PR comment with results
5. Fails the check if formatting issues are found (configurable)

## License

MIT
