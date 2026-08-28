(function(cfg,fs,B){
var old=global.__PipCoSophiaService;if(old&&old.version==="v3.51nolog"){if(old.setCompanion)old.setCompanion(cfg.companion||"YES_MAN");if(old.setEnabled)old.setEnabled(cfg.enabled?1:0);else old.enabled=cfg.enabled?1:0;return old;}if(old&&old.destroy)try{old.destroy();}catch(e){}
function normCompanion(v){v=String(v||"").toUpperCase();if(v==="FISTO")return"FISTO";if(v==="KL-E-O"||v==="KLEO")return"KL-E-O";if(v==="MK_II_STEALTH_SUIT"||v==="MK II STEALTH SUIT")return"MK_II_STEALTH_SUIT";if(v==="ANDY"||v==="ANDY (MISTER HANDY)"||v==="ANDY - MISTER HANDY")return"ANDY";return"YES_MAN";}var H=new Uint8Array(4),S={version:"v3.51nolog",companion:normCompanion(cfg.companion),enabled:cfg.enabled?1:0,timer:undefined,prepTimer:undefined,failUntil:0,modePending:"",lastNV:-1,seqKey:0,seqCount:0,seqLast:0,seqDue:0,seqMask:0,statusOn:0,statusPos:0,statusInput:0,statusAttachTimer:undefined,navM:-99,navX:-99,prep:0};
function gc(){try{process.memory(true);E.defrag();}catch(e){try{E.defrag();}catch(q){}}}
function rnd(a,b){return a+Math.floor(Math.random()*(b-a+1));}
function setTimer(fn,ms){if(S.timer){clearTimeout(S.timer);S.timer=undefined;}S.timer=setTimeout(function(){S.timer=undefined;fn();},ms);}
function setPrepTimer(fn,ms){if(S.prepTimer){clearTimeout(S.prepTimer);S.prepTimer=undefined;}S.prepTimer=setTimeout(function(){S.prepTimer=undefined;fn();},ms);}
function abortPrep(why){var p=S.prep;if(S.prepTimer){clearTimeout(S.prepTimer);S.prepTimer=undefined;}if(p){try{if(p.src&&p.src.close)p.src.close();}catch(e){}try{if(p.out&&p.out.close)p.out.close();}catch(e){}p.src=p.out=undefined;S.prep=0;}return p?1:0;}
function prepStale(){return S.prep&&S.prep.prepAt&&getTime()-S.prep.prepAt>15;}
function arm(d,why){if(d<1)d=1;if(S.prep)return;setTimer(wake,d*1000);}
function radioScreen(){var id="";try{id=Pip.CURRENT&&Pip.CURRENT.id?String(Pip.CURRENT.id).toUpperCase():"";}catch(e){}return id==="RADIO"||id==="FM"||id.indexOf("RADIO")>=0||id.indexOf("FM_RADIO")>=0;}
function mapScreen(){var id="";try{id=Pip.CURRENT&&Pip.CURRENT.id?String(Pip.CURRENT.id).toUpperCase():"";}catch(e){}return (Pip.MODE|0)===2&&((Pip.MENUX|0)===1||id.indexOf("MAP")>=0);}
function settingsScreen(){return (Pip.MODE|0)===2&&(Pip.MENUX|0)===0;}
function busy(){var q;try{if(Pip.radioOn||global.__PipRadioActive)return 1;if(Pip.audioIsPlaying&&Pip.audioIsPlaying())return 1;if(Pip.streamPlaying){q=Pip.streamPlaying();if(q==="audio"||q==="both"||q==="video")return 1;}if(Pip.videoIsPlaying&&Pip.videoIsPlaying())return 1;if(Pip.videoPlaying)return 1;}catch(e){}return 0;}
function own(){try{var id=Pip.CURRENT&&Pip.CURRENT.id?String(Pip.CURRENT.id).toUpperCase():"";return id==="SOPHIA"||id==="TALKINGCOMPANIONS"||id==="YESMANCOMPANION";}catch(e){return 0;}}
function u32(s,p){return(s.charCodeAt(p)&255)+((s.charCodeAt(p+1)&255)<<8)+((s.charCodeAt(p+2)&255)<<16)+((s.charCodeAt(p+3)&255)*16777216);}
function l16(n){return String.fromCharCode(n&255,(n>>8)&255);}function l32(n){return String.fromCharCode(n&255,(n>>8)&255,(n>>16)&255,Math.floor(n/16777216)&255);}function wav(n){return"RIFF"+l32(n+36)+"WAVEfmt "+l32(16)+l16(1)+l16(1)+l32(16000)+l32(32000)+l16(2)+l16(16)+"data"+l32(n);}
function fail(st,e){S.failUntil=getTime()+30;abortPrep(st);gc();arm(30,"backoff");}
function pick(a,n){var i,x,total=0;for(i=0;i<n;i++)if(a+i!==H[0]&&a+i!==H[1]&&a+i!==H[2]&&a+i!==H[3])total++;if(!total)return a+Math.floor(Math.random()*n);x=Math.floor(Math.random()*total);for(i=0;i<n;i++)if(a+i!==H[0]&&a+i!==H[1]&&a+i!==H[2]&&a+i!==H[3]){if(x--===0)return a+i;}return a;}
function startPrepared(p){var ci="",tk=0,wait=0;if(!S.enabled){S.prep=0;arm(2,"disabled_prep");return;}if(own()||radioScreen()||mapScreen()||busy()){S.prep=0;arm(4,"blocked_after_prep");return;}if(p.expectTab){try{ci=Pip.CURRENT&&Pip.CURRENT.id?String(Pip.CURRENT.id):"";tk=tabKey("",ci);if(tk!==p.expectTab){S.prep=0;arm(1,"tab_stale");return;}}catch(e){}}
if(p.notBefore){
wait=p.notBefore-getTime();
if(wait>0){
S.prep=p;
setPrepTimer(function(){if(S.prep===p)startPrepared(p);},Math.ceil(wait*1000));
return;
}
}
try{Pip.audioStart(B+"SOPHIA_PLAY.WAV");S.failUntil=0;H[3]=H[2];H[2]=H[1];H[1]=H[0];H[0]=p.line;S.prep=0;gc();if(p.kind==="MODE"){
arm(4,"mode_done_watch");
}else if(p.kind==="TAB"){
S.seqCount++;
if(S.seqKey&&S.seqCount<tabPool(S.seqKey)[1]){
var md=rnd(1,30);
S.seqDue=getTime()+md;
if(S.seqKey>=10&&S.seqKey<=13)arm(1,"status_poll_wait");
else arm(md,"menu_followup");
}else{
S.seqDue=0;
if(S.seqKey>=10&&S.seqKey<=13)arm(1,"status_watch_done");
else arm(4,"menu_sequence_done");
}
}else{
arm(4,"idle_watch");
}}catch(e){S.prep=0;fail("AUDIO_FAIL",e);}}
function prepare(line,kind,expectTab,notBefore){var ix,ib,off,len,src,out,p,left;try{if(S.prep)return 0;ix=E.openFile(B+S.companion+"_VOICE.IDX","r");if(!ix)throw"idx open";ix.seek((line-1)*8);ib=ix.read(8);if(ix.close)ix.close();ix=undefined;if(!ib||ib.length<8)throw"idx read";off=u32(ib,0);len=u32(ib,4);src=E.openFile(B+S.companion+"_VOICE.BIN","r");out=E.openFile(B+"SOPHIA_PLAY.WAV","w");if(!src||!out)throw"bank/play open";src.seek(off);out.write(wav(len));p={line:line,kind:kind,expectTab:expectTab||0,notBefore:notBefore||0,prepAt:getTime(),src:src,out:out,left:len};S.prep=p;function step(){var r,ch;if(!S.prep||S.prep!==p)return;try{if(p.left<=0){if(p.src&&p.src.close)p.src.close();if(p.out&&p.out.close)p.out.close();p.src=p.out=undefined;if(S.prepTimer){clearTimeout(S.prepTimer);S.prepTimer=undefined;}startPrepared(p);return;}r=p.left>2048?2048:p.left;ch=p.src.read(r);if(!ch||!ch.length)throw"short read "+p.left;p.out.write(ch);p.left-=ch.length;ch=undefined;setPrepTimer(step,8);}catch(e){try{if(p.src&&p.src.close)p.src.close();}catch(q){}try{if(p.out&&p.out.close)p.out.close();}catch(q){}p.src=p.out=undefined;S.prep=0;fail("EXTRACT_FAIL",e);}}setPrepTimer(step,1);return 1;}catch(e){try{if(ix&&ix.close)ix.close();}catch(q){}try{if(src&&src.close)src.close();}catch(q){}try{if(out&&out.close)out.close();}catch(q){}S.prep=0;fail("EXTRACT_FAIL",e);return 0;}}
function statusIdx(){
var p=0;
try{p=Pip.statusIdx|0;}catch(e){p=S.statusPos|0;}
if(p<0)p=0;if(p>4)p=4;
S.statusPos=p;
return p;
}
function statusKey(txt,id){
var p=statusIdx();
if(p===0)return 10;
if(p===1)return -1;
if(p===2)return 11;
if(p===3)return 12;
if(p===4)return 13;
return 10;
}
function isStatusNav(){
var id="";
try{id=Pip.CURRENT&&Pip.CURRENT.id?String(Pip.CURRENT.id).toUpperCase():"";}catch(e){}
return (Pip.MODE|0)===0&&(Pip.MENUX|0)===0&&id==="STATUS";
}
function statusDetach(){
if(S.statusAttachTimer){clearTimeout(S.statusAttachTimer);S.statusAttachTimer=undefined;}
try{Pip.removeListener("knob1",statusKnob);}catch(e){}
if(S.statusInput)
S.statusInput=0;S.statusOn=0;
}
function statusSync(reason){
var old=S.statusPos|0,n,k;
if(!S.statusOn||!isStatusNav())return;
n=statusIdx();k=statusKey("","");
if(n===old&&k===S.seqKey&&reason!=="attach")return;
S.seqKey=0;S.seqCount=0;S.seqLast=0;S.seqDue=0;S.seqMask=0;
if(S.prep)abortPrep("status_change");
setTimer(wake,80);
}
function statusKnob(d){
if(!d||!S.statusOn)return;
try{if(!isStatusNav())return;}catch(e){return;}
setTimer(function(){statusSync("knob");},5);
}
function statusAttachNow(){
S.statusAttachTimer=undefined;
if(!S.enabled||!isStatusNav())return;
try{Pip.removeListener("knob1",statusKnob);}catch(e){}
try{
Pip.on("knob1",statusKnob);
S.statusInput=1;S.statusOn=1;
S.statusPos=statusIdx();
statusSync("attach");
}catch(e){
S.statusInput=0;
}
}
function statusAttach(){
if(!isStatusNav())return;
S.statusOn=1;S.statusPos=statusIdx();
if(S.statusInput||S.statusAttachTimer)return;
S.statusAttachTimer=setTimeout(statusAttachNow,90);
}
function tabKey(txt,id){
var m=Pip.MODE|0,x=Pip.MENUX|0,u=String(id||"").toUpperCase();
if(m===1){
if(x===0)return 1;if(x===1)return 2;if(x===2)return 3;if(x===3)return 4;if(x===4)return 5;
return 0;
}
if(m===0){
if(x===0)return statusKey(txt,id);
if(x===1)return 6;if(x===2)return 7;if(x===3)return 8;if(x===4)return 9;
return 0;
}
if(m===2){
if(x===2)return 14; // Quests
if(x===3)return 15; // Notes
return 0;           // Settings/Map/other DATA pages are silent here
}
if(u.indexOf("WEAPON")>=0)return 1;
if(u.indexOf("APPAREL")>=0||u.indexOf("ARMOR")>=0)return 2;
if(u.indexOf("AID")>=0)return 3;
if(u.indexOf("MISC")>=0)return 4;
if(u.indexOf("AMMO")>=0)return 5;
if(u.indexOf("SPECIAL")>=0)return 6;
if(u.indexOf("SKILL")>=0)return 7;
if(u.indexOf("PERK")>=0)return 8;
if(u.indexOf("GENERAL")>=0)return 9;
if(u.indexOf("QUEST")>=0)return 14;
if(u.indexOf("NOTE")>=0)return 15;
return 0;
}
function tabPool(k){
if(k===1)return[1,3];if(k===2)return[4,3];if(k===3)return[7,3];if(k===4)return[10,3];if(k===5)return[13,3];
if(k===6)return[16,3];if(k===7)return[19,3];if(k===8)return[22,3];if(k===9)return[25,3];
if(k===10)return[28,3];if(k===11)return[31,3];if(k===12)return[34,3];if(k===13)return[37,3];
if(k===14)return[40,3];if(k===15)return[43,2];
return[0,0];
}
function seqLine(k){
var p=tabPool(k),i=0,n=0,x=0,full=0;
if(!p[0]||!p[1])return 0;
full=(1<<p[1])-1;if((S.seqMask&full)===full)return 0;
for(i=0;i<p[1];i++)if(!(S.seqMask&(1<<i)))n++;
x=Math.floor(Math.random()*n);
for(i=0;i<p[1];i++)if(!(S.seqMask&(1<<i))){if(x--===0){S.seqMask|=(1<<i);S.seqLast=p[0]+i;return S.seqLast;}}
return 0;
}
function nvMode(){try{return typeof NV!=="undefined"?(NV?1:0):(global.NV!==undefined?(global.NV?1:0):-1);}catch(e){return -1;}}
function talk(){var id="",k=0,tl=0,line=0,g="",isSet=0,isBusy=0;if(!S.enabled)return;if(S.prep){if(prepStale())abortPrep("talk_stale");else return;}if(isStatusNav())statusAttach();else statusDetach();if(Pip.sleeping){arm(8,"sleep");return;}if(own()){arm(5,"own_app");return;}if(radioScreen()||mapScreen()){arm(4,"silent_screen");return;}isSet=settingsScreen();isBusy=busy();
if(isSet){
S.seqKey=0;S.seqCount=0;S.seqLast=0;S.seqDue=0;S.seqMask=0;
var nv=nvMode();
if(nv>=0){
if(S.lastNV<0){
S.lastNV=nv;
}else if(nv!==S.lastNV){
S.lastNV=nv;S.seqKey=0;S.seqCount=0;S.seqLast=0;S.seqDue=0;S.seqMask=0;
S.modePending=nv?"FNV":"FO3";
}
}
if(S.modePending){
if(isBusy){arm(1,"mode_wait_music");return;}
g=S.modePending;S.modePending="";
line=g==="FNV"?pick(45,4):pick(49,3);
prepare(line,"MODE",0,0);return;
}
arm(1,"settings_mode_watch");return;
}
if(isBusy){arm(4,"audio_busy");return;}
if(getTime()<S.failUntil){arm(Math.max(1,Math.ceil(S.failUntil-getTime())),"backoff");return;}gc();try{id=Pip.CURRENT&&Pip.CURRENT.id?String(Pip.CURRENT.id):"";}catch(e){}
k=tabKey("",id);
if(k<0){
if(S.seqKey!==-1){}
S.seqKey=-1;S.seqCount=0;S.seqLast=0;S.seqDue=0;S.seqMask=0;
arm(1,"status_rad_watch");return;
}
if(k!==S.seqKey){
S.seqKey=k;S.seqCount=0;S.seqLast=0;S.seqDue=0;
if(k){
tl=seqLine(k);
if(tl){
prepare(tl,"TAB",k,getTime()+3);return;
}
}
}
if(k&&S.seqKey===k&&S.seqCount<tabPool(k)[1]){
if(S.seqDue&&getTime()<S.seqDue){
if(k>=10&&k<=13)arm(1,"status_poll_wait");
else arm(Math.max(1,Math.ceil(S.seqDue-getTime())),"menu_wait");
return;
}
S.seqDue=0;
tl=seqLine(k);
if(tl){
prepare(tl,"TAB",k,0);return;
}
}
if(k&&S.seqCount>=tabPool(k)[1]){
if(k>=10&&k<=13)arm(1,"status_watch_done");
else arm(4,"menu_sequence_done");
return;
}
arm(4,"idle_watch");}
function wake(){if(S.enabled)talk();}
S.setCompanion=function(v){v=normCompanion(v);if(v===S.companion)return;if(S.timer){clearTimeout(S.timer);S.timer=undefined;}abortPrep("companion_switch");S.companion=v;H[0]=H[1]=H[2]=H[3]=0;S.modePending="";S.seqKey=0;S.seqCount=0;S.seqLast=0;S.seqDue=0;S.seqMask=0;S.navM=-99;S.navX=-99;S.lastNV=nvMode();if(S.enabled)setTimer(wake,350);};S.getCompanion=function(){return S.companion;};S.setEnabled=function(v){
v=v?1:0;
if(!v){
statusDetach();
if(S.timer){clearTimeout(S.timer);S.timer=undefined;}
abortPrep("park");
S.enabled=0;S.modePending="";S.seqKey=0;S.seqCount=0;S.seqLast=0;S.seqDue=0;S.seqMask=0;
return;
}
if(S.enabled){return;}
S.enabled=1;S.failUntil=0;S.modePending="";S.seqKey=0;S.seqCount=0;S.seqLast=0;S.seqDue=0;S.seqMask=0;
S.statusOn=0;S.statusPos=0;S.statusInput=0;S.navM=-99;S.navX=-99;S.lastNV=nvMode();

setTimer(wake,350);
};
S.destroy=function(){statusDetach();if(S.timer){clearTimeout(S.timer);S.timer=undefined;}abortPrep("destroy");try{Pip.removeListener("mode",navWake);}catch(e){}try{Pip.removeListener("menuX",navWake);}catch(e){}S.enabled=0;if(global.__PipCoSophiaService===S)delete global.__PipCoSophiaService;gc();};
S.statusDetach=statusDetach;S.kick=function(){if(!S.enabled)return;S.seqKey=0;S.seqCount=0;S.seqLast=0;S.seqDue=0;S.seqMask=0;S.navM=-99;S.navX=-99;if(prepStale())abortPrep("kick_stale");setTimer(wake,350);};
global.__PipCoSophiaService=S;
function navWake(){
var m=Pip.MODE|0,x=Pip.MENUX|0;
if(!S.enabled)return;
if(!(m===0&&x===0))statusDetach();
if(m===S.navM&&x===S.navX){return;}
S.navM=m;S.navX=x;
if(m===0&&x===0&&isStatusNav()){S.statusOn=1;S.statusPos=0;statusAttach();}
S.seqKey=0;S.seqCount=0;S.seqLast=0;S.seqDue=0;S.seqMask=0;
if(S.prep)abortPrep("nav_change");
setTimer(wake,80);
}
try{Pip.removeListener("mode",navWake);}catch(e){}
try{Pip.removeListener("menuX",navWake);}catch(e){}
try{Pip.on("mode",navWake);}catch(e){}
try{Pip.on("menuX",navWake);}catch(e){}
S.navM=Pip.MODE|0;S.navX=Pip.MENUX|0;S.lastNV=nvMode();arm(2,"start");return S;
})
