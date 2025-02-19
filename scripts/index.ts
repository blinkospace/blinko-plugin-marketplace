import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { load } from 'js-yaml';

async function updatePluginsIndex() {
  console.log('Updating plugins index...');
  const pluginsDir = './plugins';
  const files = await readdir(pluginsDir);
  const plugins: any[] = [];

  for (const file of files) {
    if (file.endsWith('.yml')) {
      const content = await readFile(join(pluginsDir, file), 'utf-8');
      const pluginData = load(content);
      
      try {
        const repoPath = new URL(pluginData.url).pathname;
        const rawUrl = `https://raw.githubusercontent.com${repoPath}/main/plugin.json`;
        const response = await fetch(rawUrl);
        const releasesUrl = `https://api.github.com/repos${repoPath}/releases`;
        const releasesResponse = await fetch(releasesUrl);
        
        if (!releasesResponse.ok) {
          console.error(`Failed to fetch releases: ${releasesResponse.status}`);
          const errorBody = await releasesResponse.text();
          console.error('Error details:', errorBody);
          return;
        }

        const releases = await releasesResponse.json();
        const totalDownloads = Array.isArray(releases) ? releases.reduce((total: number, release: any) => {
          const assets = Array.isArray(release.assets) ? release.assets : [];
          return total + assets.reduce((assetTotal: number, asset: any) => {
            return assetTotal + (asset.download_count || 0);
          }, 0);
        }, 0) : 0;
        
        if (response.ok) {
          const pluginJson = await response.json();
          plugins.push({
            ...pluginJson,
            downloads: totalDownloads
          });
        }
      } catch (error) {
        console.error(`Error fetching plugin.json for ${file}:`, error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
        }
      }
    }
  }

  await writeFile('index.json', JSON.stringify(plugins, null, 2));
}

updatePluginsIndex().catch(console.error); 