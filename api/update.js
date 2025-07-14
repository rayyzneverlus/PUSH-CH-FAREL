import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { channels } = req.body;
  if (!Array.isArray(channels)) return res.status(400).json({ error: 'Invalid data' });

  const {
    GITHUB_USERNAME,
    GITHUB_REPO,
    GITHUB_FILE_PATH,
    GITHUB_BRANCH,
    GITHUB_TOKEN
  } = process.env;

  const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;

  try {
    const getRes = await fetch(url, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    const file = await getRes.json();
    const sha = file.sha;

    const newContent = Buffer.from(JSON.stringify({ channels }, null, 2)).toString('base64');

    const updateRes = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: 'Update channel list',
        content: newContent,
        sha,
        branch: GITHUB_BRANCH
      })
    });

    if (!updateRes.ok) {
      const text = await updateRes.text();
      return res.status(500).json({ error: text });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
