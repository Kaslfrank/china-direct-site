import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const expected=JSON.parse(read('data/homepage-projects.json'));
const errors=[];
const assert=(ok,message)=>{if(!ok)errors.push(message);};
const section=read('en/index.html').match(/<section class="projects" id="projects">[\s\S]*?<\/section>/)?.[0]||'';
const cards=[...section.matchAll(/<article\b[\s\S]*?<\/article>/g)].map(m=>m[0]);
const actual=cards.map(c=>c.match(/href="(\/en\/projects\/[^"#?]+\/)"/)?.[1]?.replace('/en/','/'));
assert(JSON.stringify(actual)===JSON.stringify(expected),'English homepage project list/order must match the shared manifest.');
assert(!/data-project=|data-open-project=/.test(section),'English homepage still contains legacy project cards.');
assert(!read('en/index.html').includes('id="project-gallery"'),'Unused legacy gallery remains on English homepage.');
const gallery=s=>[...s.matchAll(/data-lightbox-src="([^"]+)"/g)].map(m=>m[1].replace(/^(?:\.\.\/)+/,'/'));
for(const url of expected){
 const enUrl='/en'+url, ruFile=url.slice(1)+'index.html', enFile=enUrl.slice(1)+'index.html';
 if(!fs.existsSync(path.join(root,enFile))){errors.push('Missing English project page: '+enUrl);continue;}
 const ru=read(ruFile),en=read(enFile);
 assert(JSON.stringify(gallery(ru))===JSON.stringify(gallery(en)),'Gallery differs between languages: '+url);
 assert(gallery(en).length>0,'Empty gallery: '+enUrl);
 assert(/<html lang="en">/.test(en),'Incorrect page language: '+enUrl);
 assert((en.match(/<h1\b/g)||[]).length===1,'Expected one H1: '+enUrl);
 const main=en.match(/<main\b[\s\S]*?<\/main>/)?.[0]||'';
 assert(!/[А-Яа-яЁё]/.test(main),'Untranslated project content or alt text: '+enUrl);
 assert(en.includes('rel="canonical" href="https://www.chinadirect.pro'+enUrl+'"'),'Incorrect canonical: '+enUrl);
 assert(ru.includes('hreflang="en" href="https://www.chinadirect.pro'+enUrl+'"'),'Missing reciprocal English alternate: '+url);
 assert(en.includes('hreflang="ru" href="https://www.chinadirect.pro'+url+'"'),'Missing reciprocal Russian alternate: '+enUrl);
 assert(read('sitemap.xml').includes('<loc>https://www.chinadirect.pro'+enUrl+'</loc>'),'English project absent from sitemap: '+enUrl);
 for(const m of en.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){try{JSON.parse(m[1]);}catch{errors.push('Invalid JSON-LD: '+enUrl);}}
 for(const m of en.matchAll(/(?:src|href|data-lightbox-src)="([^"]+)"/g)){
  const ref=m[1];if(/^(https?:|mailto:|#)/.test(ref))continue;
  const local=ref.split('#')[0].split('?')[0];if(!local)continue;
  let resolved=local.startsWith('/')?path.join(root,local.slice(1)):path.resolve(root,path.dirname(enFile),local);
  if(local.endsWith('/'))resolved=path.join(resolved,'index.html');
  assert(fs.existsSync(resolved),'Missing local asset/link in '+enUrl+': '+ref);
 }
}
for(const card of cards){const src=card.match(/<img\b[^>]*src="([^"]+)"/)?.[1];assert(!!src&&fs.existsSync(path.resolve(root,'en',src.startsWith('/')?'..'+src:src)),'Missing English card image: '+src);}
if(errors.length){console.error(errors.map(e=>'- '+e).join('\n'));process.exit(1);}
console.log('Project translations validated: '+expected.length+' bilingual pages, matching galleries and homepage order.');
