import{b9 as ee,ba as W,bb as U,j as s,bc as $,bd as pe,r as n,be as me,bf as he,bg as Ce,bh as Ee,bi as j,bj as H,bk as f,bl as ve,bm as xe,bn as Pe,b2 as ye,ae as ke,bo as we,bp as Se,bq as je,br as Y,e as Be,bs as Re,aH as Ie,aI as Fe,aJ as _e,aK as Te,f as Ne,aR as De,F as Ve,v as Ke,bt as Oe,aO as Le,aP as Me,aQ as Ae,y as He,z,bu as ze,bv as We,bw as Ue}from"./index-C6wlVu-O.js";import{u as $e}from"./use-relays-changed-DAaDxEth.js";var[qe,te]=ee({name:"EditableStylesContext",errorMessage:`useEditableStyles returned is 'undefined'. Seems you forgot to wrap the components in "<Editable />" `}),[Ge,q]=ee({name:"EditableContext",errorMessage:"useEditableContext: context is undefined. Seems you forgot to wrap the editable components in `<Editable />`"}),ne={fontSize:"inherit",fontWeight:"inherit",textAlign:"inherit",bg:"transparent"},se=W(function(l,o){const{getInputProps:u}=q(),r=te(),g=u(l,o),t=U("chakra-editable__input",l.className);return s.jsx($.input,{...g,__css:{outline:0,...ne,...r.input},className:t})});se.displayName="EditableInput";var ae=W(function(l,o){const{getPreviewProps:u}=q(),r=te(),g=u(l,o),t=U("chakra-editable__preview",l.className);return s.jsx($.span,{...g,__css:{cursor:"text",display:"inline-block",...ne,...r.preview},className:t})});ae.displayName="EditablePreview";function Z(c,l){return c?c===l||c.contains(l):!1}function Je(c={}){const{onChange:l,onCancel:o,onSubmit:u,onBlur:r,value:g,isDisabled:t,defaultValue:y,startWithEditView:B,isPreviewFocusable:k=!0,submitOnBlur:x=!0,selectAllOnFocus:C=!0,placeholder:m,onEdit:I,finalFocusRef:F,...K}=c,b=pe(I),oe=!!(B&&!t),[i,O]=n.useState(oe),[d,_]=me({defaultValue:y||"",value:g,onChange:l}),[w,G]=n.useState(d),E=n.useRef(null),ie=n.useRef(null),J=n.useRef(null),L=n.useRef(null),M=n.useRef(null);he({ref:E,enabled:i,elements:[L,M]});const T=!i&&!t;Ce(()=>{var e,a;i&&((e=E.current)==null||e.focus(),C&&((a=E.current)==null||a.select()))},[]),Ee(()=>{var e,a,v,p;if(!i){F?(e=F.current)==null||e.focus():(a=J.current)==null||a.focus();return}(v=E.current)==null||v.focus(),C&&((p=E.current)==null||p.select()),b==null||b()},[i,b,C]);const R=n.useCallback(()=>{T&&O(!0)},[T]),S=n.useCallback(()=>{G(d)},[d]),h=n.useCallback(()=>{O(!1),_(w),o==null||o(w),r==null||r(w)},[o,r,_,w]),P=n.useCallback(()=>{O(!1),G(d),u==null||u(d),r==null||r(w)},[d,u,r,w]);n.useEffect(()=>{if(i)return;const e=E.current;(e==null?void 0:e.ownerDocument.activeElement)===e&&(e==null||e.blur())},[i]);const N=n.useCallback(e=>{_(e.currentTarget.value)},[_]),Q=n.useCallback(e=>{const a=e.key,p={Escape:h,Enter:V=>{!V.shiftKey&&!V.metaKey&&P()}}[a];p&&(e.preventDefault(),p(e))},[h,P]),X=n.useCallback(e=>{const a=e.key,p={Escape:h}[a];p&&(e.preventDefault(),p(e))},[h]),A=d.length===0,D=n.useCallback(e=>{var a;if(!i)return;const v=e.currentTarget.ownerDocument,p=(a=e.relatedTarget)!=null?a:v.activeElement,V=Z(L.current,p),ge=Z(M.current,p);!V&&!ge&&(x?P():h())},[x,P,h,i]),ue=n.useCallback((e={},a=null)=>{const v=T&&k?0:void 0;return{...e,ref:j(a,ie),children:A?m:d,hidden:i,"aria-disabled":H(t),tabIndex:v,onFocus:f(e.onFocus,R,S)}},[t,i,T,k,A,R,S,m,d]),re=n.useCallback((e={},a=null)=>({...e,hidden:!i,placeholder:m,ref:j(a,E),disabled:t,"aria-disabled":H(t),value:d,onBlur:f(e.onBlur,D),onChange:f(e.onChange,N),onKeyDown:f(e.onKeyDown,Q),onFocus:f(e.onFocus,S)}),[t,i,D,N,Q,S,m,d]),ce=n.useCallback((e={},a=null)=>({...e,hidden:!i,placeholder:m,ref:j(a,E),disabled:t,"aria-disabled":H(t),value:d,onBlur:f(e.onBlur,D),onChange:f(e.onChange,N),onKeyDown:f(e.onKeyDown,X),onFocus:f(e.onFocus,S)}),[t,i,D,N,X,S,m,d]),de=n.useCallback((e={},a=null)=>({"aria-label":"Edit",...e,type:"button",onClick:f(e.onClick,R),ref:j(a,J),disabled:t}),[R,t]),be=n.useCallback((e={},a=null)=>({...e,"aria-label":"Submit",ref:j(M,a),type:"button",onClick:f(e.onClick,P),disabled:t}),[P,t]),fe=n.useCallback((e={},a=null)=>({"aria-label":"Cancel",id:"cancel",...e,ref:j(L,a),type:"button",onClick:f(e.onClick,h),disabled:t}),[h,t]);return{isEditing:i,isDisabled:t,isValueEmpty:A,value:d,onEdit:R,onCancel:h,onSubmit:P,getPreviewProps:ue,getInputProps:re,getTextareaProps:ce,getEditButtonProps:de,getSubmitButtonProps:be,getCancelButtonProps:fe,htmlProps:K}}var le=W(function(l,o){const u=ve("Editable",l),r=xe(l),{htmlProps:g,...t}=Je(r),{isEditing:y,onSubmit:B,onCancel:k,onEdit:x}=t,C=U("chakra-editable",l.className),m=Pe(l.children,{isEditing:y,onSubmit:B,onCancel:k,onEdit:x});return s.jsx(Ge,{value:t,children:s.jsx(qe,{value:u,children:s.jsx($.div,{ref:o,...g,className:C,children:m})})})});le.displayName="Editable";function Qe(){const{isEditing:c,getEditButtonProps:l,getCancelButtonProps:o,getSubmitButtonProps:u}=q();return{isEditing:c,getEditButtonProps:l,getCancelButtonProps:o,getSubmitButtonProps:u}}function Xe(){const{isEditing:c,getSubmitButtonProps:l,getCancelButtonProps:o,getEditButtonProps:u}=Qe();return c?s.jsxs(He,{justifyContent:"center",size:"md",children:[s.jsx(z,{icon:s.jsx(ze,{}),...l(),"aria-label":"Save"}),s.jsx(z,{icon:s.jsx(We,{}),...o(),"aria-label":"Cancel"})]}):s.jsx(z,{size:"md",icon:s.jsx(Ue,{}),...u(),"aria-label":"Edit"})}function Ye(){const c=ke(),l=we(),{hashtag:o}=Se(),[u,r]=n.useState(o);n.useEffect(()=>r(o),[o]),je("#"+o);const g=Y("show-replies",!0),t=Y("show-reposts",!0),y=Be().urls,{listId:B,filter:k}=Re(),x=Ie(),C=Fe(),m=n.useCallback(b=>C(b)||!g.isOpen&&_e(b)||!t.isOpen&&Te(b)?!1:x(b),[g.isOpen,t.isOpen,C,x]),{loader:I,timeline:F}=Ne(`${B??"global"}-${o}-hashtag`,y,{kinds:[1],"#t":[o],...k},{eventFilter:m});$e(y,()=>I.reset());const K=s.jsxs(Ve,{gap:"2",alignItems:"center",wrap:"wrap",children:[s.jsxs(le,{value:u,onChange:b=>r(b),fontSize:"3xl",fontWeight:"bold",display:"flex",gap:"2",alignItems:"center",selectAllOnFocus:!0,onSubmit:b=>c("/t/"+String(b).toLowerCase()+l.search),flexShrink:0,children:[s.jsxs("div",{children:["#",s.jsx(ae,{p:0})]}),s.jsx(Ke,{as:se,maxW:"md"}),s.jsx(Xe,{})]}),s.jsx(Oe,{}),s.jsx(Le,{showReplies:g,showReposts:t}),s.jsx(Me,{}),s.jsx(Ae,{})]});return s.jsx(De,{loader:I,timeline:F,header:K,pt:"2",pb:"12",px:"2"})}function nt(){return s.jsx(ye,{initList:"global",children:s.jsx(Ye,{})})}export{nt as default};
//# sourceMappingURL=index-DnBXvAxU.js.map
