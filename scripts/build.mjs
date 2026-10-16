import {readFile,mkdir,rm,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const [page,favicon,handler,manifest]=await Promise.all(['app/index.html','app/favicon.svg','worker/handler.mjs','.openai/hosting.json'].map(p=>readFile(new URL(p,root),'utf8')));
const metadata=JSON.parse(manifest);if(metadata.static)throw new Error('Worker hosting must not declare static.directory');
await rm(new URL('dist/',root),{recursive:true,force:true});
await mkdir(new URL('dist/server/',root),{recursive:true});await mkdir(new URL('dist/.openai/',root),{recursive:true});
await writeFile(new URL('dist/server/index.js',root),handler+'\nexport default createHandler('+JSON.stringify(page)+','+JSON.stringify(favicon)+');\n');
await writeFile(new URL('dist/.openai/hosting.json',root),manifest);
console.log('Built a self-contained Sites Worker with public app assets and owner-authorized Dev endpoints.');
