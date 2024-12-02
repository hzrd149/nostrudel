import{aA as j,dT as f,r as u,af as y,s as w,dX as k,dZ as S,aw as C,j as e,F as o,aM as I,H as m,T as R,aB as p,v as x,z as v,dV as F,w as z,B as T,Q as B,aC as E,E as b,a2 as A,a3 as P,a6 as W,bI as q,p as N,av as Q,k as U,t as L,cn as M,co as H,dz as O,dW as V}from"./index-C6wlVu-O.js";import{w as n}from"./webrtc-relays-BQTG2acl.js";function _(){const t=W(),{register:i,handleSubmit:c,formState:l,reset:a}=q({defaultValues:{name:""},mode:"all"}),{value:d}=N(async()=>n.broker.signer.getPublicKey()),s=Q(d);u.useEffect(()=>{s!=null&&s.name&&a({name:s.name},{keepDirty:!1,keepTouched:!1})},[s==null?void 0:s.name]);const r=c(async h=>{const g=await n.broker.signer.signEvent({kind:U.Metadata,created_at:L().unix(),tags:[],content:JSON.stringify({name:h.name})});await t("Set WebRTC name",g)});return e.jsx(o,{direction:"column",gap:"2",as:"form",onSubmit:r,children:e.jsxs(M,{isRequired:!0,children:[e.jsx(H,{children:"Local relay name"}),e.jsxs(o,{gap:"2",children:[e.jsx(x,{...i("name",{required:!0}),isRequired:!0,autoComplete:"off"}),e.jsx(b,{type:"submit",isLoading:l.isSubmitting,children:"Set"})]}),e.jsx(O,{children:"The name that will be shown to other peers"})]})})}function J(){const t=j();f(t,1e3),u.useEffect(()=>(n.broker.on("call",t),()=>{n.broker.off("call",t)}),[t]);const i=y(),c=w(),l=k(V.webRtcLocalIdentity),a=u.useMemo(()=>S(l),[l]),s="webrtc+nostr:"+u.useMemo(()=>C.npubEncode(a),[a]);return e.jsxs(o,{gap:"2",direction:"column",overflow:"auto hidden",flex:1,px:{base:"2",lg:0},children:[e.jsxs(o,{gap:"2",alignItems:"center",wrap:"wrap",children:[e.jsx(I,{hideFrom:"lg",size:"sm"}),e.jsx(m,{size:"lg",children:"Pair with WebRTC relay"})]}),e.jsx(R,{fontStyle:"italic",mt:"-2",children:"Share this URI with other users to allow them to connect to your local relay"}),e.jsxs(o,{gap:"2",alignItems:"center",children:[e.jsx(p,{pubkey:a,size:"sm"}),e.jsx(x,{readOnly:!0,userSelect:"all",value:s}),e.jsx(v,{icon:e.jsx(F,{boxSize:"1.5em"}),"aria-label":"Show QR Code",onClick:c.onToggle}),e.jsx(z,{value:s,"aria-label":"Copy Npub"})]}),c.isOpen&&e.jsx(T,{w:"full",maxW:"sm",mx:"auto",children:e.jsx(B,{content:s})}),a!==(i==null?void 0:i.pubkey)&&e.jsx(_,{}),e.jsx(m,{size:"md",mt:"4",children:"Connection Requests:"}),n.pendingIncoming.length>0?e.jsx(e.Fragment,{children:n.pendingIncoming.map(r=>e.jsxs(o,{borderWidth:"1px",rounded:"md",p:"2",alignItems:"center",gap:"2",children:[e.jsx(p,{pubkey:r.pubkey,size:"sm"}),e.jsx(E,{pubkey:r.pubkey}),e.jsx(b,{size:"sm",ml:"auto",colorScheme:"green",onClick:()=>{n.acceptCall(r),t()},children:"Accept"})]},r.id))}):e.jsxs(A,{status:"info",children:[e.jsx(P,{}),"No connections requests"]})]})}export{J as default};
//# sourceMappingURL=pair-DsOC6VPI.js.map
