const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const fs = require('fs').promises;

async function setupPython(version) {
    try {
        await exec.exec('curl', ['-sL', 'https://raw.githubusercontent.com/actions/setup-python/main/dist/setup/setup-python.js', '-o', 'setup-python.js']);
        await exec.exec('node', ['setup-python.js', '--version', version]);
        await exec.exec('python', ['-m', 'pip', 'install', '--upgrade', 'pip']);
        return true;
    } catch (error) {
        core.warning(`Failed to setup Python: ${error.message}`);
        return false;
    }
}

async function run() {
    try {
        const pythonVersion = core.getInput('python-version');
        const blackVersion = core.getInput('black-version');
        const blackArgs = core.getInput('black-args');
        const token = core.getInput('github-token');
        const paths = core.getInput('paths');
        const failOnError = core.getInput('fail-on-error').toLowerCase() === 'true';
        const octokit = github.getOctokit(token);

        let blackOutput = '';
        let blackExitCode = 0;

        const pythonSetup = await setupPython(pythonVersion);
        if (!pythonSetup) {
            core.warning('Using system Python as setup failed');
        }

        try {
            await exec.exec('python', ['-m', 'pip', 'install', `black==${blackVersion}`]);
            
            const targetPaths = paths.split(' ').filter(p => p);
            blackArgs.push(...targetPaths);

            await exec.exec('black', blackArgs, {
                listeners: {
                    stdout: (data) => {
                        blackOutput += data.toString();
                    },
                    stderr: (data) => {
                        blackOutput += data.toString();
                    }
                },
                ignoreReturnCode: true
            }).then(exitCode => {
                blackExitCode = exitCode;
            });
        } catch (error) {
            blackExitCode = 1;
            blackOutput += `\nError: ${error.message}`;
        }

        const commentBody = `## Black Formatting Report
\`\`\`
${blackOutput}
\`\`\`

${blackExitCode === 0 
    ? '✅ All files are properly formatted!' 
    : `⚠️ Some files need formatting. Please run:
\`\`\`bash
pip install black==${blackVersion}
black ${paths}
\`\`\``}`;

        if (github.context.payload.pull_request) {
            const { owner, repo } = github.context.repo;
            const pull_number = github.context.payload.pull_request.number;

            const comments = await octokit.rest.issues.listComments({
                owner,
                repo,
                issue_number: pull_number,
            });

            const existingComment = comments.data.find(
                comment => 
                    comment.user.type === 'Bot' && 
                    comment.body.includes('## Black Formatting Report')
            );

            if (existingComment) {
                await octokit.rest.issues.updateComment({
                    owner,
                    repo,
                    comment_id: existingComment.id,
                    body: commentBody,
                });
            } else {
                await octokit.rest.issues.createComment({
                    owner,
                    repo,
                    issue_number: pull_number,
                    body: commentBody,
                });
            }
        }

        if (blackExitCode !== 0 && failOnError) {
            core.setFailed('Black found formatting issues');
        } else if (blackExitCode !== 0) {
            core.warning('Black found formatting issues but fail-on-error is false');
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

run(); 