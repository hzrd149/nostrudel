import{az as j,fz as y,j as s,aE as k,bI as w,r as u,f0 as W,gA as R,hz as g,dU as l,V as I,F as h,H as v,l as A,b as L,v as V,E as _,hv as q,hw as D,aW as d}from"./index-C6wlVu-O.js";import{W as F}from"./wiki-page-result-Dc4rntwz.js";function H(){const i=j(),{value:t,setValue:m}=y("q");if(!t)return s.jsx(k,{to:"/wiki"});const{register:f,handleSubmit:S}=w({defaultValues:{search:t}}),p=S(e=>{m(e.search)}),[n,r]=u.useState([]);u.useEffect(()=>{r([]);const e={kinds:[q],search:t},o=new Set,c=a=>{D.handleEvent(a),!o.has(d(a))&&(r(E=>E.concat(a)),o.add(d(a)))},b=W([...R,...g],[e],{onevent:c,oneose:()=>b.close()});if(l){const a=l.subscribe([e],{onevent:c,oneose:()=>a.close()})}},[t,r]);const x=i?i.sortByDistanceAndConnections(n,e=>e.pubkey):n;return s.jsxs(I,{children:[s.jsxs(h,{gap:"2",wrap:"wrap",children:[s.jsx(v,{mr:"4",children:s.jsx(A,{as:L,to:"/wiki",children:"Wikifreedia"})}),s.jsxs(h,{gap:"2",as:"form",maxW:"md",onSubmit:p,w:"full",children:[s.jsx(V,{...f("search",{required:!0}),type:"search",name:"search",autoComplete:"on",w:"sm",placeholder:"Search Wikifreedia",isRequired:!0}),s.jsx(_,{type:"submit",colorScheme:"primary",children:"Search"})]})]}),x.map(e=>s.jsx(F,{page:e},e.id))]})}export{H as default};
//# sourceMappingURL=search-CwNv3dTc.js.map
