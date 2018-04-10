import Octokit from '@Octokit/rest';

module.exports = function (github, token) {
    var octokit = new Octokit();
    if (token) {
        octokit.authenticate({
            type: 'token',
            token: token
        });
    }

    async function paginate(method, params) {
        let response = await method(params);
        let { data } = response;
        while (octokit.hasNextPage(response)) {
            response = await octokit.getNextPage(response);
            data = data.concat(response.data);
        }
        return data;
    }

    /*
    TODO can we grab files in original request? 
    GitHub API does not return files in the original
    paginated request, this process is slow and you hit 
    the rate limit fast without a token.
    */
    async function getCommits(github, summarizedCommits) {
        let commits = [];
        let requestCount = 0;
        for (const summarizedCommit of summarizedCommits) {
            let commit = await octokit.repos.getCommit({
                owner: github.owner,
                repo: github.repo,
                sha: summarizedCommit.sha
            });
            commits.push(commit.data);
            requestCount++;
            let progress = ((requestCount / summarizedCommits.length) * 100);
            console.info(`Commit history progress: ${progress.toFixed(2)}`);
        };
        return commits;
    }


    return new Promise((resolve, reject) =>{
        paginate(octokit.repos.getCommits, {
            owner: github.owner,
            repo: github.repo,
            per_page: 100
        }).then(summarizedCommits => {
            return getCommits(github, summarizedCommits)
        }).then(commits => {
            resolve(commits)
        }).catch(reason => {
            reject(reason);
        });
    });

}