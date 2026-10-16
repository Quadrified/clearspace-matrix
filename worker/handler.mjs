// Identity headers are supplied by ChatGPT Sites, never by application login code.
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','vary':'Cookie','x-content-type-options':'nosniff'}});
export function isOwner(request,env){const id=request.headers.get('oai-authenticated-user-id'),email=request.headers.get('oai-authenticated-user-email');return Boolean(id&&email&&env.DEV_OWNER_EMAIL&&email.trim().toLowerCase()===env.DEV_OWNER_EMAIL.trim().toLowerCase())}
export function createSamples(today){
 const base=new Date(today+'T12:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(today)||Number.isNaN(base.getTime())||base.toISOString().slice(0,10)!==today)throw new Error('Invalid date');
 const date=days=>{const d=new Date(base);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)};
 const projects=[{id:'dev-project-launch',name:'Dev · Client launch'},{id:'dev-project-learning',name:'Dev · Learning'},{id:'dev-project-life',name:'Dev · Personal'}];
 const groups={
 do:[['Send the launch proposal before the deadline','Work',0,0],['Fix the sign-in issue reported by the client','Work',0,-1],['Pay the electricity bill','Personal',2,0],['Review the release checklist with the team','Work',0,1],['Confirm tomorrow’s appointment','Health',2,1],['Prepare answers for this afternoon’s project review','Work',0,0]],
 schedule:[['Plan next week’s priorities','Work',0,3],['Study system design for 30 minutes','Learning',1,4],['Book a workout for the weekend','Health',2,5],['Outline a small portfolio project','Learning',1,7],['Read the documentation for the new API','Learning',1,6],['Write a thoughtful plan for the next release and list the risks, dependencies, and follow-up work','Work',0,8]],
 delegate:[['Ask a teammate to format the meeting notes','Work',0,0],['Request an updated delivery estimate','Work',0,1],['Ask for the latest design export','Work',0,0],['Hand off the weekly report formatting','Work',0,2],['Ask someone to book the team meeting room','Work',0,1],['Request a second review of the test checklist','Work',0,0]],
 eliminate:[['Skip another unplanned social media scroll','Personal',2,null],['Archive newsletters I never read','Personal',2,null],['Stop checking the same dashboard every five minutes','Work',0,null],['Remove an unused reminder','Personal',2,null],['Skip polishing a document that nobody needs','Work',0,null],['Close the extra browser tabs','Personal',2,null]]};
 const tasks=[];for(const [q,items] of Object.entries(groups))items.forEach(([title,category,p,days],i)=>tasks.push({id:'dev-task-'+crypto.randomUUID(),title,q,category,projectId:projects[p].id,done:i===5&&q!=='do',notes:i%2===0?'Dev sample task. Safe to edit or remove.\nTry moving this card, changing its date, or using the project filter.':'',owner:'',due:days===null?'':date(days),created:Date.now()+tasks.length,isDevSample:true}));return {projects,tasks};
}
export function createHandler(page,favicon){return {async fetch(request,env={}){
 const url=new URL(request.url),path=url.pathname,owner=isOwner(request,env);
 if(path==='/api/dev/status')return request.method==='GET'?json({authorized:owner}):json({error:'Method not allowed'},405);
 if(path==='/api/dev/tasks'){
  if(!owner)return json({error:'Owner access required'},403);
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  if(request.headers.get('origin')!==url.origin||!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'Same-origin JSON request required'},403);
  try{const data=await request.json();return json(createSamples(data.today))}catch{return json({error:'Provide a valid local date'},400)}
 }
 if(path==='/dev'||path==='/dev/'){
  if(!request.headers.get('oai-authenticated-user-id')||!request.headers.get('oai-authenticated-user-email'))return new Response(null,{status:302,headers:{location:'/signin-with-chatgpt?return_to=%2Fdev','cache-control':'no-store'}});
  if(!owner)return new Response('Dev controls are only available to the site owner.',{status:403,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}});
 }
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
 if(path==='/favicon.svg')return new Response(request.method==='HEAD'?null:favicon,{headers:{'content-type':'image/svg+xml','cache-control':'public, max-age=86400'}});
 if(path==='/'||path==='/index.html'||path==='/dev'||path==='/dev/')return new Response(request.method==='HEAD'?null:page,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
 return new Response('Not found',{status:404});
}}}
