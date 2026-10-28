import {put,list} from '@vercel/blob';
import {timingSafeEqual} from 'node:crypto';
const same=(a,b)=>{a=Buffer.from(String(a||''));b=Buffer.from(String(b||''));return a.length===b.length&&timingSafeEqual(a,b)};
export default async function handler(req,res){
  try{
    if(req.method==='GET'){
      const {blobs}=await list({prefix:'content.json'});
      res.setHeader('Cache-Control','no-store');
      if(!blobs.length)return res.status(200).json(null);
      const r=await fetch(blobs[0].url+'?t='+Date.now());
      return res.status(200).json(await r.json());
    }
    if(req.method!=='POST')return res.status(405).end();
    if(!process.env.ADMIN_PASSWORD||!same(req.headers['x-pw'],process.env.ADMIN_PASSWORD))return res.status(401).json({error:'senha'});
    const a=req.query.a;
    if(a==='check')return res.json({ok:true});
    if(a==='save'){
      const d=req.body;
      if(!d||typeof d!=='object'||!d.nome)return res.status(400).json({error:'dados'});
      await put('content.json',JSON.stringify(d),{access:'public',addRandomSuffix:false,allowOverwrite:true,contentType:'application/json'});
      return res.json({ok:true});
    }
    if(a==='upload'){
      const m=/^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(String(req.body||''));
      if(!m)return res.status(400).json({error:'imagem'});
      const b=Buffer.from(m[2],'base64');
      if(b.length>3e6)return res.status(413).json({error:'grande'});
      const x=await put('img/'+Date.now()+'.'+(m[1]==='jpeg'?'jpg':m[1]),b,{access:'public',contentType:'image/'+m[1]});
      return res.json({url:x.url});
    }
    res.status(400).end();
  }catch(e){res.status(500).json({error:'erro'})}
}
